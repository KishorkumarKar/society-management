"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  function getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const delta = 1;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");

    pages.push(totalPages);
    return pages;
  }

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-paper-dim">
      {/* Info */}
      <div className="text-xs text-muted">
        Showing <span className="font-medium text-ink">{start}</span>–
        <span className="font-medium text-ink">{end}</span> of{" "}
        <span className="font-medium text-ink">{totalItems}</span> results
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Page size */}
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-paper-dim bg-paper px-2 py-1.5 text-ink focus:border-brass outline-none"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
        )}

        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 text-ink border border-paper-dim hover:border-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="First"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 text-ink border border-paper-dim hover:border-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-xs text-muted">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] h-7 text-xs font-medium transition-colors ${
                  currentPage === p
                    ? "bg-brass text-ink"
                    : "text-ink border border-paper-dim hover:border-ink"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 text-ink border border-paper-dim hover:border-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 text-ink border border-paper-dim hover:border-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Last"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}