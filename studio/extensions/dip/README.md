# DIP Studio OpenClaw 插件

合并原 `skills-control` 与 `archives-access` 为单一插件，并内置 **contextloader** 技能（通过 `skills/contextloader` → 仓库 `studio/skills/contextloader` 的符号链接；`init_agents` 同步到 OpenClaw 时使用 `dereference: true` 展开为真实文件）。

实现代码位于 `src/`（`index.ts` 仅作 OpenClaw 入口并解析 `repoRoot` / `bundledSkillsDir`）。

## 功能

- **技能**：`GET`/`POST`/`PUT` `/v1/config/agents/skills`，CLI `/skills-manage`（与原先 skills-control 一致）。
- **归档**：`GET` `/v1/archives/...`，`after_tool_call` 归档整理（与原先 archives-access 一致）。
- **技能发现**：合并扫描 `studio/skills`（相对仓库根）与插件目录下 `skills/`（含 contextloader）。

## 安装

将本目录复制到 OpenClaw 扩展目录（例如 `~/.openclaw/extensions/dip`），在 `openclaw.json` 中启用：

```json
{
  "plugins": {
    "entries": {
      "dip": {
        "enabled": true
      }
    }
  }
}
```

重启 Gateway。使用本仓库时运行 `studio/scripts/init_agents/index.mjs` 会自动复制 `studio/extensions/*` 并写入插件条目（目录名即为插件 id）。

## contextloader 所需环境变量

contextloader 读取 **`APP_USER_ID`**、**`CONTEXT_LOADER_BASE_URL`**（见 `studio/skills/contextloader/SKILL.md`）。

**推荐**在 **`openclaw.json` 的 `skills.entries.contextloader.env`** 中配置（与 `enabled` 并列），例如：

```json
{
  "skills": {
    "entries": {
      "contextloader": {
        "enabled": true,
        "env": {
          "APP_USER_ID": "your-app-user-id",
          "CONTEXT_LOADER_BASE_URL": "http://agent-retrieval:30779"
        }
      }
    }
  }
}
```

也可使用：Gateway/Agent **进程环境**、WebSocket RPC **`skills.update`** 的 `env` 参数（通常会回写到 `skills.entries`）。本插件不在代码里写入这些键；由 OpenClaw 在执行时注入环境。

## HTTP 行为说明

与下列参考文档中的路径一致，网关侧由合并插件 `dip` 提供：

- `studio/docs/references/extensions-gateway-openapi/skills-control.paths.yaml`
- `studio/docs/references/extensions-gateway-openapi/archives-access.paths.yaml`
