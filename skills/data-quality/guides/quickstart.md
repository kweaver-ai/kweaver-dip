---
name: "data-quality-quickstart"
description: "数据质量管理快速开始指南，包含详细示例。当用户需要详细示例或进行基本操作时使用。"
---

# 数据质量管理 - 快速开始

> 上一层: [核心概念](../core/core.md) | 下一层: [详细指南](./detailed-guide.md)
> **共享约束参考**: [核心约束](../reference/core-constraints.md)

## 配置流程

### 1. 验证配置
```http
GET {DATA_QUALITY_BASE_URL}/api/eacp/v1/user/get
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

### 2. 获取用户信息
响应中的 `userid` 字段用于 `responsible_uid`

## 常用操作

### 查询逻辑视图
```http
GET {BASE_URL}/api/data-view/v1/form-view?limit=20&offset=1
Authorization: {AUTH_TOKEN}
```

**参数**:
- `limit`: 每页数量 (默认 20)
- `offset`: 偏移量 (从 1 开始)
- `mdl_id`: 统一视图 ID (可选)

### 获取视图字段
```http
POST {BASE_URL}/api/data-view/v1/logic-view/field/multi
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{"ids": ["视图ID1", "视图ID2"]}
```

### 创建质量规则

> **⚠️ 有依据才配置原则**: 规则配置必须有明确的依据来源，禁止无依据配置。
> **约束详情请参考**: [核心约束 - 规则配置约束](../reference/core-constraints.md)

**依据信息来源**:
| 来源类型 | 说明 | 示例 |
|----------|------|------|
| 表级语义与业务知识 | 视图业务名称、业务描述 | "客户主数据表"表明存储客户信息 |
| 字段级语义与技术信息 | 字段业务名称、数据类型、约束 | `NOT NULL`约束可配置完整性规则 |
| 业务约束与规则知识 | 主键、外键、唯一约束 | 主键字段可配置唯一性规则 |
| 编码规则与标准规范 | 标准数据元、编码规则 | 身份证号有固定格式规则 |
| 用户提交的知识文档 | 业务文档、规则说明 | 用户提供的业务规则文档 |
| 用户提问中的知识 | 用户明确表达的规则需求 | "这个字段不能为空" |

#### 规则级别与维度约束

> **详细约束请参考**: [核心约束 - 规则级别与维度约束](../reference/core-constraints.md)

| 规则级别 | 支持维度 | 维度类型 | 配置要求 |
|----------|----------|----------|----------|
| **视图级 (view)** | 仅完整性 (completeness) | 仅自定义规则 (custom) | 不需要指定 `field_id`，SQL 条件表达式使用技术名称 |
| **行级 (row)** | 完整性、唯一性、准确性 | 仅自定义规则 (custom) | 需要指定 `field_id` |
| **字段级 (field)** | 完整性、唯一、规范性、准确性 | 完整性/唯一性/准确性: custom<br>规范性: format/custom | 需要指定 `field_id` |

#### 规则配置模板

> **详细模板请参考**: [核心约束 - 规则配置模板](../reference/core-constraints.md)

**1. 格式检查维度类型规则模板**（仅规范性维度可用）:
```json
{
  "format": {
    "regex": "正则表达式"
  }
}
```

**2. 自定义规则维度类型规则模板**:
```json
{
  "rule_expression": {
    "where_relation": "and",
    "where": [],
    "sql": "sql条件表达式"
  }
}
```

#### 创建规则前检查

**规则重名检查**:
```http
GET {BASE_URL}/api/data-view/v1/explore-rule/repeat?form_view_id={视图ID}&rule_name={规则名称}
Authorization: {AUTH_TOKEN}
```

#### 创建规则示例

**示例 1: 视图级完整性规则（自定义规则）**
```http
POST {BASE_URL}/api/data-view/v1/explore-rule
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "form_view_id": "视图UUID",
  "rule_name": "视图完整性检查",
  "dimension": "completeness",
  "dimension_type": "custom",
  "rule_level": "view",
  "rule_config": "{\"rule_expression\":{\"sql\":\"customer_id IS NOT NULL AND customer_name IS NOT NULL\"}}",
  "enable": true,
  "draft": false
}
```

**示例 2: 行级完整性规则（自定义规则）**
```http
POST {BASE_URL}/api/data-view/v1/explore-rule
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "form_view_id": "视图UUID",
  "rule_name": "客户名非空检查",
  "dimension": "completeness",
  "dimension_type": "custom",
  "rule_level": "row",
  "field_id": "字段UUID",
  "rule_config": "{\"rule_expression\":{\"sql\":\"customer_name IS NOT NULL\"}}",
  "enable": true,
  "draft": false
}
```

**示例 3: 字段级规范性规则（格式检查）**
```http
POST {BASE_URL}/api/data-view/v1/explore-rule
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "form_view_id": "视图UUID",
  "rule_name": "手机号格式检查",
  "dimension": "standardization",
  "dimension_type": "format",
  "rule_level": "field",
  "field_id": "字段UUID",
  "rule_config": "{\"format\":{\"regex\":\"^1[3-9]\\\\d{9}$\"}}",
  "enable": true,
  "draft": false
}
```

**示例 4: 字段级规范性规则（自定义规则）**
```http
POST {BASE_URL}/api/data-view/v1/explore-rule
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "form_view_id": "视图UUID",
  "rule_name": "邮箱格式检查",
  "dimension": "standardization",
  "dimension_type": "custom",
  "rule_level": "field",
  "field_id": "字段UUID",
  "rule_config": "{\"rule_expression\":{\"sql\":\"email LIKE '%@%.%'\"}}",
  "enable": true,
  "draft": false
}
```

**响应处理**:
```json
// 成功响应
{"rule_id": "550e8400-e29b-41d4-a716-446655440000"}
```
HTTP `200/201` 都视为成功，从响应中提取 `rule_id`。

### 修改规则启用状态
```http
PUT {BASE_URL}/api/data-view/v1/explore-rule/status
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "rule_ids": ["规则ID1", "规则ID2"],
  "enable": false
}
```

### 修改规则
```http
PUT {BASE_URL}/api/data-view/v1/explore-rule/{规则ID}
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "rule_name": "新规则名称",
  "rule_config": "{\"rule_expression\":{\"sql\":\"technical_name IS NOT NULL\"}}",
  "enable": true,
  "draft": false
}
```

### 删除规则
```http
DELETE {BASE_URL}/api/data-view/v1/explore-rule/{规则ID}
Authorization: {AUTH_TOKEN}
```

### 获取规则列表
```http
GET {BASE_URL}/api/data-view/v1/explore-rule?form_view_id={视图ID}&limit=20&offset=1
Authorization: {AUTH_TOKEN}
```

### 创建检测工单

> **详细约束请参考**: [核心约束 - 工单创建约束](../reference/core-constraints.md)

#### 工单创建参数约束

| 参数 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `name` | string | 必填，需唯一 | 工单名称，建议格式：`{视图名}_{数据源}_{时间戳}` |
| `type` | string | **固定值**: `data_quality_audit` | 工单类型 |
| `source_type` | string | **固定值**: `standalone` | 数据源类型 |
| `responsible_uid` | string | 必填，从用户信息接口获取 | 负责人用户 ID |
| `draft` | boolean | **固定值**: `false` | 是否为草稿 |
| `remark` | string | 必填，JSON 字符串 | 数据源信息 |

#### remark 参数模板

**场景 1: 对数据源创建质量检测工单**（检测数据源下所有视图）
```json
{
  "datasource_infos": [
    {
      "datasource_id": "数据源UUID",
      "datasource_name": "数据源名称",
      "datasource_type": "数据源类型",
      "form_view_ids": []
    }
  ]
}
```

**场景 2: 对视图创建质量检测工单**（检测指定视图）
```json
{
  "datasource_infos": [
    {
      "datasource_id": "数据源UUID",
      "datasource_name": "数据源名称",
      "datasource_type": "数据源类型",
      "form_view_ids": ["逻辑视图UUID"]
    }
  ]
}
```

> **注意**: `datasource_id` 和 `form_view_ids` 中的 ID 都必须是有效的 UUID 格式。

#### 工单名称重名检查
```http
GET {BASE_URL}/api/task-center/v1/work-order/name-check?name={工单名称}&type=data_quality_audit
Authorization: {AUTH_TOKEN}
```

#### 创建工单完整流程

**步骤 1: 获取用户信息（获取 responsible_uid）**
```http
GET {BASE_URL}/api/eacp/v1/user/get
Authorization: {AUTH_TOKEN}
```

**步骤 2: 创建工单**
```http
POST {BASE_URL}/api/task-center/v1/work-order
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{
  "name": "客户主数据_生产库_20240115143025",
  "type": "data_quality_audit",
  "source_type": "standalone",
  "responsible_uid": "550e8400-e29b-41d4-a716-446655440000",
  "draft": false,
  "remark": "{\"datasource_infos\":[{\"datasource_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"datasource_name\":\"生产数据库\",\"datasource_type\":\"mysql\",\"form_view_ids\":[\"550e8400-e29b-41d4-a716-446655440002\"]}]}"
}
```

**响应处理**:
```json
// 成功响应
{"id": "550e8400-e29b-41d4-a716-446655440000"}
```
HTTP 200 即表示成功，优先从响应中提取 `id`，并兼容 `work_order_id`。

### 查询工单状态
```http
GET {BASE_URL}/api/task-center/v1/work-order/{工单ID}
GET {BASE_URL}/api/data-view/v1/explore-task?work_order_id={工单ID}
```

### 取消探查任务
```http
PUT {BASE_URL}/api/data-view/v1/explore-task/{任务ID}
Authorization: {AUTH_TOKEN}
Content-Type: application/json

