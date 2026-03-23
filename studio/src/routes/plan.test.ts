import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import {
  createCronRouter,
  parseBooleanQueryValue,
  parseCronJobSortDir,
  parseCronRunSortDir,
  parseNonNegativeIntegerString,
  parseOptionalSingleQueryValue,
  parseQueryStringList,
  readCronJobListQuery,
  readCronRunListQuery
} from "./plan";

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

describe("readCronJobListQuery", () => {
  it("uses expected defaults", () => {
    expect(readCronJobListQuery({})).toEqual({
      includeDisabled: true,
      limit: 50,
      offset: 0,
      enabled: "all",
      sortBy: "nextRunAtMs",
      sortDir: "asc"
    });
  });

  it("rejects invalid enum values", () => {
    expect(() =>
      readCronJobListQuery({
        enabled: "bad"
      })
    ).toThrow("Invalid query parameter `enabled`");
    expect(() =>
      readCronJobListQuery({
        sortBy: "bad"
      })
    ).toThrow("Invalid query parameter `sortBy`");
    expect(() =>
      readCronJobListQuery({
        sortDir: "bad"
      })
    ).toThrow("Invalid query parameter `sortDir`");
  });
});

describe("readCronRunListQuery", () => {
  it("uses expected defaults", () => {
    expect(readCronRunListQuery({})).toEqual({
      scope: "all",
      id: undefined,
      jobId: undefined,
      limit: 50,
      offset: 0,
      status: "all",
      statuses: undefined,
      deliveryStatus: undefined,
      deliveryStatuses: undefined,
      query: undefined,
      sortDir: "desc"
    });
  });

  it("rejects scope=job without id/jobId", () => {
    expect(() => readCronRunListQuery({ scope: "job" })).toThrow(
      "Invalid query parameter `id` or `jobId`"
    );
  });

  it("rejects invalid scope and over-limit requests", () => {
    expect(() => readCronRunListQuery({ scope: "bad" })).toThrow(
      "Invalid query parameter `scope`"
    );
    expect(() =>
      readCronRunListQuery({
        limit: "201"
      })
    ).toThrow("Invalid query parameter `limit`");
  });

  it("parses list filters", () => {
    expect(
      readCronRunListQuery({
        statuses: "ok,error",
        deliveryStatus: "unknown",
        deliveryStatuses: ["unknown", "not-delivered"]
      })
    ).toMatchObject({
      deliveryStatus: "unknown",
      statuses: ["ok", "error"],
      deliveryStatuses: ["unknown", "not-delivered"]
    });
  });

  it("parses explicit status filter", () => {
    expect(
      readCronRunListQuery({
        status: "ok"
      })
    ).toMatchObject({
      status: "ok"
    });
  });

  it("rejects invalid list filters", () => {
    expect(() =>
      readCronRunListQuery({
        statuses: "ok,bad"
      })
    ).toThrow("Invalid query parameter `statuses`");
  });
});

describe("cron helpers", () => {
  it("validates helper parsers", () => {
    expect(() => parseBooleanQueryValue("x", true, "includeDisabled")).toThrow(
      "Invalid query parameter `includeDisabled`"
    );
    expect(() => parseNonNegativeIntegerString("-1", 1, "limit")).toThrow(
      "Invalid query parameter `limit`"
    );
    expect(parseCronJobSortDir("desc")).toBe("desc");
    expect(parseCronJobSortDir(undefined)).toBe("asc");
    expect(parseCronRunSortDir(undefined)).toBe("desc");
    expect(parseOptionalSingleQueryValue(["single"], "id")).toBe("single");
    expect(() => parseOptionalSingleQueryValue(["a", "b"], "id")).toThrow(
      "Invalid query parameter `id`"
    );
    expect(parseQueryStringList("ok,error", "statuses")).toEqual(["ok", "error"]);
    expect(() => parseQueryStringList("", "statuses")).toThrow(
      "Invalid query parameter `statuses`"
    );
    expect(() => parseCronRunSortDir("bad")).toThrow(
      "Invalid query parameter `sortDir`"
    );
  });
});

