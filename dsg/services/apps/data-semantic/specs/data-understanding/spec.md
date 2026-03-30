# Data Understanding Specification

> **Branch**: `feature/data-understanding`
> **Spec Path**: `specs/data-understanding/`
> **Created**: 2026-02-03
> **Status**: Draft

---

## Overview

本功能实现了库表数据的语义理解和业务对象识别。通过 AI 服务自动分析库表和字段的业务含义，支持用户编辑确认后正式发布。核心特性包括：
- 库表/字段语义补全（业务名称、角色、描述）
- 业务对象自动识别（基于字段语义分组）
- 版本控制（支持重新识别，保留历史版本）
- 异步 AI 处理（Kafka 消息队列）

---

## Clarifications

### Session 2026-02-03

- Q: Kafka 消费者如何处理重复消息？ → A: 记录警告日志，跳过已处理的消息
- Q: Kafka 消费者处理 AI 响应失败时如何记录和告警？ → A: 记录结构化日志（JSON），包含 message_id、form_view_id、错误详情
- Q: 状态为"未理解"时查询接口如何处理？ → A: 返回空数据（fields=[] 或 list=[]），前端显示引导提示"点击一键生成开始理解"
- Q: 单个库表最多可能有多少个字段？ → A: 按设计文档执行，不设额外字段数量限制

### Session 2026-02-10

- Q: API 接口认证机制？ → A: 已移除 JWT 认证要求，接口无需认证
- Q: 一键生成是否支持部分字段理解？ → A: 是，支持传入 `fields` 参数选择特定字段进行理解

---

## User Stories

### Story 1: 一键生成理解数据 (P1)

AS a 数据管理员
I WANT 一键启动 AI 分析库表和字段的业务语义（支持全部字段或部分字段）
SO THAT 完成库表理解，无需手动填写

**独立测试**:
- 点击"一键生成"按钮（不传 fields 参数），理解状态变为"理解中"，AI 完成后变为"待确认"，所有字段被理解
- 点击"一键生成"按钮（传入 fields 参数），理解状态变为"理解中"，AI 完成后变为"待确认"，仅选中字段被理解

### Story 2: 编辑语义补全数据 (P1)

AS a 数据管理员
I WANT 编辑库表业务名称、字段业务名称、字段角色和描述
SO THAT 修正 AI 识别不准确的内容

**独立测试**: 修改临时表数据后，能查询到最新编辑的内容

### Story 3: 查看业务对象识别结果 (P1)

AS a 数据管理员
I WANT 查看 AI 识别的业务对象和属性分组
SO THAT 了解库表的业务结构

**独立测试**: 查询接口返回业务对象列表和属性嵌套结构

### Story 4: 编辑业务对象及属性 (P2)

AS a 数据管理员
I WANT 修改业务对象名称、属性名称、调整属性归属
SO THAT 优化业务对象的分组结构

**独立测试**: 修改后查询接口返回更新后的结构

### Story 5: 重新识别业务对象 (P2)

AS a 数据管理员
I WANT 基于当前字段语义重新识别业务对象
SO THAT 在调整字段语义后获得新的业务对象分组

**独立测试**: 重新识别后创建新版本记录，旧版本保留

### Story 6: 提交确认发布 (P1)

AS a 数据管理员
I WANT 提交确认后将临时表数据同步到正式表
SO THAT 完成库表理解，进入业务对象建模阶段

**独立测试**: 提交后正式表有数据，理解状态变为"已完成"

### Story 7: 删除识别结果 (P2)

AS a 数据管理员
I WANT 删除业务对象临时数据
SO THAT 重新开始识别或放弃当前识别结果

**独立测试**: 删除后业务对象临时表数据被逻辑删除

---

## Acceptance Criteria (EARS)

