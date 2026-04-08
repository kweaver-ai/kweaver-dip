import { Router, type Request, type Response } from "express";

/**
 * Returns the standard health check payload.
 *
 * @param _request The incoming HTTP request.
 * @param response The outgoing HTTP response.
 * @returns Nothing. The response is written directly.
 */
export function getHealth(_request: Request, response: Response): void {
  response.status(200).json({
    status: "ok",
    service: "dip-studio-backend"
  });
}

/**
 * Builds the health check router.
 *
 * @returns The router exposing service health endpoints.
 */
export function createHealthRouter(): Router {
  const router = Router();

  router.get("/health", getHealth);

  return router;
}
