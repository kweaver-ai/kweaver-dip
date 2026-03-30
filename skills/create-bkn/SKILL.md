---
name: create-bkn
description: >-
  Guides creation of BKN (Business Knowledge Network) definition files following v2.0.1 spec.
  Covers network, object_type, relation_type, action_type, concept_group.
  Use when creating knowledge networks, BKN files, object types, relation types, action types,
  concept groups, or when user asks to model business knowledge in BKN format.
  When kweaver-core is also loaded, use it to run kweaver CLI (auth, bkn push) after files exist.
---

# Create BKN

Generate well-formed BKN directories (Markdown + YAML frontmatter) per v2.0.1.

## Works with kweaver-core

**create-bkn** authors the `.bkn` tree; **kweaver-core** runs `kweaver auth login` and `kweaver bkn push` / `pull` after files exist.

## What is BKN

BKN is Markdown + YAML frontmatter for schema; one file per definition under typed subfolders. Details (sections, required tables, types) live in [references/SPECIFICATION.llm.md](references/SPECIFICATION.llm.md).

## Directory layout

```
{network_dir}/
├── SKILL.md
├── network.bkn
├── CHECKSUM                 # optional; SDK may generate
├── object_types/
├── relation_types/
├── action_types/
├── concept_groups/
└── data/                    # optional CSV instance data
```

## Workflow

