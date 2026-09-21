import { Controller, Get } from '@nestjs/common';
import { TurnCredentialsService } from './turn-credentials.service.js';

@Controller('turn-credentials')
export class TurnCredentialsController {
  constructor(private readonly turnCredentials: TurnCredentialsService) {}

  @Get()
  get() {
    return this.turnCredentials.issue();
  }
}
