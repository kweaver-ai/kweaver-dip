import {
  mkdir,
  readlink,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile
} from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import type { OpenClawAgentsAdapter } from "../adapters/openclaw-agents-adapter";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/http-error";
import type {
  CreateDigitalHumanRequest,
  CreateDigitalHumanResult,
  DigitalHumanList
} from "../types/digital-human";
import type { OpenClawAgentsListResult } from "../types/openclaw";

const INTERNAL_SKILL_AGENT_ID = "__internal_skill_agent__";

/**
 * Defines the file system operations needed to synchronize a digital human workspace.
 */
export interface DigitalHumanWorkspaceStore {
  /**
   * Reconciles workspace files and skill links for a digital human.
   *
   * @param request The normalized create request.
   * @param id The resolved digital human identifier.
   * @returns The relative workspace path exposed to API consumers.
   */
  syncWorkspace(
    request: CreateDigitalHumanRequest,
    id: string
  ): Promise<string>;
}

/**
 * Application logic used to manage digital humans.
 */
export interface DigitalHumanLogic {
  /**
   * Fetches the public digital human list.
   *
   * @returns The normalized digital human list.
   */
  listDigitalHumans(): Promise<DigitalHumanList>;

  /**
   * Creates a digital human in OpenClaw and synchronizes its workspace.
   *
   * @param request The normalized create request.
   * @returns The created digital human payload.
   */
  createDigitalHuman(
    request: CreateDigitalHumanRequest
  ): Promise<CreateDigitalHumanResult>;
}

/**
 * Synchronizes digital human workspace files on the local filesystem.
 */
export class FileSystemDigitalHumanWorkspaceStore
implements DigitalHumanWorkspaceStore {
  /**
   * Creates the workspace store.
   *
   * @param workspaceRoot Optional explicit workspace root used by tests.
   */
  public constructor(
    private readonly workspaceRoot: string = getEnv().openClawWorkspaceDir
  ) {}

  /**
   * Reconciles workspace files and skill links for a digital human.
   *
   * @param request The normalized create request.
   * @param id The resolved digital human identifier.
   * @returns The relative workspace path exposed to API consumers.
   */
  public async syncWorkspace(
    request: CreateDigitalHumanRequest,
    id: string
  ): Promise<string> {
    const workspacePath = join(this.workspaceRoot, id);
    const skillsDirectoryPath = join(workspacePath, "skills");

    await mkdir(workspacePath, { recursive: true });
    await mkdir(skillsDirectoryPath, { recursive: true });
    await syncWorkspaceMarkdown(workspacePath, request);
    await syncWorkspaceSkills(
      skillsDirectoryPath,
      join(
        this.workspaceRoot,
        INTERNAL_SKILL_AGENT_ID,
        "skill-store"
      ),
      request.skills ?? []
    );

    return workspacePath;
  }
}

/**
 * Logic implementation that derives digital humans from OpenClaw agents.
 */
export class DefaultDigitalHumanLogic implements DigitalHumanLogic {
  /**
   * Creates the digital human logic.
   *
   * @param openClawAgentsAdapter The adapter used to call OpenClaw.
   * @param workspaceStore The store used to synchronize local workspace files.
   */
  public constructor(
    private readonly openClawAgentsAdapter: OpenClawAgentsAdapter,
    private readonly workspaceStore: DigitalHumanWorkspaceStore = new FileSystemDigitalHumanWorkspaceStore()
  ) {}

  /**
   * Fetches the digital human list.
   *
   * @returns The normalized digital human list.
   */
  public async listDigitalHumans(): Promise<DigitalHumanList> {
    const agents = await this.openClawAgentsAdapter.listAgents();

    return mapAgentsToDigitalHumans(agents);
  }

