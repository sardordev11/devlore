"use client";

import { useNow } from "@/hooks/use-now";
import { formatDate, formatLocalDate, formatRelativeDate } from "@/lib/format-date";

interface RelativeTimeProps {
  date: string;
  className?: string;
}

// "Today, 3:42 PM", "Yesterday", "2 weeks ago"… in the viewer's time zone.
// Renders the plain UTC date on the server, since "today" depends on the viewer.
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const now = useNow();

  return (
    <time
      dateTime={date}
      title={now === null ? undefined : formatLocalDate(date, "long")}
      className={className}
    >
      {now === null ? formatDate(date, "medium") : formatRelativeDate(date, now)}
    </time>
  );
}
