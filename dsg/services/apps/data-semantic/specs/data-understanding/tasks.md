# Data Understanding Tasks

> **Branch**: `feature/data-understanding`
> **Spec Path**: `specs/data-understanding/`
> **Created**: 2026-02-04
> **Input**: spec.md, plan.md
> **组织方式**: 接口增量交付 (完成一个接口，验证一个接口)

---

## Task Format

```
[ID] [P?] [Interface] Description
```

| 标记 | 含义 |
|------|------|
| `T001` | 任务 ID |
| `[P]` | 可并行执行（不同文件，无依赖） |
| `[IF1]` | 关联接口 1 (GetStatus) |
| `[TEST]` | 测试任务（必须完成） |

---

## Task Overview

| Phase | 接口 | 任务数 | 可独立验证 | Est. Lines |
|-------|------|--------|-----------|------------|
| Phase 1-2 | Setup + Foundation | 16 | - | - |
| Phase 3 | IF1: GetStatus | 4 | ✅ | 50 |
| Phase 4 | IF2: GenerateUnderstanding + Consumer | 16 | ✅ | 400 |
| Phase 5 | IF3: GetFields | 10 | ✅ | 150 |
| Phase 6 | IF4: SaveSemanticInfo | 10 | ✅ | 200 |
| Phase 7 | IF5: GetBusinessObjects | 10 | ✅ | 150 |
| Phase 8 | IF6: SaveBusinessObjects | 8 | ✅ | 120 |
| Phase 9 | IF7: MoveAttribute | 8 | ✅ | 100 |
| Phase 10 | IF8: RegenerateBusinessObjects | 6 | ✅ | 100 |
| Phase 11 | IF9: SubmitUnderstanding | 10 | ✅ | 150 |
| Phase 12 | IF10: DeleteBusinessObjects | 8 | ✅ | 100 |
| Phase 13 | Polish | 6 | - | - |

**总计**: 112 个任务

---

## Phase 1: Setup (环境准备)

**目的**: 项目初始化和基础配置

- [X] T001 确认 Go 1.24+ 已安装 (`go version`)
- [X] T002 [P] 确认 goctl 工具已安装 (`goctl version`)
- [X] T003 [P] 安装通用库 `go get github.com/jinguoxing/idrm-go-base@latest`

**Checkpoint**: ✅ 开发环境就绪

---

## Phase 2: Foundation (基础设施搭建)

**目的**: 必须完成后才能开始接口实现

### Step 1: 错误码定义

- [X] T004 在 `internal/errorx/codes.go` 中定义数据理解错误码 (600101-600130)

### Step 2: 错误码定义

- [X] T004 在 `internal/errorx/codes.go` 中定义数据理解错误码

### Step 3: 数据库迁移文件

- [X] T007 [P] 创建 `migrations/data_understanding/raw/t_business_object.sql`
- [X] T008 [P] 创建 `migrations/data_understanding/raw/t_business_object_attributes.sql`
- [X] T009 [P] 创建 `migrations/data_understanding/raw/t_business_object_temp.sql`
- [X] T010 [P] 创建 `migrations/data_understanding/raw/t_business_object_attributes_temp.sql`
- [X] T011 [P] 创建 `migrations/data_understanding/raw/t_form_view_info_temp.sql`
- [X] T012 [P] 创建 `migrations/data_understanding/raw/t_form_view_field_info_temp.sql`
- [X] T013 [P] 创建 `migrations/data_understanding/raw/t_kafka_message_log.sql`
- [X] T014 [P] 创建 `migrations/data_understanding/raw/form_view_alter.sql`
- [X] T015 [P] 创建 `migrations/data_understanding/raw/form_view_field_alter.sql`

### Step 4: 执行数据库迁移

- [ ] T016 执行 DDL 创建新表和扩展现有表

**Checkpoint**: ✅ 基础设施就绪

---

## Phase 3: 接口1 - GetStatus (查询状态) ✅ 第一个可验证接口

**目标**: 用户查询库表理解状态和版本号

**API**: `GET /api/data-semantic/v1/:id/status`

**独立测试**: 调用接口返回 `understand_status` 和 `current_version`

### Step 1: API 定义

- [X] T017 [IF1] 创建 `api/doc/data_semantic/data_semantic.api` 基础结构
- [X] T018 [IF1] 定义 GetStatus 接口
- [X] T019 [IF1] 在 `api/doc/api.api` 中导入 data_semantic 模块

### Step 2: 生成代码

