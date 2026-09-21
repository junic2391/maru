import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  ClientToServer,
  PeerId,
  RoomId,
  ServerToClient,
} from '@maru/shared-types';
import { randomUUID } from 'node:crypto';
import WebSocket, { RawData } from 'ws';
import { GuestTokenService } from '../rooms/guest-token.service.js';

const MAX_PEERS_PER_ROOM = 2;

@WebSocketGateway({ path: '/ws' })
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly rooms = new Map<RoomId, Set<PeerId>>();
  // 승인 대기 중인 게스트
  private readonly pendingGuests = new Map<RoomId, PeerId>();
  // 1회용 표식(jti) — 같은 토큰으로 두 번 입장 시도하는 것을 막음
  private readonly usedJti = new Set<string>();
  private readonly sockets = new Map<PeerId, WebSocket>();
  private readonly peerIds = new WeakMap<WebSocket, PeerId>();

  constructor(private readonly guestTokens: GuestTokenService) {}

  handleConnection(client: WebSocket) {
    const peerId = randomUUID() as PeerId;
    this.peerIds.set(client, peerId);
    this.sockets.set(peerId, client);
    client.on('message', (raw: RawData) => this.onMessage(peerId, raw));
  }

  handleDisconnect(client: WebSocket) {
    const peerId = this.peerIds.get(client);
    if (!peerId) return;
    this.leaveAllRooms(peerId);
    this.sockets.delete(peerId);
  }

  private onMessage(peerId: PeerId, raw: RawData) {
    let msg: ClientToServer;

    try {
      const parsed: unknown = JSON.parse(raw.toString());
      if (!isClientToServer(parsed)) return;
      msg = parsed;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'join-room':
        return this.join(peerId, msg.roomId);
      case 'join-as-guest':        
        return this.joinAsGuest(peerId, msg.token);
      case 'approve-guest':
        return this.decideGuest(peerId, msg.roomId, msg.peerId, true);
      case 'reject-guest':
        return this.decideGuest(peerId, msg.roomId, msg.peerId, false);
      case 'offer':
      case 'answer':
      case 'ice':
        return this.relayToOthers(peerId, msg);      
      default:
        return assertNever(msg);
    }
  }

  private join(peerId: PeerId, roomId: RoomId) {
    const peers = this.rooms.get(roomId) ?? new Set<PeerId>();
    if (peers.size >= MAX_PEERS_PER_ROOM) {
      this.send(peerId, { type: 'error', code: 'ROOM_FULL' });
      return;
    }

    this.send(peerId, { type: 'room-joined', roomId, peers: [...peers] });

    for (const other of peers) {
      this.send(other, { type: 'peer-joined', peerId });
    }

    peers.add(peerId);
    this.rooms.set(roomId, peers);

    // 호스트보다 게스트가 먼저 들어와 대기 중이었을 수 있다 — 그 순서 차이를 여기서 처리
    const waitingGuest = this.pendingGuests.get(roomId);
    if (waitingGuest)
      this.send(peerId, { type: 'guest-waiting', peerId: waitingGuest });
  }

  private joinAsGuest(peerId: PeerId, token: string) {
    let payload: { roomId: RoomId; jti: string };
    try {
      payload = this.guestTokens.verify(token);
    } catch {
      this.send(peerId, { type: 'error', code: 'INVALID_TOKEN' });
      return;
    }

    if (this.usedJti.has(payload.jti)) {
      this.send(peerId, { type: 'error', code: 'INVALID_TOKEN' });
      return;
    }
    this.usedJti.add(payload.jti);

    const { roomId } = payload;
    const peers = this.rooms.get(roomId) ?? new Set<PeerId>();
    if (peers.size >= MAX_PEERS_PER_ROOM || this.pendingGuests.has(roomId)) {
      this.send(peerId, { type: 'error', code: 'ROOM_FULL' });
      return;
    }

    this.pendingGuests.set(roomId, peerId);
    for (const host of peers) {
      this.send(host, { type: 'guest-waiting', peerId });
    }
  }

  private decideGuest(
    from: PeerId,
    roomId: RoomId,
    guestId: PeerId,
    approve: boolean,
  ) {
    const peers = this.rooms.get(roomId);
    // 방에 이미 들어와 있는 호스트만 승인 또는 거절할 수 있음
    if (!peers?.has(from)) return;
    if (this.pendingGuests.get(roomId) !== guestId) return;

    this.pendingGuests.delete(roomId);

    if (!approve) {
      this.send(guestId, { type: 'rejected' });
      return;
    }

    this.send(guestId, { type: 'room-joined', roomId, peers: [...peers] });
    for (const host of peers) {
      this.send(host, { type: 'peer-joined', peerId: guestId });
    }

    peers.add(guestId);
  }

  private relayToOthers(
    from: PeerId,
    msg: Extract<ClientToServer, { type: 'offer' | 'answer' | 'ice' }>,
  ) {
    const peers = this.rooms.get(msg.roomId);
    if (!peers?.has(from)) {
      // 방에 들어와 있지 않다 - 승인 전 대기 중인 게스트가 여기 걸림
      this.send(from, { type: 'error', code: 'NOT_APPROVED' });
      return;
    }

    for (const other of peers) {
      if (other === from) continue;
      this.send(
        other,
        msg.type === 'ice'
          ? {
              type: 'ice',
              from,
              candidate: msg.candidate,
            }
          : { type: msg.type, from, sdp: msg.sdp },
      );
    }
  }

  private leaveAllRooms(peerId: PeerId) {
    for (const [roomId, peers] of this.rooms) {
      if (!peers.delete(peerId)) continue;

      for (const other of peers) {
        this.send(other, { type: 'peer-left', peerId });
      }

      if (peers.size === 0) this.rooms.delete(roomId);
    }

    for (const [roomId, guestId] of this.pendingGuests) {
      if (guestId === peerId) this.pendingGuests.delete(roomId);
    }
  }

  private send(peerId: PeerId, msg: ServerToClient) {
    this.sockets.get(peerId)?.send(JSON.stringify(msg));
  }
}

function assertNever(x: never): never {
  throw new Error(`처리하지 않은 이벤트: ${JSON.stringify(x)}`);
}

function isClientToServer(x: unknown): x is ClientToServer {
  if (typeof x !== 'object' || x === null || !('type' in x)) return false;
  const { type } = x as { type: unknown };
  return (
    type === 'join-room' ||
    type === 'join-as-guest' ||
    type === 'approve-guest' ||
    type === 'reject-guest' ||
    type === 'offer' ||
    type === 'answer' ||
    type === 'ice'
  );
}
