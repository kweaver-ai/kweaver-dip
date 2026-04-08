/**
 * Request payload accepted by the session key creation endpoint.
 */
export interface CreateSessionKeyRequest {
  /**
   * Agent identifier that owns the new direct chat session.
   */
  agentId: string;
}

/**
 * Response payload returned by the session key creation endpoint.
 */
export interface CreateSessionKeyResponse {
  /**
   * Newly generated OpenClaw session key.
   */
  sessionKey: string;
}
