# Talk WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `talk.config` | `includeSecrets`: boolean，是否包含 secrets。 | `TalkConfigResult`；顶层通常含 `{ enabled, phase, routes, providers, secrets? }`。 | 读取 talk 配置。 |
| `talk.mode` | `enabled*`: boolean，启用/禁用开关。<br>`phase`: string，阶段。 | 模式切换结果；顶层通常含 `{ enabled, phase?, changed? }`。 | 切换 talk 模式。 |
