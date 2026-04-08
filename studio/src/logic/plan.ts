import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { OpenClawCronAdapter } from "../adapters/openclaw-cron-adapter";
import { HttpError } from "../errors/http-error";
import type {
  DeleteCronJobCommand,
  GetCronJobCommand,
  GetPlanContentCommand,
  OpenClawCronListParams,
  OpenClawCronJob,
  OpenClawCronListResult,
  PlanContentResponse,
  OpenClawCronRemoveResult,
  OpenClawCronRunsParams,
  OpenClawCronRunsResult,
  UpdateCronJobCommand
} from "../types/plan";
import { parseSession } from "../utils/session";

const OWNERSHIP_SCAN_LIMIT = 200;

/**
 * Application logic used to fetch cron jobs and run history.
 */
export interface CronLogic {
  /**
   * Reads one cron job after ownership validation.
   *
   * @param command The read command.
   * @returns The owned cron job.
   */
  getCronJob(command: GetCronJobCommand): Promise<OpenClawCronJob>;

  /**
   * Fetches cron jobs with the requested filters.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The cron jobs list payload.
   */
  listCronJobs(params: OpenClawCronListParams): Promise<OpenClawCronListResult>;

  /**
   * Updates one cron job after ownership validation.
   *
   * @param command The update command.
   * @returns The updated cron job.
   */
  updateCronJob(command: UpdateCronJobCommand): Promise<OpenClawCronJob>;

  /**
   * Deletes one cron job after ownership validation.
   *
   * @param command The delete command.
   * @returns The OpenClaw remove result.
   */
  deleteCronJob(command: DeleteCronJobCommand): Promise<OpenClawCronRemoveResult>;

  /**
   * Reads one plan markdown file after ownership validation.
   *
   * @param command The read command.
   * @returns The normalized PLAN.md content.
   */
  getPlanContent(command: GetPlanContentCommand): Promise<PlanContentResponse>;

  /**
   * Fetches cron run history with the requested filters.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The cron runs payload.
   */
  listCronRuns(params: OpenClawCronRunsParams): Promise<OpenClawCronRunsResult>;
}

/**
 * Logic implementation backed by OpenClaw cron APIs.
 */
export class DefaultCronLogic implements CronLogic {
  /**
   * Creates the cron logic.
   *
   * @param openClawCronAdapter The adapter used to fetch OpenClaw cron data.
   * @param openClawWorkspaceDir The OpenClaw workspace root used to read PLAN.md.
   */
  public constructor(
    private readonly openClawCronAdapter: OpenClawCronAdapter,
    private readonly openClawWorkspaceDir: string
  ) {}

  /**
   * Reads one cron job from OpenClaw.
   *
   * @param command The read command.
   * @returns The owned cron job.
   */
  public async getCronJob(command: GetCronJobCommand): Promise<OpenClawCronJob> {
    return this.readOwnedJob(command.id, command.userId);
  }

  /**
   * Fetches cron jobs from OpenClaw.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The cron jobs list payload.
   */
  public async listCronJobs(
    params: OpenClawCronListParams
  ): Promise<OpenClawCronListResult> {
    const { userId, ...adapterParams } = params;
    const result = await this.openClawCronAdapter.listCronJobs(adapterParams);

    if (userId === undefined) {
      return result;
    }

    const jobs = result.jobs.filter((job) => hasMatchingSessionUserId(job, userId));

    return buildFilteredCronListResult(jobs);
  }

  /**
   * Updates one cron job in OpenClaw.
   *
   * @param command The update command.
   * @returns The updated cron job.
   */
  public async updateCronJob(
    command: UpdateCronJobCommand
  ): Promise<OpenClawCronJob> {
    await this.ensureJobOwnership(command.id, command.userId);

    return this.openClawCronAdapter.updateCronJob({
      id: command.id,
      patch: command.patch
    });
  }

  /**
   * Deletes one cron job from OpenClaw.
   *
   * @param command The delete command.
   * @returns The remove result payload.
   */
  public async deleteCronJob(
    command: DeleteCronJobCommand
  ): Promise<OpenClawCronRemoveResult> {
    await this.ensureJobOwnership(command.id, command.userId);

    return this.openClawCronAdapter.removeCronJob({
      id: command.id
    });
  }

