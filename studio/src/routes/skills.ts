import { Router, type NextFunction, type Request, type Response } from "express";

import {
  OpenClawAgentsGatewayAdapter,
} from "../adapters/openclaw-agents-adapter";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/http-error";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import {
  DefaultDigitalHumanLogic,
} from "../logic/digital-human";

const env = getEnv();
const digitalHumanLogic = new DefaultDigitalHumanLogic({
  openClawAgentsAdapter: new OpenClawAgentsGatewayAdapter(
    OpenClawGatewayClient.getInstance({
      url: env.openClawGatewayUrl,
      token: env.openClawGatewayToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    })
  ),
  skillStorePath: env.openClawSkillStorePath
});

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
        const result = await digitalHumanLogic.listEnabledSkills();

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

  return router;
}
