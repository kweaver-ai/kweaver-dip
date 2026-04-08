import { readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  BknEntry,
  CreateDigitalHumanRequest,
  DigitalHumanTemplate,
  UpdateDigitalHumanRequest
} from "../types/digital-human";

/** Markdown body with `{{de_setting}}` / `{{bkn_content}}` slots (file kept as `.pug` path in repo). */
const SOUL_TEMPLATE_FILE = "de_agent_soul.pug";

const SLOT_DE_SETTING = "{{de_setting}}";
const SLOT_BKN_CONTENT = "{{bkn_content}}";

/** Marker for SOUL.md generated from `templates/de_agent_soul.pug`. */
const DE_AGENT_PERSONA_MARKER = "# 👤 角色定义";
/** Line prefix before conduct rules (user soul is in blockquotes above this). */
const DE_AGENT_CONDUCT_LINE_PREFIX = "> **行为准则**";

// ---------------------------------------------------------------------------
// Write-direction: request -> template -> markdown
// ---------------------------------------------------------------------------

/**
 * Builds a {@link DigitalHumanTemplate} from the incoming API request.
 *
 * @param request The creation request payload.
 * @returns A fully populated template ready for markdown rendering.
 */
export function buildTemplate(
  request: CreateDigitalHumanRequest
): DigitalHumanTemplate {
  return {
    identity: {
      name: request.name,
      creature: request.creature,
      icon_id: request.icon_id
    },
    soul: request.soul ?? "",
    bkn: request.bkn
  };
}

/**
 * Applies a partial update onto an existing template.
 *
 * Only keys present on `patch` (own properties) overwrite; omitted keys
 * keep their current values. This allows PUT bodies that only set e.g.
 * `channel` without clearing other fields.
 */
export function mergeTemplatePatch(
  current: DigitalHumanTemplate,
  patch: UpdateDigitalHumanRequest
): DigitalHumanTemplate {
  const p = patch as Record<string, unknown>;
  const has = (key: string): boolean =>
    Object.prototype.hasOwnProperty.call(p, key);

  return {
    identity: {
      name: has("name") ? (patch.name as string) : current.identity.name,
      creature: has("creature") ? patch.creature : current.identity.creature,
      icon_id: has("icon_id") ? patch.icon_id : current.identity.icon_id
    },
    soul: has("soul") ? (patch.soul ?? "") : current.soul,
    bkn: has("bkn") ? patch.bkn : current.bkn
  };
}

/**
 * Resolves the absolute path to `templates/de_agent_soul.pug` (used for SOUL.md).
 * Uses `process.cwd()` so the server must be started with cwd set to the `studio`
 * package root (same as `npm start` / `npm test` from that directory).
 */
export function resolveSoulTemplatePath(): string {
  return join(process.cwd(), "templates", SOUL_TEMPLATE_FILE);
}

/**
 * Renders the IDENTITY.md content from a template.
 *
 * Follows the OpenClaw `- Key: Value` convention so that the built-in
 * identity parser in OpenClaw can parse it back.
 *
 * @param template The digital human template.
 * @returns The IDENTITY.md markdown string.
 */
