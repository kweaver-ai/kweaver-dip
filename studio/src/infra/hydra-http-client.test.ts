import { describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  DefaultHydraHttpClient,
  buildHydraIntrospectUrl,
  createHydraIntrospectHeaders,
  createHydraIntrospectRequestBody,
  createHydraStatusError,
  normalizeHydraHttpError
} from "./hydra-http-client";

describe("buildHydraIntrospectUrl", () => {
  it("derives the Hydra introspection endpoint from the admin base URL", () => {
    expect(buildHydraIntrospectUrl("http://127.0.0.1:4445/admin?x=1")).toBe(
      "http://127.0.0.1:4445/admin/oauth2/introspect"
    );
  });
});

describe("createHydraIntrospectHeaders", () => {
  it("creates form-encoded JSON-accepting headers", () => {
    const headers = createHydraIntrospectHeaders();

    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(headers.get("accept")).toBe("application/json");
  });
});

describe("createHydraIntrospectRequestBody", () => {
  it("encodes the token as x-www-form-urlencoded payload", () => {
    expect(
      createHydraIntrospectRequestBody({
        token: "token-1"
      }).toString()
    ).toBe("token=token-1");
  });
});

describe("createHydraStatusError", () => {
  it("includes the upstream status and response body", async () => {
    await expect(
      createHydraStatusError(
        new Response("denied", {
          status: 401
        })
      )
    ).resolves.toMatchObject({
      statusCode: 502,
      message: "Hydra /admin/oauth2/introspect returned HTTP 401: denied"
    });
  });
});

describe("normalizeHydraHttpError", () => {
  it("keeps HttpError instances and wraps unknown failures", () => {
    const httpError = new HttpError(504, "timeout");

    expect(normalizeHydraHttpError(httpError)).toBe(httpError);
    expect(normalizeHydraHttpError(new Error("offline"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with Hydra /admin/oauth2/introspect: offline"
    });
  });
});

describe("DefaultHydraHttpClient", () => {
  it("posts the token to Hydra introspection and returns the parsed response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        active: true,
        sub: "user-1"
      }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );
    const client = new DefaultHydraHttpClient(
      {
        adminUrl: "http://127.0.0.1:4445",
        timeoutMs: 1_000
      },
      fetchImpl
    );

    await expect(client.introspectAccessToken("token-1")).resolves.toEqual({
      active: true,
      sub: "user-1"
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:4445/admin/oauth2/introspect"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST"
    });
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).toBe("token=token-1");
  });

  it("normalizes unsuccessful HTTP responses", async () => {
    const client = new DefaultHydraHttpClient(
      {
        adminUrl: "http://127.0.0.1:4445",
        timeoutMs: 1_000
      },
      vi.fn().mockResolvedValue(
        new Response("denied", {
          status: 401
        })
      )
    );

    await expect(client.introspectAccessToken("token-1")).rejects.toMatchObject({
      statusCode: 502,
      message: "Hydra /admin/oauth2/introspect returned HTTP 401: denied"
    });
  });
});
