"use client";

// Accessible modal shell: backdrop, escape-to-close, focus trap entry, scroll lock.
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

export default function Modal({
  open,
  onClose,
  children,
  labelledBy,
  closeOnBackdrop = true,
  size = "sm",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  closeOnBackdrop?: boolean;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock background scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the panel for keyboard users.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 max-h-[90vh] w-full ${SIZE_CLASSES[size]} animate-slide-up overflow-y-auto rounded-xl bg-white p-6 shadow-card-hover focus:outline-none`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
