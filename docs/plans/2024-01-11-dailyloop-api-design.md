# DailyLoop API - Documento de Diseño Formal

## Sección 1: Visión del Producto y Objetivos

### 1.1 Visión General

DailyLoop es una aplicación móvil minimalista diseñada para ayudar a usuarios a gestionar sus hábitos diarios (loops) y tareas one-off de manera sencilla. El producto se enfoca en tres pilares fundamentales: claridad diaria, constancia mediante gamificación suave, y una experiencia móvil sin fricción.

La propuesta de valor se centra en permitir que un usuario pueda organizar su día en menos de 60 segundos, manteniendo sus hábitos recurrentes sin esfuerzo adicional gracias a la automatización de loops, y visualizar su progreso a través de streak y heatmap tipo GitHub que refuerzan positivamente el comportamiento deseado.

El modelo de negocio para esta primera versión (v1) es completamente gratuito con login obligatorio mediante OAuth con Google o Apple, estableciendo así una base de usuarios autenticados desde el inicio.

### 1.2 Objetivos del Producto (v1)

Los objetivos principales para esta primera versión incluyen que el usuario pueda armar su día en menos de 60 segundos, lo cual implica una interfaz de creación rápida y una visualización clara del día actual. También se busca que mantener un loop sea completamente sin fricción, donde las tareas recurrentes aparecen automáticamente en los días correspondientes sin necesidad de configuración repetitiva.

La constancia debe sentirse rewarding a través del sistema de streak y heatmap visual, proporcionando feedback positivo sin ser invasivo. Finalmente, toda la experiencia debe mantener un enfoque minimalista con pocas decisiones que tomar y menús simples, evitando la parálisis por análisis que sufren muchas aplicaciones de productividad.

### 1.3 No Objetivos (v1)

Para mantener el alcance manejable, esta primera versión no incluye horarios específicos por tarea (no es un calendar), proyectos o etiquetas complejas, funcionalidad de colaboración en equipo, ni métricas avanzadas de productividad tipo sistemas hardcore de tracking.

---

## Sección 2: Definiciones de Dominio

### 2.1 Entidades del Sistema

**Bloque:** Un agrupador visual del día que organiza tareas por contexto o momento. Ejemplos típicos incluyen "Morning" para rutinas matutinas, "Workload" para tareas laborales, y "Night" para rutinas nocturnas. Los bloques son completamente personalizables en nombre, icono y días activos.

**Tarea One-Off:** Una tarea para una fecha puntual específica que no se repite. Se crea, se completa o elimina, y no vuelve a aparecer automáticamente.

**Loop:** Una tarea recurrente que se repite según días de semana seleccionados. Por ejemplo, "Beber agua" puede configurarse para ejecutarse de lunes a viernes. El loop genera instancias diarias que el usuario ve y puede completar, skippear o editar individualmente.

**Task Instance (Instancia de Tarea):** La representación de un loop o one-off en un día específico. Permite que cada día tenga su propio estado (TODO, COMPLETED, SKIPPED) independientemente de otros días.

**Estado de Tarea:** Cada task instance tiene un estado definido como TODO cuando está pendiente de completar, COMPLETED cuando el usuario la marcó como done, o SKIPPED cuando el usuario eligió saltar ese loop específico para ese día.

### 2.2 Conceptos de Gamificación

**Perfect Day:** Un día donde el usuario completó todas las tareas programadas (no-skipped). Requiere al menos una tarea programada para el día.

**Streak:** Cantidad de días consecutivos con Perfect Day. Los días sin tareas programadas son neutrales (no suman ni rompen el streak).

**Completitud del Día:** Porcentaje calculado como tareas completadas dividido por tareas totales programadas (menos skips). Un día con 0 tareas programadas se marca como "NO_TASKS" y no afecta el streak.

---

## Sección 3: Arquitectura de Datos

### 3.1 Modelo de Datos Detallado

#### 3.1.1 Tabla Users

Esta tabla almacena la información básica del usuario autenticado y sus preferencias del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único primario |
| email | String | Email del usuario (único) |
| name | String | Nombre para saludo personalizado |
| timezone | String | Timezone IANA (ej: "America/Buenos_Aires") |
| day_cutoff_hour | Int | Hora de corte del día (0-6 AM) |
| current_streak | Int | Streak actual de días perfectos |
| best_streak | Int | Mejor streak histórico |
| fcm_token | String | Token de FCM para notificaciones push |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

La tabla incluye índices en email para búsquedas rápidas durante auth y en timezone para queries de recordatorios.

#### 3.1.2 Tabla Blocks

Los bloques organizan las tareas visualmente y tienen días activos configurables.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK hacia Users |
| name | String | Nombre del bloque (ej: "Morning") |
| icon | String | Emoji o icono del bloque |
| sort_order | Int | Orden de aparición en Home |
| active_days | JSON/Int | Días activos (bitmask 0-6 o array JSON) |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

El campo active_days usa una representación eficiente donde 0 representa domingo y 6 sábado. Un valor de 127 (binary 1111111) indica todos los días activos, mientras que 62 (binary 0111110) indica lunes a viernes.

#### 3.1.3 Tabla Loops

Los loops definen tareas recurrentes con sus días de repetición.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK hacia Users |
| block_id | UUID | FK hacia Blocks |
| title | String | Título de la tarea |
| icon | String | Emoji o icono opcional |
| week_days | JSON/Int | Días de semana que aplica (bitmask) |
| is_paused | Boolean | Si el loop está pausado temporalmente |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

#### 3.1.4 Tabla OneOffs

Las tareas one-off son para eventos únicos con fecha específica.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK hacia Users |
| block_id | UUID | FK hacia Blocks |
| title | String | Título de la tarea |
| icon | String | Emoji o icono opcional |
| scheduled_date | Date | Fecha específica |
| created_at | Timestamp | Fecha de creación |

#### 3.1.5 Tabla TaskInstances

Esta es la tabla central que conecta loops y one-offs con fechas específicas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| loop_id | UUID | FK hacia Loops (nullable) |
| one_off_id | UUID | FK hacia OneOffs (nullable) |
| block_id | UUID | FK hacia Blocks |
| user_id | UUID | FK hacia Users |
| date | Date | Fecha de esta instancia |
| status | Enum | TODO, COMPLETED, SKIPPED |
| completed_at | Timestamp | Momento de completitud (nullable) |
| is_synced | Boolean | Si está sincronizada con backend |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

La tabla tiene índices compuestos en (user_id, date) para queries eficientes del Home y en (loop_id, date) para regeneración de instancias al editar loops.

#### 3.1.6 Tabla DaySummaries

Caché de estadísticas diarias para evitar cálculos pesados en tiempo real.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK hacia Users |
| date | Date | Fecha del resumen |
| total_tasks | Int | Total tareas programadas (menos skips) |
| completed_tasks | Int | Tareas completadas |
| completion_percentage | Float | Porcentaje de completitud |
| day_result | Enum | PERFECT, PARTIAL, NONE, NO_TASKS |
| streak_continued | Boolean | Si el streak se mantuvo este día |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

Esta tabla se regenera cuando se modifica una task instance dentro del rango editable (7 días).

#### 3.1.7 Tabla Reminders

Configuración de notificaciones push para cierre del día y recordatorios por bloque.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK hacia Users |
| block_id | UUID | FK hacia Blocks (nullable para cierre) |
| type | Enum | DAY_CLOSE, BLOCK_REMINDER |
| hour | Time | Hora del recordatorio |
| is_enabled | Boolean | Si está activo |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

#### 3.1.8 Tabla SyncQueue

Cola de sincronización para soporte offline-first.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK hacia Users |
| entity_type | Enum | TASK_INSTANCE, LOOP, BLOCK, etc. |
| entity_id | UUID | ID de la entidad afectada |
| action | Enum | CREATE, UPDATE, DELETE |
| payload | JSON | Estado completo de la entidad |
| status | Enum | PENDING, FAILED, RETRYING |
| retry_count | Int | Cantidad de reintentos |
| created_at | Timestamp | Fecha de creación |
| processed_at | Timestamp | Momento de procesamiento (nullable) |

### 3.2 Decisiones de Arquitectura de Datos

#### 3.2.1 Estrategia de Generación de TaskInstances

Se utiliza un híbrido de pre-generación de 7 días con generación on-the-fly para completitud. Cuando se crea un loop, inmediatamente se generan task instances para los próximos 7 días que coincidan con los week_days configurados. Un scheduled job que corre a las 2 AM extiende las instancias otros 7 días, manteniendo siempre coverage de 7-14 días hacia adelante.

Esta decisión se tomó considerando que 7 días es el sweet spot para planning semanal sin explosión de storage, permite editing de días pasados de forma simple (regenerar el rango), mantiene el cache de Home rápido, y los skips no acumulan garbage histórico.

