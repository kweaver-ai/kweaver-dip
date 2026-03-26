# DIP OpenClaw 插件

`dip` 是一个 OpenClaw 网关扩展，当前实现只做两件事：

1. 提供 agent skills 的查询与配置接口
2. 提供工作区 `archives/` 的 HTTP 访问，以及写文件后的归档补齐

另外，插件自身打包了 3 个 skills：

- `archive-protocol`
- `schedule-plan`
- `contextloader`

## 当前实现的能力

### 1. Skills 管理

插件注册了一个 CLI 命令：

```text
/skills-manage [list | enable <name> | disable <name>]
```

当前行为：

- `list`：返回当前可发现的 skill 名称，以及全局配置中的启用状态
- `enable <name>` / `disable <name>`：写入 `openclaw` 配置里的 `skills.entries.<name>.enabled`

插件还注册了 HTTP 路由：

```text
GET    /v1/config/agents/skills
GET    /v1/config/agents/skills?agentId=<id>
POST   /v1/config/agents/skills
PUT    /v1/config/agents/skills
```

当前行为：

- `GET` 无 `agentId`：返回当前可发现的 skill 列表
- `GET` 带 `agentId`：
  - 若该 agent 在配置中显式设置了 `skills`，直接返回该值
  - 若未显式设置，则按发现逻辑返回该 agent 可见的 skills
- `POST` / `PUT`：要求 JSON body 中包含 `agentId` 与 `skills` 数组，并写回 `agents.list[].skills`

### 2. Skills 发现

当前 skill 发现逻辑按下面顺序执行：

1. 扫描仓库根目录下的 `skills/`
2. 扫描插件目录下的 `studio/extensions/dip/skills/`
3. 合并去重并排序
4. 如果本地没有发现任何 skill，则回退到 `openclaw/plugin-sdk` 的 `listSkillCommandsForAgents`

当前扫描规则：

- 识别普通目录
- 识别以 `.skill` 结尾的目录，并去掉 `.skill` 后缀作为 skill 名
- 忽略以 `.` 开头的目录

### 3. Archives 访问

插件注册了前缀路由：

```text
GET /v1/archives...
```

当前支持的访问方式：

- 直接读取当前工作区下的 `archives/`
- 通过 `?agent=<agentId>` 切换到对应 agent 的 `workspace` 下读取 `archives/`
- 通过 `?session=<sessionKey或sessionId>` 将会话标识归一化后，直接定位到对应归档目录

当前返回行为：

- 目标是目录时：返回 JSON，包含 `path` 和 `contents`
- 目标是文件时：按扩展名返回常见 MIME 类型并直接流式输出文件内容
- 不存在返回 `404`
- 路径穿越被拦截时返回 `403`

### 4. 写文件后的归档补齐

插件监听 `after_tool_call`，只在以下工具名命中时生效：

- 名称包含 `write`
- 名称包含 `edit`
- 名称包含 `replace`

当前只处理 `event.params.path`、`file` 或 `filename` 中给出的单个文件路径，并且要求：

- 文件位于当前工作区内
- 文件真实存在
- 目标是普通文件

归档规则是当前代码里真正实现的规则：

- 如果文件名是 `plan.md`，补齐到 `archives/{sessionId}/PLAN.md`
- 其他文件补齐到 `archives/{sessionId}/{YYYY-MM-DD-HH-mm-ss}/{sanitizedFileName}`

其中：

- `sessionId` 来自 `ctx.sessionKey` 最后一段，取不到时回退到 `ctx.sessionId`
- 文件名会被标准化为小写、空白转 `_`、移除非法字符，扩展名保留为小写
- 如果原路径已经符合上述规则，则不会重复复制
- 当前实现是“复制到合规归档路径”，不会移动原文件

## 当前内置 skills

### `archive-protocol`

这是一个归档约束 skill，文档中要求在涉及文件写入时遵守：

- 从 `session_status` 的 `sessionKey` 提取 `ARCHIVE_ID`
- 生成固定格式的时间戳
- `PLAN.md` 与普通产物走不同归档路径
- 写入后必须回读校验
- 输出归档状态与用于 WebUI 的卡片 JSON

注意：这些是该 skill 文档定义的操作协议，不是插件代码主动替 agent 执行的完整流程。插件代码当前只实现了上一节描述的“写文件后归档补齐”。

### `schedule-plan`

这是一个定时任务规划协议 skill，当前文档要求：

- 仅在创建定时任务、提醒、自动化安排等场景生效
- 先生成并归档 `PLAN.md`
- 用户明确确认 `PLAN.md` 后，才允许创建定时任务
- 计划中需要包含 ORA（Objective / Result / Action）结构
- 创建的任务消息首条指令应先读取 `archives/{ARCHIVE_ID}/PLAN.md`

注意：插件代码当前没有直接提供 Cron、提醒或自动化创建接口；这里只打包了该 skill 文档。

### `contextloader`

这是一个用于调用 Context Loader API 的 skill，当前文档覆盖的能力包括：

- 概念识别与 schema 检索
- 混合知识检索
- 对象实例查询
- 实例子图扩展
- 逻辑属性值查询
- 动态动作信息召回
- 知识网络构建任务状态查询

当前 skill 文档声明依赖以下环境变量：

- `APP_USER_ID`
- `CONTEXT_LOADER_BASE_URL`

推荐配置方式是在 `openclaw.json` 中设置：

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

当前插件代码本身不解析也不注入这两个变量，只是把 skill 打包出来；运行时环境注入仍由 OpenClaw 负责。

## 安装与启用

将本目录部署到 OpenClaw 扩展目录后，在配置中启用插件：

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

插件元数据定义在 `openclaw.plugin.json` 中，当前会暴露：

- 插件 id：`dip`
- 插件扩展入口：`./index.ts`
- 插件内置 skills 目录：`./skills`
