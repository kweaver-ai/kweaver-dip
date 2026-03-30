# Scripts 目录说明

本目录包含项目相关的自动化脚本。

## 脚本列表

### 1. `start-go-services.sh` - Go 服务启动脚本

**功能：**
- 自动扫描 `services/apps/` 目录下的所有 Go 服务（通过 `go.mod` 识别）
- 使用 Docker Compose 启动服务及其依赖组件
- 支持多种启动模式

**使用方法：**
```bash
# 从项目根目录执行
./script/start-go-services.sh
```

**启动模式：**
1. 标准模式 - 所有服务 + 依赖组件
2. 开发模式 - 包含开发工具（如 Kafka UI）
3. 仅核心服务 - 不包含可选工具
4. 仅 Go 服务 - 不包含依赖组件

---

### 2. `verify-go-work.sh` - Go Workspace 验证脚本

**功能：**
- 验证 `go.work` 文件语法
- 检查 workspace 中的模块
- 验证模块依赖
- 测试模块构建

**使用方法：**
```bash
# 从项目根目录执行
./script/verify-go-work.sh
```

**验证内容：**
- ✅ go.work 文件存在性
- ✅ go.work 语法正确性
- ✅ GOWORK 环境变量
- ✅ Workspace 中的模块
- ✅ 模块依赖验证
- ✅ 模块构建测试
- ✅ Workspace 依赖同步

---

## Go Workspace (go.work) 说明

### 什么是 go.work？

`go.work` 是 Go 1.18+ 引入的 **Workspace 模式**，用于管理多个 Go 模块的联合开发。

### 当前配置

当前 `go.work` 包含以下模块：
- `./services/apps/basic-search`

### 常用命令

```bash
# 查看 workspace 内容
go work edit -print

# 添加新模块到 workspace
go work use ./services/apps/new-service

# 从 workspace 移除模块
go work edit -dropuse ./services/apps/old-service

# 同步 workspace 依赖
go work sync

# 查看当前使用的 workspace
go env GOWORK
```

### 验证 workspace

运行验证脚本：
```bash
./script/verify-go-work.sh
```

---

## 注意事项

1. **go.work 可以提交到仓库**
   - 根据项目需求，go.work 可以提交到仓库
   - 方便团队统一开发环境
   - CI/CD 流程中会忽略 go.work（使用各服务的 go.mod）

2. **脚本执行权限**
   - 所有脚本都已设置执行权限
   - 如果无法执行，运行 `chmod +x script/*.sh`

3. **路径要求**
   - 脚本需要在项目根目录执行
   - 脚本会自动检测并切换到正确的目录
