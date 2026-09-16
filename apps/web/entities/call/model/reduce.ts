import { CallEvent, CallState } from "./types";

export const IDLE: CallState = { status: "idle" };

export function reduce(
  state: CallState,
  event: CallEvent,
  now: number = Date.now(),
): CallState {
  switch (state.status) {
    case "idle":
      return event.type === "JOIN"
        ? { status: "connecting", roomId: event.roomId, startedAt: now }
        : state;
    case "connecting":
      if (event.type === "PEER_CONNECTED") {
        return {
          status: "connected",
          roomId: state.roomId,
          peerId: event.peerId,
          connectedAt: now,
        };
      }

      if (event.type === "DISCONNECTED") {
        return {
          status: "reconnecting",
          roomId: state.roomId,
          attempt: 1,
          peerId: null,
          connectedAt: null,
        };
      }

      if (event.type === "RETRY_FAILED") {
        return { status: "failed", reason: event.reason };
      }

      if (event.type === "PEER_LEFT" || event.type === "LEAVE") {
        return IDLE;
      }

      if (event.type === "JOIN") {
        return state;
      }

      return assertNever(event);
    case "connected":
      if (event.type === "DISCONNECTED") {
        return {
          status: "reconnecting",
          roomId: state.roomId,
          attempt: 1,
          peerId: state.peerId,
          connectedAt: state.connectedAt,
        };
      }

      if (event.type === "PEER_LEFT" || event.type === "LEAVE") {
        return {
          status: "ended",
          roomId: state.roomId,
          durationMs: Math.max(0, now - state.connectedAt),
        };
      }

      if (event.type === "RETRY_FAILED") {
        return { status: "failed", reason: event.reason };
      }

      if (event.type === "JOIN" || event.type === "PEER_CONNECTED") {
        return state;
      }

      return assertNever(event);

    case "reconnecting":
      if (event.type === "PEER_CONNECTED") {
        return {
          status: "connected",
          peerId: event.peerId,
          roomId: state.roomId,
          connectedAt: state.connectedAt ?? now,
        };
      }

      if (event.type === "DISCONNECTED") {
        return { ...state, attempt: state.attempt + 1 };
      }

      if (event.type === "RETRY_FAILED") {
        return { status: "failed", reason: event.reason };
      }

      if (event.type === "PEER_LEFT" || event.type === "LEAVE") {
        return state.connectedAt === null
          ? IDLE
          : {
              status: "ended",
              roomId: state.roomId,
              durationMs: Math.max(0, now - state.connectedAt),
            };
      }

      if (event.type === "JOIN") {
        return state;
      }
      return assertNever(event);
    case "failed":
    case "ended":
      if (event.type === "JOIN") {
        return { status: "connecting", roomId: event.roomId, startedAt: now };
      }

      if (event.type === "LEAVE") {
        return IDLE;
      }
      return state;
    default:
      return assertNever(state);
  }
}

function assertNever(x: never): never {
  throw new Error(`처리하지 않은 값: ${JSON.stringify(x)}`);
}
