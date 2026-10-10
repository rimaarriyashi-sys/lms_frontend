"use client";

interface TableSkeletonProps {
  rows: number;
  columns: number;
}

export default function TableSkeleton({ rows, columns }: TableSkeletonProps) {
  return (
    <div aria-label="Memuat data" className="space-y-3" role="status">
      <span className="sr-only">Memuat data</span>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          className="grid gap-3"
          key={rowIndex}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span
              aria-hidden="true"
              className="h-4 animate-pulse rounded bg-line"
              key={columnIndex}
              style={{ width: columnIndex === 0 ? "78%" : "58%" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}