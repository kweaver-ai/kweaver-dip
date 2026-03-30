# 规则配置核心约束

> **说明**: 本文档是数据质量技能的共享约束参考，所有其他文档应引用本文档，而非重复内容。

## 规则级别与维度约束矩阵

| 规则级别 | 支持维度 | 维度类型 | field_id | SQL-99 |
|----------|----------|----------|----------|--------|
| **视图级 (view)** | 仅 completeness | 仅 custom | 不需要 | 必须符合 |
| **行级 (row)** | completeness, uniqueness, accuracy | 仅 custom | 需要 | 必须符合 |
| **字段级 (field)** | completeness, uniqueness, standardization, accuracy | completeness/uniqueness/accuracy: custom<br>standardization: format/custom | 需要 | 必须符合 |

## 规则配置模板

### 格式检查维度类型规则模板

**适用场景**: 仅规范性维度（standardization）的字段级规则

```json
{
  "format": {
    "regex": "正则表达式"
  }
}
```

### 自定义规则维度类型规则模板

**适用场景**: 所有维度的视图级、行级、字段级规则

```json
{
  "rule_expression": {
    "sql": "sql条件表达式"
  }
}
```

## 维度类型约束

| 维度 | 可用维度类型 | 说明 |
|------|--------------|------|
| completeness | `custom` | 完整性检查 |
| uniqueness | `custom` | 唯一性检查 |
| standardization | `format`, `custom` | 规范性检查 |
| accuracy | `custom` | 准确性检查 |

## SQL-99 标准规范

所有 SQL 条件表达式必须符合 SQL-99 (SQL/99, SQL3) 标准规范：

### 允许的操作
- 比较运算符: `=`, `<>`, `!=`, `<`, `>`, `<=`, `>=`
- 逻辑运算符: `AND`, `OR`, `NOT`
- 空值检查: `IS NULL`, `IS NOT NULL`
- 模式匹配: `LIKE`, 通配符 `%` 和 `_`
- 范围检查: `BETWEEN ... AND ...`
- 集合检查: `IN (...)`, `NOT IN (...)`
- 标准函数: `LENGTH()`, `TRIM()`, `SUBSTRING()`, `UPPER()`, `LOWER()` 等

### 技术名称使用规范
- 视图名称: 使用逻辑视图的技术名称
- 字段名称: 使用字段的 `technical_name`
- 示例: `customer_name IS NOT NULL`（而非业务名称）

## 规则配置约束铁律

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

## 规则更新字段处理

**重要**: 更新规则时以下字段行为：

| 字段 | 更新时处理 | 说明 |
|------|-----------|------|
| `field_id` | **不可更改** | 更新时若传入不同的 field_id，应拒绝并报错 |
| `rule_level` | **不可更改** | 级别变更需要删除重建 |
| `form_view_id` | **不可更改** | 跨视图迁移需要删除重建 |
| `rule_name` | 可更改 | 但需确保不与同视图下其他规则重名 |
| `dimension` | 可更改 | 但需确保与 rule_level 兼容 |
| `dimension_type` | 可更改 | 但需确保与 dimension 匹配 |
| `rule_config` | 可更改 | SQL-99 规范仍需遵守 |

## 自动规则推断判断标准

**前提条件**: 用户未提供 business_desc 和 business_docs

**推断维度时的判断依据**:

| 字段特征 | 推断维度 | 维度类型 | 置信度 |
|----------|----------|----------|--------|
| `is_nullable = NO` | completeness | custom | 高 |
| `is_primary_key = true` | uniqueness | custom | 高 |
| `is_foreign_key = true` | completeness | custom | 中 |
| `data_type IN (VARCHAR, CHAR, TEXT)` | standardization | format | 中 |
| `data_type IN (INT, DECIMAL, FLOAT)` | accuracy | custom | 中 |
| `data_type = DATETIME` | timeliness | custom | 低 |
| 字段名包含 `code/id/number` | uniqueness | custom | 低 |

> **注意**: 仅作为辅助推荐，最终需用户确认

## 视图分类标准

