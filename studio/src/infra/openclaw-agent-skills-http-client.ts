import { HttpError } from "../errors/http-error";
import type {
  AgentSkillsBinding,
  AgentSkillsCatalog,
  InstallSkillResult,
  SkillContentResult,
  SkillTreeResult,
  UninstallSkillResult,
  UpdateAgentSkillsResult
} from "../types/agent-skills";

/**
 * Runtime configuration used to call OpenClaw `dip` plugin skills endpoints.
 */
export interface OpenClawAgentSkillsHttpClientOptions {
  /**
   * The configured OpenClaw gateway HTTP URL.
   */
  gatewayUrl: string;

  /**
   * Optional bearer token used for upstream authentication.
   */
  token?: string;

  /**
   * Reserved for compatibility with shared OpenClaw runtime config.
   */
  timeoutMs: number;
}

/**
 * Fetch implementation used for dependency injection in tests.
 */
export type OpenClawAgentSkillsFetch = typeof fetch;

export interface OpenClawAgentSkillsHttpResult {
  status: number;
  headers: Headers;
  body: Uint8Array;
}

/**
 * Defines the capability needed to query and update agent skills.
 */
export interface OpenClawAgentSkillsHttpClient {
  /**
   * Lists all discoverable skills exposed by the plugin.
   */
  listAvailableSkills(): Promise<AgentSkillsCatalog>;

  /**
   * Reads one agent's effective skill binding set.
   *
   * @param agentId Stable OpenClaw agent id.
   */
  getAgentSkills(agentId: string): Promise<AgentSkillsBinding>;

  /**
   * Replaces one agent's skill binding set.
   *
   * @param agentId Stable OpenClaw agent id.
   * @param skills Replacement skill ids.
   */
  updateAgentSkills(
    agentId: string,
    skills: string[]
  ): Promise<UpdateAgentSkillsResult>;

  /**
   * Installs a `.skill` zip by POSTing raw bytes to the DIP Gateway install route.
   *
   * @param zipBody Raw zip bytes (same format as a `.skill` file).
   * @param options When `overwrite` is true, replaces an existing skill directory.
   */
  installSkill(
    zipBody: Buffer | Uint8Array,
    options?: { overwrite?: boolean; name?: string }
  ): Promise<InstallSkillResult>;

  /**
   * Uninstalls a skill directory under the gateway repository `skills/` tree.
   *
   * @param name Skill id to remove.
   */
  uninstallSkill(name: string): Promise<UninstallSkillResult>;

  /**
   * Lists files and directories under one skill.
   *
   * @param name Skill id to inspect.
   */
  getSkillTree(
    name: string,
    resolvedSkillPath?: string
  ): Promise<SkillTreeResult>;

  /**
   * Reads one text file preview under a skill directory.
   *
   * @param name Skill id to inspect.
   * @param filePath Skill-root-relative file path.
   */
  getSkillContent(
    name: string,
    filePath: string,
    resolvedSkillPath?: string
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
    resolvedSkillPath?: string
  ): Promise<OpenClawAgentSkillsHttpResult>;
}

/**
 * HTTP client that proxies the `dip` plugin skills endpoints.
 */
