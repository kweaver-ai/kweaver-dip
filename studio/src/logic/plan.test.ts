import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it, vi } from "vitest";

import { DefaultCronLogic } from "./plan";

describe("DefaultCronLogic", () => {
  it("delegates listCronJobs to the adapter", async () => {
    const logic = new DefaultCronLogic({
      listCronJobs: vi.fn().mockResolvedValue({
        jobs: [],
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
        nextOffset: null
      }),
      updateCronJob: vi.fn(),
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn()
    }, "workspace");

    await expect(
      logic.listCronJobs({
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
    }, "workspace");
  });

  it("filters cron jobs by session user id", async () => {
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [
        {
          id: "job-1",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
          name: "Job 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        },
        {
          id: "job-2",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-2:direct:chat-2",
          name: "Job 2",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 10 * * *",
            tz: "Asia/Shanghai"
          }
        },
        {
          id: "job-3",
          agentId: "dh-2",
          sessionKey: "invalid-session-key",
          name: "Job 3",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 11 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 3,
      offset: 0,
      limit: 50,
      hasMore: false,
      nextOffset: null
    }, "workspace");
    const logic = new DefaultCronLogic({
      listCronJobs,
      updateCronJob: vi.fn(),
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn()
    }, "workspace");

    await expect(
      logic.listCronJobs({
        includeDisabled: true,
        limit: 50,
        offset: 0,
        enabled: "all",
        sortBy: "nextRunAtMs",
        sortDir: "asc",
        userId: "user-1"
      })
    ).resolves.toEqual({
      jobs: [
        {
          id: "job-1",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
          name: "Job 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 1,
      hasMore: false,
      nextOffset: null
    });
    expect(listCronJobs).toHaveBeenCalledWith({
      includeDisabled: true,
      limit: 50,
      offset: 0,
      enabled: "all",
      sortBy: "nextRunAtMs",
      sortDir: "asc"
    });
  });

  it("reads a user-owned cron job", async () => {
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [
        {
          id: "job-1",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
          name: "Job 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null
    });
    const logic = new DefaultCronLogic({
      listCronJobs,
      updateCronJob: vi.fn(),
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn()
    }, "workspace");

    await expect(
      logic.getCronJob({
        id: "job-1",
        userId: "user-1"
      })
    ).resolves.toEqual({
      id: "job-1",
      agentId: "dh-1",
      sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
      name: "Job 1",
      enabled: true,
      createdAtMs: 1,
      updatedAtMs: 2,
      schedule: {
        expr: "0 9 * * *",
        tz: "Asia/Shanghai"
      }
    });
  });

  it("delegates listCronRuns to the adapter", async () => {
    const logic = new DefaultCronLogic({
      listCronJobs: vi.fn(),
      updateCronJob: vi.fn(),
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn().mockResolvedValue({
        entries: [],
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
        nextOffset: null
      })
    }, "workspace");

    await expect(
      logic.listCronRuns({
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

  it("updates a user-owned cron job", async () => {
    const listCronJobs = vi
      .fn()
      .mockResolvedValueOnce({
        jobs: [
          {
            id: "job-1",
            agentId: "dh-1",
            sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
            name: "Job 1",
            enabled: true,
            createdAtMs: 1,
            updatedAtMs: 2,
            schedule: {
              expr: "0 9 * * *",
              tz: "Asia/Shanghai"
            }
          }
        ],
        total: 1,
        offset: 0,
        limit: 200,
        hasMore: false,
        nextOffset: null
      });
    const updateCronJob = vi.fn().mockResolvedValue({
      id: "job-1",
      agentId: "dh-1",
      sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
      name: "Updated Job",
      enabled: true,
      createdAtMs: 1,
      updatedAtMs: 3,
      schedule: {
        expr: "0 10 * * *",
        tz: "Asia/Shanghai"
      }
    });
    const logic = new DefaultCronLogic({
      listCronJobs,
      updateCronJob,
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn()
    });

    await expect(
      logic.updateCronJob({
        id: "job-1",
        userId: "user-1",
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
      updatedAtMs: 3,
      schedule: {
        expr: "0 10 * * *",
        tz: "Asia/Shanghai"
      }
    });

    expect(listCronJobs).toHaveBeenCalledWith({
      includeDisabled: true,
      limit: 200,
      offset: 0,
      enabled: "all",
      sortBy: "updatedAtMs",
      sortDir: "desc"
    });
    expect(updateCronJob).toHaveBeenCalledWith({
      id: "job-1",
      patch: {
        name: "Updated Job"
      }
    });
  });

  it("updates enabled flag for a user-owned cron job", async () => {
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [
        {
          id: "job-1",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
          name: "Job 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null
    });
    const updateCronJob = vi.fn().mockResolvedValue({
      id: "job-1",
      agentId: "dh-1",
      sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
      name: "Job 1",
      enabled: false,
      createdAtMs: 1,
      updatedAtMs: 3,
      schedule: {
        expr: "0 9 * * *",
        tz: "Asia/Shanghai"
      }
    });
    const logic = new DefaultCronLogic({
      listCronJobs,
      updateCronJob,
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn()
    });

    await expect(
      logic.updateCronJob({
        id: "job-1",
        userId: "user-1",
        patch: {
          enabled: false
        }
      })
    ).resolves.toMatchObject({
      id: "job-1",
      enabled: false
    });

    expect(updateCronJob).toHaveBeenCalledWith({
      id: "job-1",
      patch: {
        enabled: false
      }
    });
  });

  it("deletes a user-owned cron job", async () => {
    const listCronJobs = vi
      .fn()
      .mockResolvedValueOnce({
        jobs: [],
        total: 2,
        offset: 0,
        limit: 200,
        hasMore: true,
        nextOffset: 200
      })
      .mockResolvedValueOnce({
        jobs: [
          {
            id: "job-2",
            agentId: "dh-1",
            sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
            name: "Job 2",
            enabled: true,
            createdAtMs: 1,
            updatedAtMs: 2,
            schedule: {
              expr: "0 9 * * *",
              tz: "Asia/Shanghai"
            }
          }
        ],
        total: 2,
        offset: 200,
        limit: 200,
        hasMore: false,
        nextOffset: null
      });
    const removeCronJob = vi.fn().mockResolvedValue({
      removed: true,
      id: "job-2"
    });
    const logic = new DefaultCronLogic({
      listCronJobs,
      updateCronJob: vi.fn(),
      removeCronJob,
      listCronRuns: vi.fn()
    });

    await expect(
      logic.deleteCronJob({
        id: "job-2",
        userId: "user-1"
      })
    ).resolves.toEqual({
      removed: true,
      id: "job-2"
    });

    expect(removeCronJob).toHaveBeenCalledWith({
      id: "job-2"
    });
  });

  it("reads PLAN.md content for a user-owned job", async () => {
    const workspaceDir = await mkdtemp(join(tmpdir(), "dip-studio-plan-test-"));
    const planDir = join(workspaceDir, "dh-1", "archives", "chat-1");
    const planPath = join(planDir, "PLAN.md");
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [
        {
          id: "job-1",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-1:direct:chat-1",
          name: "Job 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null
    });
    await mkdir(planDir, { recursive: true });
    await writeFile(planPath, "# PLAN\nhello", "utf8");
    try {
      const logic = new DefaultCronLogic({
        listCronJobs,
        updateCronJob: vi.fn(),
        removeCronJob: vi.fn(),
        listCronRuns: vi.fn()
      }, workspaceDir);

      await expect(
        logic.getPlanContent({
          id: "job-1",
          userId: "user-1"
        })
      ).resolves.toEqual({
        content: "# PLAN\nhello"
      });
    } finally {
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });

  it("rejects plan mutation when the user does not own the job", async () => {
    const listCronJobs = vi.fn().mockResolvedValue({
      jobs: [
        {
          id: "job-1",
          agentId: "dh-1",
          sessionKey: "agent:dh-1:user:user-2:direct:chat-1",
          name: "Job 1",
          enabled: true,
          createdAtMs: 1,
          updatedAtMs: 2,
          schedule: {
            expr: "0 9 * * *",
            tz: "Asia/Shanghai"
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null
    });
    const logic = new DefaultCronLogic({
      listCronJobs,
      updateCronJob: vi.fn(),
      removeCronJob: vi.fn(),
      listCronRuns: vi.fn()
    });

    await expect(
      logic.deleteCronJob({
        id: "job-1",
        userId: "user-1"
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Plan not found"
    });
  });
});
