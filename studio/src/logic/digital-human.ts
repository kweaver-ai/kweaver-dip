import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { OpenClawAgentsAdapter } from "../adapters/openclaw-agents-adapter";
import { HttpError } from "../errors/http-error";
import type { AgentSkillsLogic } from "./agent-skills";
import type {
  ChannelConfig,
  CreateDigitalHumanRequest,
  CreateDigitalHumanResult,
  DigitalHumanChannelType,
  DigitalHumanDetail,
  DigitalHumanList,
  DigitalHumanTemplate,
  UpdateDigitalHumanRequest,
  UpdateDigitalHumanResult
} from "../types/digital-human";
import type { OpenClawAgentsListResult } from "../types/openclaw";
import {
  buildTemplate,
  mergeFilesToTemplate,
  mergeTemplatePatch,
  parseIdentityMarkdown,
  renderIdentityMarkdown,
  renderSoulMarkdown
} from "./digital-human-template";

/**
 * Application logic used to manage digital humans.
 */
export interface DigitalHumanLogic {
  /**
   * Fetches the public digital human list.
   *
   * @returns The normalized digital human list.
   */
  listDigitalHumans(): Promise<DigitalHumanList>;

  /**
   * Retrieves the detail view for a single digital human: fields parsed
   * from IDENTITY.md and SOUL.md, linked skills, and Feishu channel (when bound).
   *
   * @param id The digital human identifier.
   * @returns The detail payload (flat fields, no nested template).
   */
  getDigitalHuman(id: string): Promise<DigitalHumanDetail>;

  /**
   * Creates a new digital human with the full setup flow:
   * agent creation, template files via OpenClaw file RPCs, skill bindings, and channel binding.
   *
   * @param request The creation request payload.
   * @returns The created digital human summary including the rendered template.
   */
  createDigitalHuman(request: CreateDigitalHumanRequest): Promise<CreateDigitalHumanResult>;

  /**
   * Deletes an existing digital human.
   *
   * @param id The digital human identifier.
   * @param deleteFiles Whether to remove workspace files. Defaults to `true`.
   */
  deleteDigitalHuman(id: string, deleteFiles?: boolean): Promise<void>;

  /**
   * Partially updates an existing digital human (IDENTITY.md, SOUL.md, skills, channel).
   *
   * @param id The digital human identifier.
   * @param patch Fields to merge; omitted fields are left unchanged.
   */
  updateDigitalHuman(
    id: string,
    patch: UpdateDigitalHumanRequest
  ): Promise<UpdateDigitalHumanResult>;
}

/**
 * Options required to construct {@link DefaultDigitalHumanLogic}.
 */
export interface DigitalHumanLogicOptions {
  /**
   * The adapter used to manage OpenClaw agents.
   */
  openClawAgentsAdapter: OpenClawAgentsAdapter;

  /**
   * Logic used to read and replace per-agent skill bindings (skills-control API).
   */
  agentSkillsLogic: AgentSkillsLogic;

}

/**
 * Logic implementation that derives digital humans from OpenClaw agents.
 */
export class DefaultDigitalHumanLogic implements DigitalHumanLogic {
  private readonly openClawAgentsAdapter: OpenClawAgentsAdapter;
  private readonly agentSkillsLogic: AgentSkillsLogic;

  /**
   * Creates the digital human logic.
   *
   * @param options Dependencies and configuration.
   */
  public constructor(options: DigitalHumanLogicOptions) {
    this.openClawAgentsAdapter = options.openClawAgentsAdapter;
    this.agentSkillsLogic = options.agentSkillsLogic;
  }

  /**
   * Fetches the digital human list.
   *
   * @returns The normalized digital human list.
   */
  public async listDigitalHumans(): Promise<DigitalHumanList> {
    const { agents } = await this.openClawAgentsAdapter.listAgents();

    return Promise.all(
      agents.map(async (agent) => {
        try {
          const identityResult = await this.openClawAgentsAdapter.getAgentFile({
            agentId: agent.id,
            name: "IDENTITY.md"
          });
          const identity = parseIdentityMarkdown(
            identityResult.file.content ?? ""
          );
          return {
            id: agent.id,
            name:
              identity.name ||
              agent.name ||
              agent.identity?.name ||
              agent.id,
            creature: identity.creature
          };
        } catch {
          return {
            id: agent.id,
            name: agent.name ?? agent.identity?.name ?? agent.id,
            creature: undefined
          };
        }
      })
    );
  }

