import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "../errors/http-error";

import type { AgentSkillsLogic } from "./agent-skills";

/**
 * Mutable fake home for `node:os` `homedir` (see hoisted mock below).
 */
let fakeHomeForOsMock = "/tmp";

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    homedir: (): string => fakeHomeForOsMock
  };
});

import {
  DefaultDigitalHumanLogic,
  resolveDefaultWorkspace
} from "./digital-human";

function stubAgentSkills(overrides?: Partial<AgentSkillsLogic>): AgentSkillsLogic {
  return {
    listEnabledSkills: vi.fn(),
    listDigitalHumanSkills: vi.fn(),
    listAvailableSkills: vi.fn(),
    getAgentSkills: vi.fn().mockResolvedValue({ agentId: "", skills: [] }),
    updateAgentSkills: vi.fn().mockResolvedValue({
      success: true,
      agentId: "",
      skills: []
    }),
    ...overrides
  } as AgentSkillsLogic;
}

describe("DefaultDigitalHumanLogic", () => {
  it("fetches agents and enriches list with IDENTITY.md creature", async () => {
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
      }),
      getAgentFile: vi.fn().mockResolvedValue({
        file: {
          content: "# IDENTITY.md\n\n- Name: From File\n- Creature: Engineer\n"
        }
      })
    };
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: openClawAgentsAdapter as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await expect(logic.listDigitalHumans()).resolves.toEqual([
      {
        id: "main",
        name: "From File",
        creature: "Engineer"
      }
    ]);
    expect(openClawAgentsAdapter.listAgents).toHaveBeenCalledOnce();
    expect(openClawAgentsAdapter.getAgentFile).toHaveBeenCalledWith({
      agentId: "main",
      name: "IDENTITY.md"
    });
  });

  it("list falls back when IDENTITY fetch fails", async () => {
    const openClawAgentsAdapter = {
      listAgents: vi.fn().mockResolvedValue({
        defaultId: "main",
        mainKey: "sender",
        scope: "per-sender",
        agents: [
          {
            id: "a1",
            name: "Listed Name"
          }
        ]
      }),
      getAgentFile: vi.fn().mockRejectedValue(new Error("network"))
    };
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: openClawAgentsAdapter as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await expect(logic.listDigitalHumans()).resolves.toEqual([
      {
        id: "a1",
        name: "Listed Name",
        creature: undefined
      }
    ]);
  });

});

describe("resolveDefaultWorkspace", () => {
  it("places workspace under ~/.openclaw/<uuid>", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(resolveDefaultWorkspace(id)).toBe(join(fakeHomeForOsMock, ".openclaw", id));
  });
});


