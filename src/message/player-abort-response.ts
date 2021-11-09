import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export interface PlayerAbortResponse extends TgWebsocketMessage {
  playerId: string,
  reason: string;
}
