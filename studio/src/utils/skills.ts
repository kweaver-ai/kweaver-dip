import path from "node:path";

/**
 * Skill helpers: digital-human default slugs / merge, install-upload filename → skill id.
 */

/** Matches DIP `skills-install` slug rules for skill directory names. */
const SKILL_NAME_SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function isSafeSkillNameSegment(name: string): boolean {
  return (
    name.length > 0 &&
    name !== "." &&
    name !== ".." &&
    !name.includes("/") &&
    !name.includes("\\")
  );
}

/**
 * Built-in skill slugs merged into every new digital human agent.
 */
export const DEFAULT_DIGITAL_HUMAN_SKILLS: readonly string[] = [
  "archive-protocol",
  "schedule-plan",
  "kweaver-core"
];

const DEFAULT_DIGITAL_HUMAN_SKILL_SLUG_SET = new Set(DEFAULT_DIGITAL_HUMAN_SKILLS);

/**
 * @param slug Normalized skill id (matches OpenClaw / plugin skill name).
 * @returns Whether this slug is a built-in default for digital humans.
 */
export function isDefaultDigitalHumanSkillSlug(slug: string): boolean {
  return DEFAULT_DIGITAL_HUMAN_SKILL_SLUG_SET.has(slug);
}

/**
 * Merges {@link DEFAULT_DIGITAL_HUMAN_SKILLS} with optional request skills,
 * preserving default order and deduplicating by first occurrence.
 *
 * @param requestSkills Optional extra skill names from the create request.
 * @returns The combined skill list to persist on the agent.
 */
export function mergeCreateDigitalHumanSkills(requestSkills?: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of DEFAULT_DIGITAL_HUMAN_SKILLS) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  for (const s of requestSkills ?? []) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

/**
 * Strips `.skill` / `.zip` suffixes (case-insensitive, repeated) from an upload basename.
 *
 * @param originalname Value from `multer` `file.originalname`.
 * @returns A valid skill id, or `undefined` if the name cannot be derived.
 */
export function deriveSkillIdFromUploadedFilename(
  originalname: string
): string | undefined {
  const base = path.basename(originalname.trim());
  if (base.length === 0) {
    return undefined;
  }
  let name = base;
  for (;;) {
    const next = name.replace(/\.(skill|zip)$/i, "");
    if (next === name) {
      break;
    }
    name = next;
  }
  name = name.trim();
  if (
    name.length === 0 ||
    !isSafeSkillNameSegment(name) ||
    !SKILL_NAME_SLUG_RE.test(name)
  ) {
    return undefined;
  }
  return name;
}

/**
 * @param slug Candidate skill id (directory name under `skills/`).
 * @returns Whether the string matches DIP slug rules.
 */
export function isValidSkillSlug(slug: string): boolean {
  const t = slug.trim();
  return (
    t.length > 0 &&
    isSafeSkillNameSegment(t) &&
    SKILL_NAME_SLUG_RE.test(t)
  );
}
