export type DateStyle = "short" | "medium" | "long";

const DATE_STYLES = {
  // Jan 15
  short: { month: "short", day: "numeric" },
  // Jan 15, 2026
  medium: { month: "short", day: "numeric", year: "numeric" },
  // January 15, 2026
  long: { month: "long", day: "numeric", year: "numeric" },
} satisfies Record<DateStyle, Intl.DateTimeFormatOptions>;

// UTC keeps server-rendered dates stable regardless of the server's time zone.
const UTC_FORMATS = Object.fromEntries(
  Object.entries(DATE_STYLES).map(([style, options]) => [
    style,
    new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }),
  ]),
) as Record<DateStyle, Intl.DateTimeFormat>;

export function formatDate(date: Date | string, style: DateStyle = "medium") {
  return UTC_FORMATS[style].format(new Date(date));
}

const DAY_MS = 24 * 60 * 60 * 1000;

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

// Whole calendar days between two dates in the local time zone (DST-safe).
function calendarDaysBetween(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

// "Today, 3:42 PM", "Yesterday", "4 days ago", "Last week", "2 weeks ago",
// "1 month ago", "2 years ago", in the local time zone. Future dates count as today.
export function formatRelativeDate(date: Date | string, now: Date | number = Date.now()) {
  const value = new Date(date);
  const days = calendarDaysBetween(value, new Date(now));

  if (days <= 0) {
    // ICU puts a narrow no-break space before AM/PM; a plain space is easier to read in mono.
    return `Today, ${TIME_FORMAT.format(value).replace(/ /g, " ")}`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return plural(days, "day");
  if (days < 14) return "Last week";
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.min(Math.floor(days / 30), 11), "month");
  return plural(Math.floor(days / 365), "year");
}

// For dates rendered only on the client, where the viewer's own time zone is fine.
export function formatLocalDate(date: Date | string, style: DateStyle = "medium") {
  return new Intl.DateTimeFormat("en-US", DATE_STYLES[style]).format(new Date(date));
}
