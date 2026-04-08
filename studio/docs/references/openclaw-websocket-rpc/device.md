# Device WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `device.pair.list` | 无参数。 | `{ requests, devices }`。 | 列出待处理和已配对的设备。 |
| `device.pair.approve` | `requestId*`: string，配对请求 ID。 | `{ requestId, device }`。 | 批准设备配对请求。 |
| `device.pair.reject` | `requestId*`: string，配对请求 ID。 | `{ requestId, rejected: true }`。 | 拒绝设备配对请求。 |
| `device.pair.remove` | `deviceId*`: string，设备或 node 的唯一 ID。 | `{ deviceId, removed: true }`。 | 移除已配对设备。 |
| `device.token.rotate` | `deviceId*`: string，设备或 node 的唯一 ID。<br>`role*`: string，客户端角色。<br>`scopes`: string[]，scope 列表。 | `{ deviceId, role, token, scopes }`。 | 轮换设备 token。 |
| `device.token.revoke` | `deviceId*`: string，设备或 node 的唯一 ID。<br>`role*`: string，客户端角色。 | `{ deviceId, role, revoked: true }`。 | 吊销设备 token。 |
