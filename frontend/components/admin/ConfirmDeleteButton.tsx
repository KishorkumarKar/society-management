"use client";

import { Trash2 } from "lucide-react";

export default function ConfirmDeleteButton({
  label,
  onConfirm,
}: {
  label: string;
  onConfirm: () => void;
}) {
  function handleClick() {
    if (window.confirm(`Delete ${label}? This can't be undone in this session.`)) {
      onConfirm();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Delete ${label}`}
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/40 transition-colors hover:border-rust hover:text-rust"
    >
      <Trash2 size={15} strokeWidth={1.75} />
    </button>
  );
}
