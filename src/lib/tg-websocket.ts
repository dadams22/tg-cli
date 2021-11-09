import * as WebSocket from 'ws';
// import WebSocketClient, { ICloseEvent, IMessageEvent, W3CWebSocket } from 'websocket';

// const W3CWebSocket = WebSocketClient.w3cwebsocket;
const df = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})(.\d{3})?(Z|\+00:00)?$/;

function dateReviver(key: any, value: any): any {
  if (typeof value === 'string' && df.test(value)) return new Date(value);
  return value;
}

interface TgWebsocketHandlers {
  onopen?: () => void,
  onerror?: (error: WebSocket.ErrorEvent) => void,
  onclose?: (event: WebSocket.CloseEvent) => void,
  onmessage?: (message: TgWebsocketMessage) => void,

  [key: string]: ((msg: any) => void) | undefined
}

export class TgWebsocket {
  private ws: WebSocket;
  private retryInterval: number = 0;
  private retryDelay: number = 0;

  constructor(url: string, options: TgWebsocketHandlers = {}) {
    this.connect(url, options);
  }

  get isOpen(): boolean {
    return this.ws.readyState === this.ws.OPEN;
  }

  close(): void {
    this.ws.close(1000);
  }

  send(msg: TgWebsocketMessage) {
    let state = 'Unknown';
    switch (this.ws.readyState) {
      case this.ws.OPEN:
        state = 'Open';
        break;
      case this.ws.CONNECTING:
        state = 'Connecting';
        break;
      case this.ws.CLOSING:
        state = 'Closing';
        break;
      case this.ws.CLOSED:
        state = 'Closed';
        break;
    }
    if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private connect(url: string, options: TgWebsocketHandlers) {
    let wsUrl = url;
    if (wsUrl.startsWith("http")) wsUrl = wsUrl.replace(/^http/, 'ws');
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      options.onopen?.();
      this.retryInterval = 0;
    }
    this.ws.onerror = (error: WebSocket.ErrorEvent) => options.onerror?.(error);
    this.ws.onmessage = (message: WebSocket.MessageEvent) => {
      if (typeof message.data === "string") {
        const msg = JSON.parse(message.data, dateReviver);
        this.retryInterval = 0;
        const callback = options[`on${msg.event}`];
        if (callback) {
          callback(msg);
        } else {
          console.warn(`Missing event handler for ${msg.event}`, msg);
        }
      }
    };

    this.ws.onclose = (event: WebSocket.CloseEvent) => {
      if (event.code >= 1005) {
        if (this.retryInterval === 0) this.retryDelay = 0;
        if (this.retryInterval++ > 30) throw `Unable to establish connection to ${url}`;
        this.retryDelay += Math.random() * 4000 + 1000; // between 1 and 5 seconds delay
        const interval = Math.ceil(this.retryDelay / 1000);
        console.warn(`Connection lost (${url}), retrying in about ${interval} second(s)`, event.code, event.reason);
        console.warn(event.reason);
        setTimeout(() => this.connect(url, options), this.retryDelay);
      } else {
        console.info(`Connection closed`, event.code, `(${url})`, event.reason);
        if (options.onclose) options.onclose(event);
      }
    };
  }
}

export interface TgWebsocketMessage {
  event: string;
  ts: Date;
}
