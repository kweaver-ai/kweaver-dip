import { describe, expect, it, vi } from "vitest";

import {
  OpenClawAgentsGatewayAdapter,
  createAgentsListRequest
} from "./openclaw-agents-adapter";

describe("createAgentsListRequest", () => {
  it("builds the agents.list JSON RPC frame", () => {
    expect(createAgentsListRequest("req-2")).toEqual({
      type: "req",
      id: "req-2",
      method: "agents.list",
      params: {}
    });
  });
});

describe("OpenClawAgentsGatewayAdapter", () => {
  it("delegates agents.list to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
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
    const adapter = new OpenClawAgentsGatewayAdapter(gatewayPort);

    await expect(adapter.listAgents()).resolves.toEqual({
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
    });
    expect(gatewayPort.invoke).toHaveBeenCalledOnce();
  });
});
