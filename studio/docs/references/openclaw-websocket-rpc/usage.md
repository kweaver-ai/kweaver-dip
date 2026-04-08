# Usage WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `usage.status` | 无参数；依赖当前连接上下文。 | provider 汇总对象；顶层通常含 `{ updatedAt, providers, totals }`。 | 汇总 provider 级 usage 状态。 |
| `usage.cost` | `startDate`: string，开始日期，`YYYY-MM-DD`<br>`endDate`: string，结束日期，`YYYY-MM-DD`<br>`days`: integer，最近 N 天<br>`mode`: string，日期解释模式<br>`utcOffset`: string，时区偏移，例如 `+08:00` | 成本汇总对象；顶层通常含 `{ updatedAt, startDate, endDate, totals, byProvider, byModel }`。 | 统计指定时间范围内的成本 usage。 |
