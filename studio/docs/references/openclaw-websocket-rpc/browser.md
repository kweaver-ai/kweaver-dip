# Browser WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `browser.request` | `method*`: string，HTTP 风格动作，仅支持 GET / POST / DELETE<br>`path*`: string，Browser control 路由路径<br>`query`: object，查询参数对象<br>`body`: any，请求体，POST 常用<br>`timeoutMs`: integer，代理到浏览器控制接口时的超时毫秒数 | 直接透传目标路由响应体；返回结构由具体 Browser Control 路由决定。 | 转发一条 Browser Control 请求；可能走本地浏览器控制服务，也可能转发到带有 `browser.proxy` 能力的 node。 |
