import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { PrismaService } from '../../../core/database/prisma.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

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

    this.logger.debug(
      `Token extracted: ${token ? token.substring(0, 20) + '...' : 'null'}`,
    );

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify token directly with Clerk
      const secretKey = this.configService.get<string>('clerk.secretKey');

      if (!secretKey) {
        this.logger.error('CLERK_SECRET_KEY not configured');
        throw new UnauthorizedException('Authentication not configured');
      }

      this.logger.debug('Verifying Clerk token...');
      const verifiedToken = await verifyToken(token, {
        secretKey,
      });

      this.logger.debug(
        `Token verification result: ${JSON.stringify({
          exists: !!verifiedToken,
          type: typeof verifiedToken,
          hasPayload: !!verifiedToken?.payload,
          keys: verifiedToken ? Object.keys(verifiedToken) : [],
        })}`,
      );

      if (!verifiedToken) {
        this.logger.warn('Token verification returned null/undefined');
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Check if verifiedToken itself IS the payload (some versions return payload directly)
      const payload: any = verifiedToken.payload || verifiedToken;

      if (!payload || !payload.sub) {
        this.logger.warn(
          `No valid payload found. Payload keys: ${payload ? Object.keys(payload).join(', ') : 'null'}`,
        );
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Extract clerkId (subject) from token claims
      const clerkId = payload.sub;
      const sessionId = payload.sid;

      this.logger.debug(`Clerk user ID: ${clerkId}, Session ID: ${sessionId}`);

      if (!clerkId) {
        throw new UnauthorizedException('No user ID in token');
      }

      // Find or create user
      let dbUser = await this.prisma.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
          isActive: true,
        },
      });

      this.logger.debug(`Database user found: ${!!dbUser}`);

      if (!dbUser) {
        // Auto-create user on first request using token info
        this.logger.log(`Creating new user from Clerk: ${clerkId}`);
        dbUser = await this.createUserFromClerk(clerkId, payload);
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
        sessionId,
      };

      this.logger.log(`User authenticated: ${dbUser.email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Authentication error: ${error instanceof Error ? error.message : error}`,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private async createUserFromClerk(clerkId: string, tokenPayload: any) {
    // Extract user info from token payload (no API call needed)
    // Clerk tokens contain: sub, sid, email, firstName, lastName if configured
    const email = tokenPayload.email || tokenPayload.email_address || '';
    const firstName =
      tokenPayload.first_name || tokenPayload.given_name || null;
    const lastName = tokenPayload.last_name || tokenPayload.family_name || null;

    // Create user in database with token info
    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        // onboardingStatus defaults to NAME in schema
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        isActive: true,
      },
    });

    return user;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
