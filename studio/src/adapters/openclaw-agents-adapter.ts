import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  OpenClawAgentsCreateParams,
  OpenClawAgentsCreateResult,
  OpenClawAgentsDeleteParams,
  OpenClawAgentsDeleteResult,
  OpenClawAgentsFilesGetParams,
  OpenClawAgentsFilesGetResult,
  OpenClawAgentsFilesListParams,
  OpenClawAgentsFilesListResult,
  OpenClawAgentsFilesSetParams,
  OpenClawAgentsFilesSetResult,
  OpenClawAgentsListResult,
  OpenClawConfigGetResult,
  OpenClawConfigPatchParams,
  OpenClawConfigPatchResult,
  OpenClawGatewayPort,
  OpenClawRequestFrame,
  OpenClawSkillStatusEntry,
  OpenClawSkillsStatusParams,
  OpenClawSkillOriginType,
  OpenClawSkillStatusEntryRaw,
  OpenClawSkillStatusReport
} from "../types/openclaw";

/**
 * Outbound adapter used to manage OpenClaw agents through the gateway port.
 */
export interface OpenClawAgentsAdapter {
  /**
   * Fetches the current OpenClaw agent list.
   *
   * @returns The OpenClaw `AgentsListResult` payload.
   */
  listAgents(): Promise<OpenClawAgentsListResult>;

  /**
   * Creates a new OpenClaw agent.
   *
   * @param params The agent creation parameters.
   * @returns The OpenClaw `AgentsCreateResult` payload.
   */
  createAgent(params: OpenClawAgentsCreateParams): Promise<OpenClawAgentsCreateResult>;

  /**
   * Deletes an existing OpenClaw agent.
   *
   * @param params The agent deletion parameters.
   * @returns The OpenClaw `AgentsDeleteResult` payload.
   */
  deleteAgent(params: OpenClawAgentsDeleteParams): Promise<OpenClawAgentsDeleteResult>;

  /**
   * Lists workspace files for an OpenClaw agent.
   *
   * @param params The file list parameters.
   * @returns File metadata entries for the agent workspace.
   */
  listAgentFiles(params: OpenClawAgentsFilesListParams): Promise<OpenClawAgentsFilesListResult>;

  /**
   * Reads a workspace file from an OpenClaw agent.
   *
   * @param params The file retrieval parameters.
   * @returns The file metadata and content.
   */
  getAgentFile(params: OpenClawAgentsFilesGetParams): Promise<OpenClawAgentsFilesGetResult>;

  /**
   * Writes (overwrites) a workspace file for an OpenClaw agent.
   *
   * @param params The file write parameters.
   * @returns The written file metadata.
   */
  setAgentFile(params: OpenClawAgentsFilesSetParams): Promise<OpenClawAgentsFilesSetResult>;

  /**
   * Reads skill status from OpenClaw. Omitting `agentId` queries global skills.
   *
   * @param params Optional scope parameters.
   * @returns The normalized skill status list.
   */
  getSkillStatuses(params?: OpenClawSkillsStatusParams): Promise<OpenClawSkillStatusEntry[]>;

  /**
   * Reads the current OpenClaw configuration.
   *
   * @returns The serialized config and its content hash.
   */
  getConfig(): Promise<OpenClawConfigGetResult>;

  /**
   * Applies a partial configuration patch to OpenClaw.
   *
   * @param params The patch payload and base hash for optimistic locking.
   * @returns The patch result.
   */
  patchConfig(params: OpenClawConfigPatchParams): Promise<OpenClawConfigPatchResult>;
}

