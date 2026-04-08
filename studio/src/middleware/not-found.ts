import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors/http-error";

/**
 * Converts unmatched routes into a consistent 404 error.
 *
 * @param request The incoming HTTP request.
 * @param _response The unused HTTP response object.
 * @param next The next middleware callback.
 * @returns Nothing. Control is forwarded with an error.
 */
export function notFoundHandler(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  next(new HttpError(404, `Route not found: ${request.method} ${request.path}`));
}
