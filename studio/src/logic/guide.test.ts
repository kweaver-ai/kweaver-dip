import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  buildOpenClawRootEnvEntries,
  buildGuideEnvEntries,
  collectMissingRequirements,
  DefaultGuideLogic,
  encodeEnvValue,
  mergeOpenClawRootEnv,
  normalizeInitializeGuideRequest,
  parseOpenClawAddress,
  parseDotEnv,
  parseOpenClawGatewayStatus,
  readGatewayTokenFromConfig,
  resolveOpenClawLocalPaths,
  resolveOpenClawConfigPath,
  stripWrappingQuotes,
  upsertEnvEntries
} from "./guide";

describe("parseOpenClawGatewayStatus", () => {
  it("parses config path and probe target", () => {
    expect(
      parseOpenClawGatewayStatus(
        [
          "Config (service): /tmp/openclaw.json",
          "Probe target: ws://127.0.0.1:19001"
        ].join("\n")
      )
    ).toEqual({
      configPath: "/tmp/openclaw.json",
      protocol: "ws",
      host: "127.0.0.1",
      port: 19001
    });
  });

  it("rejects malformed output", () => {
    expect(() => parseOpenClawGatewayStatus("bad")).toThrowError(
      new HttpError(502, "Failed to parse OpenClaw gateway status output")
    );
  });
});

describe("readGatewayTokenFromConfig", () => {
  it("extracts the gateway auth token", () => {
    expect(
      readGatewayTokenFromConfig('{"gateway":{"auth":{"token":" token-1 "}}}')
    ).toBe("token-1");
  });

  it("rejects invalid config payloads", () => {
    expect(() => readGatewayTokenFromConfig("{")).toThrow("OpenClaw config is not valid JSON");
    expect(() => readGatewayTokenFromConfig("{}")).toThrow(
      "OpenClaw gateway token is missing from config"
    );
  });
});

describe("resolveOpenClawConfigPath", () => {
  it("converts relative and home-relative paths to absolute paths", () => {
    expect(resolveOpenClawConfigPath("./openclaw.json")).toMatch(/openclaw\.json$/);
    expect(resolveOpenClawConfigPath("~/openclaw.json")).toBe(
      join(process.env.HOME ?? "", "openclaw.json")
    );
  });
});

describe("dotenv helpers", () => {
  it("parses dotenv content and strips quotes", () => {
    expect(
      parseDotEnv([
        "A=1",
        "B=\"two words\"",
        "C=value # inline comment"
      ].join("\n"))
    ).toEqual({
      A: "1",
      B: "two words",
      C: "value"
    });
    expect(stripWrappingQuotes("\"x\"")).toBe("x");
    expect(stripWrappingQuotes("y")).toBe("y");
  });

  it("updates env entries without discarding other lines", () => {
    expect(
      upsertEnvEntries(
        ["A=1", "# comment", "B=2"].join("\n"),
        [
          ["B", "3"],
          ["C", "4 5"]
        ]
      )
    ).toBe(["A=1", "# comment", "B=3", "C=\"4 5\"", ""].join("\n"));
    expect(encodeEnvValue("plain")).toBe("plain");
  });
});

describe("normalizeInitializeGuideRequest", () => {
  it("parses the full openclaw address", () => {
    expect(parseOpenClawAddress("ws://127.0.0.1:19001")).toEqual({
      protocol: "ws",
      host: "127.0.0.1",
      port: 19001
    });
    expect(() => parseOpenClawAddress("http://127.0.0.1:19001")).toThrow(
      "openclaw_address must use ws or wss protocol"
    );
  });

  it("derives default state and workspace directories", () => {
    expect(
      normalizeInitializeGuideRequest({
        openclaw_address: "ws://127.0.0.1:19001",
        openclaw_token: "token-1",
        kweaver_base_url: "https://kweaver.example.com",
        kweaver_token: "kw-token"
      })
    ).toEqual({
      openclaw_address: "ws://127.0.0.1:19001",
      openclaw_token: "token-1",
      kweaver_base_url: "https://kweaver.example.com",
      kweaver_token: "kw-token",
      configPath: join(process.env.HOME ?? "", ".openclaw", "openclaw.json"),
      protocol: "ws",
      host: "127.0.0.1",
      port: 19001,
      token: "token-1",
      stateDir: join(process.env.HOME ?? "", ".openclaw"),
      workspaceDir: join(process.env.HOME ?? "", ".openclaw")
    });
  });

  it("builds the expected env entries", () => {
    expect(
      buildGuideEnvEntries({
        openclaw_address: "ws://127.0.0.1:19001",
        openclaw_token: "token-1",
        kweaver_base_url: "https://kweaver.example.com",
        kweaver_token: "kw-token",
        configPath: "/tmp/openclaw/openclaw.json",
        protocol: "ws",
        host: "127.0.0.1",
        port: 19001,
        token: "token-1",
        stateDir: "/tmp/openclaw",
        workspaceDir: "/tmp/openclaw/workspace"
      })
    ).toEqual([
      ["OPENCLAW_CONFIG_PATH", "/tmp/openclaw/openclaw.json"],
      ["OPENCLAW_ROOT_DIR", "/tmp/openclaw"],
      ["OPENCLAW_GATEWAY_PROTOCOL", "ws"],
      ["OPENCLAW_GATEWAY_HOST", "127.0.0.1"],
      ["OPENCLAW_GATEWAY_PORT", "19001"],
      ["OPENCLAW_GATEWAY_TOKEN", "token-1"],
      ["OPENCLAW_WORKSPACE_DIR", "/tmp/openclaw/workspace"],
      ["KWEAVER_BASE_URL", "https://kweaver.example.com"],
      ["KWEAVER_TOKEN", "kw-token"]
    ]);
  });

  it("builds the expected OpenClaw root env entries", () => {
    expect(
      buildOpenClawRootEnvEntries({
        openclaw_address: "ws://127.0.0.1:19001",
        openclaw_token: "token-1",
        kweaver_base_url: "https://kweaver.example.com",
        kweaver_token: "kw-token",
        configPath: "/tmp/openclaw/openclaw.json",
        protocol: "ws",
        host: "127.0.0.1",
        port: 19001,
        token: "token-1",
        stateDir: "/tmp/openclaw",
        workspaceDir: "/tmp/openclaw/workspace"
      })
    ).toEqual([
      ["KWEAVER_BASE_URL", "https://kweaver.example.com"],
      ["KWEAVER_TOKEN", "kw-token"]
    ]);
  });
});

