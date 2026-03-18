import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";

import { createOpenClawRouter, mapAgentsToDigitalHumans } from "./openclaw";

describe("createOpenClawRouter", () => {
  it("registers GET /api/dip-studio/v1/digital-human", () => {
    const router = createOpenClawRouter() as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              request: Request,
              response: Response,
              next: NextFunction
            ) => Promise<void>;
          }>;
        };
      }>;
    };
    const layer = router.stack.find(
      (entry) => entry.route?.path === "/api/dip-studio/v1/digital-human"
    );

    expect(layer).toBeDefined();
  });
});

describe("mapAgentsToDigitalHumans", () => {
  it("maps OpenClaw agents to the public digital human schema", () => {
    expect(
      mapAgentsToDigitalHumans({
        defaultId: "main",
        mainKey: "sender",
        scope: "per-sender",
        agents: [
          {
            id: "main",
            identity: {
              name: "Main Agent",
              avatarUrl: "https://example.com/main.png"
            }
          }
        ]
      })
    ).toEqual([
      {
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png"
      }
    ]);
  });
});
