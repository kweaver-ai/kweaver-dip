import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomUUID,
  sign
} from "node:crypto";

import { HttpError } from "../errors/http-error";
import type {
  OpenClawGatewayPort,
  OpenClawRequestFrame,
} from "../types/openclaw";

const OPENCLAW_PROTOCOL_VERSION = 3;
const DEFAULT_DEVICE_PUBLIC_KEY_PATH = "assets/public.pem";
const DEFAULT_DEVICE_PRIVATE_KEY_PATH = "assets/private.pem";
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const OPENCLAW_CLIENT_ID = "gateway-client";
const OPENCLAW_CLIENT_MODE = "backend";
const OPENCLAW_ROLE = "operator";
const OPENCLAW_SCOPES = ["operator.read", "operator.write", "operator.admin"];
const OPENCLAW_CAPS = ["tool-events"];
const OPENCLAW_PLATFORM = "linux";
const OPENCLAW_DEVICE_FAMILY = "";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000;
const DEFAULT_RECONNECT_DELAY_MS = 1_000;

/**
 * Minimal WebSocket shape used by the OpenClaw gateway client.
 */
export interface OpenClawWebSocket {
  /**
   * Registers an event listener.
   *
   * @param eventName The WebSocket event name.
   * @param listener The callback invoked for each event.
   * @returns The WebSocket instance for chaining.
   */
  on(eventName: string, listener: (...args: unknown[]) => void): this;

  /**
   * Sends a UTF-8 message through the socket.
   *
   * @param data The serialized payload.
   */
  send(data: string): void;

  /**
   * Sends an implementation-specific heartbeat ping when available.
   */
  ping?(): void;

  /**
   * Closes the socket.
   */
  close(): void;
}

/**
 * Creates a WebSocket connection for the OpenClaw gateway client.
 */
export type OpenClawWebSocketFactory = (url: string) => OpenClawWebSocket;

/**
 * Represents a response frame received from the OpenClaw gateway.
 */
export interface OpenClawResponseFrame {
  /**
   * Frame type discriminator.
   */
  type: "res";

  /**
   * Correlation identifier.
   */
  id: string;

  /**
   * Indicates whether the request succeeded.
   */
  ok: boolean;

  /**
   * Successful payload.
   */
  payload?: unknown;

  /**
   * Error payload.
   */
  error?: {
    /**
     * Stable gateway error code.
     */
    code: string;

    /**
     * Human-readable message.
     */
    message: string;
  };
}

/**
 * Represents an event frame received from the OpenClaw gateway.
 */
export interface OpenClawEventFrame {
  /**
   * Frame type discriminator.
   */
  type: "event";

  /**
   * Event name.
   */
  event: string;

  /**
   * Event payload.
   */
  payload?: unknown;
}

/**
 * Union of supported OpenClaw gateway frames.
 */
export type OpenClawGatewayFrame =
  | OpenClawRequestFrame
  | OpenClawResponseFrame
  | OpenClawEventFrame;

/**
 * Describes the OpenClaw device identity used during gateway connect.
 */
export interface OpenClawDeviceIdentity {
  /**
   * Stable device identifier derived from the public key.
   */
  id: string;

  /**
   * Base64url-encoded raw Ed25519 public key.
   */
  publicKey: string;

  /**
   * PEM-encoded Ed25519 private key.
   */
  privateKeyPem: string;
}

/**
 * Describes the file paths used to load the OpenClaw device keys.
 */
export interface OpenClawDeviceKeyPaths {
  /**
   * Path to the PEM-encoded Ed25519 public key.
   */
  publicKeyPath: string;

  /**
   * Path to the PEM-encoded Ed25519 private key.
   */
  privateKeyPath: string;
}

/**
 * Defines the runtime configuration needed to reach the OpenClaw gateway.
 */
export interface OpenClawGatewayClientOptions {
  /**
   * WebSocket endpoint of the OpenClaw gateway.
   */
  url: string;

  /**
   * Optional gateway bearer token.
   */
  token?: string;

  /**
   * Timeout for the connect handshake and each RPC call in milliseconds.
   */
  timeoutMs?: number;

  /**
   * Interval between heartbeat pings in milliseconds.
   */
  heartbeatIntervalMs?: number;

  /**
   * Delay before trying to reconnect after disconnect in milliseconds.
   */
  reconnectDelayMs?: number;