describe("collectMissingRequirements", () => {
  let studioRootDir: string;

  beforeEach(async () => {
    studioRootDir = await mkdtemp(join(tmpdir(), "dip-studio-guide-status-"));
  });

  it("reports all requirements when env file is missing", async () => {
    expect(await collectMissingRequirements(studioRootDir)).toEqual([
      "envFile",
      "gatewayProtocol",
      "gatewayHost",
      "gatewayPort",
      "gatewayToken",
      "workspaceDir",
      "privateKey",
      "publicKey"
    ]);
  });

  it("reports ready when env and assets are present", async () => {
    await mkdir(join(studioRootDir, "assets"), { recursive: true });
    await writeFile(
      join(studioRootDir, ".env"),
      [
        "OPENCLAW_GATEWAY_PROTOCOL=ws",
        "OPENCLAW_GATEWAY_HOST=127.0.0.1",
        "OPENCLAW_GATEWAY_PORT=19001",
        "OPENCLAW_GATEWAY_TOKEN=token-1",
        "OPENCLAW_WORKSPACE_DIR=/tmp/openclaw"
      ].join("\n"),
      "utf8"
    );
    await writeFile(join(studioRootDir, "assets", "private.pem"), "private", "utf8");
    await writeFile(join(studioRootDir, "assets", "public.pem"), "public", "utf8");

    expect(await collectMissingRequirements(studioRootDir)).toEqual([]);
  });
});

