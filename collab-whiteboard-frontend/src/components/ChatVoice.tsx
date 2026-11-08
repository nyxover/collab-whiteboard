import { useState, useEffect, useRef } from "react";

export function ChatVoice({ roomId, userId }: { roomId: string; userId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let cancelled = false;

    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (cancelled) return;
      localStreamRef.current = stream;

      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = () => {};

      pc.ontrack = (_event) => {
        if (!cancelled) setIsConnected(true);
      };
    }

    setup();

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, [roomId, userId]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
      <h3 className="font-semibold mb-2 dark:text-gray-200">Mic on / off</h3>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${isMuted ? "bg-red-500" : "bg-green-500"} text-white shadow-lg transition`}
        >
          {isMuted ? "Off" : "On"}
        </button>
        <span className={`text-sm font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}>
          {isConnected ? "Connected" : "Connecting..."}
        </span>
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">
        WebRTC P2P - Voice chat in real time
      </p>
    </div>
  );
}
