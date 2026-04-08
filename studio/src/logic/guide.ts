import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { HttpError } from "../errors/http-error";
import { connectOpenClawGateway } from "./openclaw-gateway-bootstrap";
import {
  asMessage,
  loadEnvFile,
  readOptionalString,
  resolveGatewayHost,
  resolveGatewayPort,
  resolveGatewayProtocol,
  resolveWorkspaceDir
} from "../utils/env";
import type {
  GuideInitializationRequirement,
  GuideStatusResponse,
  InitializeGuideRequest,
  OpenClawDetectedConfig
} from "../types/guide";

/**
 * Internal normalized payload used by the initialization workflow.
 */
export interface NormalizedInitializeGuideRequest {
  /**
   * Full OpenClaw gateway address.
   */
  openclaw_address: string;

  /**
   * OpenClaw gateway auth token.
   */
  openclaw_token: string;

  /**
   * Optional KWeaver service base URL.
   */
  kweaver_base_url?: string;

  /**
   * Optional KWeaver access token.
   */
  kweaver_token?: string;

  /**
   * Derived OpenClaw config file path.
   */
  configPath: string;

  /**
   * Derived OpenClaw state directory.
   */
  stateDir: string;

  /**
   * Derived OpenClaw workspace root.
   */
  workspaceDir: string;

  /**
   * Parsed gateway protocol.
   */
  protocol: "ws" | "wss";

  /**
   * Parsed gateway host.
   */
  host: string;

  /**
   * Parsed gateway port.
   */
  port: number;

  /**
   * Normalized gateway token.
   */
  token: string;
}

const execFileAsync = promisify(execFile);

/**
 * Result of a shell command execution.
 */
export interface GuideCommandResult {
  /**
   * Captured command stdout.
   */
  stdout: string;

  /**
   * Captured command stderr.
   */
  stderr: string;
}

/**
 * Abstraction for running local shell commands.
 */
export interface GuideCommandRunner {
  /**
   * Executes one command and captures its output.
   *
   * @param file Executable name or absolute path.
   * @param args Command arguments.
   * @param options Optional execution settings.
   * @returns The captured stdout/stderr payload.
   */
  execFile(
    file: string,
    args: string[],
    options?: {
      cwd?: string;
    }
  ): Promise<GuideCommandResult>;
}

/**
 * Options used to construct the guide logic service.
 */
export interface GuideLogicOptions {
  /**
   * Repository root that contains runtime files such as `.env`, `assets/`, and package.json.
   */
  studioRootDir?: string;

  /**
   * Optional command runner used by tests.
   */
  commandRunner?: GuideCommandRunner;

  /**
   * Optional gateway connector used by tests and initialization flows.
   */
  gatewayConnector?: {
    reconfigureConnection(url: string, token?: string): void;
    connect(): Promise<void>;
  };
}

/**
 * Public contract exposed by the bootstrap guide logic.
 */
export interface GuideLogic {
  /**
   * Reads the current DIP Studio initialization status.
   *
   * @returns The normalized guide status response.
   */
  getStatus(): Promise<GuideStatusResponse>;

  /**
   * Reads OpenClaw connection settings from injected runtime environment variables.
   *
   * @returns The detected OpenClaw configuration.
   */
  getOpenClawConfig(): Promise<OpenClawDetectedConfig>;

  /**
   * Initializes DIP Studio local files and default OpenClaw assets.
   *
   * @param request The initialization payload.
   * @returns Nothing. Successful completion means initialization finished.
   */
  initialize(request: InitializeGuideRequest): Promise<void>;
}

/**
 * Default shell command runner backed by `execFile`.
 */
