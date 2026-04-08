# Wake WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `wake` | `mode*`: "now" \| "next-heartbeat"，模式或查询模式。<br>`text*`: string，文本内容。 | wake 结果对象；顶层通常含 `{ ok, mode, queued?, woke?, reason? }`。 | 唤醒默认 agent 或指定目标。 |
