"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="admin-modal-title"
        aria-modal="true"
        className={`relative my-auto w-full overflow-hidden rounded-2xl bg-white shadow-[0_28px_90px_-28px_rgba(17,17,17,0.48)] ${maxWidth}`}
        role="dialog"
      >
        <button
          aria-label="Tutup modal"
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onClose}
          type="button"
        >
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
            <path
              d="m18 6-12 12M6 6l12 12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
        <div className="p-6 pt-8 sm:p-8">
          <h2
            className="pr-10 text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)]"
            id="admin-modal-title"
          >
            {title}
          </h2>
          {children}
        </div>
      </section>
    </div>
  );
}