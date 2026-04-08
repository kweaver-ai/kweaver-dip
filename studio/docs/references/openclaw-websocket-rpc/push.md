# Push WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `push.test` | `nodeId*`: string，node ID。<br>`title`: string，标题。<br>`body`: string，请求体。<br>`environment`: "sandbox" \| "production"，执行环境类型。 | `{ ok, nodeId, sent, status?, reason? }`。 | 测试 push 推送。 |
