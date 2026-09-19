import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RoomService } from './rooms.service.js';
import { GuestTokenService } from './guest-token.service.js';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly rooms: RoomService,
    private readonly guestTokens: GuestTokenService,
  ) {}

  @Post()
  create() {
    const { roomId, code } = this.rooms.create();
    return { roomId, code };
  }

  @Get('by-code/:code')
  status(@Param('code') code: string) {
    return { status: this.rooms.status(code) };
  }

  @Post('by-code/:code/guest-token')
  issueGuestToken(@Param('code') code: string) {
    const record = this.rooms.consume(code);
    if (!record)
      throw new NotFoundException({ status: this.rooms.status(code) });
    const token = this.guestTokens.sign(record.roomId);
    return { token, roomId: record.roomId };
  }
}
