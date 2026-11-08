import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useYRoom } from "./hooks/useYRoom";
import Editor, { EditorHandle } from "./components/Editor";
import FileTree from "./components/FileTree";
import TabsBar from "./components/TabsBar";
import { ChatText } from "./components/ChatText";
import { ChatVoice } from "./components/ChatVoice";
import { LanguageToggle } from "./components/LanguageToggle";
import AIHelper from "./components/AIHelper";

const translations: Record<string, string> = {
  title: "Code Collab",
  editor_title: "Collaborative Code Editor",
  run: "Run",
  save: "Save",
  send: "Send",
  connected: "Connected",
  connecting: "Connecting...",
  room: "Room",
  create_room: "Create Room",
  join_room: "Join Room",
  anonymous: "Anonymous",
  profile: "Profile",
  mute: "Mute Mic",
  unmute: "Unmute Mic",
  chat_title: "Chat (Text & Voice)",
};

export default function App() {
  const [language, setLanguage] = useState("fr");
  const [roomId, setRoomId] = useState("default");
  const [roomInput, setRoomInput] = useState("default");
  const [currentFile, setCurrentFile] = useState("main.js");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "chat">("editor");
  const editorRef = useRef<EditorHandle>(null);
  const t = (key: string) => translations[key];

  const room = useYRoom(roomId);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Keep currentFile valid (file deleted / room switched)
  useEffect(() => {
    if (!room.ready) return;
    const names = Array.from(room.files.keys());
    if (!names.includes(currentFile)) {
      setCurrentFile(names.includes("main.js") ? "main.js" : names[0] ?? "main.js");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.ready, currentFile]);

  const yText: Y.Text | null = room.ready
    ? room.files.get(currentFile) ?? room.files.get("main.js") ?? null
    : null;

  const fileList = room.ready ? Array.from(room.files.keys()).sort() : [];

  const createFile = (name: string, content = "") => {
    if (!room.ready) return;
    if (!room.files.has(name)) room.files.set(name, new Y.Text(content));
    setCurrentFile(name);
  };

  const deleteFile = (name: string) => {
    if (!room.ready) return;
    room.files.delete(name);
  };

  const selectFileAndCloseDrawer = (name: string) => {
    setCurrentFile(name);
    setDrawerOpen(false);
  };

  // Sidebar content — shared between desktop aside and mobile drawer
  const sidebarBody = (
    <>
      {/* Room */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded transition-colors">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {t("room")}: <strong>{roomId}</strong>
        </p>
        <input
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setRoomId(roomInput.trim() || "default")}
          placeholder="Room ID"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-sm placeholder-gray-400"
        />
        <button
          onClick={() => setRoomId(roomInput.trim() || "default")}
          className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 transition"
        >
          {t("join_room")}
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 min-h-0 flex flex-col rounded border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {room.ready ? (
          <FileTree
            files={room.files}
            current={currentFile}
            onSelect={selectFileAndCloseDrawer}
            onCreate={(name) => createFile(name)}
            onDelete={deleteFile}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
            Connexion à la room…
          </div>
        )}
      </div>

      {/* AI helper */}
      <AIHelper
        currentFile={currentFile}
        onInsertCurrent={(code) => {
          setMobileTab("editor");
          editorRef.current?.insertAtCursor(code);
        }}
        onCreateFile={(name, content) => {
          setMobileTab("editor");
          createFile(name, content);
        }}
      />
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* ===== Mobile top bar ===== */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-12 flex items-center justify-between px-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <h1 className="text-base font-bold pr-1">{t("title")}</h1>
        <div className="flex items-center gap-1.5">
          <LanguageToggle language={language} setLanguage={setLanguage} />
          <button
            onClick={() => setDark((d) => !d)}
            title={dark ? "Mode clair" : "Mode sombre"}
            className="px-1.5 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            title="Fichiers & réglages"
            className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
          >
            ☰
          </button>
        </div>
      </header>

      {/* ===== Mobile drawer (fichiers / room / IA) ===== */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2 overflow-hidden shadow-2xl transition-colors">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Fichiers & réglages
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-2 py-1 rounded text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Fermer"
              >
                ✕
              </button>
            </div>
            {sidebarBody}
          </div>
        </div>
      )}

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-3 flex-col gap-2 transition-colors">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <div className="flex items-center gap-2">
            <LanguageToggle language={language} setLanguage={setLanguage} />
            <button
              onClick={() => setDark((d) => !d)}
              title={dark ? "Mode clair" : "Mode sombre"}
              className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
        {sidebarBody}
      </aside>

      {/* ===== Main area ===== */}
      <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors">
        {/* Editor pane */}
        <div
          className={`${
            mobileTab === "chat" ? "hidden md:flex" : "flex"
          } flex-1 min-h-0 flex-col overflow-hidden transition-colors pb-14 md:pb-0`}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0 transition-colors">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t("editor_title")}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[40%]">{roomId}</span>
          </div>
          {room.ready && (
            <TabsBar files={fileList} current={currentFile} onSelect={setCurrentFile} />
          )}
          {room.ready && yText ? (
            <Editor
              key={`${roomId}-${currentFile}`}
              ref={editorRef}
              yText={yText}
              awareness={room.provider.awareness}
              provider={room.provider}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              {room.ready ? "Aucun fichier — crée-en un ＋" : "Connexion à la room…"}
            </div>
          )}
        </div>

        {/* Chat pane */}
        <aside
          className={`${
            mobileTab === "chat" ? "flex" : "hidden md:flex"
          } min-h-0 flex-1 md:flex-none md:h-96 flex-col bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 border-b-0 md:border-b transition-colors pb-14 md:pb-0`}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 transition-colors">
            {t("chat_title")}
          </div>
          <ChatText key={`chat-${roomId}`} roomId={roomId} userId="user1" />
          <ChatVoice roomId={roomId} userId="user1" />
        </aside>
      </main>

      {/* ===== Mobile bottom tab bar ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 flex bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition ${
            mobileTab === "editor"
              ? "text-blue-600 dark:text-blue-300 font-semibold"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span className="text-lg leading-none">📝</span>
          Éditeur
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition ${
            mobileTab === "chat"
              ? "text-blue-600 dark:text-blue-300 font-semibold"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span className="text-lg leading-none">💬</span>
          Chat
        </button>
      </nav>
    </div>
  );
}
