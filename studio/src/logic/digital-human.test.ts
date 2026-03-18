import { describe, expect, it, vi } from "vitest";

import {
  DefaultDigitalHumanLogic,
  mapAgentsToDigitalHumans
} from "./digital-human";

describe("DefaultDigitalHumanLogic", () => {
  it("fetches agents from the adapter and maps them to digital humans", async () => {
    const openClawAgentsAdapter = {
      listAgents: vi.fn().mockResolvedValue({
        defaultId: "main",
        mainKey: "sender",
        scope: "per-sender",
        agents: [
          {
            id: "main",
            name: "Main Agent",
            identity: {
              avatarUrl: "https://example.com/main.png"
            }
          }
        ]
      })
    };
    const logic = new DefaultDigitalHumanLogic(openClawAgentsAdapter);

    await expect(logic.listDigitalHumans()).resolves.toEqual([
      {
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png"
      }
    ]);
    expect(openClawAgentsAdapter.listAgents).toHaveBeenCalledOnce();
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
