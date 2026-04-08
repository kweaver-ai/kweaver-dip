import type { Router } from "express";

import type { OpenClawChatAgentClient } from "../infra/openclaw-chat-agent-client";
import { createChatRouter } from "./chat";

export {
  appendAttachmentHintsToMessage,
  isChatAgentMessageInputItem,
  readChatAgentAttachments,
  readChatAgentItemText,
  readChatAgentMessage,
  readChatAgentRequestBody
} from "./chat";

/**
 * Builds the dedicated chat agent router.
 *
 * @param chatAgentClient Optional OpenClaw chat agent client.
 * @returns The router exposing the chat flow endpoint.
 */
export function createChatAgentRouter(
  chatAgentClient?: OpenClawChatAgentClient
): Router {
  return createChatRouter({
    chatAgentClient
  });
}