### 正常流程

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-01 | 启动 AI 理解（全部字段） | WHEN 用户点击"一键生成"且状态为"未理解"或"已完成"且未传入 fields 参数 | THE SYSTEM SHALL 将状态设为"理解中"并调用 AI 服务 HTTP API（request_type: full_understanding）查询所有字段 |
| AC-01a | 启动 AI 理解（部分字段） | WHEN 用户点击"一键生成"且状态为"未理解"或"已完成"且传入 fields 参数 | THE SYSTEM SHALL 将状态设为"理解中"并调用 AI 服务 HTTP API（request_type: partial_understanding）使用传入的字段信息 |
| AC-02 | AI 处理完成 | WHEN Kafka 消费者收到 AI 成功响应 | THE SYSTEM SHALL 保存语义数据到临时表并将状态设为"待确认" |
| AC-03 | 查询字段语义 | WHEN 状态为"待确认"且用户查询字段语义 | THE SYSTEM SHALL 从临时表返回最新版本数据 |
| AC-04 | 查询业务对象 | WHEN 状态为"待确认"且用户查询业务对象 | THE SYSTEM SHALL 从临时表返回嵌套结构 |
| AC-05 | 保存库表信息 | WHEN 用户编辑库表业务名称或描述 | THE SYSTEM SHALL 更新临时表记录（不递增版本号） |
| AC-06 | 保存字段信息 | WHEN 用户编辑字段业务名称、角色或描述 | THE SYSTEM SHALL 更新临时表记录（不递增版本号） |
| AC-07 | 保存业务对象 | WHEN 用户修改业务对象或属性名称 | THE SYSTEM SHALL 更新临时表记录（不递增版本号） |
| AC-08 | 调整属性归属 | WHEN 用户将属性移动到其他业务对象 | THE SYSTEM SHALL 更新属性的 business_object_id |
| AC-09 | 提交确认 | WHEN 用户点击"提交确认"且状态为"待确认"或"已完成" | THE SYSTEM SHALL 将临时表数据同步到正式表并将状态设为"已完成" |
| AC-10 | 重新识别 | WHEN 用户点击"重新识别"且状态为"待确认"或"已完成" | THE SYSTEM SHALL 基于 AI 服务重新生成业务对象，版本号递增 |
| AC-11 | 查询理解状态 | WHEN 用户查询库表理解状态 | THE SYSTEM SHALL 返回当前状态和版本号 |
| AC-12 | 删除业务对象 | WHEN 用户点击"删除"且状态为"待确认" | THE SYSTEM SHALL 逻辑删除业务对象临时数据 |

### 异常处理

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-20 | 状态不允许生成 | WHEN 用户点击"一键生成"但状态为"理解中"或"待确认"或"已发布" | THE SYSTEM SHALL 返回 400，提示当前状态不允许操作 |
| AC-21 | 状态不允许提交 | WHEN 用户点击"提交"但状态为"未理解"或"理解中"或"已发布" | THE SYSTEM SHALL 返回 400，提示当前状态不允许操作 |
| AC-22 | 状态不允许删除 | WHEN 用户点击"删除"但状态为"理解中"或"已发布" | THE SYSTEM SHALL 返回 400，提示当前状态不允许操作 |
| AC-23 | 业务对象名称重复 | WHEN 用户修改业务对象名称为同名 | THE SYSTEM SHALL 返回 400，提示名称重复 |
| AC-24 | 属性名称重复 | WHEN 用户修改属性名称为同一业务对象下的同名 | THE SYSTEM SHALL 返回 400，提示属性名称重复 |
| AC-25 | 目标业务对象不存在 | WHEN 用户调整属性归属到不存在的业务对象 | THE SYSTEM SHALL 返回 404，提示业务对象不存在 |
| AC-26 | AI 服务不可用 | WHEN AI 服务 HTTP API 调用失败或 AI 服务超时 | THE SYSTEM SHALL 回退状态到"未理解"并返回 503 |
| AC-27 | AI 分析失败 | WHEN AI 返回失败响应 | THE SYSTEM SHALL 记录结构化日志（JSON，含 message_id/form_view_id/错误详情），保持状态为"理解中" |
| AC-28 | 并发重复点击 | WHEN 同一用户1秒内重复点击同一操作 | THE SYSTEM SHALL 通过 Redis 限流拒绝请求 |
| AC-29 | 查询时理解中 | WHEN 用户查询数据但状态为"理解中" | THE SYSTEM SHALL 返回 400，提示正在理解中请稍后 |

---

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-01 | 字段语义为空时重新识别 | 基于现有字段信息（技术名称、类型）识别业务对象 |
| EC-02 | 临时表无数据时提交 | 跳过对应表的同步，不报错 |
| EC-03 | 删除后正式表有数据 | 理解状态保持"已完成" |
| EC-04 | 删除后正式表无数据 | 理解状态回退到"未理解" |
| EC-05 | 业务对象所有属性被移走 | 业务对象保留，允许为空 |
| EC-06 | Kafka 消息重复消费 | 检测到重复 message_id 时，记录警告日志并跳过处理 |
| EC-07 | 重新识别时旧版本数据 | 旧版本记录保留，通过版本号区分 |
| EC-08 | 状态为"已完成"时编辑 | 更新临时表数据，状态保持"已完成" |
| EC-09 | 状态为"未理解"时查询 | 返回空数据（fields=[] 或 list=[]），前端显示引导提示"点击一键生成开始理解" |

---

## Business Rules

