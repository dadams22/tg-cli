import { Command, InvalidArgumentError } from 'commander';
import { BaseCommand } from './BaseCommand.js';
//@ts-ignore: no types provided for the registry
import { BaseConfig } from '../config/base-config';
import { AgentClient } from '../agent/agent-client';
import { Init } from './Init';
import * as chalk from 'chalk';
import { isUrl } from '../util/validate';
import { startDataSession } from '../util/data-browser';

export class DataMap extends BaseCommand {

  public static command = (config: BaseConfig) => new Command("map")
    .description("manually add data into your Testgram dataset")
    .argument("[url]", "the url to teach Testgram on", (a) => {
      if (!isUrl(a)) throw new InvalidArgumentError("Not a valid URL");
      return a;
    }, null)
    .action(async (url) => {
      await new DataMap(config, url).start()
    })

  private client: AgentClient

  constructor(
    config: BaseConfig,
    private url: string,
  ) {
    super(config);
  }

  async init() {
    await Init.hydrateConfig(this.config);
    this.config.save();

    console.log(chalk.bold(`\`tg map\` is a way to ${chalk.underline("manually")} teach Testgram how ${chalk.italic("you think")} a user would use your application.`));

    const trainer = `${this.config.mediatorUrl}/js/world/${this.config.world.id}`;
    console.log(chalk.gray(`\nTestgram can ${chalk.blueBright.underline.bold("automatically")} learn from actual usage data, so you don't have to guess.`))
    console.log(chalk.gray(`Set this up by inserting this script in the <head> tag of your index.html:`))
    console.log(chalk.bold.italic(`<script src="${trainer}" type="text/javascript" crossorigin async></script>\n`));
    console.log(chalk.gray("Learn more: "), chalk.underline("docs.testgram.ai/world/data\n"))

    await startDataSession(
      this.url,
      this.done.bind(this),
      null,
      this.config
    )
  }

  cleanup() {
    console.log("cleaning up")
    this.client.close()
  }

}