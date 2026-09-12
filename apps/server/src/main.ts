import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
