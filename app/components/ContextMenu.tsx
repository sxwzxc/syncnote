import { useMemo } from "react";
import { Eye, Download, Trash2 } from "lucide-react";
import type { NoteImage } from "~/lib/types";
import { isImageAttachment } from "~/lib/i18n";
import type { Translations } from "~/lib/i18n";

interface ContextMenuProps {
  x: number;
  y: number;
  img: NoteImage;
  inEditor: boolean;
  t: Translations;
  onView: (img: NoteImage) => void;
  onDownload: (img: NoteImage) => void;
  onDelete: (img: NoteImage) => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, img, inEditor, t, onView, onDownload, onDelete, onClose }: ContextMenuProps) {
  const position = useMemo(() => {
    const menuW = 168;
    const menuItems = (isImageAttachment(img) ? 1 : 0) + 1 + (inEditor ? 1 : 0);
    const menuH = menuItems * 36 + (inEditor ? 8 : 0) + 8;
    const posX = x + menuW > window.innerWidth ? x - menuW : x;
    const posY = y + menuH > window.innerHeight ? y - menuH : y;
    return { top: posY, left: posX };
  }, [x, y, img, inEditor]);

  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[168px]"
      style={position}
      onClick={(e) => e.stopPropagation()}
    >
      {isImageAttachment(img) && (
        <button
          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
          onClick={() => { onView(img); onClose(); }}
        >
          <Eye className="w-4 h-4 flex-shrink-0 text-gray-400" />
          {t.viewFile}
        </button>
      )}
      <button
        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
        onClick={() => { onDownload(img); onClose(); }}
      >
        <Download className="w-4 h-4 flex-shrink-0 text-gray-400" />
        {t.downloadFile}
      </button>
      {inEditor && (
        <>
          <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
          <button
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2"
            onClick={() => { onDelete(img); onClose(); }}
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            {t.deleteFile}
          </button>
        </>
      )}
    </div>
  );
}
