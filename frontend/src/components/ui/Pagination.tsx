import type { PaginationMeta } from "@/lib/pagination";

/*
 * Pagination — prev/next controls driven by the backend's pagination meta.
 * Dumb: it just reports which page was requested via onPageChange; the page
 * component owns the current-page state and refetches through its query key.
 */
type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
};

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <span className="text-sm text-base-content/60">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="join">
        <button
          type="button"
          className="btn btn-sm join-item"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          « Prev
        </button>
        <button
          type="button"
          className="btn btn-sm join-item"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next »
        </button>
      </div>
    </div>
  );
}
