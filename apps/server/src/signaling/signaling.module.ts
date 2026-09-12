import { Module } from '@nestjs/common';
import { SignalingGateway } from './gateway.js';

@Module({ providers: [SignalingGateway] })
export class SignalingModule {}
