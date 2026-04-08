# Chat WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `chat.history` | `sessionKey*`: string，会话 key。<br>`limit`: integer，结果数量上限。 | `{ sessionKey, sessionId, messages, thinkingLevel, fastMode, verboseLevel }`。 | 读取某个 WebChat 会话的历史消息。 |
| `chat.abort` | `sessionKey*`: string，会话 key。<br>`runId`: string，运行 ID。 | `{ ok, aborted, runIds }`。 | 中止一个进行中的 chat run。 |
| `chat.send` | `sessionKey*`: string，会话 key。<br>`message*`: string，消息正文。<br>`thinking`: string，thinking 模式。<br>`deliver`: boolean，是否把结果投递回外部渠道。<br>`attachments`: unknown[]，附件数组。<br>`timeoutMs`: integer，超时毫秒数。<br>`systemInputProvenance`: object{kind*:"external_user" \| "inter_session" \| "internal_system", originSessionId:string, sourceSessionKey:string, so…，系统级输入来源。<br>`systemProvenanceReceipt`: string，来源回执。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 启动 ack；通常返回 `{ runId, status: "started" \| "in_flight" }`。 | 向指定 session 发送一条 chat 消息。 |
| `chat.inject` | `sessionKey*`: string，会话 key。<br>`message*`: string，消息正文。<br>`label`: string，展示标签。 | `{ ok: true, messageId }`。 | 向会话直接注入消息或事件。 |
| `send` | `to*`: string，发送目标。<br>`message`: string，消息正文。<br>`mediaUrl`: string，单个媒体 URL。<br>`mediaUrls`: string[]，多个媒体 URL。<br>`gifPlayback`: boolean，是否按 GIF 播放。<br>`channel`: string，消息或操作所属渠道。<br>`accountId`: string，目标账号 ID。<br>`agentId`: string，agent ID。<br>`threadId`: string，线程/话题 ID。<br>`sessionKey`: string，会话 key。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 发送结果对象；顶层通常是 `{ runId, messageId, channel, accountId?, threadId?, raw? }`，并可能带渠道侧消息 ID。 | 向外部渠道发送普通消息。 |
| `poll` | `to*`: string，发送目标。<br>`question*`: string，投票问题。<br>`options*`: string[]，选项数组。<br>`maxSelections`: integer，投票最多可选项数。<br>`durationSeconds`: integer，投票持续秒数。<br>`durationHours`: integer，投票持续小时数。<br>`silent`: boolean，是否静默发送。<br>`isAnonymous`: boolean，投票是否匿名。<br>`threadId`: string，线程/话题 ID。<br>`channel`: string，消息或操作所属渠道。<br>`accountId`: string，目标账号 ID。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 投票发送结果对象；顶层通常是 `{ runId, messageId, channel, accountId?, threadId?, raw? }`。 | 向外部渠道发送投票。 |
