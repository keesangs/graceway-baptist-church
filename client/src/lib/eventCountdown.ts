export type CountdownParts = {
  hasStarted: boolean;
  days: number;
  hours: number;
  minutes: number;
};

export function getCountdownParts(startAt: Date | string, now = new Date()): CountdownParts {
  const remaining = new Date(startAt).getTime() - now.getTime();
  if (remaining <= 0) return { hasStarted: true, days: 0, hours: 0, minutes: 0 };

  const totalMinutes = Math.floor(remaining / 60_000);
  return {
    hasStarted: false,
    days: Math.floor(totalMinutes / 1_440),
    hours: Math.floor((totalMinutes % 1_440) / 60),
    minutes: totalMinutes % 60,
  };
}
