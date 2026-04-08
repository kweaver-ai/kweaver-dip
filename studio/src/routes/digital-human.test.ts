import type {
  NextFunction,
  Request,
  Response,
  Router
} from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

/**
 * Creates a minimal response double with chainable methods.
 *
 * @returns The mocked response object.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
}

/**
 * Locates an Express route handler by path and HTTP method.
 *
 * @param router The Express router.
 * @param method HTTP method.
 * @param path Route path string.
 * @returns The handler function, if any.
 */
function findHandler(
  router: Router,
  method: "get" | "post" | "put" | "delete",
  path: string
):
  | ((
      request: Request,
      response: Response,
      next: NextFunction
    ) => Promise<void>)
  | undefined {
  const layer = router.stack.find((l) => {
    const r = l.route;
    if (!r || r.path !== path) {
      return false;
    }
    return Boolean((r.methods as Record<string, boolean>)[method]);
  });
  return layer?.route?.stack[0]?.handle;
}

type LogicMocks = Partial<{
  listBuiltInDigitalHumans: () => Promise<unknown>;
  createBuiltInDigitalHumans: (ids: string[], deps: unknown) => Promise<unknown>;
  listDigitalHumans: () => Promise<unknown>;
  getDigitalHuman: (id: string) => Promise<unknown>;
  createDigitalHuman: (body: unknown) => Promise<unknown>;
  updateDigitalHuman: (id: string, patch: unknown) => Promise<unknown>;
  deleteDigitalHuman: (id: string, deleteFiles?: boolean) => Promise<void>;
}>;

/**
 * Loads the router module with a mocked {@link DefaultDigitalHumanLogic}.
 *
 * @param logic Mock implementations for logic methods.
 * @returns The imported router factory.
 */
async function importRouterWithLogicMock(
  logic: LogicMocks
): Promise<typeof import("./digital-human")> {
  vi.doMock("../logic/digital-human", () => ({
    DefaultDigitalHumanLogic: vi.fn().mockImplementation(() => ({
      listDigitalHumans:
        logic.listDigitalHumans ?? vi.fn().mockResolvedValue([]),
      getDigitalHuman:
        logic.getDigitalHuman ??
        vi.fn().mockResolvedValue({
          id: "x",
          name: "x",
          soul: ""
        }),
      createDigitalHuman:
        logic.createDigitalHuman ??
        vi.fn().mockResolvedValue({ id: "new", name: "n" }),
      updateDigitalHuman:
        logic.updateDigitalHuman ??
        vi.fn().mockResolvedValue({ id: "x", name: "n", soul: "" }),
      deleteDigitalHuman:
        logic.deleteDigitalHuman ?? vi.fn().mockResolvedValue(undefined)
    }))
  }));
  vi.doMock("../logic/built-in-digital-human", () => ({
    DefaultBuiltInDigitalHumanLogic: vi.fn().mockImplementation(() => ({
      listBuiltInDigitalHumans:
        logic.listBuiltInDigitalHumans ?? vi.fn().mockResolvedValue([]),
      createBuiltInDigitalHumans:
        logic.createBuiltInDigitalHumans ?? vi.fn().mockResolvedValue([])
    }))
  }));

  return import("./digital-human");
}

