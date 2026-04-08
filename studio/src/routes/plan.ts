import { Router, type NextFunction, type Request, type Response } from "express";

import { OpenClawCronGatewayAdapter } from "../adapters/openclaw-cron-adapter";
import { getEnv } from "../utils/env";
import { HttpError } from "../errors/http-error";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import { readAuthenticatedUserId } from "../middleware/hydra-auth";
import { DefaultCronLogic, type CronLogic } from "../logic/plan";
import type {
  CronListEnabledFilter,
  CronListSortBy,
  CronListSortDir,
  DeleteCronJobCommand,
  OpenClawCronListResult,
  PlanContentResponse,
  CronRunsSortDir,
  OpenClawCronListParams,
  OpenClawCronRunsParams,
  UpdateCronJobCommand,
  UpdatePlanRequest
} from "../types/plan";

/**
 * Supported query fields for cron jobs list endpoint.
 */
export interface CronJobListQuery {
  /**
   * Include disabled jobs when true.
   */
  includeDisabled?: string;

  /**
   * Maximum page size.
   */
  limit?: string;

  /**
   * Zero-based page offset.
   */
  offset?: string;

  /**
   * Enabled-state filter.
   */
  enabled?: string;

  /**
   * Sort field.
   */
  sortBy?: string;

  /**
   * Sort direction.
   */
  sortDir?: string;
}

/**
 * Supported query fields for cron runs endpoint.
 */
export interface CronRunListQuery {
  /**
   * Job id filter.
   */
  id?: string | string[];

  /**
   * Maximum page size.
   */
  limit?: string | string[];

  /**
   * Zero-based page offset.
   */
  offset?: string | string[];

  /**
   * Sort direction.
   */
  sortDir?: string | string[];
}

/**
 * Path parameters for digital human plans endpoints.
 */
export interface DigitalHumanPlansParams {
  /**
   * Digital human identifier.
   */
  id: string;
}

/**
 * Path parameters for plan runs endpoint.
 */
export interface PlanRunsParams {
  /**
   * Plan identifier.
   */
  id: string;
}

/**
 * Path parameters for plan mutation endpoints.
 */
export interface PlanParams {
  /**
   * Plan identifier.
   */
  id: string;
}

const MAX_LIMIT = 200;
const env = getEnv();
const cronLogic = new DefaultCronLogic(
  new OpenClawCronGatewayAdapter(
    OpenClawGatewayClient.getInstance({
      url: env.openClawGatewayUrl,
      token: env.openClawGatewayToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    })
  ),
  env.openClawWorkspaceDir
);

/**
 * Builds the cron router.
 *
 * @param logic Optional cron logic implementation.
 * @returns The router exposing cron endpoints.
 */
export function createCronRouter(logic: CronLogic = cronLogic): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/plans",
    async (
      request: Request<unknown, unknown, unknown, CronJobListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const query = {
          ...readCronJobListQuery(request.query),
          userId: readAuthenticatedUserId(request)
        };
        const result = await logic.listCronJobs(query);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query cron jobs")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/digital-human/:id/plans",
    async (
      request: Request<DigitalHumanPlansParams, unknown, unknown, CronJobListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const query = {
          ...readCronJobListQuery(request.query),
          userId: readAuthenticatedUserId(request)
        };
        const result = await logic.listCronJobs(query);

        response.status(200).json(filterCronJobsByAgentId(result, request.params.id));
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query digital human plans")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/plans/:id",
    async (
      request: Request<PlanParams, unknown, unknown>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const result = await logic.getCronJob({
          id: request.params.id,
          userId: readAuthenticatedUserId(request)
        });

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to read plan")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/plans/:id/content",
    async (
      request: Request<PlanParams, PlanContentResponse, unknown>,
      response: Response<PlanContentResponse>,
      next: NextFunction
    ): Promise<void> => {
      try {
        const result = await logic.getPlanContent({
          id: request.params.id,
          userId: readAuthenticatedUserId(request)
        });

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to read plan content")
        );
      }
    }
  );

  router.get(
    "/api/dip-studio/v1/plans/:id/runs",
    async (
      request: Request<PlanRunsParams, unknown, unknown, CronRunListQuery>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const query = readCronRunListQuery({
          ...request.query,
          id: request.params.id
        });
        const result = await logic.listCronRuns(query);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query plan runs")
        );
      }
    }
  );

  router.put(
    "/api/dip-studio/v1/plans/:id",
    async (
      request: Request<PlanParams, unknown, unknown>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const command: UpdateCronJobCommand = {
          id: request.params.id,
          patch: readUpdatePlanRequest(request.body),
          userId: readAuthenticatedUserId(request)
        };
        const result = await logic.updateCronJob(command);

        response.status(200).json(result);
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to update plan")
        );
      }
    }
  );

  router.delete(
    "/api/dip-studio/v1/plans/:id",
    async (
      request: Request<PlanParams, unknown, unknown>,
      response: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const command: DeleteCronJobCommand = {
          id: request.params.id,
          userId: readAuthenticatedUserId(request)
        };

        await logic.deleteCronJob(command);

        response.status(204).send();
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to delete plan")
        );
      }
    }
  );

  return router;
}

