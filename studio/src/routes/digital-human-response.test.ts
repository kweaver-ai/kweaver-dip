import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  attachDownstreamAbortHandlers,
  createDigitalHumanResponseRouter,
  pipeEventStream,
  readDigitalHumanResponseRequestBody,
  writeEventStreamHeaders
} from "./digital-human-response";

/**
 * Creates a minimal response double with chainable methods and writable stream hooks.
 *
 * @returns The mocked response object.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    setHeader: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    flushHeaders: vi.fn(),
    destroyed: false,
    headersSent: false,
    writableEnded: false
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.flushHeaders).mockImplementation(() => {
    (response as Response & { headersSent: boolean }).headersSent = true;
  });
  vi.mocked(response.end).mockImplementation(() => {
    (response as Response & { writableEnded: boolean }).writableEnded = true;
  });

  return response;
}

describe("readDigitalHumanResponseRequestBody", () => {
  it("accepts JSON objects and rejects other body shapes", () => {
    expect(
      readDigitalHumanResponseRequestBody({
        input: "hello"
      })
    ).toEqual({
      input: "hello"
    });

    expect(() => readDigitalHumanResponseRequestBody(undefined)).toThrow(
      "Digital human response request body must be a JSON object"
    );
    expect(() => readDigitalHumanResponseRequestBody([])).toThrow(
      "Digital human response request body must be a JSON object"
    );
  });
});

describe("writeEventStreamHeaders", () => {
  it("writes the SSE response headers", () => {
    const response = createResponseDouble();

    writeEventStreamHeaders(
      response,
      200,
      new Headers({
        "content-type": "text/event-stream",
        "cache-control": "no-cache"
      })
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.setHeader).toHaveBeenCalledWith(
      "content-type",
      "text/event-stream"
    );
    expect(response.setHeader).toHaveBeenCalledWith("cache-control", "no-cache");
    expect(response.setHeader).toHaveBeenCalledWith("connection", "keep-alive");
    expect(response.setHeader).toHaveBeenCalledWith("x-accel-buffering", "no");
    expect(response.flushHeaders).toHaveBeenCalledOnce();
  });

  it("falls back to the default SSE headers when upstream headers are missing", () => {
    const response = createResponseDouble();

    writeEventStreamHeaders(response, 200, new Headers());

    expect(response.setHeader).toHaveBeenCalledWith(
      "content-type",
      "text/event-stream; charset=utf-8"
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "cache-control",
      "no-cache, no-transform"
    );
    expect(response.setHeader).toHaveBeenCalledWith("connection", "keep-alive");
  });
});

describe("attachDownstreamAbortHandlers", () => {
  it("does not abort when the request closes normally after the body is read", () => {
    const abortController = new AbortController();
    const request = {
      on: vi.fn()
    } as unknown as Request;
    const response = {
      on: vi.fn(),
      writableEnded: true
    } as unknown as Response;

    attachDownstreamAbortHandlers(request, response, abortController);

    const responseCloseHandler = vi.mocked(response.on).mock.calls.find(
      ([eventName]) => eventName === "close"
    )?.[1] as (() => void) | undefined;

    responseCloseHandler?.();

    expect(abortController.signal.aborted).toBe(false);
  });

  it("aborts when the client aborts the request", () => {
    const abortController = new AbortController();
    const request = {
      on: vi.fn()
    } as unknown as Request;
    const response = {
      on: vi.fn(),
      writableEnded: false
    } as unknown as Response;

    attachDownstreamAbortHandlers(request, response, abortController);

    const requestAbortedHandler = vi.mocked(request.on).mock.calls.find(
      ([eventName]) => eventName === "aborted"
    )?.[1] as (() => void) | undefined;

    requestAbortedHandler?.();

    expect(abortController.signal.aborted).toBe(true);
  });
});

describe("pipeEventStream", () => {
  it("writes each chunk and ends the response", async () => {
    const response = createResponseDouble();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: first\n\n"));
        controller.enqueue(new TextEncoder().encode("data: second\n\n"));
        controller.close();
      }
    });

    await pipeEventStream(stream, response);

    expect(response.write).toHaveBeenCalledTimes(2);
    expect(response.end).toHaveBeenCalledOnce();
  });

  it("ends the response even when the stream closes without emitting chunks", async () => {
    const response = createResponseDouble();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      }
    });

    await pipeEventStream(stream, response);

    expect(response.write).not.toHaveBeenCalled();
    expect(response.end).toHaveBeenCalledOnce();
  });
});

describe("createDigitalHumanResponseRouter", () => {
  it("proxies the upstream event stream to the client", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const createResponseStream = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({
        "content-type": "text/event-stream"
      }),
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: hello\n\n"));
          controller.close();
        }
      })
    });
    const router = createDigitalHumanResponseRouter({
      createResponseStream
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/chat/responses"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const request = {
      params: {
        id: "agent-1"
      },
      body: {
        input: "hello"
      },
      on: vi.fn()
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(createResponseStream).toHaveBeenCalledOnce();
    expect(createResponseStream).toHaveBeenCalledWith(
      "agent-1",
      {
        input: "hello"
      },
      expect.any(AbortSignal)
    );
    expect(response.write).toHaveBeenCalledOnce();
    expect(response.end).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards validation errors to middleware", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createDigitalHumanResponseRouter({
      createResponseStream: vi.fn()
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/chat/responses"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const request = {
      params: {
        id: "agent-1"
      },
      body: [],
      on: vi.fn()
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(vi.mocked(next).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 400,
      message: "Digital human response request body must be a JSON object"
    });
  });

  it("forwards upstream HttpError instances to middleware", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const upstreamError = new HttpError(502, "upstream failed");
    const router = createDigitalHumanResponseRouter({
      createResponseStream: vi.fn().mockRejectedValue(upstreamError)
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/chat/responses"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const request = {
      params: {
        id: "agent-1"
      },
      body: {
        input: "hello"
      },
      on: vi.fn()
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(next).toHaveBeenCalledWith(upstreamError);
  });

  it("does not forward errors to middleware after the SSE headers have been sent", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const createResponseStream = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({
        "content-type": "text/event-stream"
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode("data: hello\n\n")
            })
            .mockRejectedValueOnce(new Error("tool call failed")),
          releaseLock: vi.fn()
        })
      } as unknown as ReadableStream<Uint8Array>
    });
    const router = createDigitalHumanResponseRouter({
      createResponseStream
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/chat/responses"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const request = {
      params: {
        id: "agent-1"
      },
      body: {
        input: "hello"
      },
      on: vi.fn()
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(response.flushHeaders).toHaveBeenCalledOnce();
    expect(response.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("stops quietly when the downstream request has already been aborted", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createDigitalHumanResponseRouter({
      createResponseStream: vi.fn().mockRejectedValue(new Error("socket closed"))
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/chat/responses"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const request = {
      params: {
        id: "agent-1"
      },
      body: {
        input: "hello"
      },
      on: vi.fn((eventName: string, listener: () => void) => {
        if (eventName === "aborted") {
          listener();
        }
      })
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.end).not.toHaveBeenCalled();
  });

  it("ends the response when an error happens after headers were already marked as sent", async () => {
    const response = createResponseDouble();
    (response as Response & { headersSent: boolean }).headersSent = true;
    const next = vi.fn<NextFunction>();
    const router = createDigitalHumanResponseRouter({
      createResponseStream: vi.fn().mockRejectedValue(new Error("boom"))
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human/:id/chat/responses"
    );
    const handler = layer?.route?.stack[0]?.handle;
    const request = {
      params: {
        id: "agent-1"
      },
      body: {
        input: "hello"
      },
      on: vi.fn()
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(response.end).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});
