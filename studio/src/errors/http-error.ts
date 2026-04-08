/**
 * Represents an HTTP error with a status code and safe message.
 */
export class HttpError extends Error {
  /**
   * Creates an HTTP error instance.
   *
   * @param statusCode The HTTP status code to return.
   * @param message The safe error message to expose.
   * @param code Optional stable business error code.
   */
  public constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}
