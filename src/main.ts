import { app } from "electron";
import { Command } from 'commander';
import isDev from "electron-is-dev";
import { configureAutoUpdate } from "./exec/update";
import { Install } from './command/Install.js';
import { colors, logger } from './util/colors.js';
import { BaseConfig } from './config/base-config';
import { CliConfig } from './config/cli-config';
import { WebProtocolConfig } from './config/web-config';
import { Doctor } from './command/Doctor';
import { Init } from './command/Init';
import { BaseCommand } from './command/BaseCommand';
import { Agent } from './command/Agent';
import { DataMap } from './command/Map';
import { Play } from './command/Play';

app.requestSingleInstanceLock(); // notify other instance of our existence

let currentJob: ReturnType<typeof start> = null;

// by default CLI will have > 1 args (entry point, cli command) and accessible cwd
const isCli = (args: string[]) => args.length > 1 && process.cwd();

if (!app.isDefaultProtocolClient('myapp')) {
  // Define custom protocol handler. Deep linking works on packaged versions of the application!
  app.setAsDefaultProtocolClient('myapp')
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection ', `${promise} ${reason}`)
  app.quit()
})

app.on('will-finish-launching', function () {
  app.on('open-url', function (event, url) {
    event.preventDefault()
    handleNewInstance([url])
  })
})

app.on("second-instance", (event, secondArgs) => {
  handleNewInstance(secondArgs)
})

if (!isDev) {
  configureAutoUpdate();
}

function handleNewInstance(args: string[]) {
  if (isCli(args)) {
    // the new CLI process should get the priority
    logger.error("Interrupted", "closing the electron process")
    app.quit();
  } else {
    // this is a web request
    // TODO: close the current process
    logger.error("Interrupted", "closing the running process")
    if (BaseCommand.currentProcess) {
      BaseCommand.currentProcess.interrupt();
      currentJob = null;
    }
    currentJob = start(args);
  }
}

function start(args: string[]): Promise<void> {
  let config: BaseConfig
  if (isCli(args)) {
    const cwd = process.cwd();
    args = process.argv;
    console.log('Executing CLI with args', args);
    config = new CliConfig(cwd);
  } else {
    // a web style config
    const url = args[0]; // TODO: verify the url is actually the first param
    config = new WebProtocolConfig(url);
    args = (config as WebProtocolConfig).argv
  }

  // console.debug(args);
  // console.debug(config) // TODO: remove this

  const program = new Command()
    .description(`${colors.accent("Testgram Runner")}\n${colors.dim("https://docs.testgram.ai")}`)

  program.addCommand(Play.command(config))
  program.addCommand(DataMap.command(config))
  program.addCommand(Install.command(config))
  program.addCommand(Doctor.command(config))
  program.addCommand(Init.command(config))
  program.addCommand(Agent.command(config))
  program.showSuggestionAfterError();

  // by default when the thing closes quit the process
  return program.parseAsync(args, {
    from: "electron"
  }).then(() => {
    app.quit()
  }).catch((e) => {
    if (e !== "Interrupted") {
      app.quit()
    }
  })
}

// when booting from a url, argv would be empty
if (isCli(process.argv)) {
  currentJob = start(process.argv)
}




