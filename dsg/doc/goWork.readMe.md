下面是一段可直接放进你仓库 `CONTRIBUTING.md` 的 **Go Workspace（go.work）说明**，适配你现在的结构（Monorepo、多个 go 服务、`libs` 等共享库）。

````md
## Go 开发（Workspace / go.work）

本仓库采用 Go Modules + Go Workspace（`go.work`）的方式管理多个 Go 服务与共享库。

### 目的

仓库中包含多个 Go module（每个服务/库各自一个 `go.mod`）。提交 `go.work` 的目标是：

- 让所有 Go 服务在本地开发时可以直接引用仓库内的共享库（例如 `common`、`session`）
- 避免在各服务 `go.mod` 中使用本地 `replace`（防止污染正式依赖）
- 降低新贡献者/开源用户的上手成本，实现开箱即用的编译与测试

### 目录约定

- Go 服务：`services/apps/<service-name>/`
- Go 共享库：`services/libs/<lib-name>/`
- 仓库根目录：`go.work`、`go.work.sum`

### 环境要求

- Go 版本：建议使用 `go.work` 中声明的版本（例如 Go 1.22+）

### 初始化

克隆仓库后，建议在仓库根目录执行：

```bash
go work sync
````

然后即可在仓库根目录运行 Go 相关命令（示例）：

```bash
go test ./...
```

或进入某个服务目录单独构建/测试：

```bash
cd services/apps/<service-name>
go test ./...
go build ./...
```

### 重要约定：不要提交本地 replace

请不要在任何 `go.mod` 中提交本地 `replace`（例如指向 `../libs/common` 的相对路径）。
仓库内模块间的本地联调依赖统一通过 `go.work` 维护。

如果你在本地临时需要 `replace` 做调试，请确保不要提交到 PR。

### CI / 发布说明

`go.work` 主要用于本地开发与协同开发体验。某些 CI 或发布流程可能会显式关闭 workspace：

```bash
GOWORK=off go build ./...
```

一般情况下不需要手动设置，按仓库默认配置即可。

```

如果你把你实际的 Go 版本（例如 1.20/1.21/1.22）和你最终确定的目录（是否是 `services/apps` + `services/libs`）告诉我，我可以把这段文案再精确到你仓库的真实结构，并补一段“如何新增服务/库并更新 go.work”的流程。
```
