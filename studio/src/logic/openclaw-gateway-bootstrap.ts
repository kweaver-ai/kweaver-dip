import { collectMissingRequirements } from "./guide";
import { OpenClawGatewayClient } from "../infra/openclaw-gateway-client";
import { getEnv } from "../utils/env";

/**
 * Minimal gateway connector contract used by bootstrap flows.
 */
export interface OpenClawGatewayConnector {
  /**
   * Reconfigures the target gateway endpoint.
   *
   * @param url Gateway WebSocket URL.
   * @param token Optional gateway bearer token.
   */
  reconfigureConnection(url: string, token?: string): void;

  /**
   * Establishes the gateway WebSocket connection.
   *
   * @returns Nothing once connected.
   */
  connect(): Promise<void>;
}

/**
 * Options used by gateway bootstrap helpers.
 */
export interface OpenClawGatewayBootstrapOptions {
  /**
   * Studio root used to inspect initialization files.
   */
  studioRootDir?: string;

  /**
   * Optional connector override used by tests.
   */
  connector?: OpenClawGatewayConnector;

  /**
   * Optional environment reader used by tests.
   */
  envReader?: typeof getEnv;
}

/**
 * Connects to the configured OpenClaw Gateway only when Studio is initialized.
 *
 * @param options Optional studio root, connector, and env reader overrides.
 * @returns `true` when a connection attempt was performed, otherwise `false`.
 */
export async function connectOpenClawGatewayIfInitialized(
  options: OpenClawGatewayBootstrapOptions = {}
): Promise<boolean> {
  const studioRootDir = options.studioRootDir ?? process.cwd();
  const missing = await collectMissingRequirements(studioRootDir);

  if (missing.length > 0) {
    return false;
  }

  const envReader = options.envReader ?? getEnv;
  const env = envReader();

  await connectOpenClawGateway({
    url: env.openClawGatewayUrl,
    token: env.openClawGatewayToken,
    timeoutMs: env.openClawGatewayTimeoutMs,
    connector: options.connector
  });

  return true;
}

/**
 * Connects to one OpenClaw Gateway endpoint immediately.
 *
 * @param options Target gateway connection settings.
 * @returns Nothing once connected.
 */
export async function connectOpenClawGateway(options: {
  url: string;
  token?: string;
  timeoutMs?: number;
  connector?: OpenClawGatewayConnector;
}): Promise<void> {
  const connector =
    options.connector ??
    OpenClawGatewayClient.getInstance({
      url: options.url,
      token: options.token,
      timeoutMs: options.timeoutMs
    });

  connector.reconfigureConnection(options.url, options.token);
  await connector.connect();
}
