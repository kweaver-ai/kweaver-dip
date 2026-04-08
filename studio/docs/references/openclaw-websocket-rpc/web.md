# Web WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `web.login.start` | `force`: boolean，是否强制执行。<br>`timeoutMs`: integer，超时毫秒数。<br>`verbose`: boolean，详细模式。<br>`accountId`: string，目标账号 ID。 | 登录启动结果对象；顶层通常含 `{ status, qr?, url?, accountId?, expiresAtMs? }`。 | 启动浏览器登录流程。 |
| `web.login.wait` | `timeoutMs`: integer，超时毫秒数。<br>`accountId`: string，目标账号 ID。 | 登录等待结果对象；顶层通常含 `{ status, connected, accountId?, profile? }`。 | 等待浏览器登录流程结束。 |
