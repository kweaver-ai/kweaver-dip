---
name: "data-quality-core"
description: "数据质量管理核心概念和快速参考。当用户需要快速了解核心概念时使用。"
---

# 数据质量管理 - 核心概念

> 快速导航: [SKILL.md](../SKILL.md) | [快速开始](../guides/quickstart.md) | [详细指南](../guides/detailed-guide.md)
> **共享约束参考**: [核心约束](../reference/core-constraints.md)

## 四大核心能力

| 能力 | 说明 | API |
|------|------|-----|
| 质量规则 | 增删改查质量规则 | `/api/data-view/v1/explore-rule` |
| 逻辑视图 | 查询视图和字段信息 | `/api/data-view/v1/form-view` |
| 检测工单 | 创建和跟踪检测工单 | `/api/task-center/v1/work-order` |
| 知识网络 | 基于知识网络配置规则 | `/api/ontology-manager/v1` |

## 规则级别与维度

> **详细约束**: [核心约束 - 规则级别与维度](../reference/core-constraints.md)

| 级别 | 维度 | 类型 |
|------|------|------|
| view | completeness | custom |
| row | completeness, uniqueness, accuracy | custom |
| field | completeness, uniqueness, standardization, accuracy | custom/format |

## 评分处理

| 原始评分 | 展示评分 | null值 |
|----------|----------|--------|
| 1分制 (0.0-1.0) | 100分制 (原始×100) | 显示"未配置" |

## 环境变量

```bash
DATA_QUALITY_BASE_URL=https://10.4.134.26
DATA_QUALITY_AUTH_TOKEN=Bearer xxxxxx
```

## 快速示例

### 查询视图
```http
GET {BASE_URL}/api/data-view/v1/form-view?limit=20&offset=1
Authorization: {AUTH_TOKEN}
```

### 创建规则
```http
POST {BASE_URL}/api/data-view/v1/explore-rule
Content-Type: application/json

{
  "form_view_id": "视图UUID",
  "rule_name": "字段非空检查",
  "dimension": "completeness",
  "dimension_type": "custom",
  "rule_level": "field",
  "field_id": "字段UUID",
  "rule_config": "{\"rule_expression\":{\"sql\":\"技术名称 IS NOT NULL\"}}"
}
```

### 创建工单
```http
POST {BASE_URL}/api/task-center/v1/work-order
Content-Type: application/json

{
  "name": "视图名_数据源_时间戳",
  "type": "data_quality_audit",
  "source_type": "standalone",
  "responsible_uid": "用户ID",
  "draft": false,
  "remark": "{\"datasource_infos\":[{\"datasource_id\":\"...\",\"datasource_name\":\"...\",\"datasource_type\":\"...\",\"form_view_ids\":[\"...\"]}]}"
}
```

## 关键约束

1. **配置非空**: `rule_config` 不能为空
2. **技术名称**: SQL表达式必须使用字段技术名称
3. **规则重名**: 同一视图下规则名称不能重复
4. **成功状态**: 200/201 都视为成功
5. **无报告续流**: 报告不存在时继续进入检测确认步骤

## 工作流文档

- [质量检测工作流](../reference/quality-inspection-workflow.md) - 完整检测流程
- [知识网络工作流](../reference/knowledge-network-workflow.md) - 知识网络场景
- [评分处理策略](../reference/quality-report-scoring.md) - 评分转换与展示
