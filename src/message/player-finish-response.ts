import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export interface PlayerFinishResponse extends TgWebsocketMessage {
  playerId: string;
  success: boolean;
  debugId: string;
  confidence: number;
}
