import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getPageHref, getPageNumbers } from "@/lib/pagination";

interface PaginationControlsProps {
  pathname: string;
  page: number;
  pageCount: number;
}

// Greyed out and not focusable: an anchor without an href isn't a link.
const DISABLED_CLASS = "pointer-events-none opacity-50";

export function PaginationControls({
  pathname,
  page,
  pageCount,
}: PaginationControlsProps) {
  if (pageCount <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < pageCount;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hasPrevious ? getPageHref(pathname, page - 1) : undefined}
            aria-disabled={!hasPrevious || undefined}
            className={hasPrevious ? undefined : DISABLED_CLASS}
          />
        </PaginationItem>
        {getPageNumbers(page, pageCount).map((token, index) => (
          <PaginationItem key={token === "ellipsis" ? `ellipsis-${index}` : token}>
            {token === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={getPageHref(pathname, token)}
                isActive={token === page}
                aria-label={`Page ${token}`}
              >
                {token}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={hasNext ? getPageHref(pathname, page + 1) : undefined}
            aria-disabled={!hasNext || undefined}
            className={hasNext ? undefined : DISABLED_CLASS}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
