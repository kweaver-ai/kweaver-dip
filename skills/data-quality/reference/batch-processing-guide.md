---
name: "data-quality-batch-processing"
description: "质量规则批量配置处理流程与分页策略。当批量配置质量规则时使用。"
---

# 质量规则批量配置处理流程

> **说明**: 本文档定义从数据源或知识网络触发规则配置时的批量处理策略。

## 场景概述

| 触发来源 | 视图加载方式 | 处理模式 | 分批大小 |
|----------|-------------|----------|----------|
| 数据源 | **分页加载** | 单视图串行 | 每批 5 个视图 |
| 知识网络 | **完整列表** | 单视图串行 | 无限制 |

## 通用处理架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      批量配置主流程                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段0: 前置准备                                                   │
│ 0.1 验证环境变量配置                                               │
│ 0.2 调用 Session API 验证 Token 有效性                              │
│ 0.3 获取当前用户 ID (responsible_uid)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段1: 视图加载                                                   │
│                                                                  │
│ 【数据源场景】                                                     │
│ 1.1 设置分页参数 (limit=5, offset=1)                               │
│ 1.2 调用 GET /form-view 获取视图列表                               │
│ 1.3 检查返回的视图数量                                            │
│     ├─ 数量 < 5 → 最后一批，处理完成后结束                         │
│     └─ 数量 = 5 → 存在更多视图，记录 offset，准备下一批             │
│                                                                  │
│ 【知识网络场景】                                                   │
│ 1.1 调用 GET /form-view (无分页限制) 获取完整视图列表               │
│ 1.2 处理所有视图直至完毕                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段2: 单视图串行处理                                              │
│                                                                  │
│ 对每个视图执行:                                                    │
│ 2.1 获取字段列表 → POST /logic-view/field/multi                  │
│ 2.2 分析字段特征，推断适合的维度规则                                │
│ 2.3 检查规则名称是否重复 → GET /explore-rule/repeat              │
│ 2.4 构建 rule_config (使用对应模板)                               │
│ 2.5 创建质量规则 → POST /explore-rule                            │
│ 2.6 验证响应，提取 rule_id                                        │
│ 2.7 记录处理日志和进度                                            │
│                                                                  │
│ ⚠️ 严格串行处理: 当前视图处理完成后，才开始下一视图                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段3: 批次完成与继续判断                                          │
│                                                                  │
│ 【数据源场景】                                                     │
│ 3.1 当前批次 5 个视图全部处理完成                                  │
│ 3.2 检查是否还存在更多未处理的视图                                  │
│     ├─ 是 → offset += 5，返回阶段1.2继续加载下一批                  │
│     └─ 否 → 进入阶段4汇总报告                                     │
│                                                                  │
│ 【知识网络场景】                                                   │
│ 3.1 所有视图处理完成 → 直接进入阶段4汇总报告                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段4: 处理结果汇总                                                │
│ 4.1 汇总成功/失败统计                                             │
│ 4.2 输出详细处理报告                                               │
│ 4.3 提供错误详情和恢复建议                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 场景一: 从数据源触发 (分页加载)

### 流程图

```
开始
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 初始化: offset=1, limit=5                                       │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 【循环入口】加载视图批次                                           │
│ GET /form-view?limit=5&offset={offset}                          │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
  ┌─────────────────┐
  │  views为空?     │
  └─────────────────┘
       │
      Yes│                    No
       ▼                      ▼
┌──────────────┐      ┌───────────────────────────────────────────┐
│ 批次加载失败  │      │ 处理当前批次 (5个视图)                        │
│ 记录错误     │      │                                           │
│ 继续下一批   │      │ 对每个视图串行执行:                          │
└──────────────┘      │   2.1 获取字段                             │
       │              │   2.2 推断规则                             │
       ▼              │   2.3 重名检查                             │
  ┌──────────────┐    │   2.4 构建配置                            │
  │ offset+=5   │    │   2.5 创建规则                            │
  │ 返回循环入口  │    │   2.6 记录日志                             │
  └──────────────┘    └───────────────────────────────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │ 5个视图全部处理?│
                      └─────────────────┘
                           │       │
        All Done           │      Not Yet
           │               ▼
           ▼        ┌──────────────┐
  ┌──────────────┐ │ offset+=5   │
  │ 输出汇总报告  │ │ 返回循环入口  │
  └──────────────┘ └──────────────┘
           │
           ▼
        结束
```

