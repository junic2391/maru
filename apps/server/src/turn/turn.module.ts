import { Module } from '@nestjs/common';
import { TurnCredentialsController } from './turn-credentials.controller.js';
import { TurnCredentialsService } from './turn-credentials.service.js';

@Module({
  controllers: [TurnCredentialsController],
  providers: [TurnCredentialsService],
})
export class TurnModule {}