#### 3.2.2 Representación de Días

Los días de semana (week_days y active_days) se representan mediante bitmask de 7 bits donde el bit 0 es domingo y el bit 6 es sábado. Esta representación permite queries eficientes usando operadores binarios y almacenamiento compacto. Un valor de 127 significa todos los días, mientras que operaciones como agregar o quitar un día son simples operaciones de bits.

#### 3.2.3 Caché de DaySummaries

Los resúmenes diarios se pre-calculan y almacenan para evitar cálculos pesados en queries del heatmap. Se regeneran inmediatamente cuando:
- Se modifica una task instance (check, skip, edit)
- Se edita un loop que afecta task instances del día
- Se elimina una task instance

El heatmap tiene un TTL de cache de 1 hora, suficiente para mantener la experiencia fluida mientras evita cálculos excesivos.

---

## Sección 4: Diseño de API REST

### 4.1 Convenciones de la API

#### 4.1.1 Formato de Respuesta

Todas las respuestas exitosas siguen el formato estándar del template:

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

El campo meta solo está presente en endpoints paginados. Las respuestas de objeto simple solo contienen data sin meta.

#### 4.1.2 Formato de Errores

Los errores siguen el formato NestJS estándar:

```json
{
  "statusCode": 400,
  "message": "Validation error: email must be an email",
  "error": "Bad Request"
}
```

#### 4.1.3 Códigos de Estado HTTP

- 200: Éxito
- 201: Creado exitosamente
- 400: Error de validación
- 401: No autorizado
- 404: No encontrado
- 422: Error de negocio
- 500: Error interno

### 4.2 Módulo de Autenticación

#### 4.2.1 Endpoints de Auth

```
POST /auth/google
POST /auth/apple
POST /auth/refresh
POST /auth/logout
```

#### 4.2.2 Flujo de Login OAuth

El endpoint POST /auth/google recibe un Google ID Token, lo verifica con Google, y crea o encuentra el usuario en la base de datos. Retorna access_token y refresh_token.

El flujo completo incluye:
1. Mobile app obtiene ID token de Google/Apple
2. Mobile app envía ID token a POST /auth/google
3. Backend verifica token con Google OAuth
4. Backend busca o crea usuario en Prisma
5. Backend genera JWT access_token (15 min) y refresh_token UUID
6. Backend almacena refresh token en tabla RefreshTokens
7. Retorna tokens al cliente

#### 4.2.3 Refresh Token Flow

El endpoint POST /auth/refresh recibe el refresh token, verifica que exista y no esté revocado ni expirado, revoca el token anterior, genera nuevos tokens, y retorna al cliente.

#### 4.2.4 Logout

El endpoint POST /auth/logout recibe el refresh token, lo marca como revocado en la tabla, y termina la sesión.

### 4.3 Módulo de Usuarios

#### 4.3.1 Endpoints de Users

```
GET /users/me
PATCH /users/me
```

#### 4.3.2 Obtener Perfil Actual

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Juan",
    "timezone": "America/Buenos_Aires",
    "day_cutoff_hour": 3,
    "current_streak": 5,
    "best_streak": 12,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 4.3.3 Actualizar Perfil

**Request Body:**

```json
{
  "name": "Juan Manuel",
  "timezone": "America/New_York",
  "day_cutoff_hour": 4
}
```

El campo day_cutoff_hour debe ser un entero entre 0 y 6, representando la hora de corte del día.

### 4.4 Módulo de Bloques

#### 4.4.1 Endpoints de Blocks

```
GET /blocks
POST /blocks
GET /blocks/:id
PATCH /blocks/:id
DELETE /blocks/:id
```

#### 4.4.2 Listar Bloques

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Morning",
      "icon": "☀️",
      "sort_order": 0,
      "active_days": [1, 2, 3, 4, 5],
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Night",
      "icon": "🌙",
      "sort_order": 2,
      "active_days": [0, 1, 2, 3, 4, 5, 6],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4.4.3 Crear Bloque

**Request Body:**

```json
{
  "name": "Workout",
  "icon": "💪",
  "active_days": [1, 3, 5],
  "sort_order": 1
}
```

Si sort_order no se provee, se asigna al final. El campo active_days es un array de integers donde 0=domingo, 6=sábado.

**Validaciones:**
- name: required, 1-50 caracteres
- icon: optional, string
- active_days: optional, array de 0-6, default todos
- sort_order: optional, integer

#### 4.4.4 Editar Bloque

**Request Body (PATCH):**

```json
{
  "name": "Morning Routine",
  "active_days": [1, 2, 3, 4, 5, 6],
  "sort_order": 0
}
```

Editable: nombre, icono, active_days, y reorder.

**Regla de negocio:** Cambiar active_days solo afecta visibilidad del bloque, no altera task instances existentes.

#### 4.4.5 Eliminar Bloque

**Request Body:**

```json
{
  "action": "reassign",
  "target_block_id": "uuid"
}
```

Cuando se elimina un bloque con tareas existentes, el usuario debe especificar:
- reassign: mover todas las tareas a otro bloque
- delete: eliminar todas las tareas (con confirmación)

### 4.5 Módulo de Loops

#### 4.5.1 Endpoints de Loops

```
GET /loops
POST /loops
GET /loops/:id
PATCH /loops/:id
DELETE /loops/:id
```

#### 4.5.2 Listar Loops

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "block_id": "uuid",
      "block_name": "Morning",
      "title": "Beber agua",
      "icon": "💧",
      "week_days": [1, 2, 3, 4, 5],
      "is_paused": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4.5.3 Crear Loop

**Request Body:**

```json
{
  "block_id": "uuid",
  "title": "Meditar 10 min",
  "icon": "🧘",
  "week_days": [1, 2, 3, 4, 5, 6],
  "is_paused": false
}
```

**Validaciones:**
- block_id: required, UUID válido
- title: required, 1-100 caracteres
- icon: optional
- week_days: required, array de 1-7 integers (0-6)
- is_paused: optional, default false

**Efectos secundarios:**
- Se generan task instances para próximos 7 días
- Se invalidar cache de Home del usuario
- Se recalculan day summaries afectados

#### 4.5.4 Editar Loop

**Request Body (PATCH):**

```json
{
  "title": "Meditar 15 min",
  "week_days": [2, 4, 6],
  "is_paused": true
```

Editable: título, icono, week_days, y estado paused.

**Efectos secundarios:**
- Si week_days cambia, se regeneran task instances de 7 días
- Las task instances ya completadas no se modifican
- Se recalculan day summaries afectados

#### 4.5.5 Eliminar Loop

**Request Body:**

```json
{
  "scope": "all"  // o "today"
}
```

- all: elimina el loop y todas sus task instances
- today: elimina solo la task instance de hoy (si existe)

### 4.6 Módulo de Tareas

#### 4.6.1 Endpoints de Tasks

```
GET /tasks/today
GET /tasks/date/:date
POST /tasks
PATCH /tasks/:id
POST /tasks/:id/check
POST /tasks/:id/uncheck
POST /tasks/:id/skip
DELETE /tasks/:id
```

#### 4.6.2 Obtener Tareas de Hoy

**Response:**

```json
{
  "data": [
    {
      "block": {
        "id": "uuid",
        "name": "Morning",
        "icon": "☀️",
        "sort_order": 0
      },
      "tasks": [
        {
          "id": "uuid",
          "title": "Beber agua",
          "icon": "💧",
          "status": "COMPLETED",
          "completed_at": "2024-01-15T08:30:00Z",
          "is_loop": true,
          "loop_id": "uuid"
        },
        {
          "id": "uuid",
          "title": "Comprar leche",
          "icon": "🛒",
          "status": "TODO",
          "completed_at": null,
          "is_loop": false,
          "one_off_id": "uuid"
        }
      ]
    }
  ],
  "meta": {
    "date": "2024-01-15",
    "filter": "TODO"  // TODO, COMPLETED, o null para todos
  }
}
```

**Query params opcionales:**
- filter: "TODO" | "COMPLETED" | omitir para todos

#### 4.6.3 Quick Add (Crear Tarea)

**Request Body (POST /tasks):**

```json
{
  "title": "Llamar a mamá",
  "type": "one_off",
  "block_id": "uuid",
  "date": "2024-01-20",
  "icon": "📞"
}
```

O para loop:

```json
{
  "title": "Exercise",
  "type": "loop",
  "block_id": "uuid",
  "week_days": [1, 3, 5],
  "icon": "💪"
}
```

**Validaciones para one_off:**
- date: required, formato YYYY-MM-DD, no puede ser pasado (opcional, configurable)
- block_id: required

