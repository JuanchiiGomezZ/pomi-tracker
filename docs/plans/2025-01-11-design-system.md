# DailyLoop Design System - v1.0

## 1. Filosofía de Diseño

### 1.1 Principios Fundamentales

DailyLoop se basa en una filosofía de **"claridad sin fricción"**:

- **Minimalismo extremo**: Cada elemento tiene un propósito
- **Escala de grises**: Monocromático con accent sutil para interacciones
- **Legibilidad**: Alto contraste, tipografía limpia
- **Mobile-first**: Diseñado para uso en celular, una mano

### 1.2 Identidad Visual

DailyLoop es una herramienta de productividad que no quiere competir por atención. El diseño:
- Desaparece, dejando que el contenido brille
- Comunica progreso a través de patrones visuales (heatmap, streaks)
- Usa emojis como único "color" en la interfaz

---

## 2. Sistema de Colores

### 2.1 Light Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LIGHT MODE PALETTE                            │
├─────────────────────────────────────────────────────────────────────┤
│  CATEGORY          │  COLOR NAME    │  HEX       │  USO              │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Base              │  Background    │  #FFFFFF   │  Page bg         │
│                    │  Foreground    │  #F9FAFB   │  Secondary bg    │
│                    │  Card          │  #FFFFFF   │  Elevated cards  │
│                    │  Muted         │  #F3F4F6   │  Subtle bg       │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Text              │  Primary       │  #111827   │  Headings, body  │
│                    │  Secondary     │  #4B5563   │  Subtitles       │
│                    │  Tertiary      │  #9CA3AF   │  Labels, hints   │
│                    │  Inverse       │  #FFFFFF   │  Text on dark    │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Brand             │  Primary       │  #000000   │  CTAs, headings  │
│                    │  Primary FG    │  #FFFFFF   │  Text on primary │
│                    │  Accent        │  #007AFF   │  Toggles, links  │
│                    │  Accent FG     │  #FFFFFF   │  Text on accent  │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Semantic          │  Success       │  #10B981   │  Completed       │
│                    │  Success FG    │  #FFFFFF   │  Text on success │
│                    │  Warning       │  #F59E0B   │  Alerts          │
│                    │  Warning FG    │  #000000   │  Text on warning │
│                    │  Error         │  #EF4444   │  Errors          │
│                    │  Error FG      │  #FFFFFF   │  Text on error   │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  UI                │  Border        │  #E5E7EB   │  Input borders   │
│                    │  Divider       │  #E5E7EB   │  Separators      │
│                    │  Overlay       │  rgba(0,0,0│  Modals          │
│                    │                │     ,0.5)  │                  │
└────────────────────┴────────────────┴────────────┴──────────────────┘
```

### 2.2 Dark Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DARK MODE PALETTE                             │
├─────────────────────────────────────────────────────────────────────┤
│  CATEGORY          │  COLOR NAME    │  HEX       │  USO              │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Base              │  Background    │  #000000   │  Page bg         │
│                    │  Foreground    │  #111827   │  Secondary bg    │
│                    │  Card          │  #1F2937   │  Elevated cards  │
│                    │  Muted         │  #374151   │  Subtle bg       │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Text              │  Primary       │  #FFFFFF   │  Headings, body  │
│                    │  Secondary     │  #D1D5DB   │  Subtitles       │
│                    │  Tertiary      │  #8E8E93   │  Labels, hints   │
│                    │  Inverse       │  #000000   │  Text on light   │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Brand             │  Primary       │  #FFFFFF   │  CTAs            │
│                    │  Primary FG    │  #000000   │  Text on primary │
│                    │  Accent        │  #007AFF   │  Toggles, links  │
│                    │  Accent FG     │  #FFFFFF   │  Text on accent  │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  Semantic          │  Success       │  #10B981   │  Completed       │
│                    │  Success FG    │  #000000   │  Text on success │
│                    │  Warning       │  #F59E0B   │  Alerts          │
│                    │  Warning FG    │  #000000   │  Text on warning │
│                    │  Error         │  #EF4444   │  Errors          │
│                    │  Error FG      │  #000000   │  Text on error   │
├────────────────────┼────────────────┼────────────┼──────────────────┤
│  UI                │  Border        │  #38383A   │  Input borders   │
│                    │  Divider       │  #38383A   │  Separators      │
│                    │  Overlay       │  rgba(0,0,0│  Modals          │
│                    │                │     ,0.7)  │                  │
└────────────────────┴────────────────┴────────────┴──────────────────┘
```

