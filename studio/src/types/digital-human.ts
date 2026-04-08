import type { OpenClawSkillOriginType } from "./openclaw";

/**
 * Describes the public digital human payload exposed by DIP Studio.
 */
export interface DigitalHuman {
  /**
   * Stable digital human identifier.
   */
  id: string;

  /**
   * Human-readable digital human name.
   */
  name: string;

  /**
   * Job position / role label (from IDENTITY.md `Creature`).
   */
  creature?: string;

  /**
   * Icon identifier (from IDENTITY.md `Icon ID`).
   */
  icon_id?: string;
}

/**
 * Public summary of one built-in digital human template.
 */
export interface BuiltInDigitalHuman {
  /**
   * Stable built-in template identifier.
   */
  id: string;

  /**
   * Human-readable built-in template name.
   */
  name: string;

  /**
   * Human-readable built-in template description.
   */
  description?: string;
}

/**
 * Public digital human list response.
 * Each element has the same shape as the detail response.
 */
export type DigitalHumanList = DigitalHumanDetail[];

/**
 * Public built-in digital human list response.
 */
export type BuiltInDigitalHumanList = BuiltInDigitalHuman[];

/**
 * One globally available skill item.
 */
export interface DigitalHumanSkill {
  /**
   * Human-readable skill name / key.
   */
  name: string;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Whether this skill is a DIP built-in default for digital humans
   * (`archive-protocol`, `schedule-plan`, `kweaver-core`).
   */
  built_in: boolean;

  /**
   * Where the skill directory lives on the gateway host (OpenClaw layout).
   */
  type: OpenClawSkillOriginType;
}

/**
 * One skill item returned for a specific digital human.
 */
export interface DigitalHumanAgentSkill {
  /**
   * Human-readable skill name / key.
   */
  name: string;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Whether this skill is a DIP built-in default for digital humans
   * (`archive-protocol`, `schedule-plan`, `kweaver-core`).
   */
  built_in: boolean;

  /**
   * Where the skill directory lives on the gateway host (OpenClaw layout).
   */
  type: OpenClawSkillOriginType;

  /**
   * Whether the target digital human currently enables this skill.
   * Optional; omitted when not used by the merge implementation.
   */
  enabled?: boolean;
}

/**
 * Global skill list response returned by the skills query API.
 */
export type DigitalHumanSkillList = DigitalHumanSkill[];

/**
 * Agent skill list response returned by the digital human skill API.
 */
export type DigitalHumanAgentSkillList = DigitalHumanAgentSkill[];

/**
 * Unified settings template for a digital employee.
 *
 * Acts as a bidirectional conversion hub between the Studio HTTP API
 * and OpenClaw workspace files (IDENTITY.md + SOUL.md).
 */
export interface DigitalHumanTemplate {
  /**
   * Fields projected to / from IDENTITY.md.
   */
  identity: {
    /**
     * Display name (maps to IDENTITY.md `Name`).
     */
    name: string;

    /**
     * Job position / role label (maps to IDENTITY.md `Creature`).
     */
    creature?: string;

    /**
     * Icon identifier (maps to IDENTITY.md `Icon ID`).
     */
    icon_id?: string;
  };

  /**
   * Raw markdown content written to / read from SOUL.md.
   */
  soul: string;

  /**
   * Business Knowledge Network entries parsed from / rendered to SOUL.md.
   */
  bkn?: BknEntry[];
}

/**
 * A single entry in the Business Knowledge Network (BKN).
 * Stored as a markdown table row inside SOUL.md but exposed
 * as a structured field in the API.
 */
export interface BknEntry {
  /**
   * Human-readable name of the knowledge source.
   */
  name: string;

  /**
   * URL pointing to the knowledge source.
   */
  url: string;
}

/**
 * Supported IM channel providers for OpenClaw `bindings` / `channels` config.
 */
export type DigitalHumanChannelType = "feishu" | "dingtalk";

/**
 * Channel configuration used to bind a messaging channel to the agent.
 */
export interface ChannelConfig {
  /**
   * Channel provider. Defaults to `feishu` when omitted (backward compatible).
   */
  type?: DigitalHumanChannelType;

  /**
   * Application identifier issued by the channel provider.
   * For Feishu and DingTalk, this selects the OpenClaw `channels.<provider>.accounts` key
   * (normalized); each distinct app id maps to one account and at most one bound agent.
   */
  appId: string;

