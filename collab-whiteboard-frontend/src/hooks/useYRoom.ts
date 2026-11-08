import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export interface YRoom {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  files: Y.Map<Y.Text>;
  ready: boolean;
}

function randomUserColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

export function useYRoom(roomId: string): YRoom {
  const [room, setRoom] = useState<YRoom | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", roomId, ydoc);
    const idb = new IndexeddbPersistence(`room-${roomId}`, ydoc);
    const files = ydoc.getMap<Y.Text>("files");

    provider.awareness.setLocalStateField("user", {
      name: "user1",
      color: randomUserColor(),
    });

    // Seed a starter file if the room is empty
    if (files.size === 0) {
      files.set("main.js", new Y.Text("// Welcome to Code Collab!\n// Type here — everyone sees it live.\n"));
    }

    setRoom({ ydoc, provider, files, ready: true });

    return () => {
      provider.destroy();
      idb.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  return room ?? { ydoc: null!, provider: null!, files: null!, ready: false };
}
