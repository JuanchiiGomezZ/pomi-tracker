# DailyLoop API - Plan de Implementación por Fases

## Visión General

Desarrollo de API REST para DailyLoop, app móvil de daily loops y to-do tracking. Mobile-first, offline-first con sync via FCM.

## Stack Tecnológico (del template)

- **Framework:** NestJS 11
- **Database:** PostgreSQL + Prisma 5
- **Auth:** JWT + Firebase Auth (Google/Apple)
- **Cache:** Redis + Cache Manager
- **Notifications:** Firebase Cloud Messaging (FCM)

---

# BLOQUE 1: Base de Datos y Auth

## Objetivo
Setup inicial: schema Prisma + sistema de autenticación con Firebase

## Dependencias
```bash
cd backend
npm install firebase-admin date-fns
```

## Archivos a Crear/Modificar

### 1. Schema Prisma
**Archivo:** `backend/prisma/schema.prisma`

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  password        String?  // Nullable para usuarios OAuth
  firstName       String?  @map("first_name")
  lastName        String?  @map("last_name")
  avatarUrl       String?  @map("avatar_url")
  firebaseUid     String?  @unique @map("firebase_uid")
  emailVerified   Boolean  @default(false) @map("email_verified")
  timezone        String   @default("UTC")
  dayCutoffHour   Int      @default(3) @map("day_cutoff_hour")
  fcmToken        String?  @map("fcm_token")
  currentStreak   Int      @default(0) @map("current_streak")
  bestStreak      Int      @default(0) @map("best_streak")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  refreshTokens   RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id          String   @id @default(uuid())
  token       String   @unique
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")
  revokedAt   DateTime? @map("revoked_at")

  @@index([userId])
  @@map("refresh_tokens")
}
```

### 2. Firebase Service
**Archivo:** `backend/src/shared/auth/firebase.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized || admin.apps.length > 0) return;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    this.initialized = true;
  }

  async verifyIdToken(idToken: string) {
    return admin.auth().verifyIdToken(idToken);
  }
}
```

### 3. Auth DTOs
**Archivo:** `backend/src/modules/auth/dto/firebase-login.dto.ts`
```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(1),
  fcmToken: z.string().optional(),
  timezone: z.string().optional(),
  dayCutoffHour: z.number().min(0).max(6).optional(),
});

export class FirebaseLoginDto extends createZodDto(firebaseLoginSchema) {}
```

### 4. Modificar Auth Service
**Archivo:** `backend/src/modules/auth/auth.service.ts`

Agregar método `firebaseLogin()` y actualizar `generateTokens()`.

### 5. Auth Controller
**Archivo:** `backend/src/modules/auth/auth.controller.ts`

Agregar endpoint:
```typescript
@Post('firebase')
async firebaseLogin(@Body() dto: FirebaseLoginDto) {
  return this.authService.firebaseLogin(dto);
}
```

### 6. Variables de Entorno
**Archivo:** `backend/.env`
```bash
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=tu-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Verificación del Bloque 1

```bash
# 1. Instalar dependencias
cd backend && npm install firebase-admin

# 2. Validar schema
npx prisma validate

# 3. Crear migración
npx prisma migrate dev --name dailyloop_auth

# 4. Levantar servidor
npm run start:dev

# 5. Probar endpoint (requiere token de Firebase mockeado o real)
curl -X POST http://localhost:3000/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"idToken": "test-token"}'
```

---

# BLOQUE 2: Blocks y Loops

## Objetivo
CRUD de Blocks (categorías) y Loops (tareas recurrentes)

## Archivos a Crear

### 1. Schema Prisma (agregar)
```prisma
model Block {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  icon        String?
  sortOrder   Int      @default(0) @map("sort_order")
  activeDays  Int[]    @default([0,1,2,3,4,5,6]) @map("active_days")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  loops       Loop[]
  oneOffs     OneOff[]
  taskInstances TaskInstance[]

  @@index([userId])
  @@map("blocks")
}

model Loop {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  blockId     String   @map("block_id")
  block       Block    @relation(fields: [blockId], references: [id], onDelete: Cascade)
  title       String
  icon        String?
  weekDays    Int[]    // [0,1,2,3,4,5,6] = Dom-Sáb
  isPaused    Boolean  @default(false) @map("is_paused")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  taskInstances TaskInstance[]

  @@index([userId])
  @@index([blockId])
  @@map("loops")
}
```

### 2. Blocks Module
```
backend/src/modules/blocks/
├── blocks.controller.ts
├── blocks.service.ts
├── blocks.module.ts
└── dto/
    ├── create-block.dto.ts
    └── update-block.dto.ts
```

### 3. Loops Module
```
backend/src/modules/loops/
├── loops.controller.ts
├── loops.service.ts
├── loops.module.ts
└── dto/
    ├── create-loop.dto.ts
    └── update-loop.dto.ts
```

### 4. Utils: Date Utils
**Archivo:** `backend/src/shared/utils/date.utils.ts`
```typescript
export function isActiveToday(weekDays: number[], timezone: string): boolean {
  // Implementar lógica
}

export function getNext7Days(): Date[] {
  // Retornar próximos 7 días
}
```

