// Prefijos de claves Jira (ej. "SK" en "SK-123 Fix checkout") para asociar tareas a proyectos.

const PREFIX_RE = /^[A-Z][A-Z0-9]*$/;

/** "sk, sod  SODA" → ["SK", "SOD", "SODA"]. Acepta comas o espacios; descarta duplicados. */
export function parsePrefixList(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(/[\s,;]+/)) {
    const p = raw.trim().toUpperCase();
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

/** Prefijos inválidos de la lista (deben empezar con letra y tener solo letras/números). */
export function invalidPrefixes(prefixes: string[]): string[] {
  return prefixes.filter((p) => !PREFIX_RE.test(p));
}

export function formatPrefixList(prefixes: string[]): string {
  return prefixes.join(", ");
}

/**
 * Prefijo de una tarea con formato de clave Jira: "SK-123 algo" → "SK".
 * Exige guion + número para no confundir palabras comunes ("Daily standup").
 */
export function extractTaskPrefix(taskName: string): string | null {
  const m = taskName.trim().match(/^([A-Za-z][A-Za-z0-9]*)-\d+/);
  return m ? m[1].toUpperCase() : null;
}

/** Proyecto cuyo prefijo coincide con el de la tarea. null si no hay o si es ambiguo. */
export function findProjectIdByTaskName(
  taskName: string,
  projects: { id: string; prefixes: string[] }[]
): string | null {
  const prefix = extractTaskPrefix(taskName);
  if (!prefix) return null;
  const matches = projects.filter((p) => p.prefixes.includes(prefix));
  return matches.length === 1 ? matches[0].id : null;
}
