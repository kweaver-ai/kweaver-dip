import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OpenClawGatewayClient,
  createDeviceSignaturePayload,
  createGatewayError
} from "./openclaw-gateway-client";

afterEach(() => {
  OpenClawGatewayClient.resetInstanceForTests();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("node:crypto");
});

/**
 * Imports the gateway client with a mocked `createPublicKey` implementation.
 *
 * @param exportedKey The fake key object returned by `createPublicKey`.
 * @returns The `extractRawEd25519PublicKey` helper from a fresh module instance.
 */
async function importGatewayClientWithPublicKeyMock(exportedKey: Buffer) {
  vi.doMock("node:crypto", async () => {
    const actual = await vi.importActual<typeof import("node:crypto")>(
      "node:crypto"
    );

    return {
      ...actual,
      createPublicKey: vi.fn().mockReturnValue({
        export: vi.fn().mockReturnValue(exportedKey)
      })
    };
  });

  return import("./openclaw-gateway-client");
}

describe("createGatewayError", () => {
  it("falls back when the gateway omits an error message", () => {
    expect(
      createGatewayError(
        {
          type: "res",
          id: "req-1",
          ok: false
        },
        "OpenClaw agents.list failed"
      )
    ).toMatchObject({
      statusCode: 502,
      message: "OpenClaw agents.list failed"
    });
  });
});

describe("extractRawEd25519PublicKey", () => {
  it("rejects unexpected key lengths", async () => {
    const { extractRawEd25519PublicKey } =
      await importGatewayClientWithPublicKeyMock(Buffer.alloc(10));

    expect(() => extractRawEd25519PublicKey("public-key")).toThrow(
      "Unexpected Ed25519 public key length"
    );
  });

  it("rejects unexpected key prefixes", async () => {
    const { extractRawEd25519PublicKey } =
      await importGatewayClientWithPublicKeyMock(Buffer.alloc(44, 1));

    expect(() => extractRawEd25519PublicKey("public-key")).toThrow(
      "Unexpected Ed25519 public key prefix"
    );
  });
});

describe("createDeviceSignaturePayload", () => {
  it("normalizes optional token, platform and device family fields", () => {
    expect(
      createDeviceSignaturePayload({
        deviceId: "device-1",
        clientId: "gateway-client",
        clientMode: "backend",
        role: "operator",
        scopes: ["operator.read", "agents.read"],
        signedAtMs: 1_737_264_000_000,
        nonce: "nonce-1",
        platform: "  LINUX  ",
        deviceFamily: "  DESKTOP  "
      })
    ).toBe(
      "v3|device-1|gateway-client|backend|operator|operator.read,agents.read|1737264000000||nonce-1|linux|desktop"
    );
  });
});

describe("OpenClawGatewayClient singleton", () => {
  it("returns the same instance for repeated calls", () => {
    const first = OpenClawGatewayClient.getInstance({
      url: "ws://127.0.0.1:19001"
    });
    const second = OpenClawGatewayClient.getInstance({
      url: "ws://127.0.0.1:19002"
    });

    expect(first).toBe(second);
  });
});
