import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { Router, type NextFunction, type Request, type Response } from "express";

import { OpenClawSessionsGatewayAdapter } from "../adapters/openclaw-sessions-adapter";
import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawChatAgentClient,
  type OpenClawChatAgentClient
} from "../infra/openclaw-chat-agent-client";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import { DefaultSessionsLogic, type SessionsLogic } from "../logic/sessions";
import type {
  ChatAgentInputItem,
  ChatAgentInputTextContentPart,
  ChatAgentRequest,
  NormalizedChatAgentRequest
} from "../types/chat-agent";
import type {
  CreateSessionKeyRequest,
  CreateSessionKeyResponse
} from "../types/session-key";
import type { OpenClawChatHistoryParams } from "../types/sessions";
import { getEnv } from "../utils/env";
import { buildHiddenAttachmentContextBlock } from "../utils/hidden-attachment-context";
import { parseSession } from "../utils/session";

const env = getEnv();
const openClawChatAgentClient = new DefaultOpenClawChatAgentClient({
  url: env.openClawGatewayUrl,
  token: env.openClawGatewayToken,
  timeoutMs: env.openClawGatewayTimeoutMs
});
const chatSessionsLogic = new DefaultSessionsLogic(
  new OpenClawSessionsGatewayAdapter(
    OpenClawGatewayClient.getInstance({
      url: env.openClawGatewayUrl,
      token: env.openClawGatewayToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    })
  )
);

/**
 * Supported query fields for chat messages endpoint.
 */
export interface ChatMessagesQuery {
  /**
   * Maximum number of messages to return.
   */
  limit?: string;
}

/**
 * Dependencies used to build the chat router.
 */
export interface ChatRouterDependencies {
  /**
   * Optional sessions logic used by chat history endpoints.
   */
  sessionsLogic?: SessionsLogic;

  /**
   * Optional OpenClaw chat agent client.
   */
  chatAgentClient?: OpenClawChatAgentClient;
}

/**
 * Builds the router exposing all `/chat/*` HTTP interfaces.
 *
 * @param dependencies Optional chat-related route dependencies.
 * @returns The router exposing all chat endpoints.
 */
export function createChatRouter(
  dependencies: ChatRouterDependencies = {}
): Router {
  const router = Router();
  const sessionsLogic = dependencies.sessionsLogic ?? chatSessionsLogic;
  const chatAgentClient =
    dependencies.chatAgentClient ?? openClawChatAgentClient;

  router.post(
    "/api/dip-studio/v1/chat/session",
    (
      request: Request<unknown, CreateSessionKeyResponse, CreateSessionKeyRequest>,
      response: Response<CreateSessionKeyResponse>,
      next: NextFunction
    ): void => {
      try {
        const userId = readRequiredUserIdHeader(request.headers["x-user-id"]);
        const { agentId } = readCreateSessionKeyRequestBody(request.body);

        response.status(200).json({
          sessionKey: buildOpenClawSessionKey(agentId, userId)
        });
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to create session key")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/chat/messages",
    async (
      request: Request<Record<string, never>, unknown, unknown, ChatMessagesQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const params = readChatHistoryParams(request.headers, request.query);
        const result =
          sessionsLogic.getChatMessages === undefined
            ? await sessionsLogic.getSession({
                key: params.sessionKey,
                limit: params.limit
              })
            : await sessionsLogic.getChatMessages(params);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query chat messages")
        );
      }
    }
  );

  router.post(
    "/api/dip-studio/v1/chat/agent",
    async (
      request: Request<Record<string, never>, unknown, ChatAgentRequest>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      const abortController = new AbortController();

      attachDownstreamAbortHandlers(request, response, abortController);

      try {
        const requestBody = readChatAgentRequestBody(request.body);
        const sessionKey = readRequiredSessionKeyHeader(request.headers);
        const agentId = readAgentIdFromSessionKey(sessionKey);
        const message = appendAttachmentHintsToMessage(
          requestBody.message,
          requestBody.attachments
        );
        const upstreamResponse = await chatAgentClient.createResponseStream(
          {
            sessionKey,
            message,
            attachments: requestBody.attachments,
            idempotencyKey: randomUUID()
          },
          agentId,
          abortController.signal
        );

        writeEventStreamHeaders(response, upstreamResponse.status, upstreamResponse.headers);
        await pipeEventStream(upstreamResponse.body, response);
      } catch (error) {
        if (abortController.signal.aborted || response.destroyed) {
          return;
        }

        if (response.headersSent) {
          response.end();
          return;
        }

        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to proxy digital human chat agent")
        );
      }
    }
  );

  return router;
}

/**
 * Validates the incoming session key creation request body.
 *
 * @param requestBody The raw request body parsed by Express.
 * @returns The validated session key creation payload.
 * @throws {HttpError} Thrown when the request body is invalid.
 */