1. **Gather requirements** — objects, relations, actions, optional concept groups
2. **Read spec** — [references/SPECIFICATION.llm.md](references/SPECIFICATION.llm.md) (format rules, sections, frontmatter types)
3. **Pick templates** — copy/adapt from [assets/templates/](assets/templates/) (`network_type.bkn.template`, `object_type.bkn.template`, …)
4. **Create `network.bkn`** — root file; align with Network Overview
5. **Create `object_types/*.bkn`** — one file per object, `{id}.bkn`
6. **Create `relation_types/*.bkn`** — one file per relation
7. **Create `action_types/*.bkn`** — one file per action
8. **Create `concept_groups/*.bkn`** — optional
9. **Update `network.bkn`** — list all IDs in Network Overview
10. **Add root `SKILL.md` in the BKN directory** — same folder as `network.bkn` (this is **not** the create-bkn skill file); agent-facing guide for that network (see [Delivered BKN: root SKILL.md](#delivered-bkn-root-skillmd))
11. **Review (MUST)** — cross-check [Validation checklist](#validation-checklist) and [Business rules placement](#business-rules-placement); fix IDs, cross-refs, headings
12. **Validate (MUST)** — `kweaver bkn validate <dir>` (see [Validation](#validation))
13. **Import** (optional) — `kweaver bkn push <dir>`

## Import (kweaver CLI)

Requires the `kweaver` CLI from `@kweaver-ai/kweaver-sdk` (`npm install -g @kweaver-ai/kweaver-sdk`; Node.js 22+). `push` uses `tar`; on macOS `COPYFILE_DISABLE=1` is set by the tool.

- **Platform auth** — If you already have a valid token for the target platform (`kweaver auth status`), **do not** run `kweaver auth login` again. If not authenticated, run `kweaver auth login <platform-url>` first.
- **BKN validation** — If workflow step 12 (`kweaver bkn validate <dir>`) **already succeeded** for this directory, **do not** repeat validate before `push` unless you changed `.bkn` files. If you have **not** validated yet, run `validate` before `push`.

```bash
kweaver bkn push <dir> [--branch main] [-bd <business-domain>]
```

`-bd` / `--biz-domain` is optional. If you omit it, the CLI resolves the business domain automatically (`KWEAVER_BUSINESS_DOMAIN` env, then saved platform config in `~/.kweaver`, otherwise `bd_public`).

Export: `kweaver bkn pull <kn-id> [<dir>]`. More subcommands: `kweaver bkn --help` (see kweaver-core skill if loaded).

## Validation

`kweaver bkn validate <dir>` — must pass before delivery or upload. It loads `network.bkn` and sibling `.bkn` files. Success prints counts; on failure fix `.bkn` files and re-run.

## Per-type reference

| Kind | Spec (section) | Template | Example (k8s) |
|------|------------------|----------|---------------|
| Network | `knowledge_network` in spec | [assets/templates/network_type.bkn.template](assets/templates/network_type.bkn.template) | [references/examples/k8s-network/network.bkn](references/examples/k8s-network/network.bkn) |
| Object | `object_type` | [assets/templates/object_type.bkn.template](assets/templates/object_type.bkn.template) | [references/examples/k8s-network/object_types/pod.bkn](references/examples/k8s-network/object_types/pod.bkn) |
| Relation | `relation_type` | [assets/templates/relation_type.bkn.template](assets/templates/relation_type.bkn.template) | [references/examples/k8s-network/relation_types/pod_belongs_node.bkn](references/examples/k8s-network/relation_types/pod_belongs_node.bkn) |
| Action | `action_type` | [assets/templates/action_type.bkn.template](assets/templates/action_type.bkn.template) | [references/examples/k8s-network/action_types/restart_pod.bkn](references/examples/k8s-network/action_types/restart_pod.bkn) |
| Concept group | `concept_group` | [assets/templates/concept_group.bkn.template](assets/templates/concept_group.bkn.template) | [references/examples/k8s-network/concept_groups/k8s.bkn](references/examples/k8s-network/concept_groups/k8s.bkn) |

Full rules and optional sections: [references/SPECIFICATION.llm.md](references/SPECIFICATION.llm.md).

## Naming conventions

- **ID**: lowercase, digits, underscores; **file**: `{id}.bkn` under the matching folder
- **Headings**: `#` network title, `##` type block, `###` section, `####` logic property
- **Frontmatter**: at least `type`, `id`, `name` (see spec for each type)

## Business rules placement

Rules must sit in spec-defined places so import persists them. Full wording: [references/SPECIFICATION.llm.md](references/SPECIFICATION.llm.md#输出规则).

- **Network-level** — prose in `network.bkn` right after `# {title}` (before structured sections like `## Network Overview`)
- **Type-level** — prose in each type file after `## ObjectType:` / `## RelationType:` / … and **before** the first `###`; never in frontmatter
- **Property-level** — in **Data Properties** table **Description** column
- **No extra sections** — do not add Markdown outside the standard sections; parsers may drop unparsed content on import

## Validation checklist

- [ ] `network.bkn` at root; frontmatter matches spec
- [ ] Every `.bkn` has valid YAML frontmatter (`type`, `id`, `name`)
- [ ] Files live under folders matching `type` (`object_types/`, `relation_types/`, …); filename = `{id}.bkn`
- [ ] Network Overview lists **all** definition IDs — no missing/extra
- [ ] Relations/actions reference existing object-type IDs; concept groups list only existing objects
- [ ] Parameter binding `Source` ∈ `property` | `input` | `const`; YAML blocks (e.g. trigger) parse
- [ ] Heading hierarchy has no skipped levels
- [ ] Business rules only in allowed places (see [Business rules placement](#business-rules-placement))

## Output rules

1. Emit raw `.bkn` content — do not wrap the whole file in a fenced `markdown` block
2. Reuse IDs consistently across relations/actions
3. IDs: lowercase + underscores; display text Chinese unless asked otherwise
4. Keep heading order per spec

## Examples

- [references/examples/k8s-network/](references/examples/k8s-network/) — modular sample (objects, relations, actions, concept group)

## Delivered BKN: root SKILL.md

When you build a knowledge network directory `{network_dir}/`, add `{network_dir}/SKILL.md` at the root (alongside `network.bkn`). Short overview + **index tables with file paths** (object | path | relation | path | action | path) so agents route to the right `.bkn` without scanning. Optional: topology sketch, usage scenarios. Example: [references/examples/k8s-network/SKILL.md](references/examples/k8s-network/SKILL.md).