describe("createCronRouter", () => {
  it("registers plans routes", () => {
    const router = createCronRouter({
      listCronJobs: vi.fn(),
      listCronRuns: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
        };
      }>;
    };

    const jobsLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/plans"
    );
    const plansLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/plans"
    );
    const planRunsLayer = router.stack.find(
      (entry) =>
        entry.route?.path === "/api/dip-studio/v1/plans/:id/runs"
    );

    expect(jobsLayer).toBeDefined();
    expect(plansLayer).toBeDefined();
    expect(planRunsLayer).toBeDefined();
  });

  it("handles cron jobs request", async () => {
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [],
      total: 0,
      offset: 0,
      limit: 50,
      hasMore: false,
      nextOffset: null
    });
    const router = createCronRouter({
      listCronJobs,
      listCronRuns: vi.fn()
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
    const jobsLayer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/plans"
    );
    const handler = jobsLayer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.({ query: {} } as Request, response, next);

    expect(listCronJobs).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards cron jobs HttpError and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const badRequest = new HttpError(400, "Invalid query parameter `limit`");
    const router1 = createCronRouter({
      listCronJobs: vi.fn().mockRejectedValue(badRequest),
      listCronRuns: vi.fn()
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
    const jobsLayer1 = router1.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/plans"
    );
    const handler1 = jobsLayer1?.route?.stack[0]?.handle;
    const response1 = createResponseDouble();
    const next1 = vi.fn<NextFunction>();

    await handler1?.({ query: {} } as Request, response1, next1);

    expect(next1).toHaveBeenCalledWith(badRequest);

    const router2 = createCronRouter({
      listCronJobs: vi.fn().mockRejectedValue(new Error("boom")),
      listCronRuns: vi.fn()
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
    const jobsLayer2 = router2.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/plans"
    );
    const handler2 = jobsLayer2?.route?.stack[0]?.handle;
    const response2 = createResponseDouble();
    const next2 = vi.fn<NextFunction>();

    await handler2?.({ query: {} } as Request, response2, next2);

    expect(next2).toHaveBeenCalledOnce();
    expect(vi.mocked(next2).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 502,
      message: "Failed to query cron jobs"
    });
  });

  it("handles digital human plans request with id filtering", async () => {
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [
        {
          id: "p-1",
          agentId: "dh-1",
          sessionKey: "s-1",
          name: "Plan 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        },
        {
          id: "p-2",
          agentId: "dh-2",
          sessionKey: "s-2",
          name: "Plan 2",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 10 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 2,
      offset: 0,
      limit: 50,
      hasMore: false,
      nextOffset: null
    });
    const router = createCronRouter({
      listCronJobs,
      listCronRuns: vi.fn()
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
    const layer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/plans"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          id: "dh-1"
        },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(listCronJobs).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      jobs: [
        {
          id: "p-1",
          agentId: "dh-1",
          sessionKey: "s-1",
          name: "Plan 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 1,
      hasMore: false,
      nextOffset: null
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("handles plan runs request with id override", async () => {
    const listCronRuns = vi.fn().mockResolvedValue({
      entries: [],
      total: 0,
      offset: 0,
      limit: 50,
      hasMore: false,
      nextOffset: null
    });
    const router = createCronRouter({
      listCronJobs: vi.fn(),
      listCronRuns
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
    const layer = router.stack.find(
      (entry) =>
        entry.route?.path === "/api/dip-studio/v1/plans/:id/runs"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await handler?.(
      {
        params: {
          id: "plan-1"
        },
        query: {}
      } as unknown as Request,
      response,
      next
    );

    expect(listCronRuns).toHaveBeenCalledWith({
      scope: "job",
      id: undefined,
      jobId: "plan-1",
      limit: 50,
      offset: 0,
      status: "all",
      statuses: undefined,
      deliveryStatus: undefined,
      deliveryStatuses: undefined,
      query: undefined,
      sortDir: "desc"
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
