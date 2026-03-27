---
name: 数据语义服务
description: 数据语义服务 API - 集成查询与理解功能。支持查询字段语义和业务对象识别结果，同时支持触发表单视图的语义理解流程，包括状态查询、生成、轮询、提交确认等完整生命周期。
version: 1.0.0
user-invocable: true
metadata:
  openclaw:
    skillKey: data_semantic
    emoji: "🧠"
config:
  # 默认配置（可在 TOOLS.md 中覆盖）
  kn_id: "d6ptuq46vfkhfektuntg"
  ot_id: "d6rmtl46vfkhfektuoe0"
  base_url: "https://dip.aishu.cn/api/data-semantic/v1"
  logic_view_base_url: "https://dip.aishu.cn/api/data-view/v1"
---

# Purpose

本 skill 集成数据语义服务的完整功能：

- **查询功能**：查询字段语义补全数据、业务对象识别结果
- **视图列表功能**：查询逻辑视图列表（支持数据源筛选、关键字搜索）
- **理解功能**：触发表单视图的语义理解流程，包括状态监听和结果整合
- **批量理解功能**：批量并行处理多个表单视图的语义理解（含数据源模式）
- **对象匹配**：批量业务对象匹配（使用 data_semantic_match skill）

## 主要功能

1. 查询字段语义补全数据（来自 t_form_view_field_info 表）
2. 查询业务对象识别结果（来自 t_business_object 和 t_business_object_attributes 表）
3. 查询逻辑视图列表（支持数据源筛选、关键字搜索）
4. 查询表单视图理解状态
5. 触发生成语义理解
6. 轮询监听理解进度
7. 提交确认理解结果
8. 批量并行理解多个视图（最多100个）
9. 数据源批量理解（自动获取视图列表并分批理解）
10. 批量业务对象匹配（对象匹配）

# Use when

**查询场景：**
- 用户需要查询某个表单视图的字段语义信息
- 用户需要查询某个表单视图的业务对象识别结果
- 用户需要获取字段的业务名称、字段角色、描述等语义信息
- 用户需要了解哪些字段已完成语义补全、哪些未完成

**理解场景：**
- 用户需要对某个表单视图进行全新的语义理解
- 用户需要重新理解已完成的表单视图
- 用户需要了解理解流程的当前状态
- 表单视图处于未理解/待确认/已完成状态，需要触发理解

**对象匹配场景：**
- 用户需要根据业务对象名称匹配对应的视图
- 用户需要批量查询多个业务对象对应的视图ID
- 用户需要获取需要语义理解的视图列表

**批量理解场景：**
- 用户需要批量对多个表单视图进行语义理解
- 用户需要一次性理解多个相关视图
- 用户需要批量重新理解已完成的表单视图

**数据源理解场景（新增）：**
- 用户需要理解某个数据源下的所有视图
- 用户提供了数据源 ID（完整 UUID 格式），需要自动获取视图列表并分批理解
- 当用户说"理解数据源 xxx（名字）下所有视图"时：
  - 从对话上下文中查找该数据源的 UUID（之前对话中可能已提供或提到过）
  - 如果上下文中没有该 UUID，提示用户：`❌ 未找到数据源"<keyword>"的 UUID。请提供完整的数据源 UUID。`
  - 使用 datasource_id 查询视图数据
  - 如果 total_count = 0，提示用户：`❌ 数据源不存在或该数据源下暂无视图数据`
  - 只有搜索结果 exactly 1 个 datasource_id 时才能继续

# Never use when

- 仅需要管理语义信息（如保存、修改）- 使用 data_semantic_manage
- 仅需要管理逻辑视图（如创建、编辑、删除）- 使用其他逻辑视图管理工具
- 数据语义服务未部署或不可用
- 没有有效的 JWT Token 认证凭证

# Preconditions

- JWT Token 认证凭证有效
- 数据语义服务可访问（Base URL: 在 config.base_url 中配置，默认 https://dip.aishu.cn/api/data-semantic/v1）
- 逻辑视图服务可访问（Base URL: 在 config.logic_view_base_url 中配置，默认 https://dip.aishu.cn/api/data-view/v1）

# Inputs to collect

- datasource_id: 数据源 ID（可选）
  - 当填写时：自动先调用逻辑视图服务获取该数据源下所有视图 → 分批理解
  - 支持同时填写 keyword 进行关键字筛选
  - 与 form_view_id / form_view_ids 互斥，不能同时填写
  - ⚠️ **重要**：查询视图数据时 API 参数名必须是 `datasource_id`，不是 `data_source_id`
  - 与 operation=understand/batch 配合使用
