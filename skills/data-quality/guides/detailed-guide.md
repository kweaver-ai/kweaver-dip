---
name: "data-quality-detailed"
description: "数据质量管理详细指南，包含完整工作流和高级功能。当用户需要完整工作流、高级功能或故障排查时使用。"
---

# 数据质量管理 - 详细指南

> 上一层: [快速开始](./quickstart.md) | 入口: [核心概念](../core/core.md) | [主技能](../SKILL.md)
> **共享约束参考**: [核心约束](../reference/core-constraints.md)

## 文档索引

### 工作流文档
- [质量检测工作流](../reference/quality-inspection-workflow.md) - 完整检测流程
- [知识网络工作流](../reference/knowledge-network-workflow.md) - 知识网络场景
- [意图识别框架](../reference/intent-recognition.md) - 用户意图识别

### API 文档
- [API 使用规范](../reference/api-usage-guide.md) - 调用规范
- [API 路径验证](../reference/api-path-validation.md) - 路径验证
- [分页规范](../reference/pagination.md) - 偏移量使用

### API 参考
- [Data View API](../reference/api/api_data_view.md)
- [Task Center API](../reference/api/api_task_center.md)
- [Knowledge Network API](../reference/api/api_knowledge_network.md)
- [Session API](../reference/api/api_eacp.md)
- [Standardization API](../reference/api/api_std.md)

### 参考
- [术语表](../reference/glossary.md)

## 规则配置完整规范

> **详细约束请参考**: [核心约束 - 规则配置](../reference/core-constraints.md)

### 规则级别与维度约束矩阵

> **完整矩阵**: [核心约束 - 规则级别与维度约束矩阵](../reference/core-constraints.md)

| 规则级别 | 支持维度 | 维度类型 | field_id |
|----------|----------|----------|----------|
| **视图级 (view)** | 仅 completeness | 仅 custom | 不需要 |
| **行级 (row)** | completeness, uniqueness, accuracy | 仅 custom | 需要 |
| **字段级 (field)** | completeness, uniqueness, standardization, accuracy | custom/format | 需要 |

### 规则配置模板

> **完整模板**: [核心约束 - 规则配置模板](../reference/core-constraints.md)

**格式检查模板** (仅 standardization 维度，字段级):
```json
{
  "format": {
    "regex": "正则表达式"
  }
}
```

**自定义规则模板** (所有维度):
```json
{
  "rule_expression": {
    "sql": "sql条件表达式"
  }
}
```

### SQL-99 标准规范

> **完整说明**: [核心约束 - SQL-99 标准](../reference/core-constraints.md)

所有 SQL 条件表达式必须符合 SQL-99 标准。

### 规则配置前置检查

```
用户发起规则配置请求
    ↓
【强制】检查配置是否存在
    │
    ├─ 配置不存在 → ❌ 终止处理，提示用户配置环境变量
    │
    └─ 配置存在 → 继续下一步
    ↓
【强制】验证配置有效性（调用用户认证接口）
    │
    ├─ 验证失败 → ❌ 终止处理
    │
    └─ 验证通过 → ✅ 继续执行用户请求
    ↓
【强制】检查规则级别与维度匹配
    │
    ├─ 视图级 + 非completeness维度 → ❌ 终止
    │
    ├─ 行级 + consistency/timeliness维度 → ❌ 终止
    │
    └─ 字段级 + consistency/timeliness维度 → ❌ 终止
    ↓
【强制】检查维度类型与维度匹配
    │
    ├─ format类型 + 非standardization维度 → ❌ 终止
    │
    ├─ 非字段级 + format类型 → ❌ 终止
    │
    └─ 匹配通过 → ✅ 继续
    ↓
正常处理用户请求
```

### 规则创建完整步骤