  /**
   * Preloaded device identity used during connect.
   */
  deviceIdentity?: OpenClawDeviceIdentity;

  /**
   * Supplies the current time in milliseconds.
   */
  now?: () => number;
}

/**
 * Internal state used to coordinate a pending RPC call.
 */
interface OpenClawPendingRequest<T> {
  /**
   * Resolves the request with the mapped result.
   *
   * @param value The mapped RPC payload.
   */
  resolve(value: T): void;

  /**
   * Rejects the request with the normalized failure.
   *
   * @param error The terminal request failure.
   */
  reject(error: Error): void;

  /**
   * Timer used to fail the request when the gateway becomes unresponsive.
   */
  timeout: NodeJS.Timeout;
}

/**
 * Queries OpenClaw over a shared gateway WebSocket connection.
 */
export class OpenClawGatewayClient implements OpenClawGatewayPort {
  private static singleton?: OpenClawGatewayClient;

  private readonly timeoutMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly reconnectDelayMs: number;
  private readonly deviceIdentity: OpenClawDeviceIdentity;
  private readonly now: () => number;
  private readonly pendingRequests = new Map<string, OpenClawPendingRequest<unknown>>();

  private socket?: OpenClawWebSocket;
  private connectPromise?: Promise<void>;
  private resolveConnect?: () => void;
  private rejectConnect?: (error: Error) => void;
  private connectTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private activeConnectRequestId?: string;
  private shouldReconnect = true;
  private isConnected = false;

  /**
   * Creates or returns the shared OpenClaw gateway client singleton.
   *
   * @param options Static connection options.
   * @param createWebSocket Optional factory for dependency injection in tests.
   * @returns The process-wide OpenClaw gateway client.
   */
  public static getInstance(
    options: OpenClawGatewayClientOptions,
    createWebSocket: OpenClawWebSocketFactory = createDefaultWebSocket
  ): OpenClawGatewayClient {
    if (OpenClawGatewayClient.singleton === undefined) {
      OpenClawGatewayClient.singleton = new OpenClawGatewayClient(
        options,
        createWebSocket
      );
    }

    return OpenClawGatewayClient.singleton;
  }

  /**
   * Disposes the shared singleton. This is intended for tests only.
   */
  public static resetInstanceForTests(): void {
    OpenClawGatewayClient.singleton?.dispose();
    OpenClawGatewayClient.singleton = undefined;
  }

  /**
   * Creates the gateway client.
   *
   * @param options Static connection options.
   * @param createWebSocket Optional factory for dependency injection in tests.
   */
  public constructor(
    private readonly options: OpenClawGatewayClientOptions,
    private readonly createWebSocket: OpenClawWebSocketFactory = createDefaultWebSocket
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.heartbeatIntervalMs =
      options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.reconnectDelayMs =
      options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
    this.deviceIdentity =
      options.deviceIdentity ?? loadDeviceIdentityFromAssets();
    this.now = options.now ?? Date.now;
  }

