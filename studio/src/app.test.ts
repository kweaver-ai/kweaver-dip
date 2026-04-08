import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";

import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";

import { createApp, raiseDiagnosticError } from "./app";
import {
  asMessage,
  buildGatewayUrl,
  getEnv,
  loadEnvFile,
  readOptionalString,
  resolveGatewayHost,
  resolveGatewayHttpUrl,
  resolveGatewayPort,
  resolveGatewayProtocol,
  resolvePort,
  resolveTimeoutMs,
  resolveWorkspaceDir
} from "./utils/env";
import { HttpError } from "./errors/http-error";
import { errorHandler, resolveErrorCode } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { getHealth } from "./routes/health";
import {
  asError,
  asTransportError,
  createConnectRequest,
  createDeviceSignaturePayload,
  createDefaultWebSocket,
  createGatewayError,
  deriveDeviceIdFromPublicKey,
  extractRawEd25519PublicKey,
  isConnectChallenge,
  isGatewayResponse,
  loadDeviceIdentity,
  loadDeviceIdentityFromAssets,
  OpenClawEventFrame,
  OpenClawGatewayClient,
  OpenClawResponseFrame,
  OpenClawWebSocket,
  parseGatewayFrame,
  readChallengeNonce,
  signDeviceSignature,
  toBase64Url
} from "./infra/openclaw-gateway-client";
import {
  createAgentsListRequest
} from "./adapters/openclaw-agents-adapter";
import type {
  OpenClawAgentsListResult
} from "./types/openclaw";

/**
 * Creates a minimal mock response object for handler tests.
 *
 * @returns A response double with chainable status and json methods.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
}

/**
 * Creates a fake OpenClaw agents payload for tests.
 *
 * @returns A valid `AgentsListResult` fixture.
 */
function createAgentsFixture(): OpenClawAgentsListResult {
  return {
    defaultId: "main",
    mainKey: "sender",
    scope: "per-sender",
    agents: [
      {
        id: "main",
        name: "Main Agent",
        identity: {
          name: "Main Agent",
          emoji: "🦀",
          theme: "default"
        }
      }
    ]
  };
}

/**
 * Creates a deterministic OpenClaw device identity fixture.
 *
 * @returns The device identity loaded from project assets.
 */
function createDeviceIdentityFixture() {
  return loadDeviceIdentityFromAssets();
}

/**
 * Minimal fake WebSocket used for protocol tests.
 */
class FakeWebSocket extends EventEmitter implements OpenClawWebSocket {
  /**
   * Captures outbound messages for assertions.
   */
  public readonly sentMessages: string[] = [];

  /**
   * Indicates whether the socket has been closed.
   */
  public closed = false;

  /**
   * Counts heartbeat pings sent through the socket.
   */
  public pingCount = 0;

  /**
   * Sends a serialized frame.
   *
   * @param data The serialized payload.
   */
  public send(data: string): void {
    this.sentMessages.push(data);
  }

  /**
   * Closes the fake socket.
   */
  public close(): void {
    this.closed = true;
  }

  /**
   * Captures heartbeat pings.
   */
  public ping(): void {
    this.pingCount += 1;
  }
}

describe("createApp", () => {
  it("creates the app with the default OpenClaw client", () => {
    const app = createApp();

    expect(typeof app.get).toBe("function");
  });

  it("disables the x-powered-by header", () => {
    const app = createApp();

    expect(app.get("x-powered-by")).toBe(false);
  });

  it("creates the app when diagnostics are enabled", () => {
    expect(
      createApp({
        enableDiagnostics: true
      })
    ).toBeDefined();
  });
});

describe("getHealth", () => {
  it("writes the standard health payload", () => {
    const response = createResponseDouble();

    getHealth({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      status: "ok",
      service: "dip-studio-backend"
    });
  });
});

describe("notFoundHandler", () => {
  it("forwards a 404 error for unmatched routes", () => {
    const next = vi.fn<NextFunction>();

    notFoundHandler(
      { method: "GET", path: "/missing" } as Request,
      {} as Response,
      next
    );

    expect(next).toHaveBeenCalledOnce();

    const [error] = vi.mocked(next).mock.calls[0] ?? [];
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(404);
    expect((error as HttpError).message).toBe("Route not found: GET /missing");
  });
});

