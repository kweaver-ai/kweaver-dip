---
name: smart-ask-data
version: "1.0.0"
user-invocable: true
description: >-
  问数端到端编排：若已指定 KN 或仅一个候选 KN 则直接使用，否则先用 kn_select 选定知识网络，再用 text2sql 的 show_ds 发现候选表与表结构、
  gen_exec 生成并执行 SQL 取数，按需调用 execute_code_sync 做二次计算，按需 json2plot 出图，
  最后输出中文结论与口径说明。
  当用户需要指标、统计、趋势、SQL 取数、数据分析或图表时使用。
metadata:
  openclaw:
    skillKey: smart_ask_data
argument-hint: [中文问数问题；可选已有 kn_id 或候选 kn 列表]
---

# Smart Ask Data（问数）

本 skill 定义 **固定先后顺序** 的问数工具链；各工具的参数细节、Header/Body 与配置文件路径以 **同名子 skill** 为准，本仓库在 `references/` 中为每一步提供 **编排说明 + 跳转链接**。

**OpenClaw**：`metadata.openclaw.skillKey` 为 `smart_ask_data`。编排元数据与流水线声明见 [config.json](config.json)。

在数据分析员工体系中，本 skill **必须由** [smart-data-analysis](../smart-data-analysis/SKILL.md) **总入口完成意图与 KN 编排后再进入执行**；仅当用户明确使用 `/smart-ask-data` 强制调用时可直接进入。

## 必读 references（按步骤）

| 步骤 | 说明 | Reference |
|------|------|-----------|
| 1 | 知识网络选择（条件执行 `kn_select`） | [references/kn-select.md](references/kn-select.md) |
| 2 | `text2sql` → `show_ds`（候选表/结构） | [references/text2sql.md](references/text2sql.md)（临时 Python 须与样例同构、单文件无外部依赖，见文内「临时 text2sql Python 脚本规范」） |
| 3 | `text2sql` → `gen_exec`（SQL + 数据） | 同上；**按需** SQL 背景模板见 [references/text2sql-background-knowledge.md](references/text2sql-background-knowledge.md)（渐进式加载，勿整文件预读） |
| 4 | `execute_code_sync`（可选） | [references/execute-code-sync.md](references/execute-code-sync.md) |
| 5 | `json2plot`（可选） | [references/json2plot.md](references/json2plot.md) |
| — | 端到端顺序示例 | [references/tool-examples.md](references/tool-examples.md) |

## 关键调用方式（重点）

- `text2sql show_ds`：用于发现候选表与关键字段（问数第 2 步）。
- `text2sql gen_exec`：用于生成并执行 SQL，返回 SQL 与结果数据（问数第 3 步）。
- 这两个调用方式的请求结构、必填参数、Header/Body、临时脚本规范与异常口径，**详情统一以** [references/text2sql.md](references/text2sql.md) **为准**。


## 主流程（必须按序；可选步骤注明）

复制进度：

```text
问数进度：
- [ ] 1. 解析 kn_id：若已指定或仅 1 个候选 KN 则直用；仅当候选 KN > 1 时调用 kn_select（见 kn-select reference）
      （回显结果：selected kn_id 及匹配依据/置信度；异常则终止）
- [ ] 2. text2sql show_ds：候选表与字段 → 整理为 gen_exec 的 background
      （回显结果：`text2sql show_ds` 的候选表/关键字段摘要；异常则终止）
- [ ] 3. text2sql gen_exec：生成 SQL、取数；保留 tool_result_cache_key（若有）
      （回显结果：`text2sql gen_exec` 的 SQL + 关键结果数据摘要；异常/空结果则终止）
- [ ] 4. （可选）execute_code_sync：仅当需代码二次加工时
      （回显结果：二次加工后的关键数据/派生结果摘要；异常则终止）
- [ ] 5. （可选）json2plot：仅当用户要图且字段与缓存键就绪时
      （回显结果：图表类型/标题 + 读图要点；异常则终止）
- [ ] 6. 总结：结论 + 口径 + 依据（KN/表）+ 图表说明（若有）
```

