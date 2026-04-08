/**
 * Supported initialization states for DIP Studio bootstrap.
 */
export type GuideInitializationState = "ready" | "pending";

/**
 * One missing requirement reported by the guide status endpoint.
 */
export type GuideInitializationRequirement =
  | "envFile"
  | "gatewayProtocol"
  | "gatewayHost"
  | "gatewayPort"
  | "gatewayToken"
  | "workspaceDir"
  | "privateKey"
  | "publicKey";

/**
 * Initialization status returned by DIP Studio bootstrap guide endpoints.
 */
export interface GuideStatusResponse {
  /**
   * Normalized initialization state.
   */
  state: GuideInitializationState;

  /**
   * Whether the backend is considered ready.
   */
  ready: boolean;

  /**
   * Missing requirements when the backend is not ready.
   */
  missing: GuideInitializationRequirement[];
}

/**
 * OpenClaw connection information discovered from injected runtime environment variables.
 */
export interface OpenClawDetectedConfig {
  /**
   * Resolved gateway protocol.
   */
  protocol: "ws" | "wss";

  /**
   * Resolved gateway host.
   */
  host: string;

  /**
   * Resolved gateway port.
   */
  port: number;

  /**
   * Gateway auth token loaded from injected environment variables.
   */
  token: string;
}

/**
 * Request payload used to initialize DIP Studio.
 */
export interface InitializeGuideRequest {
  /**
   * Full OpenClaw gateway address, for example `ws://127.0.0.1:19001`.
   */
  openclaw_address: string;

  /**
   * OpenClaw gateway auth token.
   */
  openclaw_token: string;

  /**
   * Optional KWeaver service base URL.
   */
  kweaver_base_url?: string;

  /**
   * Optional KWeaver access token.
   */
  kweaver_token?: string;
}