describe("errorHandler", () => {
  it("returns a typed application error payload", () => {
    const response = createResponseDouble();

    errorHandler(
      new HttpError(418, "Diagnostic failure"),
      {} as Request,
      response,
      vi.fn()
    );

    expect(response.status).toHaveBeenCalledWith(418);
    expect(response.json).toHaveBeenCalledWith({
      code: "HTTP_418",
      description: "Diagnostic failure"
    });
  });

  it("returns a generic 500 payload for unknown errors", () => {
    const response = createResponseDouble();

    errorHandler(new Error("boom"), {} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      description: "Internal Server Error"
    });
  });

  it("prefers custom business error codes when provided", () => {
    const response = createResponseDouble();

    errorHandler(
      new HttpError(500, "OpenClaw is not installed on this node", "OPENCLAW_CMD_NOT_FOUND"),
      {} as Request,
      response,
      vi.fn()
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      code: "OPENCLAW_CMD_NOT_FOUND",
      description: "OpenClaw is not installed on this node"
    });
  });

  it("delegates when headers have already been sent", () => {
    const response = {
      headersSent: true
    } as Response;
    const next = vi.fn<NextFunction>();
    const error = new Error("boom");

    errorHandler(error, {} as Request, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("resolveErrorCode", () => {
  it("maps common public error codes and falls back for unsupported status codes", () => {
    expect(resolveErrorCode(400)).toBe("INVALID_PARAMETER");
    expect(resolveErrorCode(401)).toBe("UNAUTHORIZED");
    expect(resolveErrorCode(403)).toBe("FORBIDDEN");
    expect(resolveErrorCode(404)).toBe("NOT_FOUND");
    expect(resolveErrorCode(409)).toBe("CONFLICT");
    expect(resolveErrorCode(500)).toBe("INTERNAL_SERVER_ERROR");
    expect(resolveErrorCode(418)).toBe("HTTP_418");
  });
});

describe("raiseDiagnosticError", () => {
  it("throws the expected diagnostic HttpError", () => {
    expect(() => {
      raiseDiagnosticError({} as Request, {} as Response);
    }).toThrowError(new HttpError(418, "Diagnostic failure"));
  });
});

describe("OpenClawGatewayClient", () => {
  it("performs the challenge, connect and agents.list exchange", async () => {
    const socket = new FakeWebSocket();
    const client = new OpenClawGatewayClient(
      {
        url: "ws://127.0.0.1:18789",
        token: "secret-token",
        timeoutMs: 1_000,
        heartbeatIntervalMs: 0,
        deviceIdentity: createDeviceIdentityFixture(),
        now: () => 1_737_264_000_000
      },
      () => socket
    );
    const pending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123",
        ts: 1
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {
        type: "hello-ok",
        protocol: 3
      }
    }));

    await vi.waitFor(() => {
      expect(socket.sentMessages).toHaveLength(2);
    });

    const agentsFrame = JSON.parse(socket.sentMessages[1] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: agentsFrame.id,
      ok: true,
      payload: createAgentsFixture()
    }));

    await expect(pending).resolves.toEqual(createAgentsFixture());
    expect(socket.closed).toBe(false);
    client.dispose();
  });

  it("converts gateway errors to HttpError", async () => {
    const socket = new FakeWebSocket();
    const client = new OpenClawGatewayClient(
      {
        url: "ws://127.0.0.1:18789",
        timeoutMs: 1_000,
        heartbeatIntervalMs: 0,
        deviceIdentity: createDeviceIdentityFixture()
      },
      () => socket
    );
    const pending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123",
        ts: 1
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: false,
      error: {
        code: "AUTH",
        message: "token mismatch"
      }
    }));

    await expect(pending).rejects.toMatchObject({
      statusCode: 502,
      message: "token mismatch"
    });
    client.dispose();
  });

  it("converts socket errors to HttpError", async () => {
    const socket = new FakeWebSocket();
    const client = new OpenClawGatewayClient(
      {
        url: "ws://127.0.0.1:18789",
        timeoutMs: 1_000,
        heartbeatIntervalMs: 0,
        deviceIdentity: createDeviceIdentityFixture()
      },
      () => socket
    );

    const pending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    socket.emit("error", new Error("offline"));

    await expect(pending).rejects.toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw gateway: offline"
    });
    client.dispose();
  });

  it("reports unexpected gateway closure", async () => {
    const socket = new FakeWebSocket();
    const client = new OpenClawGatewayClient(
      {
        url: "ws://127.0.0.1:18789",
        timeoutMs: 1_000,
        heartbeatIntervalMs: 0,
        deviceIdentity: createDeviceIdentityFixture()
      },
      () => socket
    );

    const pending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    socket.emit("close");

    await expect(pending).rejects.toMatchObject({
      statusCode: 502,
      message: "OpenClaw gateway closed the connection unexpectedly"
    });
    client.dispose();
  });

  it("reuses the same connection across multiple RPC calls", async () => {
    const socket = new FakeWebSocket();
    const client = new OpenClawGatewayClient(
      {
        url: "ws://127.0.0.1:18789",
        timeoutMs: 1_000,
        heartbeatIntervalMs: 0,
        deviceIdentity: createDeviceIdentityFixture()
      },
      () => socket
    );

    const firstPending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123"
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {}
    }));

    await vi.waitFor(() => {
      expect(socket.sentMessages).toHaveLength(2);
    });

    const firstAgentsFrame = JSON.parse(socket.sentMessages[1] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: firstAgentsFrame.id,
      ok: true,
      payload: createAgentsFixture()
    }));

    await expect(firstPending).resolves.toEqual(createAgentsFixture());

    const secondPending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    await vi.waitFor(() => {
      expect(socket.sentMessages).toHaveLength(3);
    });

    const secondAgentsFrame = JSON.parse(socket.sentMessages[2] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: secondAgentsFrame.id,
      ok: true,
      payload: createAgentsFixture()
    }));

    await expect(secondPending).resolves.toEqual(createAgentsFixture());
    expect(socket.sentMessages).toHaveLength(3);
    client.dispose();
  });

  it("sends heartbeat pings when the socket supports them", async () => {
    vi.useFakeTimers();

    const socket = new FakeWebSocket();
    const client = new OpenClawGatewayClient(
      {
        url: "ws://127.0.0.1:18789",
        timeoutMs: 1_000,
        heartbeatIntervalMs: 10,
        deviceIdentity: createDeviceIdentityFixture()
      },
      () => socket
    );

    const pending = client.invoke(
      createAgentsListRequest,
      (frame) => frame.payload as OpenClawAgentsListResult
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123"
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {}
    }));

    await vi.waitFor(() => {
      expect(socket.sentMessages).toHaveLength(2);
    });

    const agentsFrame = JSON.parse(socket.sentMessages[1] ?? "{}") as {
      id: string;
    };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: agentsFrame.id,
      ok: true,
      payload: createAgentsFixture()
    }));

    await expect(pending).resolves.toEqual(createAgentsFixture());

    await vi.advanceTimersByTimeAsync(25);

    expect(socket.pingCount).toBeGreaterThan(0);

    client.dispose();
    vi.useRealTimers();
  });
});

