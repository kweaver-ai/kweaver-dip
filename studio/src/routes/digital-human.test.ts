import type { NextFunction, Request, Response } from "express";
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
    json: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
}

/**
 * Loads the router module with a mocked digital human logic result.
 *
 * @param listDigitalHumans Mocked route logic implementation.
 * @returns The imported router factory.
 */
async function importRouterWithLogicMock(
  logic: {
    listDigitalHumans: () => Promise<unknown>;
    createDigitalHuman: (payload: unknown) => Promise<unknown>;
  }
): Promise<typeof import("./digital-human")> {
  vi.doMock("../logic/digital-human", () => ({
    FileSystemDigitalHumanWorkspaceStore: vi
      .fn()
      .mockImplementation(() => ({})),
    DefaultDigitalHumanLogic: vi.fn().mockImplementation(() => ({
      listDigitalHumans: logic.listDigitalHumans,
      createDigitalHuman: logic.createDigitalHuman
    }))
  }));

  return import("./digital-human");
}

describe("createDigitalHumanRouter", () => {
  it("registers GET /api/dip-studio/v1/digital-human", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [],
      createDigitalHuman: async () => ({})
    });
    const router = createDigitalHumanRouter() as {
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
    const layer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human"
    );

    expect(layer).toBeDefined();
  });

  it("registers POST /api/dip-studio/v1/digital-human", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [],
      createDigitalHuman: async () => ({})
    });
    const router = createDigitalHumanRouter() as {
      stack: Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
        };
      }>;
    };
    const layer = router.stack.find(
      (entry) =>
        entry.route?.path === "/api/dip-studio/v1/digital-human" &&
        entry.route.methods.post === true
    );

    expect(layer).toBeDefined();
  });

  it("returns the digital human list on success", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [
        {
          id: "main",
          name: "Main Agent",
          avatar: "https://example.com/main.png"
        }
      ],
      createDigitalHuman: async () => ({})
    });
    const router = createDigitalHumanRouter() as {
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
    const layer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png"
      }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("creates a digital human on POST success", async () => {
    const createDigitalHuman = vi.fn().mockResolvedValue({
      id: "main",
      name: "Main Agent",
      channel: "telegram",
      skills: ["planner"],
      workspace: "workspace/main"
    });
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [],
      createDigitalHuman
    });
    const router = createDigitalHumanRouter() as {
      stack: Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
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
    const layer = router.stack.find(
      (entry) =>
        entry.route?.path === "/api/dip-studio/v1/digital-human" &&
        entry.route.methods.post === true
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        body: {
          name: "  Main Agent  ",
          skills: ["planner"]
        }
      } as Request,
      response,
      next
    );

    expect(createDigitalHuman).toHaveBeenCalledWith({
      id: undefined,
      name: "Main Agent",
      avatar: undefined,
      identity: undefined,
      soul: undefined,
      skills: ["planner"]
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      id: "main"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards HttpError instances without wrapping them", async () => {
    const { HttpError } = await import("../errors/http-error");
    const error = new HttpError(503, "Gateway unavailable");
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => {
        throw error;
      },
      createDigitalHuman: async () => ({})
    });
    const router = createDigitalHumanRouter() as {
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
    const layer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("forwards create HttpError instances without wrapping them", async () => {
    const { HttpError } = await import("../errors/http-error");
    const error = new HttpError(400, "Invalid request");
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [],
      createDigitalHuman: async () => {
        throw error;
      }
    });
    const router = createDigitalHumanRouter() as {
      stack: Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
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
    const layer = router.stack.find(
      (entry) =>
        entry.route?.path === "/api/dip-studio/v1/digital-human" &&
        entry.route.methods.post === true
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({ body: { name: "Main Agent" } } as Request, response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("wraps unexpected errors with a gateway failure HttpError", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => {
        throw new Error("boom");
      },
      createDigitalHuman: async () => ({})
    });
    const router = createDigitalHumanRouter() as {
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
    const layer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human"
    );
    const handler = layer?.route?.stack[0]?.handle;
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

  it("wraps unexpected create errors with a gateway failure HttpError", async () => {
    const { createDigitalHumanRouter } = await importRouterWithLogicMock({
      listDigitalHumans: async () => [],
      createDigitalHuman: async () => {
        throw new Error("boom");
      }
    });
    const router = createDigitalHumanRouter() as {
      stack: Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
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
    const layer = router.stack.find(
      (entry) =>
        entry.route?.path === "/api/dip-studio/v1/digital-human" &&
        entry.route.methods.post === true
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({ body: { name: "Main Agent" } } as Request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to create digital human"
    });
    expect(response.status).not.toHaveBeenCalled();
  });
});

describe("parseCreateDigitalHumanRequest", () => {
  it("normalizes a valid create request payload", async () => {
    const { parseCreateDigitalHumanRequest } = await import("./digital-human");

    expect(
      parseCreateDigitalHumanRequest({
        id: " main ",
        name: " Main Agent ",
        avatar: " https://example.com/main.png ",
        identity: " # Identity ",
        soul: " # Soul ",
        skills: ["planner", "writer"]
      })
    ).toEqual({
      id: "main",
      name: "Main Agent",
      avatar: "https://example.com/main.png",
      identity: "# Identity",
      soul: "# Soul",
      skills: ["planner", "writer"]
    });
  });

  it("rejects invalid create request payloads", async () => {
    const { parseCreateDigitalHumanRequest } = await import("./digital-human");

    expect(() => parseCreateDigitalHumanRequest(null)).toThrow(
      "Request body must be a JSON object"
    );
    expect(() => parseCreateDigitalHumanRequest({})).toThrow(
      'Field "name" is required'
    );
    expect(() =>
      parseCreateDigitalHumanRequest({
        name: "Main Agent",
        skills: ["planner", 1]
      })
    ).toThrow('Field "skills[1]" must be a string');
  });
});
