# {{feature_name}} Technical Plan

> **Branch**: `feature/{{feature_name}}`  
> **Spec Path**: `specs/{{feature_name}}/`  
> **Created**: {{date}}  
> **Status**: Draft

---

## Summary

<!-- 技术方案概述（2-3句话），说明技术方案的核心决策 -->

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **Cache** | Redis 7.0 |
| **ORM** | GORM / SQLx |
| **Testing** | go test |
| **Common Lib** | idrm-go-base v0.1.0+ |

---

## 通用库 (idrm-go-base)

**安装**:
```bash
go get github.com/jinguoxing/idrm-go-base@latest
```

### 模块初始化

| 模块 | 初始化方式 |
|------|-----------|
| validator | `validator.Init()` 在 main.go |
| telemetry | `telemetry.Init(cfg)` 在 main.go |
| response | `httpx.SetErrorHandler(response.ErrorHandler)` |
| middleware | `rest.WithMiddlewares(...)` |

### 自定义错误码

<!-- 根据功能模块规划错误码范围 -->

| 功能 | 范围 | 位置 |
|------|------|------|
| {功能名} | 30x00-30x99 | `internal/errorx/codes.go` |

### 第三方库确认

> 如需使用通用库以外的第三方库，请在此列出并说明原因:

| 库 | 原因 | 确认状态 |
|----|------|----------|
| - | - | ⏳ 待确认 |

## Go-Zero 开发流程

按以下顺序完成技术设计和代码生成：

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/{module}/{feature}.api` |
| 2 | 生成 Handler/Types | goctl<generated> | `api/internal/handler/`, `types/` |
| 3 | 定义 DDL 文件 | AI 手写 | `migrations/{module}/{table}.sql` |
| 4 | 实现 Model 接口 | AI 手写 | `model/{module}/{feature}/` |
| 5 | 实现 Logic 层 | AI 实现 | `api/internal/logic/` |

> ⚠️ **重要**：goctl 必须在 `api/doc/api.api` 入口文件上执行，不能针对单个功能文件！

**goctl 命令**:
```bash
# 步骤1：在 api/doc/api.api 中 import 新模块
# 步骤2：执行 goctl 生成代码（针对整个项目）
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
```

---

## File Structure

### 文件产出清单

| 序号 | 文件 | 生成方式 | 位置 |
|------|------|----------|------|
| 1 | API 文件 | AI 实现 | `api/doc/{module}/{feature}.api` |
| 2 | DDL 文件 | AI 实现 | `migrations/{module}/{table}.sql` |
| 3 | Handler | goctl 生成 | `api/internal/handler/{module}/` |
| 4 | Types | goctl 生成 | `api/internal/types/` |
| 5 | Logic | AI 实现 | `api/internal/logic/{module}/` |
| 6 | Model | AI 实现 | `model/{module}/{feature}/` |

### 代码结构

```
api/internal/
├── handler/{module}/
│   ├── create_{feature}_handler.go    # goctl 生成
│   ├── get_{feature}_handler.go
│   └── routes.go
├── logic/{module}/
│   ├── create_{feature}_logic.go      # AI 实现
│   └── get_{feature}_logic.go
├── types/
│   └── types.go                       # goctl 生成
└── svc/
    └── servicecontext.go              # 手动维护

model/{module}/{feature}/
├── interface.go                       # 接口定义
├── types.go                           # 数据结构
├── vars.go                            # 常量/错误
├── factory.go                         # ORM 工厂
├── gorm_dao.go                        # GORM 实现
└── sqlx_model.go                      # SQLx 实现
```

---

## Architecture Overview

遵循 IDRM 分层架构：

```
HTTP Request → Handler → Logic → Model → Database
```

| 层级 | 职责 | 最大行数 |
|------|------|----------|
| Handler | 解析参数、格式化响应 | 30 |
| Logic | 业务逻辑实现 | 50 |
| Model | 数据访问 | 50 |

---

## Interface Definitions

<!-- 根据 Spec 中的 Data Considerations 定义 Model 接口 -->

```go
type Model interface {
    Insert(ctx context.Context, data *Entity) (*Entity, error)
    FindOne(ctx context.Context, id int64) (*Entity, error)
    Update(ctx context.Context, data *Entity) error
    Delete(ctx context.Context, id int64) error
    WithTx(tx interface{}) Model
}
```

---

## Data Model

### DDL

<!-- 根据 Spec 中的 Data Considerations 生成 DDL -->

**位置**: `migrations/{module}/{table}.sql`

```sql
CREATE TABLE `{table}` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `name` varchar(50) NOT NULL COMMENT '名称',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` datetime DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='表注释';
```

### Go Struct

```go
type Entity struct {
    Id        string         `gorm:"primaryKey;size:36"`  // UUID v7
    Name      string         `gorm:"size:50;not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

---

## API Contract

<!-- 根据 Spec 中的 Acceptance Criteria 生成 API 定义 -->

**位置**: `api/doc/{module}/{feature}.api`

```api
syntax = "v1"

import "../base.api"

type (
    CreateXxxReq {
        Name string `json:"name" validate:"required,max=50"`
    }
    CreateXxxResp {
        Id int64 `json:"id"`
    }
)

@server(
    prefix: /api/v1/{module}
    group: {feature}
)
service {{PROJECT_NAME}}-api {
    @handler CreateXxx
    post /{feature} (CreateXxxReq) returns (CreateXxxResp)
}
```

---

## Testing Strategy

| 类型 | 方法 | 覆盖率 |
|------|------|--------|
| 单元测试 | 表驱动测试，Mock Model | > 80% |
| 集成测试 | 测试数据库 | 核心流程 |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{date}} | - | 初始版本 |
