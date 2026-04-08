/**
 * Public response returned when listing globally available skill ids.
 */
export interface AgentSkillsCatalog {
  /**
   * Discoverable skill ids exposed by the OpenClaw plugin.
   */
  skills: string[];
}

/**
 * Public response returned for one agent's configured skill ids.
 */
export interface AgentSkillsBinding {
  /**
   * Stable OpenClaw agent identifier.
   */
  agentId: string;

  /**
   * Effective skill ids for the agent.
   */
  skills: string[];
}

/**
 * Request body used to replace one agent's skill binding set.
 */
export interface UpdateAgentSkillsRequest {
  /**
   * Replacement skill ids. May be an empty array to clear bindings.
   */
  skills: string[];
}

/**
 * Response returned after a successful skill binding update.
 */
export interface UpdateAgentSkillsResult extends AgentSkillsBinding {
  /**
   * Indicates whether the upstream plugin accepted the update.
   */
  success: boolean;
}

/**
 * Response returned after installing a `.skill` zip via the DIP Gateway route.
 */
export interface InstallSkillResult {
  /**
   * Installed skill id (directory name under `skills/`).
   */
  name: string;

  /**
   * Optional display name declared in SKILL.md.
   */
  displayName?: string;

  /**
   * Absolute path written by the plugin (Gateway host filesystem).
   */
  skillPath: string;
}

/**
 * Response returned after uninstalling a skill via the DIP Gateway route.
 */
export interface UninstallSkillResult {
  /**
   * Removed skill id.
   */
  name: string;
}

export interface SkillTreeEntry {
  /**
   * Basename of the file or directory.
   */
  name: string;

  /**
   * Skill-root-relative path using `/` separators.
   */
  path: string;

  /**
   * Entry kind.
   */
  type: "file" | "directory";

  /**
   * Nested entries for directories.
   */
  children?: SkillTreeEntry[];
}

export interface SkillTreeResult {
  /**
   * Skill id used to resolve the directory tree.
   */
  name: string;

  /**
   * Full skill directory tree.
   */
  entries: SkillTreeEntry[];
}

export interface SkillContentResult {
  /**
   * Skill id used to resolve the file.
   */
  name: string;

  /**
   * Skill-root-relative file path using `/` separators.
   */
  path: string;

  /**
   * UTF-8 preview content.
   */
  content: string;

  /**
   * File size in bytes.
   */
  bytes: number;

  /**
   * Whether the preview was truncated by the server-side size limit.
   */
  truncated: boolean;
}
