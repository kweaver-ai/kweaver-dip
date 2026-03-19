import type {
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
 * Adapter that translates `listAgents` calls to OpenClaw Gateway JSON RPC.
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
}
