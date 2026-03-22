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
    json: vi.fn()
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
  method: "get",
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

/**
 * Loads the router module with a mocked digital human logic.
 *
 * @param listEnabledSkills Mocked logic implementation.
 * @returns The imported router factory.
 */
async function importRouterWithLogicMock(
  listEnabledSkills: () => Promise<unknown>
): Promise<typeof import("./skills")> {
  vi.doMock("../logic/digital-human", () => ({
    DefaultDigitalHumanLogic: vi.fn().mockImplementation(() => ({
      listEnabledSkills
    }))
  }));

  return import("./skills");
}

describe("createSkillsRouter", () => {
  const skillsPath = "/api/dip-studio/v1/skills";

  it("registers GET /api/dip-studio/v1/skills", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock(async () => []);
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "get", skillsPath)).toBeDefined();
  });

  it("returns available skills on success", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock(async () => [
      { name: "planner", description: "plan tasks" },
      { name: "writer", description: "write docs" }
    ]);
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillsPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      { name: "planner", description: "plan tasks" },
      { name: "writer", description: "write docs" }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("wraps unexpected errors", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock(async () => {
      throw new Error("boom");
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillsPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        message: "Failed to query enabled skills"
      })
    );
  });
});
