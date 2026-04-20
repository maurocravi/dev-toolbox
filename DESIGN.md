# 🎨 Design System — QA Toolbox

> Documento de referencia rápida con colores, fuentes, iconos y estilos utilizados en el proyecto.

---

## 📋 Stack de Estilos

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| **Tailwind CSS** | v4 | Utilidades y theming vía `@theme inline` |
| **PostCSS** | — | Procesamiento vía `@tailwindcss/postcss` |
| **CSS Variables** | — | Tokens de color y tipografía |

> ⚠️ No hay `tailwind.config.ts`. Tailwind v4 usa configuración vía CSS (`@theme inline`).

---

## 🎨 Paleta de Colores

### Tokens Principales (CSS Variables)

| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `--background` | `#0c0c0e` | Fondo general de la app |
| `--foreground` | `#e5e5e5` | Texto principal |
| `--card-bg` | `#141416` | Fondo de tarjetas / modales |
| `--card-border` | `#1e1e22` | Bordes de tarjetas, separadores |
| `--input-bg` | `#1a1a1e` | Fondo de inputs |
| `--input-border` | `#2a2a30` | Bordes de inputs |
| `--accent` | `#6366f1` | Color primario (índigo) |
| `--accent-hover` | `#818cf8` | Hover del acento |
| `--danger` | `#ef4444` | Rojo para errores / eliminar |
| `--danger-hover` | `#f87171` | Hover del rojo |
| `--success` | `#10b981` | Verde para éxito / check |

### Colores Adicionales en Uso

| Color | HEX | Uso |
|-------|-----|-----|
| Violeta degradado | `#8b5cf6` | Degradado junto con `--accent` (iconos, fondos) |
| `neutral-100` | `#f5f5f5` | Títulos principales |
| `neutral-500` | `#737373` | Subtítulos, fechas, hints |
| `neutral-600` | `#525252` | Fechas en header, texto tenue |
| `rgba(99,102,241,0.06)` | — | Glow radial superior (fondo) |
| `rgba(16,185,129,0.04)` | — | Glow radial inferior (fondo) |
| `rgba(239,68,68,0.1)` | — | Fondo de banner de error |
| `rgba(239,68,68,0.2)` | — | Borde de banner de error |
| `#10b981` (stroke) | — | Iconos de check/completado |

### Gradientes de Fondo

```css
background: radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%),
            var(--background);
```

> Se usa en las páginas principales (`page.tsx`, `proyectos/page.tsx`) como fondo sutil.

---

## 🔤 Tipografía

### Fuentes

| Fuente | Variable CSS | Uso | Origen |
|--------|--------------|-----|--------|
| **Inter** | `--font-inter` | Texto general, UI | `next/font/google` |
| **Geist Mono** | `--font-geist-mono` | Código, fechas monoespaciadas | `next/font/google` |

### Declaración

```tsx
// layout.tsx
import { Inter, Geist_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

### Configuración Tailwind v4

```css
@theme inline {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}
```

### Fallbacks del Body

```css
font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

### Tamaños de Texto en Uso

| Tamaño | Clase / Estilo | Uso |
|--------|----------------|-----|
| `text-lg` (18px) | `font-semibold` | Títulos de página (h1) |
| `text-xs` (12px) | `text-neutral-500` | Subtítulos, descripciones |
| `text-sm` (14px) | — | Texto general, labels |
| `text-[0.8125rem]` (13px) | — | Mensajes de error, texto denso |

---

## 🖼️ Iconos

> **No se usa librería de iconos.** Todos los íconos son **SVG inline** con estilo stroke (outline), reutilizando el patrón de **Lucide**.

### Especificación del Icono Base

```tsx
<svg
  width="20"          // 14–24 según contexto
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"     // 2 o 2.5 para íconos de acción
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="..." />
</svg>
```

### Tamaños por Contexto

| Contexto | Tamaño (width/height) | strokeWidth |
|----------|----------------------|-------------|
| Sidebar nav | 18px | 2 |
| Header / títulos | 20px | 2 |
| Botones de acción | 16–18px | 2 |
| Acciones densas (editar/eliminar) | 14px | 2–2.5 |
| Check / estado | 14px | 2 |
| Chevron / expand | 12px | 2 |
| Estados vacíos / loader | 32px | 1.5 |

### Iconos Identificados en el Proyecto

