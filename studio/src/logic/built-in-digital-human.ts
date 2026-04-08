import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { HttpError } from "../errors/http-error";
import type {
  BuiltInDigitalHumanList,
  CreateDigitalHumanResult,
  DigitalHumanDetail
} from "../types/digital-human";
import type { AgentSkillsLogic } from "./agent-skills";
import type { DigitalHumanLogic } from "./digital-human";
import { mergeFilesToTemplate } from "./digital-human-template";

/**
 * Parsed metadata payload supported by built-in digital human discovery.
 */
interface ParsedBuiltInMetadata {
  type?: string;
  id?: string;
  name?: string;
  description?: string;
  is_builtin?: boolean;
}

/**
 * Parsed built-in digital human definition loaded from disk.
 */
export interface BuiltInDigitalHumanDefinition {
  /**
   * Stable built-in template identifier.
   */
  id: string;

  /**
   * Human-readable template name.
   */
  name: string;

  /**
   * Human-readable template description.
   */
  description?: string;

  /**
   * Absolute directory path of the built-in template.
   */
  directory: string;

  /**
   * Absolute path to the built-in IDENTITY.md file.
   */
  identityPath: string;

  /**
   * Absolute path to the built-in SOUL.md file.
   */
  soulPath: string;

  /**
   * Absolute path to the optional built-in avatar image file.
   */
  avatarPath?: string;

  /**
   * Absolute paths to packaged `.skill` archives to install first.
   */
  skillPaths: string[];
}

/**
 * File-system backed built-in digital human catalog.
 */
export interface BuiltInDigitalHumanLogic {
  /**
   * Lists all discoverable built-in digital human templates.
   *
   * @returns Public built-in template summaries.
   */
  listBuiltInDigitalHumans(): Promise<BuiltInDigitalHumanList>;

  /**
   * Loads and validates one or more built-in digital human definitions by id.
   *
   * @param ids Stable built-in template identifiers.
   * @returns Materialized definitions in the same order as requested ids.
   */
  getBuiltInDigitalHumanDefinitions(
    ids: string[]
  ): Promise<BuiltInDigitalHumanDefinition[]>;

  /**
   * Installs packaged skills and creates or updates digital humans from built-in templates.
   *
   * @param ids Built-in template ids to materialize.
   * @param dependencies Runtime services used to install skills and create agents.
   * @returns The created or updated digital human payloads.
   */
  createBuiltInDigitalHumans(
    ids: string[],
    dependencies: {
      agentSkillsLogic: AgentSkillsLogic;
      digitalHumanLogic: DigitalHumanLogic;
    }
  ): Promise<CreateDigitalHumanResult[]>;
}

/**
 * Options used to construct the built-in digital human catalog.
 */
export interface BuiltInDigitalHumanLogicOptions {
  /**
   * Root directory that contains built-in digital human subdirectories.
   */
  builtInRootDir?: string;
}

/**
 * Default implementation backed by the local `built-in/` directory.
 */
export class DefaultBuiltInDigitalHumanLogic implements BuiltInDigitalHumanLogic {
  private readonly builtInRootDir: string;

  /**
   * Creates the catalog service.
   *
   * @param options Optional root directory override.
   */
  public constructor(options: BuiltInDigitalHumanLogicOptions = {}) {
    this.builtInRootDir = options.builtInRootDir ?? join(process.cwd(), "built-in");
  }

  /**
   * Lists discoverable built-in digital human templates.
   *
   * @returns Public template summaries.
   */
  public async listBuiltInDigitalHumans(): Promise<BuiltInDigitalHumanList> {
    const definitions = await this.loadDefinitions();

    return definitions.map((definition) => ({
      id: definition.id,
      name: definition.name,
      description: definition.description
    }));
  }

  /**
   * Loads one or more built-in digital human definitions by id.
   *
   * @param ids Stable template ids.
   * @returns Materialized definitions.
   */
  public async getBuiltInDigitalHumanDefinitions(
    ids: string[]
  ): Promise<BuiltInDigitalHumanDefinition[]> {
    const normalizedIds = uniqueNonEmptyStrings(ids);
    if (normalizedIds.length === 0) {
      return [];
    }

    const definitions = await this.loadDefinitions();
    const definitionMap = new Map(
      definitions.map((definition) => [definition.id, definition] as const)
    );

    return normalizedIds.map((id) => {
      const definition = definitionMap.get(id);
      if (definition === undefined) {
        throw new HttpError(400, `Unknown built-in digital human id: ${id}`);
      }
      return definition;
    });
  }

