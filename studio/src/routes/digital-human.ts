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
import {
  DefaultAgentSkillsLogic,
} from "../logic/agent-skills";
import {
  DefaultDigitalHumanLogic,
} from "../logic/digital-human";
import {
  DefaultBuiltInDigitalHumanLogic,
} from "../logic/built-in-digital-human";
import type {
  BknEntry,
  BuiltInDigitalHumanList,
  ChannelConfig,
  CreateDigitalHumanResult,
  CreateDigitalHumanRequest,
  DigitalHumanChannelType,
  UpdateDigitalHumanRequest
} from "../types/digital-human";

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
const digitalHumanLogic = new DefaultDigitalHumanLogic({
  openClawAgentsAdapter,
  agentSkillsLogic,
  openClawWorkspaceDir: env.openClawWorkspaceDir
});
const builtInDigitalHumanLogic = new DefaultBuiltInDigitalHumanLogic();

/**
 * Validates the create digital human request body.
 *
 * @param body The raw request body.
 * @returns The validated creation request.
 * @throws HttpError when required fields are missing or invalid.
 */
const UPDATE_KEYS = [
  "name",
  "creature",
  "icon_id",
  "soul",
  "skills",
  "bkn",
  "channel"
] as const;

/**
 * Validates the PUT digital human request body.
 *
 * @param body The raw request body.
 * @returns The validated update payload.
 * @throws HttpError when the body is invalid.
 */
function parseUpdateRequest(body: unknown): UpdateDigitalHumanRequest {
  const raw = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : undefined;

  if (raw === undefined) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const hasAny = UPDATE_KEYS.some((key) => key in raw);
  if (!hasAny) {
    throw new HttpError(
      400,
      "At least one of name, creature, icon_id, soul, skills, bkn, or channel must be provided"
    );
  }

  const patch: UpdateDigitalHumanRequest = {};

  if ("name" in raw) {
    if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
      throw new HttpError(400, "name must be a non-empty string when provided");
    }
    patch.name = raw.name.trim();
  }

  if ("creature" in raw) {
    patch.creature = parseOptionalString(raw.creature);
  }

  if ("icon_id" in raw) {
    patch.icon_id = parseOptionalString(raw.icon_id);
  }

  if ("soul" in raw) {
    if (typeof raw.soul !== "string") {
      throw new HttpError(400, "soul must be a string when provided");
    }
    patch.soul = raw.soul;
  }

  if ("skills" in raw) {
    if (!Array.isArray(raw.skills)) {
      throw new HttpError(400, "skills must be an array when provided");
    }
    const filtered = raw.skills
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
    patch.skills = filtered;
  }

  if ("bkn" in raw) {
    if (!Array.isArray(raw.bkn)) {
      throw new HttpError(400, "bkn must be an array when provided");
    }
    if (raw.bkn.length === 0) {
      patch.bkn = [];
    } else {
      const parsed = parseBknArray(raw.bkn);
      if (!parsed) {
        throw new HttpError(400, "Each bkn entry must have both name and url");
      }
      patch.bkn = parsed;
    }
  }

  if ("channel" in raw) {
    patch.channel = parseChannelBlock(raw.channel);
  }

  return patch;
}

function parseCreateRequest(body: unknown): CreateDigitalHumanRequest {
  const raw = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : undefined;

  if (raw === undefined) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
    throw new HttpError(400, "name is required and must be a non-empty string");
  }

  let id: string | undefined;
  if ("id" in raw) {
    if (typeof raw.id !== "string" || raw.id.trim().length === 0) {
      throw new HttpError(400, "id must be a non-empty string when provided");
    }
    id = raw.id.trim();
  }

  return {
    id,
    name: raw.name.trim(),
    creature: parseOptionalString(raw.creature),
    icon_id: parseOptionalString(raw.icon_id),
    soul: parseOptionalString(raw.soul),
    skills: parseStringArray(raw.skills),
    bkn: parseBknArray(raw.bkn),
    channel: parseChannelBlock(raw.channel)
  };
}

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
 * Parses the comma-separated built-in digital human ids from the route path.
 *
 * @param idsParam Raw path parameter value.
 * @returns Unique, non-empty ids in request order.
 * @throws HttpError when no valid ids are provided.
 */
function parseBuiltInIdsParam(idsParam: string | string[] | undefined): string[] {
  const raw = Array.isArray(idsParam) ? idsParam[0] : idsParam;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new HttpError(400, "ids path parameter is required");
  }

  const ids = Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => decodeURIComponent(value).trim())
        .filter((value) => value.length > 0)
    )
  );

  if (ids.length === 0) {
    throw new HttpError(400, "ids path parameter must contain at least one built-in id");
  }

  return ids;
}

/**
 * Handler for PUT /digital-human/:id (partial update semantics).
 */
