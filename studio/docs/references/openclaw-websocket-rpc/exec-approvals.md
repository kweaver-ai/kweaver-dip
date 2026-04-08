# Exec Approvals WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `exec.approvals.get` | 无参数。 | `{ path, exists, hash, file }`；`file` 为脱敏后的 exec approvals 配置。 | 读取执行审批总配置。 |
| `exec.approvals.set` | `file*`: object{version*:1, socket:object{path:string, token:string}, defaults:object{security:string, ask:string, askFallback:s…，配置文件对象。<br>`baseHash`: string，配置基线 hash，用于并发保护。 | `{ path, exists, hash, file }`；`file` 为更新后且已脱敏的配置。 | 更新执行审批总配置。 |
| `exec.approvals.node.get` | `nodeId*`: string，node ID。 | `{ path, exists, hash, file }`；结构与本地 `exec.approvals.get` 一致。 | 读取某个 node 的执行审批配置。 |
| `exec.approvals.node.set` | `nodeId*`: string，node ID。<br>`file*`: object{version*:1, socket:object{path:string, token:string}, defaults:object{security:string, ask:string, askFallback:s…，配置文件对象。<br>`baseHash`: string，配置基线 hash，用于并发保护。 | `{ path, exists, hash, file }`；结构与本地 `exec.approvals.set` 一致。 | 更新某个 node 的执行审批配置。 |
