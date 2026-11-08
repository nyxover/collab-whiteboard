import { useEffect, useState } from "react";
import * as Y from "yjs";

interface FileTreeProps {
  files: Y.Map<Y.Text>;
  current: string;
  onSelect: (name: string) => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
}

function fileIcon(name: string): string {
  if (name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".mjs")) return "🟨";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "🔷";
  if (name.endsWith(".py")) return "🐍";
  if (name.endsWith(".rs")) return "🦀";
  if (name.endsWith(".html")) return "🌐";
  if (name.endsWith(".css")) return "🎨";
  if (name.endsWith(".json")) return "📑";
  if (name.endsWith(".md")) return "📝";
  return "📄";
}

export default function FileTree({ files, current, onSelect, onCreate, onDelete }: FileTreeProps) {
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!files) return;
    const update = () => setNames(Array.from(files.keys()).sort());
    files.observe(update);
    update();
    return () => {
      if (files) files.observe(update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleCreate = () => {
    const name = newName.trim() || `untitled-${Date.now() % 1000}.js`;
    onCreate(name);
    setNewName("");
    onSelect(name);
  };

  return (
    <div className="text-sm">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-1">
          Fichiers
        </span>
        <button
          onClick={handleCreate}
          title="Nouveau fichier"
          className="px-1.5 rounded hover:bg-blue-600 hover:text-white text-green-700 dark:text-green-400 font-bold transition"
        >
          ＋
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto max-h-40">
        {names.map((name) => (
          <li key={name} className="group flex items-center">
            <button
              onClick={() => onSelect(name)}
              className={`flex-1 text-left px-2 py-1 truncate transition ${
                name === current
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="mr-1.5">{fileIcon(name)}</span>
              {name}
            </button>
            <button
              onClick={() => onDelete(name)}
              title="Supprimer"
              className="opacity-0 group-hover:opacity-100 px-1.5 text-red-500 hover:text-red-400 transition"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      <div className="px-2 py-1 border-t border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="main.js, index.py…"
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-xs placeholder-gray-400"
        />
      </div>
    </div>
  );
}
