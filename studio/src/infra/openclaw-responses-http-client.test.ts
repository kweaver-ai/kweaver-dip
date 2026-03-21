import { describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  DefaultOpenClawResponsesHttpClient,
  buildOpenClawResponsesUrl,
  createOpenClawResponsesHeaders,
  createOpenClawResponsesRequestBody,
  createOpenClawResponsesStatusError,
  mergeAbortSignals,
  normalizeOpenClawResponsesError
} from "./openclaw-responses-http-client";

describe("buildOpenClawResponsesUrl", () => {
  it("derives the HTTP responses endpoint from a WebSocket gateway URL", () => {
    expect(buildOpenClawResponsesUrl("ws://127.0.0.1:19001/ws?x=1")).toBe(
      "http://127.0.0.1:19001/v1/responses"
    );
    expect(buildOpenClawResponsesUrl("wss://gateway.example.com/socket")).toBe(
      "https://gateway.example.com/v1/responses"
    );
  });
});

describe("createOpenClawResponsesHeaders", () => {
  it("creates JSON and SSE headers, adds bearer auth, and merges extra headers", () => {
    const headers = createOpenClawResponsesHeaders("secret-token", {
      "x-openclaw-session-key": "agent:demo:session-1"
    });

    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("accept")).toBe("text/event-stream");
    expect(headers.get("authorization")).toBe("Bearer secret-token");
    expect(headers.get("x-openclaw-session-key")).toBe("agent:demo:session-1");
  });

  it("keeps the default headers when token and extra headers are omitted", () => {
    const headers = createOpenClawResponsesHeaders();

    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("accept")).toBe("text/event-stream");
    expect(headers.get("authorization")).toBeNull();
  });
});

describe("createOpenClawResponsesRequestBody", () => {
  it("forces stream mode and the path digital human id", () => {
    expect(
      createOpenClawResponsesRequestBody("digital-human-1", {
        input: "hello",
        stream: false,
        model: "ignored"
      })
    ).toEqual({
      input: "hello",
      stream: true,
      model: "agent:digital-human-1"
    });
  });
});

describe("mergeAbortSignals", () => {
  it("returns the downstream abort signal unchanged", () => {
    const abortController = new AbortController();
    const signal = mergeAbortSignals(abortController.signal);

    expect(signal).toBe(abortController.signal);
    expect(mergeAbortSignals()).toBeUndefined();
  });
});

describe("createOpenClawResponsesStatusError", () => {
  it("includes the upstream status and response body", async () => {
    await expect(
      createOpenClawResponsesStatusError(
        new Response("upstream failed", {
          status: 503
        })
      )
    ).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/responses returned HTTP 503: upstream failed"
    });
  });

  it("omits the response suffix when the upstream body is empty", async () => {
    await expect(
      createOpenClawResponsesStatusError(
        new Response("   ", {
          status: 504
        })
      )
    ).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/responses returned HTTP 504"
    });
  });
});

describe("normalizeOpenClawResponsesError", () => {
  it("keeps HttpError instances and wraps unknown failures", () => {
    const httpError = new HttpError(504, "timeout");

    expect(normalizeOpenClawResponsesError(httpError)).toBe(httpError);
    expect(normalizeOpenClawResponsesError(new Error("offline"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/responses: offline"
    });
    expect(normalizeOpenClawResponsesError("offline")).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/responses: offline"
    });
  });
});

describe("DefaultOpenClawResponsesHttpClient", () => {
  it("posts the normalized request body and returns the event stream", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: hello\n\n"));
        controller.close();
      }
    });
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: {
          "content-type": "text/event-stream"
        }
      })
    );
    const client = new DefaultOpenClawResponsesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        token: "secret-token",
        timeoutMs: 1_000
      },
      fetchImpl
    );
    const abortController = new AbortController();

    const response = await client.createResponseStream(
      "agent-1",
      {
        input: "hello"
      },
      abortController.signal,
      {
        "x-openclaw-session-key": "agent:agent-1:session-1"
      }
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("http://127.0.0.1:19001/v1/responses");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST"
    });
    expect(fetchImpl.mock.calls[0]?.[1]?.signal).toBe(abortController.signal);
    expect(
      new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).get("x-openclaw-session-key")
    ).toBe("agent:agent-1:session-1");
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      input: "hello",
      model: "agent:agent-1",
      stream: true
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.body).not.toBeNull();
  });

  it("throws when the upstream HTTP response is unsuccessful", async () => {
    const client = new DefaultOpenClawResponsesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        timeoutMs: 1_000
      },
      vi.fn().mockResolvedValue(
        new Response("denied", {
          status: 403
        })
      )
    );

    await expect(
      client.createResponseStream("agent-1", {
        input: "hello"
      })
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/responses returned HTTP 403: denied"
    });
  });

  it("throws when the upstream response stream is empty", async () => {
    const client = new DefaultOpenClawResponsesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        timeoutMs: 1_000
      },
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200
        })
      )
    );

    await expect(
      client.createResponseStream("agent-1", {
        input: "hello"
      })
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/responses returned an empty stream"
    });
  });

  it("normalizes transport failures thrown by fetch", async () => {
    const client = new DefaultOpenClawResponsesHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        timeoutMs: 1_000
      },
      vi.fn().mockRejectedValue(new Error("socket closed"))
    );

    await expect(
      client.createResponseStream("agent-1", {
        input: "hello"
      })
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/responses: socket closed"
    });
  });
});
