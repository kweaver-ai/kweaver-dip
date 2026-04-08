import path from "node:path";
import type { OpenClawConfig, OpenClawPluginApi } from "openclaw/plugin-sdk";

export function resolveAgentWorkspaceDir(
  config: OpenClawConfig,
  agentId: string,
  api: OpenClawPluginApi
): string {
  const agents = (config.agents as any)?.list || [];
  const agent = agents.find((a: any) => a.id === agentId);
  const workspace = agent?.workspace;
  if (workspace) {
    return api.resolvePath(workspace);
  }
  const stateDir = api.runtime.state.resolveStateDir();
  return path.join(stateDir, "workspaces", agentId);
}
