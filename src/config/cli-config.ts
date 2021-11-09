import { BaseConfig, WorldUserStore } from './base-config';
import * as path from 'path';
import * as fs from 'fs';

export class CliConfig extends BaseConfig {

  constructor(
    cwd: string
  ) {
    super(cwd);
    this.reload();
  }

  reload() {
    const confFile = path.resolve(this.worldDir, 'tgconfig.json');
    if (fs.existsSync(confFile)) {
      const raw = fs.readFileSync(confFile);
      this.world = JSON.parse(raw.toString());
    } else {
      return;
    }

    const config = CliConfig.STORE.get(this.world?.id, null) as WorldUserStore
    if (config) {
      this.token = config.token;
      this.variables = config.variables;
      this.players = config.players;
      this.domains = new Set<string>(config.domains as unknown as string[] ?? []);
      this.defaultMappingUrl = config.defaultMappingUrl;
      this.defaultSimulationUrl = config.defaultSimulationUrl;
    }

    if (!this.players) this.players = [];
  }

  save() {
    if (!this.configured) {
      console.error('Unable to fully configure Testgram correctly', this);
      process.exit(1);
    }

    const confFile = path.resolve(this.worldDir, 'tgconfig.json');
    fs.writeFileSync(confFile, JSON.stringify({ ...this.world }, null, 2));

    CliConfig.STORE.set(this.world.id, {
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