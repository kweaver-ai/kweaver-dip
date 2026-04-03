# 子能力：Json2Plot（图表 JSON）

在 **问数主流程第 5 步（可选）** 调用：用户需要 **可视化**（饼/折线/柱/环形等）且环境中存在 `json2plot` 工具时优先使用。

## 与前序步骤的衔接

- **`tool_result_cache_key`**：应使用 **`text2sql` / `gen_exec`**（或文档约定的 text2metric）返回的缓存键；与 `data` 二选一，勿与手写 JSON 数据混用规则冲突。
- **`chart_type`**：仅支持 `Pie`、`Line`、`Column`（环形图属 `Pie`）。
- **`group_by` / `data_field`**：必须与真实返回字段一致，禁止臆造；缺失时反问用户或放弃绘图。
- **`title`**：字符串，与数据/问题语义一致，**不是 dict**。

## 完整参数

配置以编排默认 [../config.json](../config.json) 中 `tools.json2plot` 为准。
请求 URL 约定为：`base_url` + `tools.json2plot.url_path`。

## 请求方式（先写临时脚本，再执行临时脚本）

**执行顺序（强约束）**：

1. **先** 在本机任务目录新建临时脚本（例如 `_tmp_j2p_<主题>.py` 或 `_tmp_j2p_<主题>.sh`，**不要**覆盖仓库样例）。
2. 按本文样例结构组装请求，POST 至 `base_url` + `tools.json2plot.url_path`。
3. **再** 在终端仅执行你的临时脚本。

**禁止**：

- **禁止**直接把 `../scripts/json2plot_request_example.py` / `.sh` 当任务入口执行。
- **禁止**在仓库 **`skills/`** 及其任意子目录下创建临时脚本；若仓库内另有 **`.claude/skills/`** 等 skill 同步树，**同样禁止** 在其下创建。**宜** 使用工作区根目录、系统临时目录（如 `/tmp`、`%TEMP%`）等与上述路径隔离的位置。

### 结构参考文件（只读对照，不得当执行入口）

| 类型 | 参考文件 | 说明 |
|------|----------|------|
| **推荐（跨平台）** | [`../scripts/json2plot_request_example.py`](../scripts/json2plot_request_example.py) | 支持 `--chart-type`、`--group-by`、`--data-field`、`--tool-result-cache-key`；标准库 `urllib`；`--insecure` 跳过 TLS；`-c ../config.json` 对齐路径与业务域。 |
| **备选（curl）** | [`../scripts/json2plot_request_example.sh`](../scripts/json2plot_request_example.sh) | 同参数语义；依赖 `python3` 组装 JSON；`-K` 跳过 TLS。 |

### 执行示例（仅执行你新建的临时脚本）

Linux/macOS（Bash）：

```bash
export JSON2PLOT_TOKEN="$(kweaver token | tr -d '\r\n')"
python path/to/_tmp_j2p.py --chart-type Pie --group-by region_name --data-field amount \
  --tool-result-cache-key "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ" \
  --title "各区域销售额占比" --insecure
```

Windows PowerShell：

```powershell
$env:JSON2PLOT_TOKEN = (npx kweaver token 2>&1 | Out-String).Trim()
python path\to\_tmp_j2p.py --chart-type Pie --group-by region_name --data-field amount `
  --tool-result-cache-key "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ" `
  --title "各区域销售额占比" --insecure
```

**Bash + curl**（需 `python3` 组装 JSON）：

```bash
TOKEN="$(kweaver token | tr -d '\r\n')"
./path/to/_tmp_j2p.sh -t "$TOKEN" -c Pie -g region_name -f amount \
  -k "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ" -i "各区域销售额占比" -K
```

## 样例 A：饼图（占比类）

**Header**

```http
Content-Type: application/json
x-business-domain: bd_public
Authorization: {token}
```

**Body（`tool_result_cache_key` 必须来自 text2sql `gen_exec` 等支持的缓存输出）**

```json
{
  "chart_type": "Pie",
  "data_field": "amount",
  "group_by": ["region_name"],
  "session_id": "550e8400-e29b-41d4-a716-446655440002",
  "session_type": "redis",
  "title": "各区域销售额占比",
  "tool_result_cache_key": "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ",
  "timeout": 120,
  "auth": {
    "token": "{token}"
  }
}
```

## 样例 B：折线图（时间序列）

**Body**

```json
{
  "chart_type": "Line",
  "data_field": "amount",
  "group_by": ["order_month", "region_name"],
  "session_id": "550e8400-e29b-41d4-a716-446655440003",
  "session_type": "redis",
  "title": "各区域月度销售额趋势",
  "tool_result_cache_key": "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ",
  "timeout": 120,
  "auth": {
    "token": "{token}"
  }
}
```

**说明**：折线图 `group_by`：第一项为 x 轴（如月份），第二项为分组系列（如区域）；`data_field` 为 y 轴度量。

## 样例 C：柱状图（分类对比）

```json
{
  "chart_type": "Column",
  "data_field": "amount",
  "group_by": ["region_name"],
  "session_id": "550e8400-e29b-41d4-a716-446655440004",
  "session_type": "redis",
  "title": "各区域销售额对比",
  "tool_result_cache_key": "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ",
  "timeout": 120,
  "auth": {
    "token": "{token}"
  }
}
```

**说明**：`Column` 若有堆叠/多系列，可增加 `group_by` 第二、三项（见 [json2plot SKILL](../../json2plot/SKILL.md)）；**`group_by` / `data_field` 须与缓存数据列名一致**。

## 响应与展示

- 工具返回后：**不要**把完整图表 JSON 冗长贴给用户；说明图表类型与读图要点即可（前端可自动渲染）。