describe("gateway helpers", () => {
  it("wraps the global WebSocket implementation", () => {
    const listeners = new Map<string, (value?: unknown) => void>();
    const originalWebSocket = globalThis.WebSocket;

    class FakeGlobalWebSocket {
      /**
       * Captures the URL used by the wrapper.
       */
      public readonly url: string;

      /**
       * Captures outbound frames.
       */
      public readonly sent: string[] = [];

      /**
       * Indicates whether the socket was closed.
       */
      public closed = false;

      /**
       * Creates the fake global WebSocket.
       *
       * @param url The target WebSocket URL.
       */
      public constructor(url: string) {
        this.url = url;
      }

      /**
       * Registers a DOM-style event listener.
       *
       * @param eventName The event name.
       * @param listener The callback to invoke.
       */
      public addEventListener(
        eventName: string,
        listener: (value?: unknown) => void
      ): void {
        listeners.set(eventName, listener);
      }

      /**
       * Sends a string payload.
       *
       * @param data The payload to capture.
       */
      public send(data: string): void {
        this.sent.push(data);
      }

      /**
       * Closes the fake socket.
       */
      public close(): void {
        this.closed = true;
      }
    }

    globalThis.WebSocket =
      FakeGlobalWebSocket as unknown as typeof globalThis.WebSocket;

    try {
      const socket = createDefaultWebSocket("ws://localhost:18789");
      const messageListener = vi.fn();
      const errorListener = vi.fn();
      const closeListener = vi.fn();
      const openListener = vi.fn();

      socket.on("message", messageListener);
      socket.on("error", errorListener);
      socket.on("close", closeListener);
      socket.on("open", openListener);
      socket.send("hello");
      socket.close();

      listeners.get("message")?.({
        data: '{"type":"event","event":"tick"}'
      });
      listeners.get("error")?.(new Error("boom"));
      listeners.get("close")?.();
      listeners.get("open")?.();

      expect(messageListener).toHaveBeenCalledWith('{"type":"event","event":"tick"}');
      expect(errorListener).toHaveBeenCalled();
      expect(closeListener).toHaveBeenCalled();
      expect(openListener).toHaveBeenCalled();
    } finally {
      globalThis.WebSocket = originalWebSocket;
    }
  });

  it("fails when the runtime has no global WebSocket", () => {
    const originalWebSocket = globalThis.WebSocket;

    globalThis.WebSocket = undefined as unknown as typeof globalThis.WebSocket;

    try {
      expect(() => createDefaultWebSocket("ws://localhost:18789")).toThrow(
        "Global WebSocket client is not available in this Node.js runtime"
      );
    } finally {
      globalThis.WebSocket = originalWebSocket;
    }
  });

  it("parses string and buffer frames", () => {
    expect(parseGatewayFrame('{"type":"event","event":"tick"}')).toEqual({
      type: "event",
      event: "tick"
    });
    expect(
      parseGatewayFrame(Buffer.from('{"type":"res","id":"1","ok":true}'))
    ).toEqual({
      type: "res",
      id: "1",
      ok: true
    });
  });

  it("rejects unsupported raw frames", () => {
    expect(() => parseGatewayFrame(42)).toThrow(
      "Received an unsupported frame from OpenClaw gateway"
    );
  });

  it("creates the connect request with operator scope metadata", () => {
    const deviceIdentity = createDeviceIdentityFixture();
    const frame = createConnectRequest(
      "req-1",
      {
        type: "event",
        event: "connect.challenge",
        payload: {
          nonce: "nonce-1"
        }
      },
      "secret",
      deviceIdentity,
      () => 1_737_264_000_000
    );

    expect(frame.method).toBe("connect");
    expect(frame.params).toMatchObject({
      minProtocol: 3,
      maxProtocol: 3,
      role: "operator",
      caps: ["tool-events"],
      client: {
        id: "gateway-client",
        platform: "linux",
        mode: "backend"
      },
      auth: {
        token: "secret"
      },
      device: {
        id: deviceIdentity.id,
        publicKey: deviceIdentity.publicKey,
        signedAt: 1_737_264_000_000,
        nonce: "nonce-1"
      }
    });
    expect(frame.params.scopes).toContain("operator.read");
  });

  it("creates the agents.list request", () => {
    expect(createAgentsListRequest()).toEqual({
      type: "req",
      method: "agents.list",
      params: {}
    });
  });

  it("recognizes challenge and response frames", () => {
    const eventFrame: OpenClawEventFrame = {
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "nonce-1"
      }
    };
    const responseFrame: OpenClawResponseFrame = {
      type: "res",
      id: "req-1",
      ok: true
    };

    expect(isConnectChallenge(eventFrame)).toBe(true);
    expect(isGatewayResponse(responseFrame, "req-1")).toBe(true);
  });

  it("reads the challenge nonce and validates failures", () => {
    expect(
      readChallengeNonce({
        type: "event",
        event: "connect.challenge",
        payload: {
          nonce: "nonce-1"
        }
      })
    ).toBe("nonce-1");

    expect(() =>
      readChallengeNonce({
        type: "event",
        event: "connect.challenge",
        payload: {}
      })
    ).toThrow("OpenClaw connect.challenge payload is missing nonce");

    expect(() =>
      readChallengeNonce({
        type: "event",
        event: "connect.challenge"
      })
    ).toThrow("OpenClaw connect.challenge payload is missing nonce");
  });

  it("creates gateway errors and normalizes thrown values", () => {
    expect(
      createGatewayError(
        {
          type: "res",
          id: "req-1",
          ok: false,
          error: {
            code: "AUTH",
            message: "denied"
          }
        },
        "fallback"
      )
    ).toMatchObject({
      statusCode: 502,
      message: "denied"
    });

    expect(asError("boom").message).toBe("boom");
    expect(
      asTransportError(new HttpError(503, "offline"))
    ).toMatchObject({
      statusCode: 503,
      message: "offline"
    });
  });

  it("loads device identity from assets and derives a stable device id", () => {
    const deviceIdentity = loadDeviceIdentity({
      publicKeyPath: "assets/public.pem",
      privateKeyPath: "assets/private.pem"
    });
    const publicKeyPem = readFileSync("assets/public.pem", "utf8");
    const rawPublicKey = extractRawEd25519PublicKey(publicKeyPem);

    expect(deviceIdentity).toMatchObject({
      id: deriveDeviceIdFromPublicKey(rawPublicKey),
      publicKey: toBase64Url(rawPublicKey)
    });
  });

  it("builds and signs the device payload", () => {
    const deviceIdentity = createDeviceIdentityFixture();
    const payload = createDeviceSignaturePayload({
      deviceId: deviceIdentity.id,
      clientId: "gateway-client",
      clientMode: "backend",
      role: "operator",
      scopes: ["operator.read"],
      signedAtMs: 1_737_264_000_000,
      token: "secret",
      nonce: "nonce-1",
      platform: "linux",
      deviceFamily: ""
    });

    expect(payload).toBe(
      [
        "v3",
        deviceIdentity.id,
        "gateway-client",
        "backend",
        "operator",
        "operator.read",
        "1737264000000",
        "secret",
        "nonce-1",
        "linux",
        ""
      ].join("|")
    );
    expect(signDeviceSignature(payload, deviceIdentity.privateKeyPem)).toMatch(
      /^[A-Za-z0-9_-]+$/u
    );
  });
});

