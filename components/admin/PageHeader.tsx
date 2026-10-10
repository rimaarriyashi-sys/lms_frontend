"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-sm font-medium text-brand">{eyebrow}</p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl leading-tight font-semibold text-ink sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}