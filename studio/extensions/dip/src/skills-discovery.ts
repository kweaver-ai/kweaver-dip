import fs from "node:fs";
import { listSkillCommandsForAgents } from "openclaw/plugin-sdk";

/**
 * Lists skill directory names under one filesystem path.
 *
 * @param skillsDir Absolute or relative skills root.
 * @returns Sorted unique skill ids from directory entries.
 */
export function listSkillNamesFromDir(skillsDir: string): string[] {
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() || dirent.name.endsWith(".skill"))
    .map(dirent => dirent.name.replace(/\.skill$/, ""))
    .filter(name => !name.startsWith("."));
}

/**
 * Resolves skill ids from repo `skills/`, bundled `extensions/dip/skills/`, then SDK discovery.
 *
 * @param repoSkillsDir Path to workspace/repo `skills` directory.
 * @param bundledSkillsDir Path to plugin-bundled `skills` directory.
 * @param config OpenClaw config object for SDK fallback.
 * @param agentIds Optional agent scope for SDK discovery.
 * @returns Sorted skill ids.
 */
export function discoverSkillNames(
  repoSkillsDir: string,
  bundledSkillsDir: string,
  config: unknown,
  agentIds?: string[]
): string[] {
  try {
    const fromRepo = listSkillNamesFromDir(repoSkillsDir);
    const fromBundled = listSkillNamesFromDir(bundledSkillsDir);
    const merged = [...new Set([...fromRepo, ...fromBundled])].sort();
    if (merged.length > 0) return merged;
  } catch {
    // fall through to SDK
  }
  const specs = listSkillCommandsForAgents({ cfg: config as any, agentIds });
  return Array.from(new Set(specs.map(s => s.skillName))).sort();
}
