"use client";
import { useCallStore } from "@/entities/call/model/store";
import { ClientToServer, RoomId, ServerToClient } from "@maru/shared-types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

function assertNever(x: never): never {
  throw new Error(`처리하지 않은 이벤트: ${JSON.stringify(x)}`);
}

type GateState = "idle" | "requesting" | "denied" | "no-device";

// export를 붙이지 않는다 — app/ 아래 "use client" 파일에서 컴포넌트를 export하면
// Next.js가 함수 타입 prop(onGranted)을 Server Action으로 오인해 경고를 낸다.
// (node_modules/next/dist/server/typescript/rules/client-boundary.js)
function PermissionGate({
  onGranted,
}: {
  onGranted: (stream: MediaStream) => void;
}) {
  const [state, setState] = useState<GateState>("idle");

  async function request() {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      onGranted(stream);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") {
        setState("no-device");
      } else {
        setState("denied");
      }
    }
  }

  if (state === "denied") {
    return (
      <main
        style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}
      >
        <p>카메라와 마이크를 허용해야{"\n"}통화할 수 있어요</p>
        <button>허용하는 방법 보기</button>
        <button onClick={() => void request()}>다시 시도</button>
        <p>
          <a href="/home">← 홈으로</a>
        </p>
      </main>
    );
  }

  if (state === "no-device") {
    return (
      <main
        style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}
      >
        <p>연결된 카메라나 마이크를{"\n"}찾지 못했어요</p>
        <button onClick={() => void request()}>다시 시도</button>
      </main>
    );
  }

  return (
    <main
      style={{ fontFamily: "sans-serif", padding: 16, textAlign: "center" }}
    >
      <p>
        카메라와 마이크를 켤게요{"\n"}얼굴을 보고 목소리를 들어야 대화가
        되니까요
      </p>
      <button onClick={() => void request()} disabled={state === "requesting"}>
        허용하기
      </button>
      <p>허용해도 녹화하거나 저장하지 않아요</p>
    </main>
  );
}

export function CallRoom({ roomId }: { roomId: RoomId }) {
  const [stream, setStream] = useState<MediaStream | null>(null);

  if (!stream) {
    return <PermissionGate onGranted={setStream} />;
  }

  return <ActiveCall roomId={roomId} stream={stream} />;
}

function ActiveCall({
  roomId,
  stream,
}: {
  roomId: RoomId;
  stream: MediaStream;
}) {
  const router = useRouter();
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("입장 중...");
  const { dispatch } = useCallStore();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const startedAtRef = useRef(0);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  function handleEnd() {
    stream.getTracks().forEach((t) => t.stop()); // 하드웨어 반납
    pcRef.current?.close();
    socketRef.current?.close();
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    router.push(`/call/${roomId}/ended?duration=${duration}`);
  }

  function toggleMic() {
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function toggleCamera() {
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const socket = new WebSocket(WS_URL);
    pcRef.current = pc;
    socketRef.current = socket;
    startedAtRef.current = Date.now();

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

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case "connected":
          return;
        case "disconnected":
          dispatch({ type: "DISCONNECTED" });
          return;
        case "failed":
          dispatch({ type: "RETRY_FAILED", reason: "ice-failed" });
          return;
        default:
          return;
      }
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

    return () => {
      socket.close();
      pc.close();
    };
  }, [roomId, stream]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 16 }}>
      <div style={{ position: "fixed", top: 16, right: 16 }}>
        <button disabled style={{ opacity: 0.4 }} aria-label="신고 (준비 중)">
          ⚑ 신고
        </button>
      </div>
      <p>{status}</p>
      <video ref={remoteVideo} autoPlay playsInline width={320}></video>
      <video ref={localVideo} autoPlay playsInline muted width={160}></video>

      <div
        style={{
          position: "fixed",
          bottom: 32, // --space-8
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          padding: "12px 24px",
          borderRadius: 999, // --radius-full
          background: "rgba(28,24,48,0.6)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(28,24,48,0.16)", // --shadow-float
        }}
      >
        <button onClick={toggleMic}>{micOn ? "🎤 마이크" : "🔇 마이크"}</button>
        <button onClick={toggleCamera}>
          {cameraOn ? "📷 카메라" : "🚫 카메라"}
        </button>
        <button
          onClick={handleEnd}
          style={{ background: "#C93245", color: "#FFFFFF" }}
        >
          {/* #C93245 — Design.md §15 --color-danger(라이트). @theme 배선되면 var(--color-danger)로 바뀔 자리 */}
          ⏺ 통화 종료
        </button>
      </div>
    </main>
  );
}
