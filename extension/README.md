# QA Toolbox — Browser Extension

Extensión de Chrome para registrar tiempo de tareas directamente desde el navegador, sincronizado con la misma base de datos Supabase que la app web.

## Características

- ⏱️ **Timer integrado** — Iniciá y detené tareas sin salir del navegador
- 💾 **Sincronización automática** — Los logs se guardan en Supabase asociados a tu usuario
- 🔄 **Anti-quota** — Solo se comunica con Supabase al iniciar y al detener. El conteo local corre 100% en el navegador
- 🎨 **Diseño consistente** — Mismos colores, tipografía y estilos que la web
- ✏️ **Edición rápida** — Editá o eliminá registros recientes sin abrir la web

## Instalación (modo desarrollador)

1. **Build la extensión:**
   ```bash
   npm run build:extension
   ```

2. **Abrir Chrome y cargar la extensión:**
   - Ir a `chrome://extensions/`
   - Activar **"Modo de desarrollador"** (arriba a la derecha)
   - Click en **"Cargar desempaquetada"**
   - Seleccionar la carpeta `extension/dist/`

3. **Verificar:**
   - Debería aparecer el icono de QA Toolbox en la barra de extensiones
   - Click en el icono para abrir el popup

## Desarrollo

Para trabajar en la extensión con hot-reload:

```bash
npm run dev:extension
```

Esto queda escuchando cambios en `extension/src/`. Cada vez que guardás un archivo, rebuilda automáticamente.

> Nota: Chrome no recarga la extensión automáticamente. Después de cada build, tenés que ir a `chrome://extensions/` y click en el ícono de refresh (🔄) de la extensión, o bien usar una extensión como **Extension Reloader**.

## Estructura

```
extension/
├── src/
│   ├── popup/popup.{html,css,ts}   # UI del popup
│   ├── background.ts               # Service worker (alarms + badge)
│   ├── storage.ts                  # Helper para chrome.storage.local
│   ├── supabase.ts                 # Cliente Supabase con auth persistente
│   └── types.ts                    # Tipos compartidos
├── icons/                          # Iconos PNG (16, 32, 48, 128)
├── manifest.json                   # Manifest V3
├── build.mjs                       # Script de build con esbuild
└── dist/                           # Output (lo que se carga en Chrome)
```

## Cómo funciona el Timer

1. **Start:** Se crea un registro en Supabase (`start_time = now`, `duration = 0`) y se guarda el estado localmente en `chrome.storage.local`
2. **Durante el conteo:** Un `chrome.alarm` en el background actualiza el **badge** del icono cada 1 segundo. **Cero llamadas a Supabase.**
3. **Stop:** Se calcula la duración final y se actualiza el registro en Supabase con `end_time` y `duration`. Se limpia el estado local.

## Autenticación

La extensión usa el mismo sistema de auth que la web (Supabase Auth). Al iniciar sesión, la sesión se persiste en `chrome.storage.local` mediante un adapter custom, de forma que no necesitás volver a loguearte cada vez que abrís el popup.

## Notas

- La extensión usa las mismas variables de entorno públicas de Supabase que la web (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Los logs están protegidos por Row Level Security (RLS) en Supabase, así que cada usuario solo ve los suyos