### 2.3 Escala de Grises

Usar la escala de grises para consistencia en toda la interfaz:

**Light Mode:**
```
50  = #F9FAFB  → Backgrounds sutiles
100 = #F3F4F6  → Hover states, muted backgrounds
200 = #E5E7EB  → Borders, dividers
300 = #D1D5DB  → Disabled states, inactive
400 = #9CA3AF  → Placeholders
500 = #6B7280  → Labels terciarias
600 = #4B5563  → Text secondary
700 = #374151  → Text body
800 = #1F2937  → Headings
900 = #111827  → High emphasis
950 = #030712  → Negro para CTAs
```

**Dark Mode:**
```
50  = #F9FAFB  → Text on dark (high contrast)
100 = #F3F4F6  → Hover highlights
200 = #E5E7EB  → Active states
300 = #D1D5DB  → Primary text
400 = #9CA3AF  → Secondary text
500 = #6B7280  → Tertiary text
600 = #4B5563  → Muted text
700 = #374151  → Muted backgrounds
800 = #1F2937  → Cards
900 = #111827  → Elevated cards
950 = #030712  → Foreground
1000 = #000000 → Background
```

### 2.4 Uso de Colores

**Escala de grises para:**
- Textos (todos los niveles)
- Bordes y separadores
- Fondos de cards y secciones
- Estados hover/active
- Iconos

**Semantic colors para:**
- `success` → Checkmarks, tareas completadas, streaks
- `warning` → Solo si es crítico (ej: "sin tareas programadas")
- `error` → Errores de validación, operaciones fallidas