export function readCreateSessionKeyRequestBody(
  requestBody: unknown
): CreateSessionKeyRequest {
  if (typeof requestBody !== "object" || requestBody === null || Array.isArray(requestBody)) {
    throw new HttpError(400, "Session key request body must be a JSON object");
  }

  const { agentId } = requestBody as Partial<CreateSessionKeyRequest>;

  if (typeof agentId !== "string" || agentId.trim() === "") {
    throw new HttpError(400, "agentId is required");
  }

  return {
    agentId: agentId.trim()
  };
}

/**
 * Reads the authenticated user id injected by the auth middleware.
 *
 * @param userIdHeader The raw `x-user-id` header value.
 * @returns The normalized authenticated user id.
 * @throws {HttpError} Thrown when the user id is missing.
 */
export function readRequiredUserIdHeader(
  userIdHeader: string | string[] | undefined
): string {
  const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

  if (typeof userId !== "string" || userId.trim() === "") {
    throw new HttpError(401, "x-user-id header is required");
  }

  return userId.trim();
}

/**
 * Builds the OpenClaw session key for a new user chat session.
 *
 * @param agentId The owning agent id.
 * @param userId The authenticated user id.
 * @param chatId Optional deterministic chat id used by tests.
 * @returns The normalized OpenClaw session key.
 */
export function buildOpenClawSessionKey(
  agentId: string,
  userId: string,
  chatId: string = globalThis.crypto.randomUUID()
): string {
  return `agent:${agentId}:user:${userId}:direct:${chatId}`;
}

/**
 * Parses and validates `chat.history` parameters.
 *
 * @param headers Raw request headers.
 * @param query Raw query string values.
 * @returns Parsed `chat.history` parameters.
 */
export function readChatHistoryParams(
  headers: IncomingHttpHeaders | undefined,
  query: ChatMessagesQuery
): OpenClawChatHistoryParams {
  return {
    sessionKey: readRequiredSessionKeyHeader(headers),
    limit: parseOptionalNonNegativeIntegerString(query.limit, "limit")
  };
}

/**
 * Reads the OpenClaw session key from the downstream HTTP request headers.
 *
 * @param requestHeaders The raw downstream request headers.
 * @returns The normalized session key.
 */
export function readRequiredSessionKeyHeader(
  requestHeaders?: IncomingHttpHeaders
): string {
  if (requestHeaders === undefined) {
    throw new HttpError(401, "x-openclaw-session-key header is required");
  }

  const sessionKey = readOptionalHeaderValue(
    requestHeaders["x-openclaw-session-key"]
  );

  if (sessionKey === undefined) {
    throw new HttpError(401, "x-openclaw-session-key header is required");
  }

  return sessionKey;
}

/**
 * Parses the target agent id from the OpenClaw session key.
 *
 * @param sessionKey The OpenClaw session key header value.
 * @returns The agent id encoded in the session key.
 */
export function readAgentIdFromSessionKey(sessionKey: string): string {
  const parsedSession = parseSession(sessionKey);

  if (parsedSession.agent === undefined || parsedSession.agent.trim() === "") {
    throw new HttpError(
      400,
      "x-openclaw-session-key must start with agent:<agentId>:"
    );
  }

  return parsedSession.agent;
}

/**
 * Normalizes a possibly repeated HTTP header value to a single string.
 *
 * @param headerValue The raw Node.js header value.
 * @returns The normalized header value when present.
 */
export function readOptionalHeaderValue(
  headerValue: string | string[] | undefined
): string | undefined {
  if (headerValue === undefined) {
    return undefined;
  }

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  return headerValue;
}

/**
 * Writes the SSE response headers expected by Studio Web.
 *
 * @param response The downstream Express response.
 * @param statusCode The upstream HTTP status code.
 * @param headers The upstream OpenClaw response headers.
 */
export function writeEventStreamHeaders(
  response: Response,
  statusCode: number,
  headers: Headers
): void {
  response.status(statusCode);
  response.setHeader(
    "content-type",
    headers.get("content-type") ?? "text/event-stream; charset=utf-8"
  );
  response.setHeader(
    "cache-control",
    headers.get("cache-control") ?? "no-cache, no-transform"
  );
  response.setHeader("connection", headers.get("connection") ?? "keep-alive");
  response.setHeader("x-accel-buffering", "no");
  response.flushHeaders?.();
}

/**
 * Aborts the upstream request only when the downstream client disconnects unexpectedly.
 *
 * @param request The downstream HTTP request.
 * @param response The downstream HTTP response.
 * @param abortController The controller used to cancel the upstream fetch.
 */
export function attachDownstreamAbortHandlers(
  request: Request,
  response: Response,
  abortController: AbortController
): void {
  request.on("aborted", () => {
    abortController.abort();
  });
  response.on("close", () => {
    if (!response.writableEnded) {
      abortController.abort();
    }
  });
}

