import type { OpenClawAgentsAdapter } from "../adapters/openclaw-agents-adapter";
import type { OpenClawAgentSkillsHttpClient } from "../infra/openclaw-agent-skills-http-client";
import type {
  DigitalHumanAgentSkillList,
  DigitalHumanSkillList
} from "../types/digital-human";
import type {
  AgentSkillsBinding,
  AgentSkillsCatalog,
  UpdateAgentSkillsResult
} from "../types/agent-skills";
import type { OpenClawSkillStatusEntry } from "../types/openclaw";

/**
 * Application logic used to query and update agent skill bindings.
 */
export interface AgentSkillsLogic {
  /**
   * Lists globally enabled skills exposed by OpenClaw.
   */
  listEnabledSkills(): Promise<DigitalHumanSkillList>;

  /**
   * Lists one agent's enabled skills after intersecting global availability
   * and the plugin's agent skill binding list.
   *
   * @param agentId Stable OpenClaw agent id.
   */
  listDigitalHumanSkills(agentId: string): Promise<DigitalHumanAgentSkillList>;

  /**
   * Lists globally available skill ids.
   */
  listAvailableSkills(): Promise<AgentSkillsCatalog>;

  /**
   * Reads one agent's current skill ids.
   *
   * @param agentId Stable OpenClaw agent id.
   */
  getAgentSkills(agentId: string): Promise<AgentSkillsBinding>;

  /**
   * Replaces one agent's current skill ids.
   *
   * @param agentId Stable OpenClaw agent id.
   * @param skills Replacement skill ids.
   */
  updateAgentSkills(
    agentId: string,
    skills: string[]
  ): Promise<UpdateAgentSkillsResult>;
}

/**
 * Logic implementation backed by the `dip` plugin skills HTTP API.
 */
export class DefaultAgentSkillsLogic implements AgentSkillsLogic {
  /**
   * Creates the logic implementation.
   *
   * @param client Plugin HTTP client.
   * @param openClawAgentsAdapter Adapter used to query OpenClaw skill status.
   */
  public constructor(
    private readonly client: OpenClawAgentSkillsHttpClient,
    private readonly openClawAgentsAdapter?: OpenClawAgentsAdapter
  ) {}

  /**
   * Lists globally enabled skills returned by OpenClaw.
   *
   * @returns The global enabled skill list.
   */
  public async listEnabledSkills(): Promise<DigitalHumanSkillList> {
    const globalEntries = await this.getAvailableSkillEntries();

    return globalEntries.map((entry) => ({
      name: getSkillEntryName(entry) ?? entry.skillKey,
      description: getSkillEntryDescription(entry)
    }));
  }

  /**
   * Lists skills for one digital human by merging global enabled skills and
   * the agent-specific enabled skill set.
   *
   * @param agentId The digital human identifier.
   * @returns The merged skill list.
   */
  public async listDigitalHumanSkills(
    agentId: string
  ): Promise<DigitalHumanAgentSkillList> {
    const availableEntries = await this.getAvailableSkillEntries();
    const agentBinding = await this.client.getAgentSkills(agentId);

    return filterAgentSkillEntries(availableEntries, agentBinding.skills);
  }

  /**
   * Lists globally available skill ids.
   *
   * @returns The plugin payload.
   */
  public async listAvailableSkills(): Promise<AgentSkillsCatalog> {
    return this.client.listAvailableSkills();
  }

  /**
   * Reads one agent's current skill ids.
   *
   * @param agentId Stable OpenClaw agent id.
   * @returns The plugin payload.
   */
  public async getAgentSkills(agentId: string): Promise<AgentSkillsBinding> {
    return this.client.getAgentSkills(agentId);
  }

  /**
   * Replaces one agent's current skill ids.
   *
   * @param agentId Stable OpenClaw agent id.
   * @param skills Replacement skill ids.
   * @returns The plugin payload.
   */
  public async updateAgentSkills(
    agentId: string,
    skills: string[]
  ): Promise<UpdateAgentSkillsResult> {
    return this.client.updateAgentSkills(agentId, skills);
  }

  /**
   * Reads and normalizes globally enabled OpenClaw skills.
   *
   * @returns The filtered OpenClaw skill entries.
   */
  private async getAvailableSkillEntries(): Promise<OpenClawSkillStatusEntry[]> {
    if (this.openClawAgentsAdapter === undefined) {
      throw new Error("OpenClaw agents adapter is required for skill status queries");
    }

    const globalEntries = await this.openClawAgentsAdapter.getSkillStatuses();

    return mapAvailableSkillEntries(globalEntries);
  }
}

/**
 * Maps a skill status entry to its normalized name.
 *
 * @param entry The normalized OpenClaw skill entry.
 * @returns The trimmed skill name, or `undefined`.
 */
export function getSkillEntryName(
  entry: OpenClawSkillStatusEntry
): string | undefined {
  const candidate = entry.name ?? entry.skillKey;

  return candidate.trim().length > 0 ? candidate.trim() : undefined;
}

/**
 * Extracts enabled skill names from a status entry list while preserving order.
 *
 * @param entries The OpenClaw skill status entries.
 * @returns The ordered enabled skill entries.
 */
export function mapAvailableSkillEntries(
  entries: OpenClawSkillStatusEntry[]
): OpenClawSkillStatusEntry[] {
  const availableEntries: OpenClawSkillStatusEntry[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const name = getSkillEntryName(entry);

    if (name === undefined || entry.enabled === false || seen.has(name)) {
      continue;
    }

    seen.add(name);
    availableEntries.push(entry);
  }

  return availableEntries;
}

/**
 * Filters available skills to those configured on the target agent.
 *
 * @param availableEntries Available skills derived from global skill status.
 * @param agentSkillNames Agent skill ids returned by the dip plugin.
 * @returns The filtered skill list for the target agent.
 */
export function filterAgentSkillEntries(
  availableEntries: OpenClawSkillStatusEntry[],
  agentSkillNames: string[]
): DigitalHumanAgentSkillList {
  const allowedNames = new Set(
    agentSkillNames.map((name) => name.trim()).filter((name) => name.length > 0)
  );

  return availableEntries.flatMap((entry) => {
    const name = getSkillEntryName(entry);

    if (name === undefined || !allowedNames.has(name)) {
      return [];
    }

    return [{
      name,
      description: getSkillEntryDescription(entry)
    }];
  });
}

/**
 * Maps a skill status entry to its normalized description.
 *
 * @param entry The normalized OpenClaw skill entry.
 * @returns The trimmed description, or `undefined`.
 */
export function getSkillEntryDescription(
  entry: OpenClawSkillStatusEntry
): string | undefined {
  if (entry.description === undefined) {
    return undefined;
  }

  const trimmed = entry.description.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}