```
1. 获取视图列表 → GET /form-view
2. 获取字段列表 → POST /logic-view/field/multi
3. 【检查】规则名称是否重复 → GET /explore-rule/repeat
4. 【确定】规则级别（view/row/field）
5. 【确定】维度（根据级别确定可用维度）
6. 【确定】维度类型（根据维度确定）
7. 【构建】rule_config（使用对应模板）
8. 【验证】SQL表达式符合 SQL-99 标准
9. 【验证】SQL表达式使用技术名称
10. 创建规则 → POST /explore-rule
11. 验证响应，提取 rule_id
```

## 质量检测完整工作流

```
触发识别
    │
    ├─ 用户意图为质量检测 ──▶ 启动质量检测工作流
    │                            ├── a. 触发视图质量规则配置检查
    │                            ├── b. 扫描已支持维度的规则配置状态
    │                            ├── c. 自动配置缺失的基础规则
    │                            ├── d. 降级处理（如需要）
    │                            ├── e. 创建质量检测工单
    │                            └── f. 实时跟踪工单状态
    │
    └─ 不匹配 ──▶ 使用标准质量规则配置工作流
```

> **详细工作流**: [质量检测工作流](../reference/quality-inspection-workflow.md)

### 工作流入参使用说明

| 入参 | 使用场景 | 使用方式 |
|------|---------|---------|
| `query` | 所有场景 | 确定用户意图和关键信息 |
| `context` | 规则配置检查时 | 了解用户配置规则的背景 |
| `business_desc` | 自动配置规则时 | 解析业务描述文本，提取字段要求、格式规范 |
| `business_docs` | 自动配置规则时 | 解析业务文档内容，提取业务规则、枚举值、格式要求 |

## 检测工单创建规范

> **详细约束**: [核心约束 - 工单创建](../reference/core-constraints.md)

### 工单创建参数

| 参数 | 类型 | 约束 | 获取方式 |
|------|------|------|----------|
| `name` | string | 必填，全局唯一 | 建议格式：`{视图名}_{数据源}_{时间戳}` |
| `type` | string | **固定值** | `data_quality_audit` |
| `source_type` | string | **固定值** | `standalone` |
| `responsible_uid` | string | 必填 | 从用户信息接口获取 `userid` 字段 |
| `draft` | boolean | **固定值** | `false` |
| `remark` | string | 必填，JSON 字符串 | 包含数据源信息 |

### remark 参数模板

**场景 1: 对数据源创建质量检测工单**:
```json
{
  "datasource_infos": [
    {
      "datasource_id": "550e8400-e29b-41d4-a716-446655440001",
      "datasource_name": "生产数据库",
      "datasource_type": "mysql",
      "form_view_ids": []
    }
  ]
}
```

**场景 2: 对指定视图创建质量检测工单**:
```json
{
  "datasource_infos": [
    {
      "datasource_id": "550e8400-e29b-41d4-a716-446655440001",
      "datasource_name": "生产数据库",
      "datasource_type": "mysql",
      "form_view_ids": ["550e8400-e29b-41d4-a716-446655440002"]
    }
  ]
}
```

## 质量报告查询工作流

```
用户查询质量报告/数据质量情况
    ↓
识别查询目标（数据源/视图/知识网络/对象类）
    ↓
获取目标视图ID
    │
    ├─ 知识网络场景 ──▶ 通过对象类获取一个或多个视图ID
    ├─ 数据源场景 ──▶ 获取数据源下的视图列表
    └─ 直接指定视图 ──▶ 使用指定视图ID
    ↓
逐个查询视图探查报告 ──▶ GET /form-view/explore-report?id={view_id}
    │
    ├─ 全部报告存在 ──▶ 展示质量报告信息
    │
    └─ 存在缺失报告 ──▶ 汇总缺失视图并进入质量检测分支
```

### 探查报告查询接口

