import { useState, useEffect, useRef } from "react";

export function ChatText({ roomId }: { roomId: string; userId: string }) {
  const [messages, setMessages] = useState<Array<{ user: string; text: string; time: string }>>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket("ws://localhost:3000/ws");
    } catch {
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "message") {
          setMessages((prev) => [
            ...prev,
            { ...msg, time: new Date().toLocaleTimeString() },
          ]);
        }
      } catch {
        /* ignore non-JSON messages */
      }
    };

    return () => ws.close();
  }, [roomId]);

  const sendMessage = () => {
    const ws = wsRef.current;
    if (input.trim() && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", text: input }));
      setInput("");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-2">
        <span className={`text-xs ${connected ? "text-green-600" : "text-red-500"}`}>
          {connected ? "Server connected" : "Server not reachable (start cargo run)"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-xs font-bold text-blue-600">{m.user}</span>
            <span className="text-sm text-gray-700">{m.text}</span>
            <span className="text-xs text-gray-400 ml-auto">{m.time}</span>
          </div>
        ))}
      </div>
      <div className="p-2 md:p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Type message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 min-w-0 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-100 text-sm placeholder-gray-400"
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded text-sm shrink-0 self-stretch">
          Send
        </button>
      </div>
    </div>
  );
}
