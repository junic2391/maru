"use client"

import { ClientToServer, RoomId, ServerToClient } from "@maru/shared-types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

type WaitState = "waiting" | "rejected" | "error";


export function WaitingRoom({code, roomId}: {code: string; roomId: RoomId}) {
    const router = useRouter();
 const localVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<WaitState>("waiting");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;
      })
      .catch(() => {});
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem(`guest-token:${roomId}`)
    if (!token) {
        router.push(`/join/${code}`);
        return;
    }

    const socket = new WebSocket(WS_URL);
    const send = (msg: ClientToServer) => socket.send(JSON.stringify(msg));
    const join = () => send({type: 'join-as-guest', token});
    if (socket.readyState === WebSocket.OPEN) {
        join();        
    } else {
        socket.onopen = join
    }

    socket.onmessage = (e: MessageEvent<string>) => {
        const msg = JSON.parse(e.data) as ServerToClient;
        switch (msg.type) {
            case 'room-joined':
                // 승인
                sessionStorage.removeItem(`guest-token:${roomId}`);
                router.push(`/call/${roomId}`);
                return;
            case 'rejected':
                // 승인 대기 화면은 두고 카메라만 끔 - 언마운트 정리를 기다리지 않음
                streamRef.current?.getTracks().forEach((t) => t.stop());
                setState("rejected");
                return;
            case 'error':
                setErrorCode(msg.code);
                setState("error");
                return;
            case 'guest-waiting':
            case 'peer-joined':
            case 'peer-left':
            case 'offer':
            case 'answer':
            case 'ice':
                return;
            default:
                return;            
        }
    }

    return () => socket.close();
  }, [code, roomId, router]);

  if (state === 'rejected') {
    return (
        <main style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}>
        <p>상대방이 들어오지 못하게 했어요</p>
        <p>
          <Link href="/">홈으로</Link>
        </p>
      </main>
    )
  }

   if (state === "error") {
    return (
      <main style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}>
        <p>오류: {errorCode}</p>
        <p>
          <Link href="/">홈으로</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}>
      <p>잠시만 기다려 주세요</p>
      <p>상대방이 확인하고 있어요</p>
      <video ref={localVideo} autoPlay playsInline muted width={240} style={{ borderRadius: 12 }} />
    </main>
  );
}