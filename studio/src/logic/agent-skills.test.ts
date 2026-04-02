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
        getSkillContent: vi.fn()
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
        getSkillContent: vi.fn()
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
        getSkillContent: vi.fn()
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
        getSkillContent: vi.fn()
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
        getSkillContent: vi.fn()
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
        getSkillContent: vi.fn()
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

  it("delegates listAvailableSkills to the client", async () => {
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn().mockResolvedValue({
        skills: ["weather", "search"]
      }),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn(),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn()
    });

    await expect(logic.listAvailableSkills()).resolves.toEqual({
      skills: ["weather", "search"]
    });
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
      getSkillContent: vi.fn()
    });

    await expect(logic.getAgentSkills("agent-1")).resolves.toEqual({
      agentId: "agent-1",
      skills: ["weather"]
    });
  });

  it("delegates updateAgentSkills to the client", async () => {
    const logic = new DefaultAgentSkillsLogic({
      listAvailableSkills: vi.fn(),
      getAgentSkills: vi.fn(),
      updateAgentSkills: vi.fn().mockResolvedValue({
        success: true,
        agentId: "agent-1",
        skills: ["weather", "search"]
      }),
      installSkill: vi.fn(),
      uninstallSkill: vi.fn(),
      getSkillTree: vi.fn(),
      getSkillContent: vi.fn()
    });

    await expect(
      logic.updateAgentSkills("agent-1", ["weather", "search"])
    ).resolves.toEqual({
      success: true,
      agentId: "agent-1",
      skills: ["weather", "search"]
    });
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
      getSkillContent: vi.fn()
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
      getSkillContent: vi.fn()
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
      getSkillTree
    });

    await expect(logic.getSkillTree("weather")).resolves.toEqual({
      name: "weather",
      entries: [{ name: "SKILL.md", path: "SKILL.md", type: "file" }]
    });
    expect(getSkillTree).toHaveBeenCalledWith("weather");
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
      getSkillContent
    });

    await expect(logic.getSkillContent("weather", "SKILL.md")).resolves.toEqual({
      name: "weather",
      path: "SKILL.md",
      content: "# Weather",
      bytes: 9,
      truncated: false
    });
    expect(getSkillContent).toHaveBeenCalledWith("weather", "SKILL.md");
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
          { skillKey: "writer", description: "write docs", enabled: undefined },
          { skillKey: "coder", description: "write code", enabled: true }
        ],
        ["writer", "coder", "missing"]
      )
    ).toEqual([
      {
        name: "writer",
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
