import { Router, type NextFunction, type Request, type Response } from "express";

import { OpenClawSessionsGatewayAdapter } from "../adapters/openclaw-sessions-adapter";
import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawArchivesHttpClient,
  type OpenClawArchivesHttpClient
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
  includeDerivedTitles?: string;
  includeLastMessage?: string;
  activeMinutes?: string;
  label?: string;
  includeGlobal?: string;
  includeUnknown?: string;
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
 * Path parameters for digital human session messages endpoint.
 */
export interface DigitalHumanSessionMessagesParams extends DigitalHumanSessionsParams {
  /**
   * Session id.
   */
  session_id: string;
}

/**
 * Path parameters for digital human session archives subpath endpoint.
 */
export interface DigitalHumanSessionArchivesSubpathParams
extends DigitalHumanSessionMessagesParams {
  /**
   * Archive subpath.
   */
  subpath: string | string[];
}

const env = getEnv();
const sessionsLogic = new DefaultSessionsLogic(
  new OpenClawSessionsGatewayAdapter(
    OpenClawGatewayClient.getInstance({
      url: env.openClawGatewayUrl,
      token: env.openClawGatewayToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    })
  )
);
const openClawArchivesHttpClient = new DefaultOpenClawArchivesHttpClient({
  gatewayUrl: env.openClawGatewayHttpUrl,
  token: env.openClawGatewayToken,
  timeoutMs: env.openClawGatewayTimeoutMs
});

/**
 * Builds the sessions router.
 *
 * @param logic Optional sessions logic implementation.
 * @param archivesHttpClient Optional OpenClaw archives HTTP client.
 * @returns The router exposing sessions endpoints.
 */
export function createSessionsRouter(
  logic: SessionsLogic = sessionsLogic,
  archivesHttpClient: OpenClawArchivesHttpClient = openClawArchivesHttpClient
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
        const result = await logic.listSessions(query);

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

  router.get(
    "/api/dip-studio/v1/sessions/:key",
    async (
      request: Request<SessionDetailParams, unknown, unknown, SessionMessagesQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const key = readRequiredPathParam(request.params.key, "key");
        const result = await logic.getSession(readSessionGetParams(key, request.query));

        response.status(200).json(result);
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
          agentId: dhId
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
    "/api/dip-studio/v1/digital-human/:id/sessions/:session_id/messages",
    async (
      request: Request<
        DigitalHumanSessionMessagesParams,
        unknown,
        unknown,
        SessionMessagesQuery
      >,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const dhId = readRequiredPathParam(request.params.id, "id");
        const sessionId = readRequiredPathParam(request.params.session_id, "session_id");
        const sessions = await logic.listSessions({
          agentId: dhId
        });
        const sessionKey = resolveSessionKeyBySessionId(sessions.sessions, sessionId);
        const params = readSessionGetParams(sessionKey, request.query);
        const result = await logic.getSession(params);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital human session messages")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/digital-human/:id/sessions/:session_id/archives",
    async (
      request: Request<
        DigitalHumanSessionMessagesParams,
        unknown,
        unknown,
        Record<string, never>
      >,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const dhId = readRequiredPathParam(request.params.id, "id");
        const sessionId = normalizeArchiveSessionId(
          readRequiredPathParam(request.params.session_id, "session_id")
        );
        const result = await archivesHttpClient.listSessionArchives(dhId, sessionId);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital human session archives")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/digital-human/:id/sessions/:session_id/archives/*subpath",
    async (
      request: Request<
        DigitalHumanSessionArchivesSubpathParams,
        unknown,
        unknown,
        Record<string, never>
      >,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const dhId = readRequiredPathParam(request.params.id, "id");
        const sessionId = normalizeArchiveSessionId(
          readRequiredPathParam(request.params.session_id, "session_id")
        );
        const subpath = readRequiredSubpathParam(request.params.subpath, "subpath");
        const result = await archivesHttpClient.getSessionArchiveSubpath(
          dhId,
          sessionId,
          subpath
        );
        const contentType = result.headers.get("content-type");

        if (contentType !== null) {
          response.setHeader("content-type", contentType);
        }

        response.status(result.status).send(Buffer.from(result.body));
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital human session archive subpath")
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
    agentId: parseOptionalString(query.agentId),
    includeDerivedTitles: parseOptionalBooleanString(
      query.includeDerivedTitles,
      "includeDerivedTitles"
    ),
    includeLastMessage: parseOptionalBooleanString(
      query.includeLastMessage,
      "includeLastMessage"
    ),
    activeMinutes: parseOptionalNonNegativeIntegerString(
      query.activeMinutes,
      "activeMinutes"
    ),
    label: parseOptionalString(query.label),
    includeGlobal: parseOptionalBooleanString(query.includeGlobal, "includeGlobal"),
    includeUnknown: parseOptionalBooleanString(
      query.includeUnknown,
      "includeUnknown"
    )
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
 * Normalizes archives session identifier for downstream archives-access plugin.
 *
 * Accepts plain session ids and session keys like
 * `agent:de_finance:cron:9fb6b0da-c26e-4419-929e-6b8a1274f80c`.
 *
 * @param rawSessionId Raw session identifier from path.
 * @returns Normalized session id expected by archives-access.
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
 * Resolves OpenClaw session key from one session id.
 *
 * @param sessions Session summary list.
 * @param sessionId Requested session id.
 * @returns Resolved session key.
 */
export function resolveSessionKeyBySessionId(
  sessions: Array<{ key: string; sessionId: string }>,
  sessionId: string
): string {
  const found = sessions.find(
    (session) => session.sessionId === sessionId || session.key === sessionId
  );

  if (found === undefined) {
    throw new HttpError(404, "Session not found");
  }

  return found.key;
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
