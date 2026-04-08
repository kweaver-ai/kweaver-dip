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
    send: vi.fn(),
    setHeader: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.send).mockReturnValue(response);

  return response;
}

/**
 * Locates the last Express route handler by path and HTTP method (after multer, etc.).
 *
 * @param router The Express router.
 * @param method HTTP method.
 * @param path Route path string.
 * @returns The handler function, if any.
 */
function findHandler(
  router: Router,
  method: "get" | "post" | "delete",
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
  const stack = layer?.route?.stack ?? [];
  if (stack.length === 0) {
    return undefined;
  }
  return stack[stack.length - 1]?.handle as (
    request: Request,
    response: Response,
    next: NextFunction
  ) => Promise<void>;
}

/**
 * Builds a request double after multipart parsing (`req.file` + `req.body`).
 *
 * @param buffer Zip file bytes (or empty).
 * @param body Parsed multipart text fields (e.g. `overwrite`).
 * @param originalname Optional upload filename (`multer`); default yields no derived skill id.
 * @returns A minimal Express request double.
 */
function createMultipartSkillRequest(
  buffer: Buffer,
  body: Record<string, unknown> = {},
  originalname = ""
): Request {
  const file: Express.Multer.File = {
    fieldname: "file",
    originalname,
    encoding: "7bit",
    mimetype: "application/zip",
    buffer,
    size: buffer.length,
    destination: "",
    filename: "",
    path: "",
    stream: null as never
  };
  return { file, body, query: {} } as unknown as Request;
}

/**
 * Loads the router module with a mocked agent skills logic.
 *
 * @param logic Mocked logic implementation.
 * @returns The imported router factory.
 */
async function importRouterWithLogicMock(
  logic: {
    listEnabledSkills: () => Promise<unknown>;
    listEnabledSkillsByQuery?: (name?: string) => Promise<unknown>;
    listDigitalHumanSkills?: (id: string) => Promise<unknown>;
    installSkill?: (
      body: Buffer,
      options?: { overwrite?: boolean; name?: string }
    ) => Promise<unknown>;
    uninstallSkill?: (name: string) => Promise<unknown>;
    getSkillTree?: (name: string, resolvedSkillPath: string) => Promise<unknown>;
    getSkillContent?: (name: string, path: string, resolvedSkillPath: string) => Promise<unknown>;
    downloadSkillFile?: (name: string, path: string, resolvedSkillPath: string) => Promise<unknown>;
    resolveSkillPath?: (name: string) => Promise<string>;
    getSkillStatuses?: () => Promise<
      Array<{
        skillKey: string;
        name?: string;
        source?: string;
        skillPath?: string;
      }>
    >;
  }
): Promise<typeof import("./skills")> {
  vi.doMock("../logic/agent-skills", () => ({
    getSkillEntryName: (entry: { name?: string; skillKey: string }) =>
      entry.name ?? entry.skillKey,
    matchesSkillEntry: (
      entry: { skillKey: string; name?: string; skillPath?: string },
      normalizedSkillId: string
    ) => {
      const normalize = (value: string | undefined): string | undefined => {
        const trimmed = value?.trim().toLowerCase();
        return trimmed ? trimmed : undefined;
      };
      if (normalize(entry.skillKey) === normalizedSkillId) {
        return true;
      }
      if (normalize(entry.name) === normalizedSkillId) {
        return true;
      }
      const base = entry.skillPath?.replace(/\\/g, "/").split("/").filter(Boolean).at(-1);
      return normalize(base) === normalizedSkillId;
    },
    DefaultAgentSkillsLogic: vi.fn().mockImplementation(() => ({
      listEnabledSkills: logic.listEnabledSkills,
      listEnabledSkillsByQuery:
        logic.listEnabledSkillsByQuery ?? logic.listEnabledSkills,
      listDigitalHumanSkills:
        logic.listDigitalHumanSkills ?? vi.fn().mockResolvedValue([]),
      listAvailableSkills: vi.fn().mockResolvedValue({ skills: [] }),
      getAgentSkills: vi.fn().mockResolvedValue({ agentId: "a1", skills: [] }),
      updateAgentSkills: vi.fn(),
      installSkill:
        logic.installSkill ??
        vi.fn().mockResolvedValue({
          name: "default",
          skillPath: "/skills/default"
        }),
      uninstallSkill:
        logic.uninstallSkill ??
        vi.fn().mockResolvedValue({ name: "removed" }),
      getSkillTree:
        logic.getSkillTree ??
        vi.fn().mockResolvedValue({
          name: "default",
          entries: []
        }),
      resolveSkillPath:
        logic.resolveSkillPath ??
        vi.fn().mockResolvedValue("/repo/skills/default"),
      getSkillContent:
        logic.getSkillContent ??
        vi.fn().mockResolvedValue({
          name: "default",
          path: "SKILL.md",
          content: "",
          bytes: 0,
          truncated: false
        }),
      downloadSkillFile:
        logic.downloadSkillFile ??
        vi.fn().mockResolvedValue({
          status: 200,
          headers: new Headers(),
          body: new Uint8Array()
        }),
      getSkillStatuses:
        logic.getSkillStatuses ??
        vi.fn().mockResolvedValue([
          {
            skillKey: "default",
            source: "openclaw-bundled",
            skillPath: "/repo/skills/default"
          }
        ])
    }))
  }));

  return import("./skills");
}

