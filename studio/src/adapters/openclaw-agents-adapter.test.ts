import { describe, expect, it, vi } from "vitest";

import {
  createAgentsAddRequest,
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

describe("createAgentsAddRequest", () => {
  it("builds the agents.create JSON RPC frame", () => {
    expect(
      createAgentsAddRequest("req-4", {
        name: "Main Agent",
        workspace: "main",
        bind: ["telegram:default"]
      })
    ).toEqual({
      type: "req",
      id: "req-4",
      method: "agents.create",
      params: {
        name: "Main Agent",
        workspace: "main",
        bind: ["telegram:default"]
      }
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

  it("delegates agents.create to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue(undefined)
    };
    const adapter = new OpenClawAgentsGatewayAdapter(gatewayPort);

    await expect(
      adapter.addAgent({
        name: "Main Agent",
        workspace: "main",
        bind: ["telegram:default"]
      })
    ).resolves.toBeUndefined();

    expect(gatewayPort.invoke).toHaveBeenNthCalledWith(
      1,
      createAgentsAddRequest("agents.create", {
        name: "Main Agent",
        workspace: "main",
        bind: ["telegram:default"]
      })
    );
  });
});
