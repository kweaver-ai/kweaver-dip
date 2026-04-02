import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { buildWorkspaceSkillStatus, resolveAgentWorkspaceDir, resolveDefaultAgentId } = vi.hoisted(() => ({
  buildWorkspaceSkillStatus: vi.fn(),
  resolveAgentWorkspaceDir: vi.fn().mockReturnValue("/mock/agent/workspace"),
  resolveDefaultAgentId: vi.fn().mockReturnValue("default-agent")
}));

vi.mock("openclaw/plugin-sdk", () => ({
  buildWorkspaceSkillStatus,
  resolveAgentWorkspaceDir,
  resolveDefaultAgentId
}));

import { discoverSkillNames } from "./skills-discovery.js";

describe("skills-discovery", () => {
  beforeEach(() => {
    buildWorkspaceSkillStatus.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sorted unique skill names from SDK discovery", () => {
    buildWorkspaceSkillStatus.mockReturnValue({
      skills: [
        { name: "schedule-plan" },
        { name: "archive-protocol" },
        { name: "schedule-plan" }
      ]
    });

    const result = discoverSkillNames({ any: "config" } as any);

    expect(result).toEqual(["archive-protocol", "schedule-plan"]);
    expect(buildWorkspaceSkillStatus).toHaveBeenCalledWith(
      expect.any(String),
      { config: { any: "config" } }
    );
  });

  it("passes agentIds to SDK discovery", () => {
    buildWorkspaceSkillStatus.mockReturnValue({
      skills: [
        { name: "contextloader" },
        { name: "schedule-plan" },
        { name: "schedule-plan" }
      ]
    });

    const result = discoverSkillNames({ cfg: true } as any, ["agent-1"]);

    expect(result).toEqual(["contextloader", "schedule-plan"]);
  });
});
