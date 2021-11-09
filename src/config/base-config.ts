import * as path from 'path';
import { app } from "electron";
import { findUpSync } from '../util/findup';
import { World } from '../lib/world';
import Store from 'electron-store';
import { PlayerInfo } from '../lib/player-info';

export abstract class BaseConfig {

  protected static STORE = new Store();

  readonly mediatorUrl = process.env['MEDIATOR_URL'] ?? 'https://sim.testgram.ai';
  readonly version: string;
  protected readonly worldDir: string;

  readonly debugMode: boolean = !!process.env['TG_DEBUG'];

  token: string;
  world: World;

  variables: Array<string>; // defined variables at the world level
  players: Array<PlayerInfo>;
  defaultMappingUrl: string;
  defaultTrainingUrl: string;
  defaultSimulationUrl: string;
  domains: Set<string>;

  protected constructor(
    public cwd: string = process.cwd()
  ) {
    const nodeModules = findUpSync('node_modules', { cwd: cwd, type: 'directory' });
    const gitFolder = findUpSync('.git', { cwd: cwd, type: 'directory' });
    const tgConfigFile = findUpSync('tgconfig.json', { cwd: cwd, type: 'file' });

    if (nodeModules) this.worldDir = path.dirname(nodeModules)
    else if (gitFolder) this.worldDir = path.dirname(gitFolder)
    else if (tgConfigFile) this.worldDir = path.dirname(tgConfigFile)
    else this.worldDir = path.resolve(cwd);

    this.version = app.getVersion();
  }

  get portalUrl(): string {
    if (this.mediatorUrl === 'http://localhost:17511') return 'http://localhost:20873';
    return this.mediatorUrl.replace(/\bsim\b/, "run");
  }

  get configured(): boolean {
    return this.token !== undefined && this.world !== undefined;
  }

  abstract save();
}

export interface WorldUserStore {
  worldId: string;
  token: string;
  domains: string[];
  defaultMappingUrl: string;
  defaultSimulationUrl: string;
  variables: string[];
  players: PlayerInfo[];
}