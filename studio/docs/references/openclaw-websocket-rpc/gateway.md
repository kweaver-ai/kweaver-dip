# Gateway WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

- `connect` 是握手阶段专用方法，只能作为首个请求发送，而且它的成功返回是 `hello-ok`，不是普通 `res`。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `connect` | `minProtocol*`: integer，客户端要求的最低协议版本。<br>`maxProtocol*`: integer，客户端支持的最高协议版本。<br>`client*`: object{id*:"webchat-ui" \| "openclaw-control-ui" \| "webchat" \| "cli" \| "gateway-client" \| "openclaw-macos" \| "openclaw-i…，客户端身份元数据。<br>`caps`: string[]，客户端声明能力。<br>`commands`: string[]，客户端声明命令列表。<br>`permissions`: object，权限映射。<br>`pathEnv`: string，节点 PATH 环境。<br>`role`: string，客户端角色。<br>`scopes`: string[]，scope 列表。<br>`device`: object{id*:string, publicKey*:string, signature*:string, signedAt*:integer, ...}，设备签名身份。<br>`auth`: object{token:string, bootstrapToken:string, deviceToken:string, password:string}，握手认证信息。<br>`locale`: string，语言地区。<br>`userAgent`: string，用户代理。 | 非 `res` 帧；成功时直接回 `hello-ok: { protocol, server, features, snapshot, policy }`。 | WebSocket 建连后的首个 RPC，请求协商协议版本、上报客户端信息并完成鉴权。 |
| `health` | `probe`: boolean，为 `true` 时强制主动探测；否则优先返回缓存快照 | `HealthSummary`；顶层通常是 `{ ts, ok, checks, versions, presence, meta }`，命中缓存时 `meta.cached=true`。 | 读取 Gateway 健康快照。 |
| `status` | 无参数；依赖当前连接上下文。 | 状态摘要对象；顶层通常是 `{ ok, summary, sections }`，按 CLI 展示口径返回。 | 返回 CLI 风格的综合状态摘要。 |
| `gateway.identity.get` | 无参数；依赖当前连接上下文。 | `{ deviceId, publicKey }`。 | 返回 Gateway 设备身份与公钥。 |
| `last-heartbeat` | 无参数；依赖当前连接上下文。 | 最近一次 heartbeat 事件或 `null`。 | 返回最近一次 heartbeat 事件。 |
| `set-heartbeats` | `enabled*`: boolean，是否启用 heartbeat runner | `{ ok, enabled }`。 | 开启或关闭心跳上报。 |
| `system-presence` | 无参数；依赖当前连接上下文。 | presence 条目数组。 | 列出当前系统 presence 条目。 |
| `system-event` | `text*`: string，事件正文<br>`deviceId`: string，设备 ID<br>`instanceId`: string，实例 ID<br>`host`: string，主机名<br>`ip`: string，IP 地址<br>`mode`: string，运行模式<br>`version`: string，版本号<br>`platform`: string，平台<br>`deviceFamily`: string，设备家族<br>`modelIdentifier`: string，型号标识<br>`lastInputSeconds`: number，距上次输入的秒数<br>`reason`: string，原因标签<br>`roles`: string[]，角色列表<br>`scopes`: string[]，scope 列表<br>`tags`: string[]，标签列表 | `{ ok: true }`。 | 写入一条系统事件，并在需要时刷新 presence 广播。 |
