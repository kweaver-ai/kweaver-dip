/**
 * Parsed session key fields used by Studio.
 */
export interface ParsedSession {
  /**
   * OpenClaw agent identifier extracted from the session key.
   */
  agent: string;

  /**
   * User identifier extracted from a `user:<id>:direct:<chatId>` session.
   */
  userId?: string;

  /**
   * Chat identifier extracted from a `user:<id>:direct:<chatId>` session.
   */
  chatId?: string;
}

/**
 * Parses an OpenClaw session key into a structured object.
 *
 * @param session The raw session key string.
 * @returns The parsed session structure.
 * @throws {Error} Thrown when the session key is malformed.
 */
export function parseSession(session: string): ParsedSession {
  const parts = session
    .split(":")
    .map((part) => part.trim())
    .filter((part) => part !== "");

  if (parts.length < 2 || parts[0] !== "agent") {
    throw new Error(`Invalid session key: ${session}`);
  }

  const parsed: ParsedSession = {
    agent: parts[1]
  };

  for (let index = 2; index < parts.length; index += 1) {
    if (parts[index] === "user" && parts[index + 2] === "direct") {
      const userId = parts[index + 1];
      const chatId = parts[index + 3];

      if (userId === undefined || chatId === undefined) {
        throw new Error(`Invalid session key: ${session}`);
      }

      parsed.userId = userId;
      parsed.chatId = chatId;
      break;
    }
  }

  return parsed;
}
