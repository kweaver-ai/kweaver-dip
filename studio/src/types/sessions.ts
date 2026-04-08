/**
 * Request payload sent to OpenClaw `sessions.list`.
 */
export interface OpenClawSessionsListParams {
  /**
   * Maximum number of sessions to return.
   */
  limit?: number;

  /**
   * Optional keyword filter.
   */
  search?: string;

  /**
   * Optional agent identifier filter.
   */
  agentId?: string;

  /**
   * Authenticated user identifier used by Studio-side filtering.
   */
  userId?: string;

  /**
   * Derives title from the first message when enabled.
   */
  includeDerivedTitles?: boolean;
}

/**
 * Request payload sent to OpenClaw `sessions.get`.
 */
export interface OpenClawSessionGetParams {
  /**
   * Session key.
   */
  key: string;

  /**
   * Maximum number of messages to return.
   */
  limit?: number;
}

/**
 * Request payload sent to OpenClaw `chat.history`.
 */
export interface OpenClawChatHistoryParams {
  /**
   * Session key.
   */
  sessionKey: string;

  /**
   * Maximum number of messages to return.
   */
  limit?: number;
}

/**
 * Request payload sent to OpenClaw `sessions.delete`.
 */
export interface OpenClawSessionDeleteParams {
  /**
   * Session key.
   */
  key: string;

  /**
   * Whether to delete transcript data together with the session.
   */
  deleteTranscript?: boolean;

  /**
   * Whether to emit lifecycle hooks during deletion.
   */
  emitLifecycleHooks?: boolean;
}

/**
 * Request payload sent to OpenClaw `sessions.preview`.
 */
export interface OpenClawSessionsPreviewParams {
  /**
   * Session keys to preview.
   */
  keys: string[];

  /**
   * Maximum number of messages for each preview.
   */
  limit?: number;
}

/**
 * Result payload returned by OpenClaw `sessions.list`.
 */
export interface OpenClawSessionsListResult {
  /**
   * Server timestamp in milliseconds.
   */
  ts: number;

  /**
   * Source path identifier.
   */
  path: string;

  /**
   * Total session count.
   */
  count: number;

  /**
   * Defaults used by sessions.
   */
  defaults?: OpenClawSessionDefaults;

  /**
   * Sessions summary list.
   */
  sessions: OpenClawSessionSummary[];
}

/**
 * Shared defaults used by sessions payload.
 */
export interface OpenClawSessionDefaults {
  /**
   * Model provider id.
   */
  modelProvider?: string;

  /**
   * Model id.
   */
  model?: string;

  /**
   * Context token limit.
   */
  contextTokens?: number;
}

/**
 * Session summary returned by `sessions.list`.
 */
export interface OpenClawSessionSummary {
  /**
   * Stable session key.
   */
  key: string;

  /**
   * Session kind.
   */
  kind: string;

  /**
   * Optional session label.
   */
  label?: string;

  /**
   * Optional display name.
   */
  displayName?: string;

  /**
   * Last update timestamp in milliseconds.
   */
  updatedAt: number;

  /**
   * Runtime session id.
   */
  sessionId: string;

  /**
   * Optional chat type.
   */
  chatType?: string;

  /**
   * Optional source metadata.
   */
  origin?: OpenClawSessionOrigin;

  /**
   * Optional delivery metadata.
   */
  deliveryContext?: OpenClawSessionDeliveryContext;

  /**
   * Optional last channel marker.
   */
  lastChannel?: string;

  /**
   * Whether the system has sent bootstrapping content.
   */
  systemSent?: boolean;

  /**
   * Whether last run was aborted.
   */
  abortedLastRun?: boolean;

  /**
   * Whether token stats are freshly computed.
   */
  totalTokensFresh?: boolean;

  /**
   * Model provider id.
   */
  modelProvider?: string;

  /**
   * Model id.
   */
  model?: string;

  /**
   * Context token limit.
   */
  contextTokens?: number;

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Source metadata for one session.
 */
export interface OpenClawSessionOrigin {
  /**
   * Origin provider.
   */
  provider?: string;

  /**
   * Origin surface.
   */
  surface?: string;

  /**
   * Origin chat type.
   */
  chatType?: string;
}

/**
 * Delivery metadata for one session.
 */
export interface OpenClawSessionDeliveryContext {
  /**
   * Delivery channel.
   */
  channel?: string;
}

/**
 * Result payload returned by OpenClaw `sessions.get`.
 */
export interface OpenClawSessionGetResult {
  /**
   * Session key.
   */
  key: string;

  /**
   * Returned message list.
   */
  messages?: OpenClawSessionMessage[];

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Result payload returned by OpenClaw `chat.history`.
 */
export interface OpenClawChatHistoryResult {
  /**
   * Session key.
   */
  sessionKey: string;

  /**
   * Runtime session id.
   */
  sessionId?: string;

  /**
   * Returned message list.
   */
  messages?: OpenClawSessionMessage[];

  /**
   * Thinking level used by the session.
   */
  thinkingLevel?: string;

  /**
   * Whether fast mode is enabled.
   */
  fastMode?: boolean;

  /**
   * Verbose level used by the session.
   */
  verboseLevel?: string;

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Result payload returned by OpenClaw `sessions.preview`.
 */
export interface OpenClawSessionsPreviewResult {
  /**
   * Preview items keyed by session.
   */
  items?: OpenClawSessionPreviewItem[];

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Result payload returned by OpenClaw `sessions.delete`.
 */
export interface OpenClawSessionDeleteResult {
  /**
   * Whether the request succeeded.
   */
  ok: boolean;

  /**
   * Session key.
   */
  key: string;

  /**
   * Whether the session record was deleted.
   */
  deleted?: boolean;

  /**
   * Whether transcript data was archived.
   */
  archived?: boolean;

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Session message item from `sessions.get`.
 */
export interface OpenClawSessionMessage {
  /**
   * Message id.
   */
  id?: string;

  /**
   * Message role.
   */
  role?: string;

  /**
   * Message content.
   */
  content?: unknown;

  /**
   * Timestamp in milliseconds.
   */
  ts?: number;

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Preview item from `sessions.preview`.
 */
export interface OpenClawSessionPreviewItem {
  /**
   * Session key.
   */
  key: string;

  /**
   * Preview messages.
   */
  messages?: OpenClawSessionMessage[];

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * One archive entry returned by OpenClaw `dip` archives API.
 */
export interface OpenClawSessionArchiveEntry {
  /**
   * Entry name.
   */
  name: string;

  /**
   * Entry kind.
   */
  type: "file" | "directory" | "other";

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}

/**
 * Result payload returned by OpenClaw `/v1/archives` for one session.
 */
export interface OpenClawSessionArchivesResult {
  /**
   * Queried path.
   */
  path: string;

  /**
   * Entries under the queried path.
   */
  contents: OpenClawSessionArchiveEntry[];

  /**
   * Accepts additional OpenClaw fields for forward compatibility.
   */
  [key: string]: unknown;
}
