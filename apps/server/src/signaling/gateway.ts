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

const MAX_PEERS_PER_ROOM = 2;

@WebSocketGateway({ path: '/ws' })
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly rooms = new Map<RoomId, Set<PeerId>>();
  private readonly sockets = new Map<PeerId, WebSocket>();
  private readonly peerIds = new WeakMap<WebSocket, PeerId>();

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
  }

  private relayToOthers(
    from: PeerId,
    msg: Extract<ClientToServer, { type: 'offer' | 'answer' | 'ice' }>,
  ) {
    const peers = this.rooms.get(msg.roomId);
    if (!peers?.has(from)) return;

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
    type === 'offer' ||
    type === 'answer' ||
    type === 'ice'
  );
}
