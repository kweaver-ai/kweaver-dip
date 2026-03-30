---
name: "data-quality-intent-recognition"
description: "数据质量管理用户意图识别框架。当需要理解用户意图并确定处理流程时使用。"
---

# 用户意图识别框架

> **目的**: 统一管理用户意图识别逻辑，确保准确理解用户需求并触发正确的处理流程。

## 意图分类体系

### 一级意图分类

| 意图类别 | 关键词/模式 | 优先级 | 处理流程 |
|----------|------------|--------|----------|
| **质量检测** | 质量检测、数据检测、质量检查、执行检测 | P1 | [质量检测流程](./quality-inspection-workflow.md) |
| **质量报告查询** | 质量报告、质量情况、数据质量怎么样、探查报告、查看报告 | P1 | [质量报告查询](#质量报告查询) |
| **规则配置** | 配置规则、创建规则、新建规则、添加规则 | P2 | [规则配置流程](#规则配置流程) |
| **规则查询** | 查询规则、查看规则、规则列表、获取规则 | P3 | [规则查询](#规则查询) |
| **视图查询** | 查询视图、查看视图、视图列表、获取字段 | P4 | [视图查询](#逻辑视图查询) |
| **工单管理** | 创建工单、查询工单、工单状态、探查任务 | P5 | [工单管理](#质量检测工单管理) |
| **知识网络** | 知识网络、对象类、对象类型、本体 | P0 | [知识网络流程](./knowledge-network-workflow.md) |

### 复合意图优先规则

当用户同时表达“知识网络/对象类”与“质量情况/质量报告/数据质量怎么样”时：
- **主意图**: 质量报告查询
- **实体解析路径**: 知识网络流程
- **强制动作**: 先通过知识网络解析出视图，再查询质量报告
- **缺报告处理**: 一旦报告不存在，必须进入“确认或直接执行质量检测”的分支，不能停留在“暂无报告”的说明层

### 二级意图分类（场景细分）

#### 质量检测场景

| 场景 | 关键词组合 | 检测级别 | 说明 |
|------|-----------|----------|------|
| 数据源级检测 | "数据源" + "质量检测" | datasource | 对整个数据源进行检测 |
| 视图级检测 | "视图" + "质量检测" | view | 对指定视图进行检测 |
| 知识网络检测 | "知识网络/对象类" + "质量检测" | view | 基于知识网络进行检测 |

#### 规则配置场景

| 场景 | 关键词组合 | 配置方式 | 说明 |
|------|-----------|----------|------|
| 单字段规则 | "字段" + "规则" | field | 为单个字段配置规则 |
| 多字段规则 | "批量" + "规则" | batch | 为多个字段批量配置规则 |
| 视图级规则 | "视图" + "规则" | view | 配置视图级规则 |
| 知识网络规则 | "知识网络" + "规则" | knowledge | 基于知识网络配置规则 |

## 意图识别决策树

```
用户输入
    │
    ├─ 同时包含"知识网络/对象类" + "质量情况/质量报告/数据质量怎么样"
    │   └── 复合意图：知识网络质量报告查询
    │       ├── 先按知识网络流程定位对象类和视图
    │       └── 再按质量报告查询流程处理报告缺失/检测发起
    │
    ├─ 包含"质量检测/数据检测/质量检查" ──▶ 质量检测意图
    │                                          ├── 包含"数据源" ──▶ 数据源级检测
    │                                          ├── 包含"视图" ──▶ 视图级检测
    │                                          └── 包含"知识网络/对象类" ──▶ 知识网络检测
    │
    ├─ 包含"配置规则/创建规则/新建规则" ──▶ 规则配置意图
    │                                          ├── 包含"批量" ──▶ 批量字段规则配置
    │                                          ├── 包含"视图" ──▶ 视图级规则配置
    │                                          └── 默认 ──▶ 单字段规则配置
    │
    ├─ 包含"查询规则/查看规则/规则列表" ──▶ 规则查询意图
    │
    ├─ 包含"查询视图/查看视图/获取字段" ──▶ 视图查询意图
    │
    ├─ 包含"工单/探查任务" ──▶ 工单管理意图
    │
    └─ 包含"知识网络/对象类/本体" ──▶ 知识网络意图
```

## 意图处理流程映射

### 质量检测意图处理流程

```python
def handle_quality_inspection_intent(intent_context):
    """
    处理质量检测意图
    """
    # 1. 确定检测级别
    detection_level = determine_detection_level(intent_context)
    
    # 2. 获取目标对象（数据源/视图/知识网络）
    target = extract_target_from_context(intent_context)
    
    # 3. 触发质量检测流程
    if detection_level == "datasource":
        return trigger_datasource_inspection(target)
    elif detection_level == "view":
        return trigger_view_inspection(target)
    elif detection_level == "knowledge_network":
        return trigger_knowledge_network_inspection(target)
```

### 质量报告查询意图处理流程

```python
def handle_quality_report_query_intent(intent_context):
    """
    处理质量报告查询意图
    """
    # 1. 确定查询目标（数据源/视图/知识网络/对象类）
    target = extract_target_from_context(intent_context)
    target_type = determine_target_type(intent_context)
    
    # 2. 获取目标视图ID
    if target_type == "knowledge_network":
        # 知识网络场景：通过对象类获取一个或多个视图
        view_ids = get_views_from_knowledge_network(target)
    elif target_type == "datasource":
        # 数据源场景：获取数据源下的视图列表
        view_ids = get_views_from_datasource(target)
    else:
        # 直接指定视图
        view_ids = [target]
    
    # 3. 查询视图探查报告
    reports = [query_explore_report(view_id) for view_id in view_ids]
    
    # 4. 根据报告状态处理
    if reports and all(report_exists(report) for report in reports):
        # 4.1 报告存在：展示报告信息
        return display_quality_report(reports)
    else:
        # 4.2 报告不存在：必须进入质量检测流程
        # 如果用户已明确授权继续处理，则直接配置规则并发起检测
        if user_has_preapproved_inspection(intent_context):
            return trigger_quality_inspection_workflow(view_ids)
        # 否则先征求确认，再进入质量检测流程
        return ask_user_to_confirm_inspection(view_ids)
```

### 规则配置意图处理流程

```python
def handle_rule_configuration_intent(intent_context):
    """
    处理规则配置意图
    """
    # 1. 确定配置级别
    config_level = determine_config_level(intent_context)
    
    # 2. 获取配置目标
    target = extract_target_from_context(intent_context)
    
    # 3. 触发规则配置流程
    if config_level == "field":
        return trigger_field_rule_configuration(target)
    elif config_level == "view":
        return trigger_view_rule_configuration(target)
    elif config_level == "batch":
        return trigger_batch_rule_configuration(target)
    elif config_level == "knowledge":
        return trigger_knowledge_network_rule_configuration(target)
```

## 优先级处理规则

### P0 - 实体解析优先级（知识网络）
- 知识网络优先用于**定位实体和视图**
- 但当用户明确在问“质量情况/质量报告”时，**最终动作优先级**应落到质量报告查询或质量检测流程
- 不能因为命中了“知识网络”就跳过“报告缺失后继续检测”的必经分支

### P1 - 高优先级（质量检测）
- 质量检测意图优先级高于规则配置
- 原因：检测通常是用户的最终目标

### P2-P5 - 常规优先级
- 按用户明确表达的意图顺序处理
- 如意图不明确，按默认优先级处理

## 模糊意图处理

### 场景1: 多意图识别
当用户输入可能对应多个意图时：
1. 列出可能的意图选项
2. 请用户确认或补充信息
3. 根据确认结果进入对应流程

### 场景2: 意图不明确
当无法明确识别用户意图时：
1. 询问用户的具体需求
2. 提供可选的操作列表
3. 引导用户明确意图

### 场景3: 上下文继承
在多轮对话中：
1. 继承上一轮对话的上下文
2. 结合当前输入判断意图
3. 保持对话连贯性

## 意图识别示例

### 示例1: 明确的质量检测意图
**用户输入**: "对客户主数据表执行质量检测"

**识别结果**:
- 意图类别: 质量检测
- 检测级别: view
- 目标对象: 客户主数据表
- 处理流程: [质量检测流程](./quality-inspection-workflow.md)

### 示例2: 知识网络相关意图
**用户输入**: "基于客户知识网络配置质量规则"

**识别结果**:
- 意图类别: 知识网络
- 配置级别: knowledge
- 目标对象: 客户知识网络
- 处理流程: [知识网络流程](./knowledge-network-workflow.md)

### 示例3: 批量规则配置意图
**用户输入**: "批量为客户信息表的字段创建完整性规则"

**识别结果**:
- 意图类别: 规则配置
- 配置级别: batch
- 目标对象: 客户信息表
- 处理流程: 批量字段规则配置