**Validaciones para loop:**
- week_days: required, array de 1-7 días
- block_id: required

**Efectos secundarios:**
- Se crea task instance para la fecha (one-off) o próximos 7 días (loop)
- Se invalidar cache de Home
- Se recalcula day summary del día afectado

#### 4.6.4 Completar Tarea

**POST /tasks/:id/check**

No requiere body. Cambia status a COMPLETED, setea completed_at.

**Reglas:**
- Si la tarea es de más de 7 días atrás, retorna error
- Se recalcula streak instantáneamente
- Se actualiza day summary

#### 4.6.5 Skip Today

**POST /tasks/:id/skip**

Solo disponible para task instances de loops (no para one-offs).

**Efectos:**
- Cambia status a SKIPPED
- No cuenta para completitud del día
- Si es el único loop del día, el día no puede ser Perfect Day
- Se recalcula streak instantáneamente

#### 4.6.6 Eliminar Tarea

**DELETE /tasks/:id**

Elimina la task instance. Si es de un loop, solo elimina esa instancia (no el loop).

**Reglas:**
- Si la tarea es de más de 7 días atrás, retorna error
- No cuenta para cálculos futuros (como si nunca existiera)

### 4.7 Módulo de Insights

#### 4.7.1 Endpoints de Insights

```
GET /insights/streak
GET /insights/heatmap
GET /insights/calendar
GET /insights/day/:date
```

#### 4.7.2 Streak Actual

**Response:**

```json
{
  "data": {
    "current_streak": 5,
    "best_streak": 12,
    "last_perfect_day": "2024-01-15",
    "total_perfect_days": 45
  }
}
```

#### 4.7.3 Heatmap Anual

**Response:**

```json
{
  "data": {
    "year": 2024,
    "weeks": [
      {
        "days": [
          { "date": "2024-01-01", "percentage": 0, "status": "NO_TASKS" },
          { "date": "2024-01-02", "percentage": 100, "status": "PERFECT" },
          { "date": "2024-01-03", "percentage": 50, "status": "PARTIAL" }
        ]
      }
    ]
  },
  "meta": {
    "cache_ttl": 3600
  }
}
```

**Status por percentage:**
- 100%: PERFECT
- 1-99%: PARTIAL
- 0%: NONE (hay tareas pero ninguna completada)
- null/0 con no_tasks: NO_TASKS

#### 4.7.4 Calendario Mensual

Similar al heatmap pero formato mes/año específico.

#### 4.7.5 Resumen de Día Específico

**GET /insights/day/2024-01-15**

**Response:**

```json
{
  "data": {
    "date": "2024-01-15",
    "day_result": "PERFECT",
    "total_tasks": 5,
    "completed_tasks": 5,
    "completion_percentage": 100,
    "streak_continued": true,
    "tasks": [
      {
        "id": "uuid",
        "title": "Beber agua",
        "block_name": "Morning",
        "status": "COMPLETED",
        "completed_at": "2024-01-15T08:30:00Z"
      }
    ]
  }
}
```

### 4.8 Módulo de Recordatorios

#### 4.8.1 Endpoints de Reminders

```
GET /reminders
POST /reminders
PATCH /reminders/:id
DELETE /reminders/:id
```

#### 4.8.2 Listar Recordatorios

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "DAY_CLOSE",
      "hour": "21:00",
      "is_enabled": true
    },
    {
      "id": "uuid",
      "block_id": "uuid",
      "block_name": "Morning",
      "type": "BLOCK_REMINDER",
      "hour": "08:00",
      "is_enabled": true
    }
  ]
}
```

#### 4.8.3 Crear Recordatorio de Cierre

**POST /reminders (type=DAY_CLOSE):**

```json
{
  "type": "DAY_CLOSE",
  "hour": "21:00",
  "is_enabled": true
}
```

#### 4.8.4 Crear Recordatorio por Bloque

**POST /reminders (type=BLOCK_REMINDER):**

```json
{
  "type": "BLOCK_REMINDER",
  "block_id": "uuid",
  "hour": "08:00",
  "is_enabled": true
}
```

Las tareas dentro del bloque heredan este recordatorio.

### 4.9 Módulo de Sincronización

#### 4.9.1 Endpoints de Sync

```
POST /sync/pull
POST /sync/push
```

#### 4.9.2 Pull (Obtener cambios del servidor)

**Request Body:**

```json
{
  "last_sync_token": "token-o-momento-ultimo-sync"
}
```

**Response:**

```json
{
  "data": {
    "sync_token": "nuevo-token-unico",
    "changes": [
      {
        "entity_type": "TASK_INSTANCE",
        "entity_id": "uuid",
        "action": "UPDATE",
        "payload": {
          "id": "uuid",
          "status": "COMPLETED",
          "completed_at": "2024-01-15T10:00:00Z"
        },
        "timestamp": "2024-01-15T10:00:01Z"
      }
    ]
  }
}
```

#### 4.9.3 Push (Enviar cambios locales)

**Request Body:**

```json
{
  "changes": [
    {
      "entity_type": "TASK_INSTANCE",
      "action": "UPDATE",
      "entity_id": "uuid",
      "payload": {
        "status": "COMPLETED",
        "completed_at": "2024-01-15T10:00:00Z"
      }
    }
  ]
}
```

**Response:**

```json
{
  "data": {
    "accepted": ["uuid"],
    "rejected": [],
    "sync_token": "nuevo-token"
  }
}
```

---

## Sección 5: DTOs y Validación (Zod)

### 5.1 Auth DTOs

#### 5.1.1 Google Login DTO

```typescript
// auth/dto/google-login.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(100), // Google ID Token
});

export class GoogleLoginDto extends createZodDto(googleLoginSchema) {}
```

#### 5.1.2 Apple Login DTO

```typescript
// auth/dto/apple-login.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const appleLoginSchema = z.object({
  identityToken: z.string().min(100), // Apple Identity Token
  userIdentifier: z.string().optional(), // Para匹配既存用户
});

export class AppleLoginDto extends createZodDto(appleLoginSchema) {}
```

#### 5.1.3 Refresh Token DTO

```typescript
// auth/dto/refresh-token.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().uuid(), // UUID del refresh token
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
```

#### 5.1.4 Logout DTO

```typescript
// auth/dto/logout.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const logoutSchema = z.object({
  refreshToken: z.string().uuid(),
});

export class LogoutDto extends createZodDto(logoutSchema) {}
```

### 5.2 Blocks DTOs

#### 5.2.1 Create Block DTO

```typescript
// blocks/dto/create-block.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createBlockSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional(),
  activeDays: z
    .array(z.number().min(0).max(6))
    .default([0, 1, 2, 3, 4, 5, 6]),
  sortOrder: z.number().int().optional(),
});

export class CreateBlockDto extends createZodDto(createBlockSchema) {}
```

**Validaciones de negocio:**
- El usuario debe tener al menos 1 bloque después de crear
- activeDays no puede estar vacío

#### 5.2.2 Update Block DTO

```typescript
// blocks/dto/update-block.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateBlockSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().nullable().optional(),
  activeDays: z
    .array(z.number().min(0).max(6))
    .min(1)
    .optional(),
  sortOrder: z.number().int().optional(),
});

export class UpdateBlockDto extends createZodDto(updateBlockSchema) {}
```

#### 5.2.3 Delete Block DTO

```typescript
// blocks/dto/delete-block.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const deleteBlockSchema = z.object({
  action: z.enum(['reassign', 'delete']),
  targetBlockId: z.string().uuid().optional(), // Requerido si action=reassign
});

export class DeleteBlockDto extends createZodDto(deleteBlockSchema) {}
```

### 5.3 Loops DTOs

#### 5.3.1 Create Loop DTO

```typescript
// loops/dto/create-loop.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createLoopSchema = z.object({
  blockId: z.string().uuid(),
  title: z.string().min(1).max(100),
  icon: z.string().optional(),
  weekDays: z
    .array(z.number().min(0).max(6))
    .min(1)
    .max(7),
  isPaused: z.boolean().default(false),
});

export class CreateLoopDto extends createZodDto(createLoopSchema) {}
```

**Validaciones de negocio:**
- El bloque debe existir y pertenecer al usuario
- weekDays no puede estar vacío

#### 5.3.2 Update Loop DTO

```typescript
// loops/dto/update-loop.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateLoopSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  icon: z.string().nullable().optional(),
  weekDays: z
    .array(z.number().min(0).max(6))
    .min(1)
    .max(7)
    .optional(),
  isPaused: z.boolean().optional(),
});

export class UpdateLoopDto extends createZodDto(updateLoopSchema) {}
```

#### 5.3.3 Delete Loop DTO

```typescript
// loops/dto/delete-loop.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const deleteLoopSchema = z.object({
  scope: z.enum(['all', 'today']).default('all'),
});