- keyword: 关键字搜索（可选）
  - 用于在列表操作中搜索视图名称
  - 用于在数据源批量理解中筛选符合条件的视图
  - 与 datasource_id 配合使用可实现"数据源下包含某关键词的视图"
- form_view_id: 表单视图 ID (UUID)（单个视图操作必填，但与 datasource_id 互斥）
- form_view_ids: 表单视图 ID 列表（批量操作必填，最多100个，与 datasource_id 互斥）
- auth_token: JWT Token
- operation: 操作类型（必选）
  - list: 查询逻辑视图列表（支持关键字搜索、数据源筛选）
  - query: 查询语义理解结果
  - understand: 触发的语义理解流程（单个视图，或数据源下所有视图）
  - batch: 批量语义理解流程（多个视图）
  - match: 批量业务对象匹配（对象匹配）
- kn_id: 通用业务知识网络（GKN）ID（仅match操作必填）
- ot_id: 通用业务知识网络（GKN）中业务对象类的ID（仅match操作必填）
- entries: 业务对象列表（仅match操作必填）
  - name: 业务对象名称
  - data_source: 给定的视图数据（可选）
    - id: 视图ID
    - name: 视图名称
- fields: 字段选择列表（仅理解操作可选，不传则全部理解）
- max_concurrent: 最大并行数（仅batch/datasource理解操作可选，默认10）

# Execution steps

## 查询操作 (operation=query)

1. 验证输入参数（form_view_id 必填）
2. 获取 JWT Token
3. 调用查询状态 API: `GET /:id/status`
4. 如果状态为已完成(3)或待确认(2)：
   - 调用字段语义 API: `GET /:id/fields`
   - 调用业务对象 API: `GET /:id/business-objects`
5. 如果状态为未理解(0)或理解中(1)：提示用户先触发理解
6. 处理编码问题（API 返回可能为 GBK，需用 latin1 解码）
7. 映射字段角色码为中文名称
8. 按格式整合输出综合报告

## 列表操作 (operation=list)

1. 验证输入参数
2. 获取 JWT Token
3. 调用逻辑视图服务: `GET /form-view`
4. 支持参数:
   - keyword: 关键字搜索（可选，按业务名称或技术名称模糊匹配）
   - datasource_id: 数据源 ID 筛选（可选）
   - limit: 每页大小，默认 100（可选）
   - offset: 页码，默认 1（可选）
5. 处理编码问题（API 返回可能为 GBK，需用 latin1 解码）
6. 按格式输出视图列表
7. 提示用户可使用视图 ID 进行后续语义查询或理解操作

## 理解操作 (operation=understand)

1. 验证输入参数
   - form_view_id 必填（单视图理解）
   - 或 datasource_id + keyword（数据源批量理解，支持关键字筛选）
   - 与 form_view_ids 互斥
2. **数据源名称转 ID 逻辑**：
   - 如果用户提到的是数据源 **名字**（如"供应链数据"、"dsp_xxx"），而不是完整的 UUID：
     - 从**对话上下文**中查找之前是否已有该数据源的 UUID（可能是用户之前提供过，或在 list 操作中提到过）
     - 如果上下文中没有该数据源的 UUID，则**终止流程**并提示用户：
       - `❌ 未找到数据源"<keyword>"的 UUID。请提供完整的数据源 UUID（如 f311a5f3-7b14-4eb6-95b8-a661341f48b8）。`
     - 如果上下文中找到了对应的 datasource_id，继续使用该 ID
   - 如果用户直接提供了完整的数据源 UUID（36位 UUID格式），则直接使用
3. 如果填写了 datasource_id（支持同时填写 keyword）：
   - **查询视图总数**：调用 `GET /form-view?datasource_id=<datasource_id>&keyword=<keyword>&limit=1&offset=1` 获取 total_count
   - **数量确认**：
     - 如果 total_count = 0：**提示用户** `❌ 数据源不存在或该数据源下暂无视图数据`，终止流程
     - 如果 total_count ≤ 50：直接获取视图列表
     - 如果 total_count > 50：询问用户确认
       - 提示：`当前数据源下共有 <total_count> 个视图，超过单批处理上限(50个)，是否确定要全部理解？`
       - 用户确认后继续，用户取消则终止流程
   - 获取视图列表：循环分页（每页 50 条）
   - 收集所有视图 ID 和名称
   - 转为批量理解流程（每 50 个视图一批）
