import { describe, expect, it } from "vitest";

import {
  deriveSkillIdFromUploadedFilename,
  isDefaultDigitalHumanSkillSlug,
  isValidSkillSlug,
  mergeCreateDigitalHumanSkills
} from "./skills";

describe("deriveSkillIdFromUploadedFilename", () => {
  it("strips .skill and .zip and accepts slugs", () => {
    expect(deriveSkillIdFromUploadedFilename("weather.skill")).toBe("weather");
    expect(deriveSkillIdFromUploadedFilename("my-pack.zip")).toBe("my-pack");
    expect(deriveSkillIdFromUploadedFilename("x.SKILL")).toBe("x");
    expect(deriveSkillIdFromUploadedFilename("a.ZIP")).toBe("a");
  });

  it("uses basename only", () => {
    expect(deriveSkillIdFromUploadedFilename("/tmp/foo/bar.skill")).toBe("bar");
  });

  it("returns undefined for empty or invalid names", () => {
    expect(deriveSkillIdFromUploadedFilename("")).toBeUndefined();
    expect(deriveSkillIdFromUploadedFilename("   ")).toBeUndefined();
    expect(deriveSkillIdFromUploadedFilename("no ext")).toBeUndefined();
    expect(deriveSkillIdFromUploadedFilename("(bad).skill")).toBeUndefined();
  });
});

describe("isValidSkillSlug", () => {
  it("accepts slugs that match DIP install rules", () => {
    expect(isValidSkillSlug("weather")).toBe(true);
    expect(isValidSkillSlug("my-skill")).toBe(true);
    expect(isValidSkillSlug("a.b")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidSkillSlug("")).toBe(false);
    expect(isValidSkillSlug("bad name")).toBe(false);
    expect(isValidSkillSlug("../x")).toBe(false);
  });
});

describe("utils/skills digital-human defaults", () => {
  it("isDefaultDigitalHumanSkillSlug matches built-in slugs", () => {
    expect(isDefaultDigitalHumanSkillSlug("archive-protocol")).toBe(true);
    expect(isDefaultDigitalHumanSkillSlug("schedule-plan")).toBe(true);
    expect(isDefaultDigitalHumanSkillSlug("kweaver-core")).toBe(true);
    expect(isDefaultDigitalHumanSkillSlug("custom")).toBe(false);
  });

  it("mergeCreateDigitalHumanSkills prepends defaults and dedupes", () => {
    expect(mergeCreateDigitalHumanSkills()).toEqual([
      "archive-protocol",
      "schedule-plan",
      "kweaver-core"
    ]);
    expect(mergeCreateDigitalHumanSkills(["x"])).toEqual([
      "archive-protocol",
      "schedule-plan",
      "kweaver-core",
      "x"
    ]);
    expect(mergeCreateDigitalHumanSkills(["archive-protocol", "y"])).toEqual([
      "archive-protocol",
      "schedule-plan",
      "kweaver-core",
      "y"
    ]);
  });
});
