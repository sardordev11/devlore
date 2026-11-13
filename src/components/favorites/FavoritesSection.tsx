interface FavoritesSectionProps {
  title: string;
  count: number;
  emptyLabel: string;
  children: React.ReactNode;
}

// A titled, line-separated list of favorite rows with a count.
export function FavoritesSection({
  title,
  count,
  emptyLabel,
  children,
}: FavoritesSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 px-2 text-xs tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="text-muted-foreground/60">{count}</span>
      </h2>
      {count > 0 ? (
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {children}
        </ul>
      ) : (
        <p className="border-y border-border/60 px-2 py-2 text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}
