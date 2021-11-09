import { TgWebsocketMessage } from '../lib/tg-websocket.js';
import { PlayerCheckpoint } from '../lib/checkpoint.js';

export interface PlayerInitResponse extends TgWebsocketMessage {
  playerId: string,
  checkpoints: PlayerCheckpoint[],
  dataPoints: number
}
