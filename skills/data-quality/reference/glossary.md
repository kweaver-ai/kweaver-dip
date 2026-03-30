---
name: "data-quality-glossary"
description: "数据质量管理术语表和概念说明。当用户需要理解特定术语或概念时使用。"
---

# 术语表

> **共享约束参考**: [核心约束](./core-constraints.md)

## 核心概念

### 质量规则
定义如何检查特定字段或视图数据质量的配置。规则包括维度、维度类型、规则级别和具体的检查逻辑。

### 逻辑视图
一个或多个物理表的虚拟数据表示。质量规则是基于逻辑视图配置的。

### 检测工单
根据配置的规则对指定视图执行质量检查的任务。工单包含多个探查任务。

### 知识网络
定义业务概念及其关系的语义模型。可用于辅助规则配置。

### 对象类
知识网络中定义的业务实体，可映射到逻辑视图。

## 规则配置术语

> **详细约束**: [核心约束 - 规则级别与维度约束](./core-constraints.md)

### 规则级别 (Level)
| 级别 | 说明 | 支持维度 | field_id 要求 |
|------|------|----------|---------------|
| view (视图级) | 在视图级别应用的规则 | 仅 completeness | 不需要 |
| row (行级) | 应用于单个行的规则 | completeness, uniqueness, accuracy | 需要 |
| field (字段级) | 应用于特定字段的规则 | completeness, uniqueness, standardization, accuracy | 需要 |

### 维度 (Dimension)
| 维度 | 说明 | 可用维度类型 |
|------|------|--------------|
| completeness (完整性) | 衡量必需数据是否存在 | custom |
| standardization (规范性) | 衡量数据是否符合标准格式 | format, custom |
| uniqueness (唯一性) | 衡量数据是否唯一 | custom |
| accuracy (准确性) | 衡量数据是否正确 | custom |

### 维度类型 (Dimension Type)
| 类型 | 说明 | 适用场景 |
|------|------|----------|
| custom (自定义规则) | 使用 SQL 条件表达式定义规则 | 所有维度，所有级别 |
| format (格式检查) | 使用正则表达式进行格式验证 | 仅 standardization 维度，仅 field 级别 |

### rule_config 配置模板

> **详细模板**: [核心约束 - 规则配置模板](./core-constraints.md)

**格式检查模板 (format)**:
```json
{
  "format": {
    "regex": "正则表达式"
  }
}
```

**自定义规则模板 (custom)**:
```json
{
  "rule_expression": {
    "sql": "sql条件表达式"
  }
}
```

## SQL-99 标准

> **详细说明**: [核心约束 - SQL-99 标准](./core-constraints.md)

SQL-99 是 SQL 标准的第三个主要版本。所有自定义规则的 SQL 条件表达式必须符合此标准。

### 允许的 SQL-99 操作
- 比较运算符: `=`, `<>`, `!=`, `<`, `>`, `<=`, `>=`
- 逻辑运算符: `AND`, `OR`, `NOT`
- 空值检查: `IS NULL`, `IS NOT NULL`
- 模式匹配: `LIKE`, 通配符 `%` 和 `_`
- 范围检查: `BETWEEN ... AND ...`
- 集合检查: `IN (...)`, `NOT IN (...)`
- 标准函数: `LENGTH()`, `TRIM()`, `SUBSTRING()`, `UPPER()`, `LOWER()`

### 技术名称
字段和视图在数据库中的实际名称（而非业务显示名称）。在 SQL 表达式中必须使用技术名称。

## 任务状态

| 状态 | 说明 |
|------|------|
| queuing (排队中) | 任务等待执行 |
| running (运行中) | 任务正在执行 |
| finished (已完成) | 任务成功完成 |
| canceled (已取消) | 任务被用户取消 |
| failed (失败) | 任务执行失败 |

## API 术语

| 术语 | 说明 |
|------|------|
| form_view_id | 逻辑视图的唯一标识 |
| field_id | 字段的唯一标识 |
| mdl_id | 统一视图标识 |
| responsible_uid | 工单负责人用户 ID |
| dimension_type | 质量检查类型（custom/format） |
| rule_config | 规则配置内容，包含具体检查逻辑 |

## 规则配置约束铁律

> **完整约束**: [核心约束 - 规则配置约束铁律](./core-constraints.md)

1. **rule_config 必须非空**: 创建规则时 `rule_config` 字段不能为空对象
2. **SQL表达式使用技术名称**: `rule_config` 中的 SQL 表达式必须使用字段技术名称
3. **规则名称唯一性**: 同一视图下规则名称不能重复
4. **维度类型匹配**: 维度类型必须与维度和规则级别严格匹配
5. **SQL-99 标准合规**: 所有 SQL 条件表达式必须符合 SQL-99 标准
6. **视图级仅完整性**: 视图级规则仅支持完整性维度（completeness）
7. **行级三维度**: 行级规则仅支持完整性、唯一性、准确性三个维度
8. **字段级四维度**: 字段级规则支持完整性、唯一性、规范性、准确性四个维度
9. **规范性双模式**: 规范性维度支持 format（格式检查）和 custom（自定义规则）两种模式
10. **格式仅规范性**: format 维度类型仅适用于规范性维度
