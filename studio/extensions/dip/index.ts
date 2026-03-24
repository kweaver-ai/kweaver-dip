import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { registerArchivesAccess } from "./src/archives-access";
import { registerSkillsControl } from "./src/skills-control";

/**
 * DIP OpenClaw plugin (`dip`): agent skills HTTP/CLI, workspace archives, bundled contextloader skill discovery.
 */
export default function register(api: OpenClawPluginApi): void {
  const repoRoot = path.resolve(__dirname, "../..");
  const bundledSkillsDir = path.join(__dirname, "skills");
  registerSkillsControl(api, repoRoot, bundledSkillsDir);
  registerArchivesAccess(api);
}