**Accent color (#007AFF) para:**
- Toggle switches activos
- Links
-少数 elementos interactivos que necesitan destacarse

---

## 3. Tipografía

### 3.1 Font Family

**Poppins** (mantener consistencia con el template)

```
fontFamily: {
  thin: "Poppins-Thin",
  extralight: "Poppins-ExtraLight",
  light: "Poppins-Light",
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  extrabold: "Poppins-ExtraBold",
  black: "Poppins-Black",
}
```

### 3.2 Font Sizes

```
fontSize: {
  xs: 12,    // Labels pequeñas, timestamps
  sm: 14,    // Body secundario, captions
  base: 16,  // Body principal
  lg: 18,    // Subtitles
  xl: 20,    // Section headers
  "2xl": 24, // Page headers
  "3xl": 30, // Hero text (login, onboarding)
}
```

### 3.3 Font Weights

```
fontWeight: {
  regular: "400",  // Body text
  medium: "500",   // Subtitles, labels
  semibold: "600", // Headings, buttons
  bold: "700",     // Page titles
}
```

### 3.4 Line Heights

```
// Headings: 1.2 - 1.3
// Body: 1.5 - 1.6
// Captions: 1.4
```

---

## 4. Espaciado (4pt Grid)

### 4.1 Spacing Scale

```typescript
spacing: (multiplier: number) => multiplier * 4
```

```
0 = 0px    (sin espacio)
1 = 4px    (micro间距)
2 = 8px    (small间距)
3 = 12px   (compact)
4 = 16px   (base)
5 = 20px   (comfortable)
6 = 24px   (section)
8 = 32px   (large)
10 = 40px  (xlarge)
12 = 48px  (page margins)
```

### 4.2 Usage Guidelines

```
// Micro间距 (4-8px)
- Icon + text: 4-8px
- Input padding: 8-12px
- Badge padding: 4-8px horizontal

// Base间距 (12-20px)
- Card padding: 16px
- List item padding: 12-16px
- Button internal padding: 12-20px

// Section间距 (24-40px)
- Between cards: 24px
- Section margins: 24-32px
- Page margins: 24-32px

// Page间距 (48px+)
- Page padding: 24-32px
- Page header margin: 32-40px
```

---

## 5. Border Radius

### 5.1 Radius Scale

```
radius: {
  xs: 4,     // Small elements, tags
  sm: 8,     // Input fields, small cards
  md: 12,    // Cards, buttons
  lg: 16,    // Modal cards
  xl: 24,    // Large buttons, FAB
  full: 9999 // Pill buttons, circular
}
```

### 5.2 Usage Guidelines

```
xs (4px):
  - Tags, badges
  - Small indicators

sm (8px):
  - Text inputs
  - Small cards
  - Checkboxes

md (12px):
  - Task cards
  - List items
  - Standard buttons

lg (16px):
  - Modal content
  - Bottom sheets
  - Large cards

xl (24px):
  - FAB (Floating Action Button)
  - Primary CTA buttons

full (9999):
  - Pill buttons
  - Circular elements
```

---

## 6. Iconografía

### 6.1 Tamaño de Iconos

```
iconSizes: {
  xs: 16,    // Inline con texto, badges
  sm: 20,    // Toolbar icons, small actions
  md: 24,    // Standard icon size
  lg: 32,    // Featured icons, headers
  xl: 40,    // Large icons
  "2xl": 48, // Hero icons
}
```

### 6.2 Iconos del Sistema

DailyLoop usa principalmente **emojis** para iconografía de bloques y tareas, reduciendo la necesidad de iconos vectoriales. Para elementos de UI:

- Usar SF Symbols (iOS) o Material Symbols equivalentes
- Color: `text.secondary` por defecto, `text.primary` para emphasis
- Iconos activos: `accent` (#007AFF) o `grayscale[700]`

---

## 7. Componentes Principales

### 7.1 Botones

**Primary Button:**
```
- Background: primary (#000000 light / #FFFFFF dark)
- Text: primaryForeground (#FFFFFF light / #000000 dark)
- Radius: xl (24px) o full (9999) para pill
- Padding: 12px horizontal x 16px vertical
- Font: semibold, base (16px)
```

**Secondary Button:**
```
- Background: transparent
- Border: 1px solid border (#E5E7EB / #38383A)
- Text: text.primary
- Radius: xl (24px) o full (9999)
```

**Text Button:**
```
- Background: transparent
- Text: accent (#007AFF)
- Sin border
```

**FAB (Floating Action Button):**
```
- Background: primary (#000000 / #FFFFFF)
- Icon: primaryForeground (#FFFFFF / #000000)
- Radius: xl (24px) o full
- Size: 56x56px
- Shadow: elevation 2
- Position: Bottom right, con margin
```

### 7.2 Cards

**Task Card:**
```
- Background: card (#FFFFFF / #1F2937)
- Radius: md (12px)
- Padding: 16px
- Border: 1px solid border (#E5E7EB / #38383A) si es necesario
- Shadow: none (flat design)
```

**Block Card:**
```
- Background: card (#FFFFFF / #1F2937)
- Radius: md (12px) o lg (16px)
- Padding: 16px
- Header: Block title + emoji icon
- Content: Task list
```

### 7.3 Inputs

**Text Input:**
```
- Background: background (#FFFFFF / #111827)
- Border: 1px solid border (#E5E7EB / #38383A)
- Radius: sm (8px) o md (12px)
- Padding: 12px horizontal x 14px vertical
- Text: text.primary
- Placeholder: text.tertiary
- Focus: border = accent (#007AFF)
```

### 7.4 Toggles

**Toggle Switch:**
```
- Off: border/gray scale
- On: accent (#007AFF)
- Thumb: background
- Size: estándar iOS
```

### 7.5 Navigation

**Bottom Tab Bar:**
```
- Background: card (#FFFFFF / #1F2937)
- Border-top: divider
- Icon: text.tertiary (inactive), accent (active)
- Label: text.tertiary (inactive), accent (active)
- Height: 83px (incluye safe area)
```

---

## 8. Estados Interactivos

### 8.1 Hover

```
hover: {
  background: grayscale[100] (light) / grayscale[700] (dark)
  border: grayscale[300] (light) / grayscale[600] (dark)
}
```

### 8.2 Active/Pressed

```
active: {
  background: grayscale[200] (light) / grayscale[800] (dark)
  border: grayscale[400] (light) / grayscale[500] (dark)
}
```

### 8.3 Disabled

```
- Opacity: 0.5
- Text: text.tertiary
- Background: grayscale[100] (light) / grayscale[900] (dark)
```

---

## 9. Sombras (Shadows)

DailyLoop usa un diseño mayormente flat. Usar sombras solo para:

### 9.1 Shadow Scale

```
shadow-sm:  // Elevation 1
  offset: { width: 0, height: 1 }
  blur: 2
  color: rgba(0, 0, 0, 0.05)

shadow-md:  // Elevation 2
  offset: { width: 0, height: 4 }
  blur: 6
  color: rgba(0, 0, 0, 0.1)

shadow-lg:  // Elevation 3
  offset: { width: 0, height: 10 }
  blur: 15
  color: rgba(0, 0, 0, 0.1)
```

### 9.2 Uso de Sombras

```
shadow-sm:
  - Cards sutiles
  - Buttons on background

shadow-md:
  - FAB
  - Dropdowns
  - Modals (light)

shadow-lg:
  - Modals importantes
  - Bottom sheets
```

---

## 10. Dark Mode

### 10.1 Principios

- Invertir los valores de la escala de grises
- Mantener la misma jerarquía visual
- Reducir contraste en backgrounds (evitar negro puro vs blanco puro)
- Los semantic colors se mantienen o ajustan ligeramente

### 10.2 Mapeo Light → Dark

```
Background: #FFFFFF → #000000
Foreground: #F9FAFB → #111827
Card: #FFFFFF → #1F2937
Muted: #F3F4F6 → #374151

Text Primary: #111827 → #FFFFFF
Text Secondary: #4B5563 → #D1D5DB
Text Tertiary: #9CA3AF → #8E8E93

Border: #E5E7EB → #38383A
Divider: #E5E7EB → #38383A

Primary: #000000 → #FFFFFF
Accent: #007AFF → #007AFF (mantener)
```

---

## 11. Accesibilidad

### 11.1 Contraste Mínimo

- Text primary: 4.5:1 minimum (WCAG AA)
- Text large (18px+): 3:1 minimum
- UI components: 3:1 minimum

### 11.2 Estados de Focus

- Outline visible en todos los elementos interactivos
- Color: accent (#007AFF)
- Offset: 2px

### 11.3 Tamaño de Touch Target

- Mínimo: 44x44px
- Recomendado: 48x48px
- Espaciado entre targets: 8px minimum

---

## 12. Referencia Rápida

### Uso de Colores por Componente

```
┌────────────────────────────────────────────────────────────────────┐
│  COMPONENT         │  BACKGROUND     │  TEXT        │  BORDER     │
├────────────────────┼─────────────────┼──────────────┼─────────────┤
│  Page              │  background     │  -           │  -          │
│  Card              │  card           │  text.primary│  border     │
│  Button Primary    │  primary        │  primaryFG   │  -          │
│  Button Secondary  │  transparent    │  text.primary│  border     │
│  Text Input        │  background     │  text.primary│  border     │
│  Bottom Tab        │  card           │  text.tertiary│  divider   │
│  FAB               │  primary        │  primaryFG   │  -          │
│  Toggle (on)       │  accent         │  -           │  accent     │
│  Toggle (off)      │  transparent    │  -           │  border     │
└────────────────────┴─────────────────┴──────────────┴─────────────┘
```

---

## 13. Archivos Relacionados

- `@mobile/src/shared/styles/theme.ts` - Implementación del theme
- `@mobile/src/shared/styles/typography.ts` - (pendiente)
- `@mobile/src/shared/utils/styled.ts` - (pendiente)