export class DeleteLoopDto extends createZodDto(deleteLoopSchema) {}
```

### 5.4 Tasks DTOs

#### 5.4.1 Quick Add Task DTO

```typescript
// tasks/dto/quick-add.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema base compartido
const taskBaseSchema = z.object({
  title: z.string().min(1).max(100),
  icon: z.string().optional(),
  blockId: z.string().uuid(),
});

// One-off specific
const oneOffSchema = taskBaseSchema.extend({
  type: z.literal('one_off'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

// Loop specific
const loopSchema = taskBaseSchema.extend({
  type: z.literal('loop'),
  weekDays: z
    .array(z.number().min(0).max(6))
    .min(1)
    .max(7),
});

// Union
export const quickAddTaskSchema = z.union([oneOffSchema, loopSchema]);

export class QuickAddTaskDto extends createZodDto(quickAddTaskSchema) {}
```

**Validaciones de negocio:**
- Para one-off: date no puede ser anterior a hoy (configurable)
- Para loop: weekDays no puede estar vacío

#### 5.4.2 Update Task DTO

```typescript
// tasks/dto/update-task.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  icon: z.string().nullable().optional(),
  blockId: z.string().uuid().optional(),
});

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
```

#### 5.4.3 Check/Uncheck/Skip DTOs

Estos endpoints no requieren body, solo el ID en la URL.

### 5.5 Users DTOs

#### 5.5.1 Update User DTO

```typescript
// users/dto/update-user.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(), // IANA timezone
  dayCutoffHour: z.number().min(0).max(6).optional(),
  fcmToken: z.string().optional(),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
```

**Validaciones de negocio:**
- timezone debe ser un IANA timezone válido
- dayCutoffHour entre 0 y 6 (hora de corte del día)

### 5.6 Insights DTOs

#### 5.6.1 Date Params DTO

```typescript
// insights/dto/date-params.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const dateParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export class DateParamsDto extends createZodDto(dateParamsSchema) {}
```

#### 5.6.2 Month Params DTO

```typescript
// insights/dto/month-params.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const monthParamsSchema = z.object({
  year: z.number().min(2024).max(2100),
  month: z.number().min(1).max(12),
});

export class MonthParamsDto extends createZodDto(monthParamsSchema) {}
```

### 5.7 Reminders DTOs

#### 5.7.1 Create Reminder DTO

```typescript
// reminders/dto/create-reminder.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Day close reminder
const dayCloseSchema = z.object({
  type: z.literal('DAY_CLOSE'),
  hour: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  isEnabled: z.boolean().default(true),
});

// Block reminder
const blockReminderSchema = z.object({
  type: z.literal('BLOCK_REMINDER'),
  blockId: z.string().uuid(),
  hour: z.string().regex(/^\d{2}:\d{2}$/),
  isEnabled: z.boolean().default(true),
});

export const createReminderSchema = z.union([dayCloseSchema, blockReminderSchema]);

export class CreateReminderDto extends createZodDto(createReminderSchema) {}
```

#### 5.7.2 Update Reminder DTO

```typescript
// reminders/dto/update-reminder.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateReminderSchema = z.object({
  hour: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isEnabled: z.boolean().optional(),
});

export class UpdateReminderDto extends createZodDto(updateReminderSchema) {}
```

### 5.8 Sync DTOs

#### 5.8.1 Sync Pull DTO

```typescript
// sync/dto/sync-pull.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const syncPullSchema = z.object({
  lastSyncToken: z.string().optional(), // Si es null, sync completo
});

export class SyncPullDto extends createZodDto(syncPullSchema) {}
```

#### 5.8.2 Sync Push DTO

```typescript
// sync/dto/sync-push.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const syncChangeSchema = z.object({
  entityType: z.enum([
    'TASK_INSTANCE',
    'LOOP',
    'BLOCK',
    'ONE_OFF',
    'REMINDER',
  ]),
  entityId: z.string().uuid(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.record(z.any()).optional(), // Para CREATE/UPDATE
});

export const syncPushSchema = z.object({
  changes: z.array(syncChangeSchema).max(100), // Max 100 cambios por push
});

export class SyncPushDto extends createZodDto(syncPushSchema) {}
```

#### 5.8.3 Sync Response DTO

```typescript
// sync/dto/sync-response.dto.ts
export interface SyncAcceptedItem {
  entityId: string;
  entityType: string;
  serverVersion?: number;
}

export interface SyncRejectedItem {
  entityId: string;
  reason: string;
  code: string; // CONFLICT, NOT_FOUND, INVALID
}

export interface SyncPushResponse {
  accepted: SyncAcceptedItem[];
  rejected: SyncRejectedItem[];
  syncToken: string;
}

export interface SyncPullResponse {
  syncToken: string;
  changes: SyncChange[];
  serverTime: Date;
}

interface SyncChange {
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}
```

---

## Sección 6: Lógica de Negocio

### 6.1 Cálculo de Streak

El cálculo de streak es una de las operaciones más frecuentes y debe ser eficiente.

#### 6.1.1 Algoritmo Principal

```typescript
// common/utils/streak.util.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class StreakCalculator {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCurrentStreak(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empezar desde hoy e ir hacia atrás
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const daySummary = await this.prisma.daySummary.findUnique({
        where: {
          user_id_date: {
            user_id: userId,
            date: currentDate,
          },
        },
      });

      if (!daySummary) {
        // Verificar si hay tareas para este día
        const taskCount = await this.prisma.taskInstance.count({
          where: {
            user_id: userId,
            date: currentDate,
            status: { not: 'SKIPPED' },
          },
        });

        if (taskCount === 0) {
          // Día sin tareas, es neutral
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }

        // Hay tareas pero no hay resumen, calcular
        const calculatedSummary = await this.calculateDaySummary(
          userId,
          currentDate,
        );
        if (calculatedSummary.dayResult === 'PERFECT') {
          streak++;
        } else {
          break; // Streak roto
        }
      } else if (daySummary.dayResult === 'PERFECT') {
        streak++;
      } else {
        break; // Streak roto
      }

      // No contar días sin tareas hacia atrás infinitamente
      // Si encontramos 7 días neutrales seguidos, parar
      if (streak > 0 && daySummary.dayResult === 'NO_TASKS') {
        const daysToCheck = 7;
        const neutralDays = await this.countConsecutiveNeutralDays(
          userId,
          currentDate,
          daysToCheck,
        );
        if (neutralDays >= daysToCheck) {
          break;
        }
      }

      currentDate.setDate(currentDate.getDate() - 1);

      // Limite de búsqueda: 365 días hacia atrás
      if (streak > 365) break;
    }

    return streak;
  }

  async calculateBestStreak(userId: string): Promise<number> {
    // Similar pero buscando el máximo histórico
    // Puede ser costoso, considerar cachear
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { best_streak: true },
    });

    return user?.best_streak || 0;
  }

  async updateUserStreak(userId: string): Promise<void> {
    const currentStreak = await this.calculateCurrentStreak(userId);
    const bestStreak = await this.calculateBestStreak(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        current_streak: currentStreak,
        best_streak: Math.max(currentStreak, bestStreak),
      },
    });
  }

  private async calculateDaySummary(
    userId: string,
    date: Date,
  ): Promise<DaySummaryResult> {
    const tasks = await this.prisma.taskInstance.findMany({
      where: {
        user_id: userId,
        date: date,
      },
    });

    const total = tasks.filter((t) => t.status !== 'SKIPPED').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;

    if (total === 0) {
      return {
        dayResult: 'NO_TASKS',
        totalTasks: 0,
        completedTasks: 0,
        completionPercentage: 0,
        streakContinued: false,
      };
    }

    const percentage = (completed / total) * 100;
    const dayResult =
      percentage === 100 ? 'PERFECT' : percentage > 0 ? 'PARTIAL' : 'NONE';

    return {
      dayResult,
      totalTasks: total,
      completedTasks: completed,
      completionPercentage: percentage,
      streakContinued: dayResult === 'PERFECT',
    };
  }

  private async countConsecutiveNeutralDays(
    userId: string,
    date: Date,
    limit: number,
  ): Promise<number> {
    let count = 0;
    const checkDate = new Date(date);

    for (let i = 0; i < limit; i++) {
      checkDate.setDate(checkDate.getDate() - 1);

      const summary = await this.prisma.daySummary.findUnique({
        where: {
          user_id_date: {
            user_id: userId,
            date: checkDate,
          },
        },
      });

      if (summary?.dayResult === 'NO_TASKS') {
        count++;
      } else {
        break;
      }
    }

    return count;
  }
}