/**
 * Parses and validates one plan update request body.
 *
 * @param body The raw request body.
 * @returns The validated update request payload.
 * @throws {HttpError} Thrown when the body is invalid.
 */
export function readUpdatePlanRequest(body: unknown): UpdatePlanRequest {
  const raw = typeof body === "object" && body !== null
    ? body as Record<string, unknown>
    : undefined;

  if (raw === undefined) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const allowedKeys = ["name", "enabled"];
  const keys = Object.keys(raw);

  if (keys.length === 0 || keys.some((key) => !allowedKeys.includes(key))) {
    throw new HttpError(400, "Request body must contain only `name` and/or `enabled`");
  }

  const updateRequest: UpdatePlanRequest = {};

  if ("name" in raw) {
    if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
      throw new HttpError(400, "name must be a non-empty string when provided");
    }

    updateRequest.name = raw.name.trim();
  }

  if ("enabled" in raw) {
    if (typeof raw.enabled !== "boolean") {
      throw new HttpError(400, "enabled must be a boolean when provided");
    }

    updateRequest.enabled = raw.enabled;
  }

  return updateRequest;
}

/**
 * Parses and validates cron jobs list query parameters.
 *
 * @param query Raw query string values.
 * @returns Parsed `cron.list` parameters.
 */
export function readCronJobListQuery(query: CronJobListQuery): OpenClawCronListParams {
  return {
    includeDisabled: parseBooleanQueryValue(query.includeDisabled, true, "includeDisabled"),
    limit: parseNonNegativeIntegerString(query.limit, 50, "limit"),
    offset: parseNonNegativeIntegerString(query.offset, 0, "offset"),
    enabled: parseCronJobEnabled(query.enabled),
    sortBy: parseCronJobSortBy(query.sortBy),
    sortDir: parseCronJobSortDir(query.sortDir)
  };
}

/**
 * Filters one cron jobs result to the specified digital human.
 *
 * @param result The cron jobs result already filtered for the authenticated user.
 * @param agentId The target digital human identifier.
 * @returns A normalized result containing only the requested digital human jobs.
 */
function filterCronJobsByAgentId(
  result: OpenClawCronListResult,
  agentId: string
): OpenClawCronListResult {
  const jobs = result.jobs.filter((job) => job.agentId === agentId);

  return {
    ...result,
    jobs,
    total: jobs.length,
    offset: 0,
    limit: jobs.length,
    hasMore: false,
    nextOffset: null
  };
}

/**
 * Parses and validates cron runs query parameters.
 *
 * @param query Raw query string values.
 * @returns Parsed `cron.runs` parameters.
 */
export function readCronRunListQuery(query: CronRunListQuery): OpenClawCronRunsParams {
  const id = parseOptionalSingleQueryValue(query.id, "id");
  if (id === undefined) {
    throw new HttpError(400, "Invalid query parameter `id`");
  }

  const limit = parseNonNegativeIntegerQueryValue(query.limit, 50, "limit");

  if (limit > MAX_LIMIT) {
    throw new HttpError(400, "Invalid query parameter `limit`");
  }

  return {
    id,
    limit,
    offset: parseNonNegativeIntegerQueryValue(query.offset, 0, "offset"),
    sortDir: parseCronRunSortDir(query.sortDir)
  };
}

/**
 * Parses a boolean query value.
 *
 * @param rawValue Raw query value.
 * @param defaultValue Fallback value when omitted.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed boolean value.
 */
