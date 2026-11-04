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

// For dates rendered only on the client, where the viewer's own time zone is fine.
export function formatLocalDate(date: Date | string, style: DateStyle = "medium") {
  return new Intl.DateTimeFormat("en-US", DATE_STYLES[style]).format(new Date(date));
}
