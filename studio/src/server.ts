import { createApp } from "./app";
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

startServer(env.port);
