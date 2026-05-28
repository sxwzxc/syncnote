import { useCallback } from "react";
import { File, Paperclip, X } from "lucide-react";
import type { NoteImage } from "~/lib/types";
import { isImageAttachment, getAttachmentBadge } from "~/lib/i18n";
import type { Translations } from "~/lib/i18n";

interface ImagePanelProps {
  images: NoteImage[];
  panelHeight: number;
  t: Translations;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveImage: (id: string) => void;
  onImageDoubleClick: (img: NoteImage) => void;
  onImageContextMenu: (e: React.MouseEvent, img: NoteImage) => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
}

export function ImagePanel({
  images,
  panelHeight,
  t,
  onAddFiles,
  onRemoveImage,
  onImageDoubleClick,
  onImageContextMenu,
  onResizeMouseDown,
}: ImagePanelProps) {
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onAddFiles(e.target.files);
        e.target.value = "";
      }
    },
    [onAddFiles]
  );

  return (
    <div
      className="flex-shrink-0 border-t border-gray-100 dark:border-slate-800 relative flex flex-col"
      style={{ height: panelHeight }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-10 hover:bg-indigo-300/50 dark:hover:bg-indigo-600/30 transition-colors"
        onMouseDown={onResizeMouseDown}
        title={t.dragResizeHint}
      />
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-3 pb-2">
        <div className="flex flex-wrap gap-2 items-start">
          {images.map((img) => (
            <div key={img.id} className="relative group w-16 h-16 flex-shrink-0">
              {isImageAttachment(img) ? (
                <img
                  src={img.data}
                  alt={img.name}
                  className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-slate-700 cursor-zoom-in"
                  onDoubleClick={() => onImageDoubleClick(img)}
                  onContextMenu={(e) => onImageContextMenu(e, img)}
                />
              ) : (
                <div
                  className="w-full h-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  onDoubleClick={() => onImageDoubleClick(img)}
                  onContextMenu={(e) => onImageContextMenu(e, img)}
                  title={img.name}
                >
                  <File className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <span className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-slate-400 leading-none max-w-[90%] truncate">
                    {getAttachmentBadge(img)}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                title={t.deleteFile}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <label
            title={t.addFile}
            className="w-16 h-16 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Paperclip className="w-4 h-4 text-gray-300 dark:text-slate-600" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
        {images.length === 0 && (
          <p className="mt-1 text-xs text-gray-300 dark:text-slate-600">
            {t.addFileHint}
          </p>
        )}
      </div>
    </div>
  );
}