| Nombre | Path d | Ubicación |
|--------|--------|-----------|
| **Wrench** (llave) | `M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z` | Header QA Toolbox |
| **Clock** | — | TimerInput (play/pause) |
| **Layout / Grid** | — | Sidebar → "Dashboard" |
| **Folder** | — | Sidebar → "Proyectos" |
| **ChevronDown** | — | Dropdowns, acordeones |
| **ChevronRight** | — | Navegación jerárquica |
| **Check** | — | Estados completados |
| **Pencil / Edit** | — | Editar logs, proyectos |
| **Trash / X** | — | Eliminar logs, proyectos |
| **Plus** | — | Agregar proyecto |
| **ExternalLink** | — | Abrir detalles |
| **LogOut** | — | Cerrar sesión |

> 💡 **Tip:** Si necesitás agregar un ícono nuevo, buscalo en [lucide.dev](https://lucide.dev) y copiá el `path` en un SVG con el patrón de arriba.

---

## 📐 Layout y Espaciado

### Layout General

```
┌─────────────────────────────────────┐
│  Sidebar  │      Main Content       │
│  (flex)   │      (flex: 1)          │
│           │  max-w-[640px] centrado │
└─────────────────────────────────────┘
```

- `.app-layout`: `display: flex`, `min-height: 100vh`
- `.app-main`: `flex: 1`, `min-width: 0`
- Contenido centrado: `max-w-[640px]` con `py-8 px-4`

### Tokens de Espaciado (Tailwind)

| Token | Valor | Uso |
|-------|-------|-----|
| `gap-3` | 12px | Espaciado entre icono + texto |
| `mb-8` | 32px | Separación de secciones |
| `pb-6` | 24px | Padding bottom de header |
| `px-4 py-3` | 16px / 12px | Cards, banners |
| `rounded-xl` | 12px | Bordes de cards, modales, inputs |
| `rounded-lg` | 8px | Botones secundarios |
| `rounded-full` | 100% | Spinners, avatares |

### Z-Index

| Valor | Uso |
|-------|-----|
| `z-50` | Modales, overlays |

---

## ✨ Animaciones y Transiciones

### Keyframes Definidos

```css
@keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse    { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes spin     { to { transform: rotate(360deg); } }
```

### Clases de Animación en Uso

| Clase | Keyframe | Uso |
|-------|----------|-----|
| `animate-spin` | `@keyframes spin` | Loader / spinner de carga |
| `transition-colors` | — | Hover en botones, links |
| `transition-opacity` | — | Hover en íconos de acción |
| `duration-200` | — | Transiciones rápidas (hover) |

### Spinner de Carga (Ejemplo)

```tsx
<div className="w-7 h-7 border-[3px] border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
```

---

## 🧩 Componentes Visuales Comunes

### Header de Página

```tsx
<div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--card-border)]">
  <div className="flex items-center gap-3">
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white">
      {/* Icono */}
    </div>
    <div>
      <h1 className="text-lg font-semibold text-neutral-100">Título</h1>
      <p className="text-xs text-neutral-500">Subtítulo</p>
    </div>
  </div>
  <div className="text-xs text-neutral-600 font-mono">
    {/* Fecha */}
  </div>
</div>
```

### Card / Contenedor

```tsx
<div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
  {/* Contenido */}
</div>
```

### Botón Primario

```tsx
<button className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors duration-200">
  Acción
</button>
```

### Botón Fantasma / Icono

```tsx
<button className="p-1.5 text-neutral-500 hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-colors duration-200">
  <svg /* icono */ />
</button>
```

### Banner de Error

```tsx
<div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl px-4 py-3 mb-4 text-[0.8125rem] text-[var(--danger-hover)]">
  <span>{error}</span>
</div>
```

### Input

```tsx
<input
  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
  placeholder="Placeholder..."
/>
```

---

## 🏷️ Modo Oscuro

El proyecto opera **exclusivamente en modo oscuro**:

```tsx
<html lang="es" className={`${inter.variable} ${geistMono.variable} dark`}>
```

No hay toggle de tema. Todos los colores están pensados para fondo `#0c0c0e`.

---

## 📝 Notas para Desarrolladores

1. **No instales `lucide-react`**. Aunque los íconos siguen la estética de Lucide, todos están inline para evitar dependencias y reducir bundle.
2. **Usá `currentColor` en SVGs** para que hereden el color del texto padre vía `text-*` o `color`.
3. **Para nuevos colores**, agregalos como CSS Variables en `globals.css` antes de usarlos en componentes.
4. **El `max-w-[640px]`** es el ancho estándar del contenido principal (diseño centrado tipo "feed").
5. **Tailwind v4** no usa `tailwind.config.ts`; extendé tokens vía `@theme inline` en `globals.css`.

---

*Última actualización: Abril 2026*
