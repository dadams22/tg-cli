import { SecureBrowserRequest } from '../message/secure-browser-request.js';
import { BaseConfig } from '../config/base-config';
import { RestClientService } from './rest-client.service';

class DoctorServiceImpl {
  public version(config: BaseConfig): Promise<SecureBrowserRequest> {
    return new RestClientService(config).$get('/version/check');
  }

  public examine(config: BaseConfig): Promise<SecureBrowserRequest> {
    return new RestClientService(config).$get('/doctor');
  }
}

export const DoctorService = new DoctorServiceImpl();
