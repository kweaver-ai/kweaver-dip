# Sessions Usage WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `sessions.usage` | `key`: string，对象 key，常用于 session key。<br>`startDate`: string，开始日期。<br>`endDate`: string，结束日期。<br>`mode`: "utc" \| "gateway" \| "specific"，模式或查询模式。<br>`utcOffset`: string，UTC 偏移。<br>`limit`: integer，结果数量上限。<br>`includeContextWeight`: boolean，是否返回 context weight。 | `{ updatedAt, startDate, endDate, sessions, totals, aggregates }`。 | 统计会话 usage 聚合数据。 |
| `sessions.usage.timeseries` | `key*`: string，目标会话 key | 时间序列对象；顶层通常含 `{ updatedAt, points, totals?, buckets? }`。 | 返回单个会话的 usage 时间序列。 |
| `sessions.usage.logs` | `key*`: string，目标会话 key<br>`limit`: integer，返回日志条数上限，默认 200，最大 1000 | `{ logs }`。 | 返回单个会话的 usage 相关日志。 |