describe("DefaultGuideLogic", () => {
  it("returns pending status when requirements are missing", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-studio-guide-logic-"));
    const logic = new DefaultGuideLogic({
      studioRootDir,
      commandRunner: {
        execFile: vi.fn()
      }
    });

    await expect(logic.getStatus()).resolves.toEqual({
      state: "pending",
      ready: false,
      missing: [
        "envFile",
        "gatewayProtocol",
        "gatewayHost",
        "gatewayPort",
        "gatewayToken",
        "workspaceDir",
        "privateKey",
        "publicKey"
      ]
    });

    await rm(studioRootDir, { recursive: true, force: true });
  });

  it("reads local OpenClaw config from command output", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-studio-guide-openclaw-"));
    const configPath = join(studioRootDir, "openclaw.json");
    await writeFile(
      configPath,
      JSON.stringify({
        gateway: {
          auth: {
            token: "token-1"
          }
        }
      }),
      "utf8"
    );
    const execFile = vi.fn().mockResolvedValue({
      stdout: [
        `Config (service): ${configPath}`,
        "Probe target: ws://127.0.0.1:19001"
      ].join("\n"),
      stderr: ""
    });
    const logic = new DefaultGuideLogic({
      studioRootDir,
      commandRunner: {
        execFile
      }
    });

    await expect(logic.getOpenClawConfig()).resolves.toEqual({
      protocol: "ws",
      host: "127.0.0.1",
      port: 19001,
      token: "token-1"
    });

    await rm(studioRootDir, { recursive: true, force: true });
  });

  it("resolves the parsed config path to an absolute path before reading", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-studio-guide-openclaw-rel-"));
    const configDir = join(studioRootDir, "nested");
    const configPath = join(configDir, "openclaw.json");
    await mkdir(configDir, { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify({
        gateway: {
          auth: {
            token: "token-1"
          }
        }
      }),
      "utf8"
    );
    const relativeConfigPath = "./openclaw.json";
    const execFile = vi.fn().mockResolvedValue({
      stdout: [
        `Config (service): ${relativeConfigPath}`,
        "Probe target: ws://127.0.0.1:19001"
      ].join("\n"),
      stderr: ""
    });
    const logic = new DefaultGuideLogic({
      studioRootDir: configDir,
      commandRunner: {
        execFile
      }
    });

    await expect(logic.getOpenClawConfig()).resolves.toEqual({
      protocol: "ws",
      host: "127.0.0.1",
      port: 19001,
      token: "token-1"
    });

    await rm(studioRootDir, { recursive: true, force: true });
  });

  it("returns a typed error when the openclaw command is missing", async () => {
    const logic = new DefaultGuideLogic({
      commandRunner: {
        execFile: vi.fn().mockRejectedValue(new Error("spawn openclaw ENOENT"))
      }
    });

    await expect(logic.getOpenClawConfig()).rejects.toMatchObject({
      statusCode: 500,
      message: "OpenClaw is not installed on this node",
      code: "OPENCLAW_CMD_NOT_FOUND"
    });
  });

  it("initializes env, assets, and init script", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-studio-guide-init-"));
    await writeFile(join(studioRootDir, ".env.example"), "PORT=3000\n", "utf8");
    await mkdir(join(studioRootDir, "openclaw"), { recursive: true });
    const execFile = vi.fn()
      .mockResolvedValueOnce({
        stdout: [
          `Config (service): ${join(studioRootDir, "openclaw", "openclaw.json")}`,
          "Probe target: ws://127.0.0.1:19001"
        ].join("\n"),
        stderr: ""
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: ""
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: ""
      })
      .mockResolvedValueOnce({
        stdout: "ok",
        stderr: ""
      });
    const gatewayConnector = {
      reconfigureConnection: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };
    const logic = new DefaultGuideLogic({
      studioRootDir,
      commandRunner: {
        execFile
      },
      gatewayConnector
    });

    await expect(
      logic.initialize({
        openclaw_address: "ws://127.0.0.1:19001",
        openclaw_token: "token-1",
        kweaver_base_url: "https://kweaver.example.com",
        kweaver_token: "kw-token"
      })
    ).resolves.toBeUndefined();

    expect(await readFile(join(studioRootDir, ".env"), "utf8")).toContain(
      "OPENCLAW_GATEWAY_TOKEN=token-1"
    );
    expect(await readFile(join(studioRootDir, ".env"), "utf8")).toContain(
      "KWEAVER_BASE_URL=https://kweaver.example.com"
    );
    expect(await readFile(join(studioRootDir, "openclaw", ".env"), "utf8")).toContain(
      "KWEAVER_BASE_URL=https://kweaver.example.com"
    );
    expect(execFile).toHaveBeenNthCalledWith(
      2,
      "openssl",
      ["genpkey", "-algorithm", "ED25519", "-out", join(studioRootDir, "assets", "private.pem")],
      { cwd: join(studioRootDir, "assets") }
    );
    expect(execFile).toHaveBeenNthCalledWith(
      4,
      "npm",
      ["run", "init:agents"],
      { cwd: studioRootDir }
    );
    expect(gatewayConnector.reconfigureConnection).toHaveBeenCalledWith(
      "ws://127.0.0.1:19001",
      "token-1"
    );
    expect(gatewayConnector.connect).toHaveBeenCalledOnce();

    await rm(studioRootDir, { recursive: true, force: true });
  });
});

describe("OpenClaw root env helpers", () => {
  it("resolves local OpenClaw paths from gateway status", async () => {
    const commandRunner = {
      execFile: vi.fn().mockResolvedValue({
        stdout: [
          "Config (service): ~/.openclaw-dev/openclaw.json",
          "Probe target: ws://127.0.0.1:19001"
        ].join("\n"),
        stderr: ""
      })
    };

    await expect(
      resolveOpenClawLocalPaths(commandRunner, "/tmp/studio")
    ).resolves.toEqual({
      configPath: join(process.env.HOME ?? "", ".openclaw-dev", "openclaw.json"),
      stateDir: join(process.env.HOME ?? "", ".openclaw-dev"),
      workspaceDir: join(process.env.HOME ?? "", ".openclaw-dev")
    });
  });

  it("creates or updates the OpenClaw root env file", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "dip-openclaw-root-env-"));
    const envFilePath = join(rootDir, ".env");

    await mergeOpenClawRootEnv(envFilePath, [
      ["KWEAVER_BASE_URL", "https://kweaver.example.com"],
      ["KWEAVER_TOKEN", "kw-token"]
    ]);

    expect(await readFile(envFilePath, "utf8")).toBe(
      ["KWEAVER_BASE_URL=https://kweaver.example.com", "KWEAVER_TOKEN=kw-token", ""].join("\n")
    );

    await mergeOpenClawRootEnv(envFilePath, [
      ["KWEAVER_BASE_URL", ""],
      ["KWEAVER_TOKEN", ""]
    ]);

    expect(await readFile(envFilePath, "utf8")).toBe(
      ["KWEAVER_BASE_URL=", "KWEAVER_TOKEN=", ""].join("\n")
    );
  });
});