  /**
   * Reads IDENTITY.md and SOUL.md for a given agent and maps them to
   * flat detail fields (name, creature, soul, bkn), plus skills and channel.
   *
   * @param id The digital human identifier.
   * @returns The detail payload.
   */
  public async getDigitalHuman(id: string): Promise<DigitalHumanDetail> {
    let identityContent: string;
    let soulContent: string;
    try {
      const [identityResult, soulResult] = await Promise.all([
        this.openClawAgentsAdapter.getAgentFile({
          agentId: id,
          name: "IDENTITY.md"
        }),
        this.openClawAgentsAdapter.getAgentFile({
          agentId: id,
          name: "SOUL.md"
        })
      ]);
      identityContent = identityResult.file.content ?? "";
      soulContent = soulResult.file.content ?? "";
    } catch (error: unknown) {
      throw toNotFoundIfAgentMissing(error, id);
    }

    const template = mergeFilesToTemplate(identityContent, soulContent);
    let skills: string[] | undefined;
    try {
      const binding = await this.agentSkillsLogic.getAgentSkills(id);
      skills =
        binding.skills.length > 0 ? binding.skills : undefined;
    } catch {
      skills = undefined;
    }

    const channel = await readChannelForAgent(id);

    return {
      id,
      name: template.identity.name || id,
      creature: template.identity.creature,
      soul: template.soul,
      bkn: template.bkn,
      skills,
      ...(channel !== undefined ? { channel } : {})
    };
  }

  /**
   * Creates a new digital human by orchestrating the full setup flow
   * as specified in the design document:
   *
   * 1. Resolve UUID (use provided id or generate one)
   * 2. Create the agent in OpenClaw (`agents.create`)
   * 3. Update IDENTITY.md and SOUL.md via `agents.files.list` then `agents.files.set`
   * 4. Configure skills via {@link AgentSkillsLogic.updateAgentSkills}
   * 5. (optional) Bind channel on disk when requested
   *
   * @param request The creation request payload.
   * @returns The created digital human summary.
   */
  public async createDigitalHuman(
    request: CreateDigitalHumanRequest
  ): Promise<CreateDigitalHumanResult> {
    const uuid = request.id ?? randomUUID();
    const template = buildTemplate(request);

    const workspace = resolveDefaultWorkspace(uuid);

    await this.openClawAgentsAdapter.createAgent({
      name: uuid,
      workspace
    });

    await this.writeTemplateViaOpenClawFilesRpc(uuid, template);

    if (request.skills && request.skills.length > 0) {
      await this.agentSkillsLogic.updateAgentSkills(uuid, request.skills);
    }

    if (request.channel) {
      try {
        await this.bindChannel(uuid, request.channel);
      } catch (err) {
        console.error("[digital-human] channel binding failed (non-fatal):", err);
      }
    }

    return {
      id: uuid,
      name: request.name,
      creature: request.creature,
      soul: request.soul,
      skills: request.skills,
      bkn: request.bkn,
      channel:
        request.channel !== undefined
          ? normalizeChannelForResponse(request.channel)
          : undefined
    };
  }

  /**
   * Deletes an existing digital human by delegating to the OpenClaw agent adapter.
   *
   * @param id The digital human identifier.
   * @param deleteFiles Whether to remove workspace files. Defaults to `true`.
   */
  public async deleteDigitalHuman(
    id: string,
    deleteFiles?: boolean
  ): Promise<void> {
    await this.openClawAgentsAdapter.deleteAgent({
      agentId: id,
      deleteFiles
    });
  }

