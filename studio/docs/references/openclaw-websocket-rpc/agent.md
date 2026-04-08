# Agent WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `agent` | `message*`: string，消息正文。<br>`agentId`: string，agent ID。<br>`to`: string，发送目标。<br>`replyTo`: string，回复目标。<br>`sessionId`: string，会话 ID。<br>`sessionKey`: string，会话 key。<br>`thinking`: string，thinking 模式。<br>`deliver`: boolean，是否把结果投递回外部渠道。<br>`attachments`: unknown[]，附件数组。<br>`channel`: string，消息或操作所属渠道。<br>`replyChannel`: string，回复所用渠道。<br>`accountId`: string，目标账号 ID。<br>`replyAccountId`: string，回复所用账号 ID。<br>`threadId`: string，线程/话题 ID。<br>`groupId`: string，分组 ID。<br>`groupChannel`: string，分组所属渠道。<br>`groupSpace`: string，分组空间。<br>`timeout`: integer，超时秒数或通用超时。<br>`bestEffortDeliver`: boolean，投递失败时是否尽力而为。<br>`lane`: string，执行 lane。<br>`extraSystemPrompt`: string，附加 system prompt。<br>`internalEvents`: object{type*:"task_completion", source*:"subagent" \| "cron", childSessionKey*:string, childSessionId:string, ...}[]，内部事件列表。<br>`inputProvenance`: object{kind*:"external_user" \| "inter_session" \| "internal_system", originSessionId:string, sourceSessionKey:string, so…，输入来源信息。<br>`idempotencyKey*`: string，幂等键，用于请求去重。<br>`label`: string，展示标签。 | `{ runId, status: "accepted", acceptedAt }`。 | 创建一次 agent 运行，可选投递到外部渠道。 |
| `agent.identity.get` | `agentId`: string，agent ID。<br>`sessionKey`: string，会话 key。 | Agent 身份对象；顶层是 `{ agentId, name, role, systemPrompt, avatar, ... }`。 | 读取默认 agent 的身份信息。 |
| `agent.wait` | `runId*`: string，运行 ID。<br>`timeoutMs`: integer，超时毫秒数。 | `{ runId, status, startedAt?, endedAt?, error? }`；`status` 常见为 `ok`、`error`、`timeout`。 | 等待指定 agent run 结束。 |
