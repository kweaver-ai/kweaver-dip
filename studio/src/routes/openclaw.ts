import { Router, type NextFunction, type Request, type Response } from "express";

import {
  OpenClawAgentsGatewayAdapter,
  type OpenClawAgentsAdapter
} from "../adapters/openclaw-agents-adapter";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/http-error";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import type { DigitalHumanList } from "../types/digital-human";
import type { OpenClawAgentsListResult } from "../types/openclaw";

const env = getEnv();
const openClawAgentsAdapter = new OpenClawAgentsGatewayAdapter(
  OpenClawGatewayClient.getInstance({
    url: env.openClawGatewayUrl,
    token: env.openClawGatewayToken,
    timeoutMs: env.openClawGatewayTimeoutMs
  })
);

/**
 * Returns the OpenClaw agent list over HTTP.
 *
 * @param client The OpenClaw gateway reader used by the route.
 * @param _request The incoming HTTP request.
 * @param response The outgoing HTTP response.
 * @param next The next middleware callback.
 * @returns Nothing. The response is written directly.
 */
export async function getDigitalHumans(
  adapter: OpenClawAgentsAdapter,
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await adapter.listAgents();

    response.status(200).json(mapAgentsToDigitalHumans(result));
  } catch (error) {
    next(
      error instanceof HttpError
        ? error
        : new HttpError(502, "Failed to query digital humans")
    );
  }
}

/**
 * Builds the OpenClaw router.
 *
 * @returns The router exposing OpenClaw endpoints.
 */
export function createOpenClawRouter(): Router {
  const router = Router();

  router.get("/api/dip-studio/v1/digital-human", (request, response, next) => {
    return getDigitalHumans(openClawAgentsAdapter, request, response, next);
  });

  return router;
}

/**
 * Maps the OpenClaw agents payload to the public digital human schema.
 *
 * @param result The OpenClaw agents list result.
 * @returns The normalized digital human list.
 */
export function mapAgentsToDigitalHumans(
  result: OpenClawAgentsListResult
): DigitalHumanList {
  return result.agents.map((agent) => ({
    id: agent.id,
    name: agent.name ?? agent.identity?.name ?? agent.id,
    avatar: agent.identity?.avatarUrl ?? agent.identity?.avatar
  }));
}