export class DefaultOpenClawAgentSkillsHttpClient
implements OpenClawAgentSkillsHttpClient {
  /**
   * Creates the agent skills client.
   *
   * @param options Static upstream configuration.
   * @param fetchImpl Optional fetch implementation for tests.
   */
  public constructor(
    private readonly options: OpenClawAgentSkillsHttpClientOptions,
    private readonly fetchImpl: OpenClawAgentSkillsFetch = fetch
  ) {}

  /**
   * Lists all available skills.
   *
   * @returns The plugin payload.
   */
  public async listAvailableSkills(): Promise<AgentSkillsCatalog> {
    const response = await this.fetchImpl(
      buildOpenClawAgentSkillsUrl(this.options.gatewayUrl),
      {
        method: "GET",
        headers: createOpenClawAgentSkillsHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawAgentSkillsError(error);
    });

    if (!response.ok) {
      throw await createOpenClawAgentSkillsStatusError(response);
    }

    return (await response.json()) as AgentSkillsCatalog;
  }

  /**
   * Reads one agent's configured skill ids.
   *
   * @param agentId Stable OpenClaw agent id.
   * @returns The plugin payload.
   */
  public async getAgentSkills(agentId: string): Promise<AgentSkillsBinding> {
    const response = await this.fetchImpl(
      buildOpenClawAgentSkillsUrl(this.options.gatewayUrl, agentId),
      {
        method: "GET",
        headers: createOpenClawAgentSkillsHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawAgentSkillsError(error);
    });

    if (!response.ok) {
      throw await createOpenClawAgentSkillsStatusError(response);
    }

    return (await response.json()) as AgentSkillsBinding;
  }

  /**
   * Replaces one agent's configured skill ids.
   *
   * @param agentId Stable OpenClaw agent id.
   * @param skills Replacement skill ids.
   * @returns The plugin payload.
   */
  public async updateAgentSkills(
    agentId: string,
    skills: string[]
  ): Promise<UpdateAgentSkillsResult> {
    const response = await this.fetchImpl(
      buildOpenClawAgentSkillsUrl(this.options.gatewayUrl),
      {
        method: "POST",
        headers: createOpenClawAgentSkillsHeaders(this.options.token, true),
        body: JSON.stringify({ agentId, skills })
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawAgentSkillsError(error);
    });

    if (!response.ok) {
      throw await createOpenClawAgentSkillsStatusError(response);
    }

    return (await response.json()) as UpdateAgentSkillsResult;
  }

  /**
   * Installs a `.skill` archive through the Gateway plugin HTTP route.
   *
   * @param zipBody Raw zip bytes.
   * @param options Optional overwrite flag forwarded as `?overwrite=true`.
   * @returns Parsed install payload from the plugin.
   */
  public async installSkill(
    zipBody: Buffer | Uint8Array,
    options?: { overwrite?: boolean; name?: string }
  ): Promise<InstallSkillResult> {
    const response = await this.fetchImpl(
      buildOpenClawSkillInstallUrl(this.options.gatewayUrl, options),
      {
        method: "POST",
        headers: createOpenClawSkillInstallHeaders(this.options.token),
        body: createOpenClawSkillInstallFormData(zipBody, options?.name)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawSkillInstallError(error);
    });

    if (!response.ok) {
      throw await createOpenClawSkillInstallStatusError(response);
    }

    return (await response.json()) as InstallSkillResult;
  }

  /**
   * Removes an installed skill via the Gateway plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @returns Parsed uninstall payload from the plugin.
   */
  public async uninstallSkill(name: string): Promise<UninstallSkillResult> {
    const response = await this.fetchImpl(
      buildOpenClawSkillUninstallUrl(this.options.gatewayUrl, name),
      {
        method: "DELETE",
        headers: createOpenClawAgentSkillsHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawSkillUninstallError(error);
    });

    if (!response.ok) {
      throw await createOpenClawSkillUninstallStatusError(response);
    }

    return (await response.json()) as UninstallSkillResult;
  }

  /**
   * Reads the directory tree of one installed or bundled skill.
   *
   * @param name Skill id (slug).
   * @returns Parsed tree payload from the plugin.
   */
  public async getSkillTree(
    name: string,
    resolvedSkillPath?: string
  ): Promise<SkillTreeResult> {
    const response = await this.fetchImpl(
      buildOpenClawSkillTreeUrl(this.options.gatewayUrl, name, resolvedSkillPath),
      {
        method: "GET",
        headers: createOpenClawAgentSkillsHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawSkillTreeError(error);
    });

    if (!response.ok) {
      throw await createOpenClawSkillTreeStatusError(response);
    }

    return (await response.json()) as SkillTreeResult;
  }

  /**
   * Reads one skill file preview through the Gateway plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @param filePath Skill-root-relative file path.
   * @returns Parsed content payload from the plugin.
   */
  public async getSkillContent(
    name: string,
    filePath: string,
    resolvedSkillPath?: string
  ): Promise<SkillContentResult> {
    const response = await this.fetchImpl(
      buildOpenClawSkillContentUrl(this.options.gatewayUrl, name, filePath, resolvedSkillPath),
      {
        method: "GET",
        headers: createOpenClawAgentSkillsHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawSkillContentError(error);
    });

    if (!response.ok) {
      throw await createOpenClawSkillContentStatusError(response);
    }

    return (await response.json()) as SkillContentResult;
  }

  /**
   * Downloads one skill file through the Gateway plugin HTTP route.
   *
   * @param name Skill id (slug).
   * @param filePath Skill-root-relative file path.
   * @returns Upstream status, headers and body bytes.
   */
  public async downloadSkillFile(
    name: string,
    filePath: string,
    resolvedSkillPath?: string
  ): Promise<OpenClawAgentSkillsHttpResult> {
    const response = await this.fetchImpl(
      buildOpenClawSkillDownloadUrl(this.options.gatewayUrl, name, filePath, resolvedSkillPath),
      {
        method: "GET",
        headers: createOpenClawAgentSkillsHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawSkillDownloadError(error);
    });

    if (!response.ok) {
      throw await createOpenClawSkillDownloadStatusError(response);
    }

    return {
      status: response.status,
      headers: response.headers,
      body: new Uint8Array(await response.arrayBuffer())
    };
  }
}