export class DefaultGuideCommandRunner implements GuideCommandRunner {
  /**
   * Executes one local command.
   *
   * @param file Executable name or absolute path.
   * @param args Command arguments.
   * @param options Optional execution settings.
   * @returns The captured stdout/stderr payload.
   */
  public async execFile(
    file: string,
    args: string[],
    options: {
      cwd?: string;
    } = {}
  ): Promise<GuideCommandResult> {
    const result = await execFileAsync(file, args, {
      cwd: options.cwd,
      encoding: "utf8"
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

/**
 * Default implementation of DIP Studio bootstrap guide logic.
 */
export class DefaultGuideLogic implements GuideLogic {
  private readonly studioRootDir: string;

  private readonly commandRunner: GuideCommandRunner;
  private readonly gatewayConnector?: GuideLogicOptions["gatewayConnector"];

  /**
   * Creates one guide logic instance.
   *
   * @param options Optional root directory and command runner overrides.
   */
  public constructor(options: GuideLogicOptions = {}) {
    this.studioRootDir = resolve(options.studioRootDir ?? process.cwd());
    this.commandRunner = options.commandRunner ?? new DefaultGuideCommandRunner();
    this.gatewayConnector = options.gatewayConnector;
  }

  /**
   * Reads the current guide status from local files.
   *
   * @returns The normalized guide status response.
   */
  public async getStatus(): Promise<GuideStatusResponse> {
    const missing = await collectMissingRequirements(this.studioRootDir);

    return {
      state: missing.length === 0 ? "ready" : "pending",
      ready: missing.length === 0,
      missing
    };
  }

  /**
   * Discovers OpenClaw connection settings from the host node.
   *
   * @returns The detected OpenClaw configuration.
   */
  public async getOpenClawConfig(): Promise<OpenClawDetectedConfig> {
    return readOpenClawDetectedConfigFromEnv(process.env);
  }

  /**
   * Initializes local Studio configuration and OpenClaw assets.
   *
   * @param request The initialization payload.
   * @returns The successful initialization result.
   */
  public async initialize(
    request: InitializeGuideRequest
  ): Promise<void> {
    const localPaths = resolveOpenClawLocalPathsFromEnv(process.env, this.studioRootDir);
    const normalized = normalizeInitializeGuideRequest(request, localPaths);
    const envFilePath = join(this.studioRootDir, ".env");
    await writeFile(envFilePath, buildGuideEnvFileContent(normalized), "utf8");
    loadEnvFile({
      path: envFilePath,
      forceReload: true,
      override: true
    });
    await this.commandRunner.execFile("npm", ["run", "init:agents"], {
      cwd: this.studioRootDir
    });
    await connectOpenClawGateway({
      url: normalized.openclaw_address,
      token: normalized.openclaw_token,
      connector: this.gatewayConnector
    });
    await mergeOpenClawRootEnv(
      join(normalized.stateDir, ".env"),
      buildOpenClawRootEnvEntries(normalized)
    );
  }
}

/**
 * Resolves one possibly relative or home-relative path into an absolute path.
 *
 * @param rawPath Raw filesystem path.
 * @param baseDir Base directory used to resolve relative paths.
 * @returns The absolute path.
 */
export function resolveInjectedPath(
  rawPath: string,
  baseDir: string = process.cwd()
): string {
  const trimmed = rawPath.trim();

  if (trimmed.startsWith("~/")) {
    return resolve(homedir(), trimmed.slice(2));
  }

  return resolve(baseDir, trimmed);
}

/**
 * Reads OpenClaw connection information from injected environment variables.
 *
 * @param envSource Environment variable source.
 * @returns The resolved gateway configuration.
 * @throws {HttpError} Thrown when required variables are missing.
 */
export function readOpenClawDetectedConfigFromEnv(
  envSource: NodeJS.ProcessEnv
): OpenClawDetectedConfig {
  const token = readOptionalString(envSource.OPENCLAW_GATEWAY_TOKEN);

  if (token === undefined) {
    throw new HttpError(
      500,
      "OpenClaw connection info is missing from environment",
      "OPENCLAW_ENV_NOT_FOUND"
    );
  }

  return {
    protocol: resolveGatewayProtocol(envSource.OPENCLAW_GATEWAY_PROTOCOL),
    host: resolveGatewayHost(envSource.OPENCLAW_GATEWAY_HOST),
    port: resolveGatewayPort(envSource.OPENCLAW_GATEWAY_PORT),
    token
  };
}

/**
 * Normalizes one initialization request and derives default directories.
 *
 * @param request Raw request payload.
 * @returns The normalized request.
 * @throws {HttpError} Thrown when required fields are invalid.
 */
export function normalizeInitializeGuideRequest(
  request: InitializeGuideRequest,
  localPaths?: {
    configPath: string;
    stateDir: string;
    workspaceDir: string;
  }
): NormalizedInitializeGuideRequest {
  const address = readRequiredGuideString(
    request.openclaw_address,
    "openclaw_address"
  );
  const token = readRequiredGuideString(request.openclaw_token, "openclaw_token");
  const kweaverBaseUrl = readOptionalString(request.kweaver_base_url);
  const kweaverToken = readOptionalString(request.kweaver_token);
  const parsedAddress = parseOpenClawAddress(address);
  const stateDir =
    localPaths?.stateDir ??
    readRequiredGuideString(join(process.env.HOME ?? "", ".openclaw"), "stateDir");
  const workspaceDir = localPaths?.workspaceDir ?? resolveWorkspaceDir(stateDir);
  const configPath = localPaths?.configPath ?? join(stateDir, "openclaw.json");

  return {
    openclaw_address: address,
    openclaw_token: token,
    kweaver_base_url: kweaverBaseUrl,
    kweaver_token: kweaverToken,
    configPath,
    protocol: parsedAddress.protocol,
    host: parsedAddress.host,
    port: parsedAddress.port,
    token,
    stateDir,
    workspaceDir
  };
}

/**
 * Parses one full OpenClaw gateway address.
 *
 * @param address Raw OpenClaw gateway address.
 * @returns The normalized protocol, host, and port.
 * @throws {HttpError} Thrown when the address is invalid.
 */
export function parseOpenClawAddress(address: string): {
  protocol: "ws" | "wss";
  host: string;
  port: number;
} {
  let parsed: URL;

  try {
    parsed = new URL(address);
  } catch {
    throw new HttpError(400, "openclaw_address must be a valid ws/wss URL");
  }

  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
    throw new HttpError(400, "openclaw_address must use ws or wss protocol");
  }

  if (parsed.port.trim() === "") {
    throw new HttpError(400, "openclaw_address must include an explicit port");
  }

  return {
    protocol: resolveGatewayProtocol(parsed.protocol.slice(0, -1)),
    host: resolveGatewayHost(parsed.hostname),
    port: resolveGatewayPort(parsed.port)
  };
}

/**
 * Reads one required non-empty string for guide request validation.
 *
 * @param value Raw value.
 * @param fieldName Public field name used in validation errors.
 * @returns The trimmed value.
 * @throws {HttpError} Thrown when the value is missing.
 */
export function readRequiredGuideString(
  value: string | undefined,
  fieldName: string
): string {
  const normalized = readOptionalString(value);

  if (normalized === undefined) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return normalized;
}

/**
 * Builds the environment entries written during initialization.
 *
 * @param request Normalized initialization payload.
 * @returns The env key/value pairs to upsert.
 */
export function buildGuideEnvEntries(
  request: NormalizedInitializeGuideRequest
): ReadonlyArray<readonly [string, string]> {
  return [
    ["OPENCLAW_CONFIG_PATH", request.configPath],
    ["OPENCLAW_ROOT_DIR", request.stateDir],
    ["OPENCLAW_GATEWAY_PROTOCOL", request.protocol],
    ["OPENCLAW_GATEWAY_HOST", request.host],
    ["OPENCLAW_GATEWAY_PORT", String(request.port)],
    ["OPENCLAW_GATEWAY_TOKEN", request.token],
    ["OPENCLAW_WORKSPACE_DIR", request.workspaceDir],
    ["KWEAVER_BASE_URL", request.kweaver_base_url ?? ""],
    ["KWEAVER_TOKEN", request.kweaver_token ?? ""]
  ];
}

/**
 * Builds the full `.env` file content for guide initialization.
 *
 * The field order mirrors the checked-in `.env.example` template, but the
 * generated content intentionally contains only `KEY=value` lines plus blank
 * separators. Initialization must not copy template comments or trailing spaces.
 *
 * @param request Normalized initialization payload.
 * @returns The generated dotenv file content.
 */
export function buildGuideEnvFileContent(
  request: NormalizedInitializeGuideRequest
): string {
  const lines = [
    `PORT=${encodeEnvValue("3000")}`,
    "",
    `OPENCLAW_GATEWAY_PROTOCOL=${encodeEnvValue(request.protocol)}`,
    `OPENCLAW_GATEWAY_HOST=${encodeEnvValue(request.host)}`,
    `OPENCLAW_GATEWAY_PORT=${encodeEnvValue(String(request.port))}`,
    `OPENCLAW_GATEWAY_TOKEN=${encodeEnvValue(request.token)}`,
    "OPENCLAW_GATEWAY_TIMEOUT_MS=5000",
    "",
    `OPENCLAW_ROOT_DIR=${encodeEnvValue(request.stateDir)}`,
    `OPENCLAW_CONFIG_PATH=${encodeEnvValue(request.configPath)}`,
    `OPENCLAW_WORKSPACE_DIR=${encodeEnvValue(request.workspaceDir)}`,
    "",
    `KWEAVER_BASE_URL=${encodeEnvValue(request.kweaver_base_url ?? "")}`,
    `KWEAVER_TOKEN=${encodeEnvValue(request.kweaver_token ?? "")}`,
    "",
    "OAUTH_MOCK_USER_ID=",
    "KWEAVER_HYDRA_ADMIN_URL=",
    ""
  ];

  return lines.join("\n");
}

/**
 * Builds the env entries written to the OpenClaw root `.env` file.
 *
 * @param request Normalized initialization payload.
 * @returns The KWeaver-related env key/value pairs.
 */
export function buildOpenClawRootEnvEntries(
  request: NormalizedInitializeGuideRequest
): ReadonlyArray<readonly [string, string]> {
  return [
    ["KWEAVER_BASE_URL", request.kweaver_base_url ?? ""],
    ["KWEAVER_TOKEN", request.kweaver_token ?? ""]
  ];
}

/**
 * Resolves OpenClaw local filesystem paths from injected environment variables.
 *
 * @param envSource Environment variable source.
 * @param studioRootDir Base directory used to resolve relative paths.
 * @returns The resolved config, state, and workspace paths.
 */
export function resolveOpenClawLocalPathsFromEnv(
  envSource: NodeJS.ProcessEnv,
  studioRootDir: string
): {
  configPath: string;
  stateDir: string;
  workspaceDir: string;
} {
  const configuredRootDir = readOptionalString(envSource.OPENCLAW_ROOT_DIR);
  const configuredConfigPath = readOptionalString(envSource.OPENCLAW_CONFIG_PATH);
  const stateDir = resolveInjectedPath(
    configuredRootDir ?? dirname(configuredConfigPath ?? join(homedir(), ".openclaw", "openclaw.json")),
    studioRootDir
  );
  const configPath = resolveInjectedPath(
    configuredConfigPath ?? join(stateDir, "openclaw.json"),
    studioRootDir
  );
  const configuredWorkspaceDir = readOptionalString(envSource.OPENCLAW_WORKSPACE_DIR);

  return {
    configPath,
    stateDir,
    workspaceDir: resolveInjectedPath(
      configuredWorkspaceDir ?? resolveWorkspaceDir(stateDir),
      studioRootDir
    )
  };
}

/**
 * Writes or updates the OpenClaw root `.env` file.
 *
 * @param envFilePath Absolute target `.env` path.
 * @param entries Key/value pairs to merge.
 */
export async function mergeOpenClawRootEnv(
  envFilePath: string,
  entries: ReadonlyArray<readonly [string, string]>
): Promise<void> {
  await mkdir(dirname(envFilePath), { recursive: true });
  const current = (await pathExists(envFilePath))
    ? await readFile(envFilePath, "utf8")
    : "";

  await writeFile(envFilePath, upsertEnvEntries(current, entries), "utf8");
}

/**
 * Upserts environment variables in an existing dotenv file while preserving other lines.
 *
 * @param content Current dotenv file content.
 * @param entries Key/value pairs to write.
 * @returns The updated dotenv file content.
 */
export function upsertEnvEntries(
  content: string,
  entries: ReadonlyArray<readonly [string, string]>
): string {
  const lines = content === "" ? [] : content.split(/\r?\n/);
  const pending = new Map(entries.map(([key, value]) => [key, value]));

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      return line;
    }

    const key = match[1];
    const nextValue = pending.get(key);

    if (nextValue === undefined) {
      return line;
    }

    pending.delete(key);
    return `${key}=${encodeEnvValue(nextValue)}`;
  });

