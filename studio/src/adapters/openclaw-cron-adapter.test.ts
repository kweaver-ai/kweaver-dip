import { describe, expect, it, vi } from "vitest";

import {
  OpenClawCronGatewayAdapter,
  createCronListRequest,
  createCronRemoveRequest,
  createCronRunsRequest,
  createCronUpdateRequest
} from "./openclaw-cron-adapter";

describe("createCronListRequest", () => {
  it("builds the cron.list JSON RPC frame", () => {
    expect(
      createCronListRequest("req-1", {
        includeDisabled: true,
        limit: 50,
        offset: 0,
        enabled: "all",
        sortBy: "nextRunAtMs",
        sortDir: "asc"
      })
    ).toEqual({
      type: "req",
      id: "req-1",
      method: "cron.list",
      params: {
        includeDisabled: true,
        limit: 50,
        offset: 0,
        enabled: "all",
        sortBy: "nextRunAtMs",
        sortDir: "asc"
      }
    });
  });
});

describe("createCronRunsRequest", () => {
  it("builds the cron.runs JSON RPC frame", () => {
    expect(
      createCronRunsRequest("req-2", {
        id: "job-1",
        limit: 50,
        offset: 0,
        sortDir: "desc"
      })
    ).toEqual({
      type: "req",
      id: "req-2",
      method: "cron.runs",
      params: {
        id: "job-1",
        limit: 50,
        offset: 0,
        sortDir: "desc"
      }
    });
  });
});

describe("createCronUpdateRequest", () => {
  it("builds the cron.update JSON RPC frame", () => {
    expect(
      createCronUpdateRequest("req-3", {
        id: "job-1",
        patch: {
          name: "Updated Job"
        }
      })
    ).toEqual({
      type: "req",
      id: "req-3",
      method: "cron.update",
      params: {
        id: "job-1",
        patch: {
          name: "Updated Job"
        }
      }
    });
  });
});

describe("createCronRemoveRequest", () => {
  it("builds the cron.remove JSON RPC frame", () => {
    expect(
      createCronRemoveRequest("req-4", {
        id: "job-1"
      })
    ).toEqual({
      type: "req",
      id: "req-4",
      method: "cron.remove",
      params: {
        id: "job-1"
      }
    });
  });
});

describe("OpenClawCronGatewayAdapter", () => {
  it("delegates cron.list to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        jobs: [],
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
        nextOffset: null
      })
    };
    const adapter = new OpenClawCronGatewayAdapter(gatewayPort);

    await expect(
      adapter.listCronJobs({
        includeDisabled: true,
        limit: 50,
        offset: 0,
        enabled: "all",
        sortBy: "nextRunAtMs",
        sortDir: "asc"
      })
    ).resolves.toEqual({
      jobs: [],
      total: 0,
      offset: 0,
      limit: 50,
      hasMore: false,
      nextOffset: null
    });
  });

  it("delegates cron.runs to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        entries: [],
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
        nextOffset: null
      })
    };
    const adapter = new OpenClawCronGatewayAdapter(gatewayPort);

    await expect(
      adapter.listCronRuns({
        id: "job-1",
        limit: 50,
        offset: 0,
        sortDir: "desc"
      })
    ).resolves.toEqual({
      entries: [],
      total: 0,
      offset: 0,
      limit: 50,
      hasMore: false,
      nextOffset: null
    });
  });

  it("delegates cron.update to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        id: "job-1",
        agentId: "dh-1",
        sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
        name: "Updated Job",
        enabled: true,
        createdAtMs: 1,
        updatedAtMs: 2,
        schedule: {
          expr: "0 9 * * *",
          tz: "Asia/Shanghai"
        }
      })
    };
    const adapter = new OpenClawCronGatewayAdapter(gatewayPort);

    await expect(
      adapter.updateCronJob({
        id: "job-1",
        patch: {
          name: "Updated Job"
        }
      })
    ).resolves.toEqual({
      id: "job-1",
      agentId: "dh-1",
      sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
      name: "Updated Job",
      enabled: true,
      createdAtMs: 1,
      updatedAtMs: 2,
      schedule: {
        expr: "0 9 * * *",
        tz: "Asia/Shanghai"
      }
    });
  });

  it("delegates cron.remove to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        removed: true,
        id: "job-1"
      })
    };
    const adapter = new OpenClawCronGatewayAdapter(gatewayPort);

    await expect(
      adapter.removeCronJob({
        id: "job-1"
      })
    ).resolves.toEqual({
      removed: true,
      id: "job-1"
    });
  });
});
