import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import { colors } from '../util/colors.js';
//@ts-ignore: no types provided for the registry
import { Executable, registry } from 'playwright-core/lib/utils/registry';
import { BaseConfig } from '../config/base-config';

export class Install extends BaseCommand {

  public static command = (config: BaseConfig) => new Command("install")
    .description("install / upgrade the browser dependencies to run simulations")
    .action(async () => {
      await new Install(config).start()
    })

  constructor(
    config: BaseConfig
  ) {
    super(config);
  }

  async init() {
    console.log(colors.accent.bold("Installing Browsers & Dependencies"))

    // let progressBar = new ProgressBar({
    //   text: 'Downloading browsers & Testgram dependencies ...',
    //   detail: 'This usually takes just a minute the first time!'
    // });

    return Install.downloadBrowsersAndDeps().then(() => {
      this.done()
    }).catch((e) => {
      this.error(e)
    })
  }

  cleanup() {
  }

  static async downloadBrowsersAndDeps() {
    const executables: Executable[] = registry.defaultExecutables();
    await registry.installDeps(executables);
    await registry.install(executables);
  }

}