describe("createDigitalHumanRouter", () => {
  const builtInListPath = "/api/dip-studio/v1/digital-human/built-in";
  const builtInCreatePath = "/api/dip-studio/v1/digital-human/built-in/:ids";
  const listPath = "/api/dip-studio/v1/digital-human";
  const detailPath = "/api/dip-studio/v1/digital-human/:id";

  it("registers GET /api/dip-studio/v1/digital-human/built-in", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;

    expect(findHandler(router, "get", builtInListPath)).toBeDefined();
  });

  it("returns the built-in digital human list on success", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listBuiltInDigitalHumans: async () => [
        {
          id: "__bkn_creator__",
          name: "BKN Creator",
          description: "desc"
        }
      ]
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "get", builtInListPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: "__bkn_creator__",
        name: "BKN Creator",
        description: "desc"
      }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("registers PUT /api/dip-studio/v1/digital-human/built-in/:ids", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;

    expect(findHandler(router, "put", builtInCreatePath)).toBeDefined();
  });

  it("creates selected built-in digital humans", async () => {
    const createBuiltInDigitalHumans = vi.fn().mockResolvedValue([
      { id: "a1", name: "BKN Creator" }
    ]);
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      createBuiltInDigitalHumans
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "put", builtInCreatePath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { ids: "__bkn_creator__,analyst" } } as unknown as Request,
      response,
      next
    );

    expect(createBuiltInDigitalHumans).toHaveBeenCalledWith(
      ["__bkn_creator__", "analyst"],
      expect.objectContaining({
        agentSkillsLogic: expect.any(Object),
        digitalHumanLogic: expect.any(Object)
      })
    );
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith([{ id: "a1", name: "BKN Creator" }]);
    expect(next).not.toHaveBeenCalled();
  });

  it("registers GET /api/dip-studio/v1/digital-human", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;

    expect(findHandler(router, "get", listPath)).toBeDefined();
  });

  it("returns the digital human list on success", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [
        {
          id: "a1",
          name: "Visible Agent"
        }
      ]
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "get", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: "a1",
        name: "Visible Agent"
      }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("GET :id returns detail", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      getDigitalHuman: async (id) => ({
        id,
        name: "N",
        soul: "s"
      })
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "get", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { id: "a1" } } as unknown as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      id: "a1",
      name: "N",
      soul: "s"
    });
  });

  it("POST create returns 201", async () => {
    const createDigitalHuman = vi
      .fn()
      .mockResolvedValue({ id: "x", name: "n", soul: "" });
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      createDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "slug-name",
          soul: "s"
        }
      } as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ id: "x", name: "n", soul: "" });
  });

  it("POST create forwards client-supplied id", async () => {
    const createDigitalHuman = vi.fn().mockResolvedValue({ id: "x", name: "n", soul: "" });
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      createDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          id: "client-id",
          name: "slug-name",
          soul: "s"
        }
      } as Request,
      response,
      next
    );

    expect(createDigitalHuman).toHaveBeenCalledWith({
      id: "client-id",
      name: "slug-name",
      creature: undefined,
      icon_id: undefined,
      soul: "s",
      skills: undefined,
      bkn: undefined,
      channel: undefined
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("POST create rejects an empty id when provided", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          id: "   ",
          name: "slug-name",
          soul: "s"
        }
      } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: "id must be a non-empty string when provided" })
    );
  });

  it("PUT :id updates", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      updateDigitalHuman: async () => ({
        id: "i",
        name: "n",
        soul: ""
      })
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "put", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: { id: "i" },
        body: { name: "new" }
      } as unknown as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("DELETE :id returns 204", async () => {
    const deleteDigitalHuman = vi.fn().mockResolvedValue(undefined);
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      deleteDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "delete", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: { id: "i" },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(deleteDigitalHuman).toHaveBeenCalledWith("i", undefined);
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.end).toHaveBeenCalled();
  });

  it("DELETE passes deleteFiles=false from query", async () => {
    const deleteDigitalHuman = vi.fn().mockResolvedValue(undefined);
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      deleteDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "delete", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: { id: "i" },
        query: { deleteFiles: "false" }
      } as unknown as Request,
      response,
      next
    );

    expect(deleteDigitalHuman).toHaveBeenCalledWith("i", false);
  });

  it("forwards HttpError instances without wrapping them", async () => {
    const { HttpError } = await import("../errors/http-error");
    const error = new HttpError(503, "Gateway unavailable");
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => {
        throw error;
      }
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "get", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("wraps unexpected errors with a gateway failure HttpError", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => {
        throw new Error("boom");
      }
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "get", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query digital humans"
    });
    expect(response.status).not.toHaveBeenCalled();
  });

  it("POST create forwards HttpError as-is", async () => {
    const { HttpError } = await import("../errors/http-error");
    const err = new HttpError(400, "bad");
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      createDigitalHuman: async () => {
        throw err;
      }
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { body: { name: "x" } } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(err);
  });

  it("POST without name returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({ body: {} } as Request, response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("PUT with empty patch returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "put", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { id: "x" }, body: {} } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("GET :id with empty id returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "get", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { id: "  " } } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("POST with incomplete channel returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "ok",
          channel: { appId: "only" }
        }
      } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("POST with invalid channel.type returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "ok",
          channel: { type: "slack", appId: "a", appSecret: "b" }
        }
      } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("POST trims whitespace in channel.type", async () => {
    const createDigitalHuman = vi.fn().mockResolvedValue({ id: "x", name: "n" });
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      createDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "n",
          channel: { type: "  dingtalk  ", appId: "a", appSecret: "b" }
        }
      } as Request,
      response,
      next
    );

    expect(createDigitalHuman).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: { type: "dingtalk", appId: "a", appSecret: "b" }
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("POST with non-string channel.type returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "ok",
          channel: { type: 1, appId: "a", appSecret: "b" }
        }
      } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("POST with invalid bkn entry returns 400", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({});
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "ok",
          bkn: [{ name: "n" }]
        }
      } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it("POST forwards full valid payload to logic", async () => {
    const createDigitalHuman = vi
      .fn()
      .mockResolvedValue({ id: "x", name: "n", soul: "s" });
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      createDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "post", listPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "n",
          creature: "c",
          soul: "s",
          skills: ["sk"],
          bkn: [{ name: "bn", url: "https://u" }],
          channel: { type: "dingtalk", appId: "i", appSecret: "sec" }
        }
      } as Request,
      response,
      next
    );

    expect(createDigitalHuman).toHaveBeenCalledWith(
      expect.objectContaining({
        id: undefined,
        name: "n",
        creature: "c",
        soul: "s",
        skills: ["sk"],
        bkn: [{ name: "bn", url: "https://u" }],
        channel: { type: "dingtalk", appId: "i", appSecret: "sec" }
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("PUT forwards skills and bkn patches", async () => {
    const updateDigitalHuman = vi.fn().mockResolvedValue({ id: "i", name: "n", soul: "" });
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      updateDigitalHuman
    });
    const router = createDigitalHumanRouter() as Router;
    const handler = findHandler(router, "put", detailPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: { id: "i" },
        body: {
          skills: ["a", "b"],
          bkn: [{ name: "x", url: "https://y" }]
        }
      } as unknown as Request,
      response,
      next
    );

    expect(updateDigitalHuman).toHaveBeenCalledWith("i", {
      skills: ["a", "b"],
      bkn: [{ name: "x", url: "https://y" }]
    });
    expect(next).not.toHaveBeenCalled();
  });
});
