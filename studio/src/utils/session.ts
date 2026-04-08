/**
 * Supported session kinds documented by OpenClaw.
 */
export type SessionKind =
  | "main"
  | "user-direct"
  | "direct"
  | "group"
  | "channel"
  | "subagent"
  | "cron"
  | "acp";

/**
 * Parsed session key fields used by Studio.
 */
export interface ParsedSession {
  /**
   * OpenClaw agent identifier extracted from the session key.
   */
  agent?: string;

  /**
   * High-level session kind derived from the `<rest>` segment.
   */
  kind: SessionKind;

  /**
   * Original `<rest>` segment joined back as one string.
   */
  rest: string;

  /**
   * Optional channel or platform identifier.
   */
  channel?: string;

  /**
   * Optional upstream account identifier used by some direct sessions.
   */
  accountId?: string;

  /**
   * Optional peer identifier used by direct/group/channel sessions.
   */
  peerId?: string;

  /**
   * User identifier extracted from a `user:<id>:direct:<chatId>` session.
   */
  userId?: string;

  /**
   * Chat identifier extracted from a `user:<id>:direct:<chatId>` session.
   */
  chatId?: string;

  /**
   * Thread identifier appended to group/channel sessions.
   */
  threadId?: string;

  /**
   * First subagent identifier.
   */
  subagentId?: string;

  /**
   * Remaining nested subagent path.
   */
  subagentPath?: string[];

  /**
   * Cron job identifier.
   */
  jobId?: string;

  /**
   * Cron run identifier.
   */
  runId?: string;

  /**
   * ACP identifier.
   */
  acpId?: string;
}

/**
 * Parses an OpenClaw session key into a structured object.
 *
 * @param session The raw session key string.
 * @returns The parsed session structure.
 * @throws {Error} Thrown when the session key is malformed.
 */
export function parseSession(session: string): ParsedSession {
  const parts = readSessionParts(session);
  const parsedPrefix = readSessionPrefix(parts, session);

  return parseRestParts(parsedPrefix.agent, parsedPrefix.restParts, session);
}

/**
 * Normalizes one session key into non-empty colon-delimited parts.
 *
 * @param session The raw session key string.
 * @returns The normalized session parts.
 */
