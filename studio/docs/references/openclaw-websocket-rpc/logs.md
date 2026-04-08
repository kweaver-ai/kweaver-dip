# Logs WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `logs.tail` | `cursor`: integer，分页游标。<br>`limit`: integer，结果数量上限。<br>`maxBytes`: integer，字节数上限。 | `{ file, cursor, nextCursor, lines }`。 | 按条件 tail gateway 日志。 |
