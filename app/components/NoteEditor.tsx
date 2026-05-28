import { useMemo } from "react";
import { X, Save, Trash2, Loader2, ArrowLeft, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { Note, NoteImage, AutoSaveStatus } from "~/lib/types";
import { MAX_NOTE_BYTES } from "~/lib/types";
import { formatBytes, isImageAttachment } from "~/lib/i18n";
import type { Translations } from "~/lib/i18n";
import { ImagePanel } from "./ImagePanel";

interface NoteEditorProps {
  selectedNote: Note | null;
  isCreating: boolean;
  editTitle: string;
  editContent: string;
  editImages: NoteImage[];
  isSaving: boolean;
  isDeleting: boolean;
  autoSaveStatus: AutoSaveStatus;
  remoteSyncStatus: "idle" | "updated";
  imagesPanelHeight: number;
  t: Translations;
  setEditTitle: (title: string) => void;
  setEditContent: (content: string) => void;
  setEditImages: React.Dispatch<React.SetStateAction<NoteImage[]>>;
  setImagesPanelHeight: (h: number) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onBack: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onImageDoubleClick: (img: NoteImage) => void;
  onImageContextMenu: (e: React.MouseEvent, img: NoteImage) => void;
  onImagesPanelResizeMouseDown: (e: React.MouseEvent) => void;
}

export function NoteEditor({
  selectedNote,
  isCreating,
  editTitle,
  editContent,
  editImages,
  isSaving,
  isDeleting,
  autoSaveStatus,
  remoteSyncStatus,
  imagesPanelHeight,
  t,
  setEditTitle,
  setEditContent,
  setEditImages,
  onBack,
  onCancelEdit,
  onSave,
  onDelete,
  onAddFiles,
  onImageDoubleClick,
  onImageContextMenu,
  onImagesPanelResizeMouseDown,
}: NoteEditorProps) {
  const noteSizeBytes = useMemo(() => {
    const approxNote = {
      id: selectedNote?.id ?? "00000000-0000-0000-0000-000000000000",
      title: editTitle,
      content: editContent,
      images: editImages,
      createdAt: selectedNote?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new TextEncoder().encode(JSON.stringify(approxNote)).byteLength;
  }, [editTitle, editContent, editImages, selectedNote]);

  const isOverLimit = noteSizeBytes > MAX_NOTE_BYTES;
  const isNearLimit = !isOverLimit && noteSizeBytes > MAX_NOTE_BYTES * 0.9;

  const sizeColor = isOverLimit
    ? "text-red-500"
    : isNearLimit
    ? "text-orange-500"
    : noteSizeBytes > MAX_NOTE_BYTES * 0.7
    ? "text-yellow-600 dark:text-yellow-500"
    : "text-gray-400 dark:text-slate-500";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            {isCreating ? t.newNoteLabel : t.editing}
          </span>
          {!isCreating && (
            <span className="text-xs flex items-center gap-1">
              {autoSaveStatus === "pending" && (
                <span className="text-gray-400 dark:text-slate-500 hidden md:inline">{t.unsavedChanges}</span>
              )}
              {autoSaveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400 dark:text-slate-500" />
                  <span className="text-gray-400 dark:text-slate-500 hidden md:inline">{t.saving}</span>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 hidden md:inline">{t.saved}</span>
                </>
              )}
              {autoSaveStatus === "error" && (
                <span className="text-red-500 dark:text-red-400 hidden md:inline">{t.autoSaveFailed}</span>
              )}
              {autoSaveStatus === "idle" && remoteSyncStatus === "updated" && (
                <>
                  <RefreshCw className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 hidden md:inline">{t.remoteUpdated}</span>
                </>
              )}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 md:gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelEdit}
            className="cursor-pointer h-8 px-2 md:px-3 text-xs border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 bg-transparent"
          >
            <X className="w-3.5 h-3.5 md:mr-1" />
            <span className="hidden md:inline">{t.cancel}</span>
          </Button>
          {selectedNote && !isCreating && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={isDeleting}
              className="cursor-pointer h-8 px-2 md:px-3 text-xs border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 bg-transparent"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 md:mr-1" />
              )}
              <span className="hidden md:inline">{t.delete}</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || isOverLimit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer h-8 px-2 md:px-3 text-xs"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 md:mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 md:mr-1" />
            )}
            <span className="hidden md:inline">{t.save}</span>
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 flex-shrink-0">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
          className="w-full text-2xl font-bold text-gray-900 dark:text-slate-100 bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-slate-700"
        />
      </div>
      <div className="mx-4 md:mx-8 border-b border-gray-100 dark:border-slate-800 flex-shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col px-4 md:px-8 pt-4 pb-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder={t.contentPlaceholder}
            className="flex-1 w-full text-gray-700 dark:text-slate-300 bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-slate-700 text-sm leading-relaxed"
          />
        </div>
      </div>

      <ImagePanel
        images={editImages}
        panelHeight={imagesPanelHeight}
        t={t}
        onAddFiles={onAddFiles}
        onRemoveImage={(id) => setEditImages((prev) => prev.filter((i) => i.id !== id))}
        onImageDoubleClick={onImageDoubleClick}
        onImageContextMenu={onImageContextMenu}
        onResizeMouseDown={onImagesPanelResizeMouseDown}
      />

      <div className="px-4 md:px-8 py-2 flex items-center justify-end gap-1.5 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
        {isOverLimit && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        <span className={cn("text-xs", sizeColor)}>
          {formatBytes(noteSizeBytes)} / 25 MB
        </span>
        {isOverLimit && (
          <span className="text-xs text-red-500">{t.exceedsLimit}</span>
        )}
        {isNearLimit && !isOverLimit && (
          <span className="text-xs text-orange-500">{t.approachingLimit}</span>
        )}
      </div>
    </div>
  );
}