function readSessionParts(session: string): string[] {
  return session
    .split(":")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

/**
 * Extracts and validates the optional leading agent identifier.
 *
 * @param parts The normalized session parts.
 * @param session The raw session key string.
 * @returns The parsed agent identifier and normalized rest parts.
 * @throws {Error} Thrown when the prefix is malformed.
 */
function readSessionPrefix(
  parts: string[],
  session: string
): {
  agent?: string;
  restParts: string[];
} {
  if (parts.length === 0) {
    throw new Error(`Invalid session key: ${session}`);
  }

  if (parts[0] !== "agent") {
    return {
      restParts: parts
    };
  }

  if (parts.length < 3) {
    throw new Error(`Invalid session key: ${session}`);
  }

  return {
    agent: parts[1],
    restParts: parts.slice(2)
  };
}

/**
 * Parses the documented `<rest>` section.
 *
 * @param agent The parsed agent identifier.
 * @param restParts The normalized `<rest>` parts.
 * @param session The raw session key string.
 * @returns The parsed session structure.
 * @throws {Error} Thrown when the rest shape is malformed.
 */
function parseRestParts(
  agent: string | undefined,
  restParts: string[],
  session: string
): ParsedSession {
  if (isUserDirectSession(restParts)) {
    return {
      agent,
      kind: "user-direct",
      rest: restParts.join(":"),
      userId: restParts[1],
      chatId: restParts[3]
    };
  }

  if (restParts.length === 1 && restParts[0] === "main") {
    return {
      agent,
      kind: "main",
      rest: "main"
    };
  }

  if (isDirectSession(restParts)) {
    return buildDirectSession(agent, restParts);
  }

  if (isGroupOrChannelSession(restParts)) {
    return buildGroupOrChannelSession(agent, restParts, session);
  }

  if (restParts[0] === "subagent") {
    return buildSubagentSession(agent, restParts, session);
  }

  if (isCronSession(restParts)) {
    return {
      agent,
      kind: "cron",
      rest: restParts.join(":"),
      jobId: restParts[1],
      runId: restParts[3]
    };
  }

  if (restParts[0] === "acp" && restParts.length === 2) {
    return {
      agent,
      kind: "acp",
      rest: restParts.join(":"),
      acpId: restParts[1]
    };
  }

  throw new Error(`Invalid session key: ${session}`);
}

/**
 * Returns whether the rest parts match one user direct session.
 *
 * @param restParts The normalized `<rest>` parts.
 * @returns True when the shape is `user:<id>:direct:<chatId>`.
 */
function isUserDirectSession(restParts: string[]): boolean {
  return (
    restParts.length === 4 &&
    restParts[0] === "user" &&
    restParts[2] === "direct"
  );
}

/**
 * Returns whether the rest parts match one direct session.
 *
 * @param restParts The normalized `<rest>` parts.
 * @returns True when the shape is a documented direct-session variant.
 */
function isDirectSession(restParts: string[]): boolean {
  return (
    (restParts.length === 2 && restParts[0] === "direct") ||
    (restParts.length === 3 && restParts[0] === "slack" && restParts[1] === "direct") ||
    (restParts.length === 4 && restParts[2] === "direct")
  );
}

/**
 * Builds one parsed direct session.
 *
 * @param agent The parsed agent identifier.
 * @param restParts The normalized `<rest>` parts.
 * @returns The parsed direct session.
 */
function buildDirectSession(
  agent: string | undefined,
  restParts: string[]
): ParsedSession {
  if (restParts.length === 2) {
    return {
      agent,
      kind: "direct",
      rest: restParts.join(":"),
      peerId: restParts[1]
    };
  }

  if (restParts.length === 3) {
    return {
      agent,
      kind: "direct",
      rest: restParts.join(":"),
      channel: restParts[0],
      peerId: restParts[2]
    };
  }

  return {
    agent,
    kind: "direct",
    rest: restParts.join(":"),
    channel: restParts[0],
    accountId: restParts[1],
    peerId: restParts[3]
  };
}

/**
 * Returns whether the rest parts match one group or channel session.
 *
 * @param restParts The normalized `<rest>` parts.
 * @returns True when the shape is documented as group/channel or threaded group/channel.
 */
function isGroupOrChannelSession(restParts: string[]): boolean {
  return (
    (restParts.length === 3 &&
      (restParts[1] === "group" || restParts[1] === "channel")) ||
    (restParts.length === 5 &&
      (restParts[1] === "group" || restParts[1] === "channel") &&
      restParts[3] === "thread")
  );
}

/**
 * Builds one parsed group or channel session.
 *
 * @param agent The parsed agent identifier.
 * @param restParts The normalized `<rest>` parts.
 * @param session The raw session key string.
 * @returns The parsed group or channel session.
 * @throws {Error} Thrown when the shape is malformed.
 */
function buildGroupOrChannelSession(
  agent: string | undefined,
  restParts: string[],
  session: string
): ParsedSession {
  const kind = restParts[1];

  if (kind !== "group" && kind !== "channel") {
    throw new Error(`Invalid session key: ${session}`);
  }

  return {
    agent,
    kind,
    rest: restParts.join(":"),
    channel: restParts[0],
    peerId: restParts[2],
    threadId: restParts.length === 5 ? restParts[4] : undefined
  };
}

/**
 * Builds one parsed subagent session.
 *
 * @param agent The parsed agent identifier.
 * @param restParts The normalized `<rest>` parts.
 * @param session The raw session key string.
 * @returns The parsed subagent session.
 * @throws {Error} Thrown when the subagent shape is malformed.
 */
function buildSubagentSession(
  agent: string | undefined,
  restParts: string[],
  session: string
): ParsedSession {
  if (restParts.length < 2) {
    throw new Error(`Invalid session key: ${session}`);
  }

  return {
    agent,
    kind: "subagent",
    rest: restParts.join(":"),
    subagentId: restParts[1],
    subagentPath: restParts.slice(1)
  };
}

/**
 * Returns whether the rest parts match one cron session.
 *
 * @param restParts The normalized `<rest>` parts.
 * @returns True when the shape is `cron:<jobId>:run:<runId>`.
 */
function isCronSession(restParts: string[]): boolean {
  return restParts.length === 4 && restParts[0] === "cron" && restParts[2] === "run";
}
