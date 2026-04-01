import { describe, expect, it, vi } from "vitest";

import {
  buildFilteredSessionsListResult,
  buildSessionLookupParams,
  DefaultSessionsLogic,
  findSessionByKey,
  hasMatchingSessionUserId,
  isHiddenSessionArchiveEntry,
  readSessionArchiveLookup,
  sanitizeSessionGetResultMessages,
  withDerivedTitles
} from "./sessions";
import {
  HIDDEN_ATTACHMENT_CONTEXT_END,
  HIDDEN_ATTACHMENT_CONTEXT_START
} from "../utils/hidden-attachment-context";

describe("DefaultSessionsLogic", () => {
  it("delegates listSessions to the adapter", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      sessions: []
    });
    const logic = new DefaultSessionsLogic({
      listSessions,
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      previewSessions: vi.fn(),
    });

    await expect(
      logic.listSessions({
        limit: 20,
        userId: "user-1"
      })
    ).resolves.toEqual({
      sessions: [],
      count: 0
    });
    expect(listSessions).toHaveBeenCalledWith({
      limit: 20,
      includeDerivedTitles: true
    });
  });

  it("filters sessions list by session user id", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      ts: 1,
      path: "/sessions",
      count: 2,
      sessions: [
        {
          key: "agent:de_finance:user:user-1:direct:chat-1",
          kind: "user-direct",
          updatedAt: 1,
          sessionId: "runtime-1"
        },
        {
          key: "agent:de_finance:user:user-2:direct:chat-2",
          kind: "user-direct",
          updatedAt: 2,
          sessionId: "runtime-2"
        }
      ]
    });
    const logic = new DefaultSessionsLogic({
      listSessions,
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      previewSessions: vi.fn(),
    });

    await expect(
      logic.listSessions({
        userId: "user-1"
      })
    ).resolves.toMatchObject({
      count: 1,
      sessions: [
        {
          key: "agent:de_finance:user:user-1:direct:chat-1"
        }
      ]
    });
  });

  it("delegates getSession to the adapter", async () => {
    const hidden = [
      "hello",
      "",
      HIDDEN_ATTACHMENT_CONTEXT_START,
      "ATTACHMENT_PATHS:",
      "1. tmp/chat-1/a.txt",
      HIDDEN_ATTACHMENT_CONTEXT_END
    ].join("\n");
    const logic = new DefaultSessionsLogic({
      listSessions: vi.fn(),
      getChatMessages: vi.fn().mockResolvedValue({
        sessionKey: "key1",
        sessionId: "runtime-1",
        messages: [{ role: "user", content: hidden }]
      }),
      getSession: vi.fn().mockResolvedValue({
        key: "legacy-key",
        messages: []
      }),
      deleteSession: vi.fn(),
      previewSessions: vi.fn()
    });

    await expect(
      logic.getSession({
        key: "key1",
        limit: 100
      })
    ).resolves.toEqual({
      key: "key1",
      sessionKey: "key1",
      sessionId: "runtime-1",
      messages: [
        {
          role: "user",
          content: "hello"
        }
      ]
    });
  });

  it("delegates getChatMessages to the adapter", async () => {
    const getChatMessages = vi.fn().mockResolvedValue({
      sessionKey: "key1",
      sessionId: "runtime-1",
      messages: []
    });
    const logic = new DefaultSessionsLogic({
      listSessions: vi.fn(),
      getChatMessages,
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      previewSessions: vi.fn()
    });

    await expect(
      logic.getChatMessages({
        sessionKey: "key1",
        limit: 100
      })
    ).resolves.toEqual({
      sessionKey: "key1",
      sessionId: "runtime-1",
      messages: []
    });
    expect(getChatMessages).toHaveBeenCalledWith({
      sessionKey: "key1",
      limit: 100
    });
  });

  it("looks up one session summary by key through listSessions", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      sessions: [
        {
          key: "agent:de_finance:user:user-1:direct:chat-1",
          kind: "user-direct",
          updatedAt: 1,
          sessionId: "runtime-1"
        }
      ]
    });
    const logic = new DefaultSessionsLogic({
      listSessions,
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      previewSessions: vi.fn()
    });

    await expect(
      logic.getSessionSummary("agent:de_finance:user:user-1:direct:chat-1")
    ).resolves.toMatchObject({
      key: "agent:de_finance:user:user-1:direct:chat-1"
    });
    expect(listSessions).toHaveBeenCalledWith({
      agentId: "de_finance",
      includeDerivedTitles: true
    });
  });

  it("delegates getSessionArchives to the archives client and filters plan files", async () => {
    const listSessionArchives = vi.fn().mockResolvedValue({
      path: "/",
      contents: [
        { name: "PLAN.md", type: "file" },
        { name: "PALN.md", type: "file" },
        { name: "report.md", type: "file" }
      ]
    });
    const logic = new DefaultSessionsLogic(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        deleteSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives,
        getSessionArchiveSubpath: vi.fn()
      }
    );

    await expect(
      logic.getSessionArchives("agent:de_finance:user:user-1:direct:session-1")
    ).resolves.toEqual({
      path: "/",
      contents: [{ name: "report.md", type: "file" }]
    });
    expect(listSessionArchives).toHaveBeenCalledWith("de_finance", "session-1");
  });

  it("delegates previewSessions to the adapter", async () => {
    const logic = new DefaultSessionsLogic({
      listSessions: vi.fn(),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      previewSessions: vi.fn().mockResolvedValue({
        items: []
      })
    });

    await expect(
      logic.previewSessions({
        keys: ["key1", "key2"],
        limit: 5
      })
    ).resolves.toEqual({
      items: []
    });
  });

  it("deletes one owned session through the adapter", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      ts: 1,
      path: "/sessions",
      count: 1,
      sessions: [
        {
          key: "agent:de_finance:user:user-1:direct:chat-1",
          kind: "user-direct",
          updatedAt: 1,
          sessionId: "runtime-1"
        }
      ]
    });
    const deleteSession = vi.fn().mockResolvedValue({
      ok: true,
      key: "agent:de_finance:user:user-1:direct:chat-1",
      deleted: true
    });
    const logic = new DefaultSessionsLogic({
      listSessions,
      getSession: vi.fn(),
      deleteSession,
      previewSessions: vi.fn()
    });

    await expect(
      logic.deleteSession("agent:de_finance:user:user-1:direct:chat-1", "user-1")
    ).resolves.toEqual({
      ok: true,
      key: "agent:de_finance:user:user-1:direct:chat-1",
      deleted: true
    });
    expect(listSessions).toHaveBeenCalledWith({
      agentId: "de_finance",
      includeDerivedTitles: true
    });
    expect(deleteSession).toHaveBeenCalledWith({
      key: "agent:de_finance:user:user-1:direct:chat-1",
      deleteTranscript: true,
      emitLifecycleHooks: true
    });
  });
});