/**
 * Builds the OpenClaw `dip` plugin skills endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param agentId Optional target agent id.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawAgentSkillsUrl(
  gatewayUrl: string,
  agentId?: string
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  url.pathname = "/v1/config/agents/skills";
  url.search = "";
  url.hash = "";

  if (agentId !== undefined) {
    url.searchParams.set("agentId", agentId);
  }

  return url.toString();
}

/**
 * Builds the OpenClaw `dip` plugin skill install endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param options Optional query flags for the install route.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawSkillInstallUrl(
  gatewayUrl: string,
  options?: { overwrite?: boolean; name?: string }
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  url.pathname = "/v1/config/agents/skills/install";
  url.hash = "";
  url.search = "";
  if (options?.overwrite === true) {
    url.searchParams.set("overwrite", "true");
  }
  if (options?.name !== undefined && options.name.trim().length > 0) {
    url.searchParams.set("name", options.name.trim());
  }

  return url.toString();
}

/**
 * Builds the OpenClaw `dip` plugin skill uninstall endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param name Skill id to remove.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawSkillUninstallUrl(
  gatewayUrl: string,
  name: string
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  const trimmed = name.trim();
  url.pathname = `/v1/config/agents/skills/${encodeURIComponent(trimmed)}`;
  url.hash = "";
  url.search = "";

  return url.toString();
}

/**
 * Builds the OpenClaw `dip` plugin skill tree endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param name Skill id to inspect.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawSkillTreeUrl(
  gatewayUrl: string,
  name: string,
  resolvedSkillPath?: string
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  const trimmed = name.trim();
  url.pathname = `/v1/config/agents/skills/${encodeURIComponent(trimmed)}/tree`;
  url.hash = "";
  url.search = "";
  if (resolvedSkillPath !== undefined && resolvedSkillPath.trim().length > 0) {
    url.searchParams.set("resolvedSkillPath", resolvedSkillPath.trim());
  }

  return url.toString();
}

/**
 * Builds the OpenClaw `dip` plugin skill content endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param name Skill id to inspect.
 * @param filePath Skill-root-relative file path.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawSkillContentUrl(
  gatewayUrl: string,
  name: string,
  filePath: string,
  resolvedSkillPath?: string
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  const trimmed = name.trim();
  url.pathname = `/v1/config/agents/skills/${encodeURIComponent(trimmed)}/content`;
  url.hash = "";
  url.search = "";
  url.searchParams.set("path", filePath);
  if (resolvedSkillPath !== undefined && resolvedSkillPath.trim().length > 0) {
    url.searchParams.set("resolvedSkillPath", resolvedSkillPath.trim());
  }

  return url.toString();
}

/**
 * Builds the OpenClaw `dip` plugin skill download endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param name Skill id to inspect.
 * @param filePath Skill-root-relative file path.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawSkillDownloadUrl(
  gatewayUrl: string,
  name: string,
  filePath: string,
  resolvedSkillPath?: string
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  const trimmed = name.trim();
  url.pathname = `/v1/config/agents/skills/${encodeURIComponent(trimmed)}/download`;
  url.hash = "";
  url.search = "";
  url.searchParams.set("path", filePath);
  if (resolvedSkillPath !== undefined && resolvedSkillPath.trim().length > 0) {
    url.searchParams.set("resolvedSkillPath", resolvedSkillPath.trim());
  }

  return url.toString();
}

/**
 * Builds request headers for the `dip` plugin skills API.
 *
 * @param token Optional bearer token.
 * @param includeJsonContentType Whether to include JSON content type header.
 * @returns The request headers.
 */
