import WebSocket from 'ws';
import { HeartbeatMessage } from '../message/heartbeat-message.js';
import { StartMessage } from '../message/start-message.js';
import { OpenTunnelResponse } from '../message/open-tunnel-response.js';
import { FinishedResponse } from '../message/finished-response.js';
import { UpgradeRequest } from '../message/upgrade-request';
import { TgWebsocket, TgWebsocketMessage } from '../lib/tg-websocket';
import { BaseConfig } from '../config/base-config';
import { SshTunnel } from '../util/ssh-tunnel';
import { BrowserServer, chromium } from 'playwright-core';

export class AgentClient {
  private readonly url: string;
  private mediatorWs: TgWebsocket;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    private readonly agentToken: string,
    private readonly config: BaseConfig
  ) {
    this.url = `${config.mediatorUrl}/agent/${this.agentToken}?version=${config.version}`;
    console.log('TODO: Terminate on older version');

    this.mediatorWs = new TgWebsocket(this.url, {
      onopen: () => {
        console.log('Connection opened to mediator', this.url);
        if (this.heartbeatInterval !== undefined) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = undefined;
        }
        this.heartbeatInterval = setInterval(this.heartbeat.bind(this), 60000);
      },
      // onerror: (e: WebSocket.ErrorEvent) => console.error('[onerror] Something broke badly', e),
      onclose: (e: WebSocket.CloseEvent) => {
        if (this.heartbeatInterval !== undefined) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
      },
      onConnectToSimulator: (e: ConnectToSimulator) => new AgentSimulator(e),
      onUpgrade: (msg: UpgradeRequest) => {
        console.error(msg.instructions);
        process.exit(100);
      }
    });
  }

  private heartbeat() {
    if (this.mediatorWs.isOpen) this.mediatorWs.send(new HeartbeatMessage());
  }

  close() {
    this.mediatorWs.close()
  }
}

class AgentSimulator {
  private simulatorWs: TgWebsocket;
  private tunnel?: SshTunnel;

  constructor(readonly simInfo: ConnectToSimulator) {
    console.log('Requested to process simulation', simInfo);
    this.init();
  }

  private init() {
    this.simulatorWs = new TgWebsocket(this.simInfo.simulatorUrl, {
      // onclose: async (e: WebSocket.CloseEvent) => {
      //   await this.onFinished({} as FinishedResponse)
      // if (e.code === 1011 && e.reason.startsWith('Unable to connect to remote browser')) {
      //   this.init();
      // }
      // },
      onFinished: this.onFinished.bind(this),
      onOpenTunnel: this.onOpenTunnel.bind(this)
    });
  }

  async onFinished(msg: FinishedResponse): Promise<void> {
    console.log("Finished adventure", this.simInfo.simId);
    this.tunnel?.close();
    this.simulatorWs.close();
  }

  async onOpenTunnel(msg: OpenTunnelResponse): Promise<void> {
    console.log('Received request to open tunnel', msg);
    let browser: BrowserServer = await chromium.launchServer({
      devtools: false,
      headless: true,
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
    });
    console.log('Browser Server started as', browser.wsEndpoint(), browser.process().pid);
    // TgConfig.exitListeners.add(() => {
    //   this.simulatorWs.send(new ResultMessage('Interrupted'));
    //   browser.close()
    // })
    const wsUrl = new URL(browser.wsEndpoint());
    const sshUrl = new URL(this.simInfo.sshUrl);
    this.tunnel = new SshTunnel(+wsUrl.port, msg.port);
    let sshConfig = {
      host: sshUrl.hostname,
      port: +sshUrl.port,
      username: sshUrl.username,
      password: sshUrl.password,
    };
    // TODO: If tunnel doesn't open request a new simulator
    // TODO: This could happen because for example the simulator is restarted in the middle of doing work
    console.log('Spinning up ssh tunnel', sshUrl.host);
    await this.tunnel.open(sshConfig);

    console.log('Start', wsUrl.pathname);
    this.simulatorWs.send(new StartMessage(wsUrl.pathname));
  }
}

interface ConnectToSimulator extends TgWebsocketMessage {
  simId: string;
  simulatorUrl: string;
  sshUrl: string;
}
