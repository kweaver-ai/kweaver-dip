# Nodes WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `node.pair.request` | `nodeId*`: string，node ID。<br>`displayName`: string，展示名称。<br>`platform`: string，平台。<br>`version`: string，版本号。<br>`coreVersion`: string，核心版本。<br>`uiVersion`: string，UI 版本。<br>`deviceFamily`: string，设备家族。<br>`modelIdentifier`: string，设备型号标识。<br>`caps`: string[]，客户端声明能力。<br>`commands`: string[]，客户端声明命令列表。<br>`remoteIp`: string，远端 IP。<br>`silent`: boolean，是否静默发送。 | `{ requestId, status, request }`。 | 发起 node 配对请求。 |
| `node.pair.list` | 无参数。 | `{ requests }`。 | 列出 node 配对请求。 |
| `node.pair.approve` | `requestId*`: string，配对请求 ID。 | `{ requestId, device }` 或 `{ requestId, node }`。 | 批准 node 配对。 |
| `node.pair.reject` | `requestId*`: string，配对请求 ID。 | `{ requestId, rejected: true }`。 | 拒绝 node 配对。 |
| `node.pair.verify` | `nodeId*`: string，node ID。<br>`token*`: string，token。 | `{ ok, nodeId, deviceId?, scopes?, role? }`。 | 校验 node token。 |
| `node.rename` | `nodeId*`: string，node ID。<br>`displayName*`: string，展示名称。 | `{ nodeId, displayName }`。 | 重命名 node。 |
| `node.list` | 无参数。 | `{ ts, nodes }`。 | 列出 node。 |
| `node.describe` | `nodeId*`: string，node ID。 | 单个 node 详情对象；顶层通常含 `{ nodeId, displayName, status, caps, commands, platform, version, ... }`。 | 读取单个 node 的详细信息。 |
| `node.canvas.capability.refresh` | 无参数；依赖当前连接上下文。 | `{ canvasCapability, canvasCapabilityExpiresAtMs, canvasHostUrl }`。 | 为当前 node 连接重新签发 canvas capability 与 scoped canvas URL。 |
| `node.pending.pull` | 无参数；依赖当前连接上下文。 | `{ nodeId, actions }`。 | 让 node 拉取当前待处理的离线/排队动作。 |
| `node.pending.ack` | `ids*`: string[]，ID 列表。 | `{ nodeId, remaining }`；`remaining[]` 为未确认的待处理动作。 | 确认一批待处理 node 动作已消费。 |
| `node.pending.drain` | `maxItems`: integer，条目上限。 | `NodePendingDrainResult`。 | 拉取并清空某个 node 的待处理动作。 |
| `node.pending.enqueue` | `nodeId*`: string，node ID。<br>`type*`: "status.request" \| "location.request"，类型。<br>`priority`: "normal" \| "high"，优先级。<br>`expiresInMs`: integer，过期时间毫秒数。<br>`wake`: boolean，wake 配置。 | `{ nodeId, action, wake? }`；`action` 通常含 `{ id, type, priority, expiresAtMs? }`。 | 为某个 node 入队待处理动作。 |
| `node.invoke` | `nodeId*`: string，node ID。<br>`command*`: string，要执行的 node 命令。<br>`params`: unknown，命令或事件参数对象。<br>`timeoutMs`: integer，超时毫秒数。<br>`idempotencyKey*`: string，幂等键，用于请求去重。 | 调用结果对象；顶层通常含 `{ ok, id, nodeId, payload?, payloadJSON?, error? }`。 | 调用 node 命令。 |
| `node.invoke.result` | `id*`: string，通用对象 ID。<br>`nodeId*`: string，node ID。<br>`ok*`: boolean，布尔结果。<br>`payload`: unknown，主要负载对象。<br>`payloadJSON`: string，JSON 字符串形式的负载。<br>`error`: object{code:string, message:string}，错误文本。 | 写回确认对象；顶层通常含 `{ ok: true, id, nodeId, accepted: true }`。 | 由 node 回传调用结果。 |
| `node.event` | `event*`: string，事件名。<br>`payload`: unknown，主要负载对象。<br>`payloadJSON`: string，JSON 字符串形式的负载。 | `{ ok: true }`。 | 由 node 上报事件。 |