describe("createSkillsRouter", () => {
  const skillsPath = "/api/dip-studio/v1/skills";
  const skillTreePath = "/api/dip-studio/v1/skills/:name/tree";
  const skillContentPath = "/api/dip-studio/v1/skills/:name/content";
  const skillDownloadPath = "/api/dip-studio/v1/skills/:name/download";
  const skillsInstallPath = "/api/dip-studio/v1/skills/install";
  const digitalHumanSkillsPath = "/api/dip-studio/v1/digital-human/:id/skills";

  it("registers POST /api/dip-studio/v1/skills/install", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      listEnabledSkillsByQuery: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "post", skillsInstallPath)).toBeDefined();
  });

  it("registers DELETE /api/dip-studio/v1/skills/:name", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      listEnabledSkillsByQuery: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(
      findHandler(router, "delete", "/api/dip-studio/v1/skills/:name")
    ).toBeDefined();
  });

  it("registers GET /api/dip-studio/v1/skills/:name/tree", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "get", skillTreePath)).toBeDefined();
  });

  it("registers GET /api/dip-studio/v1/skills/:name/content", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "get", skillContentPath)).toBeDefined();
  });

  it("registers GET /api/dip-studio/v1/skills/:name/download", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "get", skillDownloadPath)).toBeDefined();
  });

  it("returns skill tree by name", async () => {
    const getSkillTree = vi.fn().mockResolvedValue({
      name: "weather",
      entries: [
        { name: "SKILL.md", path: "SKILL.md", type: "file" },
        {
          name: "docs",
          path: "docs",
          type: "directory",
          children: [{ name: "guide.md", path: "docs/guide.md", type: "file" }]
        }
      ]
    });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      getSkillTree
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillTreePath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "weather" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(getSkillTree).toHaveBeenCalledWith("weather", "/repo/skills/default");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      name: "weather",
      entries: [
        { name: "SKILL.md", path: "SKILL.md", type: "file" },
        {
          name: "docs",
          path: "docs",
          type: "directory",
          children: [{ name: "guide.md", path: "docs/guide.md", type: "file" }]
        }
      ]
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid skill id in tree path", async () => {
    const getSkillTree = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      getSkillTree
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillTreePath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "bad name" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(getSkillTree).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400
      })
    );
  });

  it("returns skill content by name and path", async () => {
    const getSkillContent = vi.fn().mockResolvedValue({
      name: "weather",
      path: "docs/guide.md",
      content: "guide",
      bytes: 5,
      truncated: false
    });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      getSkillContent
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillContentPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: { name: "weather" },
        query: { path: "docs/guide.md" }
      } as unknown as Request,
      response,
      next
    );

    expect(getSkillContent).toHaveBeenCalledWith(
      "weather",
      "docs/guide.md",
      "/repo/skills/default"
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      name: "weather",
      path: "docs/guide.md",
      content: "guide",
      bytes: 5,
      truncated: false
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("defaults to SKILL.md when path is missing in skill content query", async () => {
    const getSkillContent = vi.fn().mockResolvedValue({
      name: "weather",
      path: "SKILL.md",
      content: "# Weather",
      bytes: 9,
      truncated: false
    });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      getSkillContent
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillContentPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "weather" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(getSkillContent).toHaveBeenCalledWith(
      "weather",
      "SKILL.md",
      "/repo/skills/default"
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      name: "weather",
      path: "SKILL.md",
      content: "# Weather",
      bytes: 9,
      truncated: false
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("downloads skill file and forwards response headers", async () => {
    const downloadSkillFile = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({
        "content-type": "text/markdown",
        "content-disposition": 'attachment; filename="SKILL.md"'
      }),
      body: new Uint8Array(Buffer.from("# Skill\n"))
    });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      downloadSkillFile
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillDownloadPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "weather" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(downloadSkillFile).toHaveBeenCalledWith(
      "weather",
      "SKILL.md",
      "/repo/skills/default"
    );
    expect(response.setHeader).toHaveBeenCalledWith("content-type", "text/markdown");
    expect(response.setHeader).toHaveBeenCalledWith(
      "content-disposition",
      'attachment; filename="SKILL.md"'
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(Buffer.from("# Skill\n"));
    expect(next).not.toHaveBeenCalled();
  });

  it("uninstalls skill from path parameter", async () => {
    const uninstallSkill = vi.fn().mockResolvedValue({ name: "weather" });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      uninstallSkill,
      getSkillStatuses: async () => [
        {
          skillKey: "weather",
          source: "openclaw-managed",
          skillPath: "/Users/test/.openclaw/skills/weather"
        }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(
      router,
      "delete",
      "/api/dip-studio/v1/skills/:name"
    );
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "weather" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(uninstallSkill).toHaveBeenCalledWith("weather");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ name: "weather" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid skill id in uninstall path", async () => {
    const uninstallSkill = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      uninstallSkill,
      getSkillStatuses: async () => []
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(
      router,
      "delete",
      "/api/dip-studio/v1/skills/:name"
    );
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "bad name" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(uninstallSkill).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400
      })
    );
  });

  it("returns 404 when deletable skill is not found", async () => {
    const uninstallSkill = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      uninstallSkill,
      getSkillStatuses: async () => [
        { skillKey: "other", source: "openclaw-bundled", skillPath: "/repo/skills/other" }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(
      router,
      "delete",
      "/api/dip-studio/v1/skills/:name"
    );
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "missing" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(uninstallSkill).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404
      })
    );
  });

  it("matches skill entries by skillPath slug when skillKey differs", async () => {
    const uninstallSkill = vi.fn().mockResolvedValue({ name: "excel-xlsx" });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      uninstallSkill,
      getSkillStatuses: async () => [
        {
          skillKey: "excel-xlsx",
          source: "openclaw-managed",
          skillPath: "/Users/test/.openclaw/skills/excel-xlsx"
        }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(
      router,
      "delete",
      "/api/dip-studio/v1/skills/:name"
    );
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "excel-xlsx" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(uninstallSkill).toHaveBeenCalledWith("excel-xlsx");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ name: "excel-xlsx" });
    expect(next).not.toHaveBeenCalled();
  });

  it("matches uninstall target by public skill name when skillKey differs", async () => {
    const uninstallSkill = vi.fn().mockResolvedValue({ name: "smart-ask-data" });
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      uninstallSkill,
      getSkillStatuses: async () => [
        {
          skillKey: "smart_ask_data",
          name: "smart-ask-data",
          source: "openclaw-managed",
          skillPath: "/Users/test/.openclaw/skills/smart-ask-data"
        }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(
      router,
      "delete",
      "/api/dip-studio/v1/skills/:name"
    );
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "smart-ask-data" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(uninstallSkill).toHaveBeenCalledWith("smart-ask-data");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects uninstall when skill source is not openclaw-managed", async () => {
    const uninstallSkill = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      uninstallSkill,
      getSkillStatuses: async () => [
        {
          skillKey: "weather",
          source: "openclaw-bundled",
          skillPath: "/Users/test/.openclaw/skills/weather"
        }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(
      router,
      "delete",
      "/api/dip-studio/v1/skills/:name"
    );
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { name: "weather" }, query: {} } as unknown as Request,
      response,
      next
    );

    expect(uninstallSkill).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403
      })
    );
  });

  it("installs skill from multipart file field", async () => {
    const installSkill = vi.fn().mockResolvedValue({
      name: "weather",
      skillPath: "/repo/skills/weather",
      displayName: "Weather Display"
    });
    const listEnabledSkillsByQuery = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      installSkill,
      listEnabledSkillsByQuery
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "post", skillsInstallPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

    await handler?.(
      createMultipartSkillRequest(zip, { overwrite: "true" }),
      response,
      next
    );

    expect(installSkill).toHaveBeenCalledWith(zip, { overwrite: true });
    expect(listEnabledSkillsByQuery).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      name: "Weather Display",
      skillPath: "/repo/skills/weather"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards optional name for flat-layout installs", async () => {
    const installSkill = vi.fn().mockResolvedValue({
      name: "my-skill",
      skillPath: "/repo/skills/my-skill",
      displayName: "Custom Skill"
    });
    const listEnabledSkillsByQuery = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      installSkill,
      listEnabledSkillsByQuery
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "post", skillsInstallPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

    await handler?.(
      createMultipartSkillRequest(zip, { skillName: "my-skill" }),
      response,
      next
    );

    expect(installSkill).toHaveBeenCalledWith(zip, { name: "my-skill" });
  });

  it("derives name from upload filename when multipart name is absent", async () => {
    const installSkill = vi.fn().mockResolvedValue({
      name: "weather",
      skillPath: "/repo/skills/weather",
      displayName: "weather"
    });
    const listEnabledSkillsByQuery = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      installSkill,
      listEnabledSkillsByQuery
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "post", skillsInstallPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

    await handler?.(
      createMultipartSkillRequest(zip, {}, "weather.skill"),
      response,
      next
    );

    expect(installSkill).toHaveBeenCalledWith(zip, { name: "weather" });
  });

  it("falls back to skills list when displayName is missing", async () => {
    const installSkill = vi.fn().mockResolvedValue({
      name: "weather",
      skillPath: "/repo/skills/weather"
    });
    const listEnabledSkillsByQuery = vi.fn().mockResolvedValue([
      { name: "Weather Pretty", description: undefined, built_in: false, type: "unknown" }
    ]);
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      installSkill,
      listEnabledSkillsByQuery
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "post", skillsInstallPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

    await handler?.(createMultipartSkillRequest(zip), response, next);

    expect(listEnabledSkillsByQuery).toHaveBeenCalledWith("weather");
    expect(response.json).toHaveBeenCalledWith({
      name: "Weather Pretty",
      skillPath: "/repo/skills/weather"
    });
  });

  it("rejects missing or empty multipart file", async () => {
    const installSkill = vi.fn();
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      installSkill
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "post", skillsInstallPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { file: undefined, query: {} } as unknown as Request,
      response,
      next
    );

    expect(installSkill).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400
      })
    );

    next.mockClear();
    await handler?.(
      createMultipartSkillRequest(Buffer.alloc(0)),
      response,
      next
    );
    expect(installSkill).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400
      })
    );
  });

  it("registers GET /api/dip-studio/v1/skills", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "get", skillsPath)).toBeDefined();
  });

  it("returns available skills on success", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [
        { name: "planner", description: "plan tasks", built_in: false, type: "unknown" },
        { name: "writer", description: "write docs", built_in: false, type: "unknown" }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", skillsPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      { name: "planner", description: "plan tasks", built_in: false, type: "unknown" },
      { name: "writer", description: "write docs", built_in: false, type: "unknown" }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("registers GET /api/dip-studio/v1/digital-human/:id/skills", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => []
    });
    const router = createSkillsRouter() as Router;

    expect(findHandler(router, "get", digitalHumanSkillsPath)).toBeDefined();
  });

  it("returns configured digital human skills on success", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      listDigitalHumanSkills: async (id) => [
        { name: `${id}-planner`, description: "plan tasks", built_in: false, type: "unknown" }
      ]
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", digitalHumanSkillsPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { id: "a1" } } as unknown as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      { name: "a1-planner", description: "plan tasks", built_in: false, type: "unknown" }
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects empty digital human id", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => []
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", digitalHumanSkillsPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { id: " " } } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "id path parameter is required"
      })
    );
  });

  it("wraps unexpected errors", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => {
        throw new Error("boom");
      }
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

  it("wraps unexpected digital human skills errors", async () => {
    const { createSkillsRouter } = await importRouterWithLogicMock({
      listEnabledSkills: async () => [],
      listDigitalHumanSkills: async () => {
        throw new Error("boom");
      }
    });
    const router = createSkillsRouter() as Router;
    const handler = findHandler(router, "get", digitalHumanSkillsPath);
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      { params: { id: "a1" } } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        message: "Failed to query digital human skills"
      })
    );
  });
});
