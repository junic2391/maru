import { RoomId } from '@maru/shared-types';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

export interface GuestTokenPayload {
  roomId: RoomId;
  jti: string;
}

const SECRET = process.env.GUEST_TOKEN_SECRET ?? 'dev-only-secret';

@Injectable()
export class GuestTokenService {
  sign(roomId: RoomId): string {
    const payload: GuestTokenPayload = { roomId, jti: randomUUID() };
    return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '10m' });
  }

  verify(token: string): GuestTokenPayload {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof (decoded as Record<string, unknown>).roomId !== 'string' ||
      typeof (decoded as Record<string, unknown>).jtl !== 'string'
    ) {
      throw new Error('게스트 토큰 페이로드 형식이 아닙니다.');
    }
    return decoded as GuestTokenPayload;
  }
}
