# 模板总览

> **IDRM SDD Templates 模板文件说明**

---

## 模板文件列表

| 模板文件 | 用途 | SDD 阶段 |
|----------|------|----------|
| `spec-template.md` | 需求规格模板 | Phase 1: Specify |
| `plan-template.md` | 技术计划模板 | Phase 2: Design |
| `tasks-template.md` | 任务拆分模板 | Phase 3: Tasks |
| `checklist-template.md` | 质量检查清单 | 可选 |
| `agent-file-template.md` | AI 代理上下文 | 内部使用 |
| `api-template.api` | Go-Zero API 模板 | Phase 2/4 |
| `schema-template.sql` | DDL 模板 | Phase 2/4 |

---

## spec-template.md

### 用途
定义业务需求，供 `/speckit.specify` 命令使用。

### 核心节点

```markdown
## User Stories
用户故事，按优先级 P1/P2/P3 排序

## Acceptance Criteria (EARS)
验收标准，使用 WHEN/THE SYSTEM SHALL 格式

## Edge Cases
边界情况和异常场景

## Business Rules
业务规则 (非技术实现)

## Data Considerations
需要持久化的数据
```

### EARS 格式示例
```markdown
| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-01 | 登录成功 | WHEN 用户提交正确凭证 | THE SYSTEM SHALL 返回 token |
| AC-02 | 登录失败 | WHEN 密码错误 | THE SYSTEM SHALL 返回 401 |
```

---

## plan-template.md

### 用途
技术设计方案，供 `/speckit.plan` 命令使用。

### 核心节点

```markdown
## Technical Context
技术上下文 (语言、框架、数据库)

## goctl Development Flow
goctl 开发流程

## Layered Architecture
分层架构说明 (Handler → Logic → Model)

## Model Layer Structure
Model 层结构 (GORM + SQLx)

## DDL Template
DDL 模板
```

---

## tasks-template.md

### 用途
任务拆分，供 `/speckit.tasks` 命令使用。

### 核心节点

```markdown
## Phase 1: Setup
环境准备任务

## Phase 2: Foundation
基础设施任务

## Phase 3: User Stories
功能实现任务

## Phase 4: Polish
完善任务
```

### 任务格式
```markdown
- [ ] TASK-001: [简短描述]
  - 目标: [具体目标]
  - 文件: [涉及文件]
  - 验证: [验证方法]
```

---

## api-template.api

### 用途
Go-Zero API 定义模板。

### 示例
```api
syntax = "v1"

info (
    title:   "模块名"
    desc:    "模块描述"
    version: "v1"
)

import "base.api"

type (
    LoginReq {
        Phone    string `json:"phone"`
        Password string `json:"password"`
    }
    
    LoginResp {
        Token string `json:"token"`
    }
)

@server (
    prefix: /api/v1
    group:  user
)
service api {
    @handler Login
    post /user/login (LoginReq) returns (LoginResp)
}
```

---

## schema-template.sql

### 用途
DDL 模板，定义表结构。

### 示例
```sql
CREATE TABLE IF NOT EXISTS `user` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `phone`      VARCHAR(20) NOT NULL,
    `password`   VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## checklist-template.md

### 用途
质量检查清单，供 `/speckit.checklist` 命令使用。

### 检查维度
- **完整性** - 需求是否完整
- **清晰度** - 描述是否清晰
- **一致性** - 各文档是否一致
- **可测试性** - 是否可验证

---

## 模板定制

### 修改模板
直接编辑 `.specify/templates/` 下的文件即可。

### 添加新模板
1. 在 `.specify/templates/` 创建新模板文件
2. 在相应的命令文件中引用

---

## 下一步

- [SDD 工作流程详解](../docs/workflow.md)
- [部署指南](../docs/deployment.md)
