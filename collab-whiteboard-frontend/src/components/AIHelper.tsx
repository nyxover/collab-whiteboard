import { useState } from "react";

interface AIHelperProps {
  currentFile: string;
  onInsertCurrent: (code: string) => void;
  onCreateFile: (name: string, content: string) => void;
}

function suggestFileName(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .join("-");
  return `${words || "ai-code"}-${Math.floor(Math.random() * 90 + 10)}.js`;
}

function extractCode(content: string): string {
  // Prefer the fenced code block if present, keep raw text otherwise
  const match = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return (match ? match[1] : content).trim();
}

export default function AIHelper({ currentFile, onInsertCurrent, onCreateFile }: AIHelperProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ai-collapsed") === "1");
  const [byok, setByok] = useState(() => localStorage.getItem("ai-byok") ?? "");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem("ai-collapsed", c ? "0" : "1");
      return !c;
    });
  };

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (byok.trim()) headers["x-ai-key"] = byok.trim();

      const res = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "no_ai_key") {
          setError("Aucune clé. Options: AI_API_KEY dans backend\\.env — ou clé perso ci-dessous (🔑).");
          setShowKey(true);
        } else {
          setError(data.message ?? data.error ?? "Erreur inconnue");
        }
      } else {
        const code = extractCode(data.code ?? "");
        setResult(code);
        setLastPrompt(prompt.trim());
      }
    } catch {
      setError("Backend injoignable (cargo run lancé ?)");
    } finally {
      setLoading(false);
    }
  };

  const insertCurrent = () => {
    if (result) {
      onInsertCurrent(`\n${result}\n`);
      setCopied(`inséré dans ${currentFile}`);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  const newFile = () => {
    if (result) {
      onCreateFile(suggestFileName(lastPrompt), result);
      setCopied("fichier créé ✅");
      setTimeout(() => setCopied(""), 2000);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        className="m-2 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow hover:bg-purple-500 transition self-start"
        title="Ouvrir l'assistant IA"
      >
        ✨ IA
      </button>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm transition-colors">
      <div className="flex items-center px-2 py-1 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wide flex-1">
          ✨ Assistant IA
        </span>
        <button
          onClick={() => setShowKey((s) => !s)}
          title="Clé API personnelle (optionnel)"
          className="px-1 hover:opacity-60 transition"
        >
          🔑
        </button>
        <button
          onClick={toggleCollapsed}
          title="Replier"
          className="px-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          ∨
        </button>
      </div>

      {showKey && (
        <div className="px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200 dark:border-gray-700">
          <input
            type="password"
            value={byok}
            onChange={(e) => {
              setByok(e.target.value);
              localStorage.setItem("ai-byok", e.target.value);
            }}
            placeholder="Colle ta clé gratuite (stockée localement)"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-xs placeholder-gray-400"
          />
        </div>
      )}

      <div className="p-2 space-y-2">
        <div className="flex gap-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Ex: une fonction debounce en TS…"
            className="flex-1 min-w-0 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-xs placeholder-gray-400"
          />
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="px-2 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 disabled:opacity-40 transition"
          >
            {loading ? "…" : "Go"}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-1.5">
            <pre className="max-h-32 overflow-auto bg-gray-900 text-gray-100 rounded p-2 text-xs">
              {result}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Destinée à: <strong>{currentFile}</strong> ou un nouveau fichier
            </p>
            <div className="flex gap-1">
              <button
                onClick={insertCurrent}
                className="flex-1 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-500 transition"
              >
                ↙ Fichier actuel
              </button>
              <button
                onClick={newFile}
                className="flex-1 px-2 py-1 rounded bg-gray-600 dark:bg-gray-600 text-white text-xs hover:bg-gray-500 transition"
              >
                ＋ Nouveau fichier
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 dark:text-green-400">{copied}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
