import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../../../core/database/prisma.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerkClient;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get<string>('clerk.secretKey'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const { isAuthenticated, toAuth } =
        await this.clerkClient.authenticateRequest(request, {
          jwtKey: this.configService.get<string>('clerk.jwtKey'),
        });

      if (!isAuthenticated) {
        throw new UnauthorizedException('Invalid authentication token');
      }

      const auth = toAuth();
      const clerkId = auth.userId;

      // Map Clerk ID to internal UUID
      const dbUser = await this.prisma.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
          isActive: true,
        },
      });

      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      if (!dbUser.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Attach user info to request with internal UUID
      request.user = {
        id: dbUser.id,
        clerkId,
        email: dbUser.email,
        role: dbUser.role,
        organizationId: dbUser.organizationId,
        sessionId: auth.sessionId,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