## Endpoints

### Blocks
```
GET    /blocks           → Listar todos
POST   /blocks           → Crear
GET    /blocks/:id       → Ver uno
PATCH  /blocks/:id       → Editar
DELETE /blocks/:id       → Eliminar
```

### Loops
```
GET    /loops            → Listar todos
POST   /loops            → Crear
GET    /loops/:id        → Ver uno
PATCH  /loops/:id        → Editar (título, días, pausar)
DELETE /loops/:id        → Eliminar
```

## Verificación del Bloque 2

```bash
# 1. Agregar modelos al schema
npx prisma migrate dev --name dailyloop_blocks_loops

# 2. Probar endpoints
# Crear block
curl -X POST http://localhost:3000/blocks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mañana", "icon": "🌅", "activeDays": [1,2,3,4,5]}'

# Crear loop
curl -X POST http://localhost:3000/loops \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"blockId": "<block-id>", "title": "Meditar", "weekDays": [1,2,3,4,5,6,0]}'
```

---

# BLOQUE 3: Tasks (Core)

## Objetivo
Sistema de tareas: task instances, check, skip, quick add

## Archivos a Crear

### 1. Schema Prisma (agregar)
```prisma
model OneOff {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  blockId     String   @map("block_id")
  block       Block    @relation(fields: [blockId], references: [id], onDelete: Cascade)
  title       String
  icon        String?
  scheduledDate DateTime @map("scheduled_date")
  createdAt   DateTime @default(now()) @map("created_at")
  taskInstances TaskInstance[]

  @@index([userId])
  @@map("one_offs")
}

model TaskInstance {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  loopId      String?     @map("loop_id")
  loop        Loop?       @relation(fields: [loopId], references: [id], onDelete: Cascade)
  oneOffId    String?     @map("one_off_id")
  oneOff      OneOff?     @relation(fields: [oneOffId], references: [id], onDelete: Cascade)
  blockId     String      @map("block_id")
  block       Block       @relation(fields: [blockId], references: [id], onDelete: Cascade)
  date        DateTime    @map("date")
  status      TaskStatus  @default(TODO)
  completedAt DateTime?   @map("completed_at")
  isSynced    Boolean     @default(true) @map("is_synced")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@index([userId, date])
  @@index([loopId])
  @@map("task_instances")
}

enum TaskStatus {
  TODO
  COMPLETED
  SKIPPED
}

model DaySummary {
  id                  String   @id @default(uuid())
  userId              String   @map("user_id")
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date                DateTime @map("date")
  totalTasks          Int      @default(0) @map("total_tasks")
  completedTasks      Int      @default(0) @map("completed_tasks")
  completionPercentage Float   @default(0) @map("completion_percentage")
  dayResult           DayResult @map("day_result")
  streakContinued     Boolean  @default(false) @map("streak_continued")

  @@unique([userId, date])
  @@index([userId])
  @@map("day_summaries")
}

enum DayResult {
  PERFECT
  PARTIAL
  NONE
  NO_TASKS
}
```

### 2. Tasks Module
```
backend/src/modules/tasks/
├── tasks.controller.ts
├── tasks.service.ts
├── tasks.module.ts
└── dto/
    ├── quick-add.dto.ts
    └── update-task.dto.ts
```

### 3. Utils: Streak Calculator
**Archivo:** `backend/src/shared/utils/streak.utils.ts`
```typescript
export function calculateStreak(userId: string): { current: number; best: number } {
  // Calcular streak del usuario
}

export function recalculateDaySummary(userId: string, date: Date): DaySummary {
  // Recalcular resumen de un día específico
}
```

## Endpoints

```
GET    /tasks/today           → Tareas de hoy
GET    /tasks/date/:date      → Tareas de fecha específica
POST   /tasks                 → Quick Add (one-off o loop)
PATCH  /tasks/:id             → Editar
POST   /tasks/:id/check       → Completar
POST   /tasks/:id/uncheck     → Descompletar
POST   /tasks/:id/skip        → Skip today
DELETE /tasks/:id             → Eliminar
```

## Lógica de Negocio

1. **Quick Add (one-off):** Crea OneOff + TaskInstance para esa fecha
2. **Quick Add (loop):** Crea Loop + genera TaskInstances para próximos 7 días
3. **Check:** status=COMPLETED, completed_at=NOW, recalcular day_summary
4. **Skip:** status=SKIPPED, no afecta streak
5. **Regenerar TaskInstances:** Al crear/editar loop, generar próximos 7 días

## Verificación del Bloque 3

```bash
# 1. Agregar modelos al schema
npx prisma migrate dev --name dailyloop_tasks

# 2. Probar flujo completo
# Obtener tareas de hoy
curl http://localhost:3000/tasks/today \
  -H "Authorization: Bearer <token>"

# Quick add task
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Llamar a mamá", "type": "one_off", "blockId": "<block-id>", "date": "2026-01-12"}'

# Completar tarea
curl -X POST http://localhost:3000/tasks/<task-id>/check \
  -H "Authorization: Bearer <token>"
```

