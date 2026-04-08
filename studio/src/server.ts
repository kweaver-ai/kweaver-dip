import { createApp } from "./app";
import { connectOpenClawGatewayIfInitialized } from "./logic/openclaw-gateway-bootstrap";
import { getEnv } from "./utils/env";

const env = getEnv();
const app = createApp();

/**
 * Starts the HTTP server.
 *
 * @param port The TCP port to bind.
 * @returns The created Node.js HTTP server.
 */
export function startServer(port: number) {
  return app.listen(port, () => {
    console.log(`DIP Studio backend listening on port ${port}`);
  });
}

/**
 * Bootstraps the gateway connection when Studio is already initialized, then
 * starts the HTTP server.
 *
 * @returns The created Node.js HTTP server.
 */
export async function bootstrapServer() {
  await connectOpenClawGatewayIfInitialized();

  return startServer(env.port);
}

void bootstrapServer();