3. 如果填写了 form_view_id（单视图理解）：
   - 获取 JWT Token
   - 调用查询状态 API: `GET /:id/status`
   - 根据状态码执行对应逻辑：

**状态 0 (未理解)**
- 调用生成 API: `POST /:id/generate`
- 状态变为 1，进入轮询监听

**状态 1 (理解中)**
- 每 10 秒轮询调用 `GET /:id/status`
- 等待 understand_status = 2
- 退出轮询后调用提交确认: `POST /:id/submit`

**状态 2 (待确认)**
- 调用提交确认: `POST /:id/submit`
- 调用重新生成: `POST /:id/generate`
- 进入轮询监听（同状态 1）

**状态 3/4 (已完成/待确认)**
- 调用重新生成: `POST /:id/generate`
- 进入轮询监听（同状态 1）

**状态 5 (理解失败)**
- 输出失败原因，提示用户检查数据后重试

5. 轮询结束后：
   - 调用字段语义查询: `GET /:id/fields`
   - 调用业务对象查询: `GET /:id/business-objects`
6. 处理编码问题
7. 映射字段角色码为中文名称
8. 按格式整合输出综合报告

## 批量理解操作 (operation=batch)

1. 验证输入参数
   - form_view_ids 必填，数量在 1-100 之间
   - 去重处理，避免重复提交
2. 获取 JWT Token
3. 并行查询所有视图当前状态: `GET /:id/status`
4. 根据各视图状态分别处理：
   - 状态 0 (未理解): 触发生成
   - 状态 1 (理解中): 加入轮询队列
   - 状态 2 (待确认): 提交确认后重新生成
   - 状态 3/4 (已完成): 重新生成
   - 状态 5 (理解失败): 记录失败
5. 并行轮询监听（每 10 秒）:
   - 批量查询状态: `GET /:id/status`
   - 等待所有任务完成（状态变为 2 或 3）
6. 对所有状态为 2 的视图提交确认
7. 再次轮询直到所有任务完成
8. 整合输出批量结果报告

## 数据源批量理解操作 (datasource_id + operation=understand)

当用户填写 `datasource_id` 而非具体视图 ID 时触发此流程：

1. **验证输入参数**
   - datasource_id 必填（支持同时填写 keyword 进行关键字筛选）
   - operation 必填为 understand（或其他理解操作）
   - 与 form_view_id / form_view_ids 互斥
2. **数据源名称转 ID 逻辑**：
   - 如果用户提到的是数据源 **名字**（如"供应链数据"、"dsp_xxx"），而不是完整的 UUID：
     - 从**对话上下文**中查找之前是否已有该数据源的 UUID（可能是用户之前提供过，或在 list 操作中提到过）
     - 如果上下文中没有该数据源的 UUID，则**终止流程**并提示用户：
       - `❌ 未找到数据源"<keyword>"的 UUID。请提供完整的数据源 UUID（如 f311a5f3-7b14-4eb6-95b8-a661341f48b8）。`
     - 如果上下文中找到了对应的 datasource_id，继续使用该 ID
   - 如果用户直接提供了完整的数据源 UUID（36位 UUID格式），则直接使用
3. **查询视图总数**
   - 调用逻辑视图服务: `GET /form-view?datasource_id=<datasource_id>&keyword=<keyword>&limit=1&offset=1`
   - 获取 total_count
4. **数量确认**
   - 如果 total_count = 0：**提示用户** `❌ 数据源不存在或该数据源下暂无视图数据`，终止流程
   - 如果 total_count ≤ 50：直接进入步骤 4 获取视图列表
   - 如果 total_count > 50：询问用户确认
     - 提示：`当前数据源下共有 <total_count> 个视图，超过单批处理上限(50个)，是否确定要全部理解？`
     - 用户确认后继续，用户取消则终止流程
4. **获取视图列表**
   - 调用逻辑视图服务: `GET /form-view?datasource_id=<datasource_id>&keyword=<keyword>&limit=50&offset=1`
   - 循环分页获取所有视图（每页 50 条，持续拉取直到 total_count 返回为 0 或空）
   - 收集所有视图 ID 和名称
5. **分批处理**
   - 每 50 个视图分为一批
   - 对每批执行批量理解流程（同 operation=batch）
