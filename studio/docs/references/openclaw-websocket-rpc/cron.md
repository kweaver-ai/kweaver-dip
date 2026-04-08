# Cron WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `cron.list` | `includeDisabled`: boolean，是否包含禁用项。<br>`limit`: integer，结果数量上限。<br>`offset`: integer，分页偏移量。<br>`query`: string，查询参数。<br>`enabled`: "all" \| "enabled" \| "disabled"，启用/禁用开关。<br>`sortBy`: "nextRunAtMs" \| "updatedAtMs" \| "name"，排序字段。<br>`sortDir`: "asc" \| "desc"，排序方向。 | 分页对象；顶层通常是 `{ items, total, limit, offset, hasMore }`，`items[]` 为 cron job。 | 列出 cron 任务。 |
| `cron.status` | 无参数。 | cron 服务状态对象；顶层通常含 `{ enabled, running, jobs, nextRunAtMs? }`。 | 读取 cron 服务状态。 |
| `cron.add` | `name*`: string，名称。<br>`agentId`: string \| null，agent ID。<br>`sessionKey`: string \| null，会话 key。<br>`description`: string，描述信息。<br>`enabled`: boolean，启用/禁用开关。<br>`deleteAfterRun`: boolean，任务执行后是否自动删除。<br>`schedule*`: object{kind*:"at", at*:string} \| object{kind*:"every", everyMs*:integer, anchorMs:integer} \| object{kind*:"cron", expr*…，cron 调度配置。<br>`sessionTarget*`: "main" \| "isolated"，cron 目标会话。<br>`wakeMode*`: "next-heartbeat" \| "now"，wake 模式。<br>`payload*`: object{kind*:"systemEvent", text*:string} \| object{kind*:"agentTurn", message*:string, model:string, fallbacks:string[]…，主要负载对象。<br>`delivery`: object{mode*:"none", channel:"last" \| string, accountId:string, bestEffort:boolean, ...} \| object{mode*:"announce", cha…，cron 投递配置。<br>`failureAlert`: false \| object{after:integer, channel:"last" \| string, to:string, cooldownMs:integer, ...}，失败告警策略。 | cron job 对象；顶层通常含 `{ id, name, enabled, schedule, payload, nextRunAtMs, updatedAtMs }`。 | 新增 cron 任务。 |
| `cron.update` | `id`: string，cron job ID，与 `jobId` 二选一。<br>`jobId`: string，cron job ID，与 `id` 二选一。<br>`patch`: object，待更新的 cron 字段补丁。 | cron job 对象；返回更新后的 `{ id, name, enabled, schedule, payload, nextRunAtMs, updatedAtMs }`。 | 更新 cron 任务。 |
| `cron.remove` | `id`: string，cron job ID，与 `jobId` 二选一。<br>`jobId`: string，cron job ID，与 `id` 二选一。 | `{ removed, id/jobId?, job? }`。 | 删除 cron 任务。 |
| `cron.run` | `id`: string，cron job ID，与 `jobId` 二选一。<br>`jobId`: string，cron job ID，与 `id` 二选一。<br>`mode`: "due" \| "force"，执行模式。 | 触发结果对象；顶层通常含 `{ ok, enqueued, runId?, jobId, mode }`。 | 立即执行 cron 任务。 |
| `cron.runs` | `id`: string，cron job ID。<br>`limit`: integer，结果数量上限。<br>`offset`: integer，分页偏移量。<br>`sortDir`: "asc" \| "desc"，排序方向。 | 分页对象；顶层通常是 `{ items, total, limit, offset, hasMore }`，`items[]` 为 cron run log。 | 列出 cron 任务运行记录。 |
