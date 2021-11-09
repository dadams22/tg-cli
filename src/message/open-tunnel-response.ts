import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export interface OpenTunnelResponse extends TgWebsocketMessage {
  port: number;
}
