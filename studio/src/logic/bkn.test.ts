import { describe, expect, it, vi } from "vitest";

import { DefaultBknLogic } from "./bkn";

describe("DefaultBknLogic", () => {
  it("creates a fresh client for each list request", async () => {
    const listKnowledgeNetworks = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      body: "{}"
    });
    const createClient = vi.fn().mockReturnValue({
      listKnowledgeNetworks,
      getKnowledgeNetwork: vi.fn()
    });
    const getEnv = vi.fn().mockReturnValue({
      bknBackendUrl: "https://kweaver.example.com",
      appUserToken: "token-1",
      openClawGatewayTimeoutMs: 5000
    });
    const logic = new DefaultBknLogic({
      getEnv: getEnv as never,
      createClient
    });

    await logic.listKnowledgeNetworks({ limit: "10" }, "bd_a");
    await logic.listKnowledgeNetworks({ limit: "20" }, "bd_b");

    expect(getEnv).toHaveBeenCalledTimes(2);
    expect(createClient).toHaveBeenCalledTimes(2);
    expect(createClient).toHaveBeenNthCalledWith(1, {
      baseUrl: "https://kweaver.example.com",
      token: "token-1",
      timeoutMs: 5000
    });
    expect(createClient).toHaveBeenNthCalledWith(2, {
      baseUrl: "https://kweaver.example.com",
      token: "token-1",
      timeoutMs: 5000
    });
    expect(listKnowledgeNetworks).toHaveBeenNthCalledWith(1, { limit: "10" }, "bd_a");
    expect(listKnowledgeNetworks).toHaveBeenNthCalledWith(2, { limit: "20" }, "bd_b");
  });

  it("creates a fresh client for detail requests", async () => {
    const getKnowledgeNetwork = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      body: "{\"id\":\"kn-1\"}"
    });
    const createClient = vi.fn().mockReturnValue({
      listKnowledgeNetworks: vi.fn(),
      getKnowledgeNetwork
    });
    const logic = new DefaultBknLogic({
      getEnv: (() => ({
        bknBackendUrl: "https://kweaver.example.com",
        appUserToken: "token-1",
        openClawGatewayTimeoutMs: 5000
      })) as never,
      createClient
    });

    await logic.getKnowledgeNetwork("kn-1", { include_statistics: "true" }, "bd_public");

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(getKnowledgeNetwork).toHaveBeenCalledWith(
      "kn-1",
      { include_statistics: "true" },
      "bd_public"
    );
  });
});
