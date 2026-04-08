import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  buildGuideEnvFileContent,
  buildOpenClawRootEnvEntries,
  buildGuideEnvEntries,
  collectMissingRequirements,
  DefaultGuideLogic,
  encodeEnvValue,
  mergeOpenClawRootEnv,
  normalizeInitializeGuideRequest,
  parseOpenClawAddress,
  parseDotEnv,
  readOpenClawDetectedConfigFromEnv,
  resolveInjectedPath,
  resolveOpenClawLocalPathsFromEnv,
  stripWrappingQuotes,
  upsertEnvEntries
} from "./guide";

describe("readOpenClawDetectedConfigFromEnv", () => {
  it("reads the gateway connection info from injected env vars", () => {
    expect(
      readOpenClawDetectedConfigFromEnv({
        OPENCLAW_GATEWAY_PROTOCOL: "wss",
        OPENCLAW_GATEWAY_HOST: "gateway.example.com",
        OPENCLAW_GATEWAY_PORT: "18443",
        OPENCLAW_GATEWAY_TOKEN: " token-1 "
      })
    ).toEqual({
      protocol: "wss",
      host: "gateway.example.com",
      port: 18443,
      token: "token-1"
    });
  });

  it("rejects missing gateway token", () => {
    expect(() => readOpenClawDetectedConfigFromEnv({})).toThrowError(
      new HttpError(
        500,
        "OpenClaw connection info is missing from environment",
        "OPENCLAW_ENV_NOT_FOUND"
      )
    );
  });
});