| ID | Rule | Description |
|----|------|-------------|
| BR-01 | 状态流转规则 | 未理解 → 理解中 → 待确认 → 已完成 → 已发布（单向流转） |
| BR-02 | 版本号管理 | AI 生成时递增，用户编辑时不递增 |
| BR-03 | 数据来源规则 | 状态 2（待确认）查询临时表，其他状态查询正式表 |
| BR-04 | 并发控制 | 同一用户对同一库表 1 秒内只允许一次操作 |
| BR-05 | 名称唯一性 | 同一业务对象下属性名称不能重复 |
| BR-06 | 临时表保留 | 提交后临时表数据保留，不删除 |
| BR-07 | 字段角色枚举 | 1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段 |
| BR-08 | 部分字段理解 | 支持通过 fields 参数选择特定字段进行 AI 理解，未传参数则理解全部字段 |
| BR-09 | 增量更新策略 | 提交时采用 3 步增量更新：1) UPDATE 已有记录（通过 formal_id 匹配），2) INSERT 新增记录（formal_id 为 NULL），3) DELETE 移除记录（正式表有但临时表没有的） |

---

## Data Considerations

### 库表级别数据

| Field | Description | Constraints |
|-------|-------------|-------------|
| table_tech_name | 库表技术名称 | 来自 form_view.technical_name |
| table_business_name | 库表业务名称 | 必填，最大 255 字符 |
| table_description | 库表描述 | 可选，最大 300 字符 |

### 字段级别数据

| Field | Description | Constraints |
|-------|-------------|-------------|
| form_view_field_id | 字段 UUID | 关联 form_view_field.id |
| field_tech_name | 字段技术名称 | 来自 form_view_field.technical_name |
| field_type | 字段类型 | 来自 form_view_field.data_type |
| field_role | 字段角色 | 枚举 1-8，可选 |
| field_description | 字段描述 | 可选，最大 300 字符 |
| field_comment | 字段注释 | 可选，来自 form_view_field.comment |

### 字段选择参数 (FieldSelection)

用于"一键生成理解数据"接口的部分字段理解功能：

| Field | Description | Constraints |
|-------|-------------|-------------|
| form_view_field_id | 字段 UUID | 必填 |
| field_tech_name | 字段技术名称 | 必填 |
| field_type | 字段数据类型 | 必填 |
| field_role | 字段角色 | 可选，用于增强 AI 分析效果 |
| field_description | 字段描述 | 可选，用于增强 AI 分析效果 |
| field_comment | 字段注释 | 可选，来自 form_view_field.comment |

### 业务对象数据

| Field | Description | Constraints |
|-------|-------------|-------------|
| id | 业务对象 UUID | UUID v7，主键 |
| object_name | 业务对象名称 | 必填，最大 100 字符 |
| form_view_id | 关联数据视图 UUID | 关联 form_view.id |
| formal_id (临时表) | 正式表 UUID | 用于增量更新，首次为 NULL，提交后回写正式表 id |

### 业务对象属性数据

| Field | Description | Constraints |
|-------|-------------|-------------|
| id | 属性 UUID | UUID v7，主键 |
| business_object_id | 关联业务对象 UUID | 关联 t_business_object.id |
| form_view_field_id | 关联字段 UUID | 关联 form_view_field.id |
| attr_name | 属性名称 | 必填，最大 100 字符 |
| formal_id (临时表) | 正式表 UUID | 用于增量更新，首次为 NULL，提交后回写正式表 id |

### 版本控制

| Field | Description | Constraints |
|-------|-------------|-------------|
| version | 版本号 | 存储格式：10=1.0，11=1.1，每次递增 1 表示 0.1 版本 |
| user_id | 操作用户 ID | 为空表示 AI 操作，不为空表示用户操作 |

---

## Success Metrics

| ID | Metric | Target |
|----|--------|--------|
| SC-01 | AI 理解响应时间 | < 30 秒（P99） |
| SC-02 | 查询接口响应时间 | < 200ms（P99） |
| SC-03 | 测试覆盖率 | > 80% |

---

## Open Questions

- [ ] Kafka 消息格式需与 AI 团队确认（Request/Response Schema）- 实施前必须确认
- [x] Redis 限流配置细节（时间窗口、最大请求数）- ✅ 已确认（见 plan.md Redis 限流配置）

---

## Non-Functional Requirements

### 安全性
- API 接口无需认证（已移除 JWT 要求）

### 可观测性
- Kafka 消费者处理失败时记录结构化日志（JSON），包含 message_id、form_view_id、错误详情（AC-27）
- AI 理解响应时间监控：< 30 秒（P99）（SC-01）
- 查询接口响应时间监控：< 200ms（P99）（SC-02）

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-03 | - | 初始版本，基于 807707-库表数据理解方案设计.md |
| 1.1 | 2026-02-03 | - | 澄清会话：Kafka 重复消息处理、JWT 认证、结构化日志、空状态处理 |
| 1.2 | 2026-02-09 | - | 添加 formal_id 字段定义和增量更新业务规则（BR-09） |
| 1.3 | 2026-02-10 | - | 移除 JWT 认证要求（BR-08），添加部分字段理解支持（BR-08），新增 FieldSelection 数据结构 |
| 1.4 | 2026-03-03 | - | 更新数据来源规则（BR-03）：去掉融合逻辑，改为状态路由；查询接口简化 |
