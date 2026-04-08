import type {
  OpenClawGatewayPort,
  OpenClawRequestFrame
} from "../types/openclaw";
import type {
  OpenClawCronListParams,
  OpenClawCronListResult,
  OpenClawCronRemoveParams,
  OpenClawCronRemoveResult,
  OpenClawCronRunsParams,
  OpenClawCronRunsResult,
  OpenClawCronUpdateParams,
  OpenClawCronJob
} from "../types/plan";

/**
 * Outbound adapter used to fetch OpenClaw cron data through the gateway port.
 */
export interface OpenClawCronAdapter {
  /**
   * Fetches cron jobs using OpenClaw `cron.list`.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw cron jobs list payload.
   */
  listCronJobs(params: OpenClawCronListParams): Promise<OpenClawCronListResult>;

  /**
   * Updates one cron job using OpenClaw `cron.update`.
   *
   * @param params Update parameters forwarded to OpenClaw.
   * @returns The updated cron job payload.
   */
  updateCronJob(params: OpenClawCronUpdateParams): Promise<OpenClawCronJob>;

  /**
   * Removes one cron job using OpenClaw `cron.remove`.
   *
   * @param params Delete parameters forwarded to OpenClaw.
   * @returns The remove result payload.
   */
  removeCronJob(params: OpenClawCronRemoveParams): Promise<OpenClawCronRemoveResult>;

  /**
   * Fetches cron run history using OpenClaw `cron.runs`.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw cron runs payload.
   */
  listCronRuns(params: OpenClawCronRunsParams): Promise<OpenClawCronRunsResult>;
}

/**
 * Creates the OpenClaw `cron.list` request.
 *
 * @param requestId The frame correlation id.
 * @param params Query parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createCronListRequest(
  requestId: string,
  params: OpenClawCronListParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "cron.list",
    params
  };
}

/**
 * Creates the OpenClaw `cron.runs` request.
 *
 * @param requestId The frame correlation id.
 * @param params Query parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createCronRunsRequest(
  requestId: string,
  params: OpenClawCronRunsParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "cron.runs",
    params: {
      id: params.id,
      limit: params.limit,
      offset: params.offset,
      sortDir: params.sortDir
    }
  };
}

/**
 * Creates the OpenClaw `cron.update` request.
 *
 * @param requestId The frame correlation id.
 * @param params Update parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createCronUpdateRequest(
  requestId: string,
  params: OpenClawCronUpdateParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "cron.update",
    params
  };
}

/**
 * Creates the OpenClaw `cron.remove` request.
 *
 * @param requestId The frame correlation id.
 * @param params Delete parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createCronRemoveRequest(
  requestId: string,
  params: OpenClawCronRemoveParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "cron.remove",
    params
  };
}

/**
 * Adapter that translates cron queries to OpenClaw Gateway JSON RPC.
 */
export class OpenClawCronGatewayAdapter implements OpenClawCronAdapter {
  /**
   * Creates the adapter.
   *
   * @param gatewayPort The OpenClaw Gateway RPC port.
   */
  public constructor(private readonly gatewayPort: OpenClawGatewayPort) {}

  /**
   * Queries `cron.list` over the gateway RPC port.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw cron jobs list payload.
   */
  public async listCronJobs(
    params: OpenClawCronListParams
  ): Promise<OpenClawCronListResult> {
    return this.gatewayPort.invoke<OpenClawCronListResult>(
      createCronListRequest("cron.list", params)
    );
  }

  /**
   * Queries `cron.update` over the gateway RPC port.
   *
   * @param params Update parameters forwarded to OpenClaw.
   * @returns The updated cron job payload.
   */
  public async updateCronJob(
    params: OpenClawCronUpdateParams
  ): Promise<OpenClawCronJob> {
    return this.gatewayPort.invoke<OpenClawCronJob>(
      createCronUpdateRequest("cron.update", params)
    );
  }

  /**
   * Queries `cron.remove` over the gateway RPC port.
   *
   * @param params Delete parameters forwarded to OpenClaw.
   * @returns The remove result payload.
   */
  public async removeCronJob(
    params: OpenClawCronRemoveParams
  ): Promise<OpenClawCronRemoveResult> {
    return this.gatewayPort.invoke<OpenClawCronRemoveResult>(
      createCronRemoveRequest("cron.remove", params)
    );
  }

  /**
   * Queries `cron.runs` over the gateway RPC port.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw cron runs payload.
   */
  public async listCronRuns(
    params: OpenClawCronRunsParams
  ): Promise<OpenClawCronRunsResult> {
    return this.gatewayPort.invoke<OpenClawCronRunsResult>(
      createCronRunsRequest("cron.runs", params)
    );
  }
}
