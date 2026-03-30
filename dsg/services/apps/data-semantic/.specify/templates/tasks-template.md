# {{feature_name}} Tasks

> **Branch**: `feature/{{feature_name}}`  
> **Spec Path**: `specs/{{feature_name}}/`  
> **Created**: {{date}}  
> **Input**: spec.md, plan.md

---

## Task Format

```
[ID] [P?] [Story] Description
```

| 标记 | 含义 |
|------|------|
| `T001` | 任务 ID |
| `[P]` | 可并行执行（不同文件，无依赖） |
| `[US1]` | 关联 User Story 1 |
| `[TEST]` | 测试任务（必须完成） |
| `[BENCH]` | 性能测试（可选） |

---

## Task Overview

| ID | Task | Story | Status | Parallel | Est. Lines |
|----|------|-------|--------|----------|------------|
| T001 | 项目基础设置 | Setup | ⏸️ | - | - |
| T002 | API 文件定义 | US1 | ⏸️ | - | 30 |
| T003 | DDL 文件定义 | US1 | ⏸️ | [P] | 20 |
| T004 | goctl 生成代码 | US1 | ⏸️ | - | - |
| T005 | Model 层实现 + 测试 | US1 | ⏸️ | - | 80 |
| T006 | Logic 层实现 + 测试 | US1 | ⏸️ | - | 80 |
| T007 | 集成测试 | US1 | ⏸️ | - | 40 |

---

## Phase 1: Setup

**目的**: 项目初始化和基础配置

- [ ] T001 确认 Go-Zero 项目结构已就绪
- [ ] T002 [P] 确认 goctl 工具已安装
- [ ] T003 [P] 确认测试框架已配置 (`go get github.com/stretchr/testify`)

**Checkpoint**: ✅ 开发环境就绪

---

## Phase 2: Foundation (Go-Zero 基础)

**目的**: 必须完成后才能开始 User Story 实现

- [ ] T004 确认 base.api 已定义通用类型
- [ ] T005 确认 ServiceContext 已配置
- [ ] T006 [P] 确认数据库连接已配置

**Checkpoint**: ✅ 基础设施就绪，可开始 User Story 实现

---

## Phase 3: User Story 1 - [标题] (P1) 🎯 MVP

**目标**: [简述此 Story 交付什么]

**独立测试**: [如何验证此 Story 已完成]

### Step 1: 定义 API 文件

- [ ] T007 [US1] 创建 `api/doc/{module}/{feature}.api`
- [ ] T008 [US1] 定义 Request/Response 类型
- [ ] T009 [US1] 在 `api/doc/api.api` 入口文件中 import 新模块

### Step 2: 生成代码

- [ ] T010 [US1] 运行 `goctl api go` 生成 Handler/Types
  ```bash
  goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
  ```

- [ ] T011 [US1] 运行 `goctl api swagger` 生成 Swagger 文档
  ```bash
  make swagger
  ```

### Step 3: 定义 DDL

- [ ] T012 [P] [US1] 创建 `migrations/{module}/{table}.sql`

### Step 4: 实现 Model 层 + 测试 🧪

> **Test-First**: 实现和测试必须同步完成

- [ ] T013 [US1] 创建 `model/{module}/{feature}/interface.go`
- [ ] T014 [P] [US1] 创建 `model/{module}/{feature}/types.go`
- [ ] T015 [P] [US1] 创建 `model/{module}/{feature}/vars.go`
- [ ] T016 [US1] 实现 `model/{module}/{feature}/gorm_dao.go`
- [ ] T017 [US1] **[TEST]** 创建 `model/{module}/{feature}/gorm_dao_test.go`
  - [ ] 测试 Create 方法
  - [ ] 测试 FindOne 方法
  - [ ] 测试 Update 方法
  - [ ] 测试 Delete 方法
  - [ ] 测试边界情况和错误处理

### Step 5: 实现 Logic 层 + 测试 🧪

> **Test-First**: 实现和测试必须同步完成

- [ ] T018 [US1] 实现 `api/internal/logic/{module}/create_{feature}_logic.go`
- [ ] T019 [US1] **[TEST]** 测试 `api/internal/logic/{module}/create_{feature}_logic_test.go`
- [ ] T020 [P] [US1] 实现 `api/internal/logic/{module}/get_{feature}_logic.go`
- [ ] T021 [P] [US1] **[TEST]** 测试 `api/internal/logic/{module}/get_{feature}_logic_test.go`
- [ ] T022 [P] [US1] 实现 `api/internal/logic/{module}/list_{feature}_logic.go`
- [ ] T023 [P] [US1] **[TEST]** 测试 `api/internal/logic/{module}/list_{feature}_logic_test.go`

### Step 6: 验证测试

- [ ] T024 [US1] 运行所有测试确认通过
  ```bash
  go test ./... -v
  ```
- [ ] T025 [US1] 检查测试覆盖率
  ```bash
  go test ./... -coverprofile=coverage.out
  go tool cover -func=coverage.out
  ```

**Checkpoint**: ✅ User Story 1 已完成，代码 + 测试 全部通过

---

## Phase 4: User Story 2 - [标题] (P2)

<!-- 复杂功能添加更多 Story，简单功能省略 -->

**目标**: [简述此 Story 交付什么]

**独立测试**: [如何验证此 Story 已完成]

### Implementation + Test

- [ ] T030 [US2] 实现功能
- [ ] T031 [US2] **[TEST]** 创建测试用例

**Checkpoint**: ✅ User Story 2 已完成，代码 + 测试 全部通过

---

## Phase N: Polish

**目的**: 收尾工作

- [ ] TXXX 代码清理和格式化 (`gofmt -w .`)
- [ ] TXXX 运行 `golangci-lint run`
- [ ] TXXX **确认测试覆盖率 > 80%**
- [ ] TXXX 更新 API 文档

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1 + Tests) → Phase 4 (US2 + Tests) → ...
    ↓
Phase N (Polish)
```

### 并行执行说明

- `[P]` 标记的任务可与同 Phase 内其他 `[P]` 任务并行
- `[TEST]` 标记的任务必须与对应实现任务同步完成
- 不同 User Story 可并行（如有团队协作）

---

## 测试要求 🧪

| 要求 | 标准 |
|------|------|
| **单元测试覆盖率** | > 80% |
| **关键路径测试** | 100% 覆盖 |
| **边界测试** | 必须包含 |
| **错误处理测试** | 必须包含 |

### 测试命名规范

```
Test{Function}_{Scenario}_{ExpectedResult}
```

示例：
- `TestCreateUser_ValidInput_ReturnsUser`
- `TestCreateUser_DuplicateEmail_ReturnsError`

---

## Notes

- 每个 Task 完成后提交代码
- **实现和测试必须同时提交**
- 每个 Checkpoint 运行 `go test ./...` 验证
- 遇到问题及时记录到 Open Questions