6. **轮询与确认**
   - 每批内部并行轮询（每 10 秒）
   - 每批完成后提交确认
7. **跨批处理**
   - 第一批完成后开始第二批（串行）
   - 记录每批的执行结果
8. **汇总报告**
   - 整合所有批次的执行结果
   - 输出总统计：总视图数、成功数、失败数、耗时
   - 输出每批的详细结果

## 对象匹配操作 (operation=match)

1. 验证输入参数（entries 必填，最多100条）
2. **检查 kn_id 和 ot_id 配置**：
   - 优先从 `TOOLS.md` 中读取配置项 `data_semantic_kn_id` 和 `data_semantic_ot_id`
   - 如果 TOOLS.md 中未配置或为空，则从技能文件 metadata.config 中读取默认值
   - 如果两者都未配置，提示："批量对象匹配功能需要配置 GKN 知识网络 ID (kn_id) 和业务对象类 ID (ot_id)，请联系技术工程师进行配置"
   - 只有配置了这两个参数才能继续执行
3. 获取 JWT Token
4. 调用批量匹配 API: `POST /batch-object-match`，传递 kn_id 和 ot_id 参数
5. 处理响应数据，直接输出匹配结果

# Required API contract

## queryFormViewList

- purpose: 获取逻辑视图列表（支持关键字搜索、数据源筛选）
- required params:
  - auth_token: JWT Token
- optional params:
  - keyword: 关键字搜索（可选，按业务名称或技术名称模糊匹配）
  - datasource_id: 数据源 ID 筛选（可选）
  - limit: 每页大小，默认 100（可选）
  - offset: 页码，默认 1（可选）
- endpoint: `GET /form-view` (逻辑视图服务 API)
- result fields:
  - entries[]
    - id: 逻辑视图 UUID（用于数据语义查询的视图 ID）
    - business_name: 表业务名称
    - technical_name: 表技术名称
    - subject_domain_id: 所属逻辑实体的 ID
    - subject_id_path: 逻辑实体的 ID 路径
    - subject_path: 逻辑实体的名称路径
  - total_count: 总数

## queryStatus

- purpose: 查询表单视图当前理解状态
- required params:
  - form_view_id: 表单视图 ID
  - auth_token: JWT Token
- endpoint: `GET /:id/status`
- result fields:
  - understand_status: 状态码
    - 0: 未理解
    - 1: 理解中
    - 2: 待确认
    - 3: 已完成
    - 4: 待确认(已重新理解)
    - 5: 理解失败

## triggerUnderstanding

- purpose: 触发表单视图语义理解
- required params:
  - form_view_id: 表单视图 ID
  - auth_token: JWT Token
- optional params:
  - fields: 字段选择列表，不传则全部理解
- endpoint: `POST /:id/generate`
- result fields:
  - understand_status: 返回理解状态（通常为 1）

## submitUnderstanding

- purpose: 提交确认理解结果
- required params:
  - form_view_id: 表单视图 ID
  - auth_token: JWT Token
- endpoint: `POST /:id/submit`
- result fields:
  - success: 确认是否成功

## queryFieldSemantics

- purpose: 查询字段语义补全数据
- required params:
  - form_view_id: 表单视图 ID
  - auth_token: JWT Token
- endpoint: `GET /:id/fields`
- data source: t_form_view_field_info 表
- result fields:
  - form_view_id
  - fields[]
    - field_id
    - tech_name: 技术名称
    - biz_name: 业务名称
    - field_role: 字段角色（需映射为中文）
    - field_desc: 字段描述
    - completion_status: 补全状态

## queryBusinessObjects

- purpose: 查询业务对象识别结果
- required params:
  - form_view_id: 表单视图 ID
  - auth_token: JWT Token
- endpoint: `GET /:id/business-objects`
- data source: t_business_object 和 t_business_object_attributes 表
- result fields:
  - form_view_id
  - business_objects[]
    - object_id
    - object_name: 业务对象名称
    - attributes[]
      - attr_id
      - attr_name: 属性名称
      - tech_name: 字段技术名称
      - biz_name: 字段业务名称
      - field_role: 字段角色（需映射为中文）
      - field_desc: 字段描述

## batchObjectMatch

