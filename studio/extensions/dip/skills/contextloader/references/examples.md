# Context Loader 调用示例

本文件提供几个常见的端到端调用链示例，帮助你判断在真实任务中应该先调哪个接口、再调哪个接口。

## 示例 0：用户没有提供 `kn_id`，先从 `SOUL.md` 读取

用户问题：

> 帮我查一下这个 agent 绑定的知识网络里 company 对象类的实例。

推荐调用链：

1. 先读取当前工作区的 `SOUL.md`
2. 找到 `## 业务知识网络` 表格
3. 从 `地址` 列提取 `kn_id`
4. 如果只有一个候选 BKN，直接使用
5. 如果有多个候选 BKN，先根据用户意图匹配，否则向用户确认
6. 再调 `query_object_instance`

假设 `SOUL.md` 中存在：

```md
## 业务知识网络

| 名称 | 地址 |
|------|------|
| 企业风控网络 | http://example.local/knowledge-networks/kn_risk |
```
```

这时应提取：

- `kn_id = kn_risk`

如果地址是：

```text
http://example.local/api?kn_id=kn_medical
```

这时应提取：

- `kn_id = kn_medical`

如果地址是：

```text
kn_demo
```

这时可以直接使用：

- `kn_id = kn_demo`

如果 `SOUL.md` 没有业务知识网络表格，或地址无法稳定解析出 `kn_id`：

- 不要猜测
- 直接向用户追问应该使用哪个知识网络

## 示例 1：用户只描述了业务问题，不知道该查哪个对象类

用户问题：

> 帮我看看“某疾病治疗方案”相关的知识网络概念和可执行动作。

推荐调用链：

1. 先调 `kn_schema_search`
2. 从结果中识别相关对象类与行动类
3. 再调 `query_object_instance`
4. 最后调 `get_action_info`

### 第一步：概念识别

- 接口：`kn_schema_search`
- 目的：找出相关 `ot_id`、`at_id`

请求：

```http
POST /api/agent-retrieval/in/v1/kn/semantic-search?response_format=json
x-account-id: <APP_USER_ID>
x-account-type: app
Content-Type: application/json
```

请求体示意：

```json
{
  "query": "疾病治疗方案相关概念",
  "top_k": 5
}
```

处理方式：

- 从返回中找到相关对象类，例如“疾病”
- 记录对象类 ID 作为 `ot_id`
- 从返回中找到相关行动类，例如“生成治疗方案”
- 记录行动类 ID 作为 `at_id`

### 第二步：查询对象实例

- 接口：`query_object_instance`
- 目的：找到真实对象实例，并提取 `_instance_identity`

请求：

```http
POST /api/agent-retrieval/in/v1/kn/query_object_instance?kn_id=<kn_id>&ot_id=<ot_id>&response_format=json
x-account-id: <APP_USER_ID>
x-account-type: app
Content-Type: application/json
```

请求体示意：

```json
{
  "sort": [{ "field": "@timestamp", "direction": "desc" }],
  "limit": 5,
  "need_total": false
}
```

处理方式：

- 从 `datas` 中列出候选实例
- 从候选实例中提取 `_instance_identity`
- 如果存在多个候选实例，不要擅自选择，先让用户确认

### 第三步：召回动态动作

- 接口：`get_action_info`
- 目的：基于真实对象实例召回 `_dynamic_tools`

请求体示意：

```json
{
  "kn_id": "kn_medical",
  "at_id": "generate_treatment_plan",
  "_instance_identity": {
    "disease_id": "disease_000001"
  }
}
```

输出建议：

- 先说明识别到了哪个对象类、哪个行动类
- 再说明选中了哪个对象实例
- 最后返回 `_dynamic_tools` 的摘要

## 示例 2：用户已经知道对象类，想查具体实例

用户问题：

> 帮我查一下 company 这个对象类最近的实例。

推荐调用链：

1. 直接调 `query_object_instance`
2. 如果用户后续要关系上下文，再调 `query_instance_subgraph`
3. 如果用户后续要逻辑属性，再调 `get_logic_properties_values`

### 第一步：查询对象实例

前提：

- 用户已经给出 `ot_id=company`
- 已知 `kn_id`

请求体示意：

```json
{
  "sort": [{ "field": "@timestamp", "direction": "desc" }],
  "limit": 10,
  "need_total": false
}
```

如果用户还要求筛选：

```json
{
  "condition": {
    "field": "company_name",
    "operation": "like",
    "value_from": "const",
    "value": "OpenAI"
  },
  "sort": [{ "field": "@timestamp", "direction": "desc" }],
  "limit": 10,
  "need_total": false
}
```

注意事项：

- 只有在确认字段名和操作符合法时，才发送 `condition`
- `value_from` 与 `value` 必须同时出现

## 示例 3：用户想围绕对象实例展开上下文关系

用户问题：

> 帮我把这个公司实例的上下游关系展开看看。

推荐调用链：

1. 先确认这个公司实例来自真实查询结果
2. 调 `query_instance_subgraph`
3. 根据返回结果总结相关节点与关系

前提：

- 已有真实 `_instance_identity`
- 已知 `kn_id`

处理原则：

- 如果只是围绕一个实例做关系扩展，优先最小化请求范围
- 如果使用路径查询，必须严格保证 `object_types` 与 `relation_types` 的顺序一致

输出建议：

- 先列出核心关联对象
- 再按关系说明上下游链路
- 如果返回对象过多，先摘要而不是全量倾倒

## 示例 4：用户想计算某些对象的逻辑属性

用户问题：

> 帮我计算这些公司的风险评分和综合评级。

推荐调用链：

1. 先通过 `query_object_instance` 拿到真实实例
2. 再调 `get_logic_properties_values`

请求体关键结构示意：

```json
{
  "kn_id": "kn_demo",
  "ot_id": "company",
  "instance_identity_list": [
    { "company_id": "company_000001" },
    { "company_id": "company_000002" }
  ],
  "properties": ["risk_score", "rating"]
}
```

注意事项：

- `instance_identity_list` 必须来自上游真实返回
- 保持实例顺序不变，避免结果与对象错位

## 示例 5：用户想确认知识网络是否在构建中

用户问题：

> 这个知识网络是不是还在构建？

推荐调用链：

1. 直接调 `get_kn_index_build_status`

请求：

```http
GET /api/agent-retrieval/in/v1/kn/full_ontology_building_status?kn_id=<kn_id>
```

输出建议：

- 返回 `state`
- 返回 `state_detail`
- 如果是 `running`，说明仍有任务执行中
- 如果是 `completed`，说明最近任务已完成

## 示例 6：用户明确要求重建知识网络

用户问题：

> 帮我为这个知识网络发起一次全量重建。

推荐调用链：

1. 调 `create_kn_index_build_job`
2. 如有需要，再调 `get_kn_index_build_status`

创建任务请求体示意：

```json
{
  "kn_id": "kn_1234567890",
  "name": "全量构建任务"
}
```

输出建议：

- 返回任务 ID
- 告知用户可继续查询构建状态

## 通用决策口诀

- 不知道概念，先查 `kn_schema_search`
- 需求模糊，先试 `kn_search`
- 已知对象类，查 `query_object_instance`
- 已有实例，扩展 `query_instance_subgraph`
- 要算指标，调 `get_logic_properties_values`
- 要动作工具，调 `get_action_info`
- 要构建状态，调 `get_kn_index_build_status`
- 要发起重建，调 `create_kn_index_build_job`
