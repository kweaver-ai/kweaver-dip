# Update WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `update.run` | `sessionKey`: string，会话 key。<br>`note`: string，备注。<br>`restartDelayMs`: integer，延迟重启毫秒数。<br>`timeoutMs`: integer，超时毫秒数。 | 更新结果对象；顶层通常含 `{ ok, status, message?, restart?, sentinel? }`。 | 执行 Gateway 更新。 |