- purpose: 批量业务对象匹配（对象匹配）
- required params:
  - entries: 业务对象列表（必填，最多100条）
  - entries[].name: 业务对象名称（非空字符串）
  - entries[].data_source: 给定的视图数据（可选）
    - entries[].data_source.id: 视图ID
    - entries[].data_source.name: 视图名称
  - kn_id: 通用业务知识网络（GKN）ID（必填）
  - ot_id: 通用业务知识网络（GKN）中业务对象类的ID（必填）
- endpoint: `POST /batch-object-match`
- result fields:
  - entries: 匹配结果列表
    - entries[].name: 原始输入名称
    - entries[].data_source: 匹配的视图列表
      - entries[].data_source[].id: 视图ID
      - entries[].data_source[].name: 视图名称
      - entries[].data_source[].object_name: 业务对象名称

## queryFormViewsByDatasource (内部辅助接口)

- purpose: 根据数据源ID或关键字获取视图列表（供数据源批量理解使用）
- required params:
  - auth_token: JWT Token
- optional params:
  - **datasource_id**: 数据源 ID（数据源批量理解时必填，⚠️ API 参数名是 datasource_id，不是 data_source_id）
  - keyword: 关键字搜索
  - limit: 每页大小（默认100）
  - offset: 页码（默认1）
- endpoint: `GET /form-view` (逻辑视图服务 API)
- ⚠️ **重要**：调用 API 时必须使用参数名 `datasource_id`（对应视图的 datasource_id 字段，即数据源 UUID），而不是 `data_source_id`（那是视图的另一个内部字段）
- result fields:
  - entries[]
    - id: 视图 UUID
    - business_name: 业务名称
    - technical_name: 技术名称
    - subject_path: 逻辑实体路径
  - total_count: 总数

**分页获取逻辑**：
1. 第一次调用获取第一页和总数
2. 计算总页数 = ceil(total_count / limit)
3. 循环调用获取所有页，直到 offset > 总页数
4. 合并所有视图 ID 和名称

> ⚠️ 此接口为内部辅助 API，仅供数据源批量理解时自动调用，不作为独立操作暴露给用户

# Status Machine

| 状态码 | 状态名称 | 处理动作 |
|--------|----------|----------|
| 0 | 未理解 | 触发生成 → 进入轮询 |
| 1 | 理解中 | 轮询等待 → 状态=2后提交确认 |
| 2 | 待确认 | 提交确认 → 重新生成 → 进入轮询 |
| 3 | 已完成 | 重新生成 → 进入轮询 |
| 4 | 待确认(已重新理解) | 重新生成 → 进入轮询 |
| 5 | 理解失败 | 输出失败原因，终止 |

```
┌─────────┐ generate ┌─────────┐ status=2 ┌─────────┐
│ 0-未理解│ ──────────────► │ 1-理解中│ ──────────────► │ 2-待确认│
└─────────┘ └─────────┘           └────┬────┘
                                        │
                                        │ submit
                                        ▼
┌─────────┐ generate ┌─────────┐          ┌──────────┐
│ 3-已完成│ ◄──────────── │4-待确认 │          │ 5-失败   │
└─────────┘          └─────────┘          └──────────┘
```

# Field Role Mapping

| 角色码 | 角色名称 |
|--------|----------|
| 1 | 业务主键 |
| 2 | 关联标识 |
| 3 | 业务状态 |
| 4 | 时间字段 |
| 5 | 业务指标 |
| 6 | 业务特征 |
| 7 | 审计字段 |
| 8 | 技术字段 |

# Output format

## 列表操作输出格式

**📋 逻辑视图列表**

| 项目 | 内容 |
|------|------|
| 总数 | `<total_count>` |
| 当前页 | `<offset>/<pages>` (显示前`<limit>`条) |

### 视图明细

| 序号 | 视图ID | 业务名称 | 技术名称 | 逻辑实体路径 |
|------|--------|----------|----------|--------------|
| 1 | xxx-xxx | 用户管理 | user_info_v1 | 数据域/用户域 |
| 2 | xxx-xxx | 订单管理 | order_info_v1 | 数据域/订单域 |
| ... | ... | ... | ... | ... |

> 💡 提示：使用视图ID可调用数据语义相关技能
> - `query`: 查询语义信息
> - `understand`: 触发理解流程

## 无结果输出格式

**📋 逻辑视图列表**

| 项目 | 内容 |
|------|------|
| 总数 | 0 |

未找到符合条件的逻辑视图，请尝试调整搜索条件。

## 查询成功输出格式

**📊 数据语义理解报告**