### 分页参数说明

| 参数 | 值 | 说明 |
|------|-----|------|
| `limit` | 5 | 每页加载的视图数量 |
| `offset` | 1, 2, 3, 4, ... | 页码（第1页、第2页、第3页...） |

### 分页逻辑伪代码

```python
def process_views_from_datasource(datasource_id):
    """
    从数据源触发规则配置 - 分页加载处理
    """
    limit = 5
    offset = 1
    total_processed = 0
    batch_num = 0

    while True:
        batch_num += 1
        log(f"========== 加载批次 {batch_num} (offset={offset}) ==========")

        # 1. 加载视图批次
        views_response = call_api(
            "GET",
            f"/api/data-view/v1/form-view?limit={limit}&offset={offset}&datasource_id={datasource_id}"
        )

        if not views_response or not views_response.get("entries"):
            log(f"批次 {batch_num}: 视图列表为空，结束加载")
            break

        views = views_response["entries"]
        view_count = len(views)
        log(f"批次 {batch_num}: 加载到 {view_count} 个视图")

        # 2. 串行处理每个视图
        for i, view in enumerate(views):
            view_index = total_processed + i + 1
            log(f"开始处理视图 [{view_index}]: {view['name']}")

            try:
                result = process_single_view(view)
                log_result(view, result)
            except Exception as e:
                log_error(view, e)

        total_processed += view_count
        log(f"批次 {batch_num} 完成: 已处理 {total_processed} 个视图")

        # 3. 判断是否继续
        if view_count < limit:
            log("当前批次数量小于5，已处理完全部视图")
            break

        offset += 1

    # 4. 输出汇总报告
    output_summary_report(total_processed)
```

### 日志输出示例

```
========== 批次 1 (offset=1) ==========
[14:30:25] 加载视图批次: limit=5, offset=1
[14:30:26] 成功加载 5 个视图

[14:30:26] 开始处理视图 [1]: 客户主数据表
[14:30:27]   ├─ 获取字段: 成功 (12个字段)
[14:30:27]   ├─ 推断规则: customer_id(唯一性), name(完整性), email(规范性)
[14:30:28]   ├─ 重名检查: 通过
[14:30:29]   └─ 创建规则: 成功 (3条规则)

[14:30:29] 开始处理视图 [2]: 订单明细表
[14:30:30]   ├─ 获取字段: 成功 (8个字段)
[14:30:30]   ├─ 推断规则: order_id(唯一性), amount(准确性)
[14:30:31]   ├─ 重名检查: 通过
[14:30:32]   └─ 创建规则: 成功 (2条规则)

... (继续处理视图3-5)

[14:31:00] 批次 1 完成: 已处理 5 个视图

========== 批次 2 (offset=6) ==========
[14:31:01] 加载视图批次: limit=5, offset=6
[14:31:02] 成功加载 3 个视图

[14:31:02] 开始处理视图 [6]: 产品信息表
...
[14:31:30] 批次 2 完成: 已处理 8 个视图
[14:31:30] 当前批次数量小于5，已处理完全部视图
```

---

## 场景二: 从知识网络触发 (完整列表)

### 流程图