  for (const [key, value] of pending.entries()) {
    nextLines.push(`${key}=${encodeEnvValue(value)}`);
  }

  return `${nextLines.join("\n").replace(/\n*$/, "\n")}`;
}

/**
 * Encodes one dotenv value.
 *
 * @param value Raw value.
 * @returns A dotenv-safe string representation.
 */
export function encodeEnvValue(value: string): string {
  return /[\s#"'`]/.test(value) ? JSON.stringify(value) : value;
}

/**
 * Collects initialization requirements that are currently missing.
 *
 * @param studioRootDir Repository root path.
 * @returns The missing requirement keys.
 */
export async function collectMissingRequirements(
  studioRootDir: string
): Promise<GuideInitializationRequirement[]> {
  const missing: GuideInitializationRequirement[] = [];
  const envFilePath = join(studioRootDir, ".env");
  const privateKeyPath = join(studioRootDir, "assets", "private.pem");
  const publicKeyPath = join(studioRootDir, "assets", "public.pem");

  if (!(await pathExists(envFilePath))) {
    return [
      "envFile",
      "gatewayProtocol",
      "gatewayHost",
      "gatewayPort",
      "gatewayToken",
      "workspaceDir",
      "privateKey",
      "publicKey"
    ];
  }

  const envValues = parseDotEnv(await readFile(envFilePath, "utf8"));

  if (readOptionalString(envValues.OPENCLAW_GATEWAY_PROTOCOL) === undefined) {
    missing.push("gatewayProtocol");
  }

  if (readOptionalString(envValues.OPENCLAW_GATEWAY_HOST) === undefined) {
    missing.push("gatewayHost");
  }

  if (readOptionalString(envValues.OPENCLAW_GATEWAY_PORT) === undefined) {
    missing.push("gatewayPort");
  }

  if (readOptionalString(envValues.OPENCLAW_GATEWAY_TOKEN) === undefined) {
    missing.push("gatewayToken");
  }

  if (readOptionalString(envValues.OPENCLAW_WORKSPACE_DIR) === undefined) {
    missing.push("workspaceDir");
  }

  if (!(await pathExists(privateKeyPath))) {
    missing.push("privateKey");
  }

  if (!(await pathExists(publicKeyPath))) {
    missing.push("publicKey");
  }

  return missing;
}

/**
 * Parses a dotenv file into a key/value object.
 *
 * @param content Raw dotenv content.
 * @returns Parsed dotenv entries.
 */
export function parseDotEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === "" || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = rawValue.split(/\s+#/, 1)[0]?.trim() ?? "";

    result[key] = stripWrappingQuotes(value);
  }

  return result;
}

/**
 * Removes one pair of matching wrapping quotes.
 *
 * @param value Raw value.
 * @returns Unquoted value when wrapped.
 */
export function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * Returns whether one filesystem path exists.
 *
 * @param targetPath Absolute or relative path.
 * @returns `true` when the path exists.
 */
export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}