---

# BLOQUE 4: Insights y Gamificación

## Objetivo
Streak, heatmap, estadísticas diarias

## Archivos a Crear

### 1. Insights Module
```
backend/src/modules/insights/
├── insights.controller.ts
├── insights.service.ts
└── insights.module.ts
```

### 2. DaySummaries (ya en schema del bloque 3)

### 3. Utils: Streak Utils (ya en bloque 3)

## Endpoints

```
GET /insights/streak       → { currentStreak, bestStreak }
GET /insights/heatmap      → Array de365 días con counts
GET /insights/calendar?month=2026-01  → Mes con resúmenes
GET /insights/day/:date    → Resumen de día específico
```

## Lógica de Negocio

### Streak Calculation
```
Perfect Day = día tiene ≥1 tarea programada AND todas completadas
Streak = días consecutivos con Perfect Day
Días sin tareas = neutral (no suma ni rompe)
```

### Day Summary
- Se recalcula automáticamente cuando:
  - Se completa/skippea una tarea
  - Se-edita/elimina tarea (hasta 7 días atrás)
- Resultado del día:
  - PERFECT: todas completadas (incluye skips)
  - PARTIAL: algunas completadas
  - NONE: ninguna completada
  - NO_TASKS: sin tareas programadas

## Verificación del Bloque 4

```bash
# Probar endpoints
curl http://localhost:3000/insights/streak \
  -H "Authorization: Bearer <token>"

curl http://localhost:3000/insights/heatmap \
  -H "Authorization: Bearer <token>"
```

---

# BLOQUE 5: Reminders y Notifications

## Objetivo
Sistema de recordatorios y notificaciones push via FCM

## Archivos a Crear

### 1. Schema Prisma (agregar)
```prisma
model Reminder {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  blockId     String?     @map("block_id")
  block       Block?      @relation(fields: [blockId], references: [id])
  type        ReminderType
  hour        Int         // 0-23
  isEnabled   Boolean     @default(true) @map("is_enabled")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@index([userId])
  @@map("reminders")
}

enum ReminderType {
  DAY_CLOSE    // Recordatorio de cierre de día
  BLOCK_REMINDER // Recordatorio específico de bloque
}
```

### 2. Reminders Module
```
backend/src/modules/reminders/
├── reminders.controller.ts
├── reminders.service.ts
├── reminders.module.ts
└── dto/
    └── create-reminder.dto.ts
```

### 3. FCM Service
**Archivo:** `backend/src/shared/fcm/fcm.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  async sendNotification(token: string, title: string, body: string, data?: Record<string, string>) {
    // Enviar notificación via FCM
  }

  async sendDailyReminders() {
    // Scheduled job: enviar recordatorios del día
  }
}
```

## Endpoints

```
GET    /reminders          → Listar todos
POST   /reminders          → Crear
PATCH  /reminders/:id      → Editar (hora, enabled)
DELETE /reminders/:id      → Eliminar
```

## Verificación del Bloque 5

```bash
# Probar endpoints
curl http://localhost:3000/reminders \
  -H "Authorization: Bearer <token>"

curl -X POST http://localhost:3000/reminders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "DAY_CLOSE", "hour": 21, "isEnabled": true}'
```

---

# BLOQUE 6: Offline Sync

## Objetivo
Cola de sincronización para offline-first

## Archivos a Crear

### 1. Schema Prisma (agregar)
```prisma
model SyncQueue {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  entityType  String      @map("entity_type") // loop, task, block, etc
  entityId    String      @map("entity_id")
  action      SyncAction
  payload     Json
  status      SyncStatus  @default(PENDING) @map("status")
  retryCount  Int         @default(0) @map("retry_count")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@index([userId, status])
  @@map("sync_queue")
}

enum SyncAction {
  CREATE
  UPDATE
  DELETE
}

enum SyncStatus {
  PENDING
  FAILED
  RETRYING
  COMPLETED
}
```

### 2. Sync Module
```
backend/src/modules/sync/
├── sync.controller.ts
├── sync.service.ts
├── sync.module.ts
└── dto/
    └── sync-push.dto.ts
```

## Endpoints

```
POST /sync/pull    → Obtener cambios del servidor
POST /sync/push    → Enviar cambios locales (cola)
POST /sync/resolve → Resolver conflictos
```

## Verificación del Bloque 6

```bash
# Probar sync push
curl -X POST http://localhost:3000/sync/push \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"actions": [{"entityType": "task", "action": "CREATE", "payload": {...}}]}'
```

---

# Dependencias Finales

```bash
npm install firebase-admin date-fns
```

---

# Orden de Implementación Recomendado

1. **Bloque 1:** Base + Auth (fundamento de todo)
2. **Bloque 2:** Blocks + Loops (estructura de datos)
3. **Bloque 3:** Tasks (core de la app)
4. **Bloque 4:** Insights (gamificación)
5. **Bloque 5:** Reminders (notifications)
6. **Bloque 6:** Sync (offline support)

Cada bloque es independiente y puede probarse de forma aislada.
