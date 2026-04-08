import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import { createGuideRouter, readInitializeGuideRequestBody } from "./guide";

/**
 * Creates a minimal response double with chainable methods.
 *
 * @returns The mocked response object.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    sendStatus: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.sendStatus).mockReturnValue(response);

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
  method: "get" | "post"
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

describe("readInitializeGuideRequestBody", () => {
  it("validates the initialize payload", () => {
    expect(
      readInitializeGuideRequestBody({
        openclaw_address: "ws://127.0.0.1:19001",
        openclaw_token: "token-1",
        kweaver_base_url: "https://kweaver.example.com",
        kweaver_token: "kw-token"
      })
    ).toEqual({
      openclaw_address: "ws://127.0.0.1:19001",
      openclaw_token: "token-1",
      kweaver_base_url: "https://kweaver.example.com",
      kweaver_token: "kw-token"
    });
    expect(() => readInitializeGuideRequestBody(null)).toThrow(
      "Guide initialize request body must be a JSON object"
    );
    expect(() => readInitializeGuideRequestBody({
      openclaw_address: "",
      openclaw_token: "token-1"
    })).toThrow("openclaw_address is required");
    expect(() => readInitializeGuideRequestBody({
      openclaw_address: "ws://127.0.0.1:19001",
      openclaw_token: "token-1",
      kweaver_base_url: "https://kweaver.example.com"
    })).toThrow("kweaver_token is required when kweaver_base_url is provided");
    expect(() => readInitializeGuideRequestBody({
      openclaw_address: "ws://127.0.0.1:19001",
      openclaw_token: "token-1",
      kweaver_token: "kw-token"
    })).toThrow("kweaver_base_url is required when kweaver_token is provided");
  });
});

describe("createGuideRouter", () => {
  it("registers guide routes", () => {
    const router = createGuideRouter({
      getStatus: vi.fn(),
      getOpenClawConfig: vi.fn(),
      initialize: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
        };
      }>;
    };

    expect(findRouteLayer(router, "/api/dip-studio/v1/guide/status", "get")).toBeDefined();
    expect(
      findRouteLayer(router, "/api/dip-studio/v1/guide/openclaw-config", "get")
    ).toBeDefined();
    expect(
      findRouteLayer(router, "/api/dip-studio/v1/guide/initialize", "post")
    ).toBeDefined();
  });

  it("handles guide status requests", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      state: "pending",
      ready: false,
      missing: ["envFile"]
    });
    const router = createGuideRouter({
      getStatus,
      getOpenClawConfig: vi.fn(),
      initialize: vi.fn()
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
    const layer = findRouteLayer(router, "/api/dip-studio/v1/guide/status", "get");
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await layer?.route?.stack[0]?.handle({} as Request, response, next);

    expect(getStatus).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      state: "pending",
      ready: false,
      missing: ["envFile"]
    });
  });

  it("forwards logic errors from initialize requests", async () => {
    const initialize = vi.fn().mockRejectedValue(new HttpError(500, "boom"));
    const router = createGuideRouter({
      getStatus: vi.fn(),
      getOpenClawConfig: vi.fn(),
      initialize
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
    const layer = findRouteLayer(router, "/api/dip-studio/v1/guide/initialize", "post");
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await layer?.route?.stack[0]?.handle(
      {
        body: {
          openclaw_address: "ws://127.0.0.1:19001",
          openclaw_token: "token-1",
          kweaver_base_url: "https://kweaver.example.com",
          kweaver_token: "kw-token"
        }
      } as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(new HttpError(500, "boom"));
  });

  it("returns 200 without a response body when initialization succeeds", async () => {
    const initialize = vi.fn().mockResolvedValue(undefined);
    const router = createGuideRouter({
      getStatus: vi.fn(),
      getOpenClawConfig: vi.fn(),
      initialize
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
    const layer = findRouteLayer(router, "/api/dip-studio/v1/guide/initialize", "post");
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await layer?.route?.stack[0]?.handle(
      {
        body: {
          openclaw_address: "ws://127.0.0.1:19001",
          openclaw_token: "token-1",
          kweaver_base_url: "https://kweaver.example.com",
          kweaver_token: "kw-token"
        }
      } as Request,
      response,
      next
    );

    expect(response.sendStatus).toHaveBeenCalledWith(200);
    expect(response.json).not.toHaveBeenCalled();
  });
});
