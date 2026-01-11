Perfecto. Con esto ya cierro un **PRD v1 funcional** (mobile only, minimal, loops + to-do rápido, streaks, cierre del día, insights con heatmap tipo GitHub). También resuelvo tu duda clave de **bloques no globales** con una lógica simple que no te complica el producto.

---

## PRD v1 · DailyLoop (Funcional)

### Estado

- Versión: v1 (MVP publicable)
- Plataforma: Mobile only
- Modelo: Free
- Login: Obligatorio (OAuth Google / Apple)

---

# 1) Visión del producto

DailyLoop es una app minimalista para organizar el día mezclando:

- **Loops**: hábitos/rutinas recurrentes (con días de semana custom).
- **To-dos rápidos**: tareas one-off que agregás en segundos.

El foco está en **claridad diaria + constancia**, con gamificación suave:

- **Streak** por “día perfecto”
- **Cierre del día** con resumen amigable
- **Insights** visuales (calendario + heatmap anual)

---

# 2) Objetivos del producto

### Objetivos (v1)

- Que un usuario pueda **armar su día en < 60 segundos**.
- Que se pueda **mantener un loop** sin fricción (tareas recurrentes aparecen solas).
- Que la constancia se sienta con **streak + heatmap**.
- Que todo se mantenga **minimal** (pocas decisiones, pocos menús).

### No objetivos (v1)

- Horarios por tarea (no calendar).
- Proyectos, etiquetas complejas, colaboración.
- Métricas avanzadas tipo “productividad hardcore”.

---

# 3) Definiciones funcionales (para hablar todos igual)

**Bloque**
Agrupador visual del día (ej: Morning, Workload, Night). Personalizable.

**Tarea one-off**
Tarea para una fecha puntual.

**Loop**
Tarea recurrente con días de semana seleccionados.

**Estado de tarea**

- To Do
- Completed
  (No existe Pending en v1.)

---

# 4) Decisión clave: bloques no globales (tu punto 8)

Querés bloques que no siempre aparezcan (ej Workload no en finde). Sin romper la simplicidad, propongo:

### Modelo recomendado (simple y coherente)

- **La recurrencia la define la tarea (Loop)**, no el bloque.
- **El bloque define “días activos” para mostrarse**, y además sirve como “sugerencia” al crear loops dentro de él.

#### Reglas

1. Cada bloque tiene **Active Days** (ej Workload: L-V, Weekend: S-D).
2. En la vista de un día, se muestran:

   - Los bloques activos para ese día, y
   - Cualquier bloque que tenga tareas para ese día (para no esconder tareas).

3. Al crear un Loop dentro de un bloque:

   - Por defecto se preseleccionan los días activos del bloque (editable).

Esto resuelve lo que querés:

- Workload no aparece el finde si está vacío.
- Si un finde igual tenés una tarea en Workload, aparece porque hay contenido.

---

# 5) Pantallas y features

## A) Auth (obligatorio)

**Pantallas**

- Continue with Google
- Continue with Apple

**Criterios de aceptación**

- Sin login no se puede entrar al Home.
- Logout disponible en Profile.

---

## B) Onboarding (setup rápido)

Objetivo: dejar al usuario con sistema listo en 1 minuto.

**Paso 1: Personalización**

- Nombre (para saludo)
- Tema: claro/oscuro (opcional acá, o en Profile)

**Paso 2: Bloques sugeridos**

- Sugeridos: Morning / Workload / Night (o Mañana / Tarde / Noche)
- Acciones: crear, renombrar, reordenar, borrar
- Active Days por bloque (default: todos los días)

**Paso 3: Loops sugeridos (opt-in)**

- Lista sugerida: Drink water, Workout, Plan top task, No phone before sleep, etc
- El usuario elige cuáles activar

**Paso 4: Recordatorios**

- Cierre del día: ON/OFF + hora
- Recordatorios por bloque: ON/OFF + hora por bloque (solo si activado)

**Criterios de aceptación**

- Para terminar onboarding debe existir al menos 1 bloque.
- Al llegar a Home, el usuario ve el día de hoy con sus bloques y al menos 0 o más tareas.

---

## C) Home (día)

**Componentes**

- Saludo + frase corta (opcional)
- Selector de semana (L-D)
- Toggle tema
- Filtro: To Do / Completed
- Lista por bloques colapsables
- Botón flotante “+” (Quick Add)
- Bottom nav: Home / Insights / Profile

**Acciones**

- Cambiar de día desde el selector semanal
- Check/uncheck de tareas
- Colapsar/expandir bloques
- Crear tarea rápida
- Editar tarea (tap o long press)
- Eliminar tarea

**Criterios de aceptación**

- Cambiar día actualiza contenido inmediatamente.
- Completed solo muestra tareas completadas del día seleccionado.
- Los bloques se muestran según Active Days o si tienen tareas ese día.

---

## D) Quick Add (crear en segundos)

Se abre desde el botón “+”.

**Campos mínimos**

- Título
- Tipo: One-off o Loop
- Bloque
- Fecha (si one-off)
- Días de semana (si loop)
- Emoji/icono (opcional)

**Comportamiento**

- Por defecto: bloque sugerido = primero activo para ese día.
- Si se crea Loop dentro de un bloque, días sugeridos = Active Days del bloque.

**Criterios de aceptación**

- Crear tarea la muestra inmediatamente en el día correspondiente.
- Editar tarea permite cambiar bloque, título, recurrencia.

---

## E) Loops (recurrentes desde el inicio)

**Reglas v1**

