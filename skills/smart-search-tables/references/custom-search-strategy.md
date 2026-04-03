# 子能力：Custom Search Strategy（自定义搜索策略）

用于找数场景的**可选子工具**：当智能判断用户意图属于查询数据/取数统计/找数分析时，调用本工具把用户问题转成平台的“自定义搜索策略”（例如主推表策略），用于后续候选数据资源的收敛与排序。

## 与本流程的衔接（可选）

- **触发条件**：第 1 步 `query_object_instance` 已有一定候选线索，但需要进一步根据用户意图收敛（或补充）候选资源。
- **调用时机**：可放在“找表候选 + 后续问数前”的准备阶段（不加入本 skill `pipeline`）。

## 输入参数（调试网关包裹形式）

工具的请求体建议使用如下结构（与调用方网关约定一致）：

```json
{
  "auth": {
    "token": "xxxx"
  },
  "config": {
    "background": "",
    "base_url": "",
    "session_type": "redis"
  },
  "llm": {},
  "query": "用户问题",
  "rule_base_name": "自定义规则库"
}
```

说明：
- `query`：用户的找数问题原文
- `rule_base_name`：自定义规则库名（通常固定为“自定义搜索策略-主推表策略”）
- `auth.token`：token 来自运行时（优先 `kweaver-core` / CLI 自动刷新得到），不要向用户索要密码

## 输出说明

- 返回“自定义搜索策略结果”（供后续 `datasource_rerank` 或内部候选整理使用）。
- `rule_base_name` 约定通常为固定值“自定义搜索策略-主推表策略”（以子工具权威说明为准）。

## 请求 URL 约定

- 完整网关 URL 约定为：`base_url` + `tools.custom_search_strategy.url_path`（`base_url` / `tools.*` 见 `smart-search-tables/config.json`）。
