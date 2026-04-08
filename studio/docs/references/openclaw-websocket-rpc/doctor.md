# Doctor WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `doctor.memory.status` | 无参数；依赖当前连接上下文。 | 探测结果对象；顶层通常含 `{ ok, configured, embeddingProvider?, memoryProvider?, diagnostics? }`。 | 探测默认 agent 的 memory/embedding 可用性。 |
