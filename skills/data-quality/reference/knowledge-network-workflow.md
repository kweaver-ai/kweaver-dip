---
name: "data-quality-knowledge-network-workflow"
description: "知识网络质量规则配置与检测流程。当基于知识网络进行质量规则配置或检测时使用。"
---

# 知识网络质量规则配置与检测流程

> **共享约束参考**: [核心约束](./core-constraints.md)

## 流程概述

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    知识网络质量规则配置与检测完整流程                          │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 阶段1: 配置验证与初始化                                                       │
│ 1.1 验证环境变量配置                                                          │
│ 1.2 调用 Session API 验证Token有效性                                          │
│ 1.3 获取当前用户ID (用于后续工单创建)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 阶段2: 知识网络识别与加载（目标识别）                                           │
│ 【目标识别优先级】                                                             │
│  → 第一优先级: 从query中提取知识网络/对象类名称                                 │
│  → 第二优先级: 从context中提取（仅当query无明确目标时）                        │
│  → 禁止: business_desc/business_docs不能用于确定分析目标                       │
│ 2.1 获取知识网络列表 → 用户确认                                               │
│ 2.2 获取对象类列表 → 数据源校验 → 过滤无效对象类                               │
│ 2.3 使用mdl_id查询逻辑视图 → 汇总数据源信息                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 阶段3: 多视图质量情况分析                                                     │
│ 3.1 逐个查询探查报告                                                          │
│ 3.2 视图分类: 正常/待配置/待检测/待配置+检测/已跳过                          │
│ 3.3 汇总展示 → 模型分析                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 阶段4: 统一规则配置（如需要）                                                 │
│ 4.1 汇总D类+B类视图                                                           │
│ 4.2 结合business_desc/business_docs配置规则                                   │
│ 4.3 用户确认 → 批量创建                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 阶段5: 统一质量检测执行                                                       │
│ 5.1 汇总C类+D类视图                                                           │
│ 5.2 创建统一检测工单                                                           │
│ 5.3 跟踪进度 → 返回结果                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 详细流程说明

### 阶段1: 配置验证与初始化

#### 1.1 验证环境变量配置
```python
import os

required_env_vars = [
    'DATA_QUALITY_BASE_URL',
    'DATA_QUALITY_AUTH_TOKEN'
]

for var in required_env_vars:
    if not os.getenv(var):
        raise EnvironmentError(f"缺少必需的环境变量: {var}")
```

#### 1.2 验证Token有效性
```http
GET {DATA_QUALITY_BASE_URL}/api/eacp/v1/user/get
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### 1.3 获取当前用户ID
从响应中提取 `userid` 字段，用于后续工单创建的 `responsible_uid` 参数。

### 阶段2: 知识网络识别与加载（目标识别）

> **详细约束**: [核心约束 - 入参使用](../reference/core-constraints.md)

**【重要】目标识别优先级**:
- **第一优先级**: 从 `query` 中提取知识网络/对象类名称
- **第二优先级**: 从 `context` 中提取（仅当 `query` 无明确目标时）
- **禁止**: `business_desc` 和 `business_docs` 不能用于确定分析目标

```
错误示例:
❌ 从 business_desc 中提取"客户域知识网络"作为分析目标
❌ 从 business_docs 中提取"产品知识网络"作为分析目标

正确示例:
✅ 从 query 中提取"分析客户域知识网络的质量情况"
✅ 从 context 中提取"需要分析客户域知识网络"（当query中没有时）
```

#### 2.1 获取知识网络列表 (分页)

```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks
X-Business-Domain: bd_public
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**分页参数**:
| 参数 | 说明 |
|------|------|
| `offset` | 页码，从 0 开始 |
| `limit` | 每页数量 |

**分页获取所有知识网络**:
```
offset = 0
limit = 20
do:
    response = GET /knowledge-networks?offset={offset}&limit={limit}
    entries = response.entries
    if len(entries) < limit:
        break  // 最后一批
    offset += 1
while true
```

#### 2.2 用户确认知识网络
如返回多个知识网络，展示列表供用户选择确认。

#### 2.3 获取对象类列表 (分页 + 模糊匹配)

```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**分页参数**:
| 参数 | 说明 |
|------|------|
| `offset` | 页码，从 0 开始 |
| `limit` | 每页数量 |
| `name_pattern` | 对象类名称关键字（模糊匹配） |

**场景一: 未指定对象类名称 - 分页获取所有**

```
offset = 0
limit = 20
all_object_types = []
do:
    response = GET /knowledge-networks/{kn_id}/object-types?offset={offset}&limit={limit}
    entries = response.entries
    all_object_types.extend(entries)
    if len(entries) < limit:
        break  // 最后一批
    offset += 1
while true
```

**场景二: 指定对象类名称 - 模糊匹配分页获取**

```
object_type_name = "客户"  // 从 query 中提取的对象类名称
offset = 0
limit = 20
all_object_types = []
do:
    response = GET /knowledge-networks/{kn_id}/object-types?offset={offset}&limit={limit}&name_pattern={object_type_name}
    entries = response.entries
    all_object_types.extend(entries)
    if len(entries) < limit:
        break  // 最后一批
    offset += 1
