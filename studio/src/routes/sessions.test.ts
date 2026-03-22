import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import {
  createSessionsRouter,
  parseOptionalBooleanString,
  parseOptionalNonNegativeIntegerString,
  normalizeArchiveSessionId,
  readRequiredPathParam,
  readRequiredSubpathParam,
  resolveSessionKeyBySessionId,
  readSessionGetParams,
  readSessionsListQuery,
} from "./sessions";

/**
 * Creates a minimal response double with chainable methods.
 *
 * @returns The mocked response object.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
}

describe("readSessionsListQuery", () => {
  it("parses optional query fields", () => {
    expect(
      readSessionsListQuery({
        limit: "20",
        search: "hello",
        agentId: "agent-1",
        includeDerivedTitles: "true",
        includeLastMessage: "false",
        activeMinutes: "60",
        label: "inbox",
        includeGlobal: "true",
        includeUnknown: "true"
      })
    ).toEqual({
      limit: 20,
      search: "hello",
      agentId: "agent-1",
      includeDerivedTitles: true,
      includeLastMessage: false,
      activeMinutes: 60,
      label: "inbox",
      includeGlobal: true,
      includeUnknown: true
    });
  });

  it("rejects invalid query values", () => {
    expect(() =>
      readSessionsListQuery({
        includeDerivedTitles: "bad"
      })
    ).toThrow("Invalid query parameter `includeDerivedTitles`");

    expect(() =>
      readSessionsListQuery({
        limit: "-1"
      })
    ).toThrow("Invalid query parameter `limit`");
  });
});

describe("readSessionGetParams", () => {
  it("parses key and optional limit", () => {
    expect(
      readSessionGetParams(" session_key_here ", {
        limit: "100"
      })
    ).toEqual({
      key: "session_key_here",
      limit: 100
    });
  });

  it("rejects invalid key", () => {
    expect(() => readSessionGetParams("   ", {})).toThrow(
      "Invalid path parameter `key`"
    );
  });
});

describe("digital human sessions helpers", () => {
  it("parses required path params", () => {
    expect(readRequiredPathParam(" dh-1 ", "dh_id")).toBe("dh-1");
    expect(() => readRequiredPathParam("  ", "dh_id")).toThrow(
      "Invalid path parameter `dh_id`"
    );
  });

  it("resolves session key by session id", () => {
    expect(
      resolveSessionKeyBySessionId(
        [
          {
            key: "session_key_1",
            sessionId: "session-1"
          }
        ],
        "session-1"
      )
    ).toBe("session_key_1");

    expect(() =>
      resolveSessionKeyBySessionId(
        [
          {
            key: "session_key_1",
            sessionId: "session-1"
          }
        ],
        "missing"
      )
    ).toThrow("Session not found");
  });

  it("parses required wildcard subpath params", () => {
    expect(readRequiredSubpathParam("reports/a.md", "subpath")).toBe("reports/a.md");
    expect(readRequiredSubpathParam(["reports", "a.md"], "subpath")).toBe(
      "reports/a.md"
    );
    expect(() => readRequiredSubpathParam(undefined, "subpath")).toThrow(
      "Invalid path parameter `subpath`"
    );
    expect(() => readRequiredSubpathParam("   ", "subpath")).toThrow(
      "Invalid path parameter `subpath`"
    );
  });

  it("normalizes archives session id", () => {
    expect(normalizeArchiveSessionId("9fb6b0da-c26e-4419-929e-6b8a1274f80c")).toBe(
      "9fb6b0da-c26e-4419-929e-6b8a1274f80c"
    );
    expect(
      normalizeArchiveSessionId(
        "agent:de_finance:cron:9fb6b0da-c26e-4419-929e-6b8a1274f80c"
      )
    ).toBe("9fb6b0da-c26e-4419-929e-6b8a1274f80c");
  });
});

describe("sessions helpers", () => {
  it("validates helper parsers", () => {
    expect(parseOptionalBooleanString(undefined, "includeGlobal")).toBeUndefined();
    expect(parseOptionalBooleanString("true", "includeGlobal")).toBe(true);
    expect(() => parseOptionalBooleanString("x", "includeGlobal")).toThrow(
      "Invalid query parameter `includeGlobal`"
    );

    expect(parseOptionalNonNegativeIntegerString(undefined, "limit")).toBeUndefined();
    expect(parseOptionalNonNegativeIntegerString("0", "limit")).toBe(0);
    expect(() => parseOptionalNonNegativeIntegerString("a", "limit")).toThrow(
      "Invalid query parameter `limit`"
    );
  });
});

describe("createSessionsRouter", () => {
  it("registers sessions routes", () => {
    const router = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
        };
      }>;
    };

    const listLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions"
    );
    const detailLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions/:key"
    );
    const digitalHumanListLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:dh_id/sessions"
    );
    const digitalHumanMessagesLayer = router.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/messages"
    );
    const digitalHumanArchivesLayer = router.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives"
    );
    const digitalHumanArchiveSubpathLayer = router.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives/*subpath"
    );

    expect(listLayer).toBeDefined();
    expect(detailLayer).toBeDefined();
    expect(digitalHumanListLayer).toBeDefined();
    expect(digitalHumanMessagesLayer).toBeDefined();
    expect(digitalHumanArchivesLayer).toBeDefined();
    expect(digitalHumanArchiveSubpathLayer).toBeDefined();
  });

  it("handles sessions list request", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      sessions: []
    });
    const router = createSessionsRouter({
      listSessions,
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const listLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions"
    );
    const handler = listLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({ query: {} } as Request, response, next);

    expect(listSessions).toHaveBeenCalledWith({
      limit: undefined,
      search: undefined,
      agentId: undefined,
      includeDerivedTitles: undefined,
      includeLastMessage: undefined,
      activeMinutes: undefined,
      label: undefined,
      includeGlobal: undefined,
      includeUnknown: undefined
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles session detail request", async () => {
    const getSession = vi.fn().mockResolvedValue({
      key: "session_key_1",
      messages: []
    });
    const router = createSessionsRouter({
      listSessions: vi.fn(),
      getSession,
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions/:key"
    );
    const handler = getLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          key: " session_key_1 "
        },
        query: {
          limit: "100"
        }
      } as unknown as Request,
      response,
      next
    );

    expect(getSession).toHaveBeenCalledWith({
      key: "session_key_1",
      limit: 100
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles digital human sessions list request", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      sessions: []
    });
    const router = createSessionsRouter({
      listSessions,
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const listLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:dh_id/sessions"
    );
    const handler = listLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          dh_id: "agent-1"
        },
        query: {
          limit: "10"
        }
      } as unknown as Request,
      response,
      next
    );

    expect(listSessions).toHaveBeenCalledWith({
      limit: 10,
      search: undefined,
      agentId: "agent-1",
      includeDerivedTitles: undefined,
      includeLastMessage: undefined,
      activeMinutes: undefined,
      label: undefined,
      includeGlobal: undefined,
      includeUnknown: undefined
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles digital human session messages request", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      sessions: [
        {
          key: "session_key_1",
          sessionId: "session-1"
        }
      ]
    });
    const getSession = vi.fn().mockResolvedValue({
      key: "session_key_1",
      messages: []
    });
    const router = createSessionsRouter({
      listSessions,
      getSession,
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer = router.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/messages"
    );
    const handler = getLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "session-1"
        },
        query: {
          limit: "100"
        }
      } as unknown as Request,
      response,
      next
    );

    expect(listSessions).toHaveBeenCalledWith({
      agentId: "agent-1"
    });
    expect(getSession).toHaveBeenCalledWith({
      key: "session_key_1",
      limit: 100
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles digital human session archives request", async () => {
    const listSessionArchives = vi.fn().mockResolvedValue({
      path: "/",
      contents: []
    });
    const router = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives,
        getSessionArchiveSubpath: vi.fn()
      }
    ) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer = router.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives"
    );
    const handler = getLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "agent:de_finance:cron:session-1"
        },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(listSessionArchives).toHaveBeenCalledWith("agent-1", "session-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const badRequest = new HttpError(400, "Invalid query parameter `limit`");

    const router1 = createSessionsRouter({
      listSessions: vi.fn().mockRejectedValue(badRequest),
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const listLayer1 = router1.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions"
    );
    const handler1 = listLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.({ query: {} } as Request, response1, next1);
    expect(next1).toHaveBeenCalledWith(badRequest);

    const router2 = createSessionsRouter({
      listSessions: vi.fn().mockRejectedValue(new Error("boom")),
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const listLayer2 = router2.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions"
    );
    const handler2 = listLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.({ query: {} } as Request, response2, next2);

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query sessions"
    });
  });

  it("forwards session detail HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const notFound = new HttpError(404, "Session not found");

    const router1 = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn().mockRejectedValue(notFound),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer1 = router1.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions/:key"
    );
    const handler1 = getLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.(
      {
        params: {
          key: "session-key"
        },
        query: {}
      } as unknown as Request,
      response1,
      next1
    );
    expect(next1).toHaveBeenCalledWith(notFound);

    const router2 = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn().mockRejectedValue(new Error("boom")),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer2 = router2.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/sessions/:key"
    );
    const handler2 = getLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.(
      {
        params: {
          key: "session-key"
        },
        query: {}
      } as unknown as Request,
      response2,
      next2
    );

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query session detail"
    });
  });

  it("forwards digital human session HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const notFound = new HttpError(404, "Session not found");

    const router1 = createSessionsRouter({
      listSessions: vi.fn().mockResolvedValue({
        sessions: []
      }),
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer1 = router1.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/messages"
    );
    const handler1 = getLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "missing"
        },
        query: {}
      } as unknown as Request,
      response1,
      next1
    );

    expect(next1).toHaveBeenCalledWith(notFound);

    const router2 = createSessionsRouter({
      listSessions: vi.fn().mockRejectedValue(new Error("boom")),
      getSession: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const listLayer2 = router2.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:dh_id/sessions"
    );
    const handler2 = listLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.(
      {
        params: {
          dh_id: "agent-1"
        },
        query: {}
      } as unknown as Request,
      response2,
      next2
    );

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query digital human sessions"
    });
  });

  it("forwards digital human archives HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const forbidden = new HttpError(403, "Forbidden");

    const router1 = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives: vi.fn().mockRejectedValue(forbidden),
        getSessionArchiveSubpath: vi.fn()
      }
    ) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer1 = router1.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives"
    );
    const handler1 = getLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "session-1"
        },
        query: {}
      } as unknown as Request,
      response1,
      next1
    );

    expect(next1).toHaveBeenCalledWith(forbidden);

    const router2 = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives: vi.fn().mockRejectedValue(new Error("boom")),
        getSessionArchiveSubpath: vi.fn()
      }
    ) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer2 = router2.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives"
    );
    const handler2 = getLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "session-1"
        },
        query: {}
      } as unknown as Request,
      response2,
      next2
    );

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query digital human session archives"
    });
  });

  it("handles digital human session archive subpath request", async () => {
    const getSessionArchiveSubpath = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({
        "content-type": "text/plain"
      }),
      body: new Uint8Array(Buffer.from("hello"))
    });
    const router = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives: vi.fn(),
        getSessionArchiveSubpath
      }
    ) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer = router.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives/*subpath"
    );
    const handler = getLayer?.route?.stack[0]?.handle;
    const response = {
      status: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn()
    } as unknown as Response;
    vi.mocked(response.status).mockReturnValue(response);
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "agent:de_finance:cron:session-1",
          subpath: "notes/today.txt"
        },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(getSessionArchiveSubpath).toHaveBeenCalledWith(
      "agent-1",
      "session-1",
      "notes/today.txt"
    );
    expect(response.setHeader).toHaveBeenCalledWith("content-type", "text/plain");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards archive subpath HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const notFound = new HttpError(404, "Not Found");

    const router1 = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives: vi.fn(),
        getSessionArchiveSubpath: vi.fn().mockRejectedValue(notFound)
      }
    ) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer1 = router1.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives/*subpath"
    );
    const handler1 = getLayer1?.route?.stack[0]?.handle;
    const response1 = {
      status: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn()
    } as unknown as Response;
    vi.mocked(response1.status).mockReturnValue(response1);
    const next1 = vi.fn<NextFunction>();

    await handler1?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "session-1",
          subpath: "notes/today.txt"
        },
        query: {}
      } as unknown as Request,
      response1,
      next1
    );

    expect(next1).toHaveBeenCalledWith(notFound);

    const router2 = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        previewSessions: vi.fn()
      },
      {
        listSessionArchives: vi.fn(),
        getSessionArchiveSubpath: vi.fn().mockRejectedValue(new Error("boom"))
      }
    ) as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const getLayer2 = router2.stack.find(
      (entry) =>
        entry.route?.path ===
        "/api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives/*subpath"
    );
    const handler2 = getLayer2?.route?.stack[0]?.handle;
    const response2 = {
      status: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn()
    } as unknown as Response;
    vi.mocked(response2.status).mockReturnValue(response2);
    const next2 = vi.fn<NextFunction>();

    await handler2?.(
      {
        params: {
          dh_id: "agent-1",
          session_id: "session-1",
          subpath: "notes/today.txt"
        },
        query: {}
      } as unknown as Request,
      response2,
      next2
    );

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query digital human session archive subpath"
    });
  });
});