| 分类 | 条件 | 含义 | 建议操作 |
|------|------|------|----------|
| ✅ 正常 | 有报告 + 有规则 | 质量情况已探明 | 展示报告 |
| ⚠️ 待配置 | 有报告 + 无规则 | 缺少质量规则 | 建议配置规则 |
| 🔄 待检测 | 无报告 + 有规则 | 可以发起检测 | 发起检测 |
| ❓ 待配置+检测 | 无报告 + 无规则 | 需配置后检测 | 配置规则并检测 |
| ⏭️ 已跳过 | 已删除/无权限 | 无法检测 | 跳过 |

## 枚举值

### 维度 (dimension)
| 值 | 说明 |
|----|------|
| completeness | 完整性 |
| standardization | 规范性 |
| uniqueness | 唯一性 |
| accuracy | 准确性 |
| consistency | 一致性 |
| timeliness | 及时性 |

### 规则级别 (rule_level)
| 值 | 说明 |
|----|------|
| metadata | 元数据级 |
| field | 字段级 |
| row | 行级 |
| view | 视图级 |

### 维度类型 (dimension_type)
| 值 | 说明 | 适用场景 |
|------|------|----------|
| null | 空 | - |
| row_null | 行数据空值项检查 | - |
| repeat | 行数据重复值检查 | - |
| row_repeat | 行数据重复值检查 | - |
| format | 格式检查 | 仅 standardization |
| dict | 码值检查 | - |
| custom | 自定义规则 | 所有维度 |

### 任务状态 (task_status)
| 值 | 说明 |
|----|------|
| queuing | 排队中 |
| running | 运行中 |
| finished | 已完成 |
| canceled | 已取消 |
| failed | 失败 |

## 质量报告评分处理

### 评分转换
- 原始评分: 1分制 (0.0-1.0)
- 展示评分: 100分制
- 转换公式: `展示评分 = 原始评分 × 100`
- 精度处理: 四舍五入到两位小数

### null值处理
- 当维度评分为 `null` 时，表示**未配置该维度的质量规则**
- 显示为「未配置」
- 不参与综合评分计算

### 综合评分计算
- 仅使用有真实评分（非null）的维度进行计算
- 计算方法: 简单平均

### 评分展示格式
- 评分直接展示数值，不带 "/100" 后缀
- null值显示为「未配置」

## 关键约束

1. **配置优先**: 使用前必须先验证环境变量
2. **有据可依**: 规则配置必须有明确的依据
3. **配置非空**: 创建规则时 `rule_config` 不能为空
4. **技术名称**: `rule_config` 中的 SQL 表达式必须使用字段技术名称
5. **ID语义不能混用**: 知识网络对象类中的 `object_class.data_source.id` 是统一视图ID（用于 `mdl_id` 查逻辑视图），不是工单 `remark.datasource_infos[].datasource_id`
6. **工单数据源来源**: 创建质量检测工单时，`datasource_id`、`datasource_name`、`datasource_type` 必须来自逻辑视图或其数据源信息，不能直接复用对象类里的 `mdl_id`
7. **规则创建字段兼容**: 创建规则时优先使用 `rule_name`、`rule_level`，并将 `rule_config` 作为 JSON 字符串传入
8. **成功响应兼容**: 创建规则成功状态以 `200/201` 都视为成功；创建工单成功后优先读取响应中的 `id`，并兼容 `work_order_id`
9. **无报告不终止**: 查询质量报告时如返回"探查报告不存在"，或接口返回错误码 `DataView.Driven.DataExplorationGetReportError`，统一按"暂无质量报告"理解，不能只停留在分析结论，必须继续进入"是否配置规则并发起检测"的确认步骤
10. **已授权可直走**: 如果用户在当前轮已明确表达"继续处理/解决问题/发起检测"，则在报告缺失时可直接进入规则配置与质量检测流程，无需再次停下询问
11. **统一检测策略**: 多视图需要检测时，优先为所有视图配置规则，然后统一创建一个质量检测工单，避免拆单
12. **业务视角分析**: 质量报告分析必须结合business_desc和business_docs（若存在），从业务视角解读质量指标
