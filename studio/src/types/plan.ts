/**
 * Supported enabled filter values accepted by OpenClaw `cron.list`.
 */
export type CronListEnabledFilter = "all" | "enabled" | "disabled";

/**
 * Supported sort fields accepted by OpenClaw `cron.list`.
 */
export type CronListSortBy =
  | "nextRunAtMs"
  | "createdAtMs"
  | "updatedAtMs"
  | "name";

/**
 * Supported sort direction values accepted by OpenClaw `cron.list`.
 */
export type CronListSortDir = "asc" | "desc";

/**
 * Request payload sent to OpenClaw `cron.list`.
 */
export interface OpenClawCronListParams {
  /**
   * Whether disabled jobs should be included.
   */
  includeDisabled: boolean;

  /**
   * Maximum number of jobs to return.
   */
  limit: number;

  /**
   * Zero-based list offset.
   */
  offset: number;

  /**
   * Enabled-state filter.
   */
  enabled: CronListEnabledFilter;

  /**
   * Sort field.
   */
  sortBy: CronListSortBy;

  /**
   * Sort direction.
   */
  sortDir: CronListSortDir;

  /**
   * Authenticated user identifier used by Studio-side filtering.
   */
  userId?: string;
}

/**
 * Cron schedule definition for a job.
 */
export interface OpenClawCronJobSchedule {
  /**
   * Schedule kind.
   */
  kind?: string;

  /**
   * One-off execution timestamp represented as an ISO string.
   */
  at?: string;

  /**
   * Fixed interval in milliseconds.
   */
  everyMs?: number;

  /**
   * Optional interval anchor timestamp in milliseconds.
   */
  anchorMs?: number;

  /**
   * Cron expression.
   */
  expr?: string;

  /**
   * Timezone used to evaluate the cron expression.
   */
  tz?: string;
}

/**
 * Plan update body exposed by Studio.
 */
export interface UpdatePlanRequest {
  /**
   * Updated display name.
   */
  name?: string;

  /**
   * Updated enabled flag.
   */
  enabled?: boolean;
}

/**
 * Cron job update body expected by OpenClaw.
 */
export interface OpenClawCronUpdatePatch {
  /**
   * Updated display name.
   */
  name?: string;

  /**
   * Updated enabled flag.
   */
  enabled?: boolean;
}

/**
 * Request payload sent to OpenClaw `cron.update`.
 */
export interface OpenClawCronUpdateParams {
  /**
   * Stable job identifier.
   */
  id?: string;

  /**
   * Alternative stable job identifier.
   */
  jobId?: string;

  /**
   * Cron job update body expected by OpenClaw.
   */
  patch: OpenClawCronUpdatePatch;
}

/**
 * Request payload sent to OpenClaw `cron.remove`.
 */
export interface OpenClawCronRemoveParams {
  /**
   * Stable job identifier.
   */
  id?: string;

  /**
   * Alternative stable job identifier.
   */
  jobId?: string;
}

/**
 * Response payload returned by OpenClaw `cron.remove`.
 */
export interface OpenClawCronRemoveResult {
  /**
   * Whether one job was removed.
   */
  removed: boolean;

  /**
   * Removed job identifier.
   */
  id?: string;

  /**
   * Removed job identifier alias.
   */
  jobId?: string;

  /**
   * Removed job snapshot when provided upstream.
   */
  job?: OpenClawCronJob;
}

/**
 * Plan update command accepted by application logic.
 */
export interface UpdateCronJobCommand {
  /**
   * Stable job identifier.
   */
  id: string;

  /**
   * Plan update body.
   */
  patch: UpdatePlanRequest;

  /**
   * Optional authenticated user identifier.
   */
  userId?: string;
}

/**
 * Plan delete or disable command accepted by application logic.
 */
export interface DeleteCronJobCommand {
  /**
   * Stable job identifier.
   */
  id: string;

  /**
   * Optional authenticated user identifier.
   */
  userId?: string;
}

/**
 * Plan content read command accepted by application logic.
 */
export interface GetPlanContentCommand {
  /**
   * Stable job identifier.
   */
  id: string;

  /**
   * Optional authenticated user identifier.
   */
  userId?: string;
}

/**
 * Plan read command accepted by application logic.
 */
export interface GetCronJobCommand {
  /**
   * Stable job identifier.
   */
  id: string;

  /**
   * Optional authenticated user identifier.
   */
  userId?: string;
}

/**
 * Response payload returned by the plan content endpoint.
 */
export interface PlanContentResponse {
  /**
   * Raw PLAN.md content.
   */
  content: string;
}

/**
 * Runtime state exposed by OpenClaw for a cron job.
 */
export interface OpenClawCronJobState {
  /**
   * Next execution timestamp in milliseconds.
   */
  nextRunAtMs?: number;

