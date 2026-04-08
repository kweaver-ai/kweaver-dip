import { HttpError } from "../errors/http-error";
import type { BknQuery } from "../types/bkn";

/**
 * Default upstream `x-business-domain` when the inbound request omits the header.
 */
export const DEFAULT_BKN_BUSINESS_DOMAIN = "bd_public";

/**
 * Static configuration for the BKN backend proxy client.
 */
export interface BknHttpClientOptions {
  /**
   * Base URL of the upstream BKN backend.
   */
  baseUrl: string;

  /**
   * Optional bearer token used for outbound authorization.
   */
  token?: string;

  /**
   * Request timeout in milliseconds.
   */
  timeoutMs: number;
}

/**
 * Fetch implementation used for dependency injection in tests.
 */
export type BknFetch = typeof fetch;

/**
 * Lightweight upstream response container used by route handlers.
 */
export interface BknProxyResponse {
  /**
   * Upstream HTTP status code.
   */
  status: number;

  /**
   * Upstream response headers.
   */
  headers: Headers;

  /**
   * Raw upstream response body.
   */
  body: string;
}

/**
 * Defines the BKN operations exposed by the proxy client.
 */
export interface BknHttpClient {
  /**
   * Forwards the list request.
   *
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value (already resolved, including default).
   */
  listKnowledgeNetworks(query: BknQuery, businessDomain?: string): Promise<BknProxyResponse>;

  /**
   * Forwards the detail request.
   *
   * @param knId Knowledge network id.
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value (already resolved, including default).
   */
  getKnowledgeNetwork(
    knId: string,
    query: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse>;
}

/**
 * Default HTTP client used to forward requests to the BKN backend.
 */
export class DefaultBknHttpClient implements BknHttpClient {
  /**
   * Creates the BKN client.
   *
   * @param options Static upstream configuration.
   * @param fetchImpl Optional fetch implementation for tests.
   */
  public constructor(
    private readonly options: BknHttpClientOptions,
    private readonly fetchImpl: BknFetch = fetch
  ) {}

  /**
   * Forwards the list request.
   *
   * @param query Incoming query string values.
   * @returns The normalized upstream response.
   */
  public async listKnowledgeNetworks(
    query: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse> {
    return this.forwardRequest(
      "/api/bkn-backend/v1/knowledge-networks",
      "GET",
      query,
      businessDomain
    );
  }

  /**
   * Forwards the detail request.
   *
   * @param knId Knowledge network id.
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value.
   * @returns The normalized upstream response.
   */
  public async getKnowledgeNetwork(
    knId: string,
    query: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse> {
    return this.forwardRequest(
      `/api/bkn-backend/v1/knowledge-networks/${encodeURIComponent(knId)}`,
      "GET",
      query,
      businessDomain
    );
  }

  /**
   * Executes one outbound request against the configured BKN backend.
   *
   * @param path Upstream path.
   * @param method HTTP method.
   * @param query Optional query string values.
   * @param businessDomain Optional upstream `x-business-domain` (defaults when empty).
   * @returns The normalized upstream response.
   */
  private async forwardRequest(
    path: string,
    method: "GET",
    query?: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs
    ).unref();

    const url = buildBknUrl(this.options.baseUrl, path, query);
    const headers = createBknHeaders(this.options.token, businessDomain);

    const restoreTlsVerification = isHttpsUrlString(url)
      ? applyInsecureTlsSetting()
      : () => undefined;

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        signal: controller.signal
      }).catch((error: unknown) => {
        throw normalizeBknError(error);
      });

      const body = await response.text();

      return {
        status: response.status,
        headers: new Headers(response.headers),
        body
      };
    } finally {
      restoreTlsVerification();
      clearTimeout(timeout);
    }
  }
}

/**
 * Returns whether a URL string uses the HTTPS scheme.
 *
 * @param urlString Absolute URL string.
 * @returns True when the protocol is `https:`.
 */
export function isHttpsUrlString(urlString: string): boolean {
  return new URL(urlString).protocol === "https:";
}

/**
 * Temporarily disables TLS certificate verification for the current process.
 *
 * Node's `fetch` does not expose per-request TLS options; BKN upstream HTTPS calls use this for
 * self-signed backends. The prior value is restored immediately after the response body is read.
 *
 * @returns A callback that restores previous TLS verification behavior.
 */
export function applyInsecureTlsSetting(): () => void {
  const previous = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  return () => {
    if (previous === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      return;
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = previous;
  };
}

/**
 * Builds a BKN backend URL from the base URL and request components.
 *
 * @param baseUrl Configured BKN backend base URL.
 * @param path Upstream request path.
 * @param query Optional query string values.
 * @returns The normalized request URL.
 */
export function buildBknUrl(baseUrl: string, path: string, query?: BknQuery): string {
  const url = new URL(baseUrl);

  url.pathname = path;
  url.search = "";
  url.hash = "";

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value.trim().length > 0) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

/**
 * Resolves the upstream `x-business-domain` from an inbound header value.
 *
 * @param headerValue Raw `x-business-domain` from the client request.
 * @returns Trimmed non-empty value, or {@link DEFAULT_BKN_BUSINESS_DOMAIN}.
 */
export function resolveBknBusinessDomain(
  headerValue: string | string[] | undefined
): string {
  if (Array.isArray(headerValue)) {
    const first = headerValue[0];
    const trimmed = typeof first === "string" ? first.trim() : "";
    return trimmed.length > 0 ? trimmed : DEFAULT_BKN_BUSINESS_DOMAIN;
  }

  if (typeof headerValue === "string") {
    const trimmed = headerValue.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_BKN_BUSINESS_DOMAIN;
  }

  return DEFAULT_BKN_BUSINESS_DOMAIN;
}

/**
 * Creates headers used for BKN upstream requests.
 *
 * @param token Optional outbound bearer token.
 * @param businessDomain Upstream `x-business-domain`; empty or omitted uses {@link DEFAULT_BKN_BUSINESS_DOMAIN}.
 * @returns The request headers.
 */
export function createBknHeaders(
  token?: string,
  businessDomain?: string
): Headers {
  const domain =
    businessDomain !== undefined && businessDomain.trim().length > 0
      ? businessDomain.trim()
      : DEFAULT_BKN_BUSINESS_DOMAIN;

  const headers = new Headers({
    accept: "application/json",
    "x-business-domain": domain
  });

  if (token !== undefined && token.trim().length > 0) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

/**
 * Normalizes transport failures from outbound BKN requests.
 *
 * @param error Unknown thrown value.
 * @returns The typed HTTP error.
 */
export function normalizeBknError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new HttpError(504, "BKN backend request timed out");
  }

  if (isSelfSignedCertificateError(error)) {
    return new HttpError(
      502,
      "Failed to communicate with BKN backend: self-signed certificate; if the root CA is installed locally, try running Node.js with --use-system-ca"
    );
  }

  const description =
    error instanceof Error ? error.message : "Unknown upstream error";

  return new HttpError(502, `Failed to communicate with BKN backend: ${description}`);
}

/**
 * Detects Node.js TLS certificate validation failures caused by self-signed chains.
 *
 * @param error Unknown thrown value.
 * @returns Whether the error represents a self-signed certificate failure.
 */
export function isSelfSignedCertificateError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const code =
    typeof Reflect.get(error, "code") === "string"
      ? String(Reflect.get(error, "code")).toUpperCase()
      : "";

  return (
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    message.includes("self-signed certificate")
  );
}