{"status": "canceled"}
```

## 枚举值速查

> **详细枚举请参考**: [核心约束 - 枚举值](../reference/core-constraints.md)

### 维度
| 维度 | 说明 |
|------|------|
| completeness | 完整性 |
| standardization | 规范性 |
| uniqueness | 唯一性 |
| accuracy | 准确性 |

### 维度类型
| 类型 | 说明 | 适用场景 |
|------|------|----------|
| custom | 自定义规则 | 所有维度 |
| format | 格式检查 | 仅规范性维度（字段级） |

### 任务状态
| 状态 | 说明 |
|------|------|
| queuing | 排队中 |
| running | 运行中 |
| finished | 已完成 |
| canceled | 已取消 |
| failed | 失败 |

## 响应格式

```json
// 创建规则
{"rule_id": "uuid"}

// 创建工单
{"id": "uuid"}

// 列表查询
{"entries": [], "total_count": 0}
```

## 兼容性说明

1. **规则创建字段**：当前环境优先使用 `rule_name`、`rule_level`，并将 `rule_config` 作为 JSON 字符串传入
2. **规则列表返回**：`GET /explore-rule` 在不同环境中可能返回数组 `[]`，也可能返回带 `entries` 的分页对象
3. **字段列表返回**：`POST /logic-view/field/multi` 当前环境返回 `logic_views` 数组，字段通常位于 `logic_views[0].fields`
4. **工单创建返回**：当前环境优先返回 `id`；旧环境可能返回 `work_order_id`

## 下一步

→ [详细指南](./detailed-guide.md) 完整工作流和高级用法
