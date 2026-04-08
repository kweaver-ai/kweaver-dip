import { Router, type NextFunction, type Request, type Response } from "express";
import { readAuthenticatedUserId } from "../middleware/hydra-auth";

import { OpenClawSessionsGatewayAdapter } from "../adapters/openclaw-sessions-adapter";
import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawArchivesHttpClient,
} from "../infra/openclaw-archives-http-client";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import { DefaultSessionsLogic, type SessionsLogic } from "../logic/sessions";
import type {
  OpenClawSessionGetParams,
  OpenClawSessionsListParams,
} from "../types/sessions";

/**
 * Supported query fields for sessions list endpoint.
 */
export interface SessionsListQuery {
  limit?: string;
  search?: string;
  agentId?: string;
}

/**
 * Supported query fields for session detail endpoint.
 */
export interface SessionMessagesQuery {
  limit?: string;
}

/**
 * Path parameters for session detail endpoint.
 */
export interface SessionDetailParams {
  /**
   * Session key.
   */
  key: string;
}

/**
 * Path parameters for digital human sessions endpoints.
 */
export interface DigitalHumanSessionsParams {
  /**
   * Digital human identifier.
   */
  id: string;
}

/**
 * Path parameters for session messages endpoint.
 */
export interface SessionMessagesParams {
  /**
   * Session key.
   */
  key: string;
}

/**
 * Path parameters for session archives subpath endpoint.
 */
export interface SessionArchivesSubpathParams extends SessionDetailParams {
  /**
   * Archive subpath.
   */
  subpath: string | string[];
}

const env = getEnv();
const openClawArchivesHttpClient = new DefaultOpenClawArchivesHttpClient({
  gatewayUrl: env.openClawGatewayHttpUrl,
  token: env.openClawGatewayToken,
  timeoutMs: env.openClawGatewayTimeoutMs
});
const sessionsLogic = new DefaultSessionsLogic(
  new OpenClawSessionsGatewayAdapter(
    OpenClawGatewayClient.getInstance({
      url: env.openClawGatewayUrl,
      token: env.openClawGatewayToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    })
  ),
  openClawArchivesHttpClient
);

/**
 * Builds the sessions router.
 *
 * @param logic Optional sessions logic implementation.
 * @returns The router exposing sessions endpoints.
 */
