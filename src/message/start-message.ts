import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export class StartMessage implements TgWebsocketMessage {
  event = "Start";
  ts = new Date();

  constructor(readonly path: string, readonly replayUrl?: string) {
  }
}
