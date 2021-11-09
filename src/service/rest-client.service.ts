import fetch from "node-fetch-commonjs";
import { BaseConfig } from '../config/base-config';

export class RestClientService {

  constructor(
    private config: BaseConfig
  ) {
  }

  static readonly df = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})(.\d{3})?(Z|\+00:00)?$/;

  static dateReviver(key: any, value: any): any {
    if (typeof value === 'string' && RestClientService.df.test(value)) return new Date(value);
    return value;
  }

  $delete<T>(path: string, params?: { [key: string]: any }): Promise<T> {
    const request = this.createRequestInit('DELETE');
    return this.fetch(this.buildLink(path, params), request);
  }

  $get<T>(path: string, params?: { [key: string]: any }): Promise<T> {
    const request = this.createRequestInit('GET');
    return this.fetch(this.buildLink(path, params), request);
  }

  $patch<T>(path: string, data: any, params?: { [key: string]: any }): Promise<T> {
    const request = this.createRequestInit('PATCH', data);
    return this.fetch(this.buildLink(path, params), request);
  }

  $post<T>(path: string, data: any, params?: { [key: string]: any }): Promise<T> {
    const request = this.createRequestInit('POST', data);
    return this.fetch(this.buildLink(path, params), request);
  }

  $put<T>(path: string, data: any, params?: { [key: string]: any }): Promise<T> {
    const request: RequestInit = this.createRequestInit('PUT', data);
    return this.fetch(this.buildLink(path, params), request);
  }

  protected fetch<T>(url: string, request: RequestInit): Promise<T> {
    //@ts-ignore
    return fetch(url, request)
      .catch(_ => ({ status: -1 } as Response))
      //@ts-ignore
      .then<T>(response => this.convertResponse(response));
  }

  protected buildLink(path: string, args: { [key: string]: any } = {}): string {
    const usedArgs: string[] = [];
    let updatedLink = path.replace(/:(\w+)/g, (match, contents, offset, s) => {
      usedArgs.push(contents);
      return encodeURIComponent(args[contents]);
    });
    const params = Object.keys(args || {})
      .filter((key) => args[key] != null || key.startsWith('_'))
      .filter((key) => usedArgs.indexOf(key) === -1);
    if (params.length > 0) {
      updatedLink += `?${params.map((key) => `${key}=${args[key]}`).join('&')}`;
    }
    return `${this.config.mediatorUrl}${updatedLink}`;
  }

  protected createRequestInit(method: string, body?: any): RequestInit {
    const headers: { [key: string]: string | undefined } = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VERSION': this.config.version,
      'X-WORLD': this.config.world?.id
    };
    if (this.config.token) headers['Authorization'] = `World ${this.config.token}`;

    return {
      body: body ? JSON.stringify(body) : null,
      cache: 'no-cache',
      credentials: 'omit', // do not ever send cookies
      headers: JSON.parse(JSON.stringify(headers)), // parse/stringify hack is to eliminate undefined
      redirect: 'error', // default is follow (or manual prior to chrome 47)
      method,
      mode: 'cors',
    } as RequestInit;
  }

  private async convertResponse<T>(response: Response): Promise<T> {
    if (response.status === -1) {
      throw { status: -1, message: 'An issue has occurred communicating with the server.' };
    } else if (response.status >= 500) {
      const message = await response.text();
      throw { status: response.status, message, url: response.url };
    } else if (response.status >= 400) {
      const reasons: DeniedReason[] = await response.json() as Array<DeniedReason>;
      throw { status: response.status, message: reasons.map(it => it.message).join() };
    }

    if (response.status == 204) {
      // @ts-ignore
      return Promise.resolve(null);
    }

    return await response.text().then<T>(body => {
      if (body === undefined || body == null || body.length == 0) return null;
      return JSON.parse(body, RestClientService.dateReviver);
    });
  }
}

interface DeniedReason {
  code: string;
  field: string;
  message: string;
}