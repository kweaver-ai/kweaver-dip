import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { OpenClawAgentsAdapter } from "../adapters/openclaw-agents-adapter";
import { HttpError } from "../errors/http-error";
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
import { mergeCreateDigitalHumanSkills } from "../utils/skills";
import type { AgentSkillsLogic } from "./agent-skills";
import {
  buildTemplate,
  mergeFilesToTemplate,
  mergeTemplatePatch,
  renderIdentityMarkdown,
  renderSoulMarkdown
} from "./digital-human-template";

const HIDDEN_DIGITAL_HUMAN_IDS = new Set(["main", "__internal_skill_agent__"]);

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
   * from IDENTITY.md and SOUL.md, configured skills, and Feishu channel (when bound).
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
   * Logic used to read and replace per-agent skill bindings (dip skills API).
   */
  agentSkillsLogic: AgentSkillsLogic;

  /**
   * Root directory used to create agent workspaces.
   * Defaults to `~/.openclaw` when omitted.
   */
  openClawWorkspaceDir?: string;

}

/**
 * Logic implementation that derives digital humans from OpenClaw agents.
 */
export class DefaultDigitalHumanLogic implements DigitalHumanLogic {
  private readonly openClawAgentsAdapter: OpenClawAgentsAdapter;
  private readonly agentSkillsLogic: AgentSkillsLogic;
  private readonly openClawWorkspaceDir?: string;

  /**
   * Creates the digital human logic.
   *
   * @param options Dependencies and configuration.
   */
  public constructor(options: DigitalHumanLogicOptions) {
    this.openClawAgentsAdapter = options.openClawAgentsAdapter;
    this.agentSkillsLogic = options.agentSkillsLogic;
    this.openClawWorkspaceDir = options.openClawWorkspaceDir;
  }

