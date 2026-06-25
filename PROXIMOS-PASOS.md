# 🗺️ Próximos pasos — Dev Toolbox

> Notas de planificación para no perder el hilo entre sesiones.
> Última actualización: 2026-06-22

---

## ✅ Hecho recientemente

- **Carpetas en Proyectos** — cada proyecto puede tener carpetas (un nivel), y cada
  carpeta tiene sus propias URLs y usuarios. Columna `folders` (jsonb) en la tabla
  `projects`. Sirve para proyectos con varios sitios (ej: proyecto "Back" → carpeta "USA").
- **Sección Notas** — nueva página `/notas` con tabla `notes` en Supabase (título,
  contenido, color), crear/editar/eliminar/ver. Mismo patrón que Proyectos.
- **3 tarjetas por fila en pantallas grandes** — Proyectos y Notas usan
  `xl:max-w-[1040px]` para aprovechar monitores grandes.
- **Enmascarado de contraseñas (Opción A)** — las passwords se muestran como `••••••••`
  con un ojito para revelar/ocultar. Copiar funciona sin revelar. Cubre proyecto y carpetas
  (vía `LinksAccountsManager`). **Resuelve la exposición visual (screen-share), NO cifra en la base.**

---

## 🔐 Credenciales — lo que falta (at-rest)

El enmascarado (A) ya está. Lo pendiente es proteger las contraseñas **en reposo**:
hoy siguen en **texto plano** en la columna `accounts` de Supabase (visibles desde el
dashboard, backups, o si la DB se filtra). El RLS ya aísla entre usuarios — el problema
es el almacenamiento en sí.

Dos caminos posibles (decidir si vale la pena):

### Opción B — Cifrado en reposo con clave en el servidor
- Cifrar la password (AES) con una clave secreta del servidor (env var / Vault de Supabase)
  antes de guardar; descifrar al leer.
- ✅ Si se filtra **solo la base**, queda texto cifrado ilegible.
- ⚠️ Clave y datos viven en el mismo proveedor: no protege ante compromiso total del servidor.
- ❌ Requiere mover lectura/escritura por una ruta de servidor o `pgcrypto`.

### Opción C — Cifrado end-to-end con contraseña maestra (estilo gestor de contraseñas)
- Contraseña maestra que nunca viaja al servidor; deriva una clave en el browser y
  cifra/descifra del lado del cliente. Supabase solo ve texto cifrado.
- ✅ Zero-knowledge: ni el servidor ni nadie puede leer las credenciales.
- ❌ Si se olvida la maestra, los datos son **irrecuperables**.
- ❌ Más fricción (desbloquear cada sesión) y bastante más código.

**Recomendación:** evaluar si el at-rest realmente preocupa. Si sí, C es lo "correcto"
conceptualmente pero con la fricción/riesgo de la maestra; B es un punto medio razonable.

---

## 📋 Integración con Jira (planeado)

**Requisito clave:** las horas no van todas a la misma tarea de Jira.
- Cada **proyecto** se carga en una tarea específica de Jira.
- Dentro de un proyecto, **cada carpeta (= cada sitio) tiene su propia tarea** de Jira.

### Plan
1. **Guardar el issue key de Jira en dos niveles:**
   - Campo opcional `jiraIssueKey` (ej. `PROJ-123`) en el **proyecto**.
   - Campo opcional `jiraIssueKey` en cada **carpeta** (las carpetas ya son objetos con su
     propia data en `folders`, así que agregarlo es trivial).
2. **Al cargar horas**, el sistema ya sabe a qué tarea van según el proyecto/carpeta elegido.
3. **Integración real con la API de Jira** — que el flag `logs.is_logged_jira` (que ya existe)
   efectivamente cree el *worklog* vía API, en vez de ser un checkbox manual.
   - Recordar: `logs.project_id` (FK a proyectos) ya existe → la asociación tiempo↔proyecto
     está medio armada en el modelo, falta usarla en la UI al crear un log.

### Valor
Pasar de "anotar a mano" a que la herramienta cargue las horas en la tarea correcta de Jira
automáticamente. Es el feature de mayor impacto en el día a día.

---

## 💡 Otras ideas anotadas (segundo orden)

- **Dashboard / reportes** de tiempo por proyecto y por día, con export a CSV.
- **Asociar tiempo ↔ proyecto en la UI** al crear un log (el FK ya existe).
- **Markdown + checklists en Notas** (encaja con checklists de testing de QA).
- **Búsqueda global (Cmd+K)** entre proyectos, notas y logs.
- **Llevar Proyectos/Notas a la extensión** del browser (acceso rápido a credenciales del
  sitio en el que estás parado).
