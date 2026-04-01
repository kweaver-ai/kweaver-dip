import { HttpError } from "../errors/http-error";

/**
 * Runtime configuration used to call OpenClaw `/v1/workspace/tmp/upload`.
 */
export interface OpenClawWorkspaceTempHttpClientOptions {
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
export type OpenClawWorkspaceTempFetch = typeof fetch;

/**
 * Upload request sent to OpenClaw workspace temp route.
 */
export interface OpenClawWorkspaceTempUploadRequest {
  /**
   * Target OpenClaw agent id.
   */
  agentId: string;

  /**
   * Session key used to derive session temp subdirectory.
   */
  sessionKey: string;

  /**
   * Original filename.
   */
  filename: string;

  /**
   * Raw file bytes.
   */
  body: Uint8Array;
}

/**
 * Upload response returned by OpenClaw workspace temp route.
 */
export interface OpenClawWorkspaceTempUploadResult {
  /**
   * Stored file name in workspace tmp.
   */
  name: string;

  /**
   * Workspace-relative file path, such as `tmp/chat-1/x.txt`.
   */
  path: string;

  /**
   * Absolute path on gateway host.
   */
  absolutePath: string;

  /**
   * Uploaded byte size.
   */
  bytes: number;

}

/**
 * Defines the capability needed to upload temp files into one OpenClaw workspace.
 */
export interface OpenClawWorkspaceTempHttpClient {
  /**
   * Uploads one file to the workspace temp area.
   *
   * @param request Upload payload.
   * @returns The route response payload.
   */
  uploadTempFile(
    request: OpenClawWorkspaceTempUploadRequest
  ): Promise<OpenClawWorkspaceTempUploadResult>;
}

/**
 * HTTP client that proxies OpenClaw `dip` plugin `/v1/workspace/tmp/upload` endpoint.
 */
export class DefaultOpenClawWorkspaceTempHttpClient
implements OpenClawWorkspaceTempHttpClient {
  /**
   * Creates the workspace temp client.
   *
   * @param options Static upstream configuration.
   * @param fetchImpl Optional fetch implementation for tests.
   */
  public constructor(
    private readonly options: OpenClawWorkspaceTempHttpClientOptions,
    private readonly fetchImpl: OpenClawWorkspaceTempFetch = fetch
  ) {}

  /**
   * Uploads one file to OpenClaw workspace temp area.
   *
   * @param request Upload payload.
   * @returns Parsed upload response.
   */
  public async uploadTempFile(
    request: OpenClawWorkspaceTempUploadRequest
  ): Promise<OpenClawWorkspaceTempUploadResult> {
    const body = createOpenClawWorkspaceTempUploadFormData(
      request.body,
      request.filename
    );
    const response = await this.fetchImpl(
      buildOpenClawWorkspaceTempUploadUrl(
        this.options.gatewayUrl,
        request.agentId,
        request.sessionKey
      ),
      {
        method: "POST",
        headers: createOpenClawWorkspaceTempUploadHeaders(
          this.options.token
        ),
        body
      }
    ).catch((error: unknown) => {
      throw normalizeOpenClawWorkspaceTempUploadError(error);
    });

    if (!response.ok) {
      throw await createOpenClawWorkspaceTempUploadStatusError(response);
    }

    return (await response.json()) as OpenClawWorkspaceTempUploadResult;
  }
}

/**
 * Builds the OpenClaw `dip` plugin workspace temp upload endpoint URL.
 *
 * @param gatewayUrl The configured OpenClaw gateway HTTP URL.
 * @param agentId Target agent id.
 * @param sessionKey Target session key.
 * @returns The derived HTTP endpoint URL.
 */
export function buildOpenClawWorkspaceTempUploadUrl(
  gatewayUrl: string,
  agentId: string,
  sessionKey: string
): string {
  const url = new URL(gatewayUrl);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  url.pathname = "/v1/workspace/tmp/upload";
  url.hash = "";
  url.search = "";
  url.searchParams.set("agent", agentId);
  url.searchParams.set("session", sessionKey);

  return url.toString();
}

/**
 * Creates request headers for OpenClaw workspace temp upload.
 *
 * @param token Optional gateway bearer token.
 * @returns The normalized request headers.
 */
export function createOpenClawWorkspaceTempUploadHeaders(
  token?: string
): Headers {
  const headers = new Headers({
    accept: "application/json"
  });

  if (token !== undefined) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

/**
 * Creates multipart form-data body for workspace temp upload.
 *
 * @param body Raw bytes.
 * @param filename Original filename.
 * @returns FormData containing `file`.
 */
export function createOpenClawWorkspaceTempUploadFormData(
  body: Uint8Array,
  filename: string
): FormData {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(body).slice()], { type: "application/octet-stream" }),
    filename
  );

  return formData;
}

/**
 * Converts upstream HTTP failures to a normalized HttpError.
 *
 * @param response The failed upstream HTTP response.
 * @returns The normalized failure.
 */
export async function createOpenClawWorkspaceTempUploadStatusError(
  response: Response
): Promise<HttpError> {
  const responseText = await response.text();
  const trimmed = responseText.trim();
  const message =
    trimmed.length === 0
      ? `OpenClaw /v1/workspace/tmp/upload returned HTTP ${response.status}`
      : `OpenClaw /v1/workspace/tmp/upload returned HTTP ${response.status}: ${trimmed}`;

  return new HttpError(502, message);
}

/**
 * Normalizes unknown fetch transport failures.
 *
 * @param error The thrown transport failure.
 * @returns The normalized HttpError.
 */
export function normalizeOpenClawWorkspaceTempUploadError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const description = error instanceof Error ? error.message : String(error);

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw /v1/workspace/tmp/upload: ${description}`
  );
}