```
开始
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. 获取知识网络下的所有视图                                        │
│ GET /form-view?mdl_id={统一视图ID}                               │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 获取完整视图列表 (无分页限制)                                   │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
  ┌─────────────────┐
  │ 视图列表为空?   │
  └─────────────────┘
       │
      Yes│
       ▼
┌──────────────┐
│ 输出警告     │
│ 终止处理    │
└──────────────┘
       │
       ▼
      结束

       No
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 【循环入口】处理下一个视图                                          │
│ 当前视图 = 视图列表[索引]                                          │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2.1 获取字段列表                                                  │
│ POST /logic-view/field/multi                                    │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2.2 分析字段特征，推断维度规则                                     │
│ 参照: core-constraints.md - 自动规则推断判断标准                   │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2.3 检查规则名称是否重复                                          │
│ GET /explore-rule/repeat?form_view_id={id}&rule_name={name}     │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2.4 构建 rule_config                                             │
│ 格式检查: {"format": {"regex": "..."}}                          │
│ 自定义规则: {"rule_expression": {"sql": "..."}}                  │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2.5 创建质量规则                                                  │
│ POST /api/data-view/v1/explore-rule                             │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2.6 验证响应，提取 rule_id                                        │
│ 2.7 记录处理日志                                                  │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────┐
  │ 还有下一视图?    │
  └─────────────────┘
       │       │
      Yes       No
       ▼        ▼
┌──────────────┐  ┌──────────────┐
│ 索引+=1      │  │ 输出汇总报告 │
│ 返回循环入口 │  └──────────────┘
└──────────────┘        │
                         ▼
                        结束
```

### 完整列表处理伪代码

```python
def process_views_from_knowledge_network(kn_id, object_type_id):
    """
    从知识网络触发规则配置 - 完整列表处理
    """
    # 1. 获取统一视图ID
    mdl_id = get_mdl_id_from_object_type(object_type_id)

    # 2. 获取完整视图列表
    log(f"获取知识网络 {kn_id} 下的所有视图")
    views_response = call_api(
        "GET",
        f"/api/data-view/v1/form-view?mdl_id={mdl_id}"
    )

    if not views_response or not views_response.get("entries"):
        log_warning("视图列表为空，请检查知识网络配置")
        return

    all_views = views_response["entries"]
    total_views = len(all_views)
    log(f"获取到 {total_views} 个视图，开始串行处理")

    success_count = 0
    fail_count = 0
    results = []

    # 3. 串行处理每个视图
    for index, view in enumerate(all_views, 1):
        log(f"========== 处理视图 [{index}/{total_views}]: {view['name']} ==========")

        try:
            # 单视图处理
            result = process_single_view(view)
            results.append({"view": view, "status": "success", "result": result})
            success_count += 1

            # 记录成功日志
            log(f"视图 [{index}/{total_views}] 处理成功: {result['rules_created']} 条规则")

        except Exception as e:
            results.append({"view": view, "status": "failed", "error": str(e)})
            fail_count += 1

            # 记录错误日志
            log_error(f"视图 [{index}/{total_views}] 处理失败: {e}")

            # 决定是否继续处理
            if is_critical_error(e):
                log_critical_error(f"遇到关键错误，停止处理: {e}")
                break

    # 4. 输出汇总报告
    output_summary_report(total_views, success_count, fail_count, results)
```

---

## 单视图处理流程

### 处理步骤详解

