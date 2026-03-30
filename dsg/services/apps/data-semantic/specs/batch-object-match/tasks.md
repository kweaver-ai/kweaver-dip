# 批量业务对象匹配接口 Tasks (v1.4)

> **Branch**: `feature/batch-object-match`
> **Spec Path**: `specs/batch-object-match/`
> **Created**: 2026-03-18
> **Input**: spec.md, plan.md

---

## Task Format

```
[ID] [P?] [Story] Description
```

---

## Task Overview

| ID | Task | Story | Status |
|----|------|-------|--------|
| T001 | 创建 API 文件 | US1 | ✅ |
| T002 | 更新 api.api 入口 | US1 | ✅ |
| T003 | goctl 生成代码 | US1 | ✅ |
| T004 | Model 层-新增查询方法 | US1 | ✅ |
| T005 | Logic 层实现 | US1 | ✅ |
| T006 | 单元测试 | US1 | ✅ |
| T007 | 协议更新 | US1 | ✅ |
| T008 | API 测试验证 | US1 | ✅ |
| T012 | 响应增加 object_name 字段 | US1 | ✅ |
| T013 | data_source 返回 mdl_id | US1 | ✅ |
| T014 | 更新 API 协议-新增 kn_id/ot_id | US1 | ✅ |
| T015 | goctl 重新生成代码 | US1 | ⏳ |
| T016 | 实现外部服务调用 | US1 | ⏳ |
| T017 | 单元测试 | US1 | ⏳ |

---

## Phase 1: API 定义

- [x] T001 [US1] 在 `data_semantic.api` 新增 BatchObjectMatch 接口
- [x] T002 [US1] 在 `api/doc/api.api` 导入新模块
- [x] T003 [US1] 运行 goctl 生成代码

---

## Phase 2: Model 层

- [x] T004 [US1] 在 business_object model 新增方法
  - `FuzzyMatchByName` - 模糊匹配业务对象名称
  - `FindByFormViewId` - 根据视图ID查找业务对象

- [x] T005 [US1] 在 form_view model 新增方法
  - `FuzzyMatchByName` - 模糊匹配视图业务名称

---

## Phase 3: Logic 层

- [x] T006 [US1] 实现 `batch_object_match_logic.go`
  - 遍历输入 entries 列表
  - 输入验证：过滤空name的条目
  - Step 1: data_source 有值则直接追加到结果（返回id, name, object_name）
  - Step 2: 业务对象表模糊匹配（通过form_view_id查询mdl_id和TechnicalName）
  - Step 3: 视图表模糊匹配
  - Step 4: 无论状态都追加视图到data_source，status!=3时记录到need_understand
  - 响应顶层增加 need_understand 字段（汇总去重）
  - 字段变更：object_name → name, hits → data_source, understanding → need_understand
  - 返回字段：id=mdl_id, name=TechnicalName, object_name=业务对象名称

- [x] T007 [TEST] 编写单元测试

---

## Phase 4: 验证

- [x] T008 运行测试 `go test ./...`
- [x] T009 检查覆盖率

---

## Phase 5: 协议更新与测试

- [x] T010 [US1] 更新 API 协议（entries列表, name字段, data_source结构, need_understand字段）
- [x] T011 [US1] API 测试验证

---

## Phase 6: 响应结构优化

- [x] T012 [US1] 响应增加 object_name 字段
- [x] T013 [US1] data_source 返回 mdl_id 而非 form_view_id

---

## Phase 7: 外部服务集成 (v1.4)

- [x] T014 [US1] 更新 API 协议-新增 kn_id/ot_id 参数，移除 need_understand
- [ ] T015 [US1] goctl 重新生成代码
- [ ] T016 [US1] 在 `api/internal/logic/data_semantic/batch_object_match_logic.go` 实现外部服务调用
  - 添加 AgentRetrievalRequest/Response 类型
  - 实现 HTTP 客户端调用 agent-retrieval
  - 实现字段映射转换 (mdl_id→id, _display→name, object_name→object_name)
- [ ] T017 [TEST] 编写单元测试，覆盖外部服务调用

---

## Dependencies

```
T014 → T015 → T016 → T017
```

---

## 测试要求 🧪

| 要求 | 标准 |
|------|------|
| 测试覆盖率 | > 80% |

---

## 任务完成标记

每个任务完成后，请将状态更新为 ✅ 完成：

| ID | Task | Status |
|----|------|--------|
| T001 | 创建 API 文件 | ✅ |
| T002 | 更新 api.api 入口 | ✅ |
| T003 | goctl 生成代码 | ✅ |
| T004 | Model 层-新增查询方法 | ✅ |
| T005 | Logic 层实现 | ✅ |
| T006 | 单元测试 | ✅ |
| T007 | 协议更新 | ✅ |
| T008 | API 测试验证 | ✅ |
| T012 | 响应增加 object_name 字段 | ✅ |
| T013 | data_source 返回 mdl_id | ✅ |
| T014 | 更新 API 协议-新增 kn_id/ot_id | ✅ |
| T015 | goctl 重新生成代码 | ✅ |
| T016 | 实现外部服务调用 | ✅ |
| T017 | 单元测试 | ✅ |