export function createSessionsRouter(
  logic: SessionsLogic = sessionsLogic
): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/sessions",
    async (
      request: Request<unknown, unknown, unknown, SessionsListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const query = readSessionsListQuery(request.query);
        const result = await logic.listSessions({
          ...query,
          userId: readAuthenticatedUserId(request)
        });

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query sessions")
        );
      }
    }
  );

  router.delete(
    "/api/dip-studio/v1/sessions/:key",
    async (
      request: Request<SessionDetailParams>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = readRequiredPathParam(request.params.key, "key");

        await logic.deleteSession(key, readRequiredAuthenticatedUserId(request));

        response.status(204).send();
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to delete session")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/sessions/:key",
    async (
      request: Request<SessionDetailParams, unknown, unknown, SessionMessagesQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = readRequiredPathParam(request.params.key, "key");
        const session = await logic.getSessionSummary(key);

        response.status(200).json(session);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query session detail")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/digital-human/:id/sessions",
    async (
      request: Request<DigitalHumanSessionsParams, unknown, unknown, SessionsListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const query = readSessionsListQuery(request.query);
        const dhId = readRequiredPathParam(request.params.id, "id");
        const result = await logic.listSessions({
          ...query,
          agentId: dhId,
          userId: readAuthenticatedUserId(request)
        });

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital human sessions")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/sessions/:key/messages",
    async (
      request: Request<
        SessionMessagesParams,
        unknown,
        unknown,
        SessionMessagesQuery
      >,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const sessionKey = readRequiredPathParam(request.params.key, "key");
        const params = readSessionGetParams(sessionKey, request.query);
        const result = await logic.getSession(params);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query session messages")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/sessions/:key/archives",
    async (
      request: Request<
        SessionDetailParams,
        unknown,
        unknown,
        Record<string, never>
      >,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = readRequiredPathParam(request.params.key, "key");
        const result = await logic.getSessionArchives(key);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query session archives")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/sessions/:key/archives/*subpath",
    async (
      request: Request<
        SessionArchivesSubpathParams,
        unknown,
        unknown,
        Record<string, never>
      >,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = readRequiredPathParam(request.params.key, "key");
        const subpath = readRequiredSubpathParam(request.params.subpath, "subpath");
        const result = await logic.getSessionArchiveSubpath(key, subpath);
        const contentType = result.headers.get("content-type");

        if (contentType !== null) {
          response.setHeader("content-type", contentType);
        }

        response.status(result.status).send(Buffer.from(result.body));
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query session archive subpath")
        );
      }
    }
  );

  return router;
}

/**
 * Parses and validates sessions list query parameters.
 *
 * @param query Raw query string values.
 * @returns Parsed `sessions.list` parameters.
 */
export function readSessionsListQuery(
  query: SessionsListQuery
): OpenClawSessionsListParams {
  return {
    limit: parseOptionalNonNegativeIntegerString(query.limit, "limit"),
    search: parseOptionalString(query.search),
    agentId: parseOptionalString(query.agentId)
  };
}

/**
 * Parses and validates `sessions.get` parameters.
 *
 * @param rawKey Raw session key from route params.
 * @param query Raw query string values.
 * @returns Parsed `sessions.get` parameters.
 */
export function readSessionGetParams(
  rawKey: string,
  query: SessionMessagesQuery
): OpenClawSessionGetParams {
  const key = rawKey.trim();

  if (key === "") {
    throw new HttpError(400, "Invalid path parameter `key`");
  }

  return {
    key,
    limit: parseOptionalNonNegativeIntegerString(query.limit, "limit")
  };
}

/**
 * Parses and validates required path parameter.
 *
 * @param rawValue Raw path value.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed non-empty string value.
 */
export function readRequiredPathParam(
  rawValue: string,
  fieldName: string
): string {
  const value = rawValue.trim();

  if (value === "") {
    throw new HttpError(400, `Invalid path parameter \`${fieldName}\``);
  }

  return value;
}

/**
 * Parses and validates required wildcard subpath parameter.
 *
 * @param rawValue Raw wildcard parameter value.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed non-empty subpath value.
 */
export function readRequiredSubpathParam(
  rawValue: string | string[] | undefined,
  fieldName: string
): string {
  if (rawValue === undefined) {
    throw new HttpError(400, `Invalid path parameter \`${fieldName}\``);
  }

  const value =
    typeof rawValue === "string" ? rawValue.trim() : rawValue.join("/").trim();

  if (value === "") {
    throw new HttpError(400, `Invalid path parameter \`${fieldName}\``);
  }

  return value;
}

/**
 * Normalizes archives session identifier for downstream dip `/v1/archives`.
 *
 * Accepts plain session ids and session keys like
 * `agent:de_finance:cron:9fb6b0da-c26e-4419-929e-6b8a1274f80c`.
 *
 * @param rawSessionId Raw session identifier from path.
 * @returns Normalized session id expected by dip archives.
 */
export function normalizeArchiveSessionId(rawSessionId: string): string {
  const trimmed = rawSessionId.trim();

  if (!trimmed.includes(":")) {
    return trimmed;
  }

  const parts = trimmed.split(":").filter((part) => part.trim() !== "");
  const lastPart = parts.at(-1);

  return lastPart ?? trimmed;
}

/**
 * Parses an optional boolean query string.
 *
 * @param rawValue Raw query value.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed boolean value.
 */
export function parseOptionalBooleanString(
  rawValue: string | undefined,
  fieldName: string
): boolean | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
}

/**
 * Parses an optional non-negative integer query string.
 *
 * @param rawValue Raw query value.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed integer value.
 */
export function parseOptionalNonNegativeIntegerString(
  rawValue: string | undefined,
  fieldName: string
): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
  }

  return Number(rawValue);
}

/**
 * Parses an optional string by trimming whitespace.
 *
 * @param rawValue Raw string value.
 * @returns Parsed non-empty string.
 */
export function parseOptionalString(rawValue: string | undefined): string | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Reads the authenticated user id and rejects requests without one.
 *
 * @param request The incoming HTTP request.
 * @returns The normalized authenticated user id.
 */
function readRequiredAuthenticatedUserId(request: {
  headers: Request["headers"];
}): string {
  const userId = readAuthenticatedUserId(request);

  if (userId === undefined) {
    throw new HttpError(401, "x-user-id header is required");
  }

  return userId;
}
