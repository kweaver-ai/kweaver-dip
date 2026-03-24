# Context Loader API 调用指南

本文件说明如何调用技能内置的 Context Loader API。

基础地址：

- 从环境变量 `CONTEXT_LOADER_BASE_URL` 读取（完整根 URL，无末尾斜杠，例如 `http://agent-retrieval:30779`）
- 各接口的完整 URL 为 `<CONTEXT_LOADER_BASE_URL>` + 下文给出的路径与查询参数
- 若该变量未设置或为空，不要发起调用，先提示用户配置环境变量

鉴权来源：

- 从环境变量 `APP_USER_ID` 读取账号 ID

默认请求头：

- `x-account-id: <APP_USER_ID>`
- `x-account-type: app`

默认查询约定：

- 优先使用 `response_format=json`

不要传递 `Authorization` 请求头。

如果环境变量 `CONTEXT_LOADER_BASE_URL` 或 `APP_USER_ID` 缺失（或未设置、为空）：

- 不要发起 API 调用
- 先提示用户补充运行环境配置

## 调用前先解析 `kn_id`

如果用户没有直接给出 `kn_id`，先不要立刻调用接口，先读取当前 agent 工作区中的 `SOUL.md`。

本项目中，`SOUL.md` 的业务知识网络配置约定为：

```md
## 业务知识网络

| 名称 | 地址 |
|------|------|
| 医疗知识网络 | http://.../knowledge-networks/kn_medical |
| 风控知识网络 | http://.../bkns/kn_risk |
```

推荐解析顺序：

1. 找到 `## 业务知识网络` 段落
2. 读取 Markdown 表格中的 `名称` 和 `地址`
3. 从 `地址` 中提取 `kn_id`

提取规则：

- 优先读取查询参数中的 `kn_id`
- 其次读取路径 `/knowledge-networks/<kn_id>` 中的 `<kn_id>`
- 再次读取路径 `/bkns/<kn_id>` 中的 `<kn_id>`
- 如果地址本身就是 `kn_xxx` 形式的值，则直接使用

如果有多个候选 BKN：

- 先根据用户问题与“名称”做语义匹配
- 如果仍无法唯一确定，先向用户确认，不要猜测

如果无法从 `SOUL.md` 提取 `kn_id`：

- 暂停调用
- 明确向用户追问 `kn_id`

## 1. `kn_schema_search`

当你需要在查询实例前先识别概念时，使用这个接口。

请求：

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/semantic-search?response_format=json`
- 参考：`references/openapi/kn_schema_search.yaml`

可用于提取：

- 相关的 `kn_id`
- 相关对象类 ID
- 相关行动类 ID
- 后续调用所需的 Schema 细节

## 2. `kn_search`

当用户需求比较模糊，希望先做大范围检索，同时拿到概念候选和实例候选时，使用这个接口。

请求：

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/kn_search?response_format=json`
- 参考：`references/openapi/kn_search.yaml`

这个接口的主要用途是帮助你判断下一步是否应该进入 `query_object_instance`。

## 3. `query_object_instance`

当 `kn_id` 与 `ot_id` 已知时，使用这个接口查询对象实例。

请求：

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/query_object_instance?kn_id=<kn_id>&ot_id=<ot_id>&response_format=json`
- 参考：`references/openapi/query_object_instance.yaml`

最小请求体：

```json
{
  "sort": [{ "field": "@timestamp", "direction": "desc" }],
  "limit": 10,
  "need_total": false
}
```

注意事项：

- 只有在确认字段名和操作符合法时，才添加 `condition`
- 从返回对象中提取 `_instance_identity`，供后续接口继续使用

## 4. `query_instance_subgraph`

当你需要围绕某个真实对象实例扩展图谱上下文时，使用这个接口。

请求：

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/query_instance_subgraph?kn_id=<kn_id>&response_format=json`
- 参考：`references/openapi/query_instance_subgraph.yaml`

注意事项：

- 必须使用来自上游真实结果的种子实例
- 如果使用关系路径查询，`object_types` 与 `relation_types` 的顺序必须严格对齐

## 5. `get_logic_properties_values`

当用户需要逻辑属性、指标值或计算值时，使用这个接口。

请求：

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/logic-property-resolver?response_format=json`
- 参考：`references/openapi/get_logic_properties_values.yaml`

请求体关键字段：

- `kn_id`
- `ot_id`
- 实例标识数组
- `properties`

注意事项：

- 实例标识数组必须来自上游查询结果
- 发送实例标识时保持原有顺序

## 6. `get_action_info`

当你已经拿到真实对象实例，并希望召回可执行的动态动作时，使用这个接口。

请求：

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/get_action_info?response_format=json`
- 参考：`references/openapi/get_action_info.yaml`

请求体必填字段：

- `kn_id`
- `at_id`
- `_instance_identity`

示例请求体：

```json
{
  "kn_id": "kn_medical",
  "at_id": "generate_treatment_plan",
  "_instance_identity": {
    "disease_id": "disease_000001"
  }
}
```

注意事项：

- `_instance_identity` 必须直接复制自真实查询结果
- 在实例未确认前，不要调用这个接口

## 7. 知识网络构建任务接口

### 创建构建任务

- 方法：`POST`
- 路径：`/api/agent-retrieval/in/v1/kn/full_build_ontology`
- 参考：`references/openapi/ontology_job.yaml`

示例请求体：

```json
{
  "kn_id": "kn_1234567890",
  "name": "全量构建任务"
}
```

### 查询构建状态

- 方法：`GET`
- 路径：`/api/agent-retrieval/in/v1/kn/full_ontology_building_status?kn_id=<kn_id>`
- 参考：`references/openapi/ontology_job.yaml`

## 信息不足时的检查清单

如果请求信息不完整，先追问最小必要信息：

- 应该使用哪个 `kn_id`；如果用户未提供，是否已经先从 `SOUL.md` 解析过
- 是否需要先做概念识别
- 当前目标是概念检索、实例查询、子图扩展、逻辑属性解析，还是动作召回
- 需要使用哪些过滤条件

## 黄金规则

- 用户未提供 `kn_id` 时，优先从 `SOUL.md` 读取
- 服务根地址固定从环境变量 `CONTEXT_LOADER_BASE_URL` 读取
- `x-account-id` 固定从环境变量 `APP_USER_ID` 读取
- `x-account-type` 固定使用 `app`
- 不传递 `Authorization` 请求头
- 先识别概念，再查询实例
- 先确认实例，再召回动作
- 输出保持结构化且简洁
- 只要不确定，就读取对应的 `references/openapi/*.yaml`
