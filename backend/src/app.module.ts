import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Core modules
import { ConfigModule } from './core/config';
import { DatabaseModule } from './core/database';
import { CacheModule } from './core/cache';
import { ThrottlerModule } from './core/throttler';
import { AllExceptionsFilter } from './core/filters';
import { TransformInterceptor } from './core/interceptors';

// Shared modules
import { MailModule } from './shared/mail';
import { StorageModule } from './shared/storage';

// Feature modules
import { AuthModule, ClerkAuthGuard, RolesGuard } from './modules/auth';
import { UsersModule } from './modules/users';
import { BlocksModule } from './modules/blocks';
import { TasksModule } from './modules/tasks';
import { TaskInstancesModule } from './modules/task-instances';
import { InsightsModule } from './modules/insights';
import { SyncModule } from './modules/sync';
import { WebhooksModule } from './modules/webhooks';

@Module({
  imports: [
    // Core
    ConfigModule,
    DatabaseModule,
    CacheModule,
    ThrottlerModule,

    // Shared
    MailModule,
    StorageModule,

    // Features
    AuthModule,
    UsersModule,
    BlocksModule,
    TasksModule,
    TaskInstancesModule,
    InsightsModule,
    SyncModule,
    WebhooksModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Clerk authentication
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    // Global roles authorization
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
