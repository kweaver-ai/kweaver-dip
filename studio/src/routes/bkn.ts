import { Router, type NextFunction, type Request, type Response } from "express";

import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import {
  DefaultBknHttpClient,
  type BknHttpClient,
  type BknProxyResponse
} from "../infra/bkn-http-client";
import type {
  BknKnowledgeNetworkDetailQuery,
  BknKnowledgeNetworkParams,
  BknKnowledgeNetworksListQuery
} from "../types/bkn";

const env = getEnv();
const bknHttpClient = new DefaultBknHttpClient({
  baseUrl: env.bknBackendUrl,
  token: env.appUserToken,
  timeoutMs: env.openClawGatewayTimeoutMs
});

/**
 * Builds the BKN proxy router.
 *
 * @param client Optional BKN HTTP client implementation.
 * @returns The router exposing BKN proxy endpoints.
 */
export function createBknRouter(client: BknHttpClient = bknHttpClient): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/knowledge-networks",
    async (
      request: Request<unknown, unknown, unknown, BknKnowledgeNetworksListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const result = await client.listKnowledgeNetworks(request.query);
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
        const result = await client.getKnowledgeNetwork(knId, request.query);
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
    if (key.toLowerCase() === "content-length") {
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
