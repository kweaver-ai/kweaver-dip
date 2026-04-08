# Skills WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `skills.status` | `agentId`: string，agent ID。 | `{ skills, bins?, installRoot?, diagnostics? }`。 | 读取 skill 状态。 |
| `skills.bins` | 无参数。 | `{ bins }`；`bins[]` 元素通常含 `{ name, path }`。 | 列出 skills 相关 bin。 |
| `skills.install` | `name*`: string，名称。<br>`installId*`: string，安装记录 ID。<br>`timeoutMs`: integer，超时毫秒数。 | 安装结果对象；顶层通常含 `{ ok, installId, skillKey?, status?, diagnostics? }`。 | 安装 skill。 |
| `skills.update` | `skillKey*`: string，skill 标识。<br>`enabled`: boolean，启用/禁用开关。<br>`apiKey`: string，安装或更新 skill 时使用的 API key。<br>`env`: object，环境变量对象。 | `{ ok, skillKey, config }`。 | 更新 skill。 |
