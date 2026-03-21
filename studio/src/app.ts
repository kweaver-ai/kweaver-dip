import express, { type Express, type Request, type Response } from "express";

import { HttpError } from "./errors/http-error";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { createDigitalHumanResponseRouter } from "./routes/digital-human-response";
import { createDigitalHumanRouter } from "./routes/digital-human";
import { createHealthRouter } from "./routes/health";


/**
 * Options for creating the Express application.
 */
export interface AppOptions {
  /**
   * Enables diagnostic routes that are only useful in tests.
   */
  enableDiagnostics?: boolean;
}

/**
 * Raises a predictable error for middleware testing.
 *
 * @param _request The incoming HTTP request.
 * @param _response The outgoing HTTP response.
 * @returns Nothing. An error is thrown synchronously.
 */
export function raiseDiagnosticError(
  _request: Request,
  _response: Response
): never {
  throw new HttpError(418, "Diagnostic failure");
}

/**
 * Creates the Express application with the default middleware stack.
 *
 * @param options Optional application construction flags.
 * @returns A configured Express application.
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(createHealthRouter());
  app.use(createDigitalHumanRouter());
  app.use(createDigitalHumanResponseRouter());

  if (options.enableDiagnostics === true) {
    app.get("/__diagnostics/error", raiseDiagnosticError);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