  /**
   * Fetches the digital human list.
   *
   * @returns The normalized digital human list.
   */
  public async listDigitalHumans(): Promise<DigitalHumanList> {
    const { agents } = await this.openClawAgentsAdapter.listAgents();
    const visibleAgents = agents.filter((agent) => !HIDDEN_DIGITAL_HUMAN_IDS.has(agent.id));

    return Promise.all(
      visibleAgents.map((agent) => this.getDigitalHuman(agent.id).catch(() => ({
        id: agent.id,
        name: agent.name ?? agent.identity?.name ?? agent.id,
        creature: undefined,
        soul: "",
        bkn: undefined,
        skills: undefined
      })))
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
      icon_id: template.identity.icon_id,
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
   * 1. Resolve the new agent id from `request.id`, or generate one UUID when omitted
   * 2. Create the agent in OpenClaw (`agents.create`)
   * 3. Update IDENTITY.md and SOUL.md via `agents.files.list` then `agents.files.set`
   * 4. Configure skills via {@link AgentSkillsLogic.updateAgentSkills}
   * 5. (optional) Bind channel via `config.patch` WS RPC, or fall back to writing
   *    `openclaw.json` when the gateway rejects the patch (one agent ↔ one binding row).
   *
   * @param request The creation request payload.
   * @returns The created digital human summary.
   */
  public async createDigitalHuman(
    request: CreateDigitalHumanRequest
  ): Promise<CreateDigitalHumanResult> {
    const id = request.id?.trim() || randomUUID();
    const template = buildTemplate(request);

    const workspace = resolveDefaultWorkspace(id, this.openClawWorkspaceDir);

    await this.openClawAgentsAdapter.createAgent({
      name: id,
      workspace
    });

    await this.writeTemplateViaOpenClawFilesRpc(id, template);

    const skills = mergeCreateDigitalHumanSkills(request.skills);
    await this.agentSkillsLogic.updateAgentSkills(id, skills);

    if (request.channel) {
      try {
        await this.bindChannelForAgent(id, request.channel);
      } catch (err) {
        console.error("[digital-human] channel binding failed (non-fatal):", err);
      }
    }

    return {
      id,
      name: request.name,
      creature: request.creature,
      icon_id: request.icon_id,
      soul: request.soul,
      skills,
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
        await this.bindChannelForAgent(id, patch.channel);
      } catch (err) {
        console.error("[digital-human] channel binding failed (non-fatal):", err);
      }
    }

    return {
      id,
      name: merged.identity.name,
      creature: merged.identity.creature,
      icon_id: merged.identity.icon_id,
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
   * Binds channel credentials and routing: Feishu and DingTalk use
   * `channels.<feishu|dingtalk>.accounts.<accountId>` (derived from `appId`) and
   * `match.accountId` so multiple apps can coexist; each account may only be bound to one
   * agent (other agents' claims on that account are removed). For Feishu, each account
   * also sets `dmPolicy: "open"` and `allowFrom: ["*"]` so DMs reach the agent without
   * OpenClaw pairing (`openclaw pairing approve`). Tries `config.patch` first; falls back
   * to writing `openclaw.json` if the gateway rejects the patch.
   *
   * @param agentId The OpenClaw agent id.
   * @param channel The channel configuration.
   */
  private async bindChannelForAgent(
    agentId: string,
    channel: ChannelConfig
  ): Promise<void> {
    const configPath = resolveOpenClawConfigPath();
    const merged = await loadOpenClawConfigForMerge(configPath);
    applyAgentChannelBinding(merged, agentId, channel);

    try {
      const { hash } = await this.openClawAgentsAdapter.getConfig();
      const channelKey = resolveOpenClawChannelKey(channel);
      const channelPayload = getChannelPatchPayload(merged, channelKey);
      const patchObject: Record<string, unknown> = {
        channels: {
          [channelKey]: channelPayload
        },
        bindings: merged.bindings ?? []
      };
      await this.openClawAgentsAdapter.patchConfig({
        raw: JSON.stringify(patchObject),
        baseHash: hash
      });
    } catch (err) {
      console.warn(
        "[digital-human] config.patch failed; writing openclaw.json directly:",
        err
      );
      await writeFile(
        configPath,
        JSON.stringify(merged, null, 2) + "\n",
        "utf-8"
      );
    }
  }
}

/**
 * Resolves an isolated workspace directory for a given digital human id.
 *
 * Uses the digital human id as the workspace subdirectory name.
 *
 * @param uuid The digital human identifier.
 * @returns The absolute path to the agent-specific workspace.
 */
export function resolveDefaultWorkspace(
  uuid: string,
  openClawWorkspaceDir?: string
): string {
  const baseDir = openClawWorkspaceDir?.trim() || join(homedir(), ".openclaw");
  return join(baseDir, uuid);
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
 * Priority: OPENCLAW_CONFIG_PATH > OPENCLAW_ROOT_DIR > ~/.openclaw/openclaw.json.
 *
 * @returns The absolute path to the OpenClaw configuration file.
 */
function resolveOpenClawConfigPath(): string {
  const explicit = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (explicit) {
    return explicit;
  }
  const stateDir = process.env.OPENCLAW_ROOT_DIR?.trim();
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
 * Loads the local OpenClaw JSON object for merging (unredacted), or `{}` if missing.
 *
 * @param configPath Absolute path to `openclaw.json`.
 */
async function loadOpenClawConfigForMerge(
  configPath: string
): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(configPath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const OPENCLAW_DEFAULT_ACCOUNT_ID = "default";

const BLOCKED_ACCOUNT_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype"
]);

/**
 * Derives a stable OpenClaw channel `accountId` from a provider app id (Feishu `cli_*`,
 * DingTalk app keys, etc.).
 * Aligns with OpenClaw's account-id normalization so bindings match gateway routing.
 */
export function normalizeOpenClawAccountIdFromAppId(appId: string): string {
  const trimmed = appId.trim();
  if (!trimmed) {
    return OPENCLAW_DEFAULT_ACCOUNT_ID;
  }
  const VALID_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
  if (VALID_ID_RE.test(trimmed)) {
    const lower = trimmed.toLowerCase();
    if (!BLOCKED_ACCOUNT_KEYS.has(lower)) {
      return lower;
    }
  }
  const INVALID_CHARS_RE = /[^a-z0-9_-]+/gi;
  const LEADING_DASH_RE = /^-+/;
  const TRAILING_DASH_RE = /-+$/;
  let canonical = trimmed
    .toLowerCase()
    .replace(INVALID_CHARS_RE, "-")
    .replace(LEADING_DASH_RE, "")
    .replace(TRAILING_DASH_RE, "")
    .slice(0, 64);
  if (!canonical || BLOCKED_ACCOUNT_KEYS.has(canonical)) {
    return OPENCLAW_DEFAULT_ACCOUNT_ID;
  }
  return canonical;
}

function bindingAccountKeyForChannel(
  match: { channel?: string; accountId?: string } | undefined,
  expectedChannel: "feishu" | "dingtalk"
): string | null {
  if (!match || match.channel !== expectedChannel) {
    return null;
  }
  const raw = typeof match.accountId === "string" ? match.accountId.trim() : "";
  if (!raw) {
    return OPENCLAW_DEFAULT_ACCOUNT_ID;
  }
  return normalizeOpenClawAccountIdFromAppId(raw);
}

/**
 * Mutates config so this agent has exactly one channel binding row. Feishu and DingTalk use
 * `channels.<provider>.accounts.<accountId>` (one app id → one account → one agent). Other
 * agents' bindings are preserved except when they claim the same account on that channel
 * as this bind (then they are removed).
 *
 * @param currentConfig Parsed config root.
 * @param agentId Target agent id.
 * @param channel Channel credentials and type.
 */
function applyAgentChannelBinding(
  currentConfig: Record<string, unknown>,
  agentId: string,
  channel: ChannelConfig
): void {
  const channelKey = resolveOpenClawChannelKey(channel);
  const existingBindings = Array.isArray(currentConfig.bindings)
    ? (currentConfig.bindings as unknown[])
    : [];

  const withoutThisAgent = existingBindings.filter((entry) => {
    if (typeof entry === "object" && entry !== null && "agentId" in entry) {
      return (entry as { agentId: string }).agentId !== agentId;
    }
    return true;
  });

  const existingChannels =
    typeof currentConfig.channels === "object" && currentConfig.channels !== null
      ? (currentConfig.channels as Record<string, unknown>)
      : {};

  const accountId = normalizeOpenClawAccountIdFromAppId(channel.appId);
  const filteredBindings = withoutThisAgent.filter((entry) => {
    if (typeof entry !== "object" || entry === null || !("match" in entry)) {
      return true;
    }
    const m = (entry as { match?: { channel?: string; accountId?: string } }).match;
    const acc = bindingAccountKeyForChannel(m, channelKey);
    if (acc === null || acc !== accountId) {
      return true;
    }
    return false;
  });

  const prevBlock =
    typeof existingChannels[channelKey] === "object" &&
    existingChannels[channelKey] !== null
      ? (existingChannels[channelKey] as Record<string, unknown>)
      : {};
  const prevAccounts: Record<string, unknown> =
    typeof prevBlock.accounts === "object" && prevBlock.accounts !== null
      ? { ...(prevBlock.accounts as Record<string, unknown>) }
      : {};

  const prevEntry =
    typeof prevAccounts[accountId] === "object" && prevAccounts[accountId] !== null
      ? (prevAccounts[accountId] as Record<string, unknown>)
      : {};

  prevAccounts[accountId] = {
    ...prevEntry,
    enabled: true,
    appId: channel.appId.trim(),
    appSecret: channel.appSecret,
    // OpenClaw Feishu default is dmPolicy=pairing (requires `openclaw pairing approve`).
    // Digital employees should talk to the agent without manual pairing.
    ...(channelKey === "feishu"
      ? {
          dmPolicy: "open",
          allowFrom: ["*"]
        }
      : {})
  };

  currentConfig.bindings = [
    ...filteredBindings,
    {
      agentId,
      match: { channel: channelKey, accountId }
    }
  ];
  currentConfig.channels = {
    ...existingChannels,
    [channelKey]: {
      ...prevBlock,
      enabled: prevBlock.enabled !== false,
      accounts: prevAccounts
    }
  };
}

function getChannelPatchPayload(
  merged: Record<string, unknown>,
  channelKey: "feishu" | "dingtalk"
): unknown {
  const ch = merged.channels;
  if (typeof ch === "object" && ch !== null) {
    const block = (ch as Record<string, unknown>)[channelKey];
    if (block !== undefined) {
      return block;
    }
  }
  return {};
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

  let appId = "";
  let appSecret = "";
  const accountIdRaw = (match as { accountId?: string }).accountId;
  const accountKey =
    typeof accountIdRaw === "string" && accountIdRaw.trim().length > 0
      ? normalizeOpenClawAccountIdFromAppId(accountIdRaw)
      : OPENCLAW_DEFAULT_ACCOUNT_ID;
  const accounts =
    typeof f.accounts === "object" && f.accounts !== null
      ? (f.accounts as Record<string, unknown>)
      : undefined;
  const sub =
    accounts && typeof accounts[accountKey] === "object" && accounts[accountKey] !== null
      ? (accounts[accountKey] as Record<string, unknown>)
      : undefined;
  if (sub) {
    appId = typeof sub.appId === "string" ? sub.appId.trim() : "";
    appSecret = typeof sub.appSecret === "string" ? sub.appSecret.trim() : "";
  }
  if (appId.length === 0 || appSecret.length === 0) {
    appId = typeof f.appId === "string" ? f.appId.trim() : "";
    appSecret = typeof f.appSecret === "string" ? f.appSecret.trim() : "";
  }

  if (appId.length === 0 || appSecret.length === 0) {
    return undefined;
  }
  const type: DigitalHumanChannelType =
    channelKey === "dingtalk" ? "dingtalk" : "feishu";
  return { type, appId, appSecret };
}
