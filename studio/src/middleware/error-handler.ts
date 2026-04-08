import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors/http-error";

/**
 * Maps an HTTP status code to the public error code used by OpenAPI.
 *
 * @param statusCode The HTTP status code.
 * @returns The normalized public error code.
 */
export function resolveErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "INVALID_PARAMETER";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 500:
      return "INTERNAL_SERVER_ERROR";
    default:
      return `HTTP_${statusCode}`;
  }
}

/**
 * Handles uncaught application errors and returns a stable JSON payload.
 *
 * @param error The thrown application error.
 * @param _request The incoming HTTP request.
 * @param response The outgoing HTTP response.
 * @param _next The next middleware callback required by Express.
 * @returns Nothing. The response is written directly.
 */
export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  next: NextFunction
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const description =
    error instanceof HttpError ? error.message : "Internal Server Error";
  const code =
    error instanceof HttpError && error.code !== undefined
      ? error.code
      : resolveErrorCode(statusCode);

  response.status(statusCode).json({
    code,
    description
  });
}
