import { Router, type NextFunction, type Request, type Response } from "express";

import { HttpError } from "../errors/http-error";
import { DefaultGuideLogic, type GuideLogic } from "../logic/guide";
import type {
  GuideStatusResponse,
  InitializeGuideRequest,
  OpenClawDetectedConfig
} from "../types/guide";

const guideLogic = new DefaultGuideLogic();

/**
 * Builds the guide router.
 *
 * @param logic Optional guide logic override.
 * @returns The router exposing DIP Studio guide endpoints.
 */
export function createGuideRouter(
  logic: GuideLogic = guideLogic
): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/guide/status",
    async (
      _request: Request,
      response: Response<GuideStatusResponse>,
      next: NextFunction
    ): Promise<void> => {
      try {
        response.status(200).json(await logic.getStatus());
      } catch (error) {
        next(error instanceof HttpError ? error : new HttpError(502, "Failed to query guide status"));
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/guide/openclaw-config",
    async (
      _request: Request,
      response: Response<OpenClawDetectedConfig>,
      next: NextFunction
    ): Promise<void> => {
      try {
        response.status(200).json(await logic.getOpenClawConfig());
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query OpenClaw config")
        );
      }
    }
  );

  router.post(
    "/api/dip-studio/v1/guide/initialize",
    async (
      request: Request<unknown, unknown, InitializeGuideRequest>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        await logic.initialize(readInitializeGuideRequestBody(request.body));
        response.sendStatus(200);
      } catch (error) {
        next(error instanceof HttpError ? error : new HttpError(502, "Failed to initialize DIP Studio"));
      }
    }
  );

  return router;
}

/**
 * Validates the guide initialization request body.
 *
 * @param requestBody Raw parsed request body.
 * @returns The validated initialization payload.
 * @throws {HttpError} Thrown when the request body is invalid.
 */
export function readInitializeGuideRequestBody(
  requestBody: unknown
): InitializeGuideRequest {
  if (typeof requestBody !== "object" || requestBody === null || Array.isArray(requestBody)) {
    throw new HttpError(400, "Guide initialize request body must be a JSON object");
  }

  const body = requestBody as Partial<InitializeGuideRequest>;

  if (typeof body.openclaw_address !== "string" || body.openclaw_address.trim() === "") {
    throw new HttpError(400, "openclaw_address is required");
  }

  if (typeof body.openclaw_token !== "string" || body.openclaw_token.trim() === "") {
    throw new HttpError(400, "openclaw_token is required");
  }

  const kweaverBaseUrl =
    typeof body.kweaver_base_url === "string" ? body.kweaver_base_url.trim() : "";
  const kweaverToken =
    typeof body.kweaver_token === "string" ? body.kweaver_token.trim() : "";

  if (kweaverBaseUrl !== "" && kweaverToken === "") {
    throw new HttpError(400, "kweaver_token is required when kweaver_base_url is provided");
  }

  if (kweaverBaseUrl === "" && kweaverToken !== "") {
    throw new HttpError(400, "kweaver_base_url is required when kweaver_token is provided");
  }

  return {
    openclaw_address: body.openclaw_address.trim(),
    openclaw_token: body.openclaw_token.trim(),
    kweaver_base_url: kweaverBaseUrl === "" ? undefined : kweaverBaseUrl,
    kweaver_token: kweaverToken === "" ? undefined : kweaverToken
  };
}