```python
def process_single_view(view):
    """
    单视图规则配置 - 严格串行处理
    """
    view_id = view["id"]
    view_name = view["name"]
    rules_created = []

    # 步骤1: 获取字段列表
    log(f"  [1/6] 获取字段列表...")
    fields_response = call_api(
        "POST",
        "/api/data-view/v1/logic-view/field/multi",
        {"ids": [view_id]}
    )

    if not fields_response or not fields_response.get("logic_views"):
        raise FieldFetchError(f"无法获取视图 {view_name} 的字段列表")

    fields = fields_response["logic_views"][0].get("fields", [])
    log(f"      成功获取 {len(fields)} 个字段")

    # 步骤2: 分析字段特征，推断维度规则
    log(f"  [2/6] 分析字段特征，推断规则...")
    inferred_rules = infer_rules_from_fields(fields)
    log(f"      推断出 {len(inferred_rules)} 条规则: {[r['dimension'] for r in inferred_rules]}")

    # 步骤3: 对每条推断规则执行创建流程
    for rule_spec in inferred_rules:
        # 3.1 检查规则名称是否重复
        log(f"  [3/6] 检查规则名称重复: {rule_spec['rule_name']}")
        repeat_check = call_api(
            "GET",
            f"/api/data-view/v1/explore-rule/repeat?form_view_id={view_id}&rule_name={rule_spec['rule_name']}"
        )

        if repeat_check.get("is_repeat"):
            log(f"      规则名称重复，跳过: {rule_spec['rule_name']}")
            continue

        # 3.2 构建 rule_config
        log(f"  [4/6] 构建规则配置...")
        rule_config = build_rule_config(rule_spec)
        log(f"      配置: {rule_config}")

        # 3.3 创建规则
        log(f"  [5/6] 创建质量规则...")
        create_response = call_api(
            "POST",
            "/api/data-view/v1/explore-rule",
            {
                "form_view_id": view_id,
                "rule_name": rule_spec["rule_name"],
                "dimension": rule_spec["dimension"],
                "dimension_type": rule_spec["dimension_type"],
                "rule_level": rule_spec["rule_level"],
                "field_id": rule_spec.get("field_id"),
                "rule_config": json.dumps(rule_config),
                "enable": True,
                "draft": False
            }
        )

        # 3.4 提取 rule_id
        rule_id = create_response.get("rule_id")
        if rule_id:
            rules_created.append({
                "rule_id": rule_id,
                "rule_name": rule_spec["rule_name"],
                "dimension": rule_spec["dimension"]
            })
            log(f"      规则创建成功: {rule_id}")
        else:
            log_error(f"规则创建响应异常: {create_response}")

    # 步骤6: 返回处理结果
    log(f"  [6/6] 视图 {view_name} 处理完成: {len(rules_created)} 条规则")

    return {
        "view_id": view_id,
        "view_name": view_name,
        "fields_count": len(fields),
        "rules_created": rules_created,
        "rules_failed": len(inferred_rules) - len(rules_created)
    }
```

---

## 进度反馈机制

### 进度消息模板

```python
def generate_progress_message(current, total, stage, details=None):
    """
    生成进度反馈消息
    """
    percentage = (current / total * 100) if total > 0 else 0
    bar_length = 20
    filled = int(bar_length * current / total) if total > 0 else 0
    bar = "█" * filled + "░" * (bar_length - filled)

    message = f"""
╔══════════════════════════════════════════════════════════════╗
║  质量规则配置进度                                             ║
╠══════════════════════════════════════════════════════════════╣
║  阶段: {stage:<50} ║
║  进度: [{bar}] {percentage:.1f}% ({current}/{total})              ║
╠══════════════════════════════════════════════════════════════╣
║  当前处理: {details or '-':<47} ║
╚══════════════════════════════════════════════════════════════╝
"""
    return message
```

### 进度输出示例

```
╔══════════════════════════════════════════════════════════════╗
║  质量规则配置进度                                             ║
╠══════════════════════════════════════════════════════════════╣
║  阶段: 从数据源加载视图 (批次 2/5)                              ║
║  进度: [████████░░░░░░░░░░░░░] 30.0% (6/20)                 ║
╠══════════════════════════════════════════════════════════════╣
║  当前处理: 视图 [6]: 订单明细表                                ║
╚══════════════════════════════════════════════════════════════╝

已配置规则:
  ✅ 客户主数据表: 3条规则
  ✅ 产品信息表: 2条规则
  ⏳ 订单明细表: 处理中...
```

---

## 错误处理机制

### 错误分类

