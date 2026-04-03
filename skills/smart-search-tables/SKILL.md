---
name: smart-search-tables
version: "1.0.0"
user-invocable: true
description: >-
  找表/找数端到端编排：先用 query_object_instance 在元数据知识网络中检索表与资产相关实例，
  再用 department_duty_query 按相关部门查询职责与数据治理边界，最后汇总为中文结论（表候选 + 职责 + 下一步）。
  当用户问「表在哪、哪个视图、数据资产归属、谁负责这类数据」时使用。
metadata:
  openclaw:
    skillKey: smart_search_tables
argument-hint: [找表/找数/资产定位类中文问题；可选 kn_id 覆盖]
---

# Smart Search Tables（找表 / 找数）

本 skill 定义 **固定先后顺序** 的找表工具链：先 **对象实例检索** 锁定表与元数据线索，再 **部门职责语义查询** 补足治理与责任边界，最后 **总结**。子工具契约以同名 skill 为准；`references/` 提供编排说明、**样例**与跳转。

**OpenClaw**：`metadata.openclaw.skillKey` 为 `smart_search_tables`。流水线与默认 `base_url` / `tools.*.url_path` / `kn_id` / `user_id` 见 [config.json](config.json)。

在数据分析员工体系中，本 skill **宜由** [smart-data-analysis](../smart-data-analysis/SKILL.md) **总入口完成意图与 KN 编排后再进入执行**。

## 必读 references（按步骤）

| 步骤 | 说明 | Reference |
|------|------|-----------|
| 1 | `query_object_instance`（找表/元数据实例） | [references/query-object-instance.md](references/query-object-instance.md) |
| 2 | `department_duty_query`（相关部门职责） | [references/department-duty-query.md](references/department-duty-query.md) |
| — | 端到端逻辑与总结要点 | [references/tool-examples.md](references/tool-examples.md) |


## 主流程（必须按序）

```text
找表进度：
- [ ] 1. 运行 [scripts/query_object_instance.py](scripts/query_object_instance.py)：在元数据 KN 下检索，得到表/视图候选与部门/主题线索；请求体三层结构见 [references/query-object-instance.md](references/query-object-instance.md)
- [ ] 2. 运行 [scripts/department_duty_query.py](scripts/department_duty_query.py)：根据线索构造职责问句并查询；格式见 [references/department-duty-query.md](references/department-duty-query.md)
- [ ] 3. 总结：必须展示候选表（以表业务名 `business_name` 为主、完整全称；并补充表技术名 `technical_name`）；**有则**补充职责要点。若第 2 步失败（如 HTTP **404**，多与职责侧 `kn_id` 与环境不一致），简短说明即可，**仍以第 1 步结果为主要交付**；不暴露 token 与完整调试 URL
```

## 脚本查询（强制）

两步 **必须使用本目录提供的脚本** 完成调用：`scripts/query_object_instance.py`、`scripts/department_duty_query.py`。默认 URL / `kn_id` 等与 [config.json](config.json) 及脚本一致，字段细节以 `references/` 为准。**禁止**在本 skill 内新建 `_tmp_*.py` / `_tmp_*.sh` 等临时代码作为 HTTP 请求入口。

在 PowerShell 中执行 Python 时，一律使用脚本的**完整路径**，不要依赖当前工作目录；同一条命令行里串联多个操作时，请使用分号（`;`）分隔，例如：`cd C:\path\to\repo; python C:\path\to\script.py ...`。

### 第 1 步：`query_object_instance`

- **脚本**：[scripts/query_object_instance.py](scripts/query_object_instance.py)
- **认证**：`--token` / `-t` 或位置参数；否则由脚本内部使用 `QOI_TOKEN` 和 `kweaver token` 主动获取
- **检索词**：`--search` / `-s` 或第 2 个位置参数（默认 `企业`）
- **常用可选**：`--kn-id`、`--ot-id`、`--limit`、`--base-url`、`--url-path`、`--x-business-domain`、`--insecure`、`--timeout`、`--out`
- **说明**：脚本内 `need_total` 为 `false`；`kn_id` 须为元数据网且符合 `SOUL.md`。

### 第 2 步：`department_duty_query`

- **脚本**：[scripts/department_duty_query.py](scripts/department_duty_query.py)
- **认证**：`--token` / `-t` 或位置参数；否则由脚本内部使用 `DDQ_TOKEN` 和 `kweaver token` 主动获取
- **问句**：`--query` / `-q` 或第 2 个位置参数（未给则用脚本内默认长句）
- **注意**：请求 JSON 内 **`kn_id` 当前固定 `menu_kg_dept_infosystem_duty`**，`--kn-id` 未写入 body。脚本会先向 stdout 打印请求体再发请求，联调时注意区分输出。
- **404**：不阻断第 1 步表/视图结论，见「步骤约束」。

## 严格限定（找数场景）

