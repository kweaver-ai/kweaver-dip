import type { OpenClawAgentsAdapter } from "../adapters/openclaw-agents-adapter";
import type { OpenClawAgentSkillsHttpClient } from "../infra/openclaw-agent-skills-http-client";
import type { OpenClawAgentSkillsHttpResult } from "../infra/openclaw-agent-skills-http-client";
import type {
  DigitalHumanSkill,
  DigitalHumanAgentSkillList,
  DigitalHumanSkillList
} from "../types/digital-human";
import type {
  AgentSkillsBinding,
  AgentSkillsCatalog,
  InstallSkillResult,
  SkillContentResult,
  SkillTreeResult,
  UninstallSkillResult,
  UpdateAgentSkillsResult
} from "../types/agent-skills";
import type {
  OpenClawSkillStatusEntry,
  OpenClawSkillOriginType
} from "../types/openclaw";
import { isDefaultDigitalHumanSkillSlug } from "../utils/skills";

const OPENCLAW_WORKSPACE_SOURCE = "openclaw-workspace";

/**
 * Application logic used to query and update agent skill bindings.
 */
export interface AgentSkillsLogic {
  /**
   * Lists globally enabled skills exposed by OpenClaw.
   */
  listEnabledSkills(): Promise<DigitalHumanSkillList>;

  /**
   * Lists globally enabled skills filtered by an optional name substring.
   *
   * @param name Optional substring matched case-insensitively against slug/name.
   */
  listEnabledSkillsByQuery(name?: string): Promise<DigitalHumanSkillList>;

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

  /**
   * Installs a `.skill` zip via the OpenClaw `dip` plugin Gateway route.
   *
   * @param zipBody Raw zip bytes.
   * @param options Optional overwrite flag forwarded upstream.
   */
  installSkill(
    zipBody: Buffer,
    options?: { overwrite?: boolean; name?: string }
  ): Promise<InstallSkillResult>;

  /**
   * Uninstalls a skill from the gateway repository `skills/` tree.
   *
   * @param name Skill id to remove.
   */
  uninstallSkill(name: string): Promise<UninstallSkillResult>;

  /**
   * Lists files and directories under one skill.
   *
   * @param name Skill id to inspect.
   */
  getSkillTree(name: string, resolvedSkillPath: string): Promise<SkillTreeResult>;

  /**
   * Reads one text file preview under a skill directory.
   *
   * @param name Skill id to inspect.
   * @param filePath Skill-root-relative file path.
   */
  getSkillContent(
    name: string,
    filePath: string,
    resolvedSkillPath: string
  ): Promise<SkillContentResult>;

  /**
   * Downloads one file under a skill directory.
   *
   * @param name Skill id to inspect.
   * @param filePath Skill-root-relative file path.
   */
  downloadSkillFile(
    name: string,
    filePath: string,
    resolvedSkillPath: string
  ): Promise<OpenClawAgentSkillsHttpResult>;

  /**
   * Lists raw skill status entries returned by OpenClaw.
   */
  getSkillStatuses(): Promise<OpenClawSkillStatusEntry[]>;

  /**
   * Resolves one skill's absolute directory path from OpenClaw `skills.status`.
   *
   * @param name Skill id to inspect.
   */
  resolveSkillPath(name: string): Promise<string>;
}