- [X] T020 [IF1] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group`
- [X] T021 [IF1] 运行 `make swagger` 生成 Swagger 文档

### Step 3: Logic 层实现

- [X] T022 [IF1] 实现 `api/internal/logic/data_semantic/get_status_logic.go`
- [X] T023 [IF1] **[TEST]** 创建 `get_status_logic_test.go`

**Checkpoint**: ✅ 接口1 完成 - 可用 Postman/curl 验证

---

## Phase 4: 接口2 - GenerateUnderstanding (一键生成) + Kafka Consumer

**目标**: 用户点击"一键生成"启动 AI 分析，Kafka 消费者处理响应

**API**: `POST /api/data-semantic/v1/:id/generate`

**独立测试**: 点击"一键生成"后状态变为"理解中"，Kafka 消费者处理后变为"待确认"

### Step 1: API 定义

- [X] T024 [IF2] 定义 GenerateUnderstanding 接口
- [X] T025 [IF2] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Model 层实现 (Kafka 相关)

- [X] T026 [P] [IF2] 创建 `model/data_understanding/kafka_message_log/interface.go`
- [X] T027 [P] [IF2] 创建 `model/data_understanding/kafka_message_log/types.go`
- [X] T028 [P] [IF2] 创建 `model/data_understanding/kafka_message_log/vars.go`
- [X] T029 [P] [IF2] 创建 `model/data_understanding/kafka_message_log/factory.go`
- [X] T030 [IF2] 实现 `model/data_understanding/kafka_message_log/sqlx_model.go`
- [X] T031 [IF2] **[TEST]** 创建 `kafka_message_log_test.go`

### Step 3: Logic 层实现 (一键生成)

- [X] T032 [IF2] 实现 `generate_understanding_logic.go`
  - 状态校验 (0 或 3 才允许生成)
  - 更新状态为 1（理解中）
  - Redis 限流检查
  - **支持 fields 参数（部分字段理解）**
  - AI 服务 HTTP API 调用（full_understanding 或 partial_understanding）
- [X] T033 [IF2] **[TEST]** 创建 `generate_understanding_logic_test.go`

### Step 4: Kafka Consumer 实现

- [X] T034 [P] [IF2] 创建 `consumer/data_understanding/kafka_consumer.go` (消费者初始化)
- [X] T035 [P] [IF2] 创建 `consumer/data_understanding/handler.go` (消息处理逻辑)
- [X] T036 [IF2] 实现 message_id 去重检查
- [X] T036a [IF2] **[新增]** 实现库表理解状态检查（必须为 1-理解中才处理）
- [X] T037 [IF2] 实现成功响应处理 (保存 table_semantic、fields_semantic、no_pattern_fields、business_objects 到临时表，更新状态为 2)
  - **no_pattern_fields 保存到 t_business_object_attributes_temp，business_object_id=NULL, attr_name=NULL (未识别字段)**
- [X] T037b [IF2] **[新增]** 实现未识别字段保存逻辑 (saveNoPatternFields 方法，保存未归属字段)
- [X] T038 [IF2] 实现失败响应处理 (更新状态为 5-理解失败，记录结构化日志)
- [X] T039 [IF2] **[TEST]** 创建 consumer 测试 (Mock Kafka)

**Checkpoint**: ✅ 接口2 + Consumer 完成 - 可端到端验证（需要 Mock AI 服务）

---

## Phase 5: 接口3 - GetFields (查询字段语义)

**目标**: 用户查询字段语义补全数据

**API**: `GET /api/data-semantic/v1/:id/fields`

**独立测试**: 状态 0 返回空，状态 2 返回临时表，状态 3 返回正式表

### Step 1: API 定义

- [X] T040 [IF3] 定义 GetFields 接口
- [X] T041 [IF3] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Model 层实现

- [X] T042 [P] [IF3] 创建 `model/data_understanding/form_view_info_temp/` 目录文件
- [X] T043 [P] [IF3] 创建 `model/data_understanding/form_view_field_info_temp/` 目录文件
- [X] T044 [IF3] **[TEST]** 创建临时表 Model 测试

### Step 3: Logic 层实现

- [X] T045 [IF3] 实现 `get_fields_logic.go` (状态 2 查临时表，其他状态查正式表)
- [X] T046 [IF3] **[TEST]** 创建 `get_fields_logic_test.go`

**Checkpoint**: ✅ 接口3 完成 - 可验证不同状态的数据返回

---

## Phase 6: 接口4 - SaveSemanticInfo (保存语义信息)

**目标**: 用户编辑库表业务名称、字段业务名称、角色和描述

**API**: `PUT /api/data-semantic/v1/:id/semantic-info`

**独立测试**: 修改后查询接口返回最新编辑的内容

### Step 1: API 定义

- [X] T047 [IF4] 定义 SaveSemanticInfo 接口
- [X] T048 [IF4] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Logic 层实现

- [X] T049 [IF4] 实现 `save_semantic_info_logic.go` (更新临时表，不递增版本)
- [X] T050 [IF4] **[TEST]** 创建 `save_semantic_info_logic_test.go`

**Checkpoint**: ✅ 接口4 完成 - 配合接口3 验证编辑保存功能

---

## Phase 7: 接口5 - GetBusinessObjects (查询业务对象)

**目标**: 用户查看 AI 识别的业务对象和属性分组

**API**: `GET /api/data-semantic/v1/:id/business-objects`

**独立测试**: 返回业务对象列表和属性嵌套结构

### Step 1: API 定义

- [X] T051 [IF5] 定义 GetBusinessObjects 接口
- [X] T052 [IF5] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Model 层实现

- [X] T053 [P] [IF5] 创建 `model/data_understanding/business_object_temp/` 目录文件
- [X] T054 [P] [IF5] 创建 `model/data_understanding/business_object_attributes_temp/` 目录文件
- [X] T055 [IF5] **[TEST]** 创建临时表 Model 测试

### Step 3: Logic 层实现

- [X] T056 [IF5] 实现 `get_business_objects_logic.go` (状态 2 查临时表，其他状态查正式表)
- [X] T057 [IF5] **[TEST]** 创建 `get_business_objects_logic_test.go`

**Checkpoint**: ✅ 接口5 完成 - 可验证业务对象查询

---

## Phase 8: 接口6 - SaveBusinessObjects (保存业务对象)

**目标**: 用户修改业务对象名称、属性名称

**API**: `PUT /api/data-semantic/v1/:id/business-objects`

**独立测试**: 修改后查询接口返回更新后的结构

### Step 1: API 定义

- [X] T058 [IF6] 定义 SaveBusinessObjects 接口
- [X] T059 [IF6] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Logic 层实现

- [X] T060 [IF6] 实现 `save_business_objects_logic.go` (名称重复校验)
- [X] T061 [IF6] **[TEST]** 创建 `save_business_objects_logic_test.go`

**Checkpoint**: ✅ 接口6 完成 - 配合接口5 验证编辑保存功能

---

## Phase 9: 接口7 - MoveAttribute (调整属性归属)

**目标**: 用户将属性移动到其他业务对象

**API**: `PUT /api/data-semantic/v1/:id/business-objects/attributes/move`

**独立测试**: 属性移动后查询接口显示新的归属关系

### Step 1: API 定义

- [X] T062 [IF7] 定义 MoveAttribute 接口
- [X] T063 [IF7] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Logic 层实现

- [X] T064 [IF7] 实现 `move_attribute_logic.go` (目标存在校验)
- [X] T065 [IF7] **[TEST]** 创建 `move_attribute_logic_test.go`

**Checkpoint**: ✅ 接口7 完成 - 配合接口5 验证属性移动功能

---

## Phase 10: 接口8 - RegenerateBusinessObjects (重新识别)

**目标**: 基于当前字段语义重新识别业务对象

**API**: `POST /api/data-semantic/v1/:id/business-objects/regenerate`

**独立测试**: 重新识别后创建新版本记录，旧版本保留

### Step 1: API 定义

- [X] T066 [IF8] 定义 RegenerateBusinessObjects 接口
- [X] T067 [IF8] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Logic 层实现

- [X] T068 [IF8] 实现 `regenerate_business_objects_logic.go`
  - 状态校验 (2 或 3)
  - 版本号递增逻辑
  - AI 服务 HTTP API 调用
- [X] T069 [IF8] **[TEST]** 创建 `regenerate_business_objects_logic_test.go`

**Checkpoint**: ✅ 接口8 完成 - 可验证版本号递增

---

## Phase 11: 接口9 - SubmitUnderstanding (提交确认)

**目标**: 将临时表数据同步到正式表

**API**: `POST /api/data-semantic/v1/:id/submit`

**独立测试**: 提交后正式表有数据，状态变为"已完成"

### Step 1: API 定义

- [X] T070 [IF9] 定义 SubmitUnderstanding 接口
- [X] T071 [IF9] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Model 层实现 (正式表)

- [X] T072 [P] [IF9] 创建 `model/data_understanding/business_object/` 目录文件
- [X] T073 [P] [IF9] 创建 `model/data_understanding/business_object_attributes/` 目录文件
- [X] T074 [IF9] **[TEST]** 创建正式表 Model 测试

### Step 3: Logic 层实现

- [X] T075 [IF9] 实现 `submit_understanding_logic.go`
  - 事务处理
  - 临时表 → 正式表同步
  - 状态更新为 3（已完成）
- [X] T076 [IF9] **[TEST]** 创建 `submit_understanding_logic_test.go`

**Checkpoint**: ✅ 接口9 完成 - 可验证数据同步到正式表

---

## Phase 12: 接口10 - DeleteBusinessObjects (删除识别结果)

**目标**: 删除业务对象临时数据

**API**: `DELETE /api/data-semantic/v1/:id/business-objects`

**独立测试**: 删除后临时表数据被逻辑删除，状态根据正式表数据保持或回退

### Step 1: API 定义

- [X] T077 [IF10] 定义 DeleteBusinessObjects 接口
- [X] T078 [IF10] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 更新代码

### Step 2: Logic 层实现

- [X] T079 [IF10] 实现 `delete_business_objects_logic.go`
  - 状态校验 (仅允许状态 2)
  - 逻辑删除临时表数据
  - 根据正式表是否有数据决定保持状态 3 或回退到 0
- [X] T080 [IF10] **[TEST]** 创建 `delete_business_objects_logic_test.go`

**Checkpoint**: ✅ 接口10 完成 - 可验证删除逻辑

---

## Phase 13: Polish (收尾)

**目的**: 代码质量和文档完善

- [X] T081 代码格式化 (`gofmt -w .`)
- [X] T082 运行 `golangci-lint run`
- [X] T083 **确认测试覆盖率 > 80%**
- [X] T084 **[BENCH]** 创建性能基准测试 (验证 SC-01, SC-02)
- [X] T085 更新 API 文档
- [X] T086 更新 Swagger 文档

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (IF1: GetStatus) ← 第一个可验证接口
    ↓
Phase 4 (IF2: GenerateUnderstanding + Consumer)
    ↓
Phase 5 (IF3: GetFields) ← 依赖 IF2 (需要 AI 生成数据)
    ↓
Phase 6 (IF4: SaveSemanticInfo) ← 可与 IF3 并行开发
    ↓
Phase 7 (IF5: GetBusinessObjects) ← 依赖 IF2
    ↓
Phase 8 (IF6: SaveBusinessObjects) ← 可与 IF5 并行开发
    ↓
Phase 9 (IF7: MoveAttribute) ← 可与 IF6 并行开发
    ↓
Phase 10 (IF8: RegenerateBusinessObjects) ← 依赖 IF2, IF3, IF4
    ↓
Phase 11 (IF9: SubmitUnderstanding) ← 依赖 IF2, IF5
    ↓
Phase 12 (IF10: DeleteBusinessObjects) ← 可与 IF11 并行开发
    ↓
Phase 13 (Polish)
```

