import { Router, type NextFunction, type Request, type Response } from "express";

import {
  OpenClawAgentsGatewayAdapter,
} from "../adapters/openclaw-agents-adapter";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/http-error";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import {
  DefaultDigitalHumanLogic,
  FileSystemDigitalHumanWorkspaceStore,
} from "../logic/digital-human";
import type { CreateDigitalHumanRequest } from "../types/digital-human";

const env = getEnv();
const digitalHumanLogic = new DefaultDigitalHumanLogic(
  new OpenClawAgentsGatewayAdapter(
    OpenClawGatewayClient.getInstance({
      url: env.openClawGatewayUrl,
      token: env.openClawGatewayToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    })
  ),
  new FileSystemDigitalHumanWorkspaceStore()
);

/**
 * Builds the digital human router.
 *
 * @returns The router exposing digital human endpoints.
 */
export function createDigitalHumanRouter(): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/digital-human",
    async (
      _request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const result = await digitalHumanLogic.listDigitalHumans();

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital humans")
        );
      }
    }
  );

  router.post(
    "/api/dip-studio/v1/digital-human",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const payload = parseCreateDigitalHumanRequest(request.body);
        const result = await digitalHumanLogic.createDigitalHuman(payload);

        response.status(201).json({
          id: result.id
        });
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to create digital human")
        );
      }
    }
  );

  return router;
}

/**
 * Parses and validates the create digital human request body.
 *
 * @param body The raw request body.
 * @returns The normalized create request payload.
 * @throws {HttpError} Thrown when the body is invalid.
 */
export function parseCreateDigitalHumanRequest(
  body: unknown
): CreateDigitalHumanRequest {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const candidate = body as Record<string, unknown>;

  return {
    id: readOptionalString(candidate.id, "id"),
    name: readRequiredString(candidate.name, "name"),
    avatar: readOptionalString(candidate.avatar, "avatar"),
    identity: readOptionalString(candidate.identity, "identity"),
    soul: readOptionalString(candidate.soul, "soul"),
    skills: readOptionalStringArray(candidate.skills, "skills")
  };
}

/**
 * Reads a required string field from a JSON object.
 *
 * @param value The raw field value.
 * @param fieldName The request field name.
 * @returns The trimmed string value.
 * @throws {HttpError} Thrown when the field is missing or invalid.
 */
export function readRequiredString(value: unknown, fieldName: string): string {
  const normalized = readOptionalString(value, fieldName);

  if (normalized === undefined) {
    throw new HttpError(400, `Field "${fieldName}" is required`);
  }

  return normalized;
}

/**
 * Reads an optional string field from a JSON object.
 *
 * @param value The raw field value.
 * @param fieldName The request field name.
 * @returns The trimmed string value, or `undefined` when absent.
 * @throws {HttpError} Thrown when the field is not a string.
 */
export function readOptionalString(
  value: unknown,
  fieldName: string
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `Field "${fieldName}" must be a string`);
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

/**
 * Reads an optional string array field from a JSON object.
 *
 * @param value The raw field value.
 * @param fieldName The request field name.
 * @returns The normalized string array, or `undefined` when absent.
 * @throws {HttpError} Thrown when the field is not a string array.
 */
export function readOptionalStringArray(
  value: unknown,
  fieldName: string
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, `Field "${fieldName}" must be an array`);
  }

  return value.map((entry, index) =>
    readRequiredString(entry, `${fieldName}[${index}]`)
  );
}
