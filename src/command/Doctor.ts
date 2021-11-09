import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import { SshTunnel } from '../util/ssh-tunnel.js';
import { colors } from '../util/colors.js';
import { BrowserServer, chromium } from 'playwright-core';
import { DoctorService } from '../service/doctor.service.js';
import { TgWebsocket } from '../lib/tg-websocket.js';
import { SecureBrowserRequest } from '../message/secure-browser-request.js';
import { BaseConfig } from '../config/base-config';
import { StartMessage } from '../message/start-message';
import { Listr } from 'listr2';

export class Doctor extends BaseCommand {
  public static command = (config: BaseConfig) => new Command("doctor")
    .description("make sure the whole system works end to end")
    .action(async () => {
      await new Doctor(config).start()
    })


  constructor(config: BaseConfig) {
    super(config);
  }


  private tunnel: SshTunnel;

  async init() {
    console.log(colors.accent.bold('👩‍⚕️ Diagnosing Installation...'))
    console.log(colors.dim(`Communicating with ${this.config.mediatorUrl}\n`))

    let tasks = new Listr<Ctx>([
      {
        title: "Version Compatibility",
        task: (ctx, task) => DoctorService.version(
          this.config
        ).catch((e) => {
          throw Error(e.message ?? JSON.stringify(e))
        }),
        options: { persistentOutput: true }
      },
      {
        title: "Acquire Simulator",
        task: (ctx, task) => DoctorService.examine(
          this.config
        ).then((browserInfo) => {
          ctx.browserInfo = browserInfo;
        }).catch((e) => {
          task.output = e.message ?? JSON.stringify(e)
          throw Error("Acquire Simulator")
        }),
        options: { persistentOutput: true }
      },
      {
        title: "Open Chromium Browser",
        task: (ctx, task) => chromium.launchServer({ headless: false }).then((server) => {
          ctx.browser = server;
        }).catch((e) => {
          task.output = e.message ?? JSON.stringify(e);
          throw Error("Open Chromium Browser")
        }),
        options: { persistentOutput: true }
      },
      {
        title: "Open Secure Tunnel",
        options: { persistentOutput: true },
        task: (ctx, task) => new Promise<void>((resolve, reject) => {
          ctx.ws = new TgWebsocket(ctx.browserInfo.simulatorUrl, {
            onFinished: async msg => {
              await ctx.browser.close();
              this.tunnel.close();
              ctx.onClose?.()
            },
            onOpenTunnel: async (msg: OpenTunnel) => {
              const wsUrl = new URL(ctx.browser.wsEndpoint());
              const sshUrl = new URL(ctx.browserInfo.sshUrl);
              this.tunnel = new SshTunnel(+wsUrl.port, msg.port);
              let sshConfig = {
                host: sshUrl.hostname,
                port: +sshUrl.port,
                username: sshUrl.username,
                password: sshUrl.password,
                quiet: true,
              };
              this.tunnel.open(sshConfig)
                .then(resolve)
                .catch(e => {
                  task.output = e.message ?? JSON.stringify(e)
                  reject("Open Secure Tunnel")
                });
            },
          });
        })
      },
      {
        title: "Talk to Simulator",
        task: (ctx, task) => new Promise<void>((resolve, reject) => {
          try {
            const endpoint = ctx.browser?.wsEndpoint();
            if (endpoint === undefined) reject("Simulator talk to browser");
            else {
              ctx.ws?.send(new StartMessage(new URL(endpoint).pathname));
              ctx.onClose = () => resolve();
            }
          } catch (e) {
            reject("Talk to Simulator")
          }
        }),
        options: { persistentOutput: true }
      },
    ], { concurrent: false });

    await tasks.run({} as Ctx)
      .then(() => console.log(colors.success.bold(`\nYou're good to go! 👍`)))
      .catch(() => console.log(colors.error.bold(`\nSomething went wrong 👎\nCheck out https://docs.testgram.ai to triage this issue`)))
      .finally(() => this.done());
  }

  cleanup() {
    // nothing to cleanup here!
  }

}

interface Ctx {
  browser: BrowserServer
  browserInfo: SecureBrowserRequest
  ws: TgWebsocket
  onClose: () => void
}

interface OpenTunnel {
  port: number;
}