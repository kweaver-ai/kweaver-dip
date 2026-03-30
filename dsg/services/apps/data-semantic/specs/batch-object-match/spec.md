# 批量业务对象匹配接口 Specification (v1.4)

> **Branch**: `feature/batch-object-match`
> **Spec Path**: `specs/batch-object-match/`
> **Created**: 2026-03-18

> **Status**: Completed

---

## Overview

批量业务对象匹配接口 - 给定一批业务对象（有对象名字或视图ID），有视图ID时原样返回，有对象名字时从外部服务(agent-retrieval)检索，检索不到则返回空。

---

## Clarifications

### Session 2026-03-18

- Q: AI推荐的业务对象是否持久化？ → A: 仅作为推荐结果返回，不持久化
- Q: source_object_name 为空字符串时的处理逻辑？ → A: 视为无匹配，返回空 hits，走AI推荐流程
- Q: 接口是否需要权限验证？ → A: 需要登录验证（JWT）
- Q: AI语义理解的匹配方式？ → A: 简单文本模糊匹配（business_name LIKE %keyword% 或 description LIKE %keyword%）
- Q: 二次调用时如何传递"正在理解的视图ID"？ → A: 无需传递，每次调用都自动重新检查所有视图状态直到理解完成

### Session 2026-03-20

- Q: 外部服务 agent-retrieval 调用失败时，是否需要添加重试机制？ → A: 不重试，调用失败直接返回空结果，记录错误日志
- Q: 外部服务调用是否有超时时间要求？ → A: 30秒超时

---

## User Stories (v1.4)

### Story 1: 批量业务对象查询匹配 (P1)

AS a 前端用户
I WANT 输入一批业务对象名称 + kn_id + ot_id，从外部服务获取对应的视图信息
SO THAT 快速建立业务对象与视图的关联

**独立测试**: 调用接口，输入业务对象名称列表 + 知识网络ID + 对象ID，返回匹配的业务对象信息

---

## Acceptance Criteria (EARS)

### 正常流程

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-01 | data_source.id已存在 | WHEN 输入包含 data_source.id | THE SYSTEM SHALL 直接追加到结果，返回id、name、object_name |
| AC-02 | 外部服务检索成功 | WHEN 业务对象名称能从 agent-retrieval 服务检索 | THE SYSTEM SHALL 返回 mdl_id、name、object_name |
| AC-03 | 外部服务检索无结果 | WHEN 业务对象名称在 agent-retrieval 服务中无匹配 | THE SYSTEM SHALL 返回空 data_source |

### 异常处理

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-10 | 列表为空 | WHEN 批量列表为空数组 | THE SYSTEM SHALL 返回 400 错误 |
| AC-11 | 外部服务调用失败 | WHEN agent-retrieval 服务调用异常 | THE SYSTEM SHALL 返回空 data_source，记录错误日志 |

---

## Processing Flow (v1.4)

```
输入: []Entry (name 或 data_source), kn_id, ot_id
    │
    ▼
┌─────────────────────────────┐
│ 遍历每个 Entry               │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ name 为空?                   │
│     Yes → 跳过该条目        │
└─────────────────────────────┘
    │ No
    ▼
┌─────────────────────────────┐
│ 1. data_source 有值?        │
│     Yes → 直接追加到结果    │
└─────────────────────────────┘
    │
    ▼ No
┌─────────────────────────────┐
│ 2. 调用外部服务             │
│    agent-retrieval          │
│    POST /kn/query_object_   │
│    instance                 │
│    (kn_id, ot_id, name)    │
└─────────────────────────────┘
    │
    ▼ 成功
┌─────────────────────────────┐
│ 转换字段映射并返回          │
│ mdl_id → id                 │
│ _display → name             │
│ object_name → object_name   │
└─────────────────────────────┘
    │
    ▼ 失败/无结果
┌─────────────────────────────┐
│ 返回空 data_source          │
└─────────────────────────────┘
    │
    ▼
输出: []Entry
    - name: 原始输入名称
    - data_source: 匹配的视图列表
```

