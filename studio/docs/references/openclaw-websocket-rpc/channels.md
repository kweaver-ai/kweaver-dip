# Channels WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `channels.status` | `probe`: boolean，是否主动探测。<br>`timeoutMs`: integer，超时毫秒数。 | `{ ts, channelOrder, channelLabels, channelDetailLabels, channelSystemImages, channelMeta, channels, channelAccounts, channelDefaultAccountId }`。 | 返回所有 channel/account 的运行状态。 |
| `channels.logout` | `channel*`: string，消息或操作所属渠道。<br>`accountId`: string，目标账号 ID。 | `{ channel, accountId, cleared, ...pluginResult }`。 | 让指定 channel/account 登出。 |