export function renderIdentityMarkdown(
  template: DigitalHumanTemplate
): string {
  const { identity } = template;
  const lines: string[] = ["# IDENTITY.md", ""];

  lines.push(`- Name: ${identity.name}`);

  if (identity.icon_id) {
    lines.push(`- Icon ID: ${identity.icon_id}`);
  }

  if (identity.creature) {
    lines.push(`- Creature: ${identity.creature}`);
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Renders SOUL.md from `templates/de_agent_soul.pug`.
 *
 * The file is Markdown with two slots filled at render time:
 * - `{{de_setting}}` — 角色设定（来自 `template.soul`，渲染为 `> …` 引用块）
 * - `{{bkn_content}}` — 业务知识网络（来自 `template.bkn`，渲染为引用块内的表格）
 *
 * (The real file is not compiled as Pug because the body is Markdown with `#` headings;
 * slot substitution avoids Pug treating `#` as an ID.)
 *
 * @param template The digital human template.
 * @returns The full SOUL.md markdown string (persona + BKN + pointers to archive/schedule skills).
 */
export function renderSoulMarkdown(template: DigitalHumanTemplate): string {
  const raw = readFileSync(resolveSoulTemplatePath(), "utf8");
  const de_setting = formatPersonaBlockquote(template.soul ?? "");
  const bkn_content = formatBknBlockquote(template.bkn);
  return raw
    .replaceAll(SLOT_DE_SETTING, de_setting)
    .replaceAll(SLOT_BKN_CONTENT, bkn_content);
}

/** Prefixes each line with `> ` for the persona block under “角色定义”. */
function formatPersonaBlockquote(soul: string): string {
  const t = soul.trim();
  if (!t) {
    return "";
  }
  return t
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

/** Renders BKN as a GitHub-style table inside a blockquote (`> | ...`). */
function formatBknBlockquote(bkn: BknEntry[] | undefined): string {
  if (!bkn || bkn.length === 0) {
    return "";
  }
  const rows = [
    "| 名称 | 地址 |",
    "|------|------|",
    ...bkn.map((e) => `| ${e.name} | ${e.url} |`)
  ];
  return rows.map((line) => `> ${line}`).join("\n");
}

const BKN_HEADING = "## 业务知识网络";

// ---------------------------------------------------------------------------
// Read-direction: markdown -> template
// ---------------------------------------------------------------------------

/**
 * Parses IDENTITY.md content into structured identity fields.
 *
 * Mirrors the `parseIdentityMarkdown` logic in OpenClaw
 * (`src/agents/identity-file.ts`).
 *
 * @param content The raw IDENTITY.md content.
 * @returns Parsed identity fields.
 */
export function parseIdentityMarkdown(
  content: string
): DigitalHumanTemplate["identity"] {
  const identity: DigitalHumanTemplate["identity"] = { name: "" };
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const cleaned = line.trim().replace(/^\s*-\s*/, "");
    const colonIndex = cleaned.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const label = cleaned
      .slice(0, colonIndex)
      .replace(/[*_]/g, "")
      .trim()
      .toLowerCase();
    let value = cleaned
      .slice(colonIndex + 1)
      .replace(/^[*_]+|[*_]+$/g, "")
      .trim();

    if (!value) {
      value = readIdentityContinuationValue(lines, index + 1);
    }

    if (!value) {
      continue;
    }

    switch (label) {
      case "name":
        identity.name = value;
        break;
      case "icon id":
        identity.icon_id = value;
        break;
      case "creature":
        identity.creature = value;
        break;
    }
  }

  return identity;
}

/**
 * Reads a continuation value for one identity field from following lines.
 *
 * Supports the built-in template format:
 * `- **Creature:**` on one line and the actual value on the next indented line.
 *
 * @param lines All IDENTITY.md lines.
 * @param startIndex The line index after the label line.
 * @returns The first non-empty continuation value, or an empty string.
 */
function readIdentityContinuationValue(lines: string[], startIndex: number): string {
  for (let index = startIndex; index < lines.length; index += 1) {
    const candidate = (lines[index] ?? "").trim();
    if (candidate.length === 0) {
      continue;
    }
    if (candidate.startsWith("-")) {
      return "";
    }
    return candidate.replace(/^[*_]+|[*_]+$/g, "").trim();
  }

  return "";
}

/**
 * Convenience function that parses both workspace files and merges them
 * into a complete {@link DigitalHumanTemplate}.
 *
 * @param identityContent Raw IDENTITY.md content.
 * @param soulContent Raw SOUL.md content.
 * @returns A merged template.
 */
export function mergeFilesToTemplate(
  identityContent: string,
  soulContent: string
): DigitalHumanTemplate {
  const identity = parseIdentityMarkdown(identityContent);
  const { soul, bkn } = parseSoulMarkdown(soulContent);

  return { identity, soul, ...(bkn.length > 0 ? { bkn } : {}) };
}

/**
 * Splits raw SOUL.md into soul text and BKN entries.
 *
 * If the file matches the de-agent template (`# 👤 角色定义` and/or `> **行为准则**`),
 * extracts only blockquoted persona lines as `soul`. Otherwise uses the legacy split
 * on `## 业务知识网络`. BKN rows are always parsed from the BKN section and deduped.
 */
function parseSoulMarkdown(content: string): { soul: string; bkn: BknEntry[] } {
  const bknSection = extractBknSectionForParse(content);
  const bkn = dedupeBknEntries(parseBknTable(bknSection));

  if (isDeAgentSoulFormat(content)) {
    return {
      soul: extractSoulFromDeAgentTemplate(content),
      bkn
    };
  }

  const headingIdx = content.indexOf(BKN_HEADING);
  if (headingIdx === -1) {
    return { soul: content, bkn: [] };
  }

  const soul = content.slice(0, headingIdx).trimEnd();
  return { soul, bkn };
}

/** Template-based SOUL: persona heading and/or conduct line (new format). */
function isDeAgentSoulFormat(content: string): boolean {
  return (
    content.includes(DE_AGENT_PERSONA_MARKER) ||
    content.includes(DE_AGENT_CONDUCT_LINE_PREFIX)
  );
}

/**
 * Extracts only blockquoted persona lines between the template title and `> **行为准则**`.
 * Accepts `>text` or `> text`; strips HTML comments; ignores the title line.
 */
function extractSoulFromDeAgentTemplate(content: string): string {
  let personaIdx = content.indexOf(DE_AGENT_PERSONA_MARKER);
  if (personaIdx === -1) {
    personaIdx = 0;
  }
  const conductIdx = content.indexOf(DE_AGENT_CONDUCT_LINE_PREFIX);
  const bknIdx = content.indexOf(BKN_HEADING);
  let end = content.length;
  if (conductIdx !== -1) {
    end = conductIdx;
  } else if (bknIdx !== -1) {
    end = bknIdx;
  }
  if (end < personaIdx) {
    end = personaIdx;
  }
  let block = content.slice(personaIdx, end);
  block = block.replace(/<!--[\s\S]*?-->/g, "");
  const lines = block.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (
      trimmed.startsWith("# 👤") ||
      (trimmed.startsWith("# ") &&
        (trimmed.includes("角色定义") || trimmed.includes("Custom Persona")))
    ) {
      continue;
    }
    const m = trimmed.match(/^>(\s*)(.*)$/);
    if (!m) {
      continue;
    }
    const inner = m[2];
    if (inner.startsWith("**行为准则**")) {
      continue;
    }
    out.push(inner);
  }
  return out.join("\n").trim();
}

/** Takes content starting at `## 业务知识网络` through the `---` before the unified protocol. */
function extractBknSectionForParse(content: string): string {
  const idx = content.indexOf(BKN_HEADING);
  if (idx === -1) {
    return "";
  }
  let rest = content.slice(idx);
  const dashed = rest.search(/\n---\s*\n/);
  const archive = rest.indexOf("\n## 归档与计划技能");
  let cut = rest.length;
  if (dashed !== -1) {
    cut = Math.min(cut, dashed);
  }
  if (archive !== -1) {
    cut = Math.min(cut, archive);
  }
  rest = rest.slice(0, cut);
  return rest
    .split(/\r?\n/)
    .map((l) => l.replace(/^>\s?/, "").trimEnd())
    .join("\n");
}

function parseBknTable(section: string): BknEntry[] {
  const entries: BknEntry[] = [];
  const lines = section.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) continue;

    const cells = trimmed
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());

    if (cells.length < 2) continue;
    if (cells[0] === "名称" || /^-+$/.test(cells[0])) continue;

    entries.push({ name: cells[0], url: cells[1] });
  }

  return entries;
}

function dedupeBknEntries(entries: BknEntry[]): BknEntry[] {
  const seen = new Set<string>();
  const out: BknEntry[] = [];
  for (const e of entries) {
    const key = `${e.name}\t${e.url}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(e);
  }
  return out;
}