### 并行执行机会

- **Phase 5 & Phase 6**: GetFields 和 SaveSemanticInfo 可并行开发
- **Phase 7 & Phase 8**: GetBusinessObjects 和 SaveBusinessObjects 可并行开发
- **Phase 8 & Phase 9**: SaveBusinessObjects 和 MoveAttribute 可并行开发
- **Phase 11 & Phase 12**: SubmitUnderstanding 和 DeleteBusinessObjects 可并行开发

---

## 测试要求 🧪

| 要求 | 标准 |
|------|------|
| **单元测试覆盖率** | > 80% |
| **关键路径测试** | 100% 覆盖 (IF2, IF11) |
| **边界测试** | 必须包含 (状态流转、空值处理) |
| **错误处理测试** | 必须包含 (限流、Kafka 失败) |

### 接口验证清单

| 接口 | 验证方式 | 依赖 |
|------|----------|------|
| IF1: GetStatus | 直接调用查询状态表 | - |
| IF2: GenerateUnderstanding | 需 Mock AI 服务 HTTP API | - |
| IF3: GetFields | 先调用 IF2 生成数据，再调用 IF3 查询 | IF2 |
| IF4: SaveSemanticInfo | 调用 IF4 保存，再调用 IF3 验证 | IF3 |
| IF5: GetBusinessObjects | 先调用 IF2 生成数据，再调用 IF5 查询 | IF2 |
| IF6: SaveBusinessObjects | 调用 IF6 保存，再调用 IF5 验证 | IF5 |
| IF7: MoveAttribute | 调用 IF7 移动，再调用 IF5 验证 | IF5 |
| IF8: RegenerateBusinessObjects | 先调用 IF4 准备数据，再调用 IF8 | IF4, IF2 |
| IF9: SubmitUnderstanding | 调用 IF9 提交，查询正式表验证 | IF2, IF5 |
| IF10: DeleteBusinessObjects | 调用 IF10 删除，查询状态和临时表验证 | - |

---

## Notes

- 每个 Phase 完成后提交代码
- **实现和测试必须同时提交**
- 每个 Checkpoint 可用 Postman/curl 验证接口
- 遵循 Go-Zero 规范：Handler 仅参数校验，Logic 层处理业务逻辑
- 所有数据访问通过 Model 层（SQLx）
- 状态流转必须严格遵循 BR-01 规则