  /**
   * Executes a JSON RPC call over the shared OpenClaw WebSocket connection.
   *
   * @param createRequest Builds the outbound request from a generated request id.
   * @param handleResponse Maps the successful gateway response to a domain value.
   * @returns The mapped RPC result.
   */
  public async invoke<T>(request: OpenClawRequestFrame): Promise<T> {
    await this.ensureConnected();

    return new Promise<T>((resolve, reject) => {
      const requestId = randomUUID();
      const frame = {
        ...request,
        id: requestId
      };
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new HttpError(
            504,
            `Timed out while waiting for OpenClaw response to ${frame.method}`
          )
        );
      }, this.timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout
      });

      try {
        this.sendFrame(frame);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(asTransportError(error));
      }
    });
  }

  /**
   * Closes the active socket and prevents further reconnect attempts.
   */
  public dispose(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.failConnect(new HttpError(502, "OpenClaw gateway client has been disposed"));
    this.failPendingRequests(
      new HttpError(502, "OpenClaw gateway client has been disposed")
    );
    this.socket?.close();
    this.socket = undefined;
    this.isConnected = false;
    this.activeConnectRequestId = undefined;
  }

  /**
   * Proactively establishes the authenticated gateway WebSocket connection.
   *
   * @returns Nothing once the handshake completes successfully.
   */
  public async connect(): Promise<void> {
    await this.ensureConnected();
  }

  /**
   * Reconfigures the shared gateway endpoint used by the singleton client.
   *
   * @param url The target gateway WebSocket URL.
   * @param token Optional gateway bearer token.
   */
  public reconfigureConnection(url: string, token?: string): void {
    const hasChanged = this.options.url !== url || this.options.token !== token;

    this.options.url = url;
    this.options.token = token;

    if (!hasChanged) {
      return;
    }

    const reconnectPreference = this.shouldReconnect;
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearConnectTimer();
    this.isConnected = false;
    this.activeConnectRequestId = undefined;
    this.socket?.close();
    this.socket = undefined;
    this.failConnect(new HttpError(502, "OpenClaw gateway connection was reconfigured"));
    this.failPendingRequests(
      new HttpError(502, "OpenClaw gateway connection was reconfigured")
    );
    this.shouldReconnect = reconnectPreference;
  }

  /**
   * Ensures there is an authenticated shared gateway connection.
   *
   * @returns Nothing once the gateway handshake has completed.
   */
  private async ensureConnected(): Promise<void> {
    if (this.isConnected && this.socket !== undefined) {
      return;
    }

    if (this.connectPromise !== undefined) {
      return this.connectPromise;
    }

    this.clearReconnectTimer();
    this.shouldReconnect = true;
    this.isConnected = false;
    this.activeConnectRequestId = randomUUID();

    const socket = this.createWebSocket(this.options.url);
    this.socket = socket;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
      this.connectTimer = setTimeout(() => {
        this.handleSocketFailure(
          socket,
          new HttpError(
            504,
            `Timed out while connecting to OpenClaw gateway at ${this.options.url}`
          )
        );
      }, this.timeoutMs);
    });

    socket.on("message", (rawMessage: unknown) => {
      this.handleSocketMessage(socket, rawMessage);
    });
    socket.on("error", (error: unknown) => {
      this.handleSocketFailure(socket, asTransportError(error));
    });
    socket.on("close", () => {
      this.handleSocketClose(socket);
    });

    return this.connectPromise;
  }

  /**
   * Handles every inbound gateway frame for the active socket.
   *
   * @param socket The socket that emitted the frame.
   * @param rawMessage The raw WebSocket payload.
   */
  private handleSocketMessage(
    socket: OpenClawWebSocket,
    rawMessage: unknown
  ): void {
    if (socket !== this.socket) {
      return;
    }

    try {
      const frame = parseGatewayFrame(rawMessage);

      if (isConnectChallenge(frame)) {
        this.sendConnectRequest(socket, frame);
        return;
      }

      if (
        this.activeConnectRequestId !== undefined &&
        isGatewayResponse(frame, this.activeConnectRequestId)
      ) {
        this.handleConnectResponse(frame);
        return;
      }

      if (frame.type !== "res") {
        return;
      }

      this.handleRpcResponse(frame);
    } catch (error) {
      this.handleSocketFailure(socket, asTransportError(error));
    }
  }

  /**
   * Sends the authenticated `connect` request after the gateway challenge.
   *
   * @param socket The active gateway socket.
   * @param frame The challenge event frame.
   */
  private sendConnectRequest(
    socket: OpenClawWebSocket,
    frame: OpenClawEventFrame
  ): void {
    if (socket !== this.socket || this.activeConnectRequestId === undefined) {
      return;
    }

    this.sendFrame(
      createConnectRequest(
        this.activeConnectRequestId,
        frame,
        this.options.token,
        this.deviceIdentity,
        this.now
      )
    );
  }

  /**
   * Finalizes the gateway handshake.
   *
   * @param frame The `connect` response.
   */
  private handleConnectResponse(frame: OpenClawResponseFrame): void {
    if (frame.ok !== true) {
      this.handleSocketFailure(
        this.socket,
        createGatewayError(frame, "OpenClaw connect failed")
      );
      return;
    }

    this.isConnected = true;
    this.activeConnectRequestId = undefined;
    this.clearConnectTimer();
    this.startHeartbeat();
    this.resolveConnect?.();
    this.resolveConnect = undefined;
    this.rejectConnect = undefined;
    this.connectPromise = undefined;
  }

  /**
   * Resolves or rejects a pending RPC response.
   *
   * @param frame The gateway response frame.
   */
  private handleRpcResponse(frame: OpenClawResponseFrame): void {
    const pending = this.pendingRequests.get(frame.id);

    if (pending === undefined) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(frame.id);

    if (frame.ok !== true) {
      pending.reject(
        createGatewayError(
          frame,
          `OpenClaw ${String(frame.error?.code ?? "request")} failed`
        )
      );
      return;
    }

    pending.resolve(frame.payload);
  }

  /**
   * Converts a socket error into a normalized failure and tears the connection down.
   *
   * @param socket The socket that failed.
   * @param error The normalized transport failure.
   */
  private handleSocketFailure(
    socket: OpenClawWebSocket | undefined,
    error: Error
  ): void {
    if (socket !== this.socket) {
      return;
    }

    const normalizedError =
      error instanceof HttpError
        ? error
        : new HttpError(
            502,
            `Failed to communicate with OpenClaw gateway: ${error.message}`
          );

    this.clearHeartbeatTimer();
    this.clearConnectTimer();
    this.isConnected = false;
    this.activeConnectRequestId = undefined;
    this.socket = undefined;
    this.failConnect(normalizedError);
    this.failPendingRequests(normalizedError);
    socket?.close();
    this.scheduleReconnect();
  }

  /**
   * Handles an unexpected gateway disconnect.
   *
   * @param socket The socket that closed.
   */
  private handleSocketClose(socket: OpenClawWebSocket): void {
    if (socket !== this.socket) {
      return;
    }

    const error = new HttpError(
      502,
      "OpenClaw gateway closed the connection unexpectedly"
    );

    this.clearHeartbeatTimer();
    this.clearConnectTimer();
    this.isConnected = false;
    this.activeConnectRequestId = undefined;
    this.socket = undefined;
    this.failConnect(error);
    this.failPendingRequests(error);
    this.scheduleReconnect();
  }

  /**
   * Rejects the active connect attempt.
   *
   * @param error The terminal connection failure.
   */
  private failConnect(error: Error): void {
    this.rejectConnect?.(error);
    this.resolveConnect = undefined;
    this.rejectConnect = undefined;
    this.connectPromise = undefined;
  }

  /**
   * Rejects every pending RPC request.
   *
   * @param error The shared terminal request failure.
   */
  private failPendingRequests(error: Error): void {
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Schedules a best-effort reconnect to restore the shared socket proactively.
   */
  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer !== undefined) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.ensureConnected().catch(() => {
        this.scheduleReconnect();
      });
    }, this.reconnectDelayMs);
  }

  /**
   * Starts the heartbeat loop when the socket supports ping frames.
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();

    if (this.heartbeatIntervalMs <= 0) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.socket?.ping?.();
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Sends a gateway frame through the active socket.
   *
   * @param frame The gateway frame to send.
   */
  private sendFrame(frame: OpenClawRequestFrame): void {
    if (this.socket === undefined) {
      throw new HttpError(502, "OpenClaw gateway connection is not available");
    }

    this.socket.send(JSON.stringify(frame));
  }

  /**
   * Clears the active connect timeout.
   */
  private clearConnectTimer(): void {
    if (this.connectTimer !== undefined) {
      clearTimeout(this.connectTimer);
      this.connectTimer = undefined;
    }
  }

  /**
   * Clears the active reconnect timer.
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * Clears the active heartbeat timer.
   */
  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer !== undefined) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