| 错误类型 | 说明 | 处理策略 | 是否继续 |
|----------|------|----------|----------|
| **网络错误** | 连接超时、DNS失败 | 重试3次，指数退避 | 继续下一视图 |
| **认证错误** | 401/403 | 记录错误，终止批次 | 终止全部 |
| **视图不存在** | 404 | 记录警告，跳过 | 继续下一视图 |
| **字段获取失败** | 无法获取字段 | 记录错误，跳过视图 | 继续下一视图 |
| **规则名称重复** | 重复检查不通过 | 跳过该规则 | 继续其他规则 |
| **规则创建失败** | 400错误 | 记录错误，跳过 | 继续其他规则 |
| **服务不可用** | 503 | 等待30秒重试 | 继续 |

### 错误日志格式

```python
ERROR_TEMPLATE = """
⚠️  错误详情:
    时间戳: {timestamp}
    视图: {view_name} ({view_id})
    阶段: {stage}
    错误类型: {error_type}
    错误消息: {error_message}
    API响应: {api_response}
    处理建议: {suggestion}
"""
```

### 错误恢复建议

```python
RECOVERY_SUGGESTIONS = {
    "NETWORK_ERROR": "请检查网络连接后重试。如问题持续，请确认服务地址是否正确。",
    "TOKEN_INVALID": "认证Token已失效，请刷新Token后重试。",
    "VIEW_NOT_FOUND": "视图可能已被删除或无访问权限，已跳过该视图。",
    "FIELD_FETCH_FAILED": "无法获取字段信息，已跳过该视图的配置。",
    "RULE_DUPLICATE": "规则名称重复，已自动跳过。如需创建，请使用新名称。",
    "RULE_CREATE_FAILED": "规则创建失败，请检查规则配置是否符合规范。",
    "SERVICE_UNAVAILABLE": "服务暂时不可用，已自动重试。如问题持续，请联系管理员。"
}
```

---

## 处理结果汇总报告

### 汇总报告模板

```markdown
# 质量规则配置处理报告

**执行时间**: {start_time} - {end_time}
**触发来源**: {trigger_type}
**处理批次**: {batch_count}

## 执行摘要

| 指标 | 数值 |
|------|------|
| 总视图数 | {total_views} |
| 成功处理 | {success_views} |
| 失败处理 | {failed_views} |
| 总规则数 | {total_rules} |
| 规则创建成功 | {rules_created} |
| 规则创建失败 | {rules_failed} |
| 执行时长 | {duration} |

## 视图处理详情

| 序号 | 视图名称 | 状态 | 规则数 | 错误 |
|------|----------|------|--------|------|
| 1 | 客户主数据表 | ✅ 成功 | 3 | - |
| 2 | 订单明细表 | ✅ 成功 | 2 | - |
| 3 | 产品信息表 | ❌ 失败 | 0 | FIELD_FETCH_FAILED |
| 4 | 库存表 | ✅ 成功 | 4 | - |
| ... | ... | ... | ... | ... |

## 失败详情

### 视图 3: 产品信息表
- **错误类型**: FIELD_FETCH_FAILED
- **错误消息**: 无法获取视图字段列表
- **API响应**: {"code": 500, "message": "Internal Server Error"}
- **恢复建议**: 请稍后重试，或联系管理员检查数据视图服务状态

## 下一步建议

1. ✅ 失败的视图可重试配置
2. ✅ 建议检查失败原因后重新发起配置
3. ✅ 可使用 `GET /api/data-view/v1/explore-rule?form_view_id={id}` 查询已配置规则
```

---

## 关键约束

> **详细约束请参考**: [核心约束](../reference/core-constraints.md)

1. **单视图串行**: 必须等当前视图处理完成（包括字段获取、规则推断、规则创建）后才能开始下一视图
2. **分页加载**: 数据源场景每次加载5个视图，需正确处理 offset 和 limit
3. **规则名称唯一**: 创建规则前必须检查重复性
4. **SQL-99 合规**: 规则配置的 SQL 表达式必须符合 SQL-99 标准
5. **技术名称**: rule_config 中的 SQL 表达式必须使用字段技术名称
