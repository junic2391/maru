"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function JoinForm({ code }: { code: string }) {
  const router = useRouter();
  const localVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
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

  async function enter() {
    setRequesting(true);
    const res = await fetch(`${API_URL}/rooms/by-code/${code}/guest-token`, {
      method: "POST",
    });
    if (!res.ok) {
      router.push(`/join/${code}`);
      return;
    }

    const { token, roomId } = (await res.json()) as {
      token: string;
      roomId: string;
    };
    // 대기 화면이 같은 토큰으로 소켓을 열음 - 쿼리스트링 대신 세션에 담아 주소창 또는 referrer에 남기지 않음
    sessionStorage.setItem(`guest-token:${roomId}`, token);
    router.push(`/join/${code}/waiting?roomId=${roomId}`);
  }

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: 16,
        textAlign: "center",
        maxWidth: 400,
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
      <p style={{ marginTop: 16 }}>
        <button
          style={{
            background: "#C93850",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "12px 24px",
          }}
          onClick={() => enter()}
          disabled={requesting}
        >
          들어가기
        </button>
      </p>
      <p style={{ fontSize: 12, color: "#6B6478" }}>가입하지 않아도 돼요</p>
    </main>
  );
}
