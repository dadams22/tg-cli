import * as net from 'net';
import { Client } from 'ssh2';

export class SshTunnel {
  private client: Client;

  constructor(public localPort: number, public remotePort: number) {
    this.client = new Client();
  }

  open(config: SshTunnelConfig): Promise<void> {
    return new Promise<void>(resolve => this.client
      .on("ready", () => {
        this.client.forwardIn('localhost', this.remotePort, (error: Error, port: number) => {
          if (error) console.error("TODO: Handle error scenario", port, error.message, error);
          // if (!config.quiet) console.log(chalk.gray("Opening Encrypted Tunnel"))
          resolve();
        });
      })
      .on("tcp connection", (details, accept) => {
        const stream = accept();
        stream.pause();

        const socket = net.connect(this.localPort, details.destIP, () => {
          // if (!config.quiet) console.log(chalk.gray(`Encrypted Tunnel between localhost:${this.localPort} and ${config.host}:${this.remotePort}`));
          stream.pipe(socket);
          socket.pipe(stream);
          stream.resume();
        });
      })
      .on("close", () => this.client.end())
      .on('error', e => console.log('Unexpected error', e))
      // .on("end", () => console.log("SSH Tunnel has ended"))
      .connect(config)
    )
  }

  close() {
    this.client.unforwardIn('localhost', this.remotePort, () => {
      console.log('Removing ssh tunnel for port', this.remotePort);
      this.client.end();
    });
  }
}

export interface SshTunnelConfig {
  host?: string;
  port?: number;
  readyTimeout?: number;
  username?: string;
  password?: string;
  privateKey?: Buffer | string;
  quiet?: boolean;
}