| 项目 | 内容 |
|------|------|
| 视图技术名称 | `<tech_name>` |
| 视图业务名称 | `<biz_name>` |
| 视图描述信息 | `<description>` |
| 理解状态 | `<status_name>` |

**📈 识别统计**

| 类别 | 统计 |
|------|------|
| 字段语义 | 总字段: `<total>`, 已补全: `<completed>` (`<percentage>%`), 未补全: `<incomplete>` |
| 业务对象 | 业务对象: `<object_count>` 个, 识别属性: `<attr_count>` 个, 未识别: `<unrecognized>` |

> 注意：字段语义和业务对象来自不同的数据表，属性值可能存在差异

## 🏢 业务对象识别结果

### <序号>️⃣ <业务对象名称>

| 属性名称 | 字段技术名称 | 字段业务名称 | 字段角色 | 字段描述 |
|----------|--------------|--------------|----------|----------|
| ... | ... | ... | ... | ... |

## ❌ 未补全属性（无法识别业务语义）

| 技术名称 | 字段类型 | 字段描述 |
|----------|----------|----------|
| ... | ... | ... |

> 说明：这些字段已进行语义分析，但未能识别出具体的业务属性
```

## 理解成功输出格式

**📊 数据语义理解报告**

| 项目 | 内容 |
|------|------|
| 视图技术名称 | `<tech_name>` |
| 视图业务名称 | `<biz_name>` |
| 视图描述信息 | `<description>` |
| 理解时间 | `<timestamp>` |
| 状态 | ✅ 已完成 |

**📈 识别统计**

| 类别 | 统计 |
|------|------|
| 字段语义 | 总字段: `<total>`, 已补全: `<completed>` (`<percentage>%`), 未补全: `<incomplete>` |
| 业务对象 | 业务对象: `<object_count>` 个, 识别属性: `<attr_count>` 个, 未识别: `<unrecognized>` |

> 注意：字段语义和业务对象来自不同的数据表，属性值可能存在差异

## 🏢 业务对象识别结果

### <序号>️⃣ <业务对象名称>

| 属性名称 | 字段技术名称 | 字段业务名称 | 字段角色 | 字段描述 |
|----------|--------------|--------------|----------|----------|
| ... | ... | ... | ... | ... |

## ❌ 未识别属性

| 技术名称 | 字段类型 | 字段角色 | 字段描述 |
|----------|----------|----------|----------|
| ... | ... | ... | ... |

> 说明：这些字段已进行语义分析，但未能识别出具体的业务属性
```

## 状态提示输出格式

**📊 状态提示**

| 项目 | 内容 |
|------|------|
| 视图ID | `<form_view_id>` |
| 视图名称 | `<form_view_name>` |
| 当前状态 | `<status_code>` - `<status_name>` |