## 阶段门禁（Stage Gates，必须全部通过）

- **Gate 1（进入 Step 2 前）**：必须已获得有效 `kn_id`，且 `kn_id` 不在 `forbidden_ask_data_kn_ids` 列表中。
- **Gate 2（进入 Step 3 前）**：子工具 `text2sql show_ds` 必须返回可用候选表与关键字段摘要；候选为空视为失败。
- **Gate 3（进入 Step 4/5 前）**：子工具 `text2sql gen_exec` 返回成功且下一步关键字段齐全（如画图需 `tool_result_cache_key`，且必须来自本轮 Step 3 `text2sql gen_exec` 返回值）。
- **Gate 4（进入 Step 6 前）**：若子工具 `text2sql gen_exec` 返回非空数据，最终答复必须同时包含原样 SQL 与原样结果数据。
- 任一 Gate 不通过：立即终止流程，使用「异常终止回执模板」返回，不得跳步或改走其他分支兜底。

## 每步回显与异常中止（硬约束）

本 skill 必须在每个已执行的步骤结束后，把该步骤的关键输出回显给用户；一旦任一步骤结果“异常”，必须立刻终止流程，不再执行后续步骤（包括可选步骤），并输出异常原因。

### 异常判定口径（通用）
- 工具调用失败（接口返回非成功状态、或关键字段缺失）视为异常。
- 缺失“下一步所需的关键字段/输入条件”视为异常（例如：`kn_id` 缺失导致无法进入 `show_ds`；`tool_result_cache_key` 缺失导致无法进入 `json2plot`）。
- 当用户明确要求生成图表时，图表所需数据/缓存键缺失视为异常。

### 步骤回显模板（text2sql show_ds / text2sql gen_exec 必须原样返回）
1. **Step 1（kn_select 完成后）回显**：输出 `selected kn_id` + 匹配依据/置信度（若接口返回）；并明确说明是否命中问数允许网络。
2. **Step 2（text2sql show_ds 完成后）回显**：对 `text2sql show_ds` 结果做原样回显（不得脱敏、不得改写、不得省略关键字段）；可附最小必要的结构化整理说明。
3. **Step 3（text2sql gen_exec 完成后）回显**：对 `text2sql gen_exec` 返回的 `sql` 与结果数据做原样回显（不得脱敏、不得改写、不得省略）；如存在 `tool_result_cache_key`，按接口原值回显。
4. **Step 4（execute_code_sync 完成后，可选）回显**：输出二次加工的关键派生结果摘要（如派生列/汇总数值/结构变化），不输出完整代码与原始 JSON。
5. **Step 5（json2plot 完成后，可选）回显**：输出图表类型与标题 + 读图要点（来自图表生成输入/结果的要点说明），不输出完整图表 JSON。

### 异常终止回执模板（必须在终止时使用）
```text
### 流程终止（异常 | <Step X>）
异常原因：
- <一句话原因，必须对应具体步骤的缺失/空结果/错误状态>
下一步：
- <给用户可执行修复条件，例如：补充时间范围/口径、换用/确认问数 KN、重试触发条件等>
```

## 临时文件清理（成功后）

本 skill 在调用子能力时，允许在“本机任务目录”创建临时脚本（用于组织请求 JSON/发起 HTTP）；**MUST NOT** 将临时脚本落在仓库 **`skills/`** 及其任意子目录下，若仓库内另有 **`.claude/skills/`** 等 skill 同步树亦同。**宜** 使用工作区根目录、系统临时目录等与上述路径隔离的位置。为减少磁盘残留，本 skill 增加清理门禁：

