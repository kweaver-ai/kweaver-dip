import { describe, expect, it, vi } from "vitest";

import {
  DefaultOpenClawArchivesHttpClient,
  buildOpenClawSessionArchiveSubpathUrl,
  buildOpenClawSessionArchivesUrl,
  createOpenClawArchivesHeaders,
  createOpenClawArchivesStatusError,
  encodePathSegment,
  encodePathSubpath,
  normalizeOpenClawArchivesError
} from "./openclaw-archives-http-client";

describe("buildOpenClawSessionArchivesUrl", () => {
  it("converts ws/wss to http/https and appends query", () => {
    expect(
      buildOpenClawSessionArchivesUrl(
        "ws://127.0.0.1:19001/ws?x=1",
        "de_finance",
        "session-1"
      )
    ).toBe("http://127.0.0.1:19001/v1/archives?agent=de_finance&session=session-1");

    expect(
      buildOpenClawSessionArchivesUrl(
        "wss://gateway.example.com/socket",
        "agent-2",
        "abc"
      )
    ).toBe("https://gateway.example.com/v1/archives?agent=agent-2&session=abc");
  });
});

describe("buildOpenClawSessionArchiveSubpathUrl", () => {
  it("builds file/subdirectory URL with encoded segments", () => {
    expect(
      buildOpenClawSessionArchiveSubpathUrl(
        "ws://127.0.0.1:19001/ws?x=1",
        "de_finance",
        "session-1",
        "reports/他的财务报表.md"
      )
    ).toBe(
      "http://127.0.0.1:19001/v1/archives/session-1/reports/%E4%BB%96%E7%9A%84%E8%B4%A2%E5%8A%A1%E6%8A%A5%E8%A1%A8.md?agent=de_finance"
    );
  });

  it("does not double-prefix when subpath is already session-scoped", () => {
    expect(
      buildOpenClawSessionArchiveSubpathUrl(
        "ws://127.0.0.1:19001/ws?x=1",
        "de_finance",
        "5346e9bf-a493-4722-a1fc-93d857e96d94",
        "5346e9bf-a493-4722-a1fc-93d857e96d94_2026-03-21-14-27-30"
      )
    ).toBe(
      "http://127.0.0.1:19001/v1/archives/5346e9bf-a493-4722-a1fc-93d857e96d94_2026-03-21-14-27-30?agent=de_finance"
    );
  });
});

describe("path encoding helpers", () => {
  it("encodes one segment and slash-delimited subpath", () => {
    expect(encodePathSegment("中文 空格.md")).toBe(
      "%E4%B8%AD%E6%96%87%20%E7%A9%BA%E6%A0%BC.md"
    );
    expect(encodePathSubpath("a b/中文.md")).toBe(
      "a%20b/%E4%B8%AD%E6%96%87.md"
    );
  });
});

describe("createOpenClawArchivesHeaders", () => {
  it("creates headers with optional authorization", () => {
    const headers = createOpenClawArchivesHeaders("secret-token");

    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer secret-token");

    const withoutToken = createOpenClawArchivesHeaders();
    expect(withoutToken.get("authorization")).toBeNull();
  });
});

describe("createOpenClawArchivesStatusError", () => {
  it("returns a 502 error with upstream details", async () => {
    const response = new Response("denied", {
      status: 403
    });

    await expect(createOpenClawArchivesStatusError(response)).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/archives returned HTTP 403: denied"
    });
  });
});

describe("normalizeOpenClawArchivesError", () => {
  it("keeps HttpError instances and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const httpError = new HttpError(502, "bad gateway");

    expect(normalizeOpenClawArchivesError(httpError)).toBe(httpError);
    expect(normalizeOpenClawArchivesError(new Error("offline"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/archives: offline"
    });
  });
});

describe("DefaultOpenClawArchivesHttpClient", () => {
  it("calls upstream and returns parsed json", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          path: "/",
          contents: [{ name: "a", type: "directory" }]
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    );

    const client = new DefaultOpenClawArchivesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        token: "secret",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(
      client.listSessionArchives("de_finance", "session-1")
    ).resolves.toEqual({
      path: "/",
      contents: [{ name: "a", type: "directory" }]
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/archives?agent=de_finance&session=session-1"
    );
  });

  it("throws normalized errors when upstream request fails", async () => {
    const client = new DefaultOpenClawArchivesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001",
        timeoutMs: 5000
      },
      vi.fn<typeof fetch>().mockRejectedValue(new Error("network down"))
    );

    await expect(
      client.listSessionArchives("de_finance", "session-1")
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/archives: network down"
    });
  });

  it("reads archive subpath and returns raw response", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("hello world", {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8"
        }
      })
    );

    const client = new DefaultOpenClawArchivesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        token: "secret",
        timeoutMs: 5000
      },
      fetchImpl
    );

    const result = await client.getSessionArchiveSubpath(
      "de_finance",
      "session-1",
      "notes/today.txt"
    );
    expect(result.status).toBe(200);
    expect(new TextDecoder().decode(result.body)).toBe("hello world");
    expect(result.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/archives/session-1/notes/today.txt?agent=de_finance"
    );
  });
});
