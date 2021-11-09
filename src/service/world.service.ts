import { WorldInit } from '../lib/world-init';
import { ViewportType } from '../lib/type-alias';
import { SecureBrowserRequest } from '../message/secure-browser-request';
import { BaseConfig } from '../config/base-config';
import { RestClientService } from './rest-client.service';


export class WorldServiceImpl {

  private RestClient: RestClientService

  constructor(
    private config: BaseConfig
  ) {
    this.RestClient = new RestClientService(this.config)
  }


  public initWorld(): Promise<WorldInit> {
    return new RestClientService(this.config).$post('/world/init', {});
  }

  public createCampaign(
    playerIds: string[],
    url: string,
    demo: boolean = false,
    browsers: ['Chromium' /* | 'Chrome' */],
    viewports: Array<ViewportType>
  ): Promise<SecureBrowserRequest> {
    const modules = {};
    return this.RestClient.$put(`/world/${this.config.world.id}/campaign`, {
      url, players: playerIds, modules, demo, browsers, viewports
    });
  }

  public addWorldUrl(url: string): Promise<SecureBrowserRequest> {
    return this.RestClient.$post(`/world/${this.config.world.id}/domain`, url);
  }

  public replayDebug(debugId: string): Promise<SecureBrowserRequest> {
    return this.RestClient.$post(`/debug/${debugId}/replay`, null);
  }

  public getDebugInfo(debugId: string): Promise<Object> {
    return this.RestClient.$get(`/debug/${debugId}`);
  }
}