import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";

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
  getSkillEntryName,
  matchesSkillEntry
} from "../logic/agent-skills";
import { deriveSkillIdFromUploadedFilename, isValidSkillSlug } from "../utils/skills";
import type { OpenClawSkillStatusEntry } from "../types/openclaw";

/** Maximum `.skill` upload size for Studio install route (bytes). */
const MAX_SKILL_INSTALL_BYTES = 32 * 1024 * 1024;

const skillInstallUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SKILL_INSTALL_BYTES }
});

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
 * Runs `multer.single("file")` and maps Multer errors to {@link HttpError}.
 *
 * @param req Incoming request.
 * @param res Outgoing response.
 * @param next Express next function.
 */
function handleSkillInstallUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  skillInstallUpload.single("file")(req, res, (err: unknown) => {
    if (err === undefined) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(
          new HttpError(
            413,
            `File exceeds maximum size of ${MAX_SKILL_INSTALL_BYTES} bytes`
          )
        );
        return;
      }
      next(new HttpError(400, err.message));
      return;
    }
    next(
      new HttpError(400, err instanceof Error ? err.message : String(err))
    );
  });
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
 * Reads `overwrite` from multipart text fields (`req.body` after multer).
 *
 * @param body Parsed `multipart/form-data` fields.
 * @returns Whether the client requested overwrite of an existing skill directory.
 */
function parseOverwriteFromMultipartBody(body: Request["body"]): boolean {
  const raw = body?.overwrite as unknown;
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    return v === "true" || v === "1";
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const v = String(raw[0]).trim().toLowerCase();
    return v === "true" || v === "1";
  }
  return false;
}

/**
 * Reads optional `name` from multipart fields (overrides filename-derived default).
 *
 * @param body Parsed `multipart/form-data` fields.
 * @returns Trimmed skill id, or `undefined` when absent or empty.
 */
function parseSkillSlugFromMultipartBody(body: Request["body"]): string | undefined {
  const raw = (body?.skillName ?? body?.name) as unknown;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length > 0 ? t : undefined;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const t = String(raw[0]).trim();
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

function parseSkillFilePathQuery(query: Request["query"]): string {
  const raw = query?.path as string | string[] | undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || value.trim().length === 0) {
    return "SKILL.md";
  }
  return value.trim();
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
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const nameParam = request.query?.name as string | string[] | undefined;
        const search = Array.isArray(nameParam) ? nameParam[0] : nameParam;
        const result = await agentSkillsLogic.listEnabledSkillsByQuery(search);

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
    "/api/dip-studio/v1/skills/:name/tree",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const raw = request.params.name;
        const name = decodeURIComponent(
          Array.isArray(raw) ? String(raw[0]) : String(raw ?? "")
        ).trim();

        if (!isValidSkillSlug(name)) {
          throw new HttpError(400, "Path parameter name must be a valid skill id");
        }

        const resolvedSkillPath = await agentSkillsLogic.resolveSkillPath(name);
        const result = await agentSkillsLogic.getSkillTree(name, resolvedSkillPath);
        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query skill tree")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/skills/:name/content",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const raw = request.params.name;
        const name = decodeURIComponent(
          Array.isArray(raw) ? String(raw[0]) : String(raw ?? "")
        ).trim();

        if (!isValidSkillSlug(name)) {
          throw new HttpError(400, "Path parameter name must be a valid skill id");
        }

        const filePath = parseSkillFilePathQuery(request.query);
        const resolvedSkillPath = await agentSkillsLogic.resolveSkillPath(name);
        const result = await agentSkillsLogic.getSkillContent(name, filePath, resolvedSkillPath);
        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query skill content")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/skills/:name/download",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const raw = request.params.name;
        const name = decodeURIComponent(
          Array.isArray(raw) ? String(raw[0]) : String(raw ?? "")
        ).trim();

        if (!isValidSkillSlug(name)) {
          throw new HttpError(400, "Path parameter name must be a valid skill id");
        }

        const filePath = parseSkillFilePathQuery(request.query);
        const resolvedSkillPath = await agentSkillsLogic.resolveSkillPath(name);
        const result = await agentSkillsLogic.downloadSkillFile(
          name,
          filePath,
          resolvedSkillPath
        );
        const contentType = result.headers.get("content-type");
        const contentDisposition = result.headers.get("content-disposition");

        if (contentType !== null) {
          response.setHeader("content-type", contentType);
        }
        if (contentDisposition !== null) {
          response.setHeader("content-disposition", contentDisposition);
        }

        response.status(result.status).send(Buffer.from(result.body));
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to download skill file")
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

  router.post(
    "/api/dip-studio/v1/skills/install",
    handleSkillInstallUpload,
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const overwrite = parseOverwriteFromMultipartBody(request.body);

        const file = request.file;
        if (file === undefined || file.buffer.length === 0) {
          throw new HttpError(
            400,
            "Multipart field `file` is required (non-empty .skill zip)"
          );
        }

        const explicitSlug = parseSkillSlugFromMultipartBody(request.body);
        const slug =
          explicitSlug ?? deriveSkillIdFromUploadedFilename(file.originalname);

        const result = await agentSkillsLogic.installSkill(file.buffer, {
          ...(overwrite ? { overwrite: true } : {}),
          ...(slug !== undefined ? { name: slug } : {})
        });

        const slugResult = result.name;
        let displayName = result.displayName ?? slugResult;
        if (result.displayName === undefined) {
          try {
            const matches = await agentSkillsLogic.listEnabledSkillsByQuery(slugResult);
            if (matches.length > 0) {
              displayName = matches[0]?.name ?? displayName;
            }
          } catch {
            // ignore errors; fallback to slug
          }
        }

        response.status(200).json({
          name: displayName,
          skillPath: result.skillPath
        });
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to install skill")
        );
      }
    }
  );

  router.delete(
    "/api/dip-studio/v1/skills/:name",
    async (
      request: Request,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const raw = request.params.name;
        const slug = decodeURIComponent(
          Array.isArray(raw) ? String(raw[0]) : String(raw ?? "")
        ).trim();

        if (!isValidSkillSlug(slug)) {
          throw new HttpError(400, "Path parameter name must be a valid skill id");
        }

        const deletableEntry = await resolveDeletableSkillEntry(slug);
        if (deletableEntry === undefined) {
          throw new HttpError(404, `Skill not found: ${slug}`);
        }

        if (!canDeleteSkillEntry(deletableEntry)) {
          throw new HttpError(403, "Skill can only be removed when source is openclaw-managed");
        }

        const result = await agentSkillsLogic.uninstallSkill(slug);
        response.status(200).json({ name: result.name });
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to uninstall skill")
        );
      }
    }
  );

  return router;
}

async function resolveDeletableSkillEntry(name: string): Promise<OpenClawSkillStatusEntry | undefined> {
  const statuses = await agentSkillsLogic.getSkillStatuses();
  const normalized = normalizeSkillId(name);
  if (normalized === undefined) {
    return undefined;
  }

  return statuses.find((entry) => matchesSkillEntry(entry, normalized));
}

function canDeleteSkillEntry(entry: OpenClawSkillStatusEntry): boolean {
  return entry.source?.trim().toLowerCase() === "openclaw-managed";
}

function normalizeSkillId(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.toLowerCase();
}
