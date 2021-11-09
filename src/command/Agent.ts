import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import { colors } from '../util/colors.js';
//@ts-ignore: no types provided for the registry
import { BaseConfig } from '../config/base-config';
import { AgentClient } from '../agent/agent-client';

export class Agent extends BaseCommand {

  public static command = (config: BaseConfig) => new Command("agent")
    .argument("[token]", "the agent token (generated at run.testgram.ai)")
    .description("start a worker agent")
    .action(async (token) => {
      await new Agent(config, token).start()
    })

  private client: AgentClient

  private isUserAgent: boolean;

  constructor(
    config: BaseConfig,
    private readonly agentToken: string
  ) {
    super(config);
    this.agentToken = this.agentToken ?? config.token;
    this.isUserAgent = this.agentToken === config.token;
  }

  async init() {
    console.log(colors.accent.bold("Starting Agent..."))
    this.client = new AgentClient(
      this.agentToken,
      this.config
    )
  }

  cleanup() {
    console.log("cleaning up")
    this.client.close()
  }

}