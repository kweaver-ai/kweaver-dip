# Config WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `config.get` | 无参数。 | 配置快照对象；顶层通常是 `{ path, exists, hash, config, raw? }`，其中 `config` 已按 UI hint 脱敏。 | 读取当前 Gateway 配置。 |
| `config.schema` | 无参数。 | `ConfigSchemaResponse`；顶层通常是 `{ schema, uiHints, examples? }`。 | 读取完整配置 schema。 |
| `config.schema.lookup` | `path*`: string，路径。 | `{ path, schema, uiHint?, exists }`。 | 读取指定路径的配置 schema 片段。 |
| `config.set` | `raw*`: string，原始文本。<br>`baseHash`: string，配置基线 hash，用于并发保护。 | `{ ok, path, config }`。 | 用完整配置覆盖当前配置。 |
| `config.patch` | `raw*`: string，原始文本。<br>`baseHash`: string，配置基线 hash，用于并发保护。<br>`sessionKey`: string，会话 key。<br>`note`: string，备注。<br>`restartDelayMs`: integer，延迟重启毫秒数。 | `{ ok, path, config, restart, sentinel }`。 | 对当前配置做补丁更新。 |
| `config.apply` | `raw*`: string，原始文本。<br>`baseHash`: string，配置基线 hash，用于并发保护。<br>`sessionKey`: string，会话 key。<br>`note`: string，备注。<br>`restartDelayMs`: integer，延迟重启毫秒数。 | `{ ok, path, config, restart, sentinel }`。 | 带基线校验地应用配置。 |
| `config.openFile` | 无参数。 | `{ ok, path }`；失败时附 `error`。 | 返回配置文件位置信息，用于 UI 打开配置文件。 |
