import type { Router } from "express";

import {
  buildOpenClawSessionKey,
  createChatRouter,
  readCreateSessionKeyRequestBody,
  readRequiredUserIdHeader
} from "./chat";

export {
  buildOpenClawSessionKey,
  readCreateSessionKeyRequestBody,
  readRequiredUserIdHeader
} from "./chat";

/**
 * Builds the session key router.
 *
 * @returns The router exposing session key endpoints.
 */
export function createSessionKeyRouter(): Router {
  return createChatRouter();
}
