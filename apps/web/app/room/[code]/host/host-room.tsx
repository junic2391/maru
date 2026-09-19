"use client";

import {
  ClientToServer,
  PeerId,
  RoomId,
  ServerToClient,
} from "@maru/shared-types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

export function HostRoom({ code, roomId }: { code: string; roomId: RoomId }) {
  const router = useRouter();
  const localVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("상대방을 기다리고 있어요");
  const [guestWaiting, setGuestWaiting] = useState<PeerId | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 카메라 미리보기
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }
      })
      .catch(() => {});

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;
    const send = (msg: ClientToServer) => socket.send(JSON.stringify(msg));

    const join = () => send({ type: "join-room", roomId });
    if (socket.readyState === WebSocket.OPEN) {
      join();
    } else {
      socket.onopen = join;
    }

    socket.onmessage = (e: MessageEvent<string>) => {
      const msg = JSON.parse(e.data) as ServerToClient;
      switch (msg.type) {
        case "room-joined":
          return;
        case "guest-waiting":
          setGuestWaiting(msg.peerId);
          return;
        case "peer-joined":
          // 승인 후 대기실을 나와 통화 화면으로 이동 - RTC 협상 시작
          router.push(`/call/${roomId}`);
          return;
        case "peer-left":
          setStatus("상대방을 기다리고 있어요");
          setGuestWaiting(null);
          return;
        case "rejected":
          return;
        case "offer":
        case "answer":
        case "ice":
          return;
        case "error":
          setStatus(`오류: ${msg.code}`);
        default:
          return;
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId, router]);

  function approve() {
    if (!guestWaiting) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "approve-guest",
        roomId,
        peerId: guestWaiting,
      } satisfies ClientToServer),
    );
    setGuestWaiting(null);
  }

  function reject() {
    if (!guestWaiting) return;
    socketRef.current?.send(
      JSON.stringify({
        type: "reject-guest",
        roomId,
        peerId: guestWaiting,
      } satisfies ClientToServer),
    );
    setGuestWaiting(null);
  }

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${code}`
      : `/join/${code}`;

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: 16,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <video
        ref={localVideo}
        autoPlay
        playsInline
        muted
        width={320}
        style={{ borderRadius: 12 }}
      />

      <p style={{ marginTop: 16 }}>초대 링크</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input readOnly value={inviteUrl} style={{ flex: 1, padding: 8 }} />
        <button
          style={{
            background: "#C93850",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "8px 20px",
          }}
          onClick={() => navigator.clipboard.writeText(inviteUrl)}
        >
          복사
        </button>
      </div>
      <p style={{ fontSize: 12, color: "#6B6478" }}>
        한 사람만 들어올 수 있고, 24시간 뒤 만료돼요
      </p>

      {guestWaiting && (
        <div
          style={{
            border: "1px solid #E5E1F0",
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
          }}
        >
          <p>🔔 누군가 들어오려고 해요</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                background: "transparent",
                color: "#C93850",
                border: "1px solid #C93850",
                borderRadius: 999,
                padding: "8px 20px",
              }}
              onClick={reject}
            >
              거절
            </button>
            <button
              style={{
                background: "#C93850",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "8px 20px",
              }}
              onClick={approve}
            >
              들여보내기
            </button>
          </div>
        </div>
      )}

      <p style={{ marginTop: 16 }}>{status}</p>
    </main>
  );
}
