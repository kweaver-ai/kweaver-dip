# kweaver-web

Intended to manage apps, shared components, icons, request capabilities,
and utility packages in a unified workspace.

[中文](README.zh_CN.md) | English

## Goals

- Establish a standard `apps/*` + `packages/*` monorepo layout
- Use `apps/dip` as the current business app workspace
- Prepare shared packages for `components`, `icons`, `request`, and `utils`
- Build `components` with an `antd`-based adapter layer

## Repository structure

```text
.
├─ apps/
│  └─ dip/                   # Current business app workspace
├─ packages/
│  ├─ components/            # Shared component package with antd adapters
│  ├─ icons/                 # Shared icon exports
│  ├─ request/               # Shared request layer
│  └─ utils/                 # Shared utility functions
├─ tooling/
│  ├─ tsconfig/              # Shared TypeScript configs
│  └─ tsup-config/           # Shared tsup config factory
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```


## Quick start

```bash
pnpm install
pnpm typecheck
```

## Package plan

- `@kweaver-web/components`
- `@kweaver-web/icons`
- `@kweaver-web/request`
- `@kweaver-web/utils`