**超时与重试**: HTTP 客户端 30 秒超时，不重试

---

## Edge Cases (v1.4)

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-01 | 批量100条 | 逐条处理，返回100条结果 |
| EC-02 | 外部服务超时 | 返回空 data_source，记录错误日志 |
| EC-03 | 外部服务返回空 | 返回空 data_source（正常行为） |

---

## Data Considerations

### 输入数据结构 (v1.4)

| Field | Description | Constraints |
|-------|-------------|-------------|
| entries | 业务对象列表 | 必填，最多100条 |
| entries[].name | 业务对象名称 | 必填，非空字符串 |
| entries[].data_source | 给定的视图数据 | 可选，有值时直接追加到结果 |
| entries[].data_source.id | 视图ID | UUID格式 |
| entries[].data_source.name | 视图名称 | 字符串 |
| kn_id | 知识网络ID | 必填，UUID格式 |
| ot_id | 网络中指定对象ID | 必填，UUID格式 |

### 输出数据结构

| Field | Description | Constraints |
|-------|-------------|-------------|
| entries | 匹配结果列表 | |
| entries[].name | 原始输入名称 | |
| entries[].data_source | 匹配的视图列表 | 无匹配时为空数组 |
| entries[].data_source[].id | 视图ID (mdl_id) | UUID格式 |
| entries[].data_source[].name | 视图名称 (_display) | 字符串 |
| entries[].data_source[].object_name | 业务对象名称 | 字符串 |

---

## Success Metrics

| ID | Metric | Target |
|----|--------|--------|
| SC-01 | 接口响应时间 | < 500ms (P99) |
| SC-02 | 测试覆盖率 | > 80% |

## Non-Functional Requirements (v1.4)

| Category | Requirement |
|----------|-------------|
| 超时 | 外部服务 HTTP 客户端 30 秒超时 |
| 重试 | 不重试，失败时返回空结果并记录日志 |
| 外部依赖 | agent-retrieval 服务 |

---

## MODIFIED Requirements (v1.4)

### 请求参数变更

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| kn_id | string | 知识网络ID | 必填，UUID格式 |
| ot_id | string | 网络中指定对象ID | 必填，UUID格式 |

### 业务逻辑变更

| 原流程 | 新流程 |
|--------|--------|
| Step 2-3: 本地数据库查询 + 触发理解 | 仅调用外部服务 agent-retrieval 检索 |

**简化说明**: 接口完全从外部服务检索，不再查询本地数据库表，也不再返回待理解的视图ID。

### 外部服务调用

**服务**: agent-retrieval
**接口**: `POST /api/agent-retrieval/in/v1/kn/query_object_instance`
**参数**:
- Query: `kn_id`, `ot_id`
- Body:
```json
{
  "limit": 10,
  "condition": {
    "operation": "and",
    "sub_conditions": [
      { "field": "object_name", "operation": "like", "value_from": "const", "value": "{检索关键字}" }
    ]
  }
}
```

**响应数据结构**:
```json
{
  "datas": [
    {
      "form_view_id": "uuid",
      "object_name": "库存",
      "object_type": 0,
      "mdl_id": "uuid",
      "_instance_identity": { "id": "uuid" },
      "status": 1,
      "_instance_id": "string",
      "_display": "库存",
      "id": "uuid"
    }
  ]
}
```

**字段映射**:
| 外部服务字段 | 响应字段 |
|-------------|----------|
| mdl_id | id |
| _display | name |
| object_name | object_name |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-18 | - | 初始版本 |
| 1.1 | 2026-03-18 | - | 更新协议：list→entries, object_name→name, data_source结构, understanding→need_understand |
| 1.2 | 2026-03-18 | - | 更新响应结构：增加object_name字段，data_source返回mdl_id |
| 1.3 | 2026-03-18 | - | Step4无论状态都追加视图到data_source，输入验证name非空 |
| 1.4 | 2026-03-20 | - | 新增kn_id/ot_id参数，调用外部服务替代本地数据库查询 |
