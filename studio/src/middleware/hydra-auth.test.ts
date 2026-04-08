import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  DEFAULT_AUTH_WHITELIST,
  createHydraAuthMiddleware,
  injectUserIdHeader,
  isWhitelistedPath,
  readActiveUserId,
  readBearerToken,
  readMockUserId
} from "./hydra-auth";

describe("isWhitelistedPath", () => {
  it("matches exact whitelisted paths only", () => {
    expect(isWhitelistedPath("/health", ["/health"])).toBe(true);
    expect(isWhitelistedPath("/v1/chat", ["/health"])).toBe(false);
  });

  it("includes the public guide endpoints", () => {
    expect(DEFAULT_AUTH_WHITELIST).toContain("/health");
    expect(DEFAULT_AUTH_WHITELIST).not.toContain("/api/dip-studio/v1/guide/status");
    expect(DEFAULT_AUTH_WHITELIST).not.toContain(
      "/api/dip-studio/v1/guide/openclaw-config"
    );
    expect(DEFAULT_AUTH_WHITELIST).not.toContain("/api/dip-studio/v1/guide/initialize");
  });
});

describe("readBearerToken", () => {
  it("extracts a bearer token and rejects malformed values", () => {
    expect(readBearerToken("Bearer token-1")).toBe("token-1");
    expect(() => readBearerToken(undefined)).toThrowError(
      new HttpError(401, "Authorization header is required")
    );
    expect(() => readBearerToken("Basic token-1")).toThrowError(
      new HttpError(401, "Authorization header must use Bearer token")
    );
  });
});

describe("readMockUserId", () => {
  it("requires a configured mock user id", () => {
    expect(readMockUserId(" user-1 ")).toBe("user-1");
    expect(() => readMockUserId(" ")).toThrowError(
      new HttpError(500, "OAUTH_MOCK_USER_ID must be configured in development mode")
    );
  });
});

describe("readActiveUserId", () => {
  it("requires an active Hydra subject", () => {
    expect(readActiveUserId({
      active: true,
      sub: " user-1 "
    })).toBe("user-1");
    expect(() => readActiveUserId({
      active: false,
      sub: "user-1"
    })).toThrowError(new HttpError(401, "Access token is invalid or inactive"));
    expect(() => readActiveUserId({
      active: true
    })).toThrowError(new HttpError(401, "Access token is missing user subject"));
  });
});

describe("injectUserIdHeader", () => {
  it("stores the authenticated user id in the request headers", () => {
    const request = {
      headers: {}
    } as Request;

    injectUserIdHeader(request, "user-1");

    expect(request.headers["x-user-id"]).toBe("user-1");
  });
});

describe("createHydraAuthMiddleware", () => {
  it("skips Hydra and injects the mock user id in development mode", async () => {
    const next = vi.fn<NextFunction>();
    const hydraHttpClient = {
      introspectAccessToken: vi.fn()
    };
    const middleware = createHydraAuthMiddleware({
      hydraHttpClient,
      isDevelopment: true,
      mockUserId: "user-dev"
    });
    const request = {
      path: "/api/dip-studio/v1/sessions",
      headers: {
        authorization: "Bearer token-1"
      }
    } as unknown as Request;

    await middleware(request, {} as Response, next);

    expect(hydraHttpClient.introspectAccessToken).not.toHaveBeenCalled();
    expect(request.headers["x-user-id"]).toBe("user-dev");
    expect(next).toHaveBeenCalledWith();
  });

  it("introspects the bearer token and injects the user id in production mode", async () => {
    const next = vi.fn<NextFunction>();
    const hydraHttpClient = {
      introspectAccessToken: vi.fn().mockResolvedValue({
        active: true,
        sub: "user-1"
      })
    };
    const middleware = createHydraAuthMiddleware({
      hydraHttpClient,
      isDevelopment: false
    });
    const request = {
      path: "/api/dip-studio/v1/sessions",
      headers: {
        authorization: "Bearer token-1"
      }
    } as unknown as Request;

    await middleware(request, {} as Response, next);

    expect(hydraHttpClient.introspectAccessToken).toHaveBeenCalledWith("token-1");
    expect(request.headers["x-user-id"]).toBe("user-1");
    expect(next).toHaveBeenCalledWith();
  });

  it("bypasses authentication when the request path is whitelisted", async () => {
    const next = vi.fn<NextFunction>();
    const hydraHttpClient = {
      introspectAccessToken: vi.fn()
    };
    const middleware = createHydraAuthMiddleware({
      hydraHttpClient,
      isDevelopment: false,
      whitelist: ["/health"]
    });
    const request = {
      path: "/health",
      headers: {}
    } as unknown as Request;

    await middleware(request, {} as Response, next);

    expect(hydraHttpClient.introspectAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards authentication failures to Express", async () => {
    const next = vi.fn<NextFunction>();
    const middleware = createHydraAuthMiddleware({
      hydraHttpClient: {
        introspectAccessToken: vi.fn()
      },
      isDevelopment: false
    });
    const request = {
      path: "/api/dip-studio/v1/sessions",
      headers: {}
    } as unknown as Request;

    await middleware(request, {} as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(vi.mocked(next).mock.calls[0]?.[0]).toBeInstanceOf(HttpError);
  });
});