interface DaySummaryResult {
  dayResult: 'PERFECT' | 'PARTIAL' | 'NONE' | 'NO_TASKS';
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  streakContinued: boolean;
}
```

#### 6.1.2 Actualización de Streak

El streak se recalcula cuando:
- Se completa una tarea (POST /tasks/:id/check)
- Se descomenta una tarea (POST /tasks/:id/uncheck)
- Se hace skip de una tarea (POST /tasks/:id/skip)
- Se elimina una tarea
- Se edita una tarea de días pasados (dentro de 7 días)

### 6.2 Generación de TaskInstances

#### 6.2.1 Generación Inicial (al crear loop)

```typescript
// loops/loops.service.ts
async createLoop(userId: string, dto: CreateLoopDto) {
  // 1. Crear el loop
  const loop = await this.prisma.loop.create({
    data: {
      user_id: userId,
      block_id: dto.blockId,
      title: dto.title,
      icon: dto.icon,
      week_days: dto.weekDays,
      is_paused: dto.isPaused,
    },
  });

  // 2. Generar task instances para próximos 7 días
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = this.dateUtils.getNextDays(today, 7).filter((date) =>
    this.dateUtils.matchesWeekDays(date, dto.weekDays),
  );

  const taskInstances = next7Days.map((date) => ({
    loop_id: loop.id,
    block_id: dto.blockId,
    user_id: userId,
    date: date,
    status: 'TODO' as const,
    is_synced: true,
  }));

  if (taskInstances.length > 0) {
    await this.prisma.taskInstance.createMany({ data: taskInstances });
  }

  // 3. Invalidar cache
  await this.cacheService.invalidateUserHome(userId);

  return loop;
}
```

#### 6.2.2 Regeneración al Editar Loop

```typescript
// loops/loops.service.ts
async updateLoop(loopId: string, dto: UpdateLoopDto, userId: string) {
  const loop = await this.prisma.loop.findUnique({
    where: { id: loopId },
    include: { task_instances: true },
  });

  // Actualizar loop
  const updatedLoop = await this.prisma.loop.update({
    where: { id: loopId },
    data: {
      title: dto.title,
      icon: dto.icon,
      week_days: dto.weekDays,
      is_paused: dto.isPaused,
    },
  });

  // Si weekDays cambió, regenerar task instances
  if (dto.weekDays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Eliminar task instances pendientes de los próximos 7 días
    await this.prisma.taskInstance.deleteMany({
      where: {
        loop_id: loopId,
        date: { gte: today },
        status: 'TODO',
      },
    });

    // Generar nuevas
    const next7Days = this.dateUtils.getNextDays(today, 7).filter((date) =>
      this.dateUtils.matchesWeekDays(date, dto.weekDays),
    );

    const newInstances = next7Days.map((date) => ({
      loop_id: loopId,
      block_id: updatedLoop.block_id,
      user_id: userId,
      date: date,
      status: 'TODO' as const,
      is_synced: true,
    }));

    if (newInstances.length > 0) {
      await this.prisma.taskInstance.createMany({ data: newInstances });
    }

    // Recalcular day summaries de los días afectados
    await this.recalculateAffectedDaySummaries(userId, next7Days);
  }

  // Invalidar cache
  await this.cacheService.invalidateUserHome(userId);

  return updatedLoop;
}
```

#### 6.2.3 Scheduled Job (Extensión de 7 días)

```typescript
// common/scheduler/task-instances.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { DateUtils } from '../utils/date.utils';

@Injectable()
export class TaskInstancesScheduler {
  private readonly logger = new Logger(TaskInstancesScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dateUtils: DateUtils,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async extendTaskInstances(): Promise<void> {
    this.logger.log('Extending task instances by 7 days...');

    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await this.extendUserTaskInstances(user.id);
    }

    this.logger.log(`Extended task instances for ${users.length} users`);
  }

  async extendUserTaskInstances(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener última fecha pre-generada
    const lastInstance = await this.prisma.taskInstance.findFirst({
      where: {
        user_id: userId,
        date: { gte: today },
      },
      orderBy: { date: 'desc' },
    });

    if (!lastInstance) {
      // El usuario no tiene task instances, skip
      return;
    }

    const lastGeneratedDate = new Date(lastInstance.date);
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7);

    if (lastGeneratedDate >= targetDate) {
      // Ya hay coverage de 7 días
      return;
    }

    // Obtener loops activos del usuario
    const loops = await this.prisma.loop.findMany({
      where: {
        user_id: userId,
        is_paused: false,
      },
    });

    // Generar task instances para días faltantes
    const missingDates = this.dateUtils.getDateRange(
      lastGeneratedDate,
      targetDate,
    );

    const instancesToCreate = [];

    for (const date of missingDates) {
      for (const loop of loops) {
        if (this.dateUtils.matchesWeekDays(date, loop.week_days)) {
          // Verificar si ya existe
          const exists = await this.prisma.taskInstance.findFirst({
            where: {
              loop_id: loop.id,
              date: date,
            },
          });

          if (!exists) {
            instancesToCreate.push({
              loop_id: loop.id,
              block_id: loop.block_id,
              user_id: userId,
              date: date,
              status: 'TODO' as const,
              is_synced: true,
            });
          }
        }
      }
    }

    if (instancesToCreate.length > 0) {
      await this.prisma.taskInstance.createMany({
        data: instancesToCreate,
      });
    }
  }
}
```

### 6.3 Manejo de Skips

```typescript
// tasks/tasks.service.ts
async skipTask(taskId: string, userId: string): Promise<TaskInstance> {
  const task = await this.prisma.taskInstance.findUnique({
    where: { id: taskId },
    include: { loop: true },
  });

  // Validaciones
  if (!task || task.user_id !== userId) {
    throw new NotFoundException('Task not found');
  }

  if (!task.loop_id) {
    throw new BadRequestException('Cannot skip one-off tasks');
  }

  if (task.status === 'COMPLETED') {
    throw new BadRequestException('Cannot skip completed task');
  }

  // Actualizar a SKIPPED
  const skippedTask = await this.prisma.taskInstance.update({
    where: { id: taskId },
    data: {
      status: 'SKIPPED',
    },
  });

  // Recalcular streak y day summary
  await this.recalculateDaySummaryAndStreak(userId, task.date);

  // Invalidar cache
  await this.cacheService.invalidateUserHome(userId);

  return skippedTask;
}
```

### 6.4 Recálculo de DaySummaries

```typescript
// common/services/day-summary.service.ts
@Injectable()
export class DaySummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streakCalculator: StreakCalculator,
  ) {}

  async recalculateForDate(userId: string, date: Date): Promise<DaySummary> {
    const dateOnly = this.dateUtils.toDateOnly(date);

    // Calcular estadísticas del día
    const tasks = await this.prisma.taskInstance.findMany({
      where: {
        user_id: userId,
        date: dateOnly,
      },
    });

    const total = tasks.filter((t) => t.status !== 'SKIPPED').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;

    let dayResult: DayResult;
    let completionPercentage: number;
    let streakContinued: boolean;

    if (total === 0) {
      dayResult = 'NO_TASKS';
      completionPercentage = 0;
      streakContinued = false;
    } else {
      completionPercentage = (completed / total) * 100;
      dayResult =
        completionPercentage === 100
          ? 'PERFECT'
          : completionPercentage > 0
            ? 'PARTIAL'
            : 'NONE';

      // Verificar streak anterior
      const yesterday = new Date(dateOnly);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdaySummary = await this.prisma.daySummary.findUnique({
        where: {
          user_id_date: {
            user_id: userId,
            date: yesterday,
          },
        },
      });

      streakContinued =
        dayResult === 'PERFECT' &&
        yesterdaySummary?.streak_continued !== false;
    }

    // Upsert DaySummary
    const summary = await this.prisma.daySummary.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: dateOnly,
        },
      },
      update: {
        total_tasks: total,
        completed_tasks: completed,
        completion_percentage: completionPercentage,
        day_result: dayResult,
        streak_continued: streakContinued,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        date: dateOnly,
        total_tasks: total,
        completed_tasks: completed,
        completion_percentage: completionPercentage,
        day_result: dayResult,
        streak_continued: streakContinued,
      },
    });

    // Actualizar streak del usuario
    await this.streakCalculator.updateUserStreak(userId);

    return summary;
  }

  async recalculateForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const dates = this.dateUtils.getDateRange(startDate, endDate);

    for (const date of dates) {
      await this.recalculateForDate(userId, date);
    }
  }
}
```

### 6.5 Lógica de Editar Días Pasados

```typescript
// tasks/tasks.service.ts
private readonly EDITABLE_DAYS_LIMIT = 7;