describe("resolvePort", () => {
  it("uses the default port when the value is missing", () => {
    expect(resolvePort(undefined)).toBe(3000);
    expect(resolvePort("")).toBe(3000);
  });

  it("parses a valid integer port", () => {
    expect(resolvePort("8080")).toBe(8080);
  });

  it("throws for invalid values", () => {
    expect(() => resolvePort("0")).toThrow("Invalid PORT value: 0");
    expect(() => resolvePort("abc")).toThrow("Invalid PORT value: abc");
  });
});

describe("gateway env helpers", () => {
  it("normalizes gateway protocol, host and port", () => {
    expect(resolveGatewayProtocol(undefined)).toBe("ws");
    expect(resolveGatewayProtocol("wss")).toBe("wss");
    expect(resolveGatewayHost(undefined)).toBe("127.0.0.1");
    expect(resolveGatewayHost("gateway.internal")).toBe("gateway.internal");
    expect(resolveGatewayPort(undefined)).toBe(19001);
    expect(resolveGatewayPort("20000")).toBe(20000);
    expect(buildGatewayUrl("ws", "localhost", 19001)).toBe(
      "ws://localhost:19001/"
    );
  });

  it("parses timeout and optional strings", () => {
    expect(resolveTimeoutMs(undefined)).toBe(5000);
    expect(resolveTimeoutMs("7000")).toBe(7000);
    expect(readOptionalString(" token ")).toBe("token");
    expect(readOptionalString("   ")).toBeUndefined();
  });

  it("extracts error messages and validates bad inputs", () => {
    expect(asMessage(new Error("boom"))).toBe("boom");
    expect(resolveGatewayHost("   ")).toBe("127.0.0.1");
    expect(resolveGatewayHttpUrl("ws://localhost:19001/")).toBe(
      "http://localhost:19001/"
    );
    expect(resolveGatewayHttpUrl("https://gateway.example.com")).toBe(
      "https://gateway.example.com/"
    );
    expect(() => resolveGatewayProtocol("ftp")).toThrow(
      "Invalid OPENCLAW_GATEWAY_PROTOCOL value: ftp"
    );
    expect(() => resolveGatewayPort("0")).toThrow(
      "Invalid OPENCLAW_GATEWAY_PORT value: 0"
    );
    expect(() => resolveTimeoutMs("0")).toThrow(
      "Invalid OPENCLAW_GATEWAY_TIMEOUT_MS value: 0"
    );
    expect(resolveWorkspaceDir(undefined)).toBe("workspace");
    expect(resolveWorkspaceDir("./custom-workspace")).toBe("./custom-workspace");
  });
});