/**
 * Creates the default WebSocket implementation.
 *
 * @param url The gateway WebSocket endpoint.
 * @returns A connected WebSocket client wrapper.
 */
export function createDefaultWebSocket(url: string): OpenClawWebSocket {
  if (typeof globalThis.WebSocket !== "function") {
    throw new HttpError(
      500,
      "Global WebSocket client is not available in this Node.js runtime"
    );
  }

  const socket = new globalThis.WebSocket(url);
  const pingableSocket = socket as typeof socket & {
    ping?: () => void;
  };

  return {
    on(eventName: string, listener: (...args: unknown[]) => void): OpenClawWebSocket {
      if (eventName === "message") {
        socket.addEventListener("message", (event: MessageEvent) => {
          listener(event.data);
        });
      } else if (eventName === "error") {
        socket.addEventListener("error", (event: Event) => {
          listener(event);
        });
      } else if (eventName === "close") {
        socket.addEventListener("close", () => {
          listener();
        });
      } else if (eventName === "open") {
        socket.addEventListener("open", () => {
          listener();
        });
      }

      return this;
    },
    send(data: string): void {
      socket.send(data);
    },
    ping(): void {
      pingableSocket.ping?.();
    },
    close(): void {
      socket.close();
    }
  };
}

/**
 * Parses an incoming gateway frame.
 *
 * @param rawMessage The raw message emitted by the WebSocket library.
 * @returns A deserialized gateway frame.
 */