/**
 * Creates the OpenClaw `agents.list` request.
 *
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsListRequest(): OpenClawRequestFrame {
  return {
    type: "req",
    method: "agents.list",
    params: {}
  };
}

/**
 * Creates the OpenClaw `agents.create` request.
 *
 * @param params The agent creation parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsCreateRequest(
  params: OpenClawAgentsCreateParams
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "agents.create",
    params
  };
}

/**
 * Creates the OpenClaw `agents.delete` request.
 *
 * @param params The agent deletion parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsDeleteRequest(
  params: OpenClawAgentsDeleteParams
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "agents.delete",
    params
  };
}

/**
 * Creates the OpenClaw `agents.files.list` request.
 *
 * @param params The file list parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsFilesListRequest(
  params: OpenClawAgentsFilesListParams
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "agents.files.list",
    params
  };
}

/**
 * Creates the OpenClaw `agents.files.get` request.
 *
 * @param params The file retrieval parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsFilesGetRequest(
  params: OpenClawAgentsFilesGetParams
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "agents.files.get",
    params
  };
}

/**
 * Creates the OpenClaw `agents.files.set` request.
 *
 * @param params The file write parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsFilesSetRequest(
  params: OpenClawAgentsFilesSetParams
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "agents.files.set",
    params
  };
}

/**
 * Creates the OpenClaw `skills.status` request.
 *
 * @param params Optional skill status scope parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createSkillsStatusRequest(
  params: OpenClawSkillsStatusParams = {}
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "skills.status",
    params
  };
}

/**
 * Creates the OpenClaw `config.get` request.
 *
 * @returns A serialized OpenClaw request frame.
 */
export function createConfigGetRequest(): OpenClawRequestFrame {
  return {
    type: "req",
    method: "config.get",
    params: {}
  };
}

/**
 * Creates the OpenClaw `config.patch` request.
 *
 * @param params The config patch parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createConfigPatchRequest(
  params: OpenClawConfigPatchParams
): OpenClawRequestFrame {
  return {
    type: "req",
    method: "config.patch",
    params
  };
}

/**
 * Adapter that translates agent operations to OpenClaw Gateway JSON RPC.
 */
export class OpenClawAgentsGatewayAdapter implements OpenClawAgentsAdapter {
  /**
   * Creates the adapter.
   *
   * @param gatewayPort The OpenClaw Gateway RPC port.
   * @param skillOriginContext Optional host paths used to classify `skills.status` entries.
   */
  public constructor(
    private readonly gatewayPort: OpenClawGatewayPort
  ) {}

  /**
   * Queries `agents.list` over the gateway RPC port.
   *
   * @returns The OpenClaw `AgentsListResult` payload.
   */
  public async listAgents(): Promise<OpenClawAgentsListResult> {
    return this.gatewayPort.invoke<OpenClawAgentsListResult>(
      createAgentsListRequest()
    );
  }

  /**
   * Invokes `agents.create` over the gateway RPC port.
   *
   * @param params The agent creation parameters.
   * @returns The OpenClaw `AgentsCreateResult` payload.
   */
  public async createAgent(
    params: OpenClawAgentsCreateParams
  ): Promise<OpenClawAgentsCreateResult> {
    return this.gatewayPort.invoke<OpenClawAgentsCreateResult>(
      createAgentsCreateRequest(params)
    );
  }

  /**
   * Invokes `agents.delete` over the gateway RPC port.
   *
   * @param params The agent deletion parameters.
   * @returns The OpenClaw `AgentsDeleteResult` payload.
   */
  public async deleteAgent(
    params: OpenClawAgentsDeleteParams
  ): Promise<OpenClawAgentsDeleteResult> {
    return this.gatewayPort.invoke<OpenClawAgentsDeleteResult>(
      createAgentsDeleteRequest(params)
    );
  }

  /**
   * Invokes `agents.files.list` over the gateway RPC port.
   *
   * @param params The file list parameters.
   * @returns Listed workspace files for the agent.
   */
  public async listAgentFiles(
    params: OpenClawAgentsFilesListParams
  ): Promise<OpenClawAgentsFilesListResult> {
    return this.gatewayPort.invoke<OpenClawAgentsFilesListResult>(
      createAgentsFilesListRequest(params)
    );
  }

  /**
   * Invokes `agents.files.get` over the gateway RPC port.
   *
   * @param params The file retrieval parameters.
   * @returns The file metadata and content.
   */
  public async getAgentFile(
    params: OpenClawAgentsFilesGetParams
  ): Promise<OpenClawAgentsFilesGetResult> {
    return this.gatewayPort.invoke<OpenClawAgentsFilesGetResult>(
      createAgentsFilesGetRequest(params)
    );
  }

