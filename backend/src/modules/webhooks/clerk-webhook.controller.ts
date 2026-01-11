import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../core/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { ClerkWebhookEvent, ClerkUserData } from './types/clerk-webhook.types';

@ApiTags('Webhooks')
@Controller('webhooks')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('clerk')
  @ApiOperation({ summary: 'Handle Clerk webhook events' })
  async handleClerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() rawBody: any,
  ) {
    try {
      // Verify webhook using Clerk's Svix verification
      const webhookSecret = this.configService.get<string>(
        'clerk.webhookSecret',
      );

      if (!webhookSecret) {
        throw new BadRequestException('Webhook secret not configured');
      }

      if (!svixId || !svixTimestamp || !svixSignature) {
        throw new BadRequestException('Missing svix headers');
      }

      // Manual verification using Svix headers
      const { Webhook } = await import('svix');
      const wh = new Webhook(webhookSecret);

      const payload =
        typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
      const evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;

      const { type, data } = evt;
      this.logger.log(`Received webhook event: ${type}`);

      // Handle different webhook events
      switch (type) {
        case 'user.created':
          await this.handleUserCreated(data);
          break;

        case 'user.updated':
          await this.handleUserUpdated(data);
          break;

        case 'user.deleted':
          await this.handleUserDeleted(data);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Webhook verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Handle user.created webhook event
   */
  private async handleUserCreated(data: ClerkUserData) {
    const email = data.email_addresses?.[0]?.email_address;

    if (!email) {
      this.logger.warn('User created webhook without email');
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Update with Clerk ID if not set
        if (!existingUser.clerkId) {
          await this.prisma.user.update({
            where: { email },
            data: { clerkId: data.id },
          });
          this.logger.log(`Updated existing user ${email} with Clerk ID`);
        }
        return;
      }

      // Create new user
      await this.prisma.user.create({
        data: {
          email,
          clerkId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.image_url,
          emailVerified:
            data.email_addresses?.[0]?.verification?.status === 'verified',
        },
      });

      this.logger.log(`Created new user: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to create user: ${email}`, error);
      throw error;
    }
  }

  /**
   * Handle user.updated webhook event
   */
  private async handleUserUpdated(data: ClerkUserData) {
    try {
      await this.prisma.user.update({
        where: { clerkId: data.id },
        data: {
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.image_url,
          emailVerified:
            data.email_addresses?.[0]?.verification?.status === 'verified',
        },
      });

      this.logger.log(`Updated user: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to update user: ${data.id}`, error);
    }
  }

  /**
   * Handle user.deleted webhook event
   */
  private async handleUserDeleted(data: ClerkUserData) {
    try {
      // Soft delete
      await this.prisma.user.update({
        where: { clerkId: data.id },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`Soft deleted user: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${data.id}`, error);
    }
  }
}
