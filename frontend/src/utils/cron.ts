export function getNextRunFromCron(cronExpr: string): Date | null {
  if (!cronExpr) return null;

  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minutePart, hourPart] = parts;
  const now = new Date();

  const parseEveryMinutes = (value: string): number | null => {
    const match = value.match(/^\*\/(\d+)$/);
    if (!match) return null;
    const n = parseInt(match[1], 10);
    if (Number.isNaN(n) || n <= 0) return null;
    return n;
  };

  const minuteNumber = parseInt(minutePart, 10);
  const hourNumber = parseInt(hourPart, 10);
  const minuteIsFixed = !Number.isNaN(minuteNumber);
  const hourIsFixed = !Number.isNaN(hourNumber);

  // Caso 1 — "m h * * *" → hora/minuto fijos
  if (minuteIsFixed && hourIsFixed) {
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setHours(hourNumber, minuteNumber, 0, 0);

    if (next.getTime() <= now.getTime()) {
      // Si ya pasó hoy, programar para mañana
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  const every = parseEveryMinutes(minutePart);

  // Caso 2 — "*/N * * * *" → cada N minutos
  if (every && hourPart === "*") {
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // Avanzar minuto a minuto hasta encontrar un múltiplo de N
    for (let i = 0; i < 24 * 60; i++) {
      next.setMinutes(next.getMinutes() + 1);
      if (next.getMinutes() % every === 0) {
        return next;
      }
    }

    return null;
  }

  // Caso 3 — "*/N h * * *" → cada N minutos en una hora concreta
  if (every && hourIsFixed) {
    if (hourNumber < 0 || hourNumber > 23) return null;

    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // Avanzar hasta 2 días por seguridad
    for (let i = 0; i < 48 * 60; i++) {
      next.setMinutes(next.getMinutes() + 1);
      if (next.getHours() === hourNumber && next.getMinutes() % every === 0) {
        return next;
      }
    }

    return null;
  }

  // Cualquier otro formato no se soporta aquí
  return null;
}