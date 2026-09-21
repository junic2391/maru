import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller.js';
import { RoomService } from './rooms.service.js';
import { GuestTokenService } from './guest-token.service.js';

@Module({
  controllers: [RoomsController],
  providers: [RoomService, GuestTokenService],
  exports: [GuestTokenService],
})
export class RoomsModule {}
