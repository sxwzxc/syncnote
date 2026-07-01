import { FileText, Loader2, PlusCircle, Languages, Moon, Sun, LogOut, Database } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { NoteIndex, StorageType } from "~/lib/types";
import type { Translations, Lang } from "~/lib/i18n";
import { formatDate } from "~/lib/i18n";

interface NotesSidebarProps {
  notesList: NoteIndex[];
  selectedNoteId: string | null;
  isLoading: boolean;
  sidebarWidth: number;
  isDesktop: boolean;
  mobileShowEditor: boolean;
  t: Translations;
  lang: Lang;
  theme: "light" | "dark";
  storage: StorageType;
  toggleLang: () => void;
  toggleTheme: () => void;
  onStorageChange: (next: StorageType) => void;
  onLogout: () => void;
  onNewNote: () => void;
  onSelectNote: (id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
}

export function NotesSidebar({
  notesList,
  selectedNoteId,
  isLoading,
  sidebarWidth,
  isDesktop,
  mobileShowEditor,
  t,
  lang,
  theme,
  storage,
  toggleLang,
  toggleTheme,
  onStorageChange,
  onLogout,
  onNewNote,
  onSelectNote,
  onResizeMouseDown,
}: NotesSidebarProps) {
  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 shadow-sm relative",
        "w-full",
        mobileShowEditor ? "hidden md:flex" : "flex"
      )}
      style={isDesktop ? { width: sidebarWidth } : undefined}
    >
      <div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-indigo-300/60 dark:hover:bg-indigo-600/40 transition-colors"
        onMouseDown={onResizeMouseDown}
        title={t.dragResizeHint}
      />
      <div className="flex flex-col border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">SyncNote</span>
            <span title={t.liveSync} className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={toggleLang}
              title={lang === "en" ? "切换中文" : "Switch to English"}
              className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Languages className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              title={theme === "light" ? "Dark mode" : "Light mode"}
              className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={onLogout}
              title={t.signOut}
              className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-3 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Database className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{t.storage}</span>
          </div>
          <div
            role="group"
            aria-label={t.storage}
            className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 flex-shrink-0"
          >
            {(["kv", "blob"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onStorageChange(opt)}
                title={opt === "kv" ? "EdgeOne KV" : "EdgeOne Pages Blob"}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                  storage === opt
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300",
                )}
              >
                {opt === "kv" ? t.storageKV : t.storageBlob}
              </button>
            ))}
          </div>
        </div>
        <div className="px-3 pb-3">
          <Button
            size="sm"
            onClick={onNewNote}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer h-8 text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            {t.newNote}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 dark:text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">{t.loading}</span>
          </div>
        ) : notesList.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">{t.noNotes}</p>
            <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">{t.noNotesHint}</p>
          </div>
        ) : (
          notesList.map((n) => (
            <button
              key={n.id}
              onClick={() => onSelectNote(n.id)}
              className={cn(
                "w-full text-left px-4 py-3 transition-all border-l-2 border-l-transparent",
                selectedNoteId === n.id
                  ? "bg-indigo-50 dark:bg-indigo-950/50 border-l-indigo-500 dark:border-l-indigo-400 text-indigo-900 dark:text-indigo-200"
                  : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
              )}
            >
              <p className="font-medium truncate text-sm leading-snug">{n.title}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatDate(n.updatedAt)}</p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
