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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2 transition-colors">
        <div className="flex items-center justify-between mb-1">
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

        {/* File tree (pushed to bottom, above AI helper) */}
        <div className="flex-1 min-h-0 flex flex-col rounded border border-gray-200 dark:border-gray-700 overflow-hidden mt-auto transition-colors">
          {room.ready ? (
            <FileTree
              files={room.files}
              current={currentFile}
              onSelect={setCurrentFile}
              onCreate={(name) => createFile(name)}
              onDelete={deleteFile}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
              Connexion à la room…
            </div>
          )}
        </div>

        {/* AI helper — bottom left */}
        <AIHelper
          currentFile={currentFile}
          onInsertCurrent={(code) => editorRef.current?.insertAtCursor(code)}
          onCreateFile={(name, content) => createFile(name, content)}
        />
      </aside>

      <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors">
        <div className="flex-1 flex flex-col border-b border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 transition-colors">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t("editor_title")}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{roomId}</span>
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
        <aside className="h-96 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
            {t("chat_title")}
          </div>
          <ChatText key={`chat-${roomId}`} roomId={roomId} userId="user1" />
          <ChatVoice roomId={roomId} userId="user1" />
        </aside>
      </main>
    </div>
  );
}