  /**
   * Reads one plan markdown file from the OpenClaw workspace.
   *
   * @param command The read command.
   * @returns The normalized PLAN.md content.
   */
  public async getPlanContent(
    command: GetPlanContentCommand
  ): Promise<PlanContentResponse> {
    const job = await this.readOwnedJob(command.id, command.userId);
    const planPath = buildPlanMarkdownPath(this.openClawWorkspaceDir, job.sessionKey);

    try {
      const content = await readFile(planPath, "utf8");

      return {
        content
      };
    } catch (error) {
      throw normalizePlanContentReadError(error);
    }
  }

  /**
   * Fetches cron runs from OpenClaw.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The cron runs payload.
   */
  public async listCronRuns(
    params: OpenClawCronRunsParams
  ): Promise<OpenClawCronRunsResult> {
    return this.openClawCronAdapter.listCronRuns(params);
  }

  /**
   * Ensures the specified job belongs to the authenticated user when provided.
   *
   * @param jobId The target cron job identifier.
   * @param userId The authenticated user identifier.
   * @throws {HttpError} Thrown when the job is not accessible to the user.
   */
  private async ensureJobOwnership(
    jobId: string,
    userId: string | undefined
  ): Promise<void> {
    await this.readOwnedJob(jobId, userId);
  }

  /**
   * Reads one job and validates user ownership when user id is provided.
   *
   * @param jobId The target cron job identifier.
   * @param userId The authenticated user identifier.
   * @returns The owned cron job.
   * @throws {HttpError} Thrown when the job is not accessible to the user.
   */
  private async readOwnedJob(
    jobId: string,
    userId: string | undefined
  ): Promise<OpenClawCronJob> {
    let offset = 0;

    while (true) {
      const result = await this.openClawCronAdapter.listCronJobs({
        includeDisabled: true,
        limit: OWNERSHIP_SCAN_LIMIT,
        offset,
        enabled: "all",
        sortBy: "updatedAtMs",
        sortDir: "desc"
      });
      const job = result.jobs.find((entry) => entry.id === jobId);

      if (job !== undefined) {
        if (userId === undefined || hasMatchingSessionUserId(job, userId)) {
          return job;
        }
      }

      if (result.hasMore !== true || result.nextOffset === null) {
        break;
      }

      offset = result.nextOffset;
    }

    throw new HttpError(404, "Plan not found");
  }
}

/**
 * Builds the PLAN.md absolute path from one cron session key.
 *
 * @param workspaceDir The configured OpenClaw workspace root.
 * @param sessionKey The cron job session key.
 * @returns The absolute PLAN.md path.
 */
export function buildPlanMarkdownPath(
  workspaceDir: string,
  sessionKey: string
): string {
  const parsedSession = parseSession(sessionKey);

  if (parsedSession.agent === undefined || parsedSession.chatId === undefined) {
    throw new HttpError(404, "PLAN.md not found");
  }

  return join(workspaceDir, parsedSession.agent, "archives", parsedSession.chatId, "PLAN.md");
}

/**
 * Normalizes file-system read failures for PLAN.md.
 *
 * @param error The unknown filesystem error.
 * @returns A normalized HttpError instance.
 */
export function normalizePlanContentReadError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  ) {
    return new HttpError(404, "PLAN.md not found");
  }

  const message = error instanceof Error ? error.message : String(error);

  return new HttpError(502, `Failed to read PLAN.md: ${message}`);
}

/**
 * Returns whether the job session belongs to the requested user.
 *
 * @param job The cron job to inspect.
 * @param userId The authenticated user identifier.
 * @returns True when the session user id matches.
 */
function hasMatchingSessionUserId(job: OpenClawCronJob, userId: string): boolean {
  try {
    return parseSession(job.sessionKey).userId === userId;
  } catch {
    return false;
  }
}

/**
 * Rebuilds a cron list response after Studio-side filtering.
 *
 * @param jobs The filtered jobs.
 * @returns A normalized list result containing only the filtered jobs.
 */
function buildFilteredCronListResult(jobs: OpenClawCronJob[]): OpenClawCronListResult {
  return {
    jobs,
    total: jobs.length,
    offset: 0,
    limit: jobs.length,
    hasMore: false,
    nextOffset: null
  };
}
