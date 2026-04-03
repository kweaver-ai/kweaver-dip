# 问数编排：端到端示例（逻辑顺序）

以下为 **流程骨架**；**逐步可复制 JSON / Header 完整样例** 见各子文档中的 **「样例」** 小节：[kn-select.md](kn-select.md)、[text2sql.md](text2sql.md)、[execute-code-sync.md](execute-code-sync.md)、[json2plot.md](json2plot.md)。

真实工具网关 URL、`token`、`kn_ids`、`user_id` 以 [smart-ask-data/config.json](../config.json) 及环境为准；完整网关 URL 约定为 `base_url` + `tools.<tool>.url_path`。

## 1. kn_select — 选定 KN

- 从配置读取候选 `kn_ids`（**不得**包含 `tools.kn_select.forbidden_ask_data_kn_ids`；自定义候选须先剔除元数据 KN），将用户问数问题作为 `query`，调用接口。
- 得到 `kn_id = <selected>`；若 `<selected>` 落在禁止列表中，**不得**进入第 2 步。

## 2. text2sql `show_ds` — 候选表与结构

- `kn_id`: `<selected>`
- `action`: `show_ds`
- `input`: 例如「销售订单按区域与月份的统计用哪些表和字段」

将返回中的表/字段摘要整理为一段 **background** 文本或结构化要点。

## 3. text2sql `gen_exec` — SQL 与数据

- `kn_id`: `<selected>`
- `action`: `gen_exec`
- `input`: 用户完整中文问题（可与上步对齐细化）
- `background`: 第 2 步摘要

保存：结果表、以及下游绘图用的 **`tool_result_cache_key`**（若响应中包含）。

## 4. execute_code_sync（可选）

- 将第 3 步结果（或抽样）放入 `event`，编写 `handler` 做派生指标或格式整理。
- 仅当业务需要时代码执行；否则跳过。

## 5. json2plot（可选）

- `tool_result_cache_key`: 第 3 步（或平台约定来源）的 key
- `chart_type` / `group_by` / `data_field` / `title` 与数据一致

## 6. 总结

- **结论**（指标口径一两句话）
- **数据依据**（用了哪个 KN、哪些表/SQL 要点，勿泄露敏感 token）
- **图表**（若已生成：说明类型与读图要点）
- **限制**（时间范围、采样、未覆盖维度）
