import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

const TTL_SECONDS = 10 * 60;
const SECRET = process.env.TURN_SECRET ?? 'dev-only-turn-secret';
const TURN_HOST = process.env.TURN_HOST ?? 'localhost';

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
}

@Injectable()
export class TurnCredentialsService {
  issue(): TurnCredentials {
    const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    const username = `${expiresAt}:maru`;
    const credential = createHmac('sha1', SECRET)
      .update(username)
      .digest('base64');

    return {
      urls: [`turn:${TURN_HOST}:3478`],
      username,
      credential,
    };
  }
}
