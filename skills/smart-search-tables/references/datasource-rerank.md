# 子能力：Datasource Rerank（数据资源重排序）

用于找数场景的**可选子工具**：当你已获得一组“粗召回”的候选数据资源/视图/表（datasource candidates），通过本工具对候选进行筛选与重排序，选择最符合用户问题的候选。

## 与本流程的衔接（可选）

- **触发条件**：第 1 步 `query_object_instance` / 或其它检索阶段返回了候选列表，但需要进一步排序/裁剪以便进入后续问数。
- **调用时机**：作为“找表候选整理阶段”的可选步骤（不加入本 skill `pipeline`）。

## 输入参数

- 工具请求体建议使用如下调试网关包裹结构（与调用方约定一致）：

```json
{
  "auth": { "token": "" },
  "config": {},
  "custom_rule_strategy_cache_key": "",
  "data_source_list": [
    { "id": "", "type": "" }
  ],
  "department_duty_cache_key": "",
  "llm": {},
  "query": "用户问题",
  "use_department_duty": false,
  "use_priority_strategy": false
}
```

字段要点：
- `query`：用户输入问题
- `data_source_list`：粗召回的候选数据资源列表（每项至少包含 `id` 与 `type`）
- `use_department_duty` / `use_priority_strategy`：是否启用基于职责/优先策略的重排逻辑（按你环境的网关约定为准）
- `custom_rule_strategy_cache_key` / `department_duty_cache_key`：可选的上游缓存键（通常来自其它子工具/步骤）

## 输出说明

- 返回“重排序后的候选资源列表”（通常包含更匹配的优先级/评分字段，以子工具权威说明为准）。

## 请求 URL 约定

- 完整网关 URL 约定为：`base_url` + `tools.datasource_rerank.url_path`（`base_url` / `tools.*` 见 `smart-search-tables/config.json`）。