export function createOpenClawAgentSkillsHeaders(
  token?: string,
  includeJsonContentType = false
): Headers {
  const headers = new Headers({
    accept: "application/json"
  });

  if (includeJsonContentType) {
    headers.set("content-type", "application/json");
  }

  if (token !== undefined && token.trim().length > 0) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

/**
 * Builds request headers for posting a `.skill` zip to the install route.
 *
 * @param token Optional bearer token.
 * @returns Headers for a multipart request body.
 */
export function createOpenClawSkillInstallHeaders(token?: string): Headers {
  const headers = new Headers({
    accept: "application/json"
  });

  if (token !== undefined && token.trim().length > 0) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

/**
 * Creates the multipart request body expected by the skill install route.
 *
 * @param zipBody Raw `.skill` zip bytes.
 * @param name Optional skill slug used to derive a stable filename.
 * @returns Multipart form data containing the `file` field.
 */
export function createOpenClawSkillInstallFormData(
  zipBody: Buffer | Uint8Array,
  name?: string
): FormData {
  const form = new FormData();
  const fileName =
    typeof name === "string" && name.trim().length > 0
      ? `${name.trim()}.skill`
      : "skill.skill";

  form.append(
    "file",
    new Blob([new Uint8Array(zipBody)], { type: "application/zip" }),
    fileName
  );

  return form;
}

/**
 * Converts an upstream non-2xx response into an application error.
 *
 * @param response Upstream fetch response.
 * @returns A typed HTTP error.
 */
export async function createOpenClawAgentSkillsStatusError(
  response: Response
): Promise<HttpError> {
  const text = (await response.text()).trim();
  const detail = text.length > 0 ? `: ${text}` : "";

  return new HttpError(
    502,
    `OpenClaw /v1/config/agents/skills returned HTTP ${response.status}${detail}`
  );
}

/**
 * Normalizes transport errors produced while calling the plugin.
 *
 * @param error Unknown thrown value.
 * @returns A typed HTTP error.
 */
export function normalizeOpenClawAgentSkillsError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/config/agents/skills: ${description}`
  );
}

/**
 * Converts an upstream non-2xx install response into an application error.
 *
 * @param response Upstream fetch response.
 * @returns A typed HTTP error.
 */
export async function createOpenClawSkillInstallStatusError(
  response: Response
): Promise<HttpError> {
  const text = (await response.text()).trim();
  const detail = text.length > 0 ? `: ${text}` : "";

  return new HttpError(
    502,
    `OpenClaw /v1/config/agents/skills/install returned HTTP ${response.status}${detail}`
  );
}

/**
 * Normalizes transport errors produced while calling the install route.
 *
 * @param error Unknown thrown value.
 * @returns A typed HTTP error.
 */
export function normalizeOpenClawSkillInstallError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/config/agents/skills/install: ${description}`
  );
}

/**
 * Converts an upstream non-2xx uninstall response into an application error.
 *
 * @param response Upstream fetch response.
 * @returns A typed HTTP error.
 */
export async function createOpenClawSkillUninstallStatusError(
  response: Response
): Promise<HttpError> {
  const text = (await response.text()).trim();
  const detail = text.length > 0 ? `: ${text}` : "";

  return new HttpError(
    502,
    `OpenClaw /v1/config/agents/skills/{name} returned HTTP ${response.status}${detail}`
  );
}

/**
 * Normalizes transport errors produced while calling the uninstall route.
 *
 * @param error Unknown thrown value.
 * @returns A typed application error.
 */
export function normalizeOpenClawSkillUninstallError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/config/agents/skills/{name}: ${description}`
  );
}

/**
 * Converts an upstream non-2xx tree response into an application error.
 *
 * @param response Upstream fetch response.
 * @returns A typed HTTP error.
 */
export async function createOpenClawSkillTreeStatusError(
  response: Response
): Promise<HttpError> {
  const text = (await response.text()).trim();
  const detail = text.length > 0 ? `: ${text}` : "";

  return new HttpError(
    502,
    `OpenClaw /v1/config/agents/skills/{name}/tree returned HTTP ${response.status}${detail}`
  );
}

/**
 * Normalizes transport errors produced while calling the skill tree route.
 *
 * @param error Unknown thrown value.
 * @returns A typed application error.
 */
export function normalizeOpenClawSkillTreeError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/config/agents/skills/{name}/tree: ${description}`
  );
}

/**
 * Converts an upstream non-2xx content response into an application error.
 *
 * @param response Upstream fetch response.
 * @returns A typed HTTP error.
 */
export async function createOpenClawSkillContentStatusError(
  response: Response
): Promise<HttpError> {
  const text = (await response.text()).trim();
  const detail = text.length > 0 ? `: ${text}` : "";

  return new HttpError(
    502,
    `OpenClaw /v1/config/agents/skills/{name}/content returned HTTP ${response.status}${detail}`
  );
}

/**
 * Normalizes transport errors produced while calling the skill content route.
 *
 * @param error Unknown thrown value.
 * @returns A typed application error.
 */
export function normalizeOpenClawSkillContentError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/config/agents/skills/{name}/content: ${description}`
  );
}

/**
 * Converts an upstream non-2xx download response into an application error.
 *
 * @param response Upstream fetch response.
 * @returns A typed HTTP error.
 */
export async function createOpenClawSkillDownloadStatusError(
  response: Response
): Promise<HttpError> {
  const text = (await response.text()).trim();
  const detail = text.length > 0 ? `: ${text}` : "";

  return new HttpError(
    502,
    `OpenClaw /v1/config/agents/skills/{name}/download returned HTTP ${response.status}${detail}`
  );
}

/**
 * Normalizes transport errors produced while calling the skill download route.
 *
 * @param error Unknown thrown value.
 * @returns A typed application error.
 */
export function normalizeOpenClawSkillDownloadError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/config/agents/skills/{name}/download: ${description}`
  );
}