export function parseGatewayFrame(rawMessage: unknown): OpenClawGatewayFrame {
  if (typeof rawMessage === "string") {
    return JSON.parse(rawMessage) as OpenClawGatewayFrame;
  }

  if (Buffer.isBuffer(rawMessage)) {
    return JSON.parse(rawMessage.toString("utf8")) as OpenClawGatewayFrame;
  }

  throw new HttpError(502, "Received an unsupported frame from OpenClaw gateway");
}

/**
 * Creates the OpenClaw `connect` request.
 *
 * @param requestId The frame correlation id.
 * @param challengeFrame The received challenge event.
 * @param token Optional gateway token.
 * @param deviceIdentity The device identity used to authenticate the gateway session.
 * @param now Supplies the current timestamp in milliseconds.
 * @returns A serialized OpenClaw request frame.
 */
export function createConnectRequest(
  requestId: string,
  challengeFrame: OpenClawEventFrame,
  token: string | undefined,
  deviceIdentity: OpenClawDeviceIdentity = loadDeviceIdentityFromAssets(),
  now: () => number = Date.now
): OpenClawRequestFrame {
  const nonce = readChallengeNonce(challengeFrame);
  const signedAtMs = now();
  const signaturePayload = createDeviceSignaturePayload({
    deviceId: deviceIdentity.id,
    clientId: OPENCLAW_CLIENT_ID,
    clientMode: OPENCLAW_CLIENT_MODE,
    role: OPENCLAW_ROLE,
    scopes: OPENCLAW_SCOPES,
    signedAtMs,
    token,
    nonce,
    platform: OPENCLAW_PLATFORM,
    deviceFamily: OPENCLAW_DEVICE_FAMILY
  });

  return {
    type: "req",
    id: requestId,
    method: "connect",
    params: {
      minProtocol: OPENCLAW_PROTOCOL_VERSION,
      maxProtocol: OPENCLAW_PROTOCOL_VERSION,
      client: {
        id: OPENCLAW_CLIENT_ID,
        version: "0.1.0",
        platform: OPENCLAW_PLATFORM,
        mode: OPENCLAW_CLIENT_MODE
      },
      role: OPENCLAW_ROLE,
      scopes: OPENCLAW_SCOPES,
      caps: OPENCLAW_CAPS,
      commands: [],
      permissions: {},
      auth: token === undefined ? {} : { token },
      device: {
        id: deviceIdentity.id,
        publicKey: deviceIdentity.publicKey,
        signature: signDeviceSignature(signaturePayload, deviceIdentity.privateKeyPem),
        signedAt: signedAtMs,
        nonce
      }
    }
  };
}

/**
 * Identifies `connect.challenge` frames.
 *
 * @param frame The parsed gateway frame.
 * @returns Whether the frame is the expected pre-connect challenge.
 */
export function isConnectChallenge(
  frame: OpenClawGatewayFrame
): frame is OpenClawEventFrame {
  return frame.type === "event" && frame.event === "connect.challenge";
}

/**
 * Identifies gateway responses matching a request id.
 *
 * @param frame The parsed gateway frame.
 * @param requestId The expected correlation id.
 * @returns Whether the frame is the matching response.
 */
export function isGatewayResponse(
  frame: OpenClawGatewayFrame,
  requestId: string
): frame is OpenClawResponseFrame {
  return "type" in frame && frame.type === "res" && frame.id === requestId;
}

/**
 * Reads the nonce from a challenge event.
 *
 * @param frame The challenge frame.
 * @returns The nonce provided by the gateway.
 */
export function readChallengeNonce(frame: OpenClawEventFrame): string {
  const payload =
    typeof frame.payload === "object" && frame.payload !== null
      ? (frame.payload as Record<string, unknown>)
      : undefined;
  const nonce = payload?.nonce;

  if (typeof nonce !== "string" || nonce.length === 0) {
    throw new HttpError(502, "OpenClaw connect.challenge payload is missing nonce");
  }

  return nonce;
}

/**
 * Converts a failed gateway response into an HTTP-friendly error.
 *
 * @param frame The failed gateway response.
 * @param fallbackMessage The message used when the gateway omits one.
 * @returns A normalized HTTP error.
 */