  /**
   * Invokes `agents.files.set` over the gateway RPC port.
   *
   * @param params The file write parameters.
   * @returns The written file metadata.
   */
  public async setAgentFile(
    params: OpenClawAgentsFilesSetParams
  ): Promise<OpenClawAgentsFilesSetResult> {
    return this.gatewayPort.invoke<OpenClawAgentsFilesSetResult>(
      createAgentsFilesSetRequest(params)
    );
  }

  /**
   * Invokes `skills.status` over the gateway RPC port.
   *
   * @param params Optional scope parameters.
   * @returns The normalized skill status list.
   */
  public async getSkillStatuses(
    params: OpenClawSkillsStatusParams = {}
  ): Promise<OpenClawSkillStatusEntry[]> {
    const result = await this.gatewayPort.invoke<OpenClawSkillStatusReport>(
      createSkillsStatusRequest(params)
    );

    return normalizeSkillStatusesFromRpcResult(result);
  }

  /**
   * Invokes `config.get` over the gateway RPC port.
   *
   * @returns The serialized config and its content hash.
   */
  public async getConfig(): Promise<OpenClawConfigGetResult> {
    return this.gatewayPort.invoke<OpenClawConfigGetResult>(
      createConfigGetRequest()
    );
  }

  /**
   * Invokes `config.patch` over the gateway RPC port.
   *
   * @param params The patch payload and base hash.
   * @returns The patch result.
   */
  public async patchConfig(
    params: OpenClawConfigPatchParams
  ): Promise<OpenClawConfigPatchResult> {
    return this.gatewayPort.invoke<OpenClawConfigPatchResult>(
      createConfigPatchRequest(params)
    );
  }
}

/**
 * Parses `skills.status` RPC payload, resolves each entry's final `skillPath`, then infers
 * {@link OpenClawSkillStatusEntry.skillOriginType} only when both path and host context exist.
 *
 * @param result Raw gateway payload.
 * @param skillOriginContext Resolved home + workspace for classification; omit for tests.
 */
export function normalizeSkillStatusesFromRpcResult(
  result: OpenClawSkillStatusReport
): OpenClawSkillStatusEntry[] {
  return parseAndNormalizeSkillStatusEntries(result, {});
}

/**
 * Back-compat: path normalization only (no `skillOriginType`).
 *
 * @param result Raw `skills.status` payload.
 */
export function normalizeSkillStatusEntries(
  result: OpenClawSkillStatusReport
): OpenClawSkillStatusEntry[] {
  return parseAndNormalizeSkillStatusEntries(result, {});
}

/**
 * Same as {@link attachSkillOriginTypesAfterPathsResolved} (legacy name).
 */
export function enrichSkillEntriesWithOrigin(
  entries: OpenClawSkillStatusEntry[]
): OpenClawSkillStatusEntry[] {
  return entries;
}

/**
 * Resolves full `skillPath` from the raw RPC (envelope `installRoot`, nested fields, etc.).
 * Does not set `skillOriginType` — call {@link attachSkillOriginTypesAfterPathsResolved} after.
 *
 * @param result Raw payload.
 * @param options Optional `installRoot` override (tests).
 */
export function parseAndNormalizeSkillStatusEntries(
  result: OpenClawSkillStatusReport,
  options: { installRoot?: string } = {}
): OpenClawSkillStatusEntry[] {
  const installRoot = options.installRoot;
  const mergedOptions: NormalizeSkillStatusEntryOptions = { installRoot };

  return result.skills
    .map((entry) => normalizeSkillStatusEntry(entry, mergedOptions))
    .filter((entry): entry is OpenClawSkillStatusEntry => entry !== undefined);
}

/**
 * Optional context from the `skills.status` RPC envelope for path inference.
 */
export interface NormalizeSkillStatusEntryOptions {
  installRoot?: string;
}

/**
 * Normalizes one raw `skills.status` entry.
 *
 * @param candidate The raw status entry.
 * @param options Envelope `installRoot` for path join when entry omits a path.
 * @returns The normalized entry, or `undefined` when it cannot be parsed.
 */