describe("resolveInjectedPath", () => {
  it("converts relative and home-relative paths to absolute paths", () => {
    expect(resolveInjectedPath("./openclaw.json")).toMatch(/openclaw\.json$/);
    expect(resolveInjectedPath("~/openclaw.json")).toBe(
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

  it("builds the full guide env file content without comments or trailing spaces", () => {
    const content = buildGuideEnvFileContent({
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
    });

    expect(content).toContain("OPENCLAW_CONFIG_PATH=/tmp/openclaw/openclaw.json");
    expect(content).toContain("OAUTH_MOCK_USER_ID=");
    expect(content).not.toContain("#");
    expect(content.split("\n").every((line) => line === line.replace(/[ \t]+$/, ""))).toBe(true);
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

  it("reads local OpenClaw config from injected env vars", async () => {
    const execFile = vi.fn();
    const prevProtocol = process.env.OPENCLAW_GATEWAY_PROTOCOL;
    const prevHost = process.env.OPENCLAW_GATEWAY_HOST;
    const prevPort = process.env.OPENCLAW_GATEWAY_PORT;
    const prevToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    process.env.OPENCLAW_GATEWAY_PROTOCOL = "ws";
    process.env.OPENCLAW_GATEWAY_HOST = "127.0.0.1";
    process.env.OPENCLAW_GATEWAY_PORT = "19001";
    process.env.OPENCLAW_GATEWAY_TOKEN = "token-1";
    const logic = new DefaultGuideLogic({
      studioRootDir: process.cwd(),
      commandRunner: {
        execFile
      }
    });

    try {
      await expect(logic.getOpenClawConfig()).resolves.toEqual({
        protocol: "ws",
        host: "127.0.0.1",
        port: 19001,
        token: "token-1"
      });
      expect(execFile).not.toHaveBeenCalled();
    } finally {
      process.env.OPENCLAW_GATEWAY_PROTOCOL = prevProtocol;
      process.env.OPENCLAW_GATEWAY_HOST = prevHost;
      process.env.OPENCLAW_GATEWAY_PORT = prevPort;
      process.env.OPENCLAW_GATEWAY_TOKEN = prevToken;
    }
  });

  it("initializes env, assets, and init script", async () => {
    const studioRootDir = await mkdtemp(join(tmpdir(), "dip-studio-guide-init-"));
    const execFile = vi.fn().mockResolvedValue({
      stdout: "ok",
      stderr: ""
    });
    const gatewayConnector = {
      reconfigureConnection: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };
    const prevConfigPath = process.env.OPENCLAW_CONFIG_PATH;
    const prevRootDir = process.env.OPENCLAW_ROOT_DIR;
    const prevWorkspaceDir = process.env.OPENCLAW_WORKSPACE_DIR;
    const prevKweaverBaseUrl = process.env.KWEAVER_BASE_URL;
    const prevKweaverToken = process.env.KWEAVER_TOKEN;
    process.env.OPENCLAW_ROOT_DIR = join(studioRootDir, "openclaw");
    process.env.OPENCLAW_CONFIG_PATH = join(studioRootDir, "openclaw", "openclaw.json");
    process.env.OPENCLAW_WORKSPACE_DIR = join(studioRootDir, "openclaw-workspace");
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

    try {
      const envContent = await readFile(join(studioRootDir, ".env"), "utf8");
      expect(envContent).toContain("OPENCLAW_GATEWAY_TOKEN=token-1");
      expect(envContent).toContain(
        `OPENCLAW_CONFIG_PATH=${join(studioRootDir, "openclaw", "openclaw.json")}`
      );
      expect(envContent).toContain(
        `OPENCLAW_WORKSPACE_DIR=${join(studioRootDir, "openclaw-workspace")}`
      );
      expect(envContent).not.toContain("#");
      expect(envContent.split("\n").every((line) => line === line.replace(/[ \t]+$/, ""))).toBe(true);
      expect(process.env.OPENCLAW_GATEWAY_TOKEN).toBe("token-1");
      expect(process.env.KWEAVER_BASE_URL).toBe("https://kweaver.example.com");
      expect(process.env.KWEAVER_TOKEN).toBe("kw-token");
      expect(await readFile(join(studioRootDir, "openclaw", ".env"), "utf8")).toContain(
        "KWEAVER_BASE_URL=https://kweaver.example.com"
      );
      expect(execFile).toHaveBeenNthCalledWith(
        1,
        "npm",
        ["run", "init:agents"],
        { cwd: studioRootDir }
      );
      expect(gatewayConnector.reconfigureConnection).toHaveBeenCalledWith(
        "ws://127.0.0.1:19001",
        "token-1"
      );
      expect(gatewayConnector.connect).toHaveBeenCalledOnce();
    } finally {
      if (prevConfigPath === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prevConfigPath;
      }
      if (prevRootDir === undefined) {
        delete process.env.OPENCLAW_ROOT_DIR;
      } else {
        process.env.OPENCLAW_ROOT_DIR = prevRootDir;
      }
      if (prevWorkspaceDir === undefined) {
        delete process.env.OPENCLAW_WORKSPACE_DIR;
      } else {
        process.env.OPENCLAW_WORKSPACE_DIR = prevWorkspaceDir;
      }
      if (prevKweaverBaseUrl === undefined) {
        delete process.env.KWEAVER_BASE_URL;
      } else {
        process.env.KWEAVER_BASE_URL = prevKweaverBaseUrl;
      }
      if (prevKweaverToken === undefined) {
        delete process.env.KWEAVER_TOKEN;
      } else {
        process.env.KWEAVER_TOKEN = prevKweaverToken;
      }
      await rm(studioRootDir, { recursive: true, force: true });
    }
  });
});

describe("OpenClaw root env helpers", () => {
  it("resolves local OpenClaw paths from injected env vars", () => {
    expect(
      resolveOpenClawLocalPathsFromEnv(
        {
          OPENCLAW_CONFIG_PATH: "~/.openclaw-dev/openclaw.json"
        },
        "/tmp/studio"
      )
    ).toEqual({
      configPath: join(process.env.HOME ?? "", ".openclaw-dev", "openclaw.json"),
      stateDir: join(process.env.HOME ?? "", ".openclaw-dev"),
      workspaceDir: join(process.env.HOME ?? "", ".openclaw-dev")
    });
  });

  it("prefers injected root and workspace directories when provided", () => {
    expect(
      resolveOpenClawLocalPathsFromEnv(
        {
          OPENCLAW_ROOT_DIR: "./runtime/openclaw",
          OPENCLAW_WORKSPACE_DIR: "./runtime/workspace"
        },
        "/tmp/studio"
      )
    ).toEqual({
      configPath: "/tmp/studio/runtime/openclaw/openclaw.json",
      stateDir: "/tmp/studio/runtime/openclaw",
      workspaceDir: "/tmp/studio/runtime/workspace"
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