async checkTask(taskId: string, userId: string): Promise<TaskInstance> {
  const task = await this.prisma.taskInstance.findUnique({
    where: { id: taskId },
  });

  if (!task || task.user_id !== userId) {
    throw new NotFoundException('Task not found');
  }

  // Verificar si está dentro del límite editable
  const taskDate = new Date(task.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff > this.EDITABLE_DAYS_LIMIT) {
    throw new BadRequestException(
      `Cannot edit tasks older than ${this.EDITABLE_DAYS_LIMIT} days`,
    );
  }

  // Actualizar
  const completedTask = await this.prisma.taskInstance.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      completed_at: new Date(),
    },
  });

  // Recalcular day summary y streak
  await this.daySummaryService.recalculateForDate(userId, task.date);

  // Invalidar cache
  await this.cacheService.invalidateUserHome(userId);

  return completedTask;
}
```

### 6.6 Sincronización Offline

```typescript
// sync/sync.service.ts
@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async push(userId: string, changes: SyncPushDto): Promise<SyncPushResponse> {
    const accepted: SyncAcceptedItem[] = [];
    const rejected: SyncRejectedItem[] = [];

    for (const change of changes.changes) {
      try {
        // Agregar a cola de sync
        await this.prisma.syncQueue.create({
          data: {
            user_id: userId,
            entity_type: change.entityType,
            entity_id: change.entityId,
            action: change.action,
            payload: change.payload,
            status: 'PENDING',
            retry_count: 0,
          },
        });

        accepted.push({
          entityId: change.entityId,
          entityType: change.entityType,
        });
      } catch (error) {
        rejected.push({
          entityId: change.entityId,
          reason: error.message,
          code: 'INTERNAL_ERROR',
        });
      }
    }

    // Generar nuevo sync token
    const syncToken = this.generateSyncToken();

    return {
      accepted,
      rejected,
      syncToken,
    };
  }

  async pull(
    userId: string,
    lastSyncToken?: string,
  ): Promise<SyncPullResponse> {
    // Obtener cambios desde último sync
    const lastSyncDate = lastSyncToken
      ? this.decodeSyncToken(lastSyncToken)
      : new Date(0);

    const changes = await this.prisma.changeLog.findMany({
      where: {
        user_id: userId,
        created_at: { gt: lastSyncDate },
      },
      orderBy: { created_at: 'asc' },
      take: 1000, // Límite por request
    });

    // Generar nuevo sync token
    const syncToken = this.generateSyncToken();

    return {
      syncToken,
      changes: changes.map((c) => ({
        entityType: c.entity_type,
        entityId: c.entity_id,
        action: c.action,
        payload: c.payload,
        timestamp: c.created_at,
      })),
      serverTime: new Date(),
    };
  }

  async processSyncQueue(): Promise<void> {
    // Procesar entradas PENDING
    const pendingEntries = await this.prisma.syncQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { created_at: 'asc' },
      take: 100,
    });

    for (const entry of pendingEntries) {
      try {
        await this.applyChange(entry);
        await this.prisma.syncQueue.update({
          where: { id: entry.id },
          data: {
            status: 'COMPLETED',
            processed_at: new Date(),
          },
        });
      } catch (error) {
        await this.handleSyncError(entry, error);
      }
    }
  }

  private async applyChange(entry: SyncQueue): Promise<void> {
    switch (entry.action) {
      case 'CREATE':
        await this.applyCreate(entry);
        break;
      case 'UPDATE':
        await this.applyUpdate(entry);
        break;
      case 'DELETE':
        await this.applyDelete(entry);
        break;
    }

    // Crear ChangeLog para otros dispositivos
    await this.prisma.changeLog.create({
      data: {
        user_id: entry.user_id,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        payload: entry.payload,
      },
    });
  }

  private async applyCreate(entry: SyncQueue): Promise<void> {
    // Implementar según entity_type
    switch (entry.entity_type) {
      case 'TASK_INSTANCE':
        await this.prisma.taskInstance.create({
          data: entry.payload as any,
        });
        break;
      // ... otros casos
    }
  }

  // ... applyUpdate, applyDelete, handleSyncError
}
```

---

## Sección 7: Servicios y Utilidades

### 7.1 DateUtils

```typescript
// common/utils/date.utils.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DateUtils {
  /**
   * Convierte Date a solo fecha (YYYY-MM-DD)
   */
  toDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Formatea fecha a string YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parsea string YYYY-MM-DD a Date
   */
  parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Obtiene los próximos N días desde una fecha
   */
  getNextDays(fromDate: Date, count: number): Date[] {
    const days: Date[] = [];
    const date = new Date(fromDate);

    for (let i = 0; i < count; i++) {
      date.setDate(date.getDate() + 1);
      days.push(new Date(date));
    }

    return days;
  }

  /**
   * Obtiene rango de fechas entre dos fechas
   */
  getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Verifica si una fecha coincide con los días de semana
   * @param date Fecha a verificar
   * @param weekDays Array de días (0=Dom, 6=Sáb)
   */
  matchesWeekDays(date: Date, weekDays: number[]): boolean {
    const dayOfWeek = date.getDay();
    return weekDays.includes(dayOfWeek);
  }

  /**
   * Convierte array de días a bitmask
   */
  daysToBitmask(days: number[]): number {
    return days.reduce((mask, day) => mask | (1 << day), 0);
  }

  /**
   * Convierte bitmask a array de días
   */
  bitmaskToDays(bitmask: number): number[] {
    const days: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (bitmask & (1 << i)) {
        days.push(i);
      }
    }
    return days;
  }

  /**
   * Verifica si el día actual está activo para el bloque
   */
  isActiveToday(activeDays: number[]): boolean {
    const today = new Date();
    return this.matchesWeekDays(today, activeDays);
  }

  /**
   * Obtiene el día de la semana (0-6) de una fecha
   */
  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * Verifica si una fecha es hoy
   */
  isToday(date: Date): boolean {
    const today = new Date();
    const d = this.toDateOnly(date);
    return d.getTime() === today.getTime();
  }

  /**
   * Verifica si una fecha es ayer
   */
  isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const d = this.toDateOnly(date);
    return d.getTime() === yesterday.getTime();
  }

  /**
   * Obtiene el inicio de la semana (Lunes)
   */
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Obtiene el inicio del mes
   */
  getMonthStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Suma días a una fecha
   */
  addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Resta días a una fecha
   */
  subDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Calcula diferencia en días entre dos fechas
   */
  diffDays(date1: Date, date2: Date): number {
    const d1 = this.toDateOnly(date1);
    const d2 = this.toDateOnly(date2);
    return Math.floor(
      (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  /**
   * Formatea hora a HH:mm
   */
  formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Parsea hora HH:mm a Date
   */
  parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }
}
```

### 7.2 StreakCalculator

Ver Sección 6.1.

### 7.3 SyncService

Ver Sección 6.6.

### 7.4 FCMService

```typescript
// common/services/fcm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FCMService {
  private readonly logger = new Logger(FCMService.name);
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    // Inicializar Firebase Admin SDK
    // Configuración desde environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    this.initialized = true;
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title,
          body,
        },
        data,
      });
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      // No lanzar error, no crítico
    }
  }

  async sendDayCloseReminder(
    token: string,
    dayResult: string,
    completedTasks: number,
    totalTasks: number,
  ): Promise<void> {
    const body =
      dayResult === 'PERFECT'
        ? `¡Día perfecto! Completaste ${completedTasks}/${totalTasks} tareas. 🎉`
        : `Has completado ${completedTasks}/${totalTasks} tareas hoy.`;

    await this.sendNotification(
      token,
      'Resumen del día',
      body,
      {
        type: 'DAY_CLOSE',
        day_result: dayResult,
      },
    );
  }

  async sendBlockReminder(
    token: string,
    blockName: string,
    pendingTasksCount: number,
  ): Promise<void> {
    const body = `Tienes ${pendingTasksCount} tareas pendientes en ${blockName}`;

    await this.sendNotification(
      token,
      `Recordatorio: ${blockName}`,
      body,
      {
        type: 'BLOCK_REMINDER',
        block_name: blockName,
      },
    );
  }

  async sendStreakMilestone(
    token: string,
    streak: number,
  ): Promise<void> {
    await this.sendNotification(
      token,
      '¡Felicidades! 🎉',
      `Has mantenido tu racha por ${streak} días consecutivos. ¡Sigue así!`,
      {
        type: 'STREAK_MILESTONE',
        streak: streak.toString(),
      },
    );
  }
}
```

---

## Sección 8: Estructura de Archivos

### 8.1 Nuevos Módulos

```
backend/src/modules/
├── auth/                   # Modificar existente
│   ├── auth.controller.ts  # Agregar Google/Apple endpoints
│   ├── auth.service.ts     # Agregar lógica OAuth
│   ├── auth.module.ts
│   ├── strategies/
│   │   ├── google.strategy.ts
│   │   └── apple.strategy.ts
│   └── dto/
│       ├── google-login.dto.ts
│       ├── apple-login.dto.ts
│       ├── refresh-token.dto.ts
│       └── logout.dto.ts
│
├── users/                  # Modificar existente
│   ├── users.controller.ts # Agregar PATCH /users/me
│   ├── users.service.ts    # Agregar update logic
│   ├── users.module.ts
│   └── dto/
│       └── update-user.dto.ts
│
├── blocks/
│   ├── blocks.controller.ts
│   ├── blocks.service.ts
│   ├── blocks.module.ts
│   └── dto/
│       ├── create-block.dto.ts
│       ├── update-block.dto.ts
│       └── delete-block.dto.ts
│
├── loops/
│   ├── loops.controller.ts
│   ├── loops.service.ts
│   ├── loops.module.ts
│   └── dto/
│       ├── create-loop.dto.ts
│       ├── update-loop.dto.ts
│       └── delete-loop.dto.ts
│
├── tasks/
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   ├── tasks.module.ts
│   └── dto/
│       ├── quick-add.dto.ts
│       └── update-task.dto.ts
│
├── insights/
│   ├── insights.controller.ts
│   ├── insights.service.ts
│   ├── insights.module.ts
│   └── dto/
│       ├── date-params.dto.ts
│       └── month-params.dto.ts
│
├── reminders/
│   ├── reminders.controller.ts
│   ├── reminders.service.ts
│   ├── reminders.module.ts
│   └── dto/
│       ├── create-reminder.dto.ts
│       └── update-reminder.dto.ts
│
└── sync/
    ├── sync.controller.ts
    ├── sync.service.ts
    ├── sync.module.ts
    └── dto/
        ├── sync-pull.dto.ts
        └── sync-push.dto.ts
