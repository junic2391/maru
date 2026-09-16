import { PeerId, RoomId } from "@maru/shared-types";

export type CallState =
  | { status: "idle" }
  | { status: "connecting"; roomId: RoomId; startedAt: number }
  | { status: "connected"; roomId: RoomId; peerId: PeerId; connectedAt: number }
  | {
      status: "reconnecting";
      roomId: RoomId;
      attempt: number;
      peerId: PeerId | null;
      connectedAt: number | null;
    }
  | { status: "failed"; reason: string }
  | { status: "ended"; roomId: RoomId; durationMs: number };

export type CallEvent =
  | { type: "JOIN"; roomId: RoomId }
  | { type: "PEER_CONNECTED"; peerId: PeerId }
  | { type: "DISCONNECTED" }
  | { type: "RETRY_FAILED"; reason: string }
  | { type: "PEER_LEFT" }
  | { type: "LEAVE" };
