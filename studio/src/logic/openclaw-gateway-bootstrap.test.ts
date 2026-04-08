import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  connectOpenClawGateway,
  connectOpenClawGatewayIfInitialized
} from "./openclaw-gateway-bootstrap";

describe("connectOpenClawGateway", () => {
  it("reconfigures the connector before connecting", async () => {
    const connector = {
      reconfigureConnection: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };

    await connectOpenClawGateway({
      url: "ws://127.0.0.1:19001",
      token: "token-1",
      connector
    });

    expect(connector.reconfigureConnection).toHaveBeenCalledWith(
      "ws://127.0.0.1:19001",
      "token-1"
    );
    expect(connector.connect).toHaveBeenCalledOnce();
  });
});

describe("connectOpenClawGatewayIfInitialized", () => {
  it("skips connecting when Studio is not initialized", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-gateway-bootstrap-pending-"));
    const connector = {
      reconfigureConnection: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };

    await expect(
      connectOpenClawGatewayIfInitialized({
        studioRootDir,
        connector,
        envReader: vi.fn()
      })
    ).resolves.toBe(false);

    expect(connector.connect).not.toHaveBeenCalled();
  });

  it("connects when Studio is initialized", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-gateway-bootstrap-ready-"));
    await mkdir(join(studioRootDir, "assets"), { recursive: true });
    await writeFile(
      join(studioRootDir, ".env"),
      [
        "OPENCLAW_GATEWAY_PROTOCOL=ws",
        "OPENCLAW_GATEWAY_HOST=127.0.0.1",
        "OPENCLAW_GATEWAY_PORT=19001",
        "OPENCLAW_GATEWAY_TOKEN=token-1",
        `OPENCLAW_WORKSPACE_DIR=${join(studioRootDir, "workspace")}`
      ].join("\n"),
      "utf8"
    );
    await writeFile(join(studioRootDir, "assets", "private.pem"), "private", "utf8");
    await writeFile(join(studioRootDir, "assets", "public.pem"), "public", "utf8");

    const connector = {
      reconfigureConnection: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };
    const envReader = vi.fn().mockReturnValue({
      port: 3000,
      bknBackendUrl: "http://127.0.0.1:13014/",
      appUserToken: undefined,
      hydraAdminUrl: "http://127.0.0.1:4445/",
      isDevelopment: false,
      oauthMockUserId: undefined,
      openClawGatewayUrl: "ws://127.0.0.1:19001/",
      openClawGatewayHttpUrl: "http://127.0.0.1:19001/",
      openClawGatewayToken: "token-1",
      openClawGatewayTimeoutMs: 5000,
      openClawWorkspaceDir: join(studioRootDir, "workspace")
    });

    await expect(
      connectOpenClawGatewayIfInitialized({
        studioRootDir,
        connector,
        envReader
      })
    ).resolves.toBe(true);

    expect(connector.reconfigureConnection).toHaveBeenCalledWith(
      "ws://127.0.0.1:19001/",
      "token-1"
    );
    expect(connector.connect).toHaveBeenCalledOnce();
  });
});
