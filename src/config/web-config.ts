import { BaseConfig, WorldUserStore } from './base-config';

export class WebProtocolConfig extends BaseConfig {

  command: string;

  constructor(
    private url: string
  ) {
    super(".");

    const parsed = new URL(this.url);
    this.command = parsed.hostname;
    this.token = parsed.pathname.substring(1); // remove the leading /
  }

  get argv(): string[] {
    const args = [
      "tg",         // a base command to help the parser along
      this.command  // the subcommand we want to run
    ];

    // everything else is an argument
    const parsed = new URL(this.url);
    parsed.searchParams.forEach((value, key) => {
      if (key && !value) args.push(key)
    })

    parsed.searchParams.forEach((value, key) => {
      if (key && value) {
        args.push(`--${key}`)
        args.push(value)
      }
    })
    return args
  }

  save() {
    if (!this.configured) {
      console.error('Unable to fully configure Testgram correctly', this);
      process.exit(1);
    }

    BaseConfig.STORE.set(this.world.id, {
      worldId: this.world.id,
      token: this.token,
      domains: Array.from(this.domains) ?? [],
      defaultMappingUrl: this.defaultMappingUrl,
      defaultSimulationUrl: this.defaultSimulationUrl,
      variables: this.variables,
      players: this.players,
    } as WorldUserStore)
  }
}