"use client";

// Document preview card used on the detail page. Shows an image thumbnail that
// opens the lightbox on click, or a "Not uploaded" placeholder when null.
import { ImageOff, Maximize2 } from "lucide-react";

export default function DocumentCard({
  label,
  src,
  onOpen,
}: {
  label: string;
  src: string | null;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
      </div>

      {src ? (
        <button
          type="button"
          onClick={onOpen}
          className="group relative block aspect-[4/3] w-full overflow-hidden bg-slate-50"
          aria-label={`Open ${label} full size`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/30">
            <span className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100">
              <Maximize2 className="h-4 w-4" />
              View full size
            </span>
          </span>
        </button>
      ) : (
        <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm font-medium">Not uploaded</span>
        </div>
      )}
    </div>
  );
}