export function createGatewayError(
  frame: OpenClawResponseFrame,
  fallbackMessage: string
): HttpError {
  const message = frame.error?.message ?? fallbackMessage;

  return new HttpError(502, message);
}

/**
 * Normalizes unknown thrown values to `Error`.
 *
 * @param error The unknown thrown value.
 * @returns A standard `Error` instance.
 */
export function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Converts transport failures to an HTTP-friendly gateway error.
 *
 * @param error The unknown transport failure.
 * @returns A normalized gateway transport error.
 */
export function asTransportError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  return new HttpError(
    502,
    `Failed to communicate with OpenClaw gateway: ${asError(error).message}`
  );
}

/**
 * Loads the OpenClaw device identity from the default assets directory.
 *
 * @returns The derived device identity.
 */
export function loadDeviceIdentityFromAssets(): OpenClawDeviceIdentity {
  return loadDeviceIdentity({
    publicKeyPath: resolve(process.cwd(), DEFAULT_DEVICE_PUBLIC_KEY_PATH),
    privateKeyPath: resolve(process.cwd(), DEFAULT_DEVICE_PRIVATE_KEY_PATH)
  });
}

/**
 * Loads the OpenClaw device identity from PEM files.
 *
 * @param keyPaths The file paths containing the device key pair.
 * @returns The derived device identity.
 */
export function loadDeviceIdentity(
  keyPaths: OpenClawDeviceKeyPaths
): OpenClawDeviceIdentity {
  const publicKeyPem = readFileSync(keyPaths.publicKeyPath, "utf8");
  const privateKeyPem = readFileSync(keyPaths.privateKeyPath, "utf8");
  const rawPublicKey = extractRawEd25519PublicKey(publicKeyPem);

  return {
    id: deriveDeviceIdFromPublicKey(rawPublicKey),
    publicKey: toBase64Url(rawPublicKey),
    privateKeyPem
  };
}

/**
 * Extracts the raw 32-byte Ed25519 public key from an SPKI PEM string.
 *
 * @param publicKeyPem The PEM-encoded public key.
 * @returns The raw Ed25519 public key bytes.
 */
export function extractRawEd25519PublicKey(publicKeyPem: string): Buffer {
  const publicKey = createPublicKey(publicKeyPem);
  const der = publicKey.export({
    format: "der",
    type: "spki"
  }) as Buffer;

  if (der.length !== ED25519_SPKI_PREFIX.length + 32) {
    throw new Error("Unexpected Ed25519 public key length");
  }

  if (!der.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)) {
    throw new Error("Unexpected Ed25519 public key prefix");
  }

  return der.subarray(ED25519_SPKI_PREFIX.length);
}

/**
 * Derives the OpenClaw device id from a raw public key.
 *
 * @param rawPublicKey The raw 32-byte Ed25519 public key.
 * @returns The stable device id as a SHA-256 hex digest.
 */
export function deriveDeviceIdFromPublicKey(rawPublicKey: Buffer): string {
  return createHash("sha256").update(rawPublicKey).digest("hex");
}

/**
 * Builds the canonical payload string used for the device signature.
 *
 * @param input The signature payload fields required by the gateway.
 * @returns The canonical payload string.
 */
export function createDeviceSignaturePayload(input: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string;
  nonce: string;
  platform: string;
  deviceFamily: string;
}): string {
  const scopes = input.scopes.join(",");
  const token = input.token ?? "";
  const platform = input.platform.trim().toLowerCase();
  const deviceFamily = input.deviceFamily.trim().toLowerCase();

  return [
    "v3",
    input.deviceId,
    input.clientId,
    input.clientMode,
    input.role,
    scopes,
    String(input.signedAtMs),
    token,
    input.nonce,
    platform,
    deviceFamily
  ].join("|");
}

/**
 * Signs the canonical device payload with the Ed25519 private key.
 *
 * @param payload The canonical payload string.
 * @param privateKeyPem The PEM-encoded Ed25519 private key.
 * @returns The base64url-encoded signature.
 */
export function signDeviceSignature(
  payload: string,
  privateKeyPem: string
): string {
  const privateKey = createPrivateKey(privateKeyPem);
  const signature = sign(null, Buffer.from(payload, "utf8"), privateKey);

  return toBase64Url(signature);
}

/**
 * Encodes binary data using base64url without padding.
 *
 * @param value The binary payload to encode.
 * @returns The base64url-encoded string.
 */
export function toBase64Url(value: Buffer): string {
  return value
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}