- Recurrencia solo por **días de semana** (custom).
- No “cada 2 días”, no reglas complejas.

**Acciones**

- Editar días de semana
- Pausar loop (opcional v1 si querés, pero te recomiendo)
- “Skip today” (sí, lo incluimos con regla clara)

### Skip today (para loops)

- Acción disponible en una tarea loop del día.
- Resultado: esa tarea queda marcada como “Skipped” solo para ese día.

**Importante para que no rompa la gamificación**

- Un día para streak requiere al menos **1 tarea completada**.
- Skipped **no cuenta** como completada.
- Skipped se excluye del cálculo de completitud del día (para que no te “castigue” si conscientemente la saltaste).

---

## F) Cierre del día (Day Close)

**Qué es**
Un resumen amable del día, disparado por recordatorio o al abrir la app al día siguiente (si no se mostró).

**Contenido**

- Completadas / Total
- Resultado del día:

  - Perfect Day (si completaste todo)
  - Partial Day
  - No Activity (si no completaste nada)

- Streak actual + si se mantiene o se rompe

**Regla**

- Las tareas incompletas quedan en histórico (no se mueven automáticamente).

**Criterios de aceptación**

- El cierre del día no obliga acciones.
- La hora del cierre define el “cutoff” del día para streak/insights.

---

## G) Recordatorios

**Modelo minimal**

- Recordatorio de cierre del día (hora configurable).
- Recordatorios por bloque (hora por bloque).
- Las tareas heredan el recordatorio del bloque (no horas por tarea).

**Criterios de aceptación**

- Puedo apagar todos los recordatorios.
- Puedo configurar el cierre del día.
- Puedo configurar horas por bloque si están activados.

---

## H) Insights (amables + visuales)

**Objetivo**
Feedback tipo “brújula”, no tipo “auditoría”.

### v1 incluye

1. **Calendario mensual**

- Cada día muestra estado según % completitud:

  - 100% (Perfect)
  - 1-99% (Partial)
  - 0% (None)
  - 0 tareas programadas: “No tasks” (neutral)

2. **Heatmap anual estilo GitHub**

- Intensidad basada en **% de completitud** del día.
- Días sin tareas: color neutral o vacío (no “castigo”).

3. Resumen simple

- Streak actual
- Mejor streak
- Promedio semanal (opcional)

**Criterios de aceptación**

- El heatmap refleja % completitud, no cantidad.
- Calendario mensual y heatmap usan la misma lógica de completitud.

---

## I) Profile / Settings

**Secciones**

- Cuenta: logout
- Apariencia: tema
- Bloques: crear, renombrar, reordenar, active days, eliminar
- Recordatorios: cierre del día + por bloque
- Streak: ver streak actual y mejor streak

**Criterios de aceptación**

- Si elimino un bloque con tareas:

  - Opción A (recomendada): “Reasignar tareas a otro bloque”
  - Opción B: “Eliminar tareas” (con confirmación fuerte)

---

# 6) Gamificación: Streak (regla final v1)

### Definición

**Streak = cantidad de días consecutivos con “Perfect Day”.**
Perfect Day ocurre si:

- El día tiene al menos 1 tarea programada, y
- El usuario completó **todas** las tareas no-skipped de ese día.

### Consecuencias

- Si un día con tareas termina con algo incompleto, el streak se rompe.
- Días sin tareas:

  - No suman, y no rompen (quedan neutrales).

---

# 7) Reglas de completitud (para insights y heatmap)

Para un día D:

- Total = tareas programadas ese día (loops + one-offs) menos skipped
- Completed = tareas completadas
- % completitud = Completed / Total
- Si Total = 0 → estado “No tasks”

---

# 8) Backlog priorizado (MoSCoW)

### Must (v1)

- OAuth Google/Apple + login obligatorio
- Bloques personalizados + active days
- One-off tasks + Loops por días de semana
- Home con To Do / Completed
- Quick Add
- Cierre del día
- Recordatorios cierre + por bloque
- Insights: calendario mensual + heatmap anual por % completitud
- Profile con gestión de bloques, tema, recordatorios, logout
- Streak por completar todo

### Should (v1.1)

- Plantillas de bloques y rutinas más curadas
- Pausar loop (en vez de borrar)
- Pequeños microfeedbacks (confetti sutil, haptics, sin ruido)

### Could (v2)

- Top Task diario
- Exportar datos
- Widgets (si algún día te interesa)

---

# 9) Edge cases funcionales (importantes)

- **Cambiar Active Days de un bloque**:

  - Afecta visibilidad del bloque, no altera recurrencias.

- **Editar loop y cambiar días**:

  - Aplica hacia adelante (no reescribe histórico).

- **Eliminar cuenta / logout**:

  - Logout solo sale, no borra datos.

- **Días sin tareas**:

  - No rompen streak, no suman.

---

## Lo único que queda “para decidir” (te lo dejo como recomendación ya cerrada)

1. **¿“Skip today” lo mostramos como acción secundaria?**
   Recomendación: sí, pero escondido (long press o menú), para no invitar a “hacer trampa”.

2. **Borrar bloque con tareas**
   Recomendación: forzar reasignación (A), así cuidás datos.

Si estás de acuerdo con estas dos recomendaciones, el PRD queda 100% cerrado.

---

Si querés, en el próximo paso te lo convierto a:

- **lista final de pantallas + flujos** (tipo blueprint),
- **user stories por pantalla** más detalladas,
- y **copy UI** (textos exactos minimalistas para botones, labels, empty states).