  /**
   * Last execution timestamp in milliseconds.
   */
  lastRunAtMs?: number;

  /**
   * Last run status code.
   */
  lastRunStatus?: string;

  /**
   * Last aggregated status.
   */
  lastStatus?: string;

  /**
   * Duration of last run in milliseconds.
   */
  lastDurationMs?: number;

  /**
   * Last run error text.
   */
  lastError?: string;

  /**
   * Consecutive error count.
   */
  consecutiveErrors?: number;

  /**
   * Whether the last run was delivered.
   */
  lastDelivered?: boolean;

  /**
   * Delivery status of the last run.
   */
  lastDeliveryStatus?: string;

  /**
   * Timestamp indicating an active run in progress.
   */
  runningAtMs?: number;
}

/**
 * Job item returned by OpenClaw `cron.list`.
 */
export interface OpenClawCronJob {
  /**
   * Stable job identifier.
   */
  id: string;

  /**
   * Agent identifier owning the job.
   */
  agentId: string;

  /**
   * Session key used for execution context.
   */
  sessionKey: string;

  /**
   * Display name of the job.
   */
  name: string;

  /**
   * Whether the job is enabled.
   */
  enabled: boolean;

  /**
   * Creation timestamp in milliseconds.
   */
  createdAtMs: number;

  /**
   * Update timestamp in milliseconds.
   */
  updatedAtMs: number;

  /**
   * Schedule definition.
   */
  schedule: OpenClawCronJobSchedule;

  /**
   * Session target type.
   */
  sessionTarget?: string;

  /**
   * Wake mode used by scheduler.
   */
  wakeMode?: string;

  /**
   * Job payload forwarded to execution engine.
   */
  payload?: unknown;

  /**
   * Delivery settings.
   */
  delivery?: unknown;

  /**
   * Runtime state.
   */
  state?: OpenClawCronJobState;

  /**
   * Whether to delete job after run.
   */
  deleteAfterRun?: boolean;
}

/**
 * Response payload returned by OpenClaw `cron.list`.
 */
export interface OpenClawCronListResult {
  /**
   * Returned jobs.
   */
  jobs: OpenClawCronJob[];

  /**
   * Total jobs matching the filter.
   */
  total: number;

  /**
   * Current offset.
   */
  offset: number;

  /**
   * Current page size.
   */
  limit: number;

  /**
   * Whether additional pages exist.
   */
  hasMore: boolean;

  /**
   * Next offset when additional pages exist.
   */
  nextOffset: number | null;
}

/**
 * Supported sort direction values accepted by OpenClaw `cron.runs`.
 */
export type CronRunsSortDir = "asc" | "desc";

/**
 * Request payload sent to OpenClaw `cron.runs`.
 */
export interface OpenClawCronRunsParams {
  /**
   * Cron job identifier.
   */
  id: string;

  /**
   * Maximum number of run entries to return.
   */
  limit: number;

  /**
   * Zero-based list offset.
   */
  offset: number;

  /**
   * Sort direction.
   */
  sortDir: CronRunsSortDir;
}

/**
 * Run history entry returned by OpenClaw `cron.runs`.
 */
export interface OpenClawCronRunEntry {
  /**
   * Entry timestamp in milliseconds.
   */
  ts: number;

  /**
   * Task id associated with the run.
   */
  jobId: string;

  /**
   * Run action label.
   */
  action: string;

  /**
   * Run status.
   */
  status: string;

  /**
   * Optional run error.
   */
  error?: string;

  /**
   * Optional run summary.
   */
  summary?: string;

  /**
   * Run start timestamp in milliseconds.
   */
  runAtMs?: number;

  /**
   * Run duration in milliseconds.
   */
  durationMs?: number;

  /**
   * Next run timestamp in milliseconds.
   */
  nextRunAtMs?: number;

  /**
   * Model identifier used by the run.
   */
  model?: string;

  /**
   * Provider identifier used by the run.
   */
  provider?: string;

  /**
   * Whether the run output was delivered.
   */
  delivered?: boolean;

  /**
   * Delivery status for the run.
   */
  deliveryStatus?: string;

  /**
   * Session id associated with the run.
   */
  sessionId?: string;

  /**
   * Session key associated with the run.
   */
  sessionKey?: string;

  /**
   * Job name associated with the run.
   */
  jobName?: string;
}

/**
 * Response payload returned by OpenClaw `cron.runs`.
 */
export interface OpenClawCronRunsResult {
  /**
   * Returned run entries.
   */
  entries: OpenClawCronRunEntry[];

  /**
   * Total entries matching the filter.
   */
  total: number;

  /**
   * Current offset.
   */
  offset: number;

  /**
   * Current page size.
   */
  limit: number;

  /**
   * Whether additional pages exist.
   */
  hasMore: boolean;

  /**
   * Next offset when additional pages exist.
   */
  nextOffset: number | null;
}
