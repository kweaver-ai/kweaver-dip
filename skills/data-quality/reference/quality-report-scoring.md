---
name: "data-quality-report-scoring"
description: "质量报告维度评分处理策略。当处理质量报告的维度评分时使用。"
---

# 质量报告维度评分处理策略

> **统一评分格式**: 评分直接展示数值，不带 "/100" 后缀

## 评分系统说明

### 原始评分格式

质量报告 API 返回的原始维度评分是**1分满分制**：

```json
{
  "overview": {
    "accuracy_score": 0.95,
    "completeness_score": 0.88,
    "consistency_score": null,
    "standardization_score": 0.92,
    "uniqueness_score": 0.99
  }
}
```

### 评分含义

| 评分值 | 含义 | 处理方式 |
|--------|------|----------|
| `0.0` - `1.0` | 1分制评分 | 转换为100分制 |
| `null` | 无该维度评分 | 表示未配置对应维度规则 |
| 其他值 | 异常值 | 按实际值处理 |

## 评分转换策略

### 1. 1分制转100分制

**转换公式**：
```
100分制评分 = 1分制评分 × 100
```

**精度处理**: 四舍五入到两位小数

**示例**：
| 1分制 | 100分制 |
|-------|---------|
| 0.95 | 95.00 |
| 0.88 | 88.00 |
| 0.99 | 99.00 |
| 0.0 | 0.00 |

### 2. null值处理

**处理逻辑**：
- 当维度评分为 `null` 时，表示**未配置该维度的质量规则**
- 显示为「未配置」
- 不参与综合评分计算

### 3. 综合评分计算

**计算方法**：
- 仅使用有真实评分（非null）的维度进行计算
- 计算方法: 简单平均
- 精度: 四舍五入到两位小数

**示例**：
```python
def calculate_overall_score(scores):
    """计算综合评分"""
    valid_scores = [score for score in scores if score is not None]
    if not valid_scores:
        return None
    return round(sum(valid_scores) / len(valid_scores) * 100, 2)
```

## 评分展示格式

### 评分展示规范

- **评分格式**: 数值直接展示，不带 "/100" 后缀
- **null 值**: 显示为「未配置」
- **精度**: 四舍五入到两位小数

### 详细展示格式

**单个视图报告**：

```
📊 质量检测报告 - [视图名称]
检测时间: 2024-01-15 14:30:25

📈 综合评分: 93.50

各维度评分:
├─ 完整性: 88.00 (问题数: 120/1000)
├─ 规范性: 92.00 (问题数: 80/1000)
├─ 唯一性: 99.00 (问题数: 10/1000)
├─ 准确性: 95.00 (问题数: 50/1000)
└─ 一致性: 未配置

规则执行详情:
├─ [规则1] 完整性检查: 通过 880/1000
└─ [规则2] 格式检查: 通过 920/1000
```

### 批量视图报告

**多个视图汇总**：

```
📊 质量检测报告汇总
检测时间: 2024-01-15 14:30:25

共检测 3 个视图:

1. 客户主数据表
   ├─ 综合评分: 93.50
   ├─ 完整性: 88.00
   ├─ 规范性: 92.00
   ├─ 唯一性: 99.00
   ├─ 准确性: 95.00
   └─ 一致性: 未配置

2. 订单明细表
   ├─ 综合评分: 89.00
   ├─ 完整性: 90.00
   ├─ 规范性: 85.00
   ├─ 唯一性: 95.00
   └─ 一致性: 未配置

3. 产品信息表
   ├─ 综合评分: 未配置规则
   └─ 所有维度: 未配置
```

## 代码实现

### 1. 评分转换函数

```python
def transform_score(score):
    """
    转换维度评分

    Args:
        score: 原始评分值（1分制或null）

    Returns:
        tuple: (转换后的评分, 是否有效)
    """
    if score is None:
        return ("未配置", False)

    try:
        score_float = float(score)
        transformed = round(score_float * 100, 2)
        transformed = max(0, min(100, transformed))
        return (transformed, True)
    except (ValueError, TypeError):
        return ("异常值", False)


def process_dimension_scores(scores):
    """
    处理所有维度评分

    Args:
        scores: 包含各维度评分的字典

    Returns:
        dict: 处理后的评分结果
    """
    dimensions = {
        "completeness": "完整性",
        "standardization": "规范性",
        "uniqueness": "唯一性",
        "accuracy": "准确性",
        "consistency": "一致性"
    }

    result = {}
    valid_scores = []

    for key, label in dimensions.items():
        score_key = f"{key}_score"
        raw_score = scores.get(score_key)
        transformed, is_valid = transform_score(raw_score)
        result[label] = transformed
        if is_valid and isinstance(transformed, (int, float)):
            valid_scores.append(transformed / 100)

    if valid_scores:
        overall = round(sum(valid_scores) / len(valid_scores) * 100, 2)
        result["综合评分"] = overall
    else:
        result["综合评分"] = "未配置规则"

    return result
```

### 2. 报告处理示例

```python
def process_quality_report(report_data):
    """
    处理质量报告数据
    """
    if not report_data:
        return {"error": "报告数据为空"}

    view_id = report_data.get("view_id", "未知")
    view_name = report_data.get("view_name", "未知")
    explore_time = report_data.get("explore_time", "未知")

    overview = report_data.get("overview", {})
    dimension_scores = process_dimension_scores(overview)

    rule_results = report_data.get("rule_results", [])
    processed_rules = []
    for rule in rule_results:
        processed_rules.append({
            "rule_name": rule.get("rule_name", "未知"),
            "dimension": rule.get("dimension", "未知"),
            "inspected_count": rule.get("inspected_count", 0),
            "issue_count": rule.get("issue_count", 0)
        })

    return {
        "view_id": view_id,
        "view_name": view_name,
        "explore_time": explore_time,
        "dimension_scores": dimension_scores,
        "rule_results": processed_rules
    }
```

## 错误处理

### 1. 评分异常处理

```python
def handle_score_exception(score):
    """处理评分异常"""
    if score is None:
        return "未配置"

    try:
        score_float = float(score)
        if 0 <= score_float <= 1:
            return round(score_float * 100, 2)
        else:
            return "异常值"
    except:
        return "异常值"
```

### 2. 报告数据缺失处理

```python
def handle_missing_report(view_id, view_name):
    """处理报告缺失情况"""
    return {
        "view_id": view_id,
        "view_name": view_name,
        "error": "暂无质量检测报告",
        "suggestion": "需要配置质量规则并发起检测"
    }
```

## 常见问题

### Q: 为什么有些维度显示「未配置」？
**A**: 当维度评分为null时，表示该维度没有配置对应的质量规则，因此没有评分数据。

### Q: 综合评分是如何计算的？
**A**: 综合评分仅使用有真实评分的维度进行简单平均计算，未配置的维度不参与计算。

### Q: 1分制转100分制的精度如何处理？
**A**: 四舍五入到两位小数，确保精度同时提高可读性。

### Q: 分数为什么不带 "/100" 后缀？
**A**: 根据统一评分格式规范，评分直接展示数值，不带 "/100" 后缀，更简洁清晰。
