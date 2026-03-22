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
 * Parameters for the `agents.create` OpenClaw RPC method.
 */
export interface OpenClawAgentsCreateParams {
  /**
   * Display name for the new agent.
   */
  name: string;

  /**
   * Workspace directory path for the new agent.
   */
  workspace: string;

  /**
   * Optional emoji marker for the agent.
   */
  emoji?: string;

  /**
   * Optional avatar identifier for the agent.
   */
  avatar?: string;
}

/**
 * Matches the `AgentsCreateResult` schema from OpenClaw.
 */
export interface OpenClawAgentsCreateResult {
  /**
   * Indicates whether the creation succeeded.
   */
  ok: boolean;

  /**
   * Stable identifier assigned to the newly created agent.
   */
  agentId: string;

  /**
   * Display name of the created agent.
   */
  name: string;

  /**
   * Workspace directory of the created agent.
   */
  workspace: string;
}

/**
 * Parameters for the `agents.delete` OpenClaw RPC method.
 */
export interface OpenClawAgentsDeleteParams {
  /**
   * Identifier of the agent to delete.
   */
  agentId: string;

  /**
   * Whether to delete workspace files along with the agent. Defaults to `true`.
   */
  deleteFiles?: boolean;
}

/**
 * Matches the `AgentsDeleteResult` schema from OpenClaw.
 */
export interface OpenClawAgentsDeleteResult {
  /**
   * Indicates whether the deletion succeeded.
   */
  ok: boolean;

  /**
   * Identifier of the deleted agent.
   */
  agentId: string;

  /**
   * Number of session bindings removed alongside the agent.
   */
  removedBindings: number;
}

/**
 * Parameters for the `agents.files.list` OpenClaw RPC method.
 */
export interface OpenClawAgentsFilesListParams {
  /**
   * Identifier of the agent whose workspace files to list.
   */
  agentId: string;
}

/**
 * One file entry returned by `agents.files.list`.
 */
export interface OpenClawAgentFileListItem {
  /**
   * Workspace-relative filename.
   */
  name: string;

  /**
   * Absolute path on disk when provided by the gateway.
   */
  path?: string;

  /**
   * File size in bytes when present.
   */
  size?: number;

  /**
   * Last modification time in epoch milliseconds when present.
   */
  updatedAtMs?: number;
}

/**
 * Matches the `agents.files.list` result schema from OpenClaw.
 */
export interface OpenClawAgentsFilesListResult {
  /**
   * Agent identifier.
   */
  agentId: string;

  /**
   * Workspace directory path when provided by the gateway.
   */
  workspace?: string;

  /**
   * Listed workspace files.
   */
  files: OpenClawAgentFileListItem[];
}

/**
 * Parameters for the `agents.files.get` OpenClaw RPC method.
 */
export interface OpenClawAgentsFilesGetParams {
  /**
   * Identifier of the agent whose file to read.
   */
  agentId: string;

  /**
   * Workspace filename to read (e.g. "IDENTITY.md", "SOUL.md").
   */
  name: string;
}

/**
 * File metadata returned by `agents.files.get` and `agents.files.set`.
 */
export interface OpenClawAgentFile {
  /**
   * Workspace filename.
   */
  name: string;

  /**
   * Absolute path on disk.
   */
  path: string;

  /**
   * Whether the file is missing from disk.
   */
  missing: boolean;

  /**
   * File size in bytes when present.
   */
  size?: number;

  /**
   * Last modification timestamp in epoch milliseconds.
   */
  updatedAtMs?: number;

  /**
   * UTF-8 content of the file.
   */
  content?: string;
}

/**
 * Matches the `agents.files.get` result schema from OpenClaw.
 */
export interface OpenClawAgentsFilesGetResult {
  /**
   * Agent identifier.
   */
  agentId: string;

  /**
   * Workspace directory path.
   */
  workspace: string;

  /**
   * The retrieved file metadata and content.
   */
  file: OpenClawAgentFile;
}

/**
 * Parameters for the `agents.files.set` OpenClaw RPC method.
 */
export interface OpenClawAgentsFilesSetParams {
  /**
   * Identifier of the agent whose file to write.
   */
  agentId: string;

  /**
   * Workspace filename to write (e.g. "IDENTITY.md", "SOUL.md").
   */
  name: string;

  /**
   * UTF-8 content to write to the file.
   */
  content: string;
}

/**
 * Matches the `agents.files.set` result schema from OpenClaw.
 */
export interface OpenClawAgentsFilesSetResult {
  /**
   * Indicates whether the write succeeded.
   */
  ok: boolean;

  /**
   * Agent identifier.
   */
  agentId: string;

  /**
   * Workspace directory path.
   */
  workspace: string;

  /**
   * The written file metadata and content.
   */
  file: OpenClawAgentFile;
}

/**
 * Matches the `config.get` result schema from OpenClaw.
 */
export interface OpenClawConfigGetResult {
  /**
   * Serialized JSON config content.
   */
  raw: string;

  /**
   * Content hash used for optimistic concurrency control.
   */
  hash: string;
}

/**
 * Parameters for the `config.patch` OpenClaw RPC method.
 */
export interface OpenClawConfigPatchParams {
  /**
   * Serialized JSON partial config to merge.
   */
  raw: string;

  /**
   * Base hash from a prior `config.get` for optimistic locking.
   */
  baseHash: string;
}

/**
 * Matches the `config.patch` result schema from OpenClaw.
 */
export interface OpenClawConfigPatchResult {
  /**
   * Indicates whether the patch succeeded.
   */
  ok: boolean;
}

/**
 * Parameters for the `skills.status` OpenClaw RPC method.
 */
export interface OpenClawSkillsStatusParams {
  /**
   * Optional target agent identifier. When omitted, returns global skill status.
   */
  agentId?: string;
}

/**
 * Normalized skill status entry returned by `skills.status`.
 */
export interface OpenClawSkillStatusEntry {
  /**
   * Stable skill identifier.
   */
  skillKey: string;

  /**
   * Human-readable skill name when available.
   */
  name?: string;

  /**
   * Human-readable description when available.
   */
  description?: string;

  /**
   * Whether the skill is enabled in the queried scope.
   */
  enabled?: boolean;
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
   * Optional correlation identifier generated by the gateway client when omitted.
   */
  id?: string;

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
