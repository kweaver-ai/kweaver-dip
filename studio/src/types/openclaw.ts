/**
 * Matches the `AgentsListResult` schema from OpenClaw.
 */
export interface OpenClawAgentsListResult {
  /**
   * Default OpenClaw agent id.
   */
  defaultId: string;

  /**
   * Primary routing key used by OpenClaw.
   */
  mainKey: string;

  /**
   * Scope of agent routing.
   */
  scope: "global" | "per-sender";

  /**
   * Available agent summaries.
   */
  agents: Array<{
    /**
     * Stable OpenClaw agent identifier.
     */
    id: string;

    /**
     * Optional display name.
     */
    name?: string;

    /**
     * Optional identity block.
     */
    identity?: {
      /**
       * Human-readable display name.
       */
      name?: string;

      /**
       * Optional theme key used by OpenClaw UIs.
       */
      theme?: string;

      /**
       * Optional emoji marker for the agent.
       */
      emoji?: string;

      /**
       * Optional local avatar path.
       */
      avatar?: string;

      /**
       * Optional remote avatar URL.
       */
      avatarUrl?: string;
    };
  }>;
}

/**
 * Represents a request frame sent to the OpenClaw gateway.
 */
export interface OpenClawRequestFrame {
  /**
   * Frame type discriminator.
   */
  type: "req";

  /**
   * Correlation identifier.
   */
  id: string;

  /**
   * Gateway method name.
   */
  method: string;

  /**
   * Method parameters.
   */
  params?: unknown;
}

/**
 * Port used by adapters to execute JSON RPC calls against OpenClaw Gateway.
 */
export interface OpenClawGatewayPort {
  /**
   * Executes a JSON RPC call over the shared OpenClaw WebSocket connection.
   *
   * @param request The outbound JSON RPC request.
   * @returns The successful response payload.
   */
  invoke<T>(request: OpenClawRequestFrame): Promise<T>;
}

/**
 * Parameters used to provision an OpenClaw isolated agent.
 */
export interface OpenClawAgentAddParams {
  /**
   * Human-readable agent name.
   */
  name: string;

  /**
   * Agent workspace path or identifier forwarded to `--workspace`.
   */
  workspace: string;

  /**
   * Optional binding specs in `channel[:accountId]` format.
   */
  bind?: string[];
}
