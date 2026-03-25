import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listSkillCommandsForAgents } = vi.hoisted(() => ({
  listSkillCommandsForAgents: vi.fn()
}));

vi.mock("openclaw/plugin-sdk", () => ({
  listSkillCommandsForAgents
}));

import { discoverSkillNames, listSkillNamesFromDir } from "./skills-discovery";

describe("skills-discovery", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dip-skills-"));
    listSkillCommandsForAgents.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("lists directory skills and .skill bundles while ignoring dot entries", () => {
    fs.mkdirSync(path.join(tempRoot, "archive-protocol"));
    fs.mkdirSync(path.join(tempRoot, "schedule-plan.skill"));
    fs.mkdirSync(path.join(tempRoot, ".hidden"));
    fs.writeFileSync(path.join(tempRoot, "README.md"), "ignored");

    expect(listSkillNamesFromDir(tempRoot).sort()).toEqual([
      "archive-protocol",
      "schedule-plan"
    ]);
  });

  it("merges repo and bundled skills before falling back to SDK", () => {
    const repoDir = path.join(tempRoot, "repo");
    const bundledDir = path.join(tempRoot, "bundled");
    fs.mkdirSync(path.join(repoDir, "archive-protocol"), { recursive: true });
    fs.mkdirSync(path.join(bundledDir, "schedule-plan"), { recursive: true });
    fs.mkdirSync(path.join(bundledDir, "archive-protocol"), { recursive: true });

    const result = discoverSkillNames(repoDir, bundledDir, { any: "config" });

    expect(result).toEqual(["archive-protocol", "schedule-plan"]);
    expect(listSkillCommandsForAgents).not.toHaveBeenCalled();
  });

  it("falls back to SDK discovery when no local skills are present", () => {
    listSkillCommandsForAgents.mockReturnValue([
      { skillName: "contextloader" },
      { skillName: "schedule-plan" },
      { skillName: "schedule-plan" }
    ]);

    const result = discoverSkillNames(
      path.join(tempRoot, "missing-repo"),
      path.join(tempRoot, "missing-bundled"),
      { cfg: true },
      ["agent-1"]
    );

    expect(result).toEqual(["contextloader", "schedule-plan"]);
    expect(listSkillCommandsForAgents).toHaveBeenCalledWith({
      cfg: { cfg: true },
      agentIds: ["agent-1"]
    });
  });

  it("discovers the bundled archive and schedule skills from the plugin tree", () => {
    const bundledSkillsDir = path.resolve(process.cwd(), "extensions/dip/skills");
    const discovered = listSkillNamesFromDir(bundledSkillsDir);

    expect(discovered).toEqual(
      expect.arrayContaining(["archive-protocol", "contextloader", "schedule-plan"])
    );
  });
});
