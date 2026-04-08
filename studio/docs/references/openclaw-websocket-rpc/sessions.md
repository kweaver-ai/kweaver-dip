# Sessions WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `sessions.list` | `limit`: integer，结果数量上限。<br>`activeMinutes`: integer，活跃时间窗口（分钟）。<br>`includeGlobal`: boolean，是否包含全局配置。<br>`includeUnknown`: boolean，是否包含未知项。<br>`includeDerivedTitles`: boolean，是否返回推导标题。<br>`includeLastMessage`: boolean，是否附带最后一条消息。<br>`label`: string，展示标签。<br>`spawnedBy`: string，来源信息。<br>`agentId`: string，agent ID。<br>`search`: string，搜索关键词。 | 列表结果对象；顶层通常是 `{ ts, sessions }`，`sessions[]` 元素为会话条目。 | 列出会话。 |
| `sessions.preview` | `keys*`: string[]，key 列表。<br>`limit`: integer，结果数量上限。<br>`maxChars`: integer，字符数上限。 | `{ ts, previews }`。 | 预览会话元信息与摘要。 |
| `sessions.resolve` | `key`: string，对象 key，常用于 session key。<br>`sessionId`: string，会话 ID。<br>`label`: string，展示标签。<br>`agentId`: string，agent ID。<br>`spawnedBy`: string，来源信息。<br>`includeGlobal`: boolean，是否包含全局配置。<br>`includeUnknown`: boolean，是否包含未知项。 | `{ ok, key }`。 | 把 key/别名解析成具体会话。 |
| `sessions.get` | `key`: string，对象 key，常用于 session key。<br>`sessionId`: string，会话 ID。<br>`label`: string，展示标签。<br>`agentId`: string，agent ID。<br>`spawnedBy`: string，来源信息。<br>`includeGlobal`: boolean，是否包含全局配置。<br>`includeUnknown`: boolean，是否包含未知项。 | 单个会话详情对象；顶层通常含 `{ key, entry, path?, resolved? }`。 | 读取单个会话。 |
| `sessions.patch` | `key*`: string，对象 key，常用于 session key。<br>`label`: string \| null，展示标签。<br>`thinkingLevel`: string \| null，thinking 等级。<br>`fastMode`: boolean \| null，快速模式开关。<br>`verboseLevel`: string \| null，详细级别。<br>`reasoningLevel`: string \| null，推理强度。<br>`responseUsage`: "off" \| "tokens" \| "full" \| "on" \| null，响应 usage 呈现策略。<br>`elevatedLevel`: string \| null，提权等级。<br>`execHost`: string \| null，命令执行宿主。<br>`execSecurity`: string \| null，执行安全级别。<br>`execAsk`: string \| null，执行前是否询问。<br>`execNode`: string \| null，命令执行 node。<br>`model`: string \| null，模型 ID。<br>`spawnedBy`: string \| null，来源信息。<br>`spawnedWorkspaceDir`: string \| null，spawn 工作目录。<br>`spawnDepth`: integer \| null，子 agent 深度。<br>`subagentRole`: "orchestrator" \| "leaf" \| null，子 agent 角色。<br>`subagentControlScope`: "children" \| "none" \| null，子 agent 控制范围。<br>`sendPolicy`: "allow" \| "deny" \| null，发送策略。<br>`groupActivation`: "mention" \| "always" \| null，分组激活策略。 | `{ ok, path, key, entry, resolved }`；`resolved` 含 `{ modelProvider, model }`。 | 局部更新会话设置。 |
| `sessions.reset` | `key*`: string，对象 key，常用于 session key。<br>`reason`: "new" \| "reset"，原因说明。 | `{ ok, key, entry }`。 | 重置会话状态。 |
| `sessions.delete` | `key*`: string，对象 key，常用于 session key。<br>`deleteTranscript`: boolean，删除会话时是否删除 transcript。<br>`emitLifecycleHooks`: boolean，是否触发生命周期 hook。 | `{ ok, key, deleted, archived }`。 | 删除会话。 |
| `sessions.compact` | `key*`: string，对象 key，常用于 session key。<br>`maxLines`: integer，行数上限。 | `{ messages }`。 | 压缩会话 transcript。 |