/**
 * Logic implementation backed by OpenClaw `skills.status` plus the `dip` plugin
 * file/binding HTTP API.
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

    return globalEntries.map((entry) => this.mapEntryToSkill(entry));
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
    const availableEntries = await this.getAvailableSkillEntries(agentId);
    const agentBinding = await this.client.getAgentSkills(agentId);

    return filterAgentSkillEntries(availableEntries, agentBinding.skills);
  }

  /**
   * Lists globally available skill ids.
   *
   * @returns Skill ids derived from OpenClaw `skills.status`.
   */
  public async listAvailableSkills(): Promise<AgentSkillsCatalog> {
    const entries = await this.getAvailableSkillEntries();
    return {
      skills: entries.map((entry) => entry.skillKey)
    };
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
    const resolvedSkills = await this.resolveSkillBindingKeys(skills);
    return this.client.updateAgentSkills(agentId, resolvedSkills);
  }

  /**
   * Installs a `.skill` archive through the Gateway plugin HTTP route.
   *
   * @param zipBody Raw zip bytes.
   * @param options Optional overwrite flag.
   * @returns The plugin install payload.
   */
  public async installSkill(
    zipBody: Buffer,
    options?: { overwrite?: boolean; name?: string }
  ): Promise<InstallSkillResult> {
    return this.client.installSkill(zipBody, options);
  }

  /**
   * Removes a skill directory via the Gateway plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @returns The plugin uninstall payload.
   */
  public async uninstallSkill(name: string): Promise<UninstallSkillResult> {
    return this.client.uninstallSkill(name);
  }

  /**
   * Reads one skill's file tree from the plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @returns The tree payload.
   */
  public async getSkillTree(
    name: string,
    resolvedSkillPath: string
  ): Promise<SkillTreeResult> {
    return this.client.getSkillTree(name, resolvedSkillPath);
  }

  /**
   * Reads one skill file preview from the plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @param filePath Skill-root-relative file path.
   * @returns The preview payload.
   */
  public async getSkillContent(
    name: string,
    filePath: string,
    resolvedSkillPath: string
  ): Promise<SkillContentResult> {
    return this.client.getSkillContent(name, filePath, resolvedSkillPath);
  }

  /**
   * Downloads one skill file from the plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @param filePath Skill-root-relative file path.
   * @returns Upstream status, headers and body bytes.
   */
  public async downloadSkillFile(
    name: string,
    filePath: string,
    resolvedSkillPath: string
  ): Promise<OpenClawAgentSkillsHttpResult> {
    return this.client.downloadSkillFile(name, filePath, resolvedSkillPath);
  }

  public async listEnabledSkillsByQuery(name?: string): Promise<DigitalHumanSkillList> {
    const normalized = name?.trim().toLowerCase();
    const entries = await this.getAvailableSkillEntries();

    if (normalized === undefined || normalized.length === 0) {
      return entries.map((entry) => this.mapEntryToSkill(entry));
    }

    const filtered = entries.filter((entry) => {
      const slugMatch = entry.skillKey.toLowerCase().includes(normalized);
      const display = getSkillEntryName(entry)?.toLowerCase();
      const desc = getSkillEntryDescription(entry)?.toLowerCase();
      return (
        slugMatch ||
        (display?.includes(normalized) ?? false) ||
        (desc?.includes(normalized) ?? false)
      );
    });

    return filtered.map((entry) => this.mapEntryToSkill(entry));
  }

  /**
   * Lists all skill status entries returned by OpenClaw.
   *
   * @returns Normalized skill status entries.
   */
  public async getSkillStatuses(): Promise<OpenClawSkillStatusEntry[]> {
    if (this.openClawAgentsAdapter === undefined) {
      throw new Error("OpenClaw agents adapter is required for skill status queries");
    }

    return this.openClawAgentsAdapter.getSkillStatuses();
  }

  public async resolveSkillPath(name: string): Promise<string> {
    const normalized = normalizeSkillId(name);
    if (normalized === undefined) {
      throw new Error("Skill name is required");
    }

    const statuses = await this.getSkillStatuses();
    const entry = statuses.find((candidate) => matchesSkillEntry(candidate, normalized));
    const skillPath = entry?.skillPath?.trim();

    if (skillPath === undefined || skillPath.length === 0) {
      throw new Error(`Skill path not found: ${name}`);
    }

    return skillPath;
  }

  private async resolveSkillBindingKeys(skills: string[]): Promise<string[]> {
    if (this.openClawAgentsAdapter === undefined) {
      return skills;
    }

    const statuses = await this.getSkillStatuses();

    return skills
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0)
      .map((skill) => {
        const normalized = normalizeSkillId(skill);
        if (normalized === undefined) {
          return skill;
        }

        const entry = statuses.find((candidate) => matchesSkillEntry(candidate, normalized));
        return entry?.skillKey ?? skill;
      });
  }

  /**
   * Reads and normalizes globally enabled OpenClaw skills.
   *
   * @returns The filtered OpenClaw skill entries.
   */
  private async getAvailableSkillEntries(agentId?: string): Promise<OpenClawSkillStatusEntry[]> {
    if (this.openClawAgentsAdapter === undefined) {
      throw new Error("OpenClaw agents adapter is required for skill status queries");
    }

    const globalEntries = await this.openClawAgentsAdapter.getSkillStatuses(agentId ? { agentId } : {});

    return mapAvailableSkillEntries(globalEntries);
  }

  private mapEntryToSkill(entry: OpenClawSkillStatusEntry): DigitalHumanSkill {
    const name = getSkillEntryName(entry) ?? entry.skillKey;
    return {
      name,
      description: getSkillEntryDescription(entry),
      built_in: isDefaultDigitalHumanSkillSlug(entry.skillKey) || entry.source === OPENCLAW_WORKSPACE_SOURCE,
      type: resolveSkillEntryOriginType(entry)
    };
  }
}

/**
 * Resolves the public `type` field from a normalized OpenClaw entry.
 *
 * @param entry The normalized OpenClaw skill entry.
 * @returns The skill origin classification.
 */
export function resolveSkillEntryOriginType(
  entry: OpenClawSkillStatusEntry
): OpenClawSkillOriginType {
  if (entry.source !== undefined && entry.source.trim().length > 0) {
    return entry.source;
  }

  return entry.skillOriginType ?? "unknown";
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
  const allowedSkillIds = 
    agentSkillNames
      .map((name) => normalizeSkillId(name))
      .filter((name): name is string => name !== undefined);

  return availableEntries.flatMap((entry) => {
    const name = getSkillEntryName(entry);

    if (
      name === undefined ||
      !allowedSkillIds.some((allowed) => matchesSkillEntry(entry, allowed))
    ) {
      return [];
    }

    return [{
      name,
      description: getSkillEntryDescription(entry),
      built_in: isDefaultDigitalHumanSkillSlug(entry.skillKey) || entry.source === OPENCLAW_WORKSPACE_SOURCE,
      type: resolveSkillEntryOriginType(entry)
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

export function matchesSkillEntry(
  entry: OpenClawSkillStatusEntry,
  normalizedSkillId: string
): boolean {
  if (normalizeSkillId(entry.skillKey) === normalizedSkillId) {
    return true;
  }

  if (normalizeSkillId(getSkillEntryName(entry)) === normalizedSkillId) {
    return true;
  }

  const skillPath = entry.skillPath?.trim();
  if (skillPath === undefined || skillPath.length === 0) {
    return false;
  }

  const slashNormalized = skillPath.replace(/\\/g, "/");
  const fromPath = slashNormalized.split("/").filter(Boolean).at(-1);
  return normalizeSkillId(fromPath) === normalizedSkillId;
}

function normalizeSkillId(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}