  /**
   * Installs packaged skills and creates or updates agents from built-in templates.
   *
   * @param ids Built-in template ids.
   * @param dependencies Runtime collaborators.
   * @returns Created or updated digital human payloads.
   */
  public async createBuiltInDigitalHumans(
    ids: string[],
    dependencies: {
      agentSkillsLogic: AgentSkillsLogic;
      digitalHumanLogic: DigitalHumanLogic;
    }
  ): Promise<CreateDigitalHumanResult[]> {
    const definitions = await this.getBuiltInDigitalHumanDefinitions(ids);
    const results: CreateDigitalHumanResult[] = [];

    for (const definition of definitions) {
      const installedSkills = await installBuiltInSkills(
        definition,
        dependencies.agentSkillsLogic
      );
      const [identityContent, soulContent] = await Promise.all([
        readFile(definition.identityPath, "utf8"),
        readFile(definition.soulPath, "utf8")
      ]);
      const template = mergeFilesToTemplate(identityContent, soulContent);
      const resolvedIconId = await resolveBuiltInIconId(
        definition,
        template.identity.icon_id
      );
      const existing = await getExistingBuiltInDigitalHuman(
        dependencies.digitalHumanLogic,
        definition.id
      );

      if (existing === undefined) {
        results.push(
          await dependencies.digitalHumanLogic.createDigitalHuman({
            id: definition.id,
            name: template.identity.name || definition.name,
            creature: template.identity.creature,
            icon_id: resolvedIconId,
            soul: template.soul,
            bkn: template.bkn,
            skills: installedSkills
          })
        );
        continue;
      }

      results.push(
        await dependencies.digitalHumanLogic.updateDigitalHuman(definition.id, {
          name: template.identity.name || definition.name,
          creature: template.identity.creature,
          icon_id: resolvedIconId,
          soul: template.soul,
          bkn: template.bkn,
          skills: mergeSkillNames(existing.skills, installedSkills)
        })
      );
    }

    return results;
  }

  /**
   * Recursively scans the built-in root directory and materializes valid
   * digital human definitions.
   *
   * @returns All valid definitions sorted by name then id.
   */
  private async loadDefinitions(): Promise<BuiltInDigitalHumanDefinition[]> {
    const directories = await walkDirectories(this.builtInRootDir);
    const definitions: BuiltInDigitalHumanDefinition[] = [];

    for (const directory of directories) {
      const definition = await loadDefinitionFromDirectory(directory);
      if (definition !== undefined) {
        definitions.push(definition);
      }
    }

    return definitions.sort((left, right) =>
      left.name.localeCompare(right.name, "zh-Hans-CN") ||
      left.id.localeCompare(right.id, "en")
    );
  }
}

/**
 * Recursively collects directories under one root, including the root itself.
 *
 * @param rootDir The directory to walk.
 * @returns Absolute directory paths.
 */
export async function walkDirectories(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const results = [rootDir];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const childDir = join(rootDir, entry.name);
    results.push(...await walkDirectories(childDir));
  }

  return results;
}

/**
 * Reads one directory and returns a built-in digital human definition when the
 * metadata marks it as `type: digital-human`.
 *
 * @param directory Directory to inspect.
 * @returns The resolved definition, or `undefined` when the directory is not a template.
 */
export async function loadDefinitionFromDirectory(
  directory: string
): Promise<BuiltInDigitalHumanDefinition | undefined> {
  const metadata = await readBuiltInMetadata(directory);
  if (metadata?.type !== "digital-human" || metadata.is_builtin !== true) {
    return undefined;
  }

  const id = normalizeRequiredMetadataString(metadata.id, "id", directory);
  const name = normalizeRequiredMetadataString(metadata.name, "name", directory);
  const identityPath = join(directory, "IDENTITY.md");
  const soulPath = join(directory, "SOUL.md");
  const avatarPath = join(directory, "avatar.png");

  let skillPaths: string[] = [];
  try {
    const skillEntries = await readdir(join(directory, "skills"), { withFileTypes: true });
    skillPaths = skillEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".skill"))
      .map((entry) => join(directory, "skills", entry.name))
      .sort((left, right) => left.localeCompare(right, "en"));
  } catch {
    skillPaths = [];
  }

  return {
    id,
    name,
    description: normalizeOptionalMetadataString(metadata.description),
    directory,
    identityPath,
    soulPath,
    avatarPath,
    skillPaths
  };
}

