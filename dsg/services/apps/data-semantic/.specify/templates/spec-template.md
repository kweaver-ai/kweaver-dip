# {{feature_name}} Specification

> **Branch**: `feature/{{feature_name}}`  
> **Spec Path**: `specs/{{feature_name}}/`  
> **Created**: {{date}}  

> **Status**: Draft

---

## Overview

<!-- 功能概述（1-2句话），让任何人快速理解功能目的 -->

$ARGUMENTS

---

## User Stories

<!--
  用户故事按优先级排序，每个 Story 应可独立测试和交付。
  
  简单功能（单一 CRUD）：只需一个 P1 Story，省略优先级说明
  复杂功能（多场景）：按 P1/P2/P3 拆分，说明优先级原因
-->

### Story 1: [标题] (P1)

AS a [角色]
I WANT [功能]
SO THAT [价值/目标]

**独立测试**: [如何验证此 Story 已完成]

<!-- 复杂功能添加更多 Story，简单功能省略以下内容 -->

### Story 2: [标题] (P2)

AS a [角色]
I WANT [功能]
SO THAT [价值/目标]

**独立测试**: [如何验证此 Story 已完成]

---

## Acceptance Criteria (EARS)

<!-- 使用 WHEN / THE SYSTEM SHALL 格式，按正常/异常分类 -->

### 正常流程

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-01 | 创建成功 | WHEN 用户提交有效数据 | THE SYSTEM SHALL 保存并返回 201 |
| AC-02 | 查询成功 | WHEN 用户查询存在的资源 | THE SYSTEM SHALL 返回资源详情 |
| AC-03 | 更新成功 | WHEN 用户更新有效数据 | THE SYSTEM SHALL 保存并返回 200 |
| AC-04 | 删除成功 | WHEN 用户删除存在的资源 | THE SYSTEM SHALL 删除并返回 204 |

### 异常处理

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-10 | 参数为空 | WHEN 必填参数为空 | THE SYSTEM SHALL 返回 400 |
| AC-11 | 资源不存在 | WHEN 查询不存在的 ID | THE SYSTEM SHALL 返回 404 |
| AC-12 | 名称重复 | WHEN 名称与已有资源重复 | THE SYSTEM SHALL 返回 409 |
| AC-13 | 权限不足 | WHEN 用户无操作权限 | THE SYSTEM SHALL 返回 403 |

---

## Edge Cases

<!-- 边界情况和特殊场景，补充主流程外的边界情况 -->

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-01 | 并发创建同名资源 | 仅一个成功，其他返回 409 |
| EC-02 | 删除被引用的资源 | 返回 400，提示存在关联 |
| EC-03 | 批量操作部分失败 | 返回失败项列表 |

---

## Business Rules

<!-- 业务规则（非技术实现） -->

| ID | Rule | Description |
|----|------|-------------|
| BR-01 | 名称唯一 | 同一模块下名称不能重复 |
| BR-02 | 层级限制 | 最大支持 N 层嵌套 |
| BR-03 | 状态流转 | 只能按指定顺序流转 |

---

## Data Considerations

<!-- 需要持久化的数据（不是表结构），为 Phase 2 设计提供输入 -->

| Field | Description | Constraints |
|-------|-------------|-------------|
| 名称 | 资源名称 | 必填，1-50 字符，唯一 |
| 编码 | 资源编码 | 可选，小写字母+数字+下划线 |
| 状态 | 资源状态 | 启用/禁用 |
| 排序 | 显示顺序 | 整数，默认 0 |

---

## Success Metrics

<!-- 可选：可测量的成功标准 -->

| ID | Metric | Target |
|----|--------|--------|
| SC-01 | 接口响应时间 | < 200ms (P99) |
| SC-02 | 测试覆盖率 | > 80% |

---

## Open Questions

<!-- 待澄清问题，避免假设 -->

- [ ] 问题 1
- [ ] 问题 2

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{date}} | - | 初始版本 |
