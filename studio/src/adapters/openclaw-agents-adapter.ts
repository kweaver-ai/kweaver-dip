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
  OpenClawSkillsStatusParams
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
   */
  public constructor(private readonly gatewayPort: OpenClawGatewayPort) {}

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
    const result = await this.gatewayPort.invoke<unknown>(
      createSkillsStatusRequest(params)
    );

    return normalizeSkillStatusEntries(result);
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
 * Normalizes the loosely typed `skills.status` payload to a flat entry list.
 *
 * @param result The raw RPC payload.
 * @returns The normalized skill status entries.
 */
export function normalizeSkillStatusEntries(
  result: unknown
): OpenClawSkillStatusEntry[] {
  if (Array.isArray(result)) {
    return result
      .map((entry) => normalizeSkillStatusEntry(entry))
      .filter((entry): entry is OpenClawSkillStatusEntry => entry !== undefined);
  }

  if (typeof result !== "object" || result === null) {
    return [];
  }

  for (const collectionKey of ["skills", "entries", "items"]) {
    const collection = (result as Record<string, unknown>)[collectionKey];

    if (Array.isArray(collection)) {
      return collection
        .map((entry) => normalizeSkillStatusEntry(entry))
        .filter((entry): entry is OpenClawSkillStatusEntry => entry !== undefined);
    }
  }

  return Object.entries(result).flatMap(([skillKey, value]) => {
    const normalized = normalizeSkillStatusEntry(value, skillKey);

    return normalized === undefined ? [] : [normalized];
  });
}

/**
 * Normalizes one raw `skills.status` entry.
 *
 * @param candidate The raw status entry.
 * @param fallbackKey The fallback skill key derived from object keys.
 * @returns The normalized entry, or `undefined` when it cannot be parsed.
 */
export function normalizeSkillStatusEntry(
  candidate: unknown,
  fallbackKey?: string
): OpenClawSkillStatusEntry | undefined {
  if (typeof candidate === "boolean") {
    if (fallbackKey === undefined) {
      return undefined;
    }

    return {
      skillKey: fallbackKey,
      name: fallbackKey,
      enabled: candidate
    };
  }

  if (typeof candidate !== "object" || candidate === null) {
    return fallbackKey === undefined
      ? undefined
      : {
          skillKey: fallbackKey,
          name: fallbackKey,
          enabled: undefined
        };
  }

  const raw = candidate as Record<string, unknown>;
  const skillKey = readFirstString(raw.skillKey, raw.key, raw.id, fallbackKey);

  if (skillKey === undefined) {
    return undefined;
  }

  return {
    skillKey,
    name: readFirstString(raw.name, raw.skillName, raw.skill, skillKey),
    description: readFirstString(
      raw.description,
      raw.desc,
      raw.summary,
      raw.prompt
    ),
    enabled: readEnabledFlag(raw)
  };
}

/**
 * Reads the first non-empty string from a candidate list.
 *
 * @param values Raw candidate values.
 * @returns The first trimmed string, or `undefined`.
 */
function readFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

/**
 * Derives one normalized enabled flag from a raw skill status entry.
 *
 * @param candidate The raw skill status object.
 * @returns The normalized enabled flag, or `undefined`.
 */
function readEnabledFlag(candidate: Record<string, unknown>): boolean | undefined {
  for (const key of ["enabled", "isEnabled", "active"]) {
    const value = candidate[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  if (typeof candidate.disabled === "boolean") {
    return candidate.disabled !== true;
  }

  for (const key of ["status", "state"]) {
    const value = candidate[key];

    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim().toLowerCase();

    if (["enabled", "enable", "active", "on"].includes(normalized)) {
      return true;
    }

    if (["disabled", "disable", "inactive", "off"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}