async function handleUpdateDigitalHuman(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = resolveIdParam(request.params.id);
    const patch = parseUpdateRequest(request.body);
    const result = await digitalHumanLogic.updateDigitalHuman(id, patch);

    response.status(200).json(result);
  } catch (error) {
    next(
      error instanceof HttpError
        ? error
        : new HttpError(
            502,
            error instanceof Error
              ? error.message
              : "Failed to update digital human"
          )
    );
  }
}

/**
 * Builds the digital human router.
 *
 * @returns The router exposing digital human endpoints.
 */
export function createDigitalHumanRouter(): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/digital-human/built-in",
    async (
      _request: Request,
      response: Response<BuiltInDigitalHumanList>,
      next: NextFunction
    ): Promise<void> => {
      try {
        response.status(200).json(await builtInDigitalHumanLogic.listBuiltInDigitalHumans());
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query built-in digital humans")
        );
      }
    }
  );

  router.put(
    "/api/dip-studio/v1/digital-human/built-in/:ids",
    async (
      request: Request,
      response: Response<CreateDigitalHumanResult[]>,
      next: NextFunction
    ): Promise<void> => {
      try {
        const ids = parseBuiltInIdsParam(request.params.ids);
        const result = await builtInDigitalHumanLogic.createBuiltInDigitalHumans(ids, {
          agentSkillsLogic,
          digitalHumanLogic
        });

        response.status(201).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(
                502,
                error instanceof Error
                  ? error.message
                  : "Failed to create built-in digital humans"
              )
        );
      }
    }
  );

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

  router.get(
    "/api/dip-studio/v1/digital-human/:id",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const id = resolveIdParam(request.params.id);
        const result = await digitalHumanLogic.getDigitalHuman(id);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to retrieve digital human detail")
        );
      }
    }
  );

  router.put(
    "/api/dip-studio/v1/digital-human/:id",
    handleUpdateDigitalHuman
  );

  router.post(
    "/api/dip-studio/v1/digital-human",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const createRequest = parseCreateRequest(request.body);
        const result = await digitalHumanLogic.createDigitalHuman(createRequest);

        response.status(201).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(
                502,
                error instanceof Error
                  ? error.message
                  : "Failed to create digital human"
              )
        );
      }
    }
  );

  router.delete(
    "/api/dip-studio/v1/digital-human/:id",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const id = resolveIdParam(request.params.id);
        const deleteFilesRaw = request.query.deleteFiles;
        const deleteFilesStr = typeof deleteFilesRaw === "string"
          ? deleteFilesRaw
          : undefined;
        const deleteFiles = deleteFilesStr !== undefined
          ? deleteFilesStr.toLowerCase() !== "false"
          : undefined;

        await digitalHumanLogic.deleteDigitalHuman(id, deleteFiles);

        response.status(204).end();
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to delete digital human")
        );
      }
    }
  );

  return router;
}

// ---------------------------------------------------------------------------
// Request parsing helpers
// ---------------------------------------------------------------------------

/**
 * @param value An unknown field from the request body.
 * @returns The trimmed string when non-empty, otherwise `undefined`.
 */
function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/**
 * @param value An unknown field expected to be a `string[]`.
 * @returns The filtered string array, or `undefined` when empty / invalid.
 */
function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const filtered = value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * @param value An unknown field expected to be a BknEntry[].
 * @returns Parsed BKN entries, or `undefined`.
 * @throws HttpError when an entry is missing required fields.
 */
function parseBknArray(value: unknown): BknEntry[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const entries: BknEntry[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const raw = item as Record<string, unknown>;
    const name = parseOptionalString(raw.name);
    const url = parseOptionalString(raw.url);
    if (!name || !url) {
      throw new HttpError(400, "Each bkn entry must have both name and url");
    }
    entries.push({ name, url });
  }
  return entries.length > 0 ? entries : undefined;
}

/**
 * @param value An unknown field expected to be the channel sub-object.
 * @returns Parsed channel config, or `undefined`.
 * @throws HttpError when the channel block is present but incomplete.
 */
function parseChannelBlock(value: unknown): ChannelConfig | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const appId = parseOptionalString(raw.appId);
  const appSecret = parseOptionalString(raw.appSecret);
  const type = parseChannelType(raw.type);

  if (!appId && !appSecret && type === undefined) {
    return undefined;
  }
  if (!appId || !appSecret) {
    throw new HttpError(
      400,
      "channel.appId and channel.appSecret are both required when channel is provided"
    );
  }

  return type !== undefined ? { type, appId, appSecret } : { appId, appSecret };
}

/**
 * @returns Parsed channel type, or `undefined` when the field is absent.
 * @throws HttpError when `type` is present but not a supported value.
 */
function parseChannelType(value: unknown): DigitalHumanChannelType | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, 'channel.type must be a string: "feishu" or "dingtalk"');
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed === "feishu" || trimmed === "dingtalk") {
    return trimmed;
  }
  throw new HttpError(400, 'channel.type must be "feishu" or "dingtalk"');
}
