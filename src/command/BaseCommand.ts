import { logger } from '../util/colors.js';
import { BaseConfig } from '../config/base-config';

export abstract class BaseCommand {

  public static currentProcess: BaseCommand = null;

  private readonly promise: Promise<void>;
  private resolve: (value: unknown) => void;
  private reject: (reason?: any) => void;

  protected constructor(
    protected config: BaseConfig
  ) {
    this.promise = new Promise(async (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    })

    BaseCommand.currentProcess = this;
  }

  start(): Promise<void> {
    this.init();
    return this.promise;
  }

  abstract cleanup();

  interrupt() {
    this.cleanup();
    this.reject("Interrupted")
  }

  abstract init(): void

  protected done(): void {
    this.resolve(undefined);
  }

  protected error(reason: any): void {
    logger.error("Failed", reason);
    this.reject(reason);
  }
}