  /**
   * Applies a partial update: merges patch into current template, writes files,
   * optionally re-syncs skills and channel binding.
   *
   * @param id Agent UUID.
   * @param patch Partial fields.
   */
  public async updateDigitalHuman(
    id: string,
    patch: UpdateDigitalHumanRequest
  ): Promise<UpdateDigitalHumanResult> {
    let identityContent: string;
    let soulContent: string;
    try {
      const [identityResult, soulResult] = await Promise.all([
        this.openClawAgentsAdapter.getAgentFile({
          agentId: id,
          name: "IDENTITY.md"
        }),
        this.openClawAgentsAdapter.getAgentFile({
          agentId: id,
          name: "SOUL.md"
        })
      ]);
      identityContent = identityResult.file.content ?? "";
      soulContent = soulResult.file.content ?? "";
    } catch (error: unknown) {
      throw toNotFoundIfAgentMissing(error, id);
    }

    const current = mergeFilesToTemplate(identityContent, soulContent);
    const merged = mergeTemplatePatch(current, patch);

    await this.writeTemplateViaOpenClawFilesRpc(id, merged);

    let skillsOut: string[] | undefined;
    if (patch.skills !== undefined) {
      await this.agentSkillsLogic.updateAgentSkills(id, patch.skills);
      skillsOut = patch.skills.length > 0 ? patch.skills : undefined;
    } else {
      try {
        const binding = await this.agentSkillsLogic.getAgentSkills(id);
        skillsOut =
          binding.skills.length > 0 ? binding.skills : undefined;
      } catch {
        skillsOut = undefined;
      }
    }

    if (patch.channel) {
      try {
        await this.bindChannel(id, patch.channel);
      } catch (err) {
        console.error("[digital-human] channel binding failed (non-fatal):", err);
      }
    }

    return {
      id,
      name: merged.identity.name,
      creature: merged.identity.creature,
      soul: merged.soul,
      skills: skillsOut,
      bkn: merged.bkn,
      channel:
        patch.channel !== undefined
          ? normalizeChannelForResponse(patch.channel)
          : undefined
    };
  }

  /**
   * Updates IDENTITY.md and SOUL.md through OpenClaw file RPCs: `agents.files.list`
   * then parallel `agents.files.set` calls, per the digital human design.
   *
   * @param agentId The OpenClaw agent id.
   * @param template The template to render into markdown files.
   */
  private async writeTemplateViaOpenClawFilesRpc(
    agentId: string,
    template: DigitalHumanTemplate
  ): Promise<void> {
    await this.openClawAgentsAdapter.listAgentFiles({ agentId });
    const identityMd = renderIdentityMarkdown(template);
    const soulMd = renderSoulMarkdown(template);
    await Promise.all([
      this.openClawAgentsAdapter.setAgentFile({
        agentId,
        name: "IDENTITY.md",
        content: identityMd
      }),
      this.openClawAgentsAdapter.setAgentFile({
        agentId,
        name: "SOUL.md",
        content: soulMd
      })
    ]);
  }

  /**
   * Binds a messaging channel to the agent by directly modifying the
   * OpenClaw config file on disk.
   *
   * We bypass the WS `config.patch` RPC because:
   * 1. The gateway validates the merged config against installed plugins.
   *    If the target channel plugin (e.g. feishu / dingtalk) is not installed, the
   *    patch is rejected with a validation error.
   * 2. Writing directly avoids gateway plugin validation when the channel
   *    plugin is not installed.
   *
   * @param agentId The agent to bind.
   * @param channel The channel configuration.
   */
  private async bindChannel(
    agentId: string,
    channel: ChannelConfig
  ): Promise<void> {
    const configPath = resolveOpenClawConfigPath();
    let currentConfig: Record<string, unknown> = {};

    try {
      const raw = await readFile(configPath, "utf-8");
      currentConfig = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // Config file missing or unparseable — start with empty config.
    }

    const channelKey = resolveOpenClawChannelKey(channel);
    const binding = { agentId, match: { channel: channelKey } };
    const existingBindings = Array.isArray(currentConfig.bindings)
      ? (currentConfig.bindings as unknown[])
      : [];
    const filteredBindings = existingBindings.filter((entry) => {
      if (typeof entry === "object" && entry !== null && "agentId" in entry) {
        return (entry as { agentId: string }).agentId !== agentId;
      }
      return true;
    });

    const existingChannels =
      typeof currentConfig.channels === "object" && currentConfig.channels !== null
        ? (currentConfig.channels as Record<string, unknown>)
        : {};

    currentConfig.bindings = [...filteredBindings, binding];
    currentConfig.channels = {
      ...existingChannels,
      [channelKey]: {
        enabled: true,
        appId: channel.appId,
        appSecret: channel.appSecret
      }
    };

    await writeFile(configPath, JSON.stringify(currentConfig, null, 2) + "\n", "utf-8");
  }
}