- **来源强约束**：找表链路使用的知识网络（`kn_id_find_table`、`query_object_instance.query.kn_id`）必须来自 `SOUL.md` 已配置知识网络。
- **缺失处理**：若 `SOUL.md` 缺失或未配置可用知识网络，必须先提醒用户配置 `SOUL.md`，并暂停第 1 步检索。
- **找数必须使用元数据知识网络**：当用户目标是“找数/找表/找字段/定位资产”时，第 1 步 `query_object_instance` 的 `query.kn_id` **只能**为元数据知识网络。
- **无元数据 KN 不得执行检索**：若当前上下文未提供元数据 KN（或 `kn_id` 不明确/不在元数据候选中），必须先向用户确认「请提供或确认元数据知识网络 kn_id」；确认前不得继续第 1 步。
- **口径冲突时优先安全**：若用户给出的 `kn_id` 与元数据用途不匹配，先提示并二次确认；未确认前停止执行。

## 步骤约束（摘要）

1. **双 KN**：第 1 步 **`tools.query_object_instance.kn_id`**（常为元数据网，须写入请求 JSON 的 **`query.kn_id`**）；第 2 步 **`tools.department_duty_query.kn_id`**（常为职责网，如 `duty`）。**禁止**混用未经验证的 `kn_id`。
   - 上述 `kn_id` 均须来自 `SOUL.md` 配置；未配置不得调用。
2. **tool-box URL**：若 endpoint 含 **`agent-operator-integration/v1/tool-box/`**，第 1 步 POST 体必须为 **`body` + `query` + `header`** 结构（见 [query-object-instance reference](references/query-object-instance.md)）；**`include_logic_params` / `include_type_info` 用 JSON 布尔 `false`**。
3. **第 2 步的职责 `query`** 必须能由第 1 步结果 **派生**；若第 1 步无部门线索，则用用户原问题中的部门/组织词，或 **简要反问** 后再调职责查询。若职责脚本/接口返回 **404** 等错误，**仍须完整交付第 1 步的表/视图结论**，并简短说明职责步骤未成功（常见为职责 `kn_id` 与环境不一致）。
4. **总结** 中区分：**事实发现**（检索到的表）与 **治理描述**（职责库中的条文）；二者无法强绑定时如实说明。最终结果中，候选表输出必须包含表技术名 `technical_name` 与表业务名 `business_name`（若缺失则标注“暂无”）；展示时以 `business_name` 为主，且必须使用完整全称，禁止截断、省略或缩写。
5. **映射约定**：在 `query_object_instance` 结果中，视图与表按同等关系处理；`view_tech_name` 等价于 `table_tech_name`（可归并为 `technical_name`），`view_business_name` 等价于 `table_business_name`（可归并为 `business_name`）。
6. **禁止创建临时脚本作为入口**：本 skill 不得新建 `_tmp_*.py` / `_tmp_*.sh` 等临时文件作为 HTTP 请求入口；所有调用必须通过现有脚本或等价内嵌请求逻辑完成。

## 与 smart-data-analysis 的关系

由 [smart-data-analysis](../smart-data-analysis/SKILL.md) 路由到本 skill 时，主意图为 **找表/定位**；若上下文已有 `kn_id_find_table`，仅当其可确认是元数据知识网络时，才可用于第 1 步 `query_object_instance` 的 `kn_id`。

若 `kn_id_find_table` 缺失、无法确认或与元数据用途冲突，必须先向用户确认元数据知识网络 `kn_id`，确认前不得执行第 1 步检索。

用户后续要 **指标与 SQL 取数** → 转 [smart-ask-data](../smart-ask-data/SKILL.md)。

## 配置

- 统一默认：[config.json](config.json)
  - **`defaults`**：`user_id`、`x_business_domain`
  - **`base_url`**：平台网关域名；完整网关 URL 约定为 `base_url` + `tools.<tool>.url_path`
  - **`tools`**：默认两步流程使用 `query_object_instance`、`department_duty_query`；另外可选子工具包括 `custom_search_strategy`、`datasource_rerank`（**不加入**本 skill `pipeline`）。各工具均以 **`url_path`**、**`kn_id`**、**`user_id`** 为主要配置；若 `url_path` 含 **`agent-operator-integration/v1/tool-box/`**，第 1 步须按 [references/query-object-instance.md](references/query-object-instance.md) 组装 **`body` + `query`（含 `kn_id`/`ot_id`/布尔开关）+ `header`（`x-account-id`/`x-account-type`）**；默认值见 **`default_query`**、**`envelope_header`**
  - **`pipeline`**：每步 **`defaults_key`** 映射到 `tools` 中的键

## 调用示例

```text
/smart-search-tables 采购订单相关宽表在哪个库、叫什么，谁在数据治理里负责？
/smart-search-tables 销售域 KPI 用哪张汇总表，对应部门职责怎么说
```