**状态说明：**
- 状态0（未理解）：尚未进行语义理解，请使用 operation=understand 触发
- 状态1（理解中）：语义理解进行中，请稍后再查询
- 状态2（待确认）：理解完成待确认，已自动提交确认
- 状态3（已完成）：已确认完成，如需重新理解请使用 operation=understand
```

## 失败输出格式

**❌ 操作失败**

| 项目 | 内容 |
|------|------|
| 视图ID | `<form_view_id>` |
| 操作类型 | `<operation>` |
| 错误原因 | `<error_message>` |
| 建议操作 | `<suggestion>` |

## 对象匹配操作输出格式

**📊 批量业务对象匹配结果**

| 项目 | 内容 |
|------|------|
| 输入业务对象 | `<count>` 个 |

**📈 匹配统计**

| 项目 | 数量 |
|------|------|
| 成功匹配 | `<matched_count>` 个 |
| 需要理解 | `<need_understand_count>` 个 |

### <序号>️⃣ <业务对象名称>

| 视图ID | 视图名称 | 业务对象名称 |
|--------|----------|--------------|
| mdl_xxx | 客户主档视图 | 客户信息 |
| mdl_yyy | 订单视图 | 订单管理 |

### 📋 需要理解的视图

| 序号 | 视图ID | 视图名称 |
|------|--------|----------|
| 1 | view_id_1 | 客户主档视图 |
| 2 | view_id_2 | 订单视图 |

## 批量理解操作输出格式

### 批量操作成功输出格式

**🧠 数据语义批量理解报告**

| 项目 | 内容 |
|------|------|
| 提交时间 | `<timestamp>` |
| 总视图数 | `<total_count>` |
| 成功 | `<success_count>` |
| 失败 | `<fail_count>` |
| 状态 | ✅ 批量任务完成 |

### 📊 执行结果明细

| 序号 | 视图ID | 视图名称 | 初始状态 | 最终状态 | 结果 |
|------|--------|----------|----------|----------|------|
| 1 | xxx | 用户管理 | 0-未理解 | 3-已完成 | ✅ |
| 2 | xxx | 订单管理 | 0-未理解 | 3-已完成 | ✅ |
| 3 | xxx | 库存管理 | 0-未理解 | 5-失败 | ❌ |

### 📈 统计摘要

| 状态 | 数量 |
|------|------|
| 已完成 | 85 |
| 待确认 | 0 |
| 失败 | 5 |
| 待处理 | 0 |

### 批量处理中输出格式

**🧠 数据语义批量理解 - 进度**

| 项目 | 内容 |
|------|------|
| 总任务数 | `<total_count>` |
| 已完成 | `<completed_count>` |
| 进行中 | `<processing_count>` |
| 等待中 | `<waiting_count>` |
| 失败 | `<failed_count>` |
| 进度 | `<percentage>`% |

正在并行执行理解任务，请稍候...

### 输入参数错误输出格式

**❌ 参数错误**

| 项目 | 内容 |
|------|------|
| 错误原因 | 视图ID数量超出限制 |
| 当前数量 | 150 |
| 最大支持 | 100 |

## 数据源批量理解输出格式

### 执行中输出格式

**🧠 数据语义批量理解 - 数据源模式**

| 项目 | 内容 |
|------|------|
| 数据源ID | `<datasource_id>` |
| 总视图数 | `<total_views>` |
| 总批次数 | `<total_batches>` |
| 当前批次 | `<current_batch>/<total_batches>` |
| 进度 | `<percentage>`% |

正在获取视图列表...

### 每批完成输出格式

**📊 批次 `<batch_number>` 完成**

| 项目 | 内容 |
|------|------|
| 批次 | `<batch_number>/<total_batches>` |
| 视图数 | `<batch_size>` |
| 成功 | `<success>` |
| 失败 | `<failed>` |
| 耗时 | `<duration>` |

### 最终汇总输出格式

**🎉 数据源批量理解完成**

| 项目 | 内容 |
|------|------|
| 数据源ID | `<datasource_id>` |
| 总视图数 | `<total_views>` |
| 总批次 | `<total_batches>` |
| 成功 | `<success_count>` |
| 失败 | `<fail_count>` |
| 总耗时 | `<total_duration>` |
| 状态 | ✅ 完成 |

### 📋 批次详情

| 批次 | 视图数 | 成功 | 失败 | 耗时 |
|------|--------|------|------|------|
| 1/10 | 100 | 98 | 2 | 5m 30s |
| 2/10 | 100 | 100 | 0 | 4m 45s |
| ... | ... | ... | ... | ... |

### ❌ 失败详情（如有）

| 批次 | 视图ID | 视图名称 | 错误原因 |
|------|--------|----------|----------|
| 1 | xxx | 用户管理 | 理解超时 |
| 3 | yyy | 库存管理 | 数据质量不足 |

# Guardrails

0. **⚠️ Token 必填**：所有操作都必须提供有效的 JWT Token（auth_token），无 Token 无法调用任何 API
1. **操作类型必填**：必须明确指定 operation（list/query/understand/batch/match）
2. **参数互斥**：datasource_id 与 form_view_id / form_view_ids 互斥，不能同时填写
3. **datasource_id 场景**：当填写 datasource_id 时，operation 只能是 understand（触发数据源下所有视图的理解流程）
4. **轮询间隔**：理解中状态每 10 秒轮询一次，避免过于频繁请求
5. **超时保护**：设置最大轮询次数（如 30 次），防止无限等待
6. **编码处理**：API 返回的中文字符可能存在 GBK 编码问题，解析时必须使用 `latin1` 解码后再处理
7. **字段角色映射**：返回数据前必须将角色码按映射表转换为中文名称
8. **输出完整性**：描述内容必须完整输出，不允许截断
9. **认证安全**：不在日志或输出中明文打印 Token
10. **状态 5 处理**：理解失败时必须输出失败原因并终止流程，不能继续执行
11. **数据差异说明**：需告知用户字段语义和业务对象来自不同数据表

## 批量理解操作注意事项

1. **数量限制**：最多支持 100 个视图 ID，超出则拒绝执行
2. **去重处理**：自动去除重复的视图 ID
3. **并行度控制**：默认并行 10 个任务，可通过 max_concurrent 参数调整
4. **轮询间隔**：理解中状态每 10 秒轮询一次
5. **超时保护**：单个任务最大轮询次数 30 次（约5分钟）
6. **失败处理**：单个视图失败不影响其他视图继续执行

## 数据源批量理解注意事项（datasource_id）

1. **参数互斥**：datasource_id 与 form_view_id / form_view_ids 互斥，不能同时填写
2. **数据源名称转 ID 逻辑**：
   - 如果用户说的是数据源名字（如"供应链数据"），从**对话上下文**中查找该数据源的 UUID
   - 如果上下文中没有该数据源的 UUID，**终止流程**并提示用户：`❌ 未找到数据源"<keyword>"的 UUID。请提供完整的数据源 UUID。`
   - 如果上下文中找到了对应的 datasource_id，继续使用该 ID
3. **API 参数名**：调用逻辑视图服务 `/form-view` 时，**必须使用 `datasource_id` 参数名**（对应视图的 datasource_id 字段，即数据源 UUID），**不能使用 `data_source_id`**（那是视图的另一个内部字段）
4. **查询视图数据**：使用 `datasource_id` 参数查询视图列表
   - 如果 total_count = 0：**提示用户** `❌ 数据源不存在或该数据源下暂无视图数据`，终止流程
   - 如果 total_count > 0：继续执行批量理解流程

## 大批量处理保护机制

针对数据源下视图数量不可预测的场景（如 10000+ 表），增加以下保护：

1. **数量确认**：先查询总数，超过 50 个时询问用户确认后才继续
2. **预估时间告知**：在开始前告知用户预计总耗时
   - 示例：`当前共 10000 个视图，预计需要 16 小时，是否继续？`
3. **超时保护**：
   - 单次任务最大处理 500 个视图（10 批），超出时提示用户分批执行
   - 单批超时（5 分钟）自动跳过并记录失败，继续处理下一批
4. **速率控制**：
   - 每批之间添加 2 秒间隔，避免 API 限流
   - 连续失败 3 次则暂停并提示用户
5. **进度保存**：
   - 每批完成后输出进度百分比
   - 中断后可从当前批次恢复（记录最后完成的批次）
6. **资源提醒**：
   - 超过 1000 个视图时提醒用户考虑非工作时间执行
   - 超过 5000 个视图时建议联系技术团队评估方案

## 对象匹配操作注意事项

1. **kn_id 和 ot_id 必填**：批量对象匹配功能必须配置 kn_id（通用业务知识网络ID）和 ot_id（业务对象类ID），未配置时提示联系技术工程师
2. **配置位置**：
   - **优先**：在 `TOOLS.md` 中配置以下两项：
     - `data_semantic_kn_id`: GKN 知识网络 ID
     - `data_semantic_ot_id`: GKN 业务对象类 ID
   - **默认值**：技能文件 metadata.config 中预置了默认 ID，如果 TOOLS.md 未配置则使用默认值
3. **输入限制**：entries 数组最多100条，超过返回错误
4. **空值过滤**：自动过滤空name的条目
5. **匹配优先级**：data_source.id > 业务对象表 > 视图表
6. **模糊匹配**：业务对象表和视图表均使用模糊匹配（LIKE '%name%'）
7. **⚠️ 中文查询编码问题**：调用 batch-object-match API 时，如果请求体包含中文字符，必须使用管道方式传递数据（`echo '<json_body>' | curl -d @-`），否则中文会变成乱码！
    - ❌ 错误方式：`curl -d '{"entries":[{"name":"订单"}]}'` （中文会变成乱码）
    - ✅ 正确方式：`echo '{"entries":[{"name":"订单"}]}' | curl -d @-`

# Data Source Notes

- **字段语义 (/fields)**：来自 `t_form_view_field_info` 表，记录字段的基础语义信息（业务名称、字段角色、描述）
- **业务对象 (/business-objects)**：来自 `t_business_object` 和 `t_business_object_attributes` 表，记录字段被识别为何种业务属性
- **数据差异**：同一字段在两个表中的属性值可能不同（因为来自不同版本的表数据），因此"总字段数"和"识别属性数"不是直接对应关系

