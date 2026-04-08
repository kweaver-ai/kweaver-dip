# 工程结构

当前后端服务采用 Express + TypeScript 的分层脚手架，目录职责如下：

- `src/app.ts`：组装 Express 应用、中间件和路由。
- `src/server.ts`：读取环境变量并启动 HTTP 服务。
- `src/utils/`：通用工具与运行时配置解析。
- `src/infra/`：基础设施适配层，例如 OpenClaw Gateway WebSocket 客户端。
- `src/adapters/`：外部资源适配器，基于端口接口整合具体依赖调用。
- `src/routes/`：HTTP 路由定义。
- `src/logic/`：核心业务逻辑。
- `src/middleware/`：通用中间件，例如 404 和错误处理。
- `src/errors/`：领域内可复用的错误类型。
- `src/scripts/`：系统初始化脚本。
- `src/*.test.ts`：单元测试与接口测试。