```

### 8.2 Archivos a Crear

```
backend/src/common/
├── utils/
│   ├── date.utils.ts
│   └── streak.util.ts
├── decorators/
│   └── current-user.decorator.ts  # Verificar si existe
├── services/
│   ├── day-summary.service.ts
│   ├── sync.service.ts
│   └── fcm.service.ts
└── scheduler/
    └── task-instances.scheduler.ts

backend/prisma/
└── schema.prisma  # Agregar modelos

backend/test/
└── dailyloop.e2e-spec.ts  # Tests E2E
```

### 8.3 Modificaciones al Template

#### 8.3.1 Prisma Schema

Agregar los 8 modelos al schema.prisma existente:

```prisma
// Models ya existentes (Users, etc.)

model Block {
  id          String   @id @default(uuid())
  user_id     String   @map("user_id")
  name        String
  icon        String?
  sort_order  Int      @default(0) @map("sort_order")
  active_days Json     @map("active_days")
  created_at  DateTime @default(now()) @map("created_at")
  updated_at  DateTime @updatedAt @map("updated_at")
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  loops       Loop[]
  task_instances TaskInstance[]

  @@map("blocks")
}

model Loop {
  id          String   @id @default(uuid())
  user_id     String   @map("user_id")
  block_id    String   @map("block_id")
  title       String
  icon        String?
  week_days   Json     @map("week_days")
  is_paused   Boolean  @default(false) @map("is_paused")
  created_at  DateTime @default(now()) @map("created_at")
  updated_at  DateTime @updatedAt @map("updated_at")
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  block       Block    @relation(fields: [block_id], references: [id], onDelete: Cascade)
  task_instances TaskInstance[]

  @@map("loops")
}

model OneOff {
  id             String   @id @default(uuid())
  user_id        String   @map("user_id")
  block_id       String   @map("block_id")
  title          String
  icon           String?
  scheduled_date DateTime @map("scheduled_date")
  created_at     DateTime @default(now()) @map("created_at")
  user           User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  block          Block    @relation(fields: [block_id], references: [id], onDelete: Cascade)
  task_instances TaskInstance[]

  @@map("one_offs")
}

model TaskInstance {
  id          String    @id @default(uuid())
  loop_id     String?   @map("loop_id")
  one_off_id  String?   @map("one_off_id")
  block_id    String    @map("block_id")
  user_id     String    @map("user_id")
  date        DateTime  @map("date")
  status      TaskStatus @default(TODO)
  completed_at DateTime? @map("completed_at")
  is_synced   Boolean   @default(true) @map("is_synced")
  created_at  DateTime  @default(now()) @map("created_at")
  updated_at  DateTime  @updatedAt @map("updated_at")
  loop        Loop?     @relation(fields: [loop_id], references: [id], onDelete: Cascade)
  one_off     OneOff?   @relation(fields: [one_off_id], references: [id], onDelete: Cascade)
  block       Block     @relation(fields: [block_id], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("task_instances")
}

model DaySummary {
  id                   String      @id @default(uuid())
  user_id              String      @map("user_id")
  date                 DateTime    @map("date")
  total_tasks          Int         @map("total_tasks")
  completed_tasks      Int         @map("completed_tasks")
  completion_percentage Float       @map("completion_percentage")
  day_result           DayResult   @map("day_result")
  streak_continued     Boolean     @default(false) @map("streak_continued")
  created_at           DateTime    @default(now()) @map("created_at")
  updated_at           DateTime    @updatedAt @map("updated_at")
  user                 User        @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, date]) @map("user_id_date")
  @@map("day_summaries")
}

model Reminder {
  id          String       @id @default(uuid())
  user_id     String       @map("user_id")
  block_id    String?      @map("block_id")
  type        ReminderType
  hour        String       @map("hour")
  is_enabled  Boolean      @default(true) @map("is_enabled")
  created_at  DateTime     @default(now()) @map("created_at")
  updated_at  DateTime     @updatedAt @map("updated_at")
  user        User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  block       Block?       @relation(fields: [block_id], references: [id], onDelete: Cascade)

  @@map("reminders")
}

model SyncQueue {
  id           String     @id @default(uuid())
  user_id      String     @map("user_id")
  entity_type  String     @map("entity_type")
  entity_id    String     @map("entity_id")
  action       String     @map("action")
  payload      Json       @map("payload")
  status       SyncStatus @default(PENDING) @map("status")
  retry_count  Int        @default(0) @map("retry_count")
  created_at   DateTime   @default(now()) @map("created_at")
  processed_at DateTime?  @map("processed_at")
  user         User       @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("sync_queue")
}

// Enums
enum TaskStatus {
  TODO
  COMPLETED
  SKIPPED
}

enum DayResult {
  PERFECT
  PARTIAL
  NONE
  NO_TASKS
}

enum ReminderType {
  DAY_CLOSE
  BLOCK_REMINDER
}

enum SyncStatus {
  PENDING
  PROCESSING
  FAILED
  COMPLETED
}
```

#### 8.3.2 App Module

Registrar los nuevos módulos:

```typescript
// app.module.ts
@Module({
  imports: [
    // ... módulos existentes
    AuthModule,
    UsersModule,
    BlocksModule,      // Nuevo
    LoopsModule,       // Nuevo
    TasksModule,       // Nuevo
    InsightsModule,    // Nuevo
    RemindersModule,   // Nuevo
    SyncModule,        // Nuevo
  ],
})
export class AppModule {}
```

#### 8.3.3 Environment Variables

Agregar al .env.example:

```bash
# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google OAuth (opcional, si se usa passport-google-oauth20)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth (opcional)
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

---

## Sección 9: Testing

### 9.1 Unit Tests

#### 9.1.1 Estructura de Tests

```
backend/src/modules/
├── blocks/
│   ├── blocks.controller.spec.ts
│   ├── blocks.service.spec.ts
├── loops/
│   ├── loops.controller.spec.ts
│   ├── loops.service.spec.ts
├── tasks/
│   ├── tasks.controller.spec.ts
│   ├── tasks.service.spec.ts
├── insights/
│   └── insights.service.spec.ts
└── ...

backend/src/common/
├── utils/
│   └── date.utils.spec.ts
└── services/
    ├── streak.util.spec.ts
    └── day-summary.service.spec.ts
```

#### 9.1.2 Ejemplo: StreakCalculator Test

