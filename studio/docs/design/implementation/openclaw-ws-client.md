# Express 与 OpenClaw 的 WebSocket 连接

## 数字员工 HTTP 管理协议

数字员工 Web 界面（Studio Web） 通过 HTTP 协议请求 Express 执行管理操作。Express 和 OpenClaw 之间保持 WebSocket 长连接，并通过 JSON PRC 进行消息通信。

```mermaid
flowchart LR
SW[Studio Web] -- HTTP --> BE[ Express ]
BE <-- ws --> CL[OpenClaw]
```

## 建立 WebSocket 连接
在 Express 中使用一个 OpenClawGatewayClient 单例来维持与 OpenClaw Gateway 的 WebSocket 连接，避免每次接收 HTTP 请求时都需要重新握手。

OpenClawGatewayClient 负责维持与 OpenClaw Gateway 的心跳，在连接断开时进行重连。

## 执行 WebSocket RPC 调用

通过向 OpenClawGatewayClient 传入请求和处理函数来复用 WebSocket 连接执行 JSON RPC 调用。
