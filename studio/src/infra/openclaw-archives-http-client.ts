import { HttpError } from "../errors/http-error";
import type { OpenClawSessionArchivesResult } from "../types/sessions";

/**
 * Runtime configuration used to call OpenClaw `/v1/archives`.
 */
export interface OpenClawArchivesHttpClientOptions {
  /**
   * The configured OpenClaw gateway URL.
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
export type OpenClawArchivesFetch = typeof fetch;

/**
 * Minimal fetch response shape used by the OpenClaw archives client.
 */
export interface OpenClawArchivesHttpResult {
  /**
   * Upstream HTTP status code.
   */
  status: number;

  /**
   * Upstream response headers.
   */
  headers: Headers;

  /**
   * Upstream response body.
   */
  body: Uint8Array;
}

/**
 * Defines the capability needed to query session archives.
 */
export interface OpenClawArchivesHttpClient {
  /**
   * Lists archive entries for one digital human session.
   *
   * @param digitalHumanId The target digital human identifier.
   * @param sessionId The target session identifier.
   * @returns The archives list payload returned by OpenClaw plugin.
   */
  listSessionArchives(
    digitalHumanId: string,
    sessionId: string
  ): Promise<OpenClawSessionArchivesResult>;

  /**
   * Reads one archive subpath for a session.
   *
   * @param digitalHumanId The target digital human identifier.
   * @param sessionId The target session identifier.
   * @param subpath The target subpath under archives root.
   * @returns The upstream response status, headers and body bytes.
   */
  getSessionArchiveSubpath(
    digitalHumanId: string,
    sessionId: string,
    subpath: string
  ): Promise<OpenClawArchivesHttpResult>;
}

/**
 * HTTP client that proxies OpenClaw `dip` plugin `/v1/archives` endpoint.
 */
export class DefaultOpenClawArchivesHttpClient
implements OpenClawArchivesHttpClient {
  /**
   * Creates the OpenClaw archives client.
   *
   * @param options Static upstream configuration.
   * @param fetchImpl Optional fetch implementation for tests.
   */
  public constructor(
    private readonly options: OpenClawArchivesHttpClientOptions,
    private readonly fetchImpl: OpenClawArchivesFetch = fetch
  ) {}

  /**
   * Lists archive entries for one digital human session.
   *
   * @param digitalHumanId The target digital human identifier.
   * @param sessionId The target session identifier.
   * @returns The archives list payload returned by OpenClaw plugin.
   */
  public async listSessionArchives(
    digitalHumanId: string,
    sessionId: string
  ): Promise<OpenClawSessionArchivesResult> {
    const upstreamResponse = await this.fetchImpl(
      buildOpenClawSessionArchivesUrl(
        this.options.gatewayUrl,
        digitalHumanId,
        sessionId
      ),
      {
        method: "GET",
        headers: createOpenClawArchivesHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawArchivesError(error);
    });

    if (!upstreamResponse.ok) {
      throw await createOpenClawArchivesStatusError(upstreamResponse);
    }

    return (await upstreamResponse.json()) as OpenClawSessionArchivesResult;
  }

  /**
   * Reads one archive subpath for a session.
   *
   * @param digitalHumanId The target digital human identifier.
   * @param sessionId The target session identifier.
   * @param subpath The target subpath under archives root.
   * @returns The upstream response status, headers and body bytes.
   */
  public async getSessionArchiveSubpath(
    digitalHumanId: string,
    sessionId: string,
    subpath: string
  ): Promise<OpenClawArchivesHttpResult> {
    const upstreamResponse = await this.fetchImpl(
      buildOpenClawSessionArchiveSubpathUrl(
        this.options.gatewayUrl,
        digitalHumanId,
        sessionId,
        subpath
      ),
      {
        method: "GET",
        headers: createOpenClawArchivesHeaders(this.options.token)
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawArchivesError(error);
    });

    if (!upstreamResponse.ok) {
      throw await createOpenClawArchivesStatusError(upstreamResponse);
    }

    return {
      status: upstreamResponse.status,
      headers: upstreamResponse.headers,
      body: new Uint8Array(await upstreamResponse.arrayBuffer())
    };
  }
}

/**
 * Builds the OpenClaw `dip` `/v1/archives` endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway URL.
 * @param digitalHumanId The target digital human identifier.
 * @param sessionId The target session identifier.
 * @returns The derived HTTP endpoint for `/v1/archives`.
 */
export function buildOpenClawSessionArchivesUrl(
  gatewayUrl: string,
  digitalHumanId: string,
  sessionId: string
): string {
  const url = new URL(gatewayUrl);

  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/v1/archives";
  url.search = "";
  url.hash = "";

  url.searchParams.set("agent", digitalHumanId);
  url.searchParams.set("session", sessionId);

  return url.toString();
}

/**
 * Builds the OpenClaw dip `/v1/archives` URL for one subpath.
 *
 * @param gatewayUrl The configured OpenClaw gateway URL.
 * @param digitalHumanId The target digital human identifier.
 * @param sessionId The target session identifier.
 * @param subpath The target subpath under archives root.
 * @returns The derived HTTP endpoint for `/v1/archives/{session_and_subpath}`.
 */
export function buildOpenClawSessionArchiveSubpathUrl(
  gatewayUrl: string,
  digitalHumanId: string,
  sessionId: string,
  subpath: string
): string {
  const url = new URL(gatewayUrl);

  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  const normalizedSessionId = sessionId.trim();
  const normalizedSubpath = subpath.trim();
  const effectiveSubpath =
    normalizedSubpath === normalizedSessionId ||
    normalizedSubpath.startsWith(`${normalizedSessionId}/`) ||
    normalizedSubpath.startsWith(`${normalizedSessionId}_`)
      ? normalizedSubpath
      : `${normalizedSessionId}/${normalizedSubpath}`;

  url.pathname = `/v1/archives/${encodePathSubpath(effectiveSubpath)}`;
  url.search = "";
  url.hash = "";

  url.searchParams.set("agent", digitalHumanId);

  return url.toString();
}

/**
 * Encodes one URL path segment.
 *
 * @param segment Raw segment value.
 * @returns URL-safe encoded segment.
 */
export function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

/**
 * Encodes a slash-delimited subpath to URL-safe path segments.
 *
 * @param subpath Raw subpath value.
 * @returns URL-safe encoded subpath.
 */
export function encodePathSubpath(subpath: string): string {
  return subpath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

/**
 * Creates the headers used to call OpenClaw `/v1/archives`.
 *
 * @param token The optional gateway bearer token.
 * @returns The normalized request headers.
 */
export function createOpenClawArchivesHeaders(token?: string): Headers {
  const headers = new Headers({
    accept: "application/json"
  });

  if (token !== undefined) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

/**
 * Converts upstream HTTP failures to a normalized HttpError.
 *
 * @param response The failed upstream HTTP response.
 * @returns The normalized failure.
 */
export async function createOpenClawArchivesStatusError(
  response: Response
): Promise<HttpError> {
  const responseText = await response.text();
  const trimmedResponseText = responseText.trim();
  const message =
    trimmedResponseText === ""
      ? `OpenClaw /v1/archives returned HTTP ${response.status}`
      : `OpenClaw /v1/archives returned HTTP ${response.status}: ${trimmedResponseText}`;

  return new HttpError(502, message);
}

/**
 * Normalizes unknown transport failures thrown by fetch.
 *
 * @param error The thrown transport failure.
 * @returns The normalized HttpError instance.
 */
export function normalizeOpenClawArchivesError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/archives: ${message}`
  );
}
