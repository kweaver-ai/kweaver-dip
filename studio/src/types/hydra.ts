/**
 * Describes the form payload sent to Hydra token introspection.
 */
export interface HydraIntrospectTokenRequest {
  /**
   * OAuth access token that should be introspected.
   */
  token: string;
}

/**
 * Describes the subset of Hydra introspection fields used by Studio.
 */
export interface HydraIntrospectTokenResponse {
  /**
   * Indicates whether the token is currently active.
   */
  active?: boolean;

  /**
   * Machine-readable user identifier associated with the token.
   */
  sub?: string;

  /**
   * Human-readable username optionally returned by Hydra.
   */
  username?: string;
}
