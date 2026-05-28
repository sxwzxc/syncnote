import { Trash2, Loader2, ArrowLeft, File } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Note, NoteImage } from "~/lib/types";
import { formatDate, isImageAttachment, getAttachmentBadge } from "~/lib/i18n";
import type { Translations } from "~/lib/i18n";

interface NoteViewerProps {
  note: Note;
  isDeleting: boolean;
  t: Translations;
  onDelete: () => void;
  onBack: () => void;
  onImageDoubleClick: (img: NoteImage) => void;
  onImageContextMenu: (e: React.MouseEvent, img: NoteImage) => void;
}

export function NoteViewer({
  note,
  isDeleting,
  t,
  onDelete,
  onBack,
  onImageDoubleClick,
  onImageContextMenu,
}: NoteViewerProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {t.lastUpdated} {formatDate(note.updatedAt)}
          </span>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting}
          className="cursor-pointer h-8 px-3 text-xs"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5 mr-1" />
          )}
          {t.delete}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          {note.title}
        </h1>
        <div className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
          {note.content || (
            <span className="text-gray-300 dark:text-slate-600 italic">No content yet.</span>
          )}
        </div>
        {note.images && note.images.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {note.images.map((img) => (
                isImageAttachment(img) ? (
                  <img
                    key={img.id}
                    src={img.data}
                    alt={img.name}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-slate-700 cursor-zoom-in hover:opacity-90 transition-opacity"
                    onDoubleClick={() => onImageDoubleClick(img)}
                    onContextMenu={(e) => onImageContextMenu(e, img)}
                  />
                ) : (
                  <div
                    key={img.id}
                    className="w-24 h-24 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    onDoubleClick={() => onImageDoubleClick(img)}
                    onContextMenu={(e) => onImageContextMenu(e, img)}
                    title={img.name}
                  >
                    <File className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                    <span className="mt-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400 max-w-[90%] truncate">
                      {getAttachmentBadge(img)}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
