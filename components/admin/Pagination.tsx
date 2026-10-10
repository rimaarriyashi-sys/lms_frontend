"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function getVisiblePages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) return [1, 2, 3, 4, "…", totalPages];
  if (page >= totalPages - 2) {
    return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "…", page - 1, page, page + 1, "…", totalPages];
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(total / safePageSize);
  const currentPage = Math.min(Math.max(1, page), Math.max(totalPages, 1));
  const start = total === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const end = Math.min(currentPage * safePageSize, total);
  const buttonClass =
    "grid size-9 place-items-center rounded-lg border border-line text-sm text-ink transition-colors hover:border-brand/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-muted sm:text-sm">
        Menampilkan {start}–{end} dari {total.toLocaleString("id-ID")}
      </p>
      <div className="flex items-center gap-1">
        <button
          aria-label="Halaman sebelumnya"
          className={buttonClass}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          </svg>
        </button>
        {getVisiblePages(currentPage, totalPages).map((item, index) =>
          item === "…" ? (
            <span aria-hidden="true" className="px-1 text-sm text-muted" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`Halaman ${item}`}
              className={`${buttonClass} ${item === currentPage ? "border-brand bg-brand text-white hover:bg-brand-dark" : ""}`}
              key={item}
              onClick={() => onPageChange(item)}
              type="button"
            >
              {item}
            </button>
          ),
        )}
        <button
          aria-label="Halaman berikutnya"
          className={buttonClass}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}