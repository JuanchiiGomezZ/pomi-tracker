import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly clerkClient;
  private readonly clerkSecretKey: string;
  private readonly clerkJwtKey: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.clerkSecretKey =
      this.configService.get<string>('clerk.secretKey') || '';
    this.clerkJwtKey = this.configService.get<string>('clerk.jwtKey');
    this.clerkClient = createClerkClient({
      secretKey: this.clerkSecretKey,
    });
  }

  /**
   * Verify Clerk token and exchange for internal JWT tokens
   * This is called after Clerk authentication on the frontend
   */
  async verifyClerkToken(clerkToken: string) {
    try {
      // Use verifyToken function to validate the JWT
      const payload = await verifyToken(clerkToken, {
        secretKey: this.clerkSecretKey,
        jwtKey: this.clerkJwtKey,
      });

      const clerkUserId = payload.sub;

      if (!clerkUserId) {
        throw new UnauthorizedException('No user ID in Clerk token');
      }

      // Get user details from Clerk
      const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;

      // Find or create user based on Clerk ID
      let user = await this.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });

      if (!user) {
        // Try to find by email and link accounts
        if (email) {
          user = await this.prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // Link existing user to Clerk
            await this.prisma.user.update({
              where: { id: user.id },
              data: { clerkId: clerkUserId },
            });
            this.logger.log(
              `Linked existing user ${email} to Clerk ID ${clerkUserId}`,
            );
          }
        }

        // If still no user, create new one
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email: email || `${clerkUserId}@clerk.local`,
              clerkId: clerkUserId,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              avatarUrl: clerkUser.imageUrl,
              emailVerified:
                clerkUser.emailAddresses?.[0]?.verification?.status ===
                'verified',
            },
          });
          this.logger.log(
            `Created new user from Clerk: ${email || clerkUserId}`,
          );
        }
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Generate internal JWT tokens
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.organizationId ?? undefined,
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          clerkId: user.clerkId,
        },
        ...tokens,
      };
    } catch (error) {
      this.logger.error('Clerk token verification failed', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Sync user data from Clerk (called from webhook)
   */
  async syncClerkUser(clerkId: string) {
    const clerkUser = await this.clerkClient.users.getUser(clerkId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      throw new UnauthorizedException('No email found in Clerk user');
    }

    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user data from Clerk
    return this.prisma.user.update({
      where: { clerkId },
      data: {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        emailVerified:
          clerkUser.emailAddresses?.[0]?.verification?.status === 'verified',
      },
    });
  }

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const { user } = storedToken;
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.organizationId ?? undefined,
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId?: string,
  ) {
    const payload = { sub: userId, email, role, organizationId };
    const secret = this.configService.get<string>('jwt.secret');
    const expiresInStr =
      this.configService.get<string>('jwt.expiresIn') || '15m';

    const expiresIn = this.parseExpiryToSeconds(expiresInStr);

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    const refreshToken = uuidv4();
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date();

    const refreshSeconds = this.parseExpiryToSeconds(refreshExpiresIn);
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshSeconds);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        organizationId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) {
      return 900; // default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 86400;
      case 'h':
        return value * 3600;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 900;
    }
  }
}
