export type RoomId = string & { readonly __brand: "RoomId" };
export type PeerId = string & { readonly __brand: "PeerId" };

export type IceCandidateInit = {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
};

export type ClientToServer =
  | { type: "join-room"; roomId: RoomId }
  | { type: "join-as-guest"; token: string }
  | { type: "approve-guest"; roomId: RoomId; peerId: PeerId }
  | { type: "reject-guest"; roomId: RoomId; peerId: PeerId }
  | { type: "offer"; roomId: RoomId; sdp: string }
  | { type: "answer"; roomId: RoomId; sdp: string }
  | { type: "ice"; roomId: RoomId; candidate: IceCandidateInit };

export type ServerToClient =
  | { type: "room-joined"; roomId: RoomId; peers: PeerId[] }
  | { type: "guest-waiting"; peerId: PeerId }
  | { type: "peer-joined"; peerId: PeerId }
  | { type: "peer-left"; peerId: PeerId }
  | { type: "rejected" }
  | { type: "offer"; from: PeerId; sdp: string }
  | { type: "answer"; from: PeerId; sdp: string }
  | { type: "ice"; from: PeerId; candidate: IceCandidateInit }
  | { type: "error"; code: "ROOM_FULL" | "NOT_APPROVED" | "INVALID_TOKEN" };
