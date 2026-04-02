import {
  buildWorkspaceSkillStatus,
  resolveAgentWorkspaceDir,
  resolveDefaultAgentId,
  type OpenClawConfig,
  type SkillStatusEntry,
} from "openclaw/plugin-sdk";

/**
 * Resolves skill ids via OpenClaw native SDK discovery.
 *
 * @param config OpenClaw config object.
 * @param agentId Optional agent ID to scope discovery
 * @returns Sorted skill ids.
 */
export function discoverSkillStatus(
  config: OpenClawConfig,
  agentId?: string
): SkillStatusEntry[] {
  const effectiveAgentId = agentId ? agentId.trim() : resolveDefaultAgentId(config);
  const workspaceDir = resolveAgentWorkspaceDir(config, effectiveAgentId);
  console.log("workspaceDir", workspaceDir);
  const report = buildWorkspaceSkillStatus(workspaceDir, { config });
  return report.skills;
}

/**
 * Resolves skill ids via OpenClaw native SDK discovery.
 *
 * @param config OpenClaw config object.
 * @param agentIds Optional agent scope for SDK discovery.
 * @returns Sorted skill ids.
 */
export function discoverSkillNames(
  config: OpenClawConfig,
  agentIds?: string[]
): string[] {
  const agentId = agentIds && agentIds.length > 0 ? agentIds[0] : undefined;
  const skills = discoverSkillStatus(config, agentId);

  // Currently we just return all discovered skills, whether enabled or disabled.
  // The caller is responsible for separating disabled vs enabled skills if needed,
  // or the caller uses the raw string list.
  const allNames = skills.map((s) => s.name);
  return Array.from(new Set(allNames)).sort();
}