/**
 * Resolves an isolated workspace directory for a given UUID.
 *
 * Uses the UUID as the workspace subdirectory name per the design doc.
 *
 * @param uuid The digital human UUID.
 * @returns The absolute path to the agent-specific workspace.
 */
export function resolveDefaultWorkspace(uuid: string): string {
  return join(homedir(), ".openclaw", uuid);
}

/**
 * Maps gateway "agent missing" failures to HTTP 404.
 */
function toNotFoundIfAgentMissing(error: unknown, id: string): HttpError {
  const message =
    error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("unknown agent") ||
    lower.includes("not found") ||
    lower.includes("no such agent")
  ) {
    return new HttpError(404, `Digital human not found: ${id}`);
  }
  if (error instanceof HttpError) {
    return error;
  }
  throw error instanceof Error ? error : new Error(String(error));
}

/**
 * Resolves the path to the OpenClaw config file.
 *
 * Priority: OPENCLAW_CONFIG_PATH > OPENCLAW_STATE_DIR > ~/.openclaw/openclaw.json.
 *
 * @returns The absolute path to the OpenClaw configuration file.
 */
function resolveOpenClawConfigPath(): string {
  const explicit = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (explicit) {
    return explicit;
  }
  const stateDir = process.env.OPENCLAW_STATE_DIR?.trim();
  if (stateDir) {
    return join(stateDir, "openclaw.json");
  }
  return join(homedir(), ".openclaw", "openclaw.json");
}

function resolveOpenClawChannelKey(channel: ChannelConfig): "feishu" | "dingtalk" {
  const t = channel.type ?? "feishu";
  return t === "dingtalk" ? "dingtalk" : "feishu";
}

function normalizeChannelForResponse(channel: ChannelConfig): ChannelConfig {
  return {
    type: channel.type ?? "feishu",
    appId: channel.appId,
    appSecret: channel.appSecret
  };
}

/**
 * Reads channel credentials from disk when the agent has a matching
 * `bindings` entry (same shape as channel binding on create/update).
 */
async function readChannelForAgent(
  agentId: string
): Promise<ChannelConfig | undefined> {
  const configPath = resolveOpenClawConfigPath();
  let raw: string;
  try {
    raw = await readFile(configPath, "utf-8");
  } catch {
    return undefined;
  }

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }

  const bindings = Array.isArray(config.bindings) ? config.bindings : [];
  const binding = bindings.find((entry) => {
    if (typeof entry !== "object" || entry === null) {
      return false;
    }
    const e = entry as Record<string, unknown>;
    return e.agentId === agentId;
  });
  if (binding === undefined) {
    return undefined;
  }
  const match = (binding as Record<string, unknown>).match;
  if (typeof match !== "object" || match === null) {
    return undefined;
  }
  const channelKey = (match as { channel?: string }).channel;
  if (channelKey !== "feishu" && channelKey !== "dingtalk") {
    return undefined;
  }

  const channels = config.channels;
  if (typeof channels !== "object" || channels === null) {
    return undefined;
  }
  const block = (channels as Record<string, unknown>)[channelKey];
  if (typeof block !== "object" || block === null) {
    return undefined;
  }
  const f = block as Record<string, unknown>;
  const appId = typeof f.appId === "string" ? f.appId.trim() : "";
  const appSecret = typeof f.appSecret === "string" ? f.appSecret.trim() : "";
  if (appId.length === 0 || appSecret.length === 0) {
    return undefined;
  }
  const type: DigitalHumanChannelType =
    channelKey === "dingtalk" ? "dingtalk" : "feishu";
  return { type, appId, appSecret };
}
