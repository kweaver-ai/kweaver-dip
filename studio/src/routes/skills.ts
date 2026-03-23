import { Router, type NextFunction, type Request, type Response } from "express";

import {
  OpenClawAgentsGatewayAdapter,
} from "../adapters/openclaw-agents-adapter";
import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawAgentSkillsHttpClient
} from "../infra/openclaw-agent-skills-http-client";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import { DefaultAgentSkillsLogic } from "../logic/agent-skills";

const env = getEnv();
const openClawAgentsAdapter = new OpenClawAgentsGatewayAdapter(
  OpenClawGatewayClient.getInstance({
    url: env.openClawGatewayUrl,
    token: env.openClawGatewayToken,
    timeoutMs: env.openClawGatewayTimeoutMs
  })
);
const agentSkillsLogic = new DefaultAgentSkillsLogic(
  new DefaultOpenClawAgentSkillsHttpClient({
    gatewayUrl: env.openClawGatewayHttpUrl,
    token: env.openClawGatewayToken,
    timeoutMs: env.openClawGatewayTimeoutMs
  }),
  openClawAgentsAdapter
);

/**
 * Extracts the `id` path parameter handling the `string | string[]`
 * type that Express may produce.
 *
 * @param idParam The raw path parameter value.
 * @returns The first non-empty id string.
 * @throws HttpError when the id is missing or empty.
 */
function resolveIdParam(idParam: string | string[] | undefined): string {
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id || id.trim().length === 0) {
    throw new HttpError(400, "id path parameter is required");
  }
  return id;
}

/**
 * Builds the skills router.
 *
 * @returns The router exposing skills endpoints.
 */
export function createSkillsRouter(): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/skills",
    async (
      _request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const result = await agentSkillsLogic.listEnabledSkills();

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query enabled skills")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/digital-human/:id/skills",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const id = resolveIdParam(request.params.id);
        const result = await agentSkillsLogic.listDigitalHumanSkills(id);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital human skills")
        );
      }
    }
  );

  return router;
}
