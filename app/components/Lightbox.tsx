import { X, ImagePlus } from "lucide-react";
import type { NoteImage } from "~/lib/types";
import type { Translations } from "~/lib/i18n";

interface LightboxProps {
  img: NoteImage;
  t: Translations;
  onDownload: (img: NoteImage) => void;
  onClose: () => void;
}

export function Lightbox({ img, t, onDownload, onClose }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <button
        className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        onClick={(e) => { e.stopPropagation(); onDownload(img); }}
      >
        <ImagePlus className="w-4 h-4" />
        {t.downloadFile}
      </button>
      <img
        src={img.data}
        alt={img.name}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {img.name && (
        <p className="absolute bottom-5 left-5 text-white/60 text-sm truncate max-w-[60vw]">
          {img.name}
        </p>
      )}
    </div>
  );
}
