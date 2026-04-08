/**
 * OpenResponse-style text content part accepted by the chat agent endpoint.
 */
export interface ChatAgentInputTextContentPart {
  /**
   * Content part discriminator.
   */
  type: "input_text" | "text";

  /**
   * Plain text carried by the content part.
   */
  text: string;
}

/**
 * OpenResponse-style message item accepted by the chat agent endpoint.
 */
export interface ChatAgentMessageInputItem {
  /**
   * Item discriminator.
   */
  type: "message";

  /**
   * Message role.
   */
  role: "system" | "developer" | "user" | "assistant";

  /**
   * Message content.
   */
  content: string | ChatAgentInputTextContentPart[];
}

/**
 * OpenResponse-style input item union accepted by the chat agent endpoint.
 */
export type ChatAgentInputItem = ChatAgentMessageInputItem;

/**
 * Request body accepted by the chat agent endpoint.
 */
export interface ChatAgentRequest {
  /**
   * User input forwarded to OpenClaw.
   */
  input: string | ChatAgentInputItem[];

  /**
   * Attachments sent by the client.
   */
  attachments?: ChatAgentAttachment[];

  /**
   * Allows clients to send additional OpenResponse-compatible fields.
   */
  [key: string]: unknown;
}

/**
 * Normalized chat agent request used by the gateway adapter.
 */
export interface NormalizedChatAgentRequest {
  /**
   * User message text extracted from the OpenResponse-style input.
   */
  message: string;

  /**
   * Attachments sent by the client.
   */
  attachments?: ChatAgentAttachment[];
}

export interface ChatAgentAttachment {
  /**
   * Attachment type.
   */
  type: "input_file";

  /**
   * Attachment source descriptor.
   */
  source: {
    /**
     * Source type.
     */
    type: "path";

    /**
     * File path string.
     */
    path: string;
  };
}