while true
```

#### 2.4 对象类数据源信息校验
检查对象类的 `data_source` 属性：
- `data_source.id` 必须存在且有效
- `data_source.type` 必须支持

#### 2.5 过滤无数据源的对象类
- 过滤掉 `data_source.id` 不存在或无效的对象类
- 汇总被过滤的对象类列表，提示用户
- 不阻塞有效对象类继续处理

#### 2.6 查询逻辑视图
使用对象类的 `data_source.id` 作为 `mdl_id`（统一视图ID）查询逻辑视图列表：
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?mdl_id={data_source.id}
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

> **重要**: `data_source.id` 是统一视图ID（用于 `mdl_id`），不是工单所需的数据源ID。

#### 2.7 汇总工单所需数据源信息
从逻辑视图响应中提取：
- `datasource_id`
- `datasource_name`
- `datasource_type`

> **禁止**: 禁止把 `data_source.id` 或 `mdl_id` 直接写入工单的 `datasource_id`。

### 阶段3: 多视图质量情况分析

> **视图分类标准**: [核心约束 - 视图分类](../reference/core-constraints.md)

#### 3.1 逐个查询探查报告
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view/explore-report?id={view_id}&third_party=false
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### 3.2 视图分类

| 分类 | 条件 | 说明 | 操作 |
|------|------|------|------|
| ✅ 正常 | 有报告 + 有规则 | 质量情况已探明 | 展示报告 |
| ⚠️ 待配置 | 有报告 + 无规则 | 缺少质量规则 | 建议配置规则 |
| 🔄 待检测 | 无报告 + 有规则 | 可以发起检测 | 发起检测 |
| ❓ 待配置+检测 | 无报告 + 无规则 | 需配置后检测 | 配置规则并检测 |
| ⏭️ 已跳过 | 已删除/无权限 | 无法检测 | 跳过 |

#### 3.3 汇总展示
```
📊 知识网络质量情况分析 - [知识网络名称]

共检查 N 个视图:

1. 客户主表 (✅正常)
   ├─ 综合评分: 92.80
   ├─ 完整性: 88.34
   ├─ 规范性: 92.50
   └─ 准确性: 95.67

2. 订单明细表 (🔄待检测)
   └─ 状态: 可发起检测，将为您创建检测工单

3. 产品信息表 (❓待配置+检测)
   └─ 状态: 需要配置质量规则后发起检测

4. 系统日志表 (⏭️已跳过)
   └─ 状态: 跳过（视图已删除）
```

#### 3.4 模型能力分析

**context参数使用**: 如 `context` 参数存在，结合用户提供的上下文信息进行综合分析：
- 如用户提供了视图变更context，应在问题诊断中考虑结构变更的影响
- 如用户提供了业务背景context，应在优化建议中结合业务场景
- 如用户提供了数据来源context，应在风险预警中考虑历史数据问题

### 阶段4: 统一规则配置

> **规则配置规范**: [核心约束 - 规则配置](../reference/core-constraints.md)
> **自动推断标准**: [核心约束 - 自动规则推断](../reference/core-constraints.md)

#### 4.1 汇总需要配置的视图
需要配置规则的视图: D类（无报告+无规则）和 B类（有报告+无规则）

#### 4.2 统一配置规则

**business_desc参数使用**: 结合用户提供的业务描述确定规则语义：
```json
{
  "business_desc": "订单表包含客户ID、产品ID、数量、金额等字段，其中客户ID必须非空且格式符合规范，产品ID必须为10位数字"
}
```

**business_docs参数使用**: 解析业务文档内容并参考配置规则：
```json
{
  "business_docs": ["产品分类标准文档.md", "SKU编码规则.md"]
}
```

#### 4.3 用户确认规则配置
展示推荐的规则列表，允许用户启用/禁用特定规则或修改规则参数。

#### 4.4 批量创建规则
> **详细API**: [Data View API](./api/api_data_view.md)

### 阶段5: 统一质量检测执行

#### 5.1 汇总需要检测的视图
需要发起检测的视图: C类（无报告+有规则）和 D类（无报告+无规则，需先配置规则）

#### 5.2 创建统一检测工单
> **工单创建规范**: [核心约束 - 工单创建](../reference/core-constraints.md)

> **统一检测策略**: 所有需要检测的视图统一创建一个工单，避免拆单。

#### 5.3 跟踪检测进度
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-task?work_order_id={工单ID}
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### 5.4 返回细化检测结果及模型分析
检测完成后，返回详细的检测结果报告，包含模型能力分析和优化建议。

## 入参使用场景总结

> **详细说明**: [SKILL.md - 入参使用](../SKILL.md)

| 入参 | 使用阶段 | 使用场景 |
|------|---------|---------|
| `query` | 阶段2.1 | 确定知识网络名称关键字进行模糊搜索 |
| `context` | 阶段3.4 | 结合用户提供的上下文信息进行模型分析 |
| `business_desc` | 阶段4.2 | 结合用户提供的业务描述确定规则语义 |
| `business_docs` | 阶段4.2 | 解析业务文档内容并参考配置规则 |

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 配置不存在 | 提示用户配置环境变量 |
| Token无效 | 提示用户检查Token |
| 无可用知识网络 | 提示用户检查知识网络配置 |
| 对象类无数据源 | 过滤该对象类并提示用户，不阻塞其他有效对象类继续处理 |
| 规则创建失败 | 回滚已创建规则，报告错误 |
| 视图已删除 | 跳过该视图，继续处理其他视图 |
