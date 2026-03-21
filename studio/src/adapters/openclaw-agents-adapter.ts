import type {
  OpenClawAgentAddParams,
  OpenClawAgentsListResult,
  OpenClawGatewayPort,
  OpenClawRequestFrame
} from "../types/openclaw";

/**
 * Outbound adapter used to fetch OpenClaw agents through the gateway port.
 */
export interface OpenClawAgentsAdapter {
  /**
   * Fetches the current OpenClaw agent list.
   *
   * @returns The OpenClaw `AgentsListResult` payload.
   */
  listAgents(): Promise<OpenClawAgentsListResult>;

  /**
   * Provisions an OpenClaw isolated agent.
   *
   * @param params The normalized agent creation parameters.
   * @returns Nothing when the agent has been created successfully.
   */
  addAgent(params: OpenClawAgentAddParams): Promise<void>;
}

/**
 * Creates the OpenClaw `agents.list` request.
 *
 * @param requestId The frame correlation id.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsListRequest(
  requestId: string
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "agents.list",
    params: {}
  };
}

/**
 * Creates the OpenClaw `agents.create` request.
 *
 * @param requestId The frame correlation id.
 * @param params The normalized agent creation parameters.
 * @returns A serialized OpenClaw request frame.
 */
export function createAgentsAddRequest(
  requestId: string,
  params: OpenClawAgentAddParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "agents.create",
    params
  };
}

/**
 * Adapter that translates digital human agent calls to OpenClaw Gateway JSON RPC.
 */
export class OpenClawAgentsGatewayAdapter implements OpenClawAgentsAdapter {
  /**
   * Creates the adapter.
   *
   * @param gatewayPort The OpenClaw Gateway RPC port.
   */
  public constructor(private readonly gatewayPort: OpenClawGatewayPort) {}

  /**
   * Queries `agents.list` over the gateway RPC port.
   *
   * @returns The OpenClaw `AgentsListResult` payload.
   */
  public async listAgents(): Promise<OpenClawAgentsListResult> {
    return this.gatewayPort.invoke<OpenClawAgentsListResult>(
      createAgentsListRequest("agents.list")
    );
  }

  /**
   * Sends `agents.create` over the gateway RPC port.
   *
   * @param params The normalized agent creation parameters.
   * @returns Nothing when the request succeeds.
   */
  public async addAgent(params: OpenClawAgentAddParams): Promise<void> {
    await this.gatewayPort.invoke(
      createAgentsAddRequest("agents.create", params)
    );
  }
}
