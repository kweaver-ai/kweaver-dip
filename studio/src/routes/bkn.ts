import {
  Router,
  type NextFunction,
  type Request,
  type Response
} from "express";

import { HttpError } from "../errors/http-error";
import {
  resolveBknBusinessDomain,
  type BknProxyResponse
} from "../infra/bkn-http-client";
import { DefaultBknLogic, type BknLogic } from "../logic/bkn";
import type {
  BknKnowledgeNetworkDetailQuery,
  BknKnowledgeNetworkParams,
  BknKnowledgeNetworksListQuery
} from "../types/bkn";

/**
 * Resolves `x-business-domain` from an Express request for BKN upstream calls.
 *
 * @param request Incoming HTTP request (headers only are read).
 * @returns Value sent upstream on `x-business-domain`.
 */
function readBknBusinessDomainHeader(request: Pick<Request, "headers">): string {
  return resolveBknBusinessDomain(request.headers["x-business-domain"]);
}

/**
 * Builds the BKN proxy router.
 *
 * @param logic Optional BKN application logic implementation.
 * @returns The router exposing BKN proxy endpoints.
 */
export function createBknRouter(logic: BknLogic = new DefaultBknLogic()): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/knowledge-networks",
    async (
      request: Request<unknown, unknown, unknown, BknKnowledgeNetworksListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const businessDomain = readBknBusinessDomainHeader(request);
        const result = await logic.listKnowledgeNetworks(
          request.query,
          businessDomain
        );
        writeProxyResponse(response, result);
      } catch (error) {
        next(error instanceof HttpError ? error : new HttpError(502, "Failed to query BKN knowledge networks"));
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/knowledge-networks/:kn_id",
    async (
      request: Request<BknKnowledgeNetworkParams, unknown, unknown, BknKnowledgeNetworkDetailQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const knId = readRequiredKnId(request.params.kn_id);
        const businessDomain = readBknBusinessDomainHeader(request);
        const result = await logic.getKnowledgeNetwork(
          knId,
          request.query,
          businessDomain
        );
        writeProxyResponse(response, result);
      } catch (error) {
        next(error instanceof HttpError ? error : new HttpError(502, "Failed to query BKN knowledge network"));
      }
    }
  );

  return router;
}

/**
 * Reads a required knowledge network id path parameter.
 *
 * @param value Raw `kn_id` value.
 * @returns The normalized knowledge network id.
 * @throws {HttpError} Thrown when the id is missing or empty.
 */
export function readRequiredKnId(value: string | undefined): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "kn_id path parameter is required");
  }

  return value.trim();
}

/**
 * Header names that must not be forwarded when the upstream body was read with `fetch().text()`
 * (already decoded). Forwarding `Content-Encoding` would make the browser try to decode plain JSON
 * as gzip and fail with `ERR_CONTENT_DECODING_FAILED`.
 */
const hopByHopOrEncodingHeaders = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection"
]);

/**
 * Writes one proxied upstream response to Express.
 *
 * @param response Express response object.
 * @param upstreamResponse Normalized upstream response.
 */
export function writeProxyResponse(
  response: Response,
  upstreamResponse: BknProxyResponse
): void {
  upstreamResponse.headers.forEach((value, key) => {
    if (hopByHopOrEncodingHeaders.has(key.toLowerCase())) {
      return;
    }

    response.setHeader(key, value);
  });

  if (upstreamResponse.status === 204 || upstreamResponse.body.length === 0) {
    response.status(upstreamResponse.status).end();
    return;
  }

  response.status(upstreamResponse.status).send(upstreamResponse.body);
}