describe("DefaultDigitalHumanLogic lifecycle (filesystem + adapter)", () => {
  let fakeHome: string;

  beforeEach(() => {
    fakeHome = mkdtempSync(join(tmpdir(), "dip-dh-"));
    fakeHomeForOsMock = fakeHome;
  });

  afterEach(() => {
    fakeHomeForOsMock = "/tmp";
    try {
      rmSync(fakeHome, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("getDigitalHuman reads template fields and skills", async () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(
      join(ws, "IDENTITY.md"),
      "- Name: Alice\n- Creature: QA\n",
      "utf8"
    );
    writeFileSync(join(ws, "SOUL.md"), "Soul text\n", "utf8");

    const adapter = {
      listAgents: vi.fn(),
      createAgent: vi.fn(),
      deleteAgent: vi.fn(),
      getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
        file: { content: readFileSync(join(ws, name), "utf8") }
      })),
      setAgentFile: vi.fn(),
      getConfig: vi.fn(),
      patchConfig: vi.fn()
    };

    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: adapter as never,
      agentSkillsLogic: stubAgentSkills({
        getAgentSkills: vi.fn().mockResolvedValue({ agentId: id, skills: ["s1"] })
      })
    });

    await expect(logic.getDigitalHuman(id)).resolves.toMatchObject({
      id,
      name: "Alice",
      creature: "QA",
      soul: "Soul text\n",
      skills: ["s1"]
    });
  });

  it("getDigitalHuman includes channel when OpenClaw config binds feishu", async () => {
    const id = "b1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(
      join(ws, "IDENTITY.md"),
      "- Name: Alice\n- Creature: QA\n",
      "utf8"
    );
    writeFileSync(join(ws, "SOUL.md"), "Soul text\n", "utf8");

    const configPath = join(fakeHome, "openclaw.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        bindings: [{ agentId: id, match: { channel: "feishu" } }],
        channels: {
          feishu: {
            enabled: true,
            appId: "app-1",
            appSecret: "secret-1"
          }
        }
      }),
      "utf8"
    );
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    try {
      const adapter = {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
          file: { content: readFileSync(join(ws, name), "utf8") }
        })),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      };

      const logic = new DefaultDigitalHumanLogic({
        openClawAgentsAdapter: adapter as never,
        agentSkillsLogic: stubAgentSkills()
      });

      await expect(logic.getDigitalHuman(id)).resolves.toMatchObject({
        id,
        channel: { type: "feishu", appId: "app-1", appSecret: "secret-1" }
      });
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prev;
      }
    }
  });

  it("getDigitalHuman omits channel when config JSON is invalid", async () => {
    const id = "c1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(join(ws, "IDENTITY.md"), "- Name: A\n", "utf8");
    writeFileSync(join(ws, "SOUL.md"), "x\n", "utf8");

    const configPath = join(fakeHome, "bad.json");
    writeFileSync(configPath, "{ not json", "utf8");
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    try {
      const adapter = {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
          file: { content: readFileSync(join(ws, name), "utf8") }
        })),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      };
      const logic = new DefaultDigitalHumanLogic({
        openClawAgentsAdapter: adapter as never,
        agentSkillsLogic: stubAgentSkills()
      });
      const detail = await logic.getDigitalHuman(id);
      expect(detail.channel).toBeUndefined();
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prev;
      }
    }
  });

  it("getDigitalHuman omits channel when binding channel key is unsupported", async () => {
    const id = "a0b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(join(ws, "IDENTITY.md"), "- Name: A\n", "utf8");
    writeFileSync(join(ws, "SOUL.md"), "x\n", "utf8");

    const configPath = join(fakeHome, "oc-unknown-ch.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        bindings: [{ agentId: id, match: { channel: "slack" } }],
        channels: { slack: { appId: "a", appSecret: "b" } }
      }),
      "utf8"
    );
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    try {
      const adapter = {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
          file: { content: readFileSync(join(ws, name), "utf8") }
        })),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      };
      const logic = new DefaultDigitalHumanLogic({
        openClawAgentsAdapter: adapter as never,
        agentSkillsLogic: stubAgentSkills()
      });
      const detail = await logic.getDigitalHuman(id);
      expect(detail.channel).toBeUndefined();
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prev;
      }
    }
  });

  it("getDigitalHuman omits channel when binding is for another agent", async () => {
    const id = "d1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(join(ws, "IDENTITY.md"), "- Name: A\n", "utf8");
    writeFileSync(join(ws, "SOUL.md"), "x\n", "utf8");

    const configPath = join(fakeHome, "oc2.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        bindings: [{ agentId: "other-id", match: { channel: "feishu" } }],
        channels: { feishu: { appId: "a", appSecret: "b" } }
      }),
      "utf8"
    );
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    try {
      const adapter = {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
          file: { content: readFileSync(join(ws, name), "utf8") }
        })),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      };
      const logic = new DefaultDigitalHumanLogic({
        openClawAgentsAdapter: adapter as never,
        agentSkillsLogic: stubAgentSkills()
      });
      const detail = await logic.getDigitalHuman(id);
      expect(detail.channel).toBeUndefined();
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prev;
      }
    }
  });

  it("getDigitalHuman omits channel when feishu credentials are incomplete", async () => {
    const id = "e1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(join(ws, "IDENTITY.md"), "- Name: A\n", "utf8");
    writeFileSync(join(ws, "SOUL.md"), "x\n", "utf8");

    const configPath = join(fakeHome, "oc3.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        bindings: [{ agentId: id, match: { channel: "feishu" } }],
        channels: { feishu: { appId: "", appSecret: "only-secret" } }
      }),
      "utf8"
    );
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    try {
      const adapter = {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
          file: { content: readFileSync(join(ws, name), "utf8") }
        })),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      };
      const logic = new DefaultDigitalHumanLogic({
        openClawAgentsAdapter: adapter as never,
        agentSkillsLogic: stubAgentSkills()
      });
      const detail = await logic.getDigitalHuman(id);
      expect(detail.channel).toBeUndefined();
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prev;
      }
    }
  });

  it("getDigitalHuman maps unknown agent errors to 404", async () => {
    const adapter = {
      listAgents: vi.fn(),
      createAgent: vi.fn(),
      deleteAgent: vi.fn(),
      getAgentFile: vi.fn().mockRejectedValue(new Error("unknown agent id")),
      setAgentFile: vi.fn(),
      getConfig: vi.fn(),
      patchConfig: vi.fn()
    };
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: adapter as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await expect(logic.getDigitalHuman("missing")).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it("getDigitalHuman rethrows HttpError unchanged", async () => {
    const forbidden = new HttpError(403, "forbidden");
    const adapter = {
      listAgents: vi.fn(),
      createAgent: vi.fn(),
      deleteAgent: vi.fn(),
      getAgentFile: vi.fn().mockRejectedValue(forbidden),
      setAgentFile: vi.fn(),
      getConfig: vi.fn(),
      patchConfig: vi.fn()
    };
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: adapter as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await expect(logic.getDigitalHuman("x")).rejects.toBe(forbidden);
  });

  it("deleteDigitalHuman delegates to deleteAgent", async () => {
    const deleteAgent = vi.fn().mockResolvedValue({ ok: true });
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent,
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      } as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await logic.deleteDigitalHuman("agent-1", false);

    expect(deleteAgent).toHaveBeenCalledWith({
      agentId: "agent-1",
      deleteFiles: false
    });
  });

  it("createDigitalHuman writes markdown via gateway RPC and configures skills", async () => {
    const listAgentFiles = vi.fn().mockResolvedValue({
      agentId: "",
      files: [] as { name: string }[]
    });
    const setAgentFile = vi.fn().mockResolvedValue({ ok: true });
    const updateAgentSkills = vi.fn().mockResolvedValue({
      success: true,
      agentId: "",
      skills: ["sk1"]
    });
    const createAgent = vi.fn().mockResolvedValue({ ok: true });
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: {
        listAgents: vi.fn(),
        createAgent,
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile,
        listAgentFiles,
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      } as never,
      agentSkillsLogic: stubAgentSkills({ updateAgentSkills })
    });

    const result = await logic.createDigitalHuman({
      name: "Bob",
      creature: "Dev",
      soul: "Hi",
      skills: ["sk1"]
    });

    const ws = resolveDefaultWorkspace(result.id);
    expect(createAgent).toHaveBeenCalledWith({
      name: result.id,
      workspace: ws
    });
    expect(listAgentFiles).toHaveBeenCalledWith({ agentId: result.id });
    expect(setAgentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: result.id,
        name: "IDENTITY.md",
        content: expect.stringContaining("Bob") as string
      })
    );
    expect(setAgentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: result.id,
        name: "SOUL.md",
        content: expect.stringContaining("Hi") as string
      })
    );
    expect(updateAgentSkills).toHaveBeenCalledWith(result.id, ["sk1"]);
  });

  it("updateDigitalHuman merges patch and writes files via gateway RPC", async () => {
    const id = "f1e2d3c4-b5a6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(
      join(ws, "IDENTITY.md"),
      "- Name: Old\n- Creature: X\n",
      "utf8"
    );
    writeFileSync(join(ws, "SOUL.md"), "Old soul\n", "utf8");

    const listAgentFiles = vi.fn().mockResolvedValue({ agentId: id, files: [] });
    const setAgentFile = vi.fn().mockResolvedValue({ ok: true });
    const adapter = {
      listAgents: vi.fn(),
      createAgent: vi.fn(),
      deleteAgent: vi.fn(),
      getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
        file: { content: readFileSync(join(ws, name), "utf8") }
      })),
      setAgentFile,
      listAgentFiles,
      getConfig: vi.fn(),
      patchConfig: vi.fn()
    };

    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: adapter as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await logic.updateDigitalHuman(id, { name: "New", soul: "New soul" });

    expect(listAgentFiles).toHaveBeenCalledWith({ agentId: id });
    expect(setAgentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: id,
        name: "IDENTITY.md",
        content: expect.stringContaining("New") as string
      })
    );
    expect(setAgentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: id,
        name: "SOUL.md",
        content: expect.stringContaining("New soul") as string
      })
    );
  });

  it("createDigitalHuman binds channel when config path is writable", async () => {
    const cfg = join(fakeHome, "openclaw.json");
    writeFileSync(cfg, "{}\n", "utf8");
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    const prevState = process.env.OPENCLAW_STATE_DIR;
    delete process.env.OPENCLAW_STATE_DIR;
    process.env.OPENCLAW_CONFIG_PATH = cfg;

    const createAgent = vi.fn().mockResolvedValue({ ok: true });
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: {
        listAgents: vi.fn(),
        createAgent,
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn().mockResolvedValue({ ok: true }),
        listAgentFiles: vi.fn().mockResolvedValue({ agentId: "", files: [] }),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      } as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await logic.createDigitalHuman({
      name: "C",
      channel: { appId: "a", appSecret: "b" }
    });

    const parsed = JSON.parse(readFileSync(cfg, "utf8")) as {
      channels: { feishu: { appId: string } };
    };
    expect(parsed.channels.feishu.appId).toBe("a");

    process.env.OPENCLAW_CONFIG_PATH = prev;
    process.env.OPENCLAW_STATE_DIR = prevState;
  });

  it("createDigitalHuman writes channel to OPENCLAW_STATE_DIR when config path unset", async () => {
    const stateDir = join(fakeHome, "state");
    mkdirSync(stateDir, { recursive: true });
    const prevCfg = process.env.OPENCLAW_CONFIG_PATH;
    const prevState = process.env.OPENCLAW_STATE_DIR;
    delete process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_STATE_DIR = stateDir;

    const createAgent = vi.fn().mockResolvedValue({ ok: true });
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: {
        listAgents: vi.fn(),
        createAgent,
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn().mockResolvedValue({ ok: true }),
        listAgentFiles: vi.fn().mockResolvedValue({ agentId: "", files: [] }),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      } as never,
      agentSkillsLogic: stubAgentSkills()
    });

    await logic.createDigitalHuman({
      name: "D",
      channel: { appId: "x", appSecret: "y" }
    });

    const cfgPath = join(stateDir, "openclaw.json");
    const parsed = JSON.parse(readFileSync(cfgPath, "utf8")) as {
      channels: { feishu: { appId: string } };
    };
    expect(parsed.channels.feishu.appId).toBe("x");

    process.env.OPENCLAW_CONFIG_PATH = prevCfg;
    process.env.OPENCLAW_STATE_DIR = prevState;
  });

  it("getDigitalHuman includes channel when OpenClaw config binds dingtalk", async () => {
    const id = "f1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const ws = resolveDefaultWorkspace(id);
    mkdirSync(ws, { recursive: true });
    writeFileSync(
      join(ws, "IDENTITY.md"),
      "- Name: Alice\n- Creature: QA\n",
      "utf8"
    );
    writeFileSync(join(ws, "SOUL.md"), "Soul text\n", "utf8");

    const configPath = join(fakeHome, "oc-ding.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        bindings: [{ agentId: id, match: { channel: "dingtalk" } }],
        channels: {
          dingtalk: {
            enabled: true,
            appId: "dt-1",
            appSecret: "dt-sec"
          }
        }
      }),
      "utf8"
    );
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    try {
      const adapter = {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn().mockImplementation(async ({ name }: { name: string }) => ({
          file: { content: readFileSync(join(ws, name), "utf8") }
        })),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      };

      const logic = new DefaultDigitalHumanLogic({
        openClawAgentsAdapter: adapter as never,
        agentSkillsLogic: stubAgentSkills()
      });

      await expect(logic.getDigitalHuman(id)).resolves.toMatchObject({
        id,
        channel: { type: "dingtalk", appId: "dt-1", appSecret: "dt-sec" }
      });
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CONFIG_PATH;
      } else {
        process.env.OPENCLAW_CONFIG_PATH = prev;
      }
    }
  });

  it("createDigitalHuman binds dingtalk channel when type is dingtalk", async () => {
    const cfg = join(fakeHome, "openclaw-ding.json");
    writeFileSync(cfg, "{}\n", "utf8");
    const prev = process.env.OPENCLAW_CONFIG_PATH;
    const prevState = process.env.OPENCLAW_STATE_DIR;
    delete process.env.OPENCLAW_STATE_DIR;
    process.env.OPENCLAW_CONFIG_PATH = cfg;

    const createAgent = vi.fn().mockResolvedValue({ ok: true });
    const logic = new DefaultDigitalHumanLogic({
      openClawAgentsAdapter: {
        listAgents: vi.fn(),
        createAgent,
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn().mockResolvedValue({ ok: true }),
        listAgentFiles: vi.fn().mockResolvedValue({ agentId: "", files: [] }),
        getConfig: vi.fn(),
        patchConfig: vi.fn()
      } as never,
      agentSkillsLogic: stubAgentSkills()
    });

    const result = await logic.createDigitalHuman({
      name: "E",
      channel: { type: "dingtalk", appId: "dta", appSecret: "dts" }
    });

    const parsed = JSON.parse(readFileSync(cfg, "utf8")) as {
      bindings: Array<{ agentId: string; match: { channel: string } }>;
      channels: { dingtalk: { appId: string } };
    };
    expect(parsed.channels.dingtalk.appId).toBe("dta");
    expect(parsed.bindings.some((b) => b.match.channel === "dingtalk")).toBe(true);
    expect(result.channel).toEqual({
      type: "dingtalk",
      appId: "dta",
      appSecret: "dts"
    });

    process.env.OPENCLAW_CONFIG_PATH = prev;
    process.env.OPENCLAW_STATE_DIR = prevState;
  });
});
