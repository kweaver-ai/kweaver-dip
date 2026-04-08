import type { IncomingHttpHeaders } from "node:http";
import type { NextFunction, Request, Response } from "express";

import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import {
  DefaultHydraHttpClient,
  type HydraHttpClient
} from "../infra/hydra-http-client";
import type { HydraIntrospectTokenResponse } from "../types/hydra";

const env = getEnv();
const hydraHttpClient = new DefaultHydraHttpClient({
  adminUrl: env.hydraAdminUrl,
  timeoutMs: env.openClawGatewayTimeoutMs
});

/**
 * Reserved whitelist of request paths that can bypass authentication.
 */
export const DEFAULT_AUTH_WHITELIST: readonly string[] = [
  "/health"
];

/**
 * Options used to create the Hydra authentication middleware.
 */
export interface HydraAuthMiddlewareOptions {
  /**
   * Optional Hydra client override used by tests.
   */
  hydraHttpClient?: HydraHttpClient;

  /**
   * Optional request path whitelist.
   */
  whitelist?: readonly string[];

  /**
   * Overrides the runtime development-mode detection.
   */
  isDevelopment?: boolean;

  /**
   * Mocked user identifier used when development mode skips Hydra.
   */
  mockUserId?: string;
}

/**
 * Creates the shared authentication middleware backed by Hydra introspection.
 *
 * @param options Optional authentication middleware overrides.
 * @returns One Express middleware function.
 */
export function createHydraAuthMiddleware(
  options: HydraAuthMiddlewareOptions = {}
): (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void> {
  const client = options.hydraHttpClient ?? hydraHttpClient;
  const whitelist = options.whitelist ?? DEFAULT_AUTH_WHITELIST;
  const isDevelopment = options.isDevelopment ?? env.isDevelopment;
  const mockUserId = options.mockUserId ?? env.oauthMockUserId;

  return async (
    request: Request,
    _response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (isWhitelistedPath(request.path, whitelist)) {
        next();
        return;
      }

      if (isDevelopment) {
        const userId = readMockUserId(mockUserId);
        injectUserIdHeader(request, userId);
        next();
        return;
      }

      const token = readBearerToken(request.headers.authorization);
      const introspection = await client.introspectAccessToken(token);
      const userId = readActiveUserId(introspection);

      injectUserIdHeader(request, userId);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Returns whether one request path is allowed to bypass authentication.
 *
 * @param path The incoming request path.
 * @param whitelist The configured whitelist entries.
 * @returns `true` when the path should skip auth.
 */
export function isWhitelistedPath(
  path: string,
  whitelist: readonly string[]
): boolean {
  return whitelist.includes(path);
}

/**
 * Extracts the bearer token from an Authorization header.
 *
 * @param authorizationHeader The raw Authorization header value.
 * @returns The normalized bearer token string.
 * @throws {HttpError} Thrown when the header is missing or malformed.
 */
export function readBearerToken(
  authorizationHeader: string | undefined
): string {
  if (authorizationHeader === undefined || authorizationHeader.trim() === "") {
    throw new HttpError(401, "Authorization header is required");
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);

  if (scheme !== "Bearer" || token === undefined || token.trim() === "") {
    throw new HttpError(401, "Authorization header must use Bearer token");
  }

  return token;
}

/**
 * Resolves the mocked user id used in development mode.
 *
 * @param mockUserId The configured mock user identifier.
 * @returns The normalized mock user id.
 * @throws {HttpError} Thrown when the mock value is missing.
 */
export function readMockUserId(mockUserId: string | undefined): string {
  if (mockUserId === undefined || mockUserId.trim() === "") {
    throw new HttpError(500, "OAUTH_MOCK_USER_ID must be configured in development mode");
  }

  return mockUserId.trim();
}

/**
 * Resolves the active user id returned by Hydra token introspection.
 *
 * @param introspection The Hydra token introspection payload.
 * @returns The normalized active user id.
 * @throws {HttpError} Thrown when the token is inactive or missing a subject.
 */
export function readActiveUserId(
  introspection: HydraIntrospectTokenResponse
): string {
  if (introspection.active !== true) {
    throw new HttpError(401, "Access token is invalid or inactive");
  }

  if (introspection.sub === undefined || introspection.sub.trim() === "") {
    throw new HttpError(401, "Access token is missing user subject");
  }

  return introspection.sub.trim();
}

/**
 * Injects the authenticated user id into the downstream request headers.
 *
 * @param request The incoming Express request.
 * @param userId The authenticated user identifier.
 */
export function injectUserIdHeader(request: Request, userId: string): void {
  request.headers["x-user-id"] = userId;
}

/**
 * Injects the authenticated user id into the downstream request context.
 *
 * @param request The incoming Express request.
 * @param userId The authenticated user identifier.
 */
export function injectAuthenticatedUserId(request: Request, userId: string): void {
  injectUserIdHeader(request, userId);
}

/**
 * Reads the authenticated user id injected by the authentication middleware.
 *
 * @param request The incoming Express request.
 * @returns The normalized authenticated user id, or undefined when absent.
 */
export function readAuthenticatedUserId(
  request: {
    headers: IncomingHttpHeaders;
  }
): string | undefined {
  return readAuthenticatedUserIdHeader(request.headers);
}

/**
 * Reads the authenticated user id from request headers.
 *
 * @param headers The incoming HTTP headers.
 * @returns The normalized authenticated user id, or undefined when absent.
 */
function readAuthenticatedUserIdHeader(headers: IncomingHttpHeaders): string | undefined {
  const userIdHeader = headers["x-user-id"];
  const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

  if (typeof userId !== "string") {
    return undefined;
  }

  const trimmedUserId = userId.trim();

  return trimmedUserId === "" ? undefined : trimmedUserId;
}
