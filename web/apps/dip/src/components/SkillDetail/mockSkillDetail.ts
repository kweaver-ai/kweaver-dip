import type { DigitalHumanSkill, SkillFileContentResponse, SkillTreeResponse } from '@/apis'

/** 设为 `true` 时使用本地 mock 预览技能详情；接好接口后改为 `false` */
export const SKILL_DETAIL_USE_MOCK = false

const MOCK_DELAY_MS = 380

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS)
  })
}

/**
 * 与本地 openclaw-test 技能包中 SKILL.md 一致（用于 mock 默认 SKILL.md 预览）
 * 来源：openclaw-test/skills/openclaw-test/SKILL.md
 */
const MOCK_SKILL_MD_OPENCLAW_TEST = `---
name: openclaw-test

description: A test skill for openclaw. Use this whenever the user mentions openclaw, asks for openclaw testing, or needs to verify that skill functionality works.

---

# OpenClaw Test Skill

This is a simple test skill created for verifying the skill system works correctly with OpenClaw.

## What it does

When triggered, this skill:
1. Greets the OpenClaw user
2. Displays some basic system information
3. Demonstrates that skills can be properly loaded and triggered
4. Provides a template for creating more complex skills

## Usage

When this skill is triggered, always respond with:

1. A friendly welcome message mentioning OpenClaw
2. The current working directory
3. Confirmation that the skill loaded successfully
4. An invitation to create more complex skills if needed

## Example response

\`\`\`
Hello OpenClaw! 👋

The \`openclaw-test\` skill has been successfully loaded and triggered.

- Current working directory: \`/path/to/current/dir\`
- Skill location: \`/Users/xiaolin/.claude/plugins/.../openclaw-test/\`

This is just a test skill. You can now create more complex skills for specific tasks!
\`\`\`

## When to use

- User mentions "openclaw" in their message
- User asks to test the skill system
- User wants to verify that a new skill installation works
- User is learning how to create skills for Claude Code
`

function buildMockSkillTree(skillName: string): SkillTreeResponse {
  const root = skillName || 'mock-skill'
  return {
    name: root,
    entries: [
      {
        name: 'SKILL.md',
        path: 'SKILL.md',
        type: 'file',
      },
      {
        name: 'docs',
        path: 'docs',
        type: 'directory',
        children: [
          { name: 'guide.md', path: 'docs/guide.md', type: 'file' },
          { name: 'notes.txt', path: 'docs/notes.txt', type: 'file' },
        ],
      },
      {
        name: 'scripts',
        path: 'scripts',
        type: 'directory',
        children: [{ name: 'run.sh', path: 'scripts/run.sh', type: 'file' }],
      },
    ],
  }
}

function buildMockSkillMd(): string {
  return MOCK_SKILL_MD_OPENCLAW_TEST
}

/** 模拟技能列表：与当前路由技能名对齐，便于详情页通过「存在性」校验 */
export function mockFetchEnabledSkills(decodedName: string): Promise<DigitalHumanSkill[]> {
  const name = decodedName.trim() || 'mock-skill'
  return delay([
    {
      name,
      description: 'Mock：技能描述与 OpenAPI 字段对齐',
      built_in: false,
      type: 'openclaw-managed',
    },
  ])
}

/** 模拟目录树 */
export function mockFetchSkillTree(skillName: string): Promise<SkillTreeResponse> {
  return delay(buildMockSkillTree(skillName))
}

/** 模拟文件预览（含默认 SKILL.md 与若干子路径） */
export function mockFetchSkillFileContent(
  skillName: string,
  params?: { path?: string },
): Promise<SkillFileContentResponse> {
  const rel = (params?.path ?? 'SKILL.md').replace(/\\/g, '/')
  const name = skillName || 'mock-skill'

  let content: string
  if (rel === 'SKILL.md' || rel === '') {
    content = buildMockSkillMd()
  } else if (rel.endsWith('.md')) {
    content = `# ${rel}\n\nMock markdown body for **${name}**.`
  } else {
    content = `Mock text file: ${rel}\n(skill: ${name})`
  }

  const body = content
  const res: SkillFileContentResponse = {
    name,
    path: rel || 'SKILL.md',
    content: body,
    bytes: new TextEncoder().encode(body).length,
    truncated: false,
  }
  return delay(res)
}
