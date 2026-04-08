# 创建与执行计划（实现方案）

## 1. 目标与边界

**目标**：用户在 Web 侧为数字员工创建定时计划时，由 Agent 在 OpenClaw 工作区内完成 ORA 拆解与确认、将可执行细节写入 `PLAN.md`，并注册 Cron；触发执行时在**新会话**中按 `PLAN.md` 执行，并按归档协议把产出写入约定目录。

**系统分工**：

| 组件 | 职责 |
|------|------|
| Studio Web | 发起对话、展示流式回复；可选展示计划列表与运行历史（经 BE 代理） |
| Studio Backend | 会话与 Agent 调用的 HTTP/SSE 转接；`cron.list` / `cron.runs` 查询；归档文件的 HTTP 代理（见 `sessions` 路由与 `openclaw-archives-http-client`） |
| OpenClaw | Agent 运行时、工作区文件、Cron 调度、网关 RPC（`cron.*`）与可选插件 `archives-access`（`GET /v1/archives/...`） |

**不在本文范围**：Cron 的创建/更新若完全由 Agent 在 OpenClaw 侧通过工具完成，则 Studio BE 当前以**只读**方式暴露 `cron.list` / `cron.runs`（见 `studio/src/routes/plan.ts`）；若产品要求从 Studio API 创建任务，需另增设计与接口。

---

## 2. 术语对齐

- **ORA**：Objective / Result / Action，由 `schedule-plan` skill 约束；文档中曾写的「ORD」应为 ORA。
- **chatId**：从 `session_status`（或等价工具）返回的 `sessionKey` 中解析出的最后一段 UUID。SessionKey 的结构规则通常为 `agent:<agentId>:user:<userId>:direct:<chatId>`，其中最后一段作为 `chatId`。
示例：
`agent:f4f81622-f300-48b0-8710-92970fabf4d3:user:2a664704-5e18-11e3-a957-dcd2fc061e41:direct:53615cc3-f321-42eb-8eda-1f1e5c301826`
其中，`53615cc3-f321-42eb-8eda-1f1e5c301826` 部分即为 `chatId`。
- **TIMESTAMP**：写入普通归档物前执行 `date "+%Y-%m-%d-%H-%M-%S"` 生成，格式固定为 `YYYY-MM-DD-HH-MM-SS`。
- **归档路径双轨制**（相对 Agent 工作区）：
  - 计划文件：`archives/{chatId}/PLAN.md`
  - 普通产物：`archives/{chatId}/{TIMESTAMP}/{ORIGIN_NAME}`
- **Task_ID**：`PLAN.md` 内每条计划条目的稳定标识（UUID），Cron 的 message 应指向「PLAN.md 路径 + Task_ID」，便于同文件多任务共存。

---

## 3. 创建计划

### 3.1 时序（概念）

```mermaid
sequenceDiagram
  participant FE as Web
  participant BE as Studio Backend
  participant OC as OpenClaw

  FE ->> BE: 用户输入「创建 xx 定时计划」等
  BE ->> OC: POST /v1/responses（model=agent:dh_id，SSE）
  Note over OC: 数字员工加载 soul / identity<br/>（SOUL 指向 archive-protocol / schedule-plan skills）

  OC ->> OC: 新会话：解析 chatId
  OC <<-->> FE: ORA 拆解预览，多轮确认（经 BE 透传 SSE）
  OC ->> OC: 写 archives/{chatId}/PLAN.md
  OC ->> OC: 注册 Cron（payload 首条指令指向 PLAN.md + Task_ID）
  FE ->> OC: 可选：立即试跑 / 下次触发验证
```

### 3.2 步骤说明

**0. 模板与灵魂文件**

- 每个数字员工的 `SOUL.md` 由 `studio/templates/de_agent_soul.pug` 生成。当前模板不再内联长协议正文，而是显式要求：
  - 只要涉及写文件，先加载 `archive-protocol` skill，遵守 `chatId`、`TIMESTAMP`、双轨路径、回读校验与状态回执。
  - 只有在用户明确请求定时计划 / 提醒 / 自动化安排等场景时，再加载 `schedule-plan` skill，遵守 ORA、`PLAN.md` 持久化和 Cron message 首要指令。

**1. 启动会话并采集上下文**

- 加载 `SOUL.md`、`IDENTITY.md`（或项目中等价命名）。
- 调用会话状态工具，解析 **chatId**。

**2. ORA 拆解与用户确认**

- **O**：业务目标与与价值观对齐说明。
- **R**：可验收结果 / 交付物描述。
- **A**：频率、参数、执行步骤概要；**禁止**在未确认前直接创建 Cron。
- 多轮对话直到用户确认（或产品定义的明确确认动作）。

**3. 持久化 `PLAN.md`**

- 路径：`archives/{chatId}/PLAN.md`（相对工作区根）。
- 在 `PLAN.md` 中追加/更新条目，包含 **Task_ID**、`Role_Context`、`Archive_Path`、`Status`、ORA 详情、`Action_Steps` 等（以 `schedule-plan` skill 模板为准）。
- `Action_Steps` 的第 1 条必须要求执行者先从 `archives/{chatId}/PLAN.md` 读取对应 `Task_ID`。
- 同一次「计划创建」会话内，`chatId` 应与步骤 1 一致，避免 Cron 指向错误目录。

**4. 创建定时任务（OpenClaw Cron）**

