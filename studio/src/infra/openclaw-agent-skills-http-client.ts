import { HttpError } from "../errors/http-error";
import type {
  AgentSkillsBinding,
  AgentSkillsCatalog,
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
        method: "PUT",
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
