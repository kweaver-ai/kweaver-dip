import type { OpenClawSessionsAdapter } from "../adapters/openclaw-sessions-adapter";
import { HttpError } from "../errors/http-error";
import type {
  OpenClawArchivesHttpClient,
  OpenClawArchivesHttpResult
} from "../infra/openclaw-archives-http-client";
import { parseSession } from "../utils/session";
import type {
  OpenClawSessionDeleteParams,
  OpenClawSessionDeleteResult,
  OpenClawSessionGetParams,
  OpenClawSessionGetResult,
  OpenClawSessionArchiveEntry,
  OpenClawSessionArchivesResult,
  OpenClawSessionSummary,
  OpenClawSessionsListParams,
  OpenClawSessionsListResult,
  OpenClawSessionsPreviewParams,
  OpenClawSessionsPreviewResult
} from "../types/sessions";

/**
 * Application logic used to fetch sessions and message previews.
 */
export interface SessionsLogic {
  /**
   * Fetches sessions list.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions list payload.
   */
  listSessions(params: OpenClawSessionsListParams): Promise<OpenClawSessionsListResult>;

  /**
   * Fetches one session detail.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw session detail payload.
   */
  getSession(params: OpenClawSessionGetParams): Promise<OpenClawSessionGetResult>;

  /**
   * Deletes one session.
   *
   * @param key The session key to delete.
   * @param userId The authenticated user identifier.
   * @returns The OpenClaw session deletion payload.
   */
  deleteSession(key: string, userId: string): Promise<OpenClawSessionDeleteResult>;

  /**
   * Fetches one session summary by exact key match.
   *
   * @param key The target session key.
   * @returns The matched session summary.
   */
  getSessionSummary(key: string): Promise<OpenClawSessionSummary>;

  /**
   * Fetches one session archives list and applies Studio-level filtering.
   *
   * @param key The raw session key or session id.
   * @returns The filtered archives list payload.
   */
  getSessionArchives(key: string): Promise<OpenClawSessionArchivesResult>;

  /**
   * Reads one archive subpath for a session.
   *
   * @param key The raw session key.
   * @param subpath The target subpath under archives root.
   * @returns The upstream response status, headers and body bytes.
   */
  getSessionArchiveSubpath(
    key: string,
    subpath: string
  ): Promise<OpenClawArchivesHttpResult>;

  /**
   * Fetches previews for multiple sessions.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions preview payload.
   */
  previewSessions(
    params: OpenClawSessionsPreviewParams
  ): Promise<OpenClawSessionsPreviewResult>;
}

/**
 * Logic implementation backed by OpenClaw sessions APIs.
 */
export class DefaultSessionsLogic implements SessionsLogic {
  /**
   * Creates the sessions logic.
   *
   * @param openClawSessionsAdapter The adapter used to fetch OpenClaw sessions data.
   */
  public constructor(
    private readonly openClawSessionsAdapter: OpenClawSessionsAdapter,
    private readonly openClawArchivesHttpClient?: OpenClawArchivesHttpClient
  ) {}

  /**
   * Fetches sessions list from OpenClaw.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions list payload.
   */
  public async listSessions(
    params: OpenClawSessionsListParams
  ): Promise<OpenClawSessionsListResult> {
    const { userId, ...adapterParams } = withDerivedTitles(params);
    const result = await this.openClawSessionsAdapter.listSessions(adapterParams);

    if (userId === undefined) {
      return result;
    }

    const sessions = result.sessions.filter((session) =>
      hasMatchingSessionUserId(session, userId)
    );

    return buildFilteredSessionsListResult(result, sessions);
  }

  /**
   * Fetches session detail from OpenClaw.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw session detail payload.
   */
  public async getSession(
    params: OpenClawSessionGetParams
  ): Promise<OpenClawSessionGetResult> {
    return this.openClawSessionsAdapter.getSession(params);
  }

  /**
   * Deletes one session after verifying that it belongs to the authenticated user.
   *
   * @param key The session key to delete.
   * @param userId The authenticated user identifier.
   * @returns The OpenClaw session deletion payload.
   */
  public async deleteSession(
    key: string,
    userId: string
  ): Promise<OpenClawSessionDeleteResult> {
    const sessionsList = await this.listSessions({
      ...buildSessionLookupParams(key),
      userId
    });

    findSessionByKey(sessionsList.sessions, key);

    const deleteParams: OpenClawSessionDeleteParams = {
      key,
      deleteTranscript: true,
      emitLifecycleHooks: true
    };

    return this.openClawSessionsAdapter.deleteSession(deleteParams);
  }

  /**
   * Fetches one session summary by exact key match.
   *
   * @param key The target session key.
   * @returns The matched session summary.
   */
  public async getSessionSummary(key: string): Promise<OpenClawSessionSummary> {
    const sessionsList = await this.openClawSessionsAdapter.listSessions(
      withDerivedTitles(buildSessionLookupParams(key))
    );

    return findSessionByKey(sessionsList.sessions, key);
  }

