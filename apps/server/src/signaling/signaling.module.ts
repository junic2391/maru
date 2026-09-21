import { Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway.js';
import { RoomsModule } from '../rooms/rooms.module.js';

@Module({ imports: [RoomsModule], providers: [SignalingGateway] })
export class SignalingModule {}
