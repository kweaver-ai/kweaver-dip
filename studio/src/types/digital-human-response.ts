/**
 * Describes the request body accepted by the digital human response endpoint.
 */
export interface DigitalHumanResponseRequest {
  /**
   * Free-form Open Response style payload forwarded to OpenClaw.
   */
  [key: string]: unknown;
}

/**
 * Describes the payload forwarded to OpenClaw `/v1/responses`.
 */
export interface OpenClawResponsesRequest extends DigitalHumanResponseRequest {
  /**
   * The target OpenClaw agent model identifier.
   */
  model: string;

  /**
   * Forces OpenClaw to return an event stream.
   */
  stream: true;
}
