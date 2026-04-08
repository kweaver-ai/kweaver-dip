import { describe, expect, it, vi } from "vitest";

import {
  DefaultAgentSkillsLogic,
  filterAgentSkillEntries,
  getSkillEntryDescription,
  getSkillEntryName,
  mapAvailableSkillEntries
} from "./agent-skills";

describe("DefaultAgentSkillsLogic", () => {
  it("listEnabledSkills returns only globally enabled skills", async () => {
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills: vi.fn(),
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses: vi.fn().mockResolvedValue([
          { skillKey: "planner", description: "plan tasks", enabled: true },
          { skillKey: "writer", enabled: false },
          { skillKey: "coder", description: "write code", enabled: true }
        ])
      } as never
    );

    await expect(logic.listEnabledSkills()).resolves.toEqual([
      { name: "planner", description: "plan tasks", built_in: false, type: "unknown" },
      { name: "coder", description: "write code", built_in: false, type: "unknown" }
    ]);
  });

  it("listEnabledSkills sets built_in true for default digital-human slugs", async () => {
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills: vi.fn(),
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses: vi.fn().mockResolvedValue([
          { skillKey: "archive-protocol", description: "arch", enabled: true },
          { skillKey: "planner", description: "plan", enabled: true }
        ])
      } as never
    );

    await expect(logic.listEnabledSkills()).resolves.toEqual([
      { name: "archive-protocol", description: "arch", built_in: true, type: "unknown" },
      { name: "planner", description: "plan", built_in: false, type: "unknown" }
    ]);
  });

  it("listEnabledSkillsByQuery filters by slug and name", async () => {
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills: vi.fn(),
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses: vi.fn().mockResolvedValue([
          { skillKey: "planner", description: "plan tasks", enabled: true },
          { skillKey: "writer", description: "write docs", enabled: true }
        ])
      } as never
    );

    await expect(logic.listEnabledSkillsByQuery("wri")).resolves.toEqual([
      {
        name: "writer",
        description: "write docs",
        built_in: false,
        type: "unknown"
      }
    ]);

    await expect(logic.listEnabledSkillsByQuery("plan")).resolves.toEqual([
      {
        name: "planner",
        description: "plan tasks",
        built_in: false,
        type: "unknown"
      }
    ]);
  });

  it("listEnabledSkills prefers gateway source classification when present", async () => {
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills: vi.fn(),
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses: vi.fn().mockResolvedValue([
          { skillKey: "excel-xlsx", description: "Excel ops", enabled: true, source: "openclaw-managed" }
        ])
      } as never
    );

    await expect(logic.listEnabledSkills()).resolves.toEqual([
      {
        name: "excel-xlsx",
        description: "Excel ops",
        built_in: false,
        type: "openclaw-managed"
      }
    ]);
  });

  it("listDigitalHumanSkills filters available skills by agent config", async () => {
    const getSkillStatuses = vi.fn().mockResolvedValue([
      { skillKey: "planner", description: "plan tasks", enabled: true },
      { skillKey: "writer", description: "write docs", enabled: undefined },
      { skillKey: "coder", description: "write code", enabled: false }
    ]);
    const getAgentSkills = vi.fn().mockResolvedValue({
      agentId: "agent-1",
      skills: ["writer", "coder"]
    });
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills,
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses
      } as never
    );

    await expect(logic.listDigitalHumanSkills("agent-1")).resolves.toEqual([
      {
        name: "writer",
        description: "write docs",
        built_in: false,
        type: "unknown"
      }
    ]);
    expect(getSkillStatuses).toHaveBeenCalledOnce();
    expect(getAgentSkills).toHaveBeenCalledWith("agent-1");
  });

  it("listDigitalHumanSkills marks built-in slugs with built_in true", async () => {
    const getSkillStatuses = vi.fn().mockResolvedValue([
      { skillKey: "archive-protocol", description: "arch", enabled: true },
      { skillKey: "schedule-plan", description: "plan", enabled: true },
      { skillKey: "kweaver-core", description: "kw", enabled: true },
      { skillKey: "extra", description: "x", enabled: true }
    ]);
    const getAgentSkills = vi.fn().mockResolvedValue({
      agentId: "agent-1",
      skills: [
        "archive-protocol",
        "schedule-plan",
        "kweaver-core",
        "extra"
      ]
    });
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills,
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses
      } as never
    );

    await expect(logic.listDigitalHumanSkills("agent-1")).resolves.toEqual([
      { name: "archive-protocol", description: "arch", built_in: true, type: "unknown" },
      { name: "schedule-plan", description: "plan", built_in: true, type: "unknown" },
      { name: "kweaver-core", description: "kw", built_in: true, type: "unknown" },
      { name: "extra", description: "x", built_in: false, type: "unknown" }
    ]);
  });

  it("lists available skills from OpenClaw skill statuses", async () => {
    const getSkillStatuses = vi.fn().mockResolvedValue([
      { skillKey: "weather", enabled: true },
      { skillKey: "search", enabled: true },
      { skillKey: "disabled", enabled: false }
    ]);
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn(),
      downloadSkillFile: vi.fn()
    }, {
      listAgents: vi.fn(),
      createAgent: vi.fn(),
      deleteAgent: vi.fn(),
      getAgentFile: vi.fn(),
      setAgentFile: vi.fn(),
      getConfig: vi.fn(),
      patchConfig: vi.fn(),
      getSkillStatuses
    } as never);

    await expect(logic.listAvailableSkills()).resolves.toEqual({
      skills: ["weather", "search"]
    });
    expect(getSkillStatuses).toHaveBeenCalledOnce();
  });

  it("delegates getAgentSkills to the client", async () => {
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn().mockResolvedValue({
        agentId: "agent-1",
        skills: ["weather"]
      }),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn(),
      downloadSkillFile: vi.fn()
    });

    await expect(logic.getAgentSkills("agent-1")).resolves.toEqual({
      agentId: "agent-1",
      skills: ["weather"]
    });
  });

  it("delegates updateAgentSkills to the client", async () => {
    const getSkillStatuses = vi.fn().mockResolvedValue([
      {
        skillKey: "smart_ask_data",
        name: "smart-ask-data",
        skillPath: "/repo/skills/smart-ask-data"
      }
    ]);
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn().mockResolvedValue({
        success: true,
        agentId: "agent-1",
        skills: ["smart_ask_data", "search"]
      }),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn(),
      downloadSkillFile: vi.fn()
    }, {
      listAgents: vi.fn(),
      createAgent: vi.fn(),
      deleteAgent: vi.fn(),
      getAgentFile: vi.fn(),
      setAgentFile: vi.fn(),
      getConfig: vi.fn(),
      patchConfig: vi.fn(),
      getSkillStatuses
    } as never);

    await expect(
      logic.updateAgentSkills("agent-1", ["smart-ask-data", "search"])
    ).resolves.toEqual({
      success: true,
      agentId: "agent-1",
      skills: ["smart_ask_data", "search"]
    });
    expect(getSkillStatuses).toHaveBeenCalledOnce();
  });

  it("delegates installSkill to the client", async () => {
    const installSkill = vi.fn().mockResolvedValue({
      name: "weather",
      skillPath: "/data/skills/weather"
    });
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill,
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn(),
      downloadSkillFile: vi.fn()
    });

    const buf = Buffer.from([0x50, 0x4b]);
    await expect(logic.installSkill(buf, { overwrite: true })).resolves.toEqual({
      name: "weather",
      skillPath: "/data/skills/weather"
    });
    expect(installSkill).toHaveBeenCalledWith(buf, { overwrite: true });
  });

  it("delegates uninstallSkill to the client", async () => {
    const uninstallSkill = vi.fn().mockResolvedValue({ name: "weather" });
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill,
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn(),
      downloadSkillFile: vi.fn()
    });

    await expect(logic.uninstallSkill("weather")).resolves.toEqual({
      name: "weather"
    });
    expect(uninstallSkill).toHaveBeenCalledWith("weather");
  });

  it("delegates getSkillTree to the client", async () => {
    const getSkillTree = vi.fn().mockResolvedValue({
      name: "weather",
      entries: [{ name: "SKILL.md", path: "SKILL.md", type: "file" }]
    });
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree,
      getSkillContent: vi.fn(),
      downloadSkillFile: vi.fn()
    });

    await expect(logic.getSkillTree("weather", "/repo/skills/weather")).resolves.toEqual({
      name: "weather",
      entries: [{ name: "SKILL.md", path: "SKILL.md", type: "file" }]
    });
    expect(getSkillTree).toHaveBeenCalledWith("weather", "/repo/skills/weather");
  });

  it("delegates getSkillContent to the client", async () => {
    const getSkillContent = vi.fn().mockResolvedValue({
      name: "weather",
      path: "SKILL.md",
      content: "# Weather",
      bytes: 9,
      truncated: false
    });
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent,
      downloadSkillFile: vi.fn()
    });

    await expect(
      logic.getSkillContent("weather", "SKILL.md", "/repo/skills/weather")
    ).resolves.toEqual({
      name: "weather",
      path: "SKILL.md",
      content: "# Weather",
      bytes: 9,
      truncated: false
    });
    expect(getSkillContent).toHaveBeenCalledWith(
      "weather",
      "SKILL.md",
      "/repo/skills/weather"
    );
  });

  it("delegates downloadSkillFile to the client", async () => {
    const downloadSkillFile = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "text/plain" }),
      body: new Uint8Array(Buffer.from("hello"))
    });
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn(),
      downloadSkillFile
    });

    const result = await logic.downloadSkillFile(
      "weather",
      "SKILL.md",
      "/repo/skills/weather"
    );
    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toBe("text/plain");
    expect(Buffer.from(result.body)).toEqual(Buffer.from("hello"));
    expect(downloadSkillFile).toHaveBeenCalledWith(
      "weather",
      "SKILL.md",
      "/repo/skills/weather"
    );
  });

  it("resolves skill path from statuses", async () => {
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills: vi.fn(),
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses: vi.fn().mockResolvedValue([
          {
            skillKey: "weather",
            name: "Weather",
            skillPath: "/repo/skills/weather"
          }
        ])
      } as never
    );

    await expect(logic.resolveSkillPath("weather")).resolves.toBe("/repo/skills/weather");
  });

  it("resolves skill path by basename when skillPath slug differs from display name lookup", async () => {
    const logic = new DefaultAgentSkillsLogic(
      {
        listAvailableSkills: vi.fn(),
        getAgentSkills: vi.fn(),
        updateAgentSkills: vi.fn(),
        installSkill: vi.fn(),
        uninstallSkill: vi.fn(),
        getSkillTree: vi.fn(),
        getSkillContent: vi.fn(),
        downloadSkillFile: vi.fn()
      },
      {
        listAgents: vi.fn(),
        createAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getAgentFile: vi.fn(),
        setAgentFile: vi.fn(),
        getConfig: vi.fn(),
        patchConfig: vi.fn(),
        getSkillStatuses: vi.fn().mockResolvedValue([
          {
            skillKey: "excel-xlsx",
            skillPath: "/repo/skills/excel-xlsx"
          }
        ])
      } as never
    );

    await expect(logic.resolveSkillPath("excel-xlsx")).resolves.toBe("/repo/skills/excel-xlsx");
  });

  it("getSkillEntryName prefers name and trims whitespace", () => {
    expect(getSkillEntryName({ skillKey: "planner", name: " planner " })).toBe("planner");
    expect(getSkillEntryName({ skillKey: "writer" })).toBe("writer");
  });

  it("getSkillEntryDescription trims whitespace", () => {
    expect(
      getSkillEntryDescription({
        skillKey: "planner",
        description: " plan tasks "
      })
    ).toBe("plan tasks");
  });

  it("mapAvailableSkillEntries keeps non-disabled skills in order", () => {
    expect(
      mapAvailableSkillEntries([
        { skillKey: "planner", enabled: true },
        { skillKey: "planner", enabled: undefined },
        { skillKey: "writer", enabled: undefined },
        { skillKey: "coder", enabled: false },
        { skillKey: "coder", name: " coder ", enabled: true }
      ])
    ).toEqual([
      { skillKey: "planner", enabled: true },
      { skillKey: "writer", enabled: undefined },
      { skillKey: "coder", name: " coder ", enabled: true }
    ]);
  });

  it("filterAgentSkillEntries keeps only configured available skills", () => {
    expect(
      filterAgentSkillEntries(
        [
          { skillKey: "planner", description: "plan tasks", enabled: true },
          {
            skillKey: "smart_ask_data",
            name: "smart-ask-data",
            description: "write docs",
            enabled: undefined,
            skillPath: "/repo/skills/smart-ask-data"
          },
          { skillKey: "coder", description: "write code", enabled: true }
        ],
        ["smart-ask-data", "coder", "missing"]
      )
    ).toEqual([
      {
        name: "smart-ask-data",
        description: "write docs",
        built_in: false,
        type: "unknown"
      },
      {
        name: "coder",
        description: "write code",
        built_in: false,
        type: "unknown"
      }
    ]);
  });

  it("filterAgentSkillEntries sets built_in for built-in slugs", () => {
    expect(
      filterAgentSkillEntries(
        [
          { skillKey: "archive-protocol", description: "a", enabled: true },
          { skillKey: "extra", description: "e", enabled: true }
        ],
        ["archive-protocol", "extra"]
      )
    ).toEqual([
      { name: "archive-protocol", description: "a", built_in: true, type: "unknown" },
      { name: "extra", description: "e", built_in: false, type: "unknown" }
    ]);
  });
});
