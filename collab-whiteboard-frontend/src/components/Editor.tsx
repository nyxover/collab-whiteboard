import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { basicSetup } from "codemirror";
import { yCollab } from "y-codemirror.next";

export interface EditorHandle {
  insertAtCursor: (text: string) => void;
}

interface EditorProps {
  yText: Y.Text;
  awareness: Awareness;
  provider: WebsocketProvider | null;
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { yText, awareness, provider: _provider },
  ref
) {
  const viewRef = useRef<HTMLDivElement>(null);
  const cmRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    insertAtCursor: (text: string) => {
      const view = cmRef.current;
      if (!view) return;
      const pos = view.state.selection.main.head;
      view.dispatch({ changes: { from: pos, insert: text } });
    },
  }));

  useEffect(() => {
    const state = EditorState.create({
      extensions: [
        basicSetup,
        javascript(),
        yCollab(yText, awareness),
      ],
    });

    const view = new EditorView({
      state,
      parent: viewRef.current ?? undefined,
    });
    cmRef.current = view;

    return () => {
      view.destroy();
      cmRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yText]);

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#1e1e22]">
      <div ref={viewRef} />
    </div>
  );
});

export default Editor;
