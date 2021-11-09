import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export class HeartbeatMessage implements TgWebsocketMessage {
  event = 'Heartbeat';
  ts = new Date();
}