- MUST：当且仅当本轮流程成功完成到“总结（Step 6）”并输出最终回复后，删除本轮创建的临时脚本文件。
- MUST：仅删除满足以下规则的文件名模式：以 `_tmp_` 开头，后缀为 `.py` / `.sh` / `.ps1`（大小写不敏感也视为匹配）。
- MUST：绝对不删除仓库中的任何 `*_request_example*` 样例脚本，或用户非本轮创建的临时文件。
- MUST：若流程在任一步骤发生异常并提前终止，则不删除临时脚本（保留用于排查）；在异常回执中可提示“临时脚本已保留”。
- MUST：若用户明确要求“保留调试文件/导出详情/展开详情”，则不删除相关临时脚本。

### 知识网络约束（问数）

- **来源强约束**：问数使用的 `kn_id`（含直传 `kn_id`、候选 `kn_ids`、最终写入 `text2sql.data_source.kn` 的网络）必须来自 `SOUL.md` 已配置知识网络。
- **缺失处理**：若 `SOUL.md` 缺失或未配置可用知识网络，必须先提醒用户配置 `SOUL.md`，并暂停 `text2sql show_ds` / `text2sql gen_exec` 执行。
- **禁止元数据知识网络**：问数链路（`kn_select` 候选、`text2sql` 的 `data_source.kn`）**不得**使用元数据类 KN（用于目录/对象检索，非业务事实取数）。当前平台示例中元数据 KN 的 id 为 `idrm_metadata_kn_object_lbb`，与 [config.json](config.json) → `tools.kn_select.forbidden_ask_data_kn_ids` 对齐。
- **配置与调用**：默认 `tools.kn_select.kn_ids` **已排除**上述 id；若调用方自行传入候选 `kn_ids`，须先 **剔除** `forbidden_ask_data_kn_ids` 中的全部项再调用 `kn_select`。
- **结果校验**：若 `kn_select` 返回的 `kn_id` 仍落在禁止列表中，**不得**继续 `text2sql show_ds` / `text2sql gen_exec`，应改候选或引导用户指定业务 KN。

### 步骤约束（摘要）

1. **KN 解析（条件路由）**：
   - 已明确传入 `kn_id`：仅当该值在 `SOUL.md` 已配置网络中时可直接使用（且仍需校验不在 `forbidden_ask_data_kn_ids` 中）。
   - 未传 `kn_id` 但候选 `kn_ids` 仅 1 个：仅当该候选属于 `SOUL.md` 配置网络时可直接使用（且仍需校验）。
   - 候选 `kn_ids` > 1：仅在 `SOUL.md` 配置网络集合内调用 `kn_select` 选定后再继续。
   - **不得**在未知 KN 上直接 text2sql。
   - **异常中止**：若 `kn_select` 返回的 `kn_id` 缺失或落在 forbidden 列表中，则终止并输出异常原因。
2. **text2sql show_ds 先于 text2sql gen_exec**：先缩小表与字段空间，再把摘要写入 `background`，降低 SQL 幻觉。
   - **异常中止**：若 `text2sql show_ds` 未返回候选表/关键字段摘要（背景为空或候选为空），则终止并输出“text2sql show_ds 候选为空/不匹配”的异常原因。
3. **text2sql gen_exec**：`input` 中文；`kn_id` 与第 1 步一致，且 **非**元数据 KN；结果用于回答或进入可选后处理。
   - **异常中止**：若 `text2sql gen_exec` 返回缺失 `sql` 或结果数据缺失，则终止并输出异常原因；若结果为空，则终止并输出“未查询到符合条件的数据”作为异常原因（后续可选步骤跳过）。
4. **execute_code_sync**：将上游结果经 `event` 传入 handler；遵守子 skill 的 poll/sync 参数。
   - **异常中止**：当执行代码返回非成功状态或关键二次加工结果缺失时终止并输出异常原因。