```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view/explore-report?id={view_id}&third_party=false
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**响应示例（报告存在）**:
```json
{
  "view_id": "视图ID",
  "view_name": "视图名称",
  "explore_time": "2024-01-15T14:30:25Z",
  "dimensions": {
    "completeness": {"score": 0.95, "inspected_count": 10000, "issue_count": 450},
    "standardization": {"score": 0.88, "inspected_count": 10000, "issue_count": 1200}
  }
}
```

**响应示例（报告不存在）**:
```json
{"code": 404, "message": "探查报告不存在"}
```

> **重要**: 当返回"探查报告不存在"或错误码 `DataView.Driven.DataExplorationGetReportError` 时，统一按"暂无质量报告"理解，继续进入"是否配置规则并发起检测"的确认步骤。

### 视图分类与处理

> **完整分类标准**: [核心约束 - 视图分类标准](../reference/core-constraints.md)

| 分类 | 条件 | 建议操作 |
|------|------|----------|
| ✅ 正常 | 有报告 + 有规则 | 展示报告 |
| ⚠️ 待配置 | 有报告 + 无规则 | 建议配置规则 |
| 🔄 待检测 | 无报告 + 有规则 | 发起检测 |
| ❓ 待配置+检测 | 无报告 + 无规则 | 配置规则并检测 |
| ⏭️ 已跳过 | 已删除/无权限 | 跳过 |

### 质量规则覆盖分析

当用户提供了 `business_desc` 或 `business_docs` 时，应先解析这些业务信息，再结合解析后的业务信息分析当前质量规则的覆盖情况。

> **自动推断标准**: [核心约束 - 自动规则推断](../reference/core-constraints.md)

**输出格式示例**:

```
💡 质量规则覆盖分析

基于业务描述/文档，当前视图的规则覆盖情况:

已覆盖:
├─ 客户ID: 非空检查(completeness) ✅
└─ 客户姓名: 非空检查(completeness) ✅

待补充:
├─ 产品ID: 格式校验(standardization) - 业务要求10位数字
├─ 数量: 数值范围检查(accuracy) - 业务要求数量>0
└─ SKU编码: 格式校验(standardization) - 业务文档定义编码规则

是否需要为您补充这些规则?
```

## 知识网络工作流

> **详细工作流**: [知识网络工作流](../reference/knowledge-network-workflow.md)

```
用户提及知识网络/对象类
    ↓
提取知识网络名称/ID
    ↓
获取知识网络列表 (X-Business-Domain: bd_public, name_pattern=关键字, offset从0开始)
    ↓
用户确认知识网络
    ↓
提取对象类名称/ID
    ↓
获取对象类列表 (name_pattern=关键字, offset从0开始)
    ↓
校验数据源信息 → 用户确认对象类
    ↓
提取 object_class.data_source.id (统一视图 ID)
    ↓
调用 GET /form-view?mdl_id={id} 查询逻辑视图
    ↓
获取逻辑视图 ID 和 datasource_id/name/type → 获取详情 → 获取字段
    ↓
【质量报告查询场景】检查探查报告
```

## 规则配置依据来源

| 来源类型 | 说明 | 示例 |
|----------|------|------|
| 表级语义 | 视图业务名称、描述 | "客户主数据表" |
| 字段级语义 | 字段业务名称、数据类型 | `NOT NULL` 约束 |
| 业务约束 | 主键、外键、唯一约束 | 主键字段 |
| 编码规则 | 标准数据元、编码规则 | 身份证号格式 |
| 用户文档 | 业务文档、规则说明 | 用户提供的文档 |
| 用户提问 | 用户明确表达的规则需求 | "这个字段不能为空" |

## 错误处理

| 状态码 | 含义 | 处理 |
|--------|------|------|
| 200 | 成功 | 正常处理 |
| 400 | 请求参数错误 | 检查 rule_config 格式、维度类型匹配、SQL 语法 |
| 401 | 未授权 | Token 无效或过期 |
| 403 | 禁止访问 | Token 权限不足 |
| 连接超时 | 网络错误 | 检查网络和防火墙 |
| DNS 解析失败 | 域名错误 | 检查 BASE_URL |

## 工单状态

| 状态 | 说明 |
|------|------|
| queuing | 排队中 |
| running | 运行中 |
| finished | 已完成 |
| canceled | 已取消 |
| failed | 失败 |

**完成判断**: 无 queuing/running 任务即表示执行完成

## 批量配置处理

> **详细批量处理策略**: [批量配置处理指南](../reference/batch-processing-guide.md)

### 场景一: 从数据源触发 (分页加载)

**处理策略**:
- 每次加载 **5 个视图**
- 每个视图**严格串行处理**
- 批次完成后检查是否还有更多视图

**分页参数**:
| 参数 | 值 | 说明 |
|------|-----|------|
| `limit` | 5 | 每页加载的视图数量 |
| `offset` | 1, 2, 3, 4, ... | 页码（第1页、第2页、第3页...） |

**流程**:
```
加载批次 (offset=1)
    ↓
