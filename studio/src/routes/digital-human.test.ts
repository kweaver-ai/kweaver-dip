import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";

import { createDigitalHumanRouter } from "./digital-human";

describe("createDigitalHumanRouter", () => {
  it("registers GET /api/dip-studio/v1/digital-human", () => {
    const router = createDigitalHumanRouter() as {
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
