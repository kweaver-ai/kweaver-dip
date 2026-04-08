# init_agents

`studio/scripts/init_agents/index.mjs` 用于初始化 OpenClaw 内置智能体的运行环境。

**运行依赖**：只使用 **Node.js 内置模块**（不依赖 `npm install`、不需要 `dotenv` 等任何 npm 包）。可直接 `node scripts/init_agents/index.mjs`（在 `studio` 目录下）或 `node <脚本的绝对路径>`。若把脚本拷到仓库外，默认的 `OPENCLAW_BUILT_IN_DIR`、`OPENCLAW_EXTENSIONS_DIR` 以及默认 `.env` 路径（相对脚本文件上溯两级目录下的 `.env`）将不再指向本仓库，请通过 **`OPENCLAW_*` / `INIT_AGENTS_DOTENV_PATH`** 显式指定。

当前脚本负责四件事：

1. 从 `studio/built-in` 读取内置智能体定义
2. 将内置智能体写入 `openclaw.json`
3. 将 `SOUL.md` 和 `IDENTITY.md` 同步到智能体 workspace
4. 同步鉴权文件，并复制和开启 `extensions` 目录下的全部插件

## 目录约定

脚本只扫描 `studio/built-in/*/metadata.json`。

每个内置智能体目录至少包含：

```text
studio/built-in/<agent-name>/
  metadata.json
  SOUL.md
  IDENTITY.md
```

其中：

- `metadata.json` 是运行态配置入口
- `SOUL.md` 会被同步到目标 workspace
- `IDENTITY.md` 会被同步到目标 workspace

## metadata 约束

当前脚本会校验以下字段：

- `type` 必须为 `"agent"`
- `is_builtin` 必须为 `true`
- `id` 必须为非空字符串
- `name` 必须为非空字符串

最小示例：

```json
{
  "type": "agent",
  "id": "__internal_skill_agent__",
  "name": "SkillAgent",
  "is_builtin": true
}
```

如果需要把 `sandbox`、`tools` 一并写入 `openclaw.json`，可以直接放在 `metadata.json` 中，脚本会原样读取。

## workspace 规则

脚本会将内置智能体 workspace 解析为：

```text
<OPENCLAW_WORKSPACE_DIR>/<metadata.id>
```

如果未设置 `OPENCLAW_WORKSPACE_DIR`，默认使用：

```text
<OPENCLAW_ROOT_DIR>/<metadata.id>
```

路径默认值见下文 **「环境变量」** 中的 `OPENCLAW_*` 说明。

## openclaw.json 写入规则

脚本会读取：

```text
<OPENCLAW_ROOT_DIR>/openclaw.json
```

然后将 `built-in` 中的 agent 逐个 upsert 到：

```json
{
  "agents": {
    "list": []
  }
}
```

同时强制开启：

- `plugins.entries` 中来自本地 `extensions` 目录的全部插件（当前为合并插件 `dip`，含原 skills-control、archives-access 能力与插件内 `contextloader` 技能目录）

插件同步使用 `fs.cpSync(..., { dereference: true })`，以便将 `dip/skills/contextloader` 等符号链接展开为实际文件复制到 OpenClaw 状态目录。

脚本**不会**写入或修改 `openclaw.json` 中的 `skills.entries.contextloader`；该项如需使用请自行配置。

## 鉴权同步规则

脚本会尝试将：

```text
<OPENCLAW_ROOT_DIR>/agents/main/agent/auth-profiles.json
```

复制到每个内置智能体的：

```text
<OPENCLAW_ROOT_DIR>/agents/<agent-id>/agent/auth-profiles.json
```

如果主账号鉴权文件不存在，当前实现只打印 warning，不做进一步 fallback。

## 运行方式

方式 1：进入 `studio` 目录后执行：

```bash
npm run init:agents
```

方式 2：在仓库根目录执行：

```bash
npm --prefix studio run init:agents
```

方式 3：不经过 npm、也不要求本仓库已 `npm install`（仅需已安装 Node）：

```bash
node studio/scripts/init_agents/index.mjs
```

（在仓库根目录执行时路径按你的检出位置调整。）

## 环境变量

脚本在**本次进程**中主要使用决定路径与要读写的文件的环境变量（见下表 `OPENCLAW_*` 等）。可选加载 **`studio/.env`** 以便与本地开发习惯一致。

### `.env` 文件

可以。把上表中的变量写进 **`studio/.env`**（与后端服务共用同一文件即可），然后在 `studio` 目录执行 `npm run init:agents`，或在任意目录执行 `npm --prefix studio run init:agents`；脚本会按**文件路径**定位 `studio/.env`（与当前工作目录无关），在读取 `OPENCLAW_*` 等之前先加载。

- `.env` 由脚本**内置的简单解析**加载（`KEY=value`、`export KEY=value`、支持单行引号包裹）；仅当文件**存在**时才加载，并打印 `[配置] 已从 .env 加载: <路径>`。
- **已在环境中的变量不被覆盖**（与在 shell 里先 `export` 再执行效果一致：shell 里的值优先）。
- 若 `.env` 不在默认位置，可在执行前导出 **`INIT_AGENTS_DOTENV_PATH`**（绝对路径或相对**当前工作目录**的路径）指向要加载的文件。该变量必须在进程里已有，因此一般通过 shell 设置，而不是写进被加载的同一个 `.env` 的首行（除非你分两步执行）。

### OpenClaw 路径与目录（`OPENCLAW_*`）

| 变量 | 作用 | 未设置时的默认 |
| --- | --- | --- |
| `OPENCLAW_ROOT_DIR` | 状态根目录：`openclaw.json`、`agents/main/agent/auth-profiles.json`、插件复制目标等 | `~/.openclaw` |
| `OPENCLAW_BUILT_IN_DIR` | 内置智能体定义（`metadata.json`、`SOUL.md`、`IDENTITY.md`） | 脚本文件上两级目录下的 `built-in`（本仓库布局下即 `studio/built-in`） |
| `OPENCLAW_WORKSPACE_DIR` | 各 agent workspace 根；实际目录为 `<该目录>/<agent-id>` | 与 `OPENCLAW_ROOT_DIR` 相同 |
| `OPENCLAW_EXTENSIONS_DIR` | 要复制并注册到 `plugins.entries` 的扩展源码目录 | 脚本文件上两级目录下的 `extensions`（本仓库布局下即 `studio/extensions`） |

### 执行示例

仅改状态目录：

```bash
OPENCLAW_ROOT_DIR=/data/openclaw npm --prefix studio run init:agents
```

路径类全开（典型自建部署）：

```bash
OPENCLAW_ROOT_DIR=/data/openclaw \
OPENCLAW_BUILT_IN_DIR=/path/to/dip-studio/studio/built-in \
OPENCLAW_WORKSPACE_DIR=/data/openclaw/workspace \
OPENCLAW_EXTENSIONS_DIR=/path/to/dip-studio/studio/extensions \
npm --prefix studio run init:agents
```

CI 或 shell 中可先 `export` 再执行 `npm --prefix studio run init:agents`，变量与上表相同。

等价地，也可把相同键写入 **`studio/.env`** 后直接执行上述 `npm` 命令（无需再手写一长串前缀）。

## 当前限制

- 脚本只处理 `built-in` 目录中的内置智能体
- 脚本只复制 `extensions` 目录下的一级子目录作为插件
- 没有 `metadata.json` 的目录会被忽略
- `metadata.json` 不合法会直接报错退出
- `sandbox` 和 `tools` 不做默认补全，由 `metadata.json` 自己决定
