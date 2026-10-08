"use client";

import Modal from "@/components/admin/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="mt-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-600">
          <svg
            aria-hidden="true"
            className="size-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          >
            <path d="M12 3.5 2.8 20h18.4L12 3.5Z" />
            <path d="M12 9v4.5M12 17h.01" />
          </svg>
        </span>
        <p className="mt-4 text-sm leading-6 text-muted">{message}</p>
        <div className="mt-7 flex justify-center gap-3">
          <button
            className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            className="min-h-11 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </Modal>
  );
}