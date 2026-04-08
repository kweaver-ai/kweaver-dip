import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { OpenClawConfig } from "openclaw/plugin-sdk";

const DEFAULT_AGENT_ID = "main";
const VALID_AGENT_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export type SkillStatusEntry = {
  name: string;
  description: string;
  source: string;
  filePath: string;
  baseDir: string;
  disabled: boolean;
  eligible: boolean;
};

function normalizeAgentId(value: string | undefined | null): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return DEFAULT_AGENT_ID;
  }
  if (VALID_AGENT_ID_RE.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "")
    .slice(0, 64);
  return normalized || DEFAULT_AGENT_ID;
}

function resolveDefaultAgentId(config: OpenClawConfig): string {
  const agents = Array.isArray(config.agents?.list)
    ? config.agents.list.filter(
        (entry): entry is NonNullable<NonNullable<OpenClawConfig["agents"]>["list"]>[number] =>
          Boolean(entry && typeof entry === "object")
      )
    : [];
  if (agents.length === 0) {
    return DEFAULT_AGENT_ID;
  }
  const preferred = agents.find((entry) => entry?.default) ?? agents[0];
  return normalizeAgentId(preferred?.id);
}

function resolveUserPath(input: string): string {
  if (input === "~") {
    return os.homedir();
  }
  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

function resolveStateDir(): string {
  const configured = process.env.OPENCLAW_STATE_DIR?.trim();
  if (configured) {
    return resolveUserPath(configured);
  }
  const profile = process.env.OPENCLAW_PROFILE?.trim();
  if (profile && profile.toLowerCase() !== "default") {
    return path.join(os.homedir(), ".openclaw", `state-${profile}`);
  }
  return path.join(os.homedir(), ".openclaw");
}

function resolveDefaultAgentWorkspaceDir(): string {
  const profile = process.env.OPENCLAW_PROFILE?.trim();
  if (profile && profile.toLowerCase() !== "default") {
    return path.join(os.homedir(), ".openclaw", `workspace-${profile}`);
  }
  return path.join(os.homedir(), ".openclaw", "workspace");
}

function resolveAgentWorkspaceDir(config: OpenClawConfig, agentId: string): string {
  const id = normalizeAgentId(agentId);
  const agents = Array.isArray(config.agents?.list) ? config.agents.list : [];
  const entry = agents.find((item) => normalizeAgentId(item?.id) === id);
  const configuredWorkspace =
    typeof entry?.workspace === "string" ? entry.workspace.trim() : undefined;
  if (configuredWorkspace) {
    return resolveUserPath(configuredWorkspace);
  }
  if (id === resolveDefaultAgentId(config)) {
    const defaultWorkspace =
      typeof config.agents?.defaults?.workspace === "string"
        ? config.agents.defaults.workspace.trim()
        : "";
    return defaultWorkspace ? resolveUserPath(defaultWorkspace) : resolveDefaultAgentWorkspaceDir();
  }
  return path.join(resolveStateDir(), `workspace-${id}`);
}

function firstParagraph(markdown: string): string {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const body = lines.filter((line) => !line.startsWith("#") && !line.startsWith("---"));
  return body[0] ?? "";
}

function discoverWorkspaceSkills(workspaceDir: string): SkillStatusEntry[] {
  const skillsDir = path.join(workspaceDir, "skills");
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries: SkillStatusEntry[] = [];
  for (const dirent of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const baseDir = path.join(skillsDir, dirent.name);
    const filePath = path.join(baseDir, "SKILL.md");
    if (!fs.existsSync(filePath)) {
      continue;
    }
    let description = "";
    try {
      description = firstParagraph(fs.readFileSync(filePath, "utf8"));
    } catch {
      description = "";
    }
    entries.push({
      name: dirent.name,
      description,
      source: "workspace",
      filePath,
      baseDir,
      disabled: false,
      eligible: true,
    });
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Resolves skill ids via OpenClaw native SDK discovery.
 *
 * @param config OpenClaw config object.
 * @param agentId Optional agent ID to scope discovery
 * @returns Sorted skill ids.
 */
export function discoverSkillStatus(config: OpenClawConfig, agentId?: string): SkillStatusEntry[] {
  const effectiveAgentId = agentId ? agentId.trim() : resolveDefaultAgentId(config);
  const workspaceDir = resolveAgentWorkspaceDir(config, effectiveAgentId);
  return discoverWorkspaceSkills(workspaceDir);
}

/**
 * Resolves skill ids via OpenClaw native SDK discovery.
 *
 * @param config OpenClaw config object.
 * @param agentIds Optional agent scope for SDK discovery.
 * @returns Sorted skill ids.
 */
export function discoverSkillNames(config: OpenClawConfig, agentIds?: string[]): string[] {
  const agentId = agentIds && agentIds.length > 0 ? agentIds[0] : undefined;
  const skills = discoverSkillStatus(config, agentId);

  // Currently we just return all discovered skills, whether enabled or disabled.
  // The caller is responsible for separating disabled vs enabled skills if needed,
  // or the caller uses the raw string list.
  const allNames = skills.map((s) => s.name);
  return Array.from(new Set(allNames)).sort();
}