export function parseBooleanQueryValue(
  rawValue: string | undefined,
  defaultValue: boolean,
  fieldName: string
): boolean {
  if (rawValue === undefined) {
    return defaultValue;
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
}

/**
 * Parses a non-negative integer query string.
 *
 * @param rawValue Raw query value.
 * @param defaultValue Fallback value when omitted.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed non-negative integer value.
 */
export function parseNonNegativeIntegerString(
  rawValue: string | undefined,
  defaultValue: number,
  fieldName: string
): number {
  if (rawValue === undefined) {
    return defaultValue;
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
  }

  return Number(rawValue);
}

/**
 * Parses cron job enabled filter.
 *
 * @param rawValue Raw query value.
 * @returns Parsed enabled filter.
 */
export function parseCronJobEnabled(rawValue: string | undefined): CronListEnabledFilter {
  return parseStringEnum(
    rawValue,
    "all",
    ["all", "enabled", "disabled"],
    "enabled"
  );
}

/**
 * Parses cron job sort field.
 *
 * @param rawValue Raw query value.
 * @returns Parsed sort field.
 */
export function parseCronJobSortBy(rawValue: string | undefined): CronListSortBy {
  return parseStringEnum(
    rawValue,
    "nextRunAtMs",
    ["nextRunAtMs", "createdAtMs", "updatedAtMs", "name"],
    "sortBy"
  );
}

/**
 * Parses cron job sort direction.
 *
 * @param rawValue Raw query value.
 * @returns Parsed sort direction.
 */
export function parseCronJobSortDir(rawValue: string | undefined): CronListSortDir {
  return parseStringEnum(rawValue, "asc", ["asc", "desc"], "sortDir");
}

/**
 * Parses a non-negative integer query value.
 *
 * @param rawValue Raw query value.
 * @param defaultValue Fallback value when omitted.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed non-negative integer.
 */
export function parseNonNegativeIntegerQueryValue(
  rawValue: string | string[] | undefined,
  defaultValue: number,
  fieldName: string
): number {
  const normalized = parseOptionalSingleQueryValue(rawValue, fieldName);

  if (normalized === undefined) {
    return defaultValue;
  }

  if (!/^\d+$/.test(normalized)) {
    throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
  }

  return Number(normalized);
}

/**
 * Parses cron run sort direction.
 *
 * @param rawValue Raw query value.
 * @returns Parsed sort direction.
 */
export function parseCronRunSortDir(
  rawValue: string | string[] | undefined
): CronRunsSortDir {
  return parseQueryEnum(rawValue, "desc", ["asc", "desc"], "sortDir");
}

/**
 * Parses a single optional query value.
 *
 * @param rawValue Raw query value.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed value or undefined.
 */
export function parseOptionalSingleQueryValue(
  rawValue: string | string[] | undefined,
  fieldName: string
): string | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  if (Array.isArray(rawValue)) {
    if (rawValue.length !== 1) {
      throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
    }

    return rawValue[0];
  }

  return rawValue;
}

/**
 * Parses a comma-separated or repeated query value into string items.
 *
 * @param rawValue Raw query value.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed string list.
 */
export function parseQueryStringList(
  rawValue: string | string[] | undefined,
  fieldName: string
): string[] | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const sourceValues = Array.isArray(rawValue) ? rawValue : [rawValue];
  const values = sourceValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
  }

  return values;
}

/**
 * Parses enum list query values.
 *
 * @param rawValue Raw query value.
 * @param allowedValues Allowed values set.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed enum value list.
 */
export function parseQueryEnumList<T extends string>(
  rawValue: string | string[] | undefined,
  allowedValues: T[],
  fieldName: string
): T[] | undefined {
  const values = parseQueryStringList(rawValue, fieldName);

  if (values === undefined) {
    return undefined;
  }

  for (const value of values) {
    if (!allowedValues.includes(value as T)) {
      throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
    }
  }

  return values as T[];
}

/**
 * Parses enum query values with array support.
 *
 * @param rawValue Raw query value.
 * @param defaultValue Fallback value when omitted.
 * @param allowedValues Allowed values set.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed enum value.
 */
export function parseQueryEnum<T extends string>(
  rawValue: string | string[] | undefined,
  defaultValue: T,
  allowedValues: T[],
  fieldName: string
): T {
  const value = parseOptionalSingleQueryValue(rawValue, fieldName);

  if (value === undefined) {
    return defaultValue;
  }

  if (!allowedValues.includes(value as T)) {
    throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
  }

  return value as T;
}

/**
 * Parses enum query values from a plain string.
 *
 * @param rawValue Raw query value.
 * @param defaultValue Fallback value when omitted.
 * @param allowedValues Allowed values set.
 * @param fieldName Field name used in validation messages.
 * @returns Parsed enum value.
 */
export function parseStringEnum<T extends string>(
  rawValue: string | undefined,
  defaultValue: T,
  allowedValues: T[],
  fieldName: string
): T {
  if (rawValue === undefined) {
    return defaultValue;
  }

  if (!allowedValues.includes(rawValue as T)) {
    throw new HttpError(400, `Invalid query parameter \`${fieldName}\``);
  }

  return rawValue as T;
}
