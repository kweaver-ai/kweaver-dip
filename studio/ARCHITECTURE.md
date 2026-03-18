# 工程结构

当前后端服务采用 Express + TypeScript 的分层脚手架，目录职责如下：

- `src/app.ts`：组装 Express 应用、中间件和路由。
- `src/server.ts`：读取环境变量并启动 HTTP 服务。
- `src/config/`：运行时配置与环境变量解析。
- `src/infra/`：基础设施适配层，例如 OpenClaw Gateway WebSocket 客户端。
- `src/adapters/`：外部资源适配器，基于端口接口整合具体依赖调用。
- `src/routes/`：HTTP 路由定义。
- `src/middleware/`：通用中间件，例如 404 和错误处理。
- `src/errors/`：领域内可复用的错误类型。
- `src/*.test.ts`：单元测试与接口测试。

默认暴露 `GET /health` 健康检查接口，测试覆盖率门槛配置为 90%。
