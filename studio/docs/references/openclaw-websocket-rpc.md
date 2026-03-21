# OpenClaw Gateway WebSocket RPC

本文根据 `src/gateway/server-methods.ts` 及各 handler/协议 schema 整理，覆盖当前 Gateway 实际注册的全部 WebSocket RPC `method`。

## 说明

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。
- `connect` 是握手阶段专用方法，只能作为首个请求发送。

## Handshake / Session

| Method | Params | Method 说明 |
| --- | --- | --- |
| `connect` | `minProtocol*`: integer，客户端要求的最低协议版本。<br>`maxProtocol*`: integer，客户端支持的最高协议版本。<br>`client*`: object{id*:"webchat-ui" \| "openclaw-control-ui" \| "webchat" \| "cli" \| "gateway-client" \| "openclaw-macos" \| "openclaw-i…，客户端身份元数据。<br>`caps`: string[]，客户端声明能力。<br>`commands`: string[]，客户端声明命令列表。<br>`permissions`: object，权限映射。<br>`pathEnv`: string，节点 PATH 环境。<br>`role`: string，客户端角色。<br>`scopes`: string[]，scope 列表。<br>`device`: object{id*:string, publicKey*:string, signature*:string, signedAt*:integer, ...}，设备签名身份。<br>`auth`: object{token:string, bootstrapToken:string, deviceToken:string, password:string}，握手认证信息。<br>`locale`: string，语言地区。<br>`userAgent`: string，用户代理。 | WebSocket 建连后的首个 RPC，请求协商协议版本、上报客户端信息并完成鉴权。 |
| `health` | `probe`: boolean，为 `true` 时强制主动探测；否则优先返回缓存快照 | 读取 Gateway 健康快照。 |
| `status` | 无参数；依赖当前连接上下文。 | 返回 CLI 风格的综合状态摘要。 |
| `gateway.identity.get` | 无参数；依赖当前连接上下文。 | 返回 Gateway 设备身份与公钥。 |
| `last-heartbeat` | 无参数；依赖当前连接上下文。 | 返回最近一次 heartbeat 事件。 |
| `set-heartbeats` | `enabled*`: boolean，是否启用 heartbeat runner | 开启或关闭心跳上报。 |
| `system-presence` | 无参数；依赖当前连接上下文。 | 列出当前系统 presence 条目。 |
| `system-event` | `text*`: string，事件正文<br>`deviceId`: string，设备 ID<br>`instanceId`: string，实例 ID<br>`host`: string，主机名<br>`ip`: string，IP 地址<br>`mode`: string，运行模式<br>`version`: string，版本号<br>`platform`: string，平台<br>`deviceFamily`: string，设备家族<br>`modelIdentifier`: string，型号标识<br>`lastInputSeconds`: number，距上次输入的秒数<br>`reason`: string，原因标签<br>`roles`: string[]，角色列表<br>`scopes`: string[]，scope 列表<br>`tags`: string[]，标签列表 | 写入一条系统事件，并在需要时刷新 presence 广播。 |

## Agent / Chat

| Method | Params | Method 说明 |
| --- | --- | --- |
| `agent` | `message*`: string，消息正文。<br>`agentId`: string，agent ID。<br>`to`: string，发送目标。<br>`replyTo`: string，回复目标。<br>`sessionId`: string，会话 ID。<br>`sessionKey`: string，会话 key。<br>`thinking`: string，thinking 模式。<br>`deliver`: boolean，是否把结果投递回外部渠道。<br>`attachments`: unknown[]，附件数组。<br>`channel`: string，消息或操作所属渠道。<br>`replyChannel`: string，回复所用渠道。<br>`accountId`: string，目标账号 ID。<br>`replyAccountId`: string，回复所用账号 ID。<br>`threadId`: string，线程/话题 ID。<br>`groupId`: string，分组 ID。<br>`groupChannel`: string，分组所属渠道。<br>`groupSpace`: string，分组空间。<br>`timeout`: integer，超时秒数或通用超时。<br>`bestEffortDeliver`: boolean，投递失败时是否尽力而为。<br>`lane`: string，执行 lane。<br>`extraSystemPrompt`: string，附加 system prompt。<br>`internalEvents`: object{type*:"task_completion", source*:"subagent" \| "cron", childSessionKey*:string, childSessionId:string, ...}[]，内部事件列表。<br>`inputProvenance`: object{kind*:"external_user" \| "inter_session" \| "internal_system", originSessionId:string, sourceSessionKey:string, so…，输入来源信息。<br>`idempotencyKey*`: string，幂等键，用于请求去重。<br>`label`: string，展示标签。 | 创建一次 agent 运行，可选投递到外部渠道。 |
| `agent.identity.get` | `agentId`: string，agent ID。<br>`sessionKey`: string，会话 key。 | 读取默认 agent 的身份信息。 |
| `agent.wait` | `runId*`: string，运行 ID。<br>`timeoutMs`: integer，超时毫秒数。 | 等待指定 agent run 结束。 |
| `chat.history` | `sessionKey*`: string，会话 key。<br>`limit`: integer，结果数量上限。 | 读取某个 WebChat 会话的历史消息。 |
| `chat.abort` | `sessionKey*`: string，会话 key。<br>`runId`: string，运行 ID。 | 中止一个进行中的 chat run。 |
| `chat.send` | `sessionKey*`: string，会话 key。<br>`message*`: string，消息正文。<br>`thinking`: string，thinking 模式。<br>`deliver`: boolean，是否把结果投递回外部渠道。<br>`attachments`: unknown[]，附件数组。<br>`timeoutMs`: integer，超时毫秒数。<br>`systemInputProvenance`: object{kind*:"external_user" \| "inter_session" \| "internal_system", originSessionId:string, sourceSessionKey:string, so…，系统级输入来源。<br>`systemProvenanceReceipt`: string，来源回执。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 向指定 session 发送一条 chat 消息。 |
| `chat.inject` | `sessionKey*`: string，会话 key。<br>`message*`: string，消息正文。<br>`label`: string，展示标签。 | 向会话直接注入消息或事件。 |
| `send` | `to*`: string，发送目标。<br>`message`: string，消息正文。<br>`mediaUrl`: string，单个媒体 URL。<br>`mediaUrls`: string[]，多个媒体 URL。<br>`gifPlayback`: boolean，是否按 GIF 播放。<br>`channel`: string，消息或操作所属渠道。<br>`accountId`: string，目标账号 ID。<br>`agentId`: string，agent ID。<br>`threadId`: string，线程/话题 ID。<br>`sessionKey`: string，会话 key。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 向外部渠道发送普通消息。 |
| `poll` | `to*`: string，发送目标。<br>`question*`: string，投票问题。<br>`options*`: string[]，选项数组。<br>`maxSelections`: integer，投票最多可选项数。<br>`durationSeconds`: integer，投票持续秒数。<br>`durationHours`: integer，投票持续小时数。<br>`silent`: boolean，是否静默发送。<br>`isAnonymous`: boolean，投票是否匿名。<br>`threadId`: string，线程/话题 ID。<br>`channel`: string，消息或操作所属渠道。<br>`accountId`: string，目标账号 ID。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 向外部渠道发送投票。 |

## Agents / Skills / Models / Tools

| Method | Params | Method 说明 |
| --- | --- | --- |
| `agents.list` | 无参数。 | 列出可管理的 agent。 |
| `agents.create` | `name*`: string，名称。<br>`workspace*`: string，工作区路径。<br>`emoji`: string，表情或 reaction。<br>`avatar`: string，头像或图标内容。 | 创建 agent。 |
| `agents.update` | `agentId*`: string，agent ID。<br>`name`: string，名称。<br>`workspace`: string，工作区路径。<br>`model`: string，模型 ID。<br>`avatar`: string，头像或图标内容。 | 更新 agent。 |
| `agents.delete` | `agentId*`: string，agent ID。<br>`deleteFiles`: boolean，删除会话时是否连带文件。 | 删除 agent。 |
| `agents.files.list` | `agentId*`: string，agent ID。 | 列出 agent 文件。 |
| `agents.files.get` | `agentId*`: string，agent ID。<br>`name*`: string，名称。 | 读取 agent 文件。 |
| `agents.files.set` | `agentId*`: string，agent ID。<br>`name*`: string，名称。<br>`content*`: string，文件内容。 | 写入 agent 文件。 |
| `models.list` | 无参数。 | 列出模型目录。 |
| `skills.status` | `agentId`: string，agent ID。 | 读取 skill 状态。 |
| `skills.bins` | 无参数。 | 列出 skills 相关 bin。 |
| `skills.install` | `name*`: string，名称。<br>`installId*`: string，安装记录 ID。<br>`timeoutMs`: integer，超时毫秒数。 | 安装 skill。 |
| `skills.update` | `skillKey*`: string，skill 标识。<br>`enabled`: boolean，启用/禁用开关。<br>`apiKey`: string，安装或更新 skill 时使用的 API key。<br>`env`: object，环境变量对象。 | 更新 skill。 |
| `tools.catalog` | `agentId`: string，agent ID。<br>`includePlugins`: boolean，是否包含插件。 | 列出可用工具目录。 |

## Config / Wizard / Update

| Method | Params | Method 说明 |
| --- | --- | --- |
| `config.get` | 无参数。 | 读取当前 Gateway 配置。 |
| `config.schema` | 无参数。 | 读取完整配置 schema。 |
| `config.schema.lookup` | `path*`: string，路径。 | 读取指定路径的配置 schema 片段。 |
| `config.set` | `raw*`: string，原始文本。<br>`baseHash`: string，配置基线 hash，用于并发保护。 | 用完整配置覆盖当前配置。 |
| `config.patch` | `raw*`: string，原始文本。<br>`baseHash`: string，配置基线 hash，用于并发保护。<br>`sessionKey`: string，会话 key。<br>`note`: string，备注。<br>`restartDelayMs`: integer，延迟重启毫秒数。 | 对当前配置做补丁更新。 |
| `config.apply` | `raw*`: string，原始文本。<br>`baseHash`: string，配置基线 hash，用于并发保护。<br>`sessionKey`: string，会话 key。<br>`note`: string，备注。<br>`restartDelayMs`: integer，延迟重启毫秒数。 | 带基线校验地应用配置。 |
| `config.openFile` | 无参数。 | 返回配置文件位置信息，用于 UI 打开配置文件。 |
| `wizard.start` | `mode`: "local" \| "remote"，模式或查询模式。<br>`workspace`: string，工作区路径。 | 启动 onboarding wizard。 |
| `wizard.next` | `sessionId*`: string，会话 ID。<br>`answer`: object{stepId*:string, value:unknown}，wizard 当前步骤的回答。 | 提交当前 wizard 步骤答案并进入下一步。 |
| `wizard.cancel` | `sessionId*`: string，会话 ID。 | 取消 wizard。 |
| `wizard.status` | `sessionId*`: string，会话 ID。 | 查询 wizard 当前状态。 |
| `update.run` | `sessionKey`: string，会话 key。<br>`note`: string，备注。<br>`restartDelayMs`: integer，延迟重启毫秒数。<br>`timeoutMs`: integer，超时毫秒数。 | 执行 Gateway 更新。 |

## Channels / Talk / Web

| Method | Params | Method 说明 |
| --- | --- | --- |
| `channels.status` | `probe`: boolean，是否主动探测。<br>`timeoutMs`: integer，超时毫秒数。 | 返回所有 channel/account 的运行状态。 |
| `channels.logout` | `channel*`: string，消息或操作所属渠道。<br>`accountId`: string，目标账号 ID。 | 让指定 channel/account 登出。 |
| `talk.config` | `includeSecrets`: boolean，是否包含 secrets。 | 读取 talk 配置。 |
| `talk.mode` | `enabled*`: boolean，启用/禁用开关。<br>`phase`: string，阶段。 | 切换 talk 模式。 |
| `web.login.start` | `force`: boolean，是否强制执行。<br>`timeoutMs`: integer，超时毫秒数。<br>`verbose`: boolean，详细模式。<br>`accountId`: string，目标账号 ID。 | 启动浏览器登录流程。 |
| `web.login.wait` | `timeoutMs`: integer，超时毫秒数。<br>`accountId`: string，目标账号 ID。 | 等待浏览器登录流程结束。 |

## Cron / Push / Device Pairing

| Method | Params | Method 说明 |
| --- | --- | --- |
| `wake` | `mode*`: "now" \| "next-heartbeat"，模式或查询模式。<br>`text*`: string，文本内容。 | 唤醒默认 agent 或指定目标。 |
| `cron.list` | `includeDisabled`: boolean，是否包含禁用项。<br>`limit`: integer，结果数量上限。<br>`offset`: integer，分页偏移量。<br>`query`: string，查询参数。<br>`enabled`: "all" \| "enabled" \| "disabled"，启用/禁用开关。<br>`sortBy`: "nextRunAtMs" \| "updatedAtMs" \| "name"，排序字段。<br>`sortDir`: "asc" \| "desc"，排序方向。 | 列出 cron 任务。 |
| `cron.status` | 无参数。 | 读取 cron 服务状态。 |
| `cron.add` | `name*`: string，名称。<br>`agentId`: string \| null，agent ID。<br>`sessionKey`: string \| null，会话 key。<br>`description`: string，描述信息。<br>`enabled`: boolean，启用/禁用开关。<br>`deleteAfterRun`: boolean，任务执行后是否自动删除。<br>`schedule*`: object{kind*:"at", at*:string} \| object{kind*:"every", everyMs*:integer, anchorMs:integer} \| object{kind*:"cron", expr*…，cron 调度配置。<br>`sessionTarget*`: "main" \| "isolated"，cron 目标会话。<br>`wakeMode*`: "next-heartbeat" \| "now"，wake 模式。<br>`payload*`: object{kind*:"systemEvent", text*:string} \| object{kind*:"agentTurn", message*:string, model:string, fallbacks:string[]…，主要负载对象。<br>`delivery`: object{mode*:"none", channel:"last" \| string, accountId:string, bestEffort:boolean, ...} \| object{mode*:"announce", cha…，cron 投递配置。<br>`failureAlert`: false \| object{after:integer, channel:"last" \| string, to:string, cooldownMs:integer, ...}，失败告警策略。 | 新增 cron 任务。 |
| `cron.update` | `id`: string，cron job ID，与 `jobId` 二选一。<br>`jobId`: string，cron job ID，与 `id` 二选一。<br>`patch`: object，待更新的 cron 字段补丁。 | 更新 cron 任务。 |
| `cron.remove` | `id`: string，cron job ID，与 `jobId` 二选一。<br>`jobId`: string，cron job ID，与 `id` 二选一。 | 删除 cron 任务。 |
| `cron.run` | `id`: string，cron job ID，与 `jobId` 二选一。<br>`jobId`: string，cron job ID，与 `id` 二选一。<br>`mode`: "due" \| "force"，执行模式。 | 立即执行 cron 任务。 |
| `cron.runs` | `scope`: "job" \| "all"，作用域。<br>`id`: string，通用对象 ID。<br>`jobId`: string，cron job ID。<br>`limit`: integer，结果数量上限。<br>`offset`: integer，分页偏移量。<br>`statuses`: "ok" \| "error" \| "skipped"[]，状态过滤列表。<br>`status`: "all" \| "ok" \| "error" \| "skipped"，状态过滤。<br>`deliveryStatuses`: "delivered" \| "not-delivered" \| "unknown" \| "not-requested"[]，投递状态过滤列表。<br>`deliveryStatus`: "delivered" \| "not-delivered" \| "unknown" \| "not-requested"，投递状态过滤。<br>`query`: string，查询参数。<br>`sortDir`: "asc" \| "desc"，排序方向。 | 列出 cron 任务运行记录。 |
| `push.test` | `nodeId*`: string，node ID。<br>`title`: string，标题。<br>`body`: string，请求体。<br>`environment`: "sandbox" \| "production"，执行环境类型。 | 测试 push 推送。 |
| `device.pair.list` | 无参数。 | 列出待处理和已配对的设备。 |
| `device.pair.approve` | `requestId*`: string，配对请求 ID。 | 批准设备配对请求。 |
| `device.pair.reject` | `requestId*`: string，配对请求 ID。 | 拒绝设备配对请求。 |
| `device.pair.remove` | `deviceId*`: string，设备或 node 的唯一 ID。 | 移除已配对设备。 |
| `device.token.rotate` | `deviceId*`: string，设备或 node 的唯一 ID。<br>`role*`: string，客户端角色。<br>`scopes`: string[]，scope 列表。 | 轮换设备 token。 |
| `device.token.revoke` | `deviceId*`: string，设备或 node 的唯一 ID。<br>`role*`: string，客户端角色。 | 吊销设备 token。 |

## Nodes / Browser

| Method | Params | Method 说明 |
| --- | --- | --- |
| `node.pair.request` | `nodeId*`: string，node ID。<br>`displayName`: string，展示名称。<br>`platform`: string，平台。<br>`version`: string，版本号。<br>`coreVersion`: string，核心版本。<br>`uiVersion`: string，UI 版本。<br>`deviceFamily`: string，设备家族。<br>`modelIdentifier`: string，设备型号标识。<br>`caps`: string[]，客户端声明能力。<br>`commands`: string[]，客户端声明命令列表。<br>`remoteIp`: string，远端 IP。<br>`silent`: boolean，是否静默发送。 | 发起 node 配对请求。 |
| `node.pair.list` | 无参数。 | 列出 node 配对请求。 |
| `node.pair.approve` | `requestId*`: string，配对请求 ID。 | 批准 node 配对。 |
| `node.pair.reject` | `requestId*`: string，配对请求 ID。 | 拒绝 node 配对。 |
| `node.pair.verify` | `nodeId*`: string，node ID。<br>`token*`: string，token。 | 校验 node token。 |
| `node.rename` | `nodeId*`: string，node ID。<br>`displayName*`: string，展示名称。 | 重命名 node。 |
| `node.list` | 无参数。 | 列出 node。 |
| `node.describe` | `nodeId*`: string，node ID。 | 读取单个 node 的详细信息。 |
| `node.canvas.capability.refresh` | 无参数；依赖当前连接上下文。 | 为当前 node 连接重新签发 canvas capability 与 scoped canvas URL。 |
| `node.pending.pull` | 无参数；依赖当前连接上下文。 | 让 node 拉取当前待处理的离线/排队动作。 |
| `node.pending.ack` | `ids*`: string[]，ID 列表。 | 确认一批待处理 node 动作已消费。 |
| `node.pending.drain` | `maxItems`: integer，条目上限。 | 拉取并清空某个 node 的待处理动作。 |
| `node.pending.enqueue` | `nodeId*`: string，node ID。<br>`type*`: "status.request" \| "location.request"，类型。<br>`priority`: "normal" \| "high"，优先级。<br>`expiresInMs`: integer，过期时间毫秒数。<br>`wake`: boolean，wake 配置。 | 为某个 node 入队待处理动作。 |
| `node.invoke` | `nodeId*`: string，node ID。<br>`command*`: string，要执行的 node 命令。<br>`params`: unknown，命令或事件参数对象。<br>`timeoutMs`: integer，超时毫秒数。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 调用 node 命令。 |
| `node.invoke.result` | `id*`: string，通用对象 ID。<br>`nodeId*`: string，node ID。<br>`ok*`: boolean，布尔结果。<br>`payload`: unknown，主要负载对象。<br>`payloadJSON`: string，JSON 字符串形式的负载。<br>`error`: object{code:string, message:string}，错误文本。 | 由 node 回传调用结果。 |
| `node.event` | `event*`: string，事件名。<br>`payload`: unknown，主要负载对象。<br>`payloadJSON`: string，JSON 字符串形式的负载。 | 由 node 上报事件。 |
| `browser.request` | `method*`: string，HTTP 风格动作，仅支持 GET / POST / DELETE<br>`path*`: string，Browser control 路由路径<br>`query`: object，查询参数对象<br>`body`: any，请求体，POST 常用<br>`timeoutMs`: integer，代理到浏览器控制接口时的超时毫秒数 | 转发一条 Browser Control 请求；可能走本地浏览器控制服务，也可能转发到带有 `browser.proxy` 能力的 node。 |

## Sessions / Usage / Logs

| Method | Params | Method 说明 |
| --- | --- | --- |
| `sessions.list` | `limit`: integer，结果数量上限。<br>`activeMinutes`: integer，活跃时间窗口（分钟）。<br>`includeGlobal`: boolean，是否包含全局配置。<br>`includeUnknown`: boolean，是否包含未知项。<br>`includeDerivedTitles`: boolean，是否返回推导标题。<br>`includeLastMessage`: boolean，是否附带最后一条消息。<br>`label`: string，展示标签。<br>`spawnedBy`: string，来源信息。<br>`agentId`: string，agent ID。<br>`search`: string，搜索关键词。 | 列出会话。 |
| `sessions.preview` | `keys*`: string[]，key 列表。<br>`limit`: integer，结果数量上限。<br>`maxChars`: integer，字符数上限。 | 预览会话元信息与摘要。 |
| `sessions.resolve` | `key`: string，对象 key，常用于 session key。<br>`sessionId`: string，会话 ID。<br>`label`: string，展示标签。<br>`agentId`: string，agent ID。<br>`spawnedBy`: string，来源信息。<br>`includeGlobal`: boolean，是否包含全局配置。<br>`includeUnknown`: boolean，是否包含未知项。 | 把 key/别名解析成具体会话。 |
| `sessions.get` | `key`: string，对象 key，常用于 session key。<br>`sessionId`: string，会话 ID。<br>`label`: string，展示标签。<br>`agentId`: string，agent ID。<br>`spawnedBy`: string，来源信息。<br>`includeGlobal`: boolean，是否包含全局配置。<br>`includeUnknown`: boolean，是否包含未知项。 | 读取单个会话。 |
| `sessions.patch` | `key*`: string，对象 key，常用于 session key。<br>`label`: string \| null，展示标签。<br>`thinkingLevel`: string \| null，thinking 等级。<br>`fastMode`: boolean \| null，快速模式开关。<br>`verboseLevel`: string \| null，详细级别。<br>`reasoningLevel`: string \| null，推理强度。<br>`responseUsage`: "off" \| "tokens" \| "full" \| "on" \| null，响应 usage 呈现策略。<br>`elevatedLevel`: string \| null，提权等级。<br>`execHost`: string \| null，命令执行宿主。<br>`execSecurity`: string \| null，执行安全级别。<br>`execAsk`: string \| null，执行前是否询问。<br>`execNode`: string \| null，命令执行 node。<br>`model`: string \| null，模型 ID。<br>`spawnedBy`: string \| null，来源信息。<br>`spawnedWorkspaceDir`: string \| null，spawn 工作目录。<br>`spawnDepth`: integer \| null，子 agent 深度。<br>`subagentRole`: "orchestrator" \| "leaf" \| null，子 agent 角色。<br>`subagentControlScope`: "children" \| "none" \| null，子 agent 控制范围。<br>`sendPolicy`: "allow" \| "deny" \| null，发送策略。<br>`groupActivation`: "mention" \| "always" \| null，分组激活策略。 | 局部更新会话设置。 |
| `sessions.reset` | `key*`: string，对象 key，常用于 session key。<br>`reason`: "new" \| "reset"，原因说明。 | 重置会话状态。 |
| `sessions.delete` | `key*`: string，对象 key，常用于 session key。<br>`deleteTranscript`: boolean，删除会话时是否删除 transcript。<br>`emitLifecycleHooks`: boolean，是否触发生命周期 hook。 | 删除会话。 |
| `sessions.compact` | `key*`: string，对象 key，常用于 session key。<br>`maxLines`: integer，行数上限。 | 压缩会话 transcript。 |
| `sessions.usage` | `key`: string，对象 key，常用于 session key。<br>`startDate`: string，开始日期。<br>`endDate`: string，结束日期。<br>`mode`: "utc" \| "gateway" \| "specific"，模式或查询模式。<br>`utcOffset`: string，UTC 偏移。<br>`limit`: integer，结果数量上限。<br>`includeContextWeight`: boolean，是否返回 context weight。 | 统计会话 usage 聚合数据。 |
| `sessions.usage.timeseries` | `key*`: string，目标会话 key | 返回单个会话的 usage 时间序列。 |
| `sessions.usage.logs` | `key*`: string，目标会话 key<br>`limit`: integer，返回日志条数上限，默认 200，最大 1000 | 返回单个会话的 usage 相关日志。 |
| `usage.status` | 无参数；依赖当前连接上下文。 | 汇总 provider 级 usage 状态。 |
| `usage.cost` | `startDate`: string，开始日期，`YYYY-MM-DD`<br>`endDate`: string，结束日期，`YYYY-MM-DD`<br>`days`: integer，最近 N 天<br>`mode`: string，日期解释模式<br>`utcOffset`: string，时区偏移，例如 `+08:00` | 统计指定时间范围内的成本 usage。 |
| `logs.tail` | `cursor`: integer，分页游标。<br>`limit`: integer，结果数量上限。<br>`maxBytes`: integer，字节数上限。 | 按条件 tail gateway 日志。 |
| `doctor.memory.status` | 无参数；依赖当前连接上下文。 | 探测默认 agent 的 memory/embedding 可用性。 |

## Approvals / Voice / TTS

| Method | Params | Method 说明 |
| --- | --- | --- |
| `exec.approvals.get` | 无参数。 | 读取执行审批总配置。 |
| `exec.approvals.set` | `file*`: object{version*:1, socket:object{path:string, token:string}, defaults:object{security:string, ask:string, askFallback:s…，配置文件对象。<br>`baseHash`: string，配置基线 hash，用于并发保护。 | 更新执行审批总配置。 |
| `exec.approvals.node.get` | `nodeId*`: string，node ID。 | 读取某个 node 的执行审批配置。 |
| `exec.approvals.node.set` | `nodeId*`: string，node ID。<br>`file*`: object{version*:1, socket:object{path:string, token:string}, defaults:object{security:string, ask:string, askFallback:s…，配置文件对象。<br>`baseHash`: string，配置基线 hash，用于并发保护。 | 更新某个 node 的执行审批配置。 |
| `voicewake.get` | 无参数；依赖当前连接上下文。 | 读取 voice wake 触发词配置。 |
| `voicewake.set` | `triggers*`: string[]，新的唤醒词列表 | 更新 voice wake 触发词，并广播变更。 |
| `tts.status` | 无参数；依赖当前连接上下文。 | 查询 TTS 当前状态、provider 与可用密钥。 |
| `tts.enable` | 无参数；依赖当前连接上下文。 | 启用 TTS。 |
| `tts.disable` | 无参数；依赖当前连接上下文。 | 禁用 TTS。 |
| `tts.convert` | `text*`: string，待转换文本<br>`channel`: string，按目标渠道选择更合适的语音输出策略 | 把文本转换为语音文件。 |
| `tts.setProvider` | `provider*`: string，`openai`、`elevenlabs` 或 `edge` | 切换当前 TTS provider。 |
| `tts.providers` | 无参数；依赖当前连接上下文。 | 列出 TTS provider、模型与语音配置。 |
