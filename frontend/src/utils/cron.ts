/** Calcula próxima ejecución para expresiones tipo "m h * * *".
 * Soporta formato estándar con minuto/hora fijos (ej: "0 8 * * *").
 * Para otros casos, retorna null.
 */
export function getNextRunFromCron(cronExpr: string): Date | null {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [mStr, hStr] = parts;
  const minute = parseInt(mStr, 10);
  const hour = parseInt(hStr, 10);
  if (Number.isNaN(minute) || Number.isNaN(hour)) return null;
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null;

  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);
  next.setHours(hour, minute, 0, 0);

  if (next.getTime() <= now.getTime()) {
    // Si ya pasó hoy, ir al mismo horario mañana
    next.setDate(next.getDate() + 1);
  }
  return next;
}