  /**
   * Creates a digital human and reconciles its workspace.
   *
   * @param request The normalized create request.
   * @returns The created digital human payload.
   */
  public async createDigitalHuman(
    request: CreateDigitalHumanRequest
  ): Promise<CreateDigitalHumanResult> {
    const id = request.id ?? randomUUID();
    const skills = request.skills ?? [];

    await this.openClawAgentsAdapter.addAgent({
      name: request.name,
      workspace: id
    });

    const workspace = await this.workspaceStore.syncWorkspace(
      {
        ...request,
        skills
      },
      id
    );

    return {
      id,
      name: request.name,
      avatar: request.avatar,
      skills,
      workspace
    };
  }
}

/**
 * Maps the OpenClaw agents payload to the public digital human schema.
 *
 * @param result The OpenClaw agents list result.
 * @returns The normalized digital human list.
 */
export function mapAgentsToDigitalHumans(
  result: OpenClawAgentsListResult
): DigitalHumanList {
  return result.agents.map((agent) => ({
    id: agent.id,
    name: agent.name ?? agent.identity?.name ?? agent.id,
    avatar: agent.identity?.avatarUrl ?? agent.identity?.avatar
  }));
}

/**
 * Synchronizes `IDENTITY.md` and `SOUL.md` when contents are provided.
 *
 * @param workspacePath The absolute workspace directory.
 * @param request The normalized create request.
 * @returns Nothing once markdown files have been written.
 */
export async function syncWorkspaceMarkdown(
  workspacePath: string,
  request: CreateDigitalHumanRequest
): Promise<void> {
  if (request.identity !== undefined) {
    await writeFile(join(workspacePath, "IDENTITY.md"), request.identity, "utf8");
  }

  if (request.soul !== undefined) {
    await writeFile(join(workspacePath, "SOUL.md"), request.soul, "utf8");
  }
}

/**
 * Reconciles the `skills/` directory so it exactly matches the requested skills.
 *
 * @param skillsDirectoryPath The absolute skills directory path for the workspace.
 * @param skillStorePath The absolute internal skill store path.
 * @param skills The full ordered skill list requested by the caller.
 * @returns Nothing once the skill links match the request.
 */
export async function syncWorkspaceSkills(
  skillsDirectoryPath: string,
  skillStorePath: string,
  skills: string[]
): Promise<void> {
  const desiredSkills = new Set(skills);
  const existingEntries = await readdir(skillsDirectoryPath, {
    withFileTypes: true
  });

  await Promise.all(
    existingEntries
      .filter((entry) => !desiredSkills.has(entry.name))
      .map(async (entry) => {
        const entryPath = join(skillsDirectoryPath, entry.name);

        if (entry.isDirectory()) {
          await rm(entryPath, { recursive: true, force: true });
          return;
        }

        await unlink(entryPath);
      })
  );

  for (const skillName of skills) {
    const targetPath = join(skillStorePath, skillName);
    const linkPath = join(skillsDirectoryPath, skillName);

    await ensureSkillSourceExists(targetPath, skillName);

    try {
      const currentTargetPath = await readlink(linkPath);

      if (currentTargetPath === targetPath) {
        continue;
      }

      await unlink(linkPath);
    } catch (error) {
      if (!isMissingFileError(error)) {
        throw error;
      }
    }

    await symlink(targetPath, linkPath, "dir");
  }
}

/**
 * Validates that the requested skill exists in the internal skill store.
 *
 * @param targetPath The absolute skill source path.
 * @param skillName The requested skill name.
 * @returns Nothing when the skill source exists.
 * @throws {HttpError} Thrown when the skill cannot be found.
 */
export async function ensureSkillSourceExists(
  targetPath: string,
  skillName: string
): Promise<void> {
  try {
    await readdir(targetPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new HttpError(400, `Unknown skill: ${skillName}`);
    }

    throw error;
  }
}

/**
 * Checks whether a file system error indicates a missing path.
 *
 * @param error The thrown file system error.
 * @returns `true` when the path does not exist.
 */
export function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
