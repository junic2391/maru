export type RoomId = string & { readonly __brand: "RoomId" };
export type PeerId = string & { readonly __brand: "PeerId" };

export type ClientToServer =
  | { type: "join-room"; roomId: RoomId }
  | { type: "offer"; roomId: RoomId; sdp: string }
  | { type: "answer"; roomId: RoomId; sdp: string }
  | { type: "ice"; roomId: RoomId; candidate: RTCIceCandidateInit };
