# kweaver-web

用于统一管理应用、组件、图标、请求层与通用工具等 workspace 包。

中文 | [English](README.md)

## 目标

- 建立统一的 `apps/*` + `packages/*` monorepo 结构
- 使用 `apps/dip` 作为当前业务应用目录
- 建立 `components`、`icons`、`request`、`utils` 四类公共包
- 在 `components` 中采用 `antd` + adapter 的组件分层方式

## 目录结构

```text
.
├─ apps/
│  └─ dip/                   # 当前业务应用目录
├─ packages/
│  ├─ components/            # 基于 antd adapter 的通用组件包
│  ├─ icons/                 # 通用图标导出包
│  ├─ request/               # 通用请求层
│  └─ utils/                 # 通用工具函数包
├─ tooling/
│  ├─ tsconfig/              # 共享 TypeScript 配置
│  └─ tsup-config/           # 共享 tsup 配置工厂
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## 快速开始

```bash
pnpm install
pnpm typecheck
```

## 当前包规划

- `@kweaver-web/components`
- `@kweaver-web/icons`
- `@kweaver-web/request`
- `@kweaver-web/utils`
