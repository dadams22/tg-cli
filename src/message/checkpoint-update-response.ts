import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export interface CheckpointUpdateResponse extends TgWebsocketMessage {
  playerId: string;
  checkpointIdx: number;
  success: boolean;
}
