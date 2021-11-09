import { BrowserType, ViewportType } from '../lib/type-alias.js';
import { TgWebsocketMessage } from '../lib/tg-websocket.js';

export class CreateCampaignMessage implements TgWebsocketMessage {
  event = 'CreateCampaign';
  ts = new Date();

  constructor(readonly id: string | undefined,
              readonly url: string,
              readonly players: string[] = [],
              readonly modules: { [key: string]: { [key: string]: any } },
              readonly variables: { [key: string]: any /* PlayerAction */ },
              readonly viewports: Array<ViewportType>,
              readonly browsers: Array<BrowserType>) {
  }
}

