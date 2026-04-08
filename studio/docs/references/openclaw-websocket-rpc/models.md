# Models WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `models.list` | 无参数。 | `{ models }`；`models[]` 元素通常含 `{ id, provider, label?, supports? }`。 | 列出模型目录。 |
