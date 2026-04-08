import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { readSessionArchiveLookup } from "../logic/sessions";
import { injectAuthenticatedUserId } from "../middleware/hydra-auth";

import {
  createSessionsRouter,
  parseOptionalBooleanString,
  parseOptionalNonNegativeIntegerString,
  normalizeArchiveSessionId,
  readRequiredPathParam,
  readRequiredSubpathParam,
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

/**
 * Reads one router layer by path and HTTP method.
 *
 * @param router The Express router double.
 * @param path The registered route path.
 * @param method The expected HTTP method.
 * @returns The matched router layer when found.
 */
function findRouteLayer(
  router: {
    stack: Array<{
      route?: {
        path: string;
        methods?: Record<string, boolean>;
        stack: Array<{
          handle: (
            request: Request,
            response: Response,
            next: NextFunction
          ) => Promise<void>;
        }>;
      };
    }>;
  },
  path: string,
  method: "get" | "delete"
): {
  route?: {
    path: string;
    methods?: Record<string, boolean>;
    stack: Array<{
      handle: (
        request: Request,
        response: Response,
        next: NextFunction
      ) => Promise<void>;
    }>;
  };
} | undefined {
  return router.stack.find(
    (entry) => entry.route?.path === path && entry.route?.methods?.[method] === true
  );
}

describe("readSessionsListQuery", () => {
  it("parses optional query fields", () => {
    expect(
      readSessionsListQuery({
        limit: "20",
        search: "hello",
        agentId: "agent-1"
      })
    ).toEqual({
      limit: 20,
      search: "hello",
      agentId: "agent-1"
    });
  });

  it("rejects invalid query values", () => {
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
    expect(readRequiredPathParam(" dh-1 ", "id")).toBe("dh-1");
    expect(() => readRequiredPathParam("  ", "id")).toThrow(
      "Invalid path parameter `id`"
    );
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

  it("reads archive lookup from session key", () => {
    expect(
      readSessionArchiveLookup(
        "agent:de_finance:user:user-1:direct:9fb6b0da-c26e-4419-929e-6b8a1274f80c"
      )
    ).toEqual({
      digitalHumanId: "de_finance",
      sessionId: "9fb6b0da-c26e-4419-929e-6b8a1274f80c"
    });
    expect(readSessionArchiveLookup("agent:de_finance:direct:peer-1")).toEqual({
      digitalHumanId: "de_finance",
      sessionId: "peer-1"
    });
    expect(() => readSessionArchiveLookup("user:user-1:direct:session-1")).toThrow(
      "Invalid path parameter `key`"
    );
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
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
      previewSessions: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
        };
      }>;
    };

    const listLayer = findRouteLayer(router, "/api/dip-studio/v1/sessions", "get");
    const detailLayer = findRouteLayer(router, "/api/dip-studio/v1/sessions/:key", "get");
    const deleteLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key",
      "delete"
    );
    const digitalHumanListLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/digital-human/:id/sessions",
      "get"
    );
    const digitalHumanMessagesLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key/messages",
      "get"
    );
    const digitalHumanArchivesLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key/archives",
      "get"
    );
    const digitalHumanArchiveSubpathLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key/archives/*subpath",
      "get"
    );

    expect(listLayer).toBeDefined();
    expect(detailLayer).toBeDefined();
    expect(deleteLayer).toBeDefined();
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
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const listLayer = findRouteLayer(router, "/api/dip-studio/v1/sessions", "get");
    const handler = listLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const request = {
      query: {},
      headers: {}
    } as unknown as Request;

    injectAuthenticatedUserId(request, "user-1");

    await handler?.(request, response, next);

    expect(listSessions).toHaveBeenCalledWith({
      limit: undefined,
      search: undefined,
      agentId: undefined,
      userId: "user-1"
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles session detail request", async () => {
    const getSessionSummary = vi.fn().mockResolvedValue({
      key: "session_key_1",
      kind: "direct",
      updatedAt: 1,
      sessionId: "runtime-1"
    });
    const getSession = vi.fn();
    const router = createSessionsRouter({
      listSessions: vi.fn(),
      getSession,
      deleteSession: vi.fn(),
      getSessionSummary,
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const getLayer = findRouteLayer(router, "/api/dip-studio/v1/sessions/:key", "get");
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

    expect(getSessionSummary).toHaveBeenCalledWith("session_key_1");
    expect(getSession).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      key: "session_key_1",
      kind: "direct",
      updatedAt: 1,
      sessionId: "runtime-1"
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles session delete request", async () => {
    const deleteSession = vi.fn().mockResolvedValue({
      ok: true,
      key: "session_key_1",
      deleted: true
    });
    const router = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn(),
      deleteSession,
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const deleteLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key",
      "delete"
    );
    const handler = deleteLayer?.route?.stack[0]?.handle;
    const response = {
      status: vi.fn(),
      send: vi.fn()
    } as unknown as Response;
    vi.mocked(response.status).mockReturnValue(response);
    const next = vi.fn<NextFunction>();
    const request = {
      params: {
        key: " session_key_1 "
      },
      headers: {}
    } as unknown as Request;

    injectAuthenticatedUserId(request, "user-1");

    await handler?.(request, response, next);

    expect(deleteSession).toHaveBeenCalledWith(
      "session_key_1",
      "user-1"
    );
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("handles digital human sessions list request", async () => {
    const listSessions = vi.fn().mockResolvedValue({
      sessions: []
    });
    const router = createSessionsRouter({
      listSessions,
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const listLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/digital-human/:id/sessions",
      "get"
    );
    const handler = listLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const request = {
      params: {
        id: "agent-1"
      },
      query: {
        limit: "10"
      },
      headers: {}
    } as unknown as Request;

    injectAuthenticatedUserId(request, "user-1");

    await handler?.(request, response, next);

    expect(listSessions).toHaveBeenCalledWith({
      limit: 10,
      search: undefined,
      agentId: "agent-1",
      userId: "user-1"
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles session messages request", async () => {
    const getSession = vi.fn().mockResolvedValue({
      key: "session_key_1",
      messages: []
    });
    const router = createSessionsRouter({
      listSessions: vi.fn(),
      getSession,
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const getLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key/messages",
      "get"
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

  it("handles session archives request", async () => {
    const getSessionArchives = vi.fn().mockResolvedValue({
      path: "/",
      contents: []
    });
    const router = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        deleteSession: vi.fn(),
        getSessionSummary: vi.fn(),
        getSessionArchives,
        getSessionArchiveSubpath: vi.fn(),
        previewSessions: vi.fn()
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
    const getLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key/archives",
      "get"
    );
    const handler = getLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          key: "agent:de_finance:user:user-1:direct:session-1"
        },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(getSessionArchives).toHaveBeenCalledWith(
      "agent:de_finance:user:user-1:direct:session-1"
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const badRequest = new HttpError(400, "Invalid query parameter `limit`");

    const router1 = createSessionsRouter({
      listSessions: vi.fn().mockRejectedValue(badRequest),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const listLayer1 = findRouteLayer(router1, "/api/dip-studio/v1/sessions", "get");
    const handler1 = listLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.({ query: {}, headers: {} } as Request, response1, next1);
    expect(next1).toHaveBeenCalledWith(badRequest);

    const router2 = createSessionsRouter({
      listSessions: vi.fn().mockRejectedValue(new Error("boom")),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const listLayer2 = findRouteLayer(router2, "/api/dip-studio/v1/sessions", "get");
    const handler2 = listLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.({ query: {}, headers: {} } as Request, response2, next2);

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
      listSessions: vi.fn().mockResolvedValue({
        sessions: []
      }),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn().mockRejectedValue(notFound),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const getLayer1 = findRouteLayer(router1, "/api/dip-studio/v1/sessions/:key", "get");
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
      listSessions: vi.fn().mockRejectedValue(new Error("boom")),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn().mockRejectedValue(new Error("boom")),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const getLayer2 = findRouteLayer(router2, "/api/dip-studio/v1/sessions/:key", "get");
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

  it("forwards session delete HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const notFound = new HttpError(404, "Session not found");

    const router1 = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn(),
      deleteSession: vi.fn().mockRejectedValue(notFound),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const deleteLayer1 = findRouteLayer(
      router1,
      "/api/dip-studio/v1/sessions/:key",
      "delete"
    );
    const handler1 = deleteLayer1?.route?.stack[0]?.handle;
    const response1 = {
      status: vi.fn(),
      send: vi.fn()
    } as unknown as Response;
    vi.mocked(response1.status).mockReturnValue(response1);
    const next1 = vi.fn<NextFunction>();
    const request1 = {
      params: {
        key: "session-key"
      },
      query: {},
      headers: {}
    } as unknown as Request;

    injectAuthenticatedUserId(request1, "user-1");

    await handler1?.(request1, response1, next1);
    expect(next1).toHaveBeenCalledWith(notFound);

    const router2 = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn(),
      deleteSession: vi.fn().mockRejectedValue(new Error("boom")),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const deleteLayer2 = findRouteLayer(
      router2,
      "/api/dip-studio/v1/sessions/:key",
      "delete"
    );
    const handler2 = deleteLayer2?.route?.stack[0]?.handle;
    const response2 = {
      status: vi.fn(),
      send: vi.fn()
    } as unknown as Response;
    vi.mocked(response2.status).mockReturnValue(response2);
    const next2 = vi.fn<NextFunction>();
    const request2 = {
      params: {
        key: "session-key"
      },
      query: {},
      headers: {}
    } as unknown as Request;

    injectAuthenticatedUserId(request2, "user-1");

    await handler2?.(request2, response2, next2);

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to delete session"
    });
  });

  it("forwards session messages HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const notFound = new HttpError(404, "Session not found");

    const router1 = createSessionsRouter({
      listSessions: vi.fn(),
      getSession: vi.fn().mockRejectedValue(notFound),
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const getLayer1 = findRouteLayer(
      router1,
      "/api/dip-studio/v1/sessions/:key/messages",
      "get"
    );
    const handler1 = getLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.(
      {
        params: {
          key: "missing"
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
      deleteSession: vi.fn(),
      getSessionSummary: vi.fn(),
      getSessionArchives: vi.fn(),
      getSessionArchiveSubpath: vi.fn(),
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
    const getLayer2 = findRouteLayer(
      router2,
      "/api/dip-studio/v1/sessions/:key/messages",
      "get"
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
      message: "Failed to query session messages"
    });
  });

  it("forwards session archives HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const forbidden = new HttpError(403, "Forbidden");

    const router1 = createSessionsRouter(
      {
        listSessions: vi.fn(),
        getSession: vi.fn(),
        deleteSession: vi.fn(),
        getSessionSummary: vi.fn(),
        getSessionArchives: vi.fn().mockRejectedValue(forbidden),
        getSessionArchiveSubpath: vi.fn(),
        previewSessions: vi.fn()
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
    const getLayer1 = findRouteLayer(
      router1,
      "/api/dip-studio/v1/sessions/:key/archives",
      "get"
    );
    const handler1 = getLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.(
      {
        params: {
          key: "agent:agent-1:direct:session-1"
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
        deleteSession: vi.fn(),
        getSessionSummary: vi.fn(),
        getSessionArchives: vi.fn().mockRejectedValue(new Error("boom")),
        getSessionArchiveSubpath: vi.fn(),
        previewSessions: vi.fn()
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
    const getLayer2 = findRouteLayer(
      router2,
      "/api/dip-studio/v1/sessions/:key/archives",
      "get"
    );
    const handler2 = getLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.(
      {
        params: {
          key: "agent:agent-1:direct:session-1"
        },
        query: {}
      } as unknown as Request,
      response2,
      next2
    );

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query session archives"
    });
  });

  it("handles session archive subpath request", async () => {
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
        deleteSession: vi.fn(),
        getSessionSummary: vi.fn(),
        getSessionArchives: vi.fn(),
        getSessionArchiveSubpath,
        previewSessions: vi.fn()
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
    const getLayer = findRouteLayer(
      router,
      "/api/dip-studio/v1/sessions/:key/archives/*subpath",
      "get"
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
          key: "agent:de_finance:user:user-1:direct:session-1",
          subpath: "notes/today.txt"
        },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(getSessionArchiveSubpath).toHaveBeenCalledWith(
      "agent:de_finance:user:user-1:direct:session-1",
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
        deleteSession: vi.fn(),
        getSessionSummary: vi.fn(),
        getSessionArchives: vi.fn(),
        getSessionArchiveSubpath: vi.fn().mockRejectedValue(notFound),
        previewSessions: vi.fn()
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
    const getLayer1 = findRouteLayer(
      router1,
      "/api/dip-studio/v1/sessions/:key/archives/*subpath",
      "get"
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
          key: "agent:agent-1:direct:session-1",
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
        deleteSession: vi.fn(),
        getSessionSummary: vi.fn(),
        getSessionArchives: vi.fn(),
        getSessionArchiveSubpath: vi.fn().mockRejectedValue(new Error("boom")),
        previewSessions: vi.fn()
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
    const getLayer2 = findRouteLayer(
      router2,
      "/api/dip-studio/v1/sessions/:key/archives/*subpath",
      "get"
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
          key: "agent:agent-1:direct:session-1",
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
      message: "Failed to query session archive subpath"
    });
  });
});