/**
 * Loads one supported built-in metadata file from a directory.
 *
 * @param directory Directory to inspect.
 * @returns The parsed metadata, or `undefined` when absent.
 */
export async function readBuiltInMetadata(
  directory: string
): Promise<ParsedBuiltInMetadata | undefined> {
  const metadataJsonPath = join(directory, "metadata.json");
  try {
    return parseBuiltInJson(await readFile(metadataJsonPath, "utf8"));
  } catch {
    return undefined;
  }
}

/**
 * Parses one JSON built-in metadata payload.
 *
 * @param raw Raw JSON content.
 * @returns The normalized metadata object.
 */
export function parseBuiltInJson(raw: string): ParsedBuiltInMetadata {
  return JSON.parse(raw) as ParsedBuiltInMetadata;
}

/**
 * Normalizes a required metadata field.
 *
 * @param value Candidate field value.
 * @param fieldName Metadata field name.
 * @param directory Source directory.
 * @returns Trimmed string value.
 */
function normalizeRequiredMetadataString(
  value: string | undefined,
  fieldName: string,
  directory: string
): string {
  const normalized = normalizeOptionalMetadataString(value);
  if (normalized === undefined) {
    throw new HttpError(500, `Missing built-in digital human ${fieldName} in ${directory}`);
  }
  return normalized;
}

/**
 * Normalizes an optional metadata field.
 *
 * @param value Candidate field value.
 * @returns Trimmed string when present, otherwise `undefined`.
 */
function normalizeOptionalMetadataString(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Removes empty strings and preserves first-seen order.
 *
 * @param values Candidate ids.
 * @returns Unique, trimmed identifiers.
 */
function uniqueNonEmptyStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

/**
 * Installs all packaged skills referenced by one built-in digital human definition.
 *
 * @param definition The built-in digital human definition.
 * @param agentSkillsLogic Logic used to upload packaged skills.
 * @returns Installed skill names in archive order.
 */
async function installBuiltInSkills(
  definition: BuiltInDigitalHumanDefinition,
  agentSkillsLogic: AgentSkillsLogic
): Promise<string[]> {
  const installedSkills: string[] = [];

  for (const skillPath of definition.skillPaths) {
    const archive = await readFile(skillPath);
    const installResult = await agentSkillsLogic.installSkill(archive, {
      overwrite: true,
      name: basename(skillPath, ".skill")
    });
    installedSkills.push(installResult.name);
  }

  return installedSkills;
}

/**
 * Reads the current digital human by id and converts 404 into `undefined`.
 *
 * @param digitalHumanLogic Logic used to query existing digital humans.
 * @param id Stable built-in digital human id.
 * @returns Existing digital human detail when found.
 */
async function getExistingBuiltInDigitalHuman(
  digitalHumanLogic: DigitalHumanLogic,
  id: string
): Promise<DigitalHumanDetail | undefined> {
  try {
    return await digitalHumanLogic.getDigitalHuman(id);
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 404) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Merges current and newly installed skill names preserving first-seen order.
 *
 * @param currentSkills Skills already bound to the digital human.
 * @param installedSkills Skills installed from the built-in package.
 * @returns Deduplicated merged skill names.
 */
function mergeSkillNames(
  currentSkills: string[] | undefined,
  installedSkills: string[]
): string[] {
  return uniqueNonEmptyStrings([...(currentSkills ?? []), ...installedSkills]);
}

/**
 * Resolves the icon payload for one built-in template.
 * When `avatar.png` exists beside the template files, its raw bytes are encoded
 * as base64 and sent through `icon_id`; otherwise the IDENTITY.md value is used.
 *
 * @param definition Built-in template definition.
 * @param fallbackIconId Icon value parsed from IDENTITY.md.
 * @returns Base64 avatar payload or the fallback icon id.
 */
async function resolveBuiltInIconId(
  definition: BuiltInDigitalHumanDefinition,
  fallbackIconId: string | undefined
): Promise<string | undefined> {
  if (!definition.avatarPath) {
    return fallbackIconId;
  }

  try {
    const avatar = await readFile(definition.avatarPath);
    return avatar.toString("base64");
  } catch {
    return fallbackIconId;
  }
}
