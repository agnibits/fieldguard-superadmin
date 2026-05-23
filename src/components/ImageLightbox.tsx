"use client";

// Fullscreen image viewer with zoom in/out, reset, and click-to-toggle zoom.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const STEP = 0.5;

export default function ImageLightbox({
  open,
  src,
  alt,
  onClose,
}: {
  open: boolean;
  src: string | null;
  alt: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) setZoom(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(MAX_ZOOM, z + STEP));
      if (e.key === "-") setZoom((z) => Math.max(MIN_ZOOM, z - STEP));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !src || typeof document === "undefined") return null;

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + STEP));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - STEP));
  const reset = () => setZoom(1);

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="truncate pr-4 text-sm font-medium text-slate-200">{alt}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="rounded-lg p-2 transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="w-12 text-center text-sm tabular-nums text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="rounded-lg p-2 transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={reset}
            className="rounded-lg p-2 transition hover:bg-white/10"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="ml-2 rounded-lg p-2 transition hover:bg-white/10"
            aria-label="Close viewer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Image area — click outside the image closes; click image toggles zoom. */}
      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => (z === 1 ? 2 : 1));
          }}
          style={{ transform: `scale(${zoom})` }}
          className={`max-h-full max-w-full origin-center select-none rounded-lg object-contain shadow-2xl transition-transform duration-200 ${
            zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
}