/**
 * Pipes the upstream OpenClaw event stream to the downstream response.
 *
 * @param stream The upstream event stream body.
 * @param response The downstream Express response.
 * @returns Nothing once the stream has fully completed.
 */
export async function pipeEventStream(
  stream: ReadableStream<Uint8Array>,
  response: Response
): Promise<void> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value !== undefined) {
        response.write(Buffer.from(value));
      }
    }
  } finally {
    reader.releaseLock();
    response.end();
  }
}

/**
 * Validates and normalizes the chat agent request body.
 *
 * @param requestBody The raw request body parsed by Express.
 * @returns The normalized request body.
 */
export function readChatAgentRequestBody(
  requestBody: unknown
): NormalizedChatAgentRequest {
  if (typeof requestBody !== "object" || requestBody === null || Array.isArray(requestBody)) {
    throw new HttpError(400, "Chat agent request body must be a JSON object");
  }

  const { input, attachments } = requestBody as Partial<ChatAgentRequest>;
  const message = readChatAgentMessage(input);
  const normalizedAttachments = readChatAgentAttachments(attachments);

  return {
    message,
    attachments: normalizedAttachments
  };
}

/**
 * Validates chat agent attachments.
 *
 * Allowed shape:
 * `{ type: "input_file", source: { type: "path", path: string } }`
 *
 * @param attachments Raw attachments field from request body.
 * @returns Normalized attachments.
 */
export function readChatAgentAttachments(
  attachments: unknown
): NormalizedChatAgentRequest["attachments"] {
  if (attachments === undefined) {
    return undefined;
  }

  if (!Array.isArray(attachments)) {
    throw new HttpError(400, "Chat agent attachments must be an array");
  }

  return attachments.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new HttpError(400, "Chat agent attachment must be an object");
    }

    const record = entry as Record<string, unknown>;
    if (record.type !== "input_file") {
      throw new HttpError(400, "Chat agent attachment type only supports `input_file`");
    }

    const source = record.source;
    if (typeof source !== "object" || source === null) {
      throw new HttpError(400, "Chat agent attachment source must be an object");
    }

    const sourceRecord = source as Record<string, unknown>;
    if (sourceRecord.type !== "path") {
      throw new HttpError(400, "Chat agent attachment source.type only supports `path`");
    }

    if (typeof sourceRecord.path !== "string" || sourceRecord.path.trim() === "") {
      throw new HttpError(400, "Chat agent attachment source.path must be a non-empty string");
    }

    return {
      type: "input_file",
      source: {
        type: "path",
        path: sourceRecord.path.trim()
      }
    };
  });
}

/**
 * Appends attachment path hints into the user message so downstream agents that
 * do not natively consume `attachments` can still locate uploaded files.
 *
 * @param message Original user message.
 * @param attachments Validated attachments.
 * @returns Message with hidden attachment hints.
 */
export function appendAttachmentHintsToMessage(
  message: string,
  attachments: NormalizedChatAgentRequest["attachments"]
): string {
  if (attachments === undefined || attachments.length === 0) {
    return message;
  }

  const paths = attachments.map((attachment) => attachment.source.path);
  const hiddenBlock = buildHiddenAttachmentContextBlock(paths);

  return [message, "", hiddenBlock].join("\n");
}

/**
 * Extracts one user message from an OpenResponse-style agent input field.
 *
 * @param input The raw `input` value from the request body.
 * @returns The normalized user message text.
 */
export function readChatAgentMessage(input: unknown): string {
  if (typeof input === "string" && input.trim() !== "") {
    return input.trim();
  }

  if (!Array.isArray(input)) {
    throw new HttpError(
      400,
      "Chat agent input must be a non-empty string or a message item array"
    );
  }

  for (let index = input.length - 1; index >= 0; index -= 1) {
    const item = input[index];

    if (!isChatAgentMessageInputItem(item) || item.role !== "user") {
      continue;
    }

    const text = readChatAgentItemText(item.content);

    if (text !== "") {
      return text;
    }
  }

  throw new HttpError(400, "Chat agent input must include a user message");
}

/**
 * Extracts text from one OpenResponse-style message content field.
 *
 * @param content The raw message content.
 * @returns The normalized text value.
 */
export function readChatAgentItemText(
  content: string | ChatAgentInputTextContentPart[]
): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (
        typeof part !== "object" ||
        part === null ||
        typeof part.text !== "string" ||
        (part.type !== "input_text" && part.type !== "text")
      ) {
        return "";
      }

      return part.text;
    })
    .join("")
    .trim();
}

/**
 * Checks whether one input item is a supported OpenResponse-style agent message item.
 *
 * @param value The raw input item.
 * @returns Whether the value matches the supported shape.
 */
export function isChatAgentMessageInputItem(
  value: unknown
): value is ChatAgentInputItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.type === "message" &&
    typeof record.role === "string" &&
    (typeof record.content === "string" || Array.isArray(record.content))
  );
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