处理 5 个视图 (串行)
    ↓
检查返回数量
    ├─ < 5 → 全部完成，输出报告
    └─ = 5 → offset+=1，继续加载下一批
```

### 场景二: 从知识网络触发 (完整列表)

**处理策略**:
- 获取**完整视图列表**（无分页）
- 按顺序**逐个处理**每个视图
- 严格串行，确保操作顺序性

**流程**:
```
获取完整视图列表
    ↓
按顺序处理每个视图
    ↓
当前视图处理完成 → 处理下一视图
    ↓
所有视图处理完成 → 输出汇总报告
```

### 单视图处理步骤

```
1. 获取字段列表 → POST /logic-view/field/multi
2. 分析字段特征，推断维度规则
3. 检查规则名称是否重复 → GET /explore-rule/repeat
4. 构建 rule_config
5. 创建规则 → POST /explore-rule
6. 验证响应，提取 rule_id
```

### 进度反馈

- 批次级别: 显示当前批次和进度
- 视图级别: 显示正在处理的视图
- 规则级别: 显示规则创建结果

### 错误处理

| 错误类型 | 处理策略 | 是否继续 |
|----------|----------|----------|
| 网络错误 | 重试3次，指数退避 | 继续下一视图 |
| 认证错误 | 记录错误，终止 | 终止全部 |
| 视图不存在 | 记录警告，跳过 | 继续下一视图 |
| 字段获取失败 | 记录错误，跳过视图 | 继续下一视图 |
| 规则名称重复 | 跳过该规则 | 继续其他规则 |

## 高级主题

### 批量规则创建
创建多个规则时，遵循以下最佳实践：
1. 首先检查规则名称是否重复
2. 验证字段是否存在
3. 使用一致的命名规范
4. 验证后启用规则
5. 确保每个规则符合级别-维度-类型约束

### 性能优化
- 对大数据集使用分页
- 尽可能缓存视图元数据
- 使用 `/logic-view/field/multi` 批量查询字段

### 故障排查

**问题**: 规则创建返回 400 错误
- 检查 `rule_config` 是否为空
- 验证 `dimension_type` 与 `dimension` 和 `level` 匹配
- 验证 SQL 表达式符合 SQL-99 标准
- 检查 SQL 表达式使用技术字段名

**问题**: 工单卡在 "queuing" 状态
- 检查 Task Center 服务状态
- 验证 responsible_uid 具有适当权限
- 检查工单参数是否有误

## 常见 API 响应格式汇总

| API 操作 | 成功状态码 | 响应格式 | 关键字段 |
|---------|-----------|----------|---------|
| 创建规则 | 200/201 | `{"rule_id": "xxx"}` | `rule_id` |
| 创建工单 | 200 | `{"id": "xxx"}` | `id`（兼容 `work_order_id`） |
| 查询规则列表 | 200 | `[]` 或 `{"entries": [...], "total_count": N}` | 兼容数组和 `entries` |
| 查询视图列表 | 200 | `{"entries": [...], "total_count": N}` | `entries` |
| 获取字段 | 200 | `{"logic_views": [{"fields": [...]}]}` | `logic_views[0].fields` |
| 查询知识网络 | 200 | `{"entries": [...], "total_count": N}` | `entries` |
| 查询对象类 | 200 | `{"entries": [...], "total_count": N}` | `entries` |