export function normalizeSkillStatusEntry(
  candidate: OpenClawSkillStatusEntryRaw,
  options: NormalizeSkillStatusEntryOptions = {}
): OpenClawSkillStatusEntry | undefined {
  const rawSkillKey = (candidate.skillKey ?? "").trim();
  if (rawSkillKey.length === 0) {
    return undefined;
  }

  const skillPath = resolveSkillDirectoryPath(rawSkillKey, candidate, options);
  const source = readFirstString(candidate.source);

  return {
    skillKey: rawSkillKey,
    name: resolveSkillName(candidate, rawSkillKey),
    description: resolveSkillDescription(candidate),
    enabled: readEnabledFlag(candidate),
    ...(skillPath !== undefined ? { skillPath } : {}),
    ...(source !== undefined ? { source } : {}),
    ...readSkillOriginType(candidate.skillOriginType)
  };
}

function resolveSkillDirectoryPath(
  skillKey: string,
  raw: OpenClawSkillStatusEntryRaw,
  options: NormalizeSkillStatusEntryOptions
): string | undefined {
  const fromEntry = readSkillDirectoryFromEntry(raw);

  if (fromEntry !== undefined) {
    return fromEntry;
  }

  return derivePathFromInstallRoot(skillKey, options.installRoot);
}

function deriveSkillPathFields(
  skillKey: string,
  raw: OpenClawSkillStatusEntryRaw | undefined,
  options: NormalizeSkillStatusEntryOptions
): { skillPath?: string } {
  const fromEntry =
    raw === undefined ? undefined : readSkillDirectoryFromEntry(raw);
  const skillPath =
    fromEntry ?? derivePathFromInstallRoot(skillKey, options.installRoot);

  return skillPath !== undefined ? { skillPath } : {};
}

function derivePathFromInstallRoot(
  skillKey: string,
  installRoot: string | undefined
): string | undefined {
  if (installRoot === undefined || installRoot.trim().length === 0) {
    return undefined;
  }

  return path.join(installRoot.trim(), skillKey.trim());
}

function readSkillDirectoryFromEntry(raw: OpenClawSkillStatusEntryRaw): string | undefined {
  const fromBaseDir = readFirstString(raw.baseDir);

  if (fromBaseDir !== undefined) {
    return normalizeSkillDirCandidate(fromBaseDir);
  }

  const fromFilePath = readFirstString(raw.filePath);

  if (fromFilePath !== undefined) {
    return normalizeSkillDirCandidate(fromFilePath);
  }

  return undefined;
}

function stripFileUriIfNeeded(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.startsWith("file:")) {
    return trimmed;
  }

  try {
    return fileURLToPath(trimmed);
  } catch {
    return trimmed.replace(/^file:\/\//, "");
  }
}

function normalizeSkillDirCandidate(value: string): string {
  const stripped = stripFileUriIfNeeded(value);
  const base = path.basename(stripped).toLowerCase();
  if (base === "skill.md") {
    return path.dirname(stripped);
  }

  return stripped;
}

/**
 * Derives one normalized enabled flag from a raw skill status entry.
 *
 * @param candidate The raw skill status object.
 * @returns The normalized enabled flag, or `undefined`.
 */
function readEnabledFlag(candidate: OpenClawSkillStatusEntryRaw): boolean | undefined {
  for (const flag of [candidate.enabled, candidate.isEnabled, candidate.active]) {
    if (flag !== undefined) {
      return flag;
    }
  }

  if (candidate.disabled !== undefined) {
    return candidate.disabled !== true;
  }

  for (const value of [candidate.status, candidate.state]) {
    const normalized = value?.trim().toLowerCase();

    if (normalized === undefined) {
      continue;
    }

    if (["enabled", "enable", "active", "on"].includes(normalized)) {
      return true;
    }

    if (["disabled", "disable", "inactive", "off"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function readSkillOriginType(
  candidate: string | undefined
): { skillOriginType: OpenClawSkillOriginType } | undefined {
  if (candidate === undefined) {
    return undefined;
  }

  const normalized = candidate.trim();
  return normalized.length > 0 ? { skillOriginType: normalized } : undefined;
}

function resolveSkillName(raw: OpenClawSkillStatusEntryRaw, fallback: string): string {
  return readFirstString(raw.name, raw.skillName, raw.skill, fallback) ?? fallback;
}

function resolveSkillDescription(
  raw: OpenClawSkillStatusEntryRaw
): string | undefined {
  return readFirstString(raw.description, raw.desc, raw.summary, raw.prompt);
}

function readFirstString(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const trimmed = value.trim();

      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
}
