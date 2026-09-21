import { RoomId } from '@maru/shared-types';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const LINK_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

export interface RoomRecord {
  roomId: RoomId;
  code: string;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
}

export type RoomCodeStatus = 'ok' | 'expired' | 'consumed' | 'not-found';

@Injectable()
export class RoomService {
  private readonly roomsByCode = new Map<string, RoomRecord>();

  create(): RoomRecord {
    const record: RoomRecord = {
      roomId: randomUUID() as RoomId,
      code: randomUUID().slice(0, 8),
      createdAt: Date.now(),
      expiresAt: Date.now() + LINK_TTL_MS,
      consumed: false,
    };

    this.roomsByCode.set(record.code, record);
    return record;
  }

  status(code: string): RoomCodeStatus {
    const record = this.roomsByCode.get(code);
    if (!record) return 'not-found';
    if (record.consumed) return 'consumed';
    if (Date.now() > record.expiresAt) return 'expired';
    return 'ok';
  }

  consume(code: string): RoomRecord | null {
    const record = this.roomsByCode.get(code);
    if (!record || record.consumed || Date.now() > record.expiresAt) {
      return null;
    }

    record.consumed = true;
    return record;
  }
}
