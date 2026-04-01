import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { createChatUploadRouter } from "./chat-upload";

/**
 * Creates a minimal json-capable response double.
 *
 * @returns Mocked response.
 */
function createJsonResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.json).mockReturnValue(response);

  return response;
}

describe("createChatUploadRouter", () => {
  it("uploads file and returns workspace temp path", async () => {
    const response = createJsonResponseDouble();
    const next = vi.fn<NextFunction>();
    const uploadTempFile = vi.fn().mockResolvedValue({
      path: "tmp/chat-1/a.txt"
    });
    const router = createChatUploadRouter({
      uploadTempFile
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/chat/upload"
    );
    const handler = layer?.route?.stack[1]?.handle;
    const request = {
      file: {
        fieldname: "file",
        originalname: "a.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        buffer: Buffer.from("hello"),
        size: 5,
        destination: "",
        filename: "",
        path: "",
        stream: null as never
      },
      body: {},
      headers: {
        "x-openclaw-session-key": "agent:agent-1:user:user-1:direct:chat-1"
      }
    } as unknown as Request;

    await handler?.(request, response, next);

    expect(uploadTempFile).toHaveBeenCalledWith({
      agentId: "agent-1",
      sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
      filename: "a.txt",
      body: expect.any(Buffer)
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      path: "tmp/chat-1/a.txt"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("fails when multipart file is missing", async () => {
    const response = createJsonResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChatUploadRouter({
      uploadTempFile: vi.fn()
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
      (entry) => entry.route?.path === "/api/dip-studio/v1/chat/upload"
    );
    const handler = layer?.route?.stack[1]?.handle;

    await handler?.(
      {
        file: undefined,
        body: {},
        headers: {
          "x-openclaw-session-key": "agent:agent-1:user:user-1:direct:chat-1"
        }
      } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Multipart field `file` is required"
      })
    );
  });
});