describe("getEnv", () => {
  it("reads HTTP and OpenClaw environment variables", () => {
    delete process.env.OPENCLAW_GATEWAY_URL;
    delete process.env.KWEAVER_BASE_URL;
    delete process.env.KWEAVER_TOKEN;
    delete process.env.KWEAVER_HYDRA_ADMIN_URL;
    delete process.env.NODE_ENV;
    delete process.env.OAUTH_MOCK_USER_ID;
    loadEnvFile({
      path: ".env.test",
      override: true,
      forceReload: true
    });

    expect(getEnv()).toEqual({
      port: 4321,
      bknBackendUrl: "http://127.0.0.1:13014/",
      appUserToken: undefined,
      hydraAdminUrl: "http://127.0.0.1:4445/",
      isDevelopment: false,
      oauthMockUserId: undefined,
      openClawGatewayUrl: "ws://127.0.0.1:19001/",
      openClawGatewayHttpUrl: "http://127.0.0.1:19001/",
      openClawGatewayToken: undefined,
      openClawGatewayTimeoutMs: 6000,
      openClawWorkspaceDir: resolveWorkspaceDir(process.env.OPENCLAW_WORKSPACE_DIR)
    });
  });

  it("prefers OPENCLAW_GATEWAY_URL when explicitly provided", () => {
    loadEnvFile({
      path: ".env.test",
      override: true,
      forceReload: true
    });
    process.env.OPENCLAW_GATEWAY_URL = "wss://gateway.example.com/ws";
    process.env.OPENCLAW_WORKSPACE_DIR = "./openclaw-workspace";
    process.env.KWEAVER_BASE_URL = "https://core.example.com";
    process.env.KWEAVER_TOKEN = "token-1";
    process.env.KWEAVER_HYDRA_ADMIN_URL = "https://hydra.example.com/admin";
    process.env.NODE_ENV = "development";
    process.env.OAUTH_MOCK_USER_ID = "user-dev";

    expect(getEnv()).toMatchObject({
      bknBackendUrl: "https://core.example.com/",
      appUserToken: "token-1",
      hydraAdminUrl: "https://hydra.example.com/",
      isDevelopment: true,
      oauthMockUserId: "user-dev",
      openClawGatewayUrl: "wss://gateway.example.com/ws",
      openClawGatewayHttpUrl: "https://gateway.example.com/ws",
      openClawWorkspaceDir: "./openclaw-workspace"
    });
  });
});

describe("HttpError", () => {
  it("captures the status code and name", () => {
    const error = new HttpError(400, "Bad Request");

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad Request");
    expect(error.name).toBe("HttpError");
    expect(error.code).toBeUndefined();
  });

  it("stores an optional business code", () => {
    const error = new HttpError(500, "Missing command", "OPENCLAW_CMD_NOT_FOUND");

    expect(error.code).toBe("OPENCLAW_CMD_NOT_FOUND");
  });
});
