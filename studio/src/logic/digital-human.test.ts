import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  symlinkSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  DefaultDigitalHumanLogic,
  FileSystemDigitalHumanWorkspaceStore,
  ensureSkillSourceExists,
  isMissingFileError,
  mapAgentsToDigitalHumans
} from "./digital-human";
import { HttpError } from "../errors/http-error";

/**
 * Creates a temporary directory for file system tests.
 *
 * @returns The absolute temporary directory path.
 */
function createTempDirectory(): string {
  const directoryPath = mkdtempSync(join(tmpdir(), "dip-studio-"));

  return directoryPath;
}

describe("DefaultDigitalHumanLogic", () => {
  it("fetches agents from the adapter and maps them to digital humans", async () => {
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
      })
    };
    const logic = new DefaultDigitalHumanLogic(openClawAgentsAdapter);

    await expect(logic.listDigitalHumans()).resolves.toEqual([
      {
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png"
      }
    ]);
    expect(openClawAgentsAdapter.listAgents).toHaveBeenCalledOnce();
  });

  it("creates a digital human and synchronizes its workspace", async () => {
    const openClawAgentsAdapter = {
      listAgents: vi.fn(),
      addAgent: vi.fn().mockResolvedValue(undefined)
    };
    const workspaceStore = {
      syncWorkspace: vi.fn().mockResolvedValue("workspace/main")
    };
    const logic = new DefaultDigitalHumanLogic(
      openClawAgentsAdapter,
      workspaceStore
    );

    await expect(
      logic.createDigitalHuman({
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png",
        identity: "# Identity",
        soul: "# Soul",
        skills: ["planner"]
      })
    ).resolves.toEqual({
      id: "main",
      name: "Main Agent",
      avatar: "https://example.com/main.png",
      skills: ["planner"],
      workspace: "workspace/main"
    });

    expect(openClawAgentsAdapter.addAgent).toHaveBeenCalledWith({
      name: "Main Agent",
      workspace: "main"
    });
    expect(workspaceStore.syncWorkspace).toHaveBeenCalledWith(
      {
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png",
        identity: "# Identity",
        soul: "# Soul",
        skills: ["planner"]
      },
      "main"
    );
  });

  it("creates a digital human without optional metadata", async () => {
    const openClawAgentsAdapter = {
      listAgents: vi.fn(),
      addAgent: vi.fn().mockResolvedValue(undefined)
    };
    const workspaceStore = {
      syncWorkspace: vi.fn().mockResolvedValue("workspace/generated-id")
    };
    const logic = new DefaultDigitalHumanLogic(
      openClawAgentsAdapter,
      workspaceStore
    );

    const result = await logic.createDigitalHuman({
      id: "generated-id",
      name: "Main Agent"
    });

    expect(result).toEqual({
      id: "generated-id",
      name: "Main Agent",
      avatar: undefined,
      skills: [],
      workspace: "workspace/generated-id"
    });
    expect(openClawAgentsAdapter.addAgent).toHaveBeenCalledWith({
      name: "Main Agent",
      workspace: "generated-id"
    });
  });
});

describe("FileSystemDigitalHumanWorkspaceStore", () => {
  it("writes markdown files and reconciles skills to match the request", async () => {
    const workspaceRoot = createTempDirectory();
    const skillStorePath = join(
      workspaceRoot,
      "__internal_skill_agent__",
      "skill-store"
    );
    const workspacePath = join(workspaceRoot, "main");
    const skillsPath = join(workspacePath, "skills");

    mkdirSync(join(skillStorePath, "planner"), { recursive: true });
    mkdirSync(join(skillStorePath, "writer"), { recursive: true });
    mkdirSync(skillsPath, { recursive: true });
    symlinkSync(
      "../__internal_skill_agent__/skill-store/writer",
      join(skillsPath, "obsolete"),
      "dir"
    );

    const store = new FileSystemDigitalHumanWorkspaceStore(workspaceRoot);

    await expect(
      store.syncWorkspace(
        {
          name: "Main Agent",
          identity: "# Identity",
          soul: "# Soul",
          skills: ["planner", "writer"]
        },
        "main"
      )
    ).resolves.toBe(workspacePath);

    expect(readFileSync(join(workspacePath, "IDENTITY.md"), "utf8")).toBe("# Identity");
    expect(readFileSync(join(workspacePath, "SOUL.md"), "utf8")).toBe("# Soul");
    expect(readdirSync(skillsPath).sort()).toEqual(["planner", "writer"]);
    expect(realpathSync(join(skillsPath, "planner"))).toBe(
      realpathSync(join(skillStorePath, "planner"))
    );
    expect(realpathSync(join(skillsPath, "writer"))).toBe(
      realpathSync(join(skillStorePath, "writer"))
    );
  });
});

describe("mapAgentsToDigitalHumans", () => {
  it("maps OpenClaw agents to the public digital human schema", () => {
    expect(
      mapAgentsToDigitalHumans({
        defaultId: "main",
        mainKey: "sender",
        scope: "per-sender",
        agents: [
          {
            id: "main",
            identity: {
              name: "Main Agent",
              avatarUrl: "https://example.com/main.png"
            }
          }
        ]
      })
    ).toEqual([
      {
        id: "main",
        name: "Main Agent",
        avatar: "https://example.com/main.png"
      }
    ]);
  });

  it("falls back to identity name, agent id and avatar variants when fields are missing", () => {
    expect(
      mapAgentsToDigitalHumans({
        defaultId: "main",
        mainKey: "sender",
        scope: "per-sender",
        agents: [
          {
            id: "identity-name",
            identity: {
              name: "Identity Name",
              avatar: "https://example.com/identity-avatar.png"
            }
          },
          {
            id: "id-fallback"
          }
        ]
      })
    ).toEqual([
      {
        id: "identity-name",
        name: "Identity Name",
        avatar: "https://example.com/identity-avatar.png"
      },
      {
        id: "id-fallback",
        name: "id-fallback",
        avatar: undefined
      }
    ]);
  });
});

describe("ensureSkillSourceExists", () => {
  it("throws a 400 HttpError when the skill does not exist", async () => {
    await expect(
      ensureSkillSourceExists("/missing/skill", "missing-skill")
    ).rejects.toEqual(new HttpError(400, "Unknown skill: missing-skill"));
  });
});

describe("isMissingFileError", () => {
  it("detects ENOENT file system errors", () => {
    expect(isMissingFileError({ code: "ENOENT" })).toBe(true);
    expect(isMissingFileError({ code: "EACCES" })).toBe(false);
    expect(isMissingFileError("ENOENT")).toBe(false);
  });
});
