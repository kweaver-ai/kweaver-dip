import { describe, expect, it, vi } from "vitest";

import {
  applyInsecureTlsSetting,
  buildBknUrl,
  createBknHeaders,
  DEFAULT_BKN_BUSINESS_DOMAIN,
  DefaultBknHttpClient,
  isHttpsUrlString,
  isSelfSignedCertificateError,
  normalizeBknError,
  resolveBknBusinessDomain
} from "./bkn-http-client";

describe("buildBknUrl", () => {
  it("joins the base URL, path and query string values", () => {
    expect(
      buildBknUrl("http://127.0.0.1:13014/base?x=1", "/api/bkn-backend/v1/knowledge-networks", {
        name_pattern: "risk",
        direction: "desc",
        limit: "10"
      })
    ).toBe(
      "http://127.0.0.1:13014/api/bkn-backend/v1/knowledge-networks?name_pattern=risk&direction=desc&limit=10"
    );
  });
});

describe("isHttpsUrlString", () => {
  it("detects https URLs", () => {
    expect(isHttpsUrlString("https://example.com/path")).toBe(true);
    expect(isHttpsUrlString("http://example.com/path")).toBe(false);
  });
});

describe("resolveBknBusinessDomain", () => {
  it("returns default when missing or blank", () => {
    expect(resolveBknBusinessDomain(undefined)).toBe(DEFAULT_BKN_BUSINESS_DOMAIN);
    expect(resolveBknBusinessDomain("")).toBe(DEFAULT_BKN_BUSINESS_DOMAIN);
    expect(resolveBknBusinessDomain("  ")).toBe(DEFAULT_BKN_BUSINESS_DOMAIN);
    expect(resolveBknBusinessDomain([])).toBe(DEFAULT_BKN_BUSINESS_DOMAIN);
  });

  it("returns the first trimmed value when present", () => {
    expect(resolveBknBusinessDomain("  bd_foo  ")).toBe("bd_foo");
    expect(resolveBknBusinessDomain(["  bd_bar  ", "ignored"])).toBe("bd_bar");
  });
});

describe("createBknHeaders", () => {
  it("sets accept, x-business-domain and optional authorization", () => {
    const headers = createBknHeaders("secret-token");

    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("x-business-domain")).toBe(DEFAULT_BKN_BUSINESS_DOMAIN);
    expect(headers.get("authorization")).toBe("Bearer secret-token");
    expect(headers.get("content-type")).toBeNull();
  });

  it("sets a custom x-business-domain when provided", () => {
    const headers = createBknHeaders(undefined, "bd_custom");

    expect(headers.get("x-business-domain")).toBe("bd_custom");
    expect(headers.get("authorization")).toBeNull();
  });
});

describe("normalizeBknError", () => {
  it("wraps transport errors as HttpError", async () => {
    const { HttpError } = await import("../errors/http-error.js");
    const httpError = new HttpError(502, "bad gateway");

    expect(normalizeBknError(httpError)).toBe(httpError);
    expect(normalizeBknError(new Error("offline"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with BKN backend: offline"
    });
  });

  it("returns a certificate guidance message for self-signed TLS failures", () => {
    const error = Object.assign(new Error("self-signed certificate"), {
      code: "DEPTH_ZERO_SELF_SIGNED_CERT"
    });

    expect(normalizeBknError(error)).toMatchObject({
      statusCode: 502,
      message:
        "Failed to communicate with BKN backend: self-signed certificate; if the root CA is installed locally, try running Node.js with --use-system-ca"
    });
  });
});

describe("isSelfSignedCertificateError", () => {
  it("detects known self-signed TLS error codes", () => {
    const error = Object.assign(new Error("certificate issue"), {
      code: "SELF_SIGNED_CERT_IN_CHAIN"
    });

    expect(isSelfSignedCertificateError(error)).toBe(true);
  });

  it("returns false for non-certificate transport errors", () => {
    expect(isSelfSignedCertificateError(new Error("ECONNREFUSED"))).toBe(false);
  });
});

describe("applyInsecureTlsSetting", () => {
  it("temporarily sets NODE_TLS_REJECT_UNAUTHORIZED to 0", () => {
    const previous = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

    const restore = applyInsecureTlsSetting();
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe("0");

    restore();
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe("1");

    if (previous === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      return;
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = previous;
  });
});

describe("DefaultBknHttpClient", () => {
  it("forwards GET requests with query params and authorization header", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const client = new DefaultBknHttpClient(
      {
        baseUrl: "http://127.0.0.1:13014",
        token: "secret",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(
      client.listKnowledgeNetworks({
        name_pattern: "incident",
        limit: "20"
      })
    ).resolves.toEqual({
      status: 200,
      headers: expect.any(Headers),
      body: JSON.stringify({ items: [] })
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:13014/api/bkn-backend/v1/knowledge-networks?name_pattern=incident&limit=20"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "GET"
    });

    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer secret");
    expect(headers.get("x-business-domain")).toBe(DEFAULT_BKN_BUSINESS_DOMAIN);
  });

  it("forwards detail GET requests", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "kn-1" }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const client = new DefaultBknHttpClient(
      {
        baseUrl: "http://127.0.0.1:13014",
        token: "secret",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await client.getKnowledgeNetwork("kn-1", { include_statistics: "true" }, "bd_other");

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:13014/api/bkn-backend/v1/knowledge-networks/kn-1?include_statistics=true"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "GET"
    });
    const detailHeaders = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
    expect(detailHeaders.get("x-business-domain")).toBe("bd_other");
  });

  it("temporarily relaxes TLS verification for https by default", async () => {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() => {
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe("0");
      return Promise.resolve(new Response("{}", { status: 200 }));
    });

    const client = new DefaultBknHttpClient(
      {
        baseUrl: "https://127.0.0.1:13014",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await client.listKnowledgeNetworks({});

    expect(fetchImpl).toHaveBeenCalled();
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
  });

  it("does not relax TLS verification for http", async () => {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() => {
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
      return Promise.resolve(new Response("{}", { status: 200 }));
    });

    const client = new DefaultBknHttpClient(
      {
        baseUrl: "http://127.0.0.1:13014",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await client.listKnowledgeNetworks({});
  });
});
