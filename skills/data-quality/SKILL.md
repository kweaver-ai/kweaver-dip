---
name: "data-quality"
description: "基于 Data View 和 Task Center API 的数据质量管理。管理质量规则、查询逻辑视图、创建检测工单。当用户需要数据质量相关操作时使用。"
---

# 数据质量管理

> **渐进式加载**: [核心概念](./core/core.md) → [快速开始](./guides/quickstart.md) → [详细指南](./guides/detailed-guide.md)

## 核心能力

| 能力 | 说明 | API 端点 |
|------|------|----------|
| 质量规则 | 质量规则的增删改查 | `/api/data-view/v1/explore-rule` |
| 逻辑视图 | 查询视图列表和字段信息 | `/api/data-view/v1/form-view` |
| 检测工单 | 创建和跟踪检测工单 | `/api/task-center/v1/work-order` |
| 知识网络 | 基于知识网络配置规则 | `/api/ontology-manager/v1` |

## 技能入参

技能接受以下入参，大模型在调用技能时应按以下格式传递：

```json
{
  "query": "用户提问内容（必须）",
  "business_docs": ["业务知识文档列表（可选）"],
  "business_desc": "业务知识描述文本（可选）",
  "context": "其它可用上下文文本（可选）"
}
```

### 入参说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `query` | string | **是** | 用户提问内容，描述用户想要执行的数据质量管理操作 |
| `business_docs` | array | 否 | 业务知识文档列表，用户提供配置质量规则时的业务知识文档 |
| `business_desc` | string | 否 | 业务知识描述文本，用户提供配置质量规则时的业务知识文本描述 |
| `context` | string | 否 | 其它可用上下文文本，用户提供必要的上下文依据 |

### 入参使用场景总览

| 场景 | query | context | business_desc | business_docs |
|------|-------|---------|---------------|---------------|
| 知识网络质量分析 | ✅ | ✅ | ✅ | ✅ |
| 视图质量查询 | ✅ | ✅ | ✅ | ✅ |
| 规则配置 | ✅ | ✅ | ✅ | ✅ |
| 质量检测 | ✅ | ✅ | - | - |
| 问题诊断 | ✅ | ✅ | - | - |

### 入参职责区分

**重要**: 各入参有明确的职责分工，不得混用：

| 入参 | 职责 | 说明 |
|------|------|------|
| `query` | **目标识别（第一优先级）** | 用于确定要分析的知识网络或对象类 |
| `context` | **目标识别（第二优先级）** | 当query中没有明确目标时，从context中提取知识网络或对象类信息 |
| `business_desc` | **规则配置依据** | 仅作为配置质量规则时的业务语义来源 |
| `business_docs` | **规则配置依据** | 仅作为配置质量规则时的业务文档来源 |

**目标识别优先级**:
```
1. 首先从 query 中提取知识网络/对象类信息
2. 如果 query 中没有明确目标，才从 context 中提取
3. business_desc 和 business_docs 永远不能用于确定分析目标
```

### 使用优先级

1. **query** 始终必须，用于确定用户意图和分析目标
2. **context** 用于提供必要的上下文依据，当query无目标时作为分析目标的补充来源
3. **business_desc** 仅用于配置质量规则时提供业务语义
4. **business_docs** 仅用于配置质量规则时提供业务文档

## 前置条件

```bash
DATA_QUALITY_BASE_URL=https://10.4.134.26
DATA_QUALITY_AUTH_TOKEN=Bearer xxxxxx
```

**验证**: `GET {BASE_URL}/af/api/session/v1/userinfo`

## 关键约束

> **详细约束请参考**: [核心约束参考](./reference/core-constraints.md)