- `sessionKey` / `agentId` 与当前数字员工一致（与 `OpenClawCronJob` 字段语义对齐）。
- **Cron 的 message（或等价 payload）首条指令**须可机读地包含：
  - `PLAN.md` 的归档相对路径；
  - `Task_ID`；
  - 要求 Agent **先读取**该文件对应条目再逐步执行（与 `schedule-plan` skill 一致）。
  - Cron 任务必须满足以下设定时 OpenClaw 才会在 `cron.runs` 返回 sessionKey：
    * `sessionTarget` 必须是 "isolated"
    * `payload.kind` 必须是 "agentTurn"
 
**5. 验证**

- **试跑**：由用户或运维触发一次与 Cron 等价的最小消息，检查是否读取同一 `PLAN.md` 条目并写入预期归档物。
- **观测**：通过 Studio 已提供的计划/运行查询接口观察 `cron.runs`（若网关返回）是否与预期 session 关联。

---

## 4. 执行计划

### 4.1 时序（概念）

```mermaid
sequenceDiagram
  participant SCH as OpenClaw Scheduler
  participant OC as OpenClaw Agent Runtime
  participant WS as Agent Workspace

  SCH ->> OC: 到期触发：注入 Cron payload / wake message
  OC ->> OC: 新执行会话：加载 soul / identity
  OC ->> OC: 执行态新会话，生成本轮 TIMESTAMP
  OC ->> WS: 读取 archives/{创建时_chatId}/PLAN.md
  OC ->> WS: 按 Task_ID 执行步骤；写入本轮产出
  Note over WS: 产出路径仍遵循<br/>archives/{...}/{ORIGIN_NAME}
```

### 4.2 步骤说明

1. **调度**：由 OpenClaw 内部 Cron 在到期时向指定 `agentId` / `sessionTarget` 投递任务（具体字段以网关实现为准）。
2. **新会话执行**：执行轮次通常与「创建计划时的聊天会话」不同，因此 **不得依赖聊天上下文**；唯一可信来源为 Cron 消息中携带的 `PLAN.md` 路径 + `Task_ID` 与磁盘上的 `PLAN.md`。
3. **读取与执行**：解析 `PLAN.md` 中对应 **Task_ID** 的 `Action_Steps`，逐步执行（含读取本文件、业务动作、归档校验，与 `schedule-plan` skill 一致）。
4. **归档物**：本轮产生的普通文件写入 `archives/{chatId}/{当前轮次_TIMESTAMP}/{ORIGIN_NAME}`；`PLAN.md` 仍保留在 `archives/{chatId}/PLAN.md`，不与普通产物混放。

---

## 5. 归档物管理

### 5.1 目录与命名

- **根约定**：`archives/{chatId}/`。
- **计划文件**：`archives/{chatId}/PLAN.md` 为「创建计划」会话写入的权威步骤；后续执行轮次读取该文件，不应把普通产物写回同一路径。
- **运行产物**：报告、日志摘要、导出文件等写入 `archives/{chatId}/{TIMESTAMP}/{ORIGIN_NAME}`；文件名使用可读 `ORIGIN_NAME`，避免 `..` 与绝对路径，遵循 OpenClaw 工作区沙箱。

### 5.2 与 Cron 的绑定关系

- Cron 中应同时能定位：**创建时的** `{chatId}` 与 **Task_ID**。
- 若同一 Cron 后续需要「迁移」到新版本计划，产品需定义：新 `PLAN.md` 路径 + 任务切换策略（保留旧目录只读或废弃标记）。

### 5.3 读取 PLAN.md

用户需要预览通过与数字员工对话产生的计划文件 `PLAN.md`。

通过数字员工创建计划时，会在 `{OPENCLAW_WORKSPACE_DIR}/{agentId}` 目录下创建 `archives/{chatId}/PLAN.md` 文件。

**示例：**
假设 `.env` 中配置了 `OPENCLAW_WORKSPACE_DIR=~/.openclaw/workspace`
当用户向数字员工发起指令创建计划时，产生了一个会话 SessionKey：`agent:f4f81622-f300-48b0-8710-92970fabf4d3:user:2a664704-5e18-11e3-a957-dcd2fc061e41:direct:53615cc3-f321-42eb-8eda-1f1e5c301826`。Agent 创建计划时，会从中取最后一段作为 `chatId`，并创建 `~/.openclaw/workspace/f4f81622-f300-48b0-8710-92970fabf4d3/archives/53615cc3-f321-42eb-8eda-1f1e5c301826/PLAN.md`。

获取该计划的 `PLAN.md` 流程如下：

```mermaid
sequenceDiagram

participant BE as Studio Backend(Express)
participant OC as OpenClaw

BE ->> OC: ws: "cron.list" 获取全部 jobs
BE ->> BE: 根据 planId 匹配 sessionKey
BE ->> BE: 从 sessionKey 中解析出 <agentId> 和 <chatId>
BE ->> BE: 读取 {OPENCLAW_WORKSPACE_DIR}/{agentId}/archives/<chatId>/PLAN.md
```

- 实现 HTTP 接口：GET /api/dip-studio/v1/plans/:id/content


### 5.4 Studio 侧能力（已实现方向）

- **HTTP 代理读取归档**：`GET /api/dip-studio/v1/digital-human/:dh_id/sessions/:session_id/archives/*subpath` 将请求转到网关的 `/v1/archives/...`（需网关启用 `archives-access` 并配置 token），用于 Web 预览或下载。
- **按 session 过滤列举**：插件支持 `session` 查询参数过滤目录前缀，便于列出某次计划相关的 `archives/{chatId}/` 下文件及时间分桶产物（参见 `studio/extensions/archives-access/README.md`）。