  /**
   * Fetches session archives list from OpenClaw and removes internal plan files.
   *
   * @param key The raw session key or session id.
   * @returns The filtered archives list payload.
   */
  public async getSessionArchives(key: string): Promise<OpenClawSessionArchivesResult> {
    if (this.openClawArchivesHttpClient === undefined) {
      throw new Error("OpenClaw archives client is not configured");
    }

    const archiveLookup = readSessionArchiveLookup(key);

    const result = await this.openClawArchivesHttpClient.listSessionArchives(
      archiveLookup.digitalHumanId,
      archiveLookup.sessionId
    );

    return {
      ...result,
      contents: result.contents.filter((entry) => !isHiddenSessionArchiveEntry(entry))
    };
  }

  /**
   * Reads one archive subpath for a session via OpenClaw.
   *
   * @param key The raw session key.
   * @param subpath The target subpath under archives root.
   * @returns The upstream response status, headers and body bytes.
   */
  public async getSessionArchiveSubpath(
    key: string,
    subpath: string
  ): Promise<OpenClawArchivesHttpResult> {
    if (this.openClawArchivesHttpClient === undefined) {
      throw new Error("OpenClaw archives client is not configured");
    }

    const archiveLookup = readSessionArchiveLookup(key);

    return this.openClawArchivesHttpClient.getSessionArchiveSubpath(
      archiveLookup.digitalHumanId,
      archiveLookup.sessionId,
      subpath
    );
  }

  /**
   * Fetches sessions preview from OpenClaw.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions preview payload.
   */
  public async previewSessions(
    params: OpenClawSessionsPreviewParams
  ): Promise<OpenClawSessionsPreviewResult> {
    return this.openClawSessionsAdapter.previewSessions(params);
  }
}

/**
 * Forces sessions queries to include derived titles in responses.
 *
 * @param params Raw sessions list parameters.
 * @returns Sessions list parameters with derived titles always enabled.
 */
export function withDerivedTitles(
  params: OpenClawSessionsListParams
): OpenClawSessionsListParams {
  return {
    ...params,
    includeDerivedTitles: true
  };
}

/**
 * Builds one `sessions.list` query for looking up a specific session by key.
 *
 * @param key Parsed non-empty session key.
 * @returns Parsed `sessions.list` parameters narrowed by agent when available.
 */
export function buildSessionLookupParams(key: string): OpenClawSessionsListParams {
  try {
    const parsedSession = parseSession(key);

    return {
      agentId: parsedSession.agent
    };
  } catch {
    return {};
  }
}

/**
 * Finds one session summary by exact key match.
 *
 * @param sessions Session summary list.
 * @param key Requested session key.
 * @returns The matching session summary.
 */
export function findSessionByKey(
  sessions: OpenClawSessionSummary[],
  key: string
): OpenClawSessionSummary {
  const matchedSession = sessions.find((session) => session.key === key);

  if (matchedSession === undefined) {
    throw new HttpError(404, "Session not found");
  }

  return matchedSession;
}

/**
 * Returns whether one session belongs to the requested user.
 *
 * @param session The session to inspect.
 * @param userId The authenticated user identifier.
 * @returns True when the session user id matches.
 */
export function hasMatchingSessionUserId(
  session: OpenClawSessionSummary,
  userId: string
): boolean {
  try {
    return parseSession(session.key).userId === userId;
  } catch {
    return false;
  }
}

/**
 * Rebuilds one sessions list response after Studio-side filtering.
 *
 * @param result The original sessions list result.
 * @param sessions The filtered sessions.
 * @returns The normalized list result containing only filtered sessions.
 */
export function buildFilteredSessionsListResult(
  result: OpenClawSessionsListResult,
  sessions: OpenClawSessionSummary[]
): OpenClawSessionsListResult {
  return {
    ...result,
    count: sessions.length,
    sessions
  };
}

/**
 * Hides internal plan files from archives listing responses.
 *
 * @param entry One archive entry returned by OpenClaw.
 * @returns True when the entry should be excluded from API response.
 */
export function isHiddenSessionArchiveEntry(
  entry: OpenClawSessionArchiveEntry
): boolean {
  const normalizedName = entry.name.trim().toUpperCase();

  return normalizedName === "PLAN.MD" || normalizedName === "PALN.MD";
}

/**
 * Resolves the agent id and normalized session id used by dip `/v1/archives`.
 *
 * @param key The raw session key or session id.
 * @returns The agent id and normalized session id.
 */
export function readSessionArchiveLookup(key: string): {
  digitalHumanId: string;
  sessionId: string;
} {
  const trimmedKey = key.trim();

  if (!trimmedKey.includes(":")) {
    throw new HttpError(400, "Invalid path parameter `key`");
  }

  const parsedSession = parseSession(trimmedKey);
  const digitalHumanId = parsedSession.agent?.trim();
  const sessionId = trimmedKey
    .split(":")
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .at(-1);

  if (digitalHumanId === undefined || digitalHumanId === "") {
    throw new HttpError(400, "Invalid path parameter `key`");
  }

  if (sessionId === undefined || sessionId === "") {
    throw new HttpError(400, "Invalid path parameter `key`");
  }

  return {
    digitalHumanId,
    sessionId
  };
}
