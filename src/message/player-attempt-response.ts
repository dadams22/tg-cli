import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export interface PlayerAttemptResponse extends TgWebsocketMessage {
  playerId: string
}
