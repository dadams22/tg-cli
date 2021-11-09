import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export class ResultMessage implements TgWebsocketMessage {
  event = "Result";
  ts = new Date();

  constructor(readonly result: 'Pass' | 'Fail' | 'Interrupted') {
  }
}