describe("sessions logic helpers", () => {
  it("always enables derived titles for sessions queries", () => {
    expect(
      withDerivedTitles({
        search: "hello",
        includeDerivedTitles: false
      })
    ).toEqual({
      search: "hello",
      includeDerivedTitles: true
    });
  });

  it("builds lookup params from session key", () => {
    expect(
      buildSessionLookupParams("agent:de_finance:user:user-1:direct:session-1")
    ).toEqual({
      agentId: "de_finance"
    });
    expect(buildSessionLookupParams("session-1")).toEqual({});
  });

  it("finds session by exact key", () => {
    expect(
      findSessionByKey(
        [
          {
            key: "session-1",
            kind: "direct",
            updatedAt: 1,
            sessionId: "runtime-1"
          }
        ],
        "session-1"
      )
    ).toMatchObject({
      key: "session-1"
    });

    expect(() => findSessionByKey([], "missing")).toThrow("Session not found");
  });

  it("matches session ownership by parsed session key", () => {
    expect(
      hasMatchingSessionUserId(
        {
          key: "agent:de_finance:user:user-1:direct:session-1",
          kind: "user-direct",
          updatedAt: 1,
          sessionId: "runtime-1"
        },
        "user-1"
      )
    ).toBe(true);
    expect(
      hasMatchingSessionUserId(
        {
          key: "invalid",
          kind: "direct",
          updatedAt: 1,
          sessionId: "runtime-2"
        },
        "user-1"
      )
    ).toBe(false);
  });

  it("rebuilds sessions list result after filtering", () => {
    expect(
      buildFilteredSessionsListResult(
        {
          ts: 1,
          path: "/sessions",
          count: 2,
          sessions: []
        },
        [
          {
            key: "session-1",
            kind: "direct",
            updatedAt: 1,
            sessionId: "runtime-1"
          }
        ]
      )
    ).toMatchObject({
      count: 1,
      sessions: [
        {
          key: "session-1"
        }
      ]
    });
  });

  it("identifies internal plan files in archives list", () => {
    expect(isHiddenSessionArchiveEntry({ name: "PLAN.md", type: "file" })).toBe(true);
    expect(isHiddenSessionArchiveEntry({ name: " PALN.md ", type: "file" })).toBe(
      true
    );
    expect(isHiddenSessionArchiveEntry({ name: "report.md", type: "file" })).toBe(
      false
    );
  });

  it("sanitizes hidden attachment context in session messages", () => {
    const hidden = [
      "summary please",
      "",
      HIDDEN_ATTACHMENT_CONTEXT_START,
      "ATTACHMENT_PATHS:",
      "1. tmp/chat-1/a.txt",
      HIDDEN_ATTACHMENT_CONTEXT_END
    ].join("\n");

    expect(
      sanitizeSessionGetResultMessages({
        key: "k",
        messages: [{ role: "user", content: hidden }]
      })
    ).toEqual({
      key: "k",
      messages: [{ role: "user", content: "summary please" }]
    });
  });

  it("reads archives lookup fields from session key", () => {
    expect(
      readSessionArchiveLookup("agent:de_finance:user:user-1:direct:session-1")
    ).toEqual({
      digitalHumanId: "de_finance",
      sessionId: "session-1"
    });
    expect(readSessionArchiveLookup("agent:de_finance:direct:peer-1")).toEqual({
      digitalHumanId: "de_finance",
      sessionId: "peer-1"
    });
    expect(() => readSessionArchiveLookup("session-1")).toThrow(
      "Invalid path parameter `key`"
    );
  });
});
