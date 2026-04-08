# VoiceWake WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `voicewake.get` | 无参数；依赖当前连接上下文。 | `{ triggers }`。 | 读取 voice wake 触发词配置。 |
| `voicewake.set` | `triggers*`: string[]，新的唤醒词列表 | `{ triggers }`。 | 更新 voice wake 触发词，并广播变更。 |
