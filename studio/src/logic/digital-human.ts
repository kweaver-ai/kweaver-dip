import type { OpenClawAgentsAdapter } from "../adapters/openclaw-agents-adapter";
import type { DigitalHumanList } from "../ports/digital-human";
import type { OpenClawAgentsListResult } from "../ports/openclaw";

/**
 * Application logic used to fetch digital humans.
 */
export interface DigitalHumanLogic {
  /**
   * Fetches the public digital human list.
   *
   * @returns The normalized digital human list.
   */
  listDigitalHumans(): Promise<DigitalHumanList>;
}

/**
 * Logic implementation that derives digital humans from OpenClaw agents.
 */
export class DefaultDigitalHumanLogic implements DigitalHumanLogic {
  /**
   * Creates the digital human logic.
   *
   * @param openClawAgentsAdapter The adapter used to fetch OpenClaw agents.
   */
  public constructor(
    private readonly openClawAgentsAdapter: OpenClawAgentsAdapter
  ) {}

  /**
   * Fetches the digital human list.
   *
   * @returns The normalized digital human list.
   */
  public async listDigitalHumans(): Promise<DigitalHumanList> {
    const agents = await this.openClawAgentsAdapter.listAgents();

    return mapAgentsToDigitalHumans(agents);
  }
}

/**
 * Maps the OpenClaw agents payload to the public digital human schema.
 *
 * @param result The OpenClaw agents list result.
 * @returns The normalized digital human list.
 */
export function mapAgentsToDigitalHumans(
  result: OpenClawAgentsListResult
): DigitalHumanList {
  return result.agents.map((agent) => ({
    id: agent.id,
    name: agent.name ?? agent.identity?.name ?? agent.id,
    avatar: agent.identity?.avatarUrl ?? agent.identity?.avatar
  }));
}
