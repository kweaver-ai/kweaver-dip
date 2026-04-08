import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";

import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawWorkspaceTempHttpClient,
  type OpenClawWorkspaceTempHttpClient
} from "../infra/openclaw-workspace-temp-http-client";
import {
  readAgentIdFromSessionKey,
  readRequiredSessionKeyHeader
} from "./chat";
import { getEnv } from "../utils/env";

/**
 * Response body returned by chat upload endpoint.
 */
export interface ChatUploadResponse {
  /**
   * Workspace-relative temp path to be reused by `/chat/agent`.
   */
  path: string;
}

const env = getEnv();
const openClawWorkspaceTempClient = new DefaultOpenClawWorkspaceTempHttpClient({
  gatewayUrl: env.openClawGatewayHttpUrl,
  token: env.openClawGatewayToken,
  timeoutMs: env.openClawGatewayTimeoutMs
});
const MAX_CHAT_UPLOAD_BYTES = 32 * 1024 * 1024;
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CHAT_UPLOAD_BYTES }
});

/**
 * Builds the dedicated chat upload router.
 *
 * @param workspaceTempClient Optional OpenClaw workspace temp upload client.
 * @returns The router exposing file upload endpoint for chat.
 */
export function createChatUploadRouter(
  workspaceTempClient: OpenClawWorkspaceTempHttpClient = openClawWorkspaceTempClient
): Router {
  const router = Router();

  function handleChatUploadMultipart(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    chatUpload.single("file")(req, res, (err: unknown) => {
      if (err === undefined) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(
            new HttpError(
              413,
              `File exceeds maximum size of ${MAX_CHAT_UPLOAD_BYTES} bytes`
            )
          );
          return;
        }

        next(new HttpError(400, err.message));
        return;
      }

      next(
        new HttpError(400, err instanceof Error ? err.message : String(err))
      );
    });
  }

  router.post(
    "/api/dip-studio/v1/chat/upload",
    handleChatUploadMultipart,
    async (
      request: Request<Record<string, never>, ChatUploadResponse>,
      response: Response<ChatUploadResponse>,
      next: NextFunction
    ): Promise<void> => {
      try {
        const file = request.file;
        if (file === undefined || file.buffer.length === 0) {
          throw new HttpError(400, "Multipart field `file` is required");
        }
        const sessionKey = readRequiredSessionKeyHeader(request.headers);
        const agentId = readAgentIdFromSessionKey(sessionKey);
        const uploadResult = await workspaceTempClient.uploadTempFile({
          agentId,
          sessionKey,
          filename: file.originalname,
          body: file.buffer
        });

        response.status(200).json({
          path: uploadResult.path
        });
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to upload chat attachment")
        );
      }
    }
  );

  return router;
}
