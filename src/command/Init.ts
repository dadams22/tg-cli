import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import { colors, logger } from '../util/colors.js';
import { BaseConfig } from '../config/base-config';
import * as enquirer from 'enquirer';
import { WorldServiceImpl } from '../service/world.service';
import { WorldInit } from '../lib/world-init';
import * as chalk from 'chalk';

export class Init extends BaseCommand {

  public static command = (config: BaseConfig) => new Command("init")
    .argument("<token>", "your personal access <token> (found at run.testgram.ai)")
    .description("initialize Testgram for your project (run in your app directory)")
    .action(async (token) => {
      config.token = token;
      await new Init(config).start();
    })

  constructor(
    config: BaseConfig
  ) {
    super(config);
  }

  async init() {
    console.log(colors.accent.dim("Initializing..."))
    const successIcon = String.fromCodePoint(10003);
    const failIcon = "\u2716"
    while (!this.config.token.match(/[0-9a-f]{24}/)) {
      console.info(`${this.config.token.length === 0 ? "Missing" : "Invalid"} world token '${this.config.token}'`);
      const response = await enquirer.prompt({
        type: 'input',
        name: 'token',
        message: 'What is your world token? '
      });
      this.config.token = response['token'];
    }

    try {
      const worldInfo = await Init.hydrateConfig(this.config);
      this.config.save();

      if (worldInfo.userFirstName !== null) {
        console.log(`Hi ${colors.success.bold(worldInfo.userFirstName)} 👋`)
      }
      console.log(colors.success(`${successIcon} Successfully connected and initialized '${chalk.bold(this.config.world.name)}'`))
    } catch (e) {
      logger.error(`${failIcon} Unable to initialize world`, "Make sure your token is valid")
    } finally {
      this.done()
    }
  }

  cleanup() {
    // nothing to clean up here
  }

  public static hydrateConfig(config: BaseConfig): Promise<WorldInit> {
    return new WorldServiceImpl(config).initWorld().then((world) => {
      config.world = {
        id: world.id,
        name: world.name,
        description: world.description
      }
      config.players = world.players;
      config.domains = new Set(world.domains)
      return world;
    }).catch((e) => {
      logger.error("Invalid token", "Could not initialize your World")
      process.exit(1)
    })
  }
}

interface InitOptions {
  token: string
}