import { HttpError } from "../errors/http-error";
import type {
  HydraIntrospectTokenRequest,
  HydraIntrospectTokenResponse
} from "../types/hydra";

/**
 * Runtime configuration used to call Hydra token introspection.
 */
export interface HydraHttpClientOptions {
  /**
   * Hydra admin base URL.
   */
  adminUrl: string;

  /**
   * Reserved for compatibility with shared HTTP client configuration.
   */
  timeoutMs: number;
}

/**
 * Fetch implementation used for dependency injection in tests.
 */
export type HydraFetch = typeof fetch;

/**
 * Defines the capability needed to introspect OAuth access tokens.
 */
export interface HydraHttpClient {
  /**
   * Introspects one OAuth access token through Hydra.
   *
   * @param token The bearer token extracted from the incoming request.
   * @param signal Optional abort signal tied to the downstream request.
   * @returns The normalized Hydra token introspection payload.
   */
  introspectAccessToken(
    token: string,
    signal?: AbortSignal
  ): Promise<HydraIntrospectTokenResponse>;
}

/**
 * HTTP client that calls Hydra `/admin/oauth2/introspect`.
 */
export class DefaultHydraHttpClient implements HydraHttpClient {
  /**
   * Creates the Hydra client.
   *
   * @param options Static Hydra configuration.
   * @param fetchImpl Optional fetch implementation for tests.
   */
  public constructor(
    private readonly options: HydraHttpClientOptions,
    private readonly fetchImpl: HydraFetch = fetch
  ) {}

  /**
   * Introspects one access token through Hydra.
   *
   * @param token The bearer token extracted from the incoming request.
   * @param signal Optional abort signal tied to the downstream request.
   * @returns The parsed Hydra token introspection payload.
   */
  public async introspectAccessToken(
    token: string,
    signal?: AbortSignal
  ): Promise<HydraIntrospectTokenResponse> {
    const response = await this.fetchImpl(
      buildHydraIntrospectUrl(this.options.adminUrl),
      {
        method: "POST",
        headers: createHydraIntrospectHeaders(),
        body: createHydraIntrospectRequestBody({
          token
        }),
        signal
      }
    ).catch((error: unknown) => {
      throw normalizeHydraHttpError(error);
    });

    if (!response.ok) {
      throw await createHydraStatusError(response);
    }

    return await response.json() as HydraIntrospectTokenResponse;
  }
}

/**
 * Builds the Hydra introspection endpoint URL from the configured admin base URL.
 *
 * @param adminUrl The configured Hydra admin base URL.
 * @returns The derived `/admin/oauth2/introspect` endpoint.
 */
export function buildHydraIntrospectUrl(adminUrl: string): string {
  const url = new URL(adminUrl);

  url.pathname = "/admin/oauth2/introspect";
  url.search = "";
  url.hash = "";

  return url.toString();
}

/**
 * Creates the headers used to call Hydra token introspection.
 *
 * @returns The normalized request headers.
 */
export function createHydraIntrospectHeaders(): Headers {
  return new Headers({
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json"
  });
}

/**
 * Creates the form body used to call Hydra token introspection.
 *
 * @param request The normalized token introspection request.
 * @returns The encoded form body.
 */
export function createHydraIntrospectRequestBody(
  request: HydraIntrospectTokenRequest
): URLSearchParams {
  const body = new URLSearchParams();

  body.set("token", request.token);

  return body;
}

/**
 * Converts unsuccessful Hydra responses into a normalized HttpError.
 *
 * @param response The failed Hydra HTTP response.
 * @returns The normalized failure.
 */
export async function createHydraStatusError(
  response: Response
): Promise<HttpError> {
  const responseText = (await response.text()).trim();
  const message =
    responseText.length === 0
      ? `Hydra /admin/oauth2/introspect returned HTTP ${response.status}`
      : `Hydra /admin/oauth2/introspect returned HTTP ${response.status}: ${responseText}`;

  return new HttpError(502, message);
}

/**
 * Normalizes unknown transport failures thrown by fetch.
 *
 * @param error The thrown transport failure.
 * @returns The normalized HttpError instance.
 */
export function normalizeHydraHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  return new HttpError(
    502,
    `Failed to communicate with Hydra /admin/oauth2/introspect: ${message}`
  );
}