```typescript
// common/services/streak.util.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StreakCalculator } from './streak.util';
import { PrismaService } from '../../core/database/prisma.service';

describe('StreakCalculator', () => {
  let service: StreakCalculator;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      daySummary: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      taskInstance: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakCalculator,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<StreakCalculator>(StreakCalculator);
    prisma = module.get(PrismaService);
  });

  describe('calculateCurrentStreak', () => {
    it('should return 0 for new user with no history', async () => {
      prisma.daySummary.findUnique.mockResolvedValue(null);
      prisma.taskInstance.count.mockResolvedValue(0);

      const streak = await service.calculateCurrentStreak('user-uuid');

      expect(streak).toBe(0);
    });

    it('should calculate streak correctly with perfect days', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.daySummary.findUnique.mockImplementation(({ where }) => {
        const date = new Date(where.user_id_date.date);
        const daysDiff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 0) {
          return { day_result: 'PERFECT' } as any;
        } else if (daysDiff === 1) {
          return { day_result: 'PERFECT' } as any;
        } else if (daysDiff === 2) {
          return { day_result: 'PARTIAL' } as any;
        }
        return null;
      });

      const streak = await service.calculateCurrentStreak('user-uuid');

      expect(streak).toBe(2);
    });

    it('should break streak on non-perfect day', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.daySummary.findUnique.mockImplementation(({ where }) => {
        const date = new Date(where.user_id_date.date);
        const daysDiff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 0) {
          return { day_result: 'PERFECT' } as any;
        } else if (daysDiff === 1) {
          return { day_result: 'NONE' } as any; // Streak broken
        }
        return null;
      });

      const streak = await service.calculateCurrentStreak('user-uuid');

      expect(streak).toBe(1);
    });

    it('should handle NO_TASKS as neutral', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.daySummary.findUnique.mockImplementation(({ where }) => {
        const date = new Date(where.user_id_date.date);
        const daysDiff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 0) {
          return { day_result: 'PERFECT' } as any;
        } else if (daysDiff === 1) {
          return { day_result: 'NO_TASKS' } as any; // Neutral
        } else if (daysDiff === 2) {
          return { day_result: 'PERFECT' } as any;
        }
        return null;
      });

      const streak = await service.calculateCurrentStreak('user-uuid');

      // NO_TASKS no rompe ni suma, pero permite continuar
      expect(streak).toBe(2);
    });
  });
});
```

#### 9.1.3 Ejemplo: Tasks Service Test

```typescript
// tasks/tasks.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../core/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      taskInstance: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      daySummary: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
  });

  describe('checkTask', () => {
    it('should mark task as completed', async () => {
      const taskId = 'task-uuid';
      const userId = 'user-uuid';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.taskInstance.findUnique.mockResolvedValue({
        id: taskId,
        user_id: userId,
        date: today,
        status: 'TODO',
      } as any);

      prisma.taskInstance.update.mockResolvedValue({
        id: taskId,
        status: 'COMPLETED',
        completed_at: new Date(),
      } as any);

      const result = await service.checkTask(taskId, userId);

      expect(result.status).toBe('COMPLETED');
      expect(prisma.taskInstance.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completed_at: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException for non-existent task', async () => {
      prisma.taskInstance.findUnique.mockResolvedValue(null);

      await expect(
        service.checkTask('non-existent', 'user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error for task older than 7 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      prisma.taskInstance.findUnique.mockResolvedValue({
        id: 'task-uuid',
        user_id: 'user-uuid',
        date: oldDate,
        status: 'TODO',
      } as any);

      await expect(
        service.checkTask('task-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('skipTask', () => {
    it('should skip task and recalculate streak', async () => {
      const taskId = 'task-uuid';
      const userId = 'user-uuid';
      const today = new Date();

      prisma.taskInstance.findUnique.mockResolvedValue({
        id: taskId,
        user_id: userId,
        date: today,
        status: 'TODO',
        loop_id: 'loop-uuid', // Es un loop
      } as any);

      prisma.taskInstance.update.mockResolvedValue({
        id: taskId,
        status: 'SKIPPED',
      } as any);

      const result = await service.skipTask(taskId, userId);

      expect(result.status).toBe('SKIPPED');
    });

    it('should throw error for one-off tasks', async () => {
      prisma.taskInstance.findUnique.mockResolvedValue({
        id: 'task-uuid',
        user_id: 'user-uuid',
        date: new Date(),
        status: 'TODO',
        loop_id: null, // Es one-off
      } as any);

      await expect(
        service.skipTask('task-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

### 9.2 Integration Tests

#### 9.2.1 Ejemplo: API Integration Test

```typescript
// test/insights.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';

describe('InsightsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  const userId = 'test-user-uuid';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup: Create test user and data
    await prisma.user.create({
      data: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'America/Buenos_Aires',
        day_cutoff_hour: 3,
      },
    });

    // Get auth token (simplified for example)
    authToken = await getTestAuthToken(userId);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  describe('GET /insights/streak', () => {
    it('should return streak data', async () => {
      // Create some completed tasks for perfect days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        await prisma.daySummary.create({
          data: {
            user_id: userId,
            date: date,
            total_tasks: 3,
            completed_tasks: 3,
            completion_percentage: 100,
            day_result: 'PERFECT',
            streak_continued: i < 4,
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get('/insights/streak')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.current_streak).toBe(5);
      expect(response.body.data.best_streak).toBe(5);
    });
  });
});
```

### 9.3 Testing Coverage Goals

- **Unit tests:** 80% coverage en servicios de negocio
- **Integration tests:** Cover happy paths y errores principales
- **E2E tests:** Flujos críticos (auth → crear loop → completar → insights)

---

## Sección 10: Verificación y Deployment

### 10.1 Comandos de Verificación

```bash
# Verificar que el schema Prisma es válido
cd backend
npx prisma validate

# Generar cliente Prisma
npx prisma generate

# Crear y aplicar migraciones
npx prisma migrate dev --name dailyloop

# Verificar que el código compila
npm run build

# Ejecutar tests unitarios
npm run test

# Ejecutar tests con coverage
npm run test:cov

# Verificar linting
npm run lint

# Iniciar servidor de desarrollo
npm run start:dev

# Verificar en Swagger
# http://localhost:3000/api/docs
```

### 10.2 Migration Guide

#### Paso 1: Preparar el Schema

```bash
# Backup de la base de datos existente (producción)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

#### Paso 2: Aplicar Migración

```bash
# Desarrollo
npx prisma migrate dev --name dailyloop

# Staging/Producción
npx prisma migrate deploy
```

#### Paso 3: Verificar Migración

```bash
# Verificar que las tablas fueron creadas
npx prisma studio

# O verificar con SQL
psql $DATABASE_URL -c "\dt"
```

#### Rollback (si es necesario)

```bash
# Revertir última migración
npx prisma migrate rollback

# O aplicar backup
psql $DATABASE_URL < backup-20240111.sql
```

### 10.3 Checklist de Release

#### Pre-Release
- [ ] Tests pasando (unit + integration)
- [ ] Coverage >= 70% en servicios críticos
- [ ] Schema Prisma validado
- [ ] Migración probada en staging
- [ ] Variables de entorno configuradas
- [ ] Documentación API actualizada (Swagger)
- [ ] Logs de errores configurados
- [ ] Rate limiting configurado

#### Post-Deploy
- [ ] Health check pasando
- [ ] Métricas visibles (si hay monitoring)
- [ ] Sin errores en logs
- [ ] Auth funcionando (Google/Apple login)
- [ ] Crear/editar/borrar bloques funcionando
- [ ] Crear/editar/borrar loops funcionando
- [ ] Completar/skip/tareas funcionando
- [ ] Insights (streak, heatmap) calculando correctamente
- [ ] Recordatorios configurables
- [ ] Sincronización funcionando

#### Rollback Plan
- [ ] Backup de DB disponible
- [ ] Imagen Docker anterior taggeada
- [ ] DNS/load balancer configurado para rollback

---

## Apéndice A: Glosario de Términos

| Término | Definición |
|---------|------------|
| Loop | Tarea recurrente que se repite según días de semana |
| One-off | Tarea para una fecha específica única |
| Task Instance | Instancia de un loop o one-off en un día específico |
| Perfect Day | Día con 100% de tareas completadas |
| Streak | Días consecutivos con Perfect Day |
| Bitmask | Representación binaria de días de la semana |
| Day Cutoff | Hora del día que define cuándo "termina" el día (0-6 AM) |
| FCM | Firebase Cloud Messaging para notificaciones push |

## Apéndice B: APIs Externas Requeridas

| Servicio | Propósito | Documentación |
|----------|-----------|---------------|
| Google OAuth | Login con Google | developers.google.com/identity/protocols/oauth2 |
| Apple Sign In | Login con Apple | developer.apple.com/sign-in-with-apple |
| Firebase Cloud Messaging | Notificaciones push | firebase.google.com/docs/cloud-messaging |

## Apéndice C: Referencias

- NestJS Documentation: https://docs.nestjs.com/
- Prisma Documentation: https://www.prisma.io/docs/
- Zod Documentation: https://zod.dev/
- JWT.io: https://jwt.io/