  /**
   * Application secret issued by the channel provider.
   */
  appSecret: string;
}

/**
 * Describes the request body for creating a new digital human.
 */
export interface CreateDigitalHumanRequest {
  /**
   * Optional stable digital human identifier.
   * When omitted, the server generates a UUID.
   */
  id?: string;

  /**
   * Display name for the digital human (maps to IDENTITY.md `Name`).
   */
  name: string;

  /**
   * Job position / role label (maps to IDENTITY.md `Creature`).
   */
  creature?: string;

  /**
   * Icon identifier (maps to IDENTITY.md `Icon ID`).
   */
  icon_id?: string;

  /**
   * Markdown content describing the role persona (written to SOUL.md).
   */
  soul?: string;

  /**
   * Extra skill names to bind to the agent.
   * The server always merges `archive-protocol`, `schedule-plan`, and
   * `kweaver-core` first; duplicates are omitted.
   */
  skills?: string[];

  /**
   * Business Knowledge Network entries.
   * Stored as a markdown table appended to SOUL.md.
   */
  bkn?: BknEntry[];

  /**
   * Channel binding configuration.
   */
  channel?: ChannelConfig;
}

/**
 * Describes the response after successfully creating a digital human.
 * Mirrors the input request shape with the addition of a guaranteed `id`.
 */
export interface CreateDigitalHumanResult {
  /**
   * Stable digital human identifier (UUID).
   */
  id: string;

  /**
   * Human-readable digital human name.
   */
  name: string;

  /**
   * Job position / role label.
   */
  creature?: string;

  /**
   * Icon identifier.
   */
  icon_id?: string;

  /**
   * Markdown content describing the role persona.
   */
  soul?: string;

  /**
   * Skill names bound to the agent (includes built-in defaults merged at create time).
   */
  skills?: string[];

  /**
   * Business Knowledge Network entries.
   */
  bkn?: BknEntry[];

  /**
   * Channel binding configuration.
   */
  channel?: ChannelConfig;
}

/**
 * Detail response returned by GET /digital-human/:id.
 */
export interface DigitalHumanDetail {
  /**
   * Stable digital human identifier.
   */
  id: string;

  /**
   * Human-readable digital human name.
   */
  name: string;

  /**
   * Job position / role label (IDENTITY.md `Creature`).
   */
  creature?: string;

  /**
   * Icon identifier (IDENTITY.md `Icon ID`).
   */
  icon_id?: string;

  /**
   * Role persona markdown (SOUL.md body, excluding the BKN table block).
   */
  soul: string;

  /**
   * Business Knowledge Network entries (from SOUL.md table).
   */
  bkn?: BknEntry[];

  /**
   * Skill names currently configured on the agent (includes built-in defaults when bound).
   */
  skills?: string[];

  /**
   * Messaging channel credentials when this agent is bound to Feishu or DingTalk
   * (from OpenClaw config `bindings` + `channels.feishu` / `channels.dingtalk`).
   */
  channel?: ChannelConfig;
}

/**
 * Partial update body for PUT /digital-human/:id.
 */
export interface UpdateDigitalHumanRequest {
  /**
   * Display name (IDENTITY.md `Name`).
   */
  name?: string;

  /**
   * Job position / role label (IDENTITY.md `Creature`).
   */
  creature?: string;

  /**
   * Icon identifier (IDENTITY.md `Icon ID`).
   */
  icon_id?: string;

  /**
   * Role persona markdown (SOUL.md).
   */
  soul?: string;

  /**
   * When present, replaces the full skill set bound to the agent (may be empty).
   */
  skills?: string[];

  /**
   * When present, replaces BKN entries stored in SOUL.md.
   */
  bkn?: BknEntry[];

  /**
   * Channel binding (same semantics as create).
   */
  channel?: ChannelConfig;
}

/**
 * Response after PUT /digital-human/:id (mirrors create result shape).
 */
export interface UpdateDigitalHumanResult {
  id: string;
  name: string;
  creature?: string;
  icon_id?: string;
  soul?: string;
  /** Skill ids currently on the agent (includes built-in defaults when bound). */
  skills?: string[];
  bkn?: BknEntry[];
  channel?: ChannelConfig;
}
