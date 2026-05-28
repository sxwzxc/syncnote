import { useState } from "react";
import { Lock, Eye, EyeOff, AlertTriangle, Loader2, FileText, Moon, Sun } from "lucide-react";
import type { Translations, Lang } from "~/lib/i18n";
import { AUTH_API } from "~/lib/types";
import { saveAuth } from "~/lib/i18n";

interface LoginScreenProps {
  onSuccess: () => void;
  t: Translations;
  lang: Lang;
  toggleLang: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export function LoginScreen({ onSuccess, t, lang, toggleLang, theme, toggleTheme }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        saveAuth();
        onSuccess();
      } else {
        setError(data.error || t.incorrectPassword);
      }
    } catch {
      setError(t.connectError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <button
          onClick={toggleLang}
          title={lang === "en" ? "切换中文" : "Switch to English"}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
        >
          {lang === "en" ? "中" : "EN"}
        </button>
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Dark mode" : "Light mode"}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">SyncNote</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t.enterPassword}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoFocus
                className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.signIn}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">
            {t.sessionDuration}
          </p>
        </div>
      </div>
    </div>
  );
}
