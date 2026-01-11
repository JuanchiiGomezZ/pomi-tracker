import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../core/database/prisma.service';
import { RegisterDto, LoginDto, FirebaseLoginDto } from './dto/auth.dto';
import { FirebaseService } from '../../shared/auth/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
      },
      ...tokens,
    };
  }

  async firebaseLogin(dto: FirebaseLoginDto): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      role: string;
      timezone: string;
      dayCutoffHour: number;
      currentStreak: number;
      bestStreak: number;
      createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify Firebase ID token
    const firebaseToken = await this.firebaseService.verifyIdToken(dto.idToken);

    const firebaseUid = firebaseToken.uid;
    const email = firebaseToken.email ?? null;
    const email_verified = firebaseToken.email_verified ?? false;
    const name = (firebaseToken as { name?: string }).name ?? null;
    const picture = firebaseToken.picture ?? null;

    if (!email) {
      throw new UnauthorizedException('Email not available from Firebase');
    }

    // Check if user exists by firebaseUid or email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid }, { email }],
        deletedAt: null,
      },
    });

    let userId: string;

    // If user doesn't exist, create new user
    if (!existingUser) {
      const newUser = await this.prisma.user.create({
        data: {
          email,
          firebaseUid,
          emailVerified: email_verified,
          firstName: dto.firstName || this.extractFirstName(name),
          lastName: dto.lastName || this.extractLastName(name),
          avatarUrl: picture || dto.avatarUrl,
          timezone: dto.timezone || 'UTC',
          dayCutoffHour: dto.dayCutoffHour ?? 3,
        },
      });
      userId = newUser.id;
    } else {
      userId = existingUser.id;

      // Update existing user's Firebase UID if not set
      if (!existingUser.firebaseUid) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { firebaseUid },
        });
      }

      // Update FCM token if provided
      if (dto.fcmToken) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { fcmToken: dto.fcmToken },
        });
      }

      // Update timezone and dayCutoffHour if provided
      if (dto.timezone || dto.dayCutoffHour !== undefined) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...(dto.timezone && { timezone: dto.timezone }),
            ...(dto.dayCutoffHour !== undefined && {
              dayCutoffHour: dto.dayCutoffHour,
            }),
          },
        });
      }
    }

    // Fetch user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        dayCutoffHour: true,
        currentStreak: true,
        bestStreak: true,
        createdAt: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Generate JWT tokens
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
        timezone: user.timezone,
        dayCutoffHour: user.dayCutoffHour,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /**
   * Extract first name from Firebase display name
   */
  private extractFirstName(displayName: string | null): string | null {
    if (!displayName) return null;
    const parts = displayName.split(' ');
    return parts[0] || null;
  }

  /**
   * Extract last name from Firebase display name
   */
  private extractLastName(displayName: string | null): string | null {
    if (!displayName) return null;
    const parts = displayName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : null;
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

    // Parse expiry string to get seconds for JWT
    const expiresIn = this.parseExpiryToSeconds(expiresInStr);

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    const refreshToken = uuidv4();
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date();

    // Parse refresh expiry (e.g., '7d', '30d')
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
