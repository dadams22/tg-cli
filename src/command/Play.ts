import { Command, InvalidArgumentError, Option } from 'commander';
import { BaseCommand } from './BaseCommand.js';
//@ts-ignore: no types provided for the registry
import { BaseConfig } from '../config/base-config';
import { isUrl } from '../util/validate';
import { Init } from './Init';
import { PlayerInfo } from '../lib/player-info';
import { SshTunnel } from '../util/ssh-tunnel';
import { TgWebsocket } from '../lib/tg-websocket';
import { SecureBrowserRequest } from '../message/secure-browser-request';
import { BrowserServer } from 'playwright-core';
import { promptUrl } from '../util/prompts';

export class Play extends BaseCommand {

  private ws: TgWebsocket;
  private tunnel: SshTunnel;
  private campaign?: SecureBrowserRequest;
  private player: PlayerInfo;

  private browser: BrowserServer;

  public static command = (config: BaseConfig) => new Command("play")
    .description("interactive single player mode")
    .argument("<player>", "@player alias to play", (a) => {
      if (!a.startsWith("@")) throw new InvalidArgumentError("player alias must start with @");
      return a;
    })
    .option("-u, --url [url]", "the url you want to run the player on", (a) => {
      if (!isUrl(a)) throw new InvalidArgumentError("Not a valid URL");
      return a;
    })
    .addOption(new Option("-v, --viewport [viewport]").choices(["LG"]).default("LG", "1920x1080"))  // TODO: add the other options
    .action(async (playerAlias, program) => {
      await new Play(config, playerAlias, program.url).start()
    })

  constructor(
    config: BaseConfig,
    private playerAlias: string,
    private url: string | null
  ) {
    super(config);
  }

  async init() {
    await Init.hydrateConfig(this.config);

    // Set the current player
    const matchedPlayers = this.config.players.filter(it => `@${it.alias}` === this.playerAlias);
    if (matchedPlayers.length === 0) {
      console.error("Invalid Player", `${this.playerAlias} is not a real player! ...yet`)
      this.error("Invalid Player")
      return;
    }
    this.player = matchedPlayers[0];

    if (!this.url) {
      this.url = await promptUrl(
        "Pick an environment to simulate on...",
        this.config.defaultSimulationUrl,
        this.config
      );
    }
    this.config.defaultSimulationUrl = this.url;
    this.config.save();


  }

  cleanup() {
  }
}

interface PlayArgs {
  url?: string;
  viewport: string;

}