import { Router, type NextFunction, type Request, type Response } from "express";
import type { IncomingHttpHeaders } from "node:http";

import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawResponsesHttpClient,
  type OpenClawResponsesHttpClient,
} from "../infra/openclaw-responses-http-client";
import type { DigitalHumanResponseRequest } from "../types/digital-human-response";

const env = getEnv();
const openClawResponsesHttpClient = new DefaultOpenClawResponsesHttpClient({
  gatewayUrl: env.openClawGatewayUrl,
  token: env.openClawGatewayToken,
  timeoutMs: env.openClawGatewayTimeoutMs
});

/**
 * Builds the digital human response router.
 *
 * @param responsesHttpClient Optional client used to call OpenClaw.
 * @returns The router exposing digital human response endpoints.
 */
export function createDigitalHumanResponseRouter(
  responsesHttpClient: OpenClawResponsesHttpClient = openClawResponsesHttpClient
): Router {
  const router = Router();

  router.post(
    "/api/dip-studio/v1/digital-human/:id/chat/responses",
    async (
      request: Request<{ id: string }, unknown, DigitalHumanResponseRequest>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      const abortController = new AbortController();

      attachDownstreamAbortHandlers(request, response, abortController);

      try {
        const requestBody = readDigitalHumanResponseRequestBody(request.body);
        const requestHeaders = readDigitalHumanResponseRequestHeaders(request.headers);
        const upstreamResponse = await responsesHttpClient.createResponseStream(
          request.params.id,
          requestBody,
          abortController.signal,
          requestHeaders
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
            : new HttpError(502, "Failed to proxy digital human response")
        );
      }
    }
  );

  return router;
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
 * Validates the incoming digital human response request body.
 *
 * @param requestBody The raw request body parsed by Express.
 * @returns The validated proxy payload.
 */
export function readDigitalHumanResponseRequestBody(
  requestBody: unknown
): DigitalHumanResponseRequest {
  if (typeof requestBody !== "object" || requestBody === null || Array.isArray(requestBody)) {
    throw new HttpError(
      400,
      "Digital human response request body must be a JSON object"
    );
  }

  return requestBody as DigitalHumanResponseRequest;
}

/**
 * Extracts supported upstream request headers from the downstream HTTP request.
 *
 * @param requestHeaders The raw downstream request headers.
 * @returns The filtered headers forwarded to OpenClaw.
 */
export function readDigitalHumanResponseRequestHeaders(
  requestHeaders?: IncomingHttpHeaders
): Headers {
  if (requestHeaders === undefined) {
    throw new HttpError(401, "x-openclaw-session-key header is required");
  }

  const sessionKey = readOptionalHeaderValue(
    requestHeaders["x-openclaw-session-key"]
  );

  if (sessionKey === undefined) {
    throw new HttpError(401, "x-openclaw-session-key header is required");
  }

  return new Headers({
    "x-openclaw-session-key": sessionKey
  });
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