1. **配置优先**: 使用前必须先验证环境变量
2. **有据可依**: 规则配置必须有明确的依据
3. **配置非空**: 创建规则时 `rule_config` 不能为空
4. **技术名称**: `rule_config` 中的 SQL 表达式必须使用字段技术名称
5. **无报告不终止**: 查询质量报告时如返回"探查报告不存在"，统一按"暂无质量报告"理解，继续进入"是否配置规则并发起检测"的确认步骤
6. **已授权可直走**: 如果用户在当前轮已明确表达"继续处理/解决问题/发起检测"，则可直接进入规则配置与质量检测流程
7. **ID语义不能混用**: 知识网络对象类中的 `data_source.id` 是统一视图ID（用于 `mdl_id` 查逻辑视图），不是工单 `datasource_id`
8. **工单数据源来源**: `datasource_id`、`datasource_name`、`datasource_type` 必须来自逻辑视图
9. **成功响应兼容**: 创建规则成功状态以 `200/201` 都视为成功；创建工单成功后优先读取 `id`，并兼容 `work_order_id`
10. **评分展示格式**: 评分直接展示数值，不带 "/100" 后缀，四舍五入到两位小数
11. **质量报告null值处理**: 维度评分为null时显示为"未配置"，不参与综合评分计算
12. **统一检测策略**: 多视图需要检测时，优先为所有视图配置规则，然后统一创建一个质量检测工单
13. **业务视角分析**: 质量报告分析必须结合business_desc和business_docs，从业务视角解读质量指标

## 文档结构

```
data-quality/
├── SKILL.md                    # 本文件 - 主入口
├── CHANGELOG.md                # 版本历史
├── README.md                   # 文档指南
│
├── core/                       # 核心概念层 (L1)
│   └── core.md                 # 核心概念
│
├── guides/                     # 用户指南层 (L2)
│   ├── quickstart.md           # 快速开始指南
│   └── detailed-guide.md       # 详细工作流
│
├── reference/                  # 参考文档
│   ├── core-constraints.md     # 核心约束（共享引用）
│   ├── glossary.md             # 术语表
│   ├── quality-inspection-workflow.md  # 质量检测工作流
│   ├── knowledge-network-workflow.md   # 知识网络工作流
│   ├── batch-processing-guide.md       # 批量配置处理流程
│   ├── error-handling.md       # 错误处理指南
│   ├── quality-report-scoring.md      # 评分处理策略
│   ├── api-overview.md         # API 概览
│   ├── intent-recognition.md   # 意图识别
│   ├── pagination.md          # 分页规范
│   ├── api-path-validation.md  # API 路径验证
│   ├── api-usage-guide.md      # API 使用规范
│   └── api/                    # 详细 API 文档
│       ├── api_data_view.md
│       ├── api_task_center.md
│       ├── api_knowledge_network.md
│       ├── api_session.md
│       └── api_std.md
│
└── examples/                   # 代码示例
    └── basic-usage.md          # 基础用法示例
```

## 渐进式加载指南

```
用户请求分析
    │
    ├─ 简单查询（视图/字段） ──▶ 加载核心 + 快速开始
    │
    ├─ 规则配置 ──▶ 加载快速开始 + API 指南
    │
    ├─ 质量检测 ──▶ 加载详细指南 + 质量检测工作流
    │
    ├─ 知识网络 ──▶ 加载详细指南 + 知识网络工作流
    │
    ├─ 错误处理 ──▶ 加载错误处理指南
    │
    └─ 复杂/错误场景 ──▶ 加载全部 + 示例
```

## 快速导航

| 文档 | 用途 |
|------|------|
| [核心概念](./core/core.md) | 核心信息和快速参考 |
| [快速开始](./guides/quickstart.md) | 详细示例和常用操作 |
| [详细指南](./guides/detailed-guide.md) | 完整工作流和高级功能 |
| [质量检测工作流](./reference/quality-inspection-workflow.md) | 质量检测完整流程 |
| [知识网络工作流](./reference/knowledge-network-workflow.md) | 知识网络场景处理 |
| [批量配置处理](./reference/batch-processing-guide.md) | 分页加载与串行处理 |
| [核心约束](./reference/core-constraints.md) | 共享约束参考 |
| [错误处理](./reference/error-handling.md) | 完整错误处理指南 |
| [评分处理](./reference/quality-report-scoring.md) | 评分转换与展示 |
| [API 概览](./reference/api-overview.md) | API 参考 |
| [术语表](./reference/glossary.md) | 术语说明 |
| [示例代码](./examples/basic-usage.md) | 代码样例 |
