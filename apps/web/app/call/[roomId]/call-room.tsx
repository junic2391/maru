"use client";

import { ClientToServer, RoomId, ServerToClient } from "@maru/shared-types";
import { useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

function assertNever(x: never): never {
  throw new Error(`처리하지 않은 이벤트: ${JSON.stringify(x)}`);
}

export function CallRoom({ roomId }: { roomId: RoomId }) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("입장 중...");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const socket = new WebSocket(WS_URL);
    const send = (msg: ClientToServer) => socket.send(JSON.stringify(msg));

    pc.ontrack = (e) => {
      const [first] = e.streams;
      if (first && remoteVideo.current) {
        remoteVideo.current.srcObject = first;
        setStatus("연결됨");
      }
    };

    pc.onicecandidate = (e) => {
      if (!e.candidate || socket.readyState !== WebSocket.OPEN) {
        return;
      }
      send({
        type: "ice",
        roomId,
        candidate: {
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
        },
      });
    };

    async function makeOffer() {
      await pc.setLocalDescription(await pc.createOffer());
      send({ type: "offer", roomId, sdp: pc.localDescription?.sdp ?? "" });
    }

    async function onMessage(raw: string) {
      const msg = JSON.parse(raw) as ServerToClient;
      switch (msg.type) {
        case "room-joined":
          if (msg.peers.length === 0) {
            setStatus("상대를 기다리는 중...");
            return;
          }
          setStatus("연결 중...");
          return makeOffer();
        case "peer-joined":
          setStatus("상대가 들어왔습니다.");
          return;
        case "offer":
          await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
          await pc.setLocalDescription(await pc.createAnswer());
          send({ type: "answer", roomId, sdp: pc.localDescription?.sdp ?? "" });
          return;
        case "answer":
          await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
          return;
        case "ice":
          await pc.addIceCandidate(msg.candidate);
          return;
        case "peer-left":
          setStatus("상대가 나갔습니다.");
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
          }
          return;
        case "error":
          setStatus(`오류: ${msg.code}`);
          return;
        default:
          return assertNever(msg);
      }
    }

    socket.onmessage = (e: MessageEvent<string>) => {
      onMessage(e.data);
    };

    (async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      const join = () => send({ type: "join-room", roomId });
      if (socket.readyState === WebSocket.OPEN) {
        join();
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      socket.close();
      pc.close();
    };
  }, [roomId]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 16 }}>
      <p>{status}</p>
      <video ref={remoteVideo} autoPlay playsInline width={320}></video>
      <video ref={localVideo} autoPlay playsInline muted width={160}></video>
    </main>
  );
}
