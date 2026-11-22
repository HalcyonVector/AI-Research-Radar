/**
 * arXiv publishes new submissions Sunday to Thursday at 20:00 US Eastern
 * (https://info.arxiv.org/help/availability.html), so there is no batch on
 * Friday or Saturday evenings. Holidays also skip a batch; they are ignored here.
 */
const ET = "America/New_York";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Milliseconds to add to a UTC instant to get Eastern wall-clock time (negative). */
function etOffsetMs(t: number): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ET,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(new Date(t))
      .map((x) => [x.type, Number(x.value)])
  );
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - t;
}

/** The next arXiv announcement after `now`. */
export function nextArxivAnnouncement(now: Date = new Date()): Date {
  const t = now.getTime();
  for (let d = 0; d <= 7; d++) {
    const et = new Date(t + etOffsetMs(t) + d * DAY_MS); // Eastern wall clock, read with getUTC*
    const y = et.getUTCFullYear();
    const m = et.getUTCMonth();
    const day = et.getUTCDate();
    if (new Date(Date.UTC(y, m, day)).getUTCDay() > 4) continue; // Fri, Sat
    const wall = Date.UTC(y, m, day, 20);
    const instant = wall - etOffsetMs(wall);
    if (instant > t) return new Date(instant);
  }
  return new Date(t + DAY_MS); // unreachable: some Sun-Thu falls within a week
}
