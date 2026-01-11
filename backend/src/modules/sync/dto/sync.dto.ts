import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Entity types for sync
const entityTypeSchema = z.enum(['block', 'task', 'task-instance']);

// Action types for sync
const actionTypeSchema = z.enum(['create', 'update', 'delete']);

// Generic object schema for entity data
const entityDataSchema = z.record(z.string(), z.unknown());

// Individual change from client
const syncChangeSchema = z.object({
  entity: entityTypeSchema,
  entityId: z.string().uuid(),
  action: actionTypeSchema,
  data: entityDataSchema.optional(), // Full entity data for creates/updates
  clientTimestamp: z.string().datetime().optional(), // Client's local timestamp
});

// Push request DTO
export const pushSyncSchema = z.object({
  lastSyncAt: z.string().datetime().optional(), // Client's last sync timestamp
  changes: z.array(syncChangeSchema), // Changes made offline
});

export class PushSyncDto extends createZodDto(pushSyncSchema) {}

// Pull request - uses query params
export const pullSyncQuerySchema = z.object({
  lastSyncAt: z.string().datetime().optional(), // Get all changes since this time
});

export type PullSyncQueryDto = z.infer<typeof pullSyncQuerySchema>;

// Response for pull
export const pullSyncResponseSchema = z.object({
  blocks: z.array(entityDataSchema).optional(),
  tasks: z.array(entityDataSchema).optional(),
  taskInstances: z.array(entityDataSchema).optional(),
  syncTimestamp: z.string().datetime(), // Server timestamp for next sync
  hasMore: z.boolean().default(false),
});

export type PullSyncResponse = z.infer<typeof pullSyncResponseSchema>;

// Full sync response (both pull and push)
export const syncResponseSchema = z.object({
  success: z.boolean(),
  pull: z
    .object({
      blocks: z.array(entityDataSchema).optional(),
      tasks: z.array(entityDataSchema).optional(),
      taskInstances: z.array(entityDataSchema).optional(),
      syncTimestamp: z.string().datetime(),
      hasMore: z.boolean().default(false),
    })
    .optional(),
  push: z
    .object({
      applied: z.number(), // Number of changes applied
      conflicts: z
        .array(
          z.object({
            entity: entityTypeSchema,
            entityId: z.string().uuid(),
            serverData: entityDataSchema.optional(),
            clientData: entityDataSchema.optional(),
          }),
        )
        .default([]),
    })
    .optional(),
  serverTimestamp: z.string().datetime(),
});

export type SyncResponse = z.infer<typeof syncResponseSchema>;