5. **json2plot**：使用 `tool_result_cache_key` 引用 text2sql 结果，且该 key **必须来自本轮 Step 3 `text2sql gen_exec` 的返回值**；不得复用历史轮次或外部注入 key；**不向用户堆砌原始 JSON**。
   - **异常中止**：当用户要求画图但 `text2sql gen_exec` 未返回 `tool_result_cache_key`、或 key 非本轮 `text2sql gen_exec` 产生、或图表生成失败，则终止并输出异常原因。
6. **结果展示硬约束**：若 `text2sql gen_exec` 返回非空数据（如有行记录/聚合结果），最终回复中**必须同时展示**：
   - 生成并执行的 SQL（原样展示，不可脱敏，不可省略）；
   - 结果数据（原样展示，不可仅给口头结论）。
7. **总结**：明确时间范围、指标定义；不暴露 token 与完整调试 URL。

## 注意事项（必须遵守）

1. 所有信息**必须完全来自查询结果**，不允许添加任何结果中不存在的内容。
2. 不允许猜测、推断、脑补、编造数据。
3. 不允许改写、美化、夸张、虚构企业信息。
4. 不使用不确定词汇，如“可能”“大概”“应该”“据悉”。
5. 若结果为空，直接说明“未查询到符合条件的数据”，并将其作为异常终止原因（后续可选步骤跳过），不得自行编造。
6. 只做结构化整理、排序、计数、分段展示，不做逻辑外扩。
7. 严格按原始数据呈现，不修改数字、名称、顺序。
8. 对 `text2sql show_ds` / `text2sql gen_exec` 的返回，必须原样返回；禁止生成、补造、篡改任何数据或字段。

## 最终回复前自检（必须全部为“是”）

- 是否严格按 `1 -> 2 -> 3 -> (4?) -> (5?) -> 6` 顺序执行？
- 是否每个已执行步骤都完成了关键回显？
- 是否在任一步骤异常时立刻终止且未跳步？
- 若 `text2sql gen_exec` 有结果，是否原样展示 SQL 与结果数据？
- 若进入画图，是否仅使用本轮 `text2sql gen_exec` 产生的 `tool_result_cache_key`？
- 是否全程仅使用 `SOUL.md` 允许且非 forbidden 的问数 KN？

## 与 smart-data-analysis 的关系

由 [smart-data-analysis](../smart-data-analysis/SKILL.md) 做顶层路由时，进入本 skill 表示用户 **主意图为问数**；若上下文已含 `kn_id_ask_data`，优先直接使用；仅当存在多个候选 KN 且未明确时再用 kn_select 对齐（最终以业务规则确认为准）。

## 配置

- 本 skill **统一默认配置**：[config.json](config.json)
  - **`defaults`**：全链路共享的 **`user_id`**、HTTP Header **`x_business_domain`**（与 department_duty_query / 各子 skill 对齐；生产环境可改为平台真实业务域）。
  - **`base_url`**：平台网关域名（与各工具的 `url_path` 拼接得到完整请求地址）。
  - **`tools`**：按工具聚合的默认 **`url_path`**（相对路径）、**`user_id`**，以及 **`kn_select.kn_ids`**、**`kn_select.forbidden_ask_data_kn_ids`**（问数禁止使用的元数据等 KN）、**`text2sql.kn_id`**（问数默认 KN；当已指定或仅一个候选 KN 时可直接使用，若多候选经 `kn_select` 选定后应覆盖传入）、**`execute_code_sync` / `json2plot` 的 `kn_id`**（可为空字符串）。
  - **`pipeline`**：每步通过 **`defaults_key`** 指向 `tools` 中对应键，便于实现侧一次读取本文件完成装配；子目录 `skills/<tool>/config.json` 仍可单独覆盖或与 `tools` 保持同步（部署时建议二选一为主，避免漂移）。

## 调用示例

```text
/smart-ask-data 上个月各区域销售额占比多少，用饼图展示
/smart-ask-data 在候选知识网络里自动选 KN，查库存周转相关明细并给结论
```
