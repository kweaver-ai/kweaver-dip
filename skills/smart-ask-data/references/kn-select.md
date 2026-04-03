# 子能力：KN Select（知识网络选择）

在 **问数主流程第 1 步** 调用：根据用户问题（及可选表线索）从候选知识网络中选出最匹配的 `kn_id`，供后续 `text2sql` 使用。

## 何时调用 kn_select（条件执行）

- **已明确 `kn_id`**（来自上游编排或用户指定）：**不调用** `kn_select`，直接使用该 `kn_id`（仍需做 forbidden 校验）。
- **仅 1 个候选 KN**：**不调用** `kn_select`，直接使用该唯一候选（仍需做 forbidden 校验）。
- **候选 KN 多于 1 个**：调用 `kn_select` 进行筛选，再将结果用于后续 `text2sql`。

## 与本流程的衔接

- **输入**：用户自然语言问数意图；`kn_ids` 通常来自编排级默认 [../config.json](../config.json) 中 `tools.kn_select.kn_ids`，或会话给定的候选集（**须先剔除**同文件中的 `tools.kn_select.forbidden_ask_data_kn_ids`，**不得**将元数据 KN 作为问数候选）。
- **输出**：选定的 `kn_id`（以接口返回为准）。**后续所有 `text2sql` 调用须携带该 `kn_id`**（写入 `data_source.kn`）。若返回的 `kn_id` 属于 `forbidden_ask_data_kn_ids`，**中止问数**，不得调用 `text2sql`。
- **账号与域**：`token` 须显式提供；HTTP 头 `x-business-domain` 与 [config.json](../config.json) → `defaults.x_business_domain` 对齐（如 `bd_public`）。**dip-poc** 上 `Authorization` 与 `body.auth.token` 为同一凭证。

## 完整参数与约束

配置以编排级默认 [../config.json](../config.json) 中 `tools.kn_select` 为准。

**请求体为直传 JSON**（非 tool-box 三层 `body`/`query`/`header`）：字段含 **`auth`**、**`query`**、**`kn_ids`**。完整网关 URL 为 **`base_url` + `url_path`**（见 config），勿省略嵌套对象。

**子技能调用约束**：

- **请求参数结构不可变动**：须包含 `auth`、`query`、`kn_ids`，字段名与样例一致。
- **仅允许变动以下参数值**：
  - `query`（自然语言问数意图）
  - `kn_ids`（候选知识网络 id 数组，须与当前环境可访问 KN 一致，且 **不得包含** [config.json](../config.json) → `tools.kn_select.forbidden_ask_data_kn_ids` 中的任一项）
  - `auth.token`
- **HTTP 层 Header**（必填语义）：
  - `Content-Type: application/json`
  - `x-business-domain`：如 `bd_public`（与 [defaults](../config.json) 对齐）
  - `Authorization`：与 `auth.token` 为同一凭证

## query 优化建议

- `query` 不要只写短词（如「企业」「销售」）；建议写成**业务意图 + 数据对象 + 指标/维度 + 时间范围**。
- 优先包含「想查什么表/视图」的线索词，例如「订单明细表」「企业基础信息表」「体育场馆表」。
- 与最终目标保持一致：若目的是问数，`query` 应体现统计口径；若目的是找表，`query` 应体现对象类型与业务域。
- 尽量避免模糊代词（如「这个」「那个」），改为可检索实体词（部门、主题域、业务名词）。

## 请求方式（先写临时脚本，再执行临时脚本）

**执行顺序（强约束）**：

1. **先** 在本机任务目录 **新建临时脚本**（文件名建议带任务含义或时间戳，例如 `_tmp_kn_<主题>.py`、`_tmp_kn_<主题>.sh`；**不要**覆盖、改写仓库内已有脚本）。
2. 在临时脚本内按本文 **「样例（assistant 工具网关）」** 组装 **与样例同构** 的 JSON，再向 `base_url` + `tools.kn_select.url_path` 发起 POST。
3. **再** 在终端 **仅执行该临时脚本**，完成本轮 `kn_select` 调用。

**禁止**：

- **禁止**在仓库 **`skills/`** 及其任意子目录下创建临时脚本；若仓库内另有 **`.claude/skills/`** 等 skill 同步树，**同样禁止** 在其下创建。**宜** 使用工作区根目录、系统临时目录（如 `/tmp`、`%TEMP%`）等与上述路径隔离的位置。
- **禁止**直接执行仓库内 `kn_select_request_example.py`、`kn_select_request_example.sh`、`kn_select_request_example.ps1` 及任何以 `*_example*` 等形式保留的 **样例脚本**（它们仅供对照结构，**不是**本轮调用的入口）。
- **禁止**凭记忆删减字段或脱离样例手写零散 `curl`，以免与网关约定不一致。

**必须**以本文下方 **「样例（assistant 工具网关）」** 中的 JSON 为 **唯一结构蓝本**。

### 编写临时脚本的要点

- **URL**：`base_url` + `url_path` 以 [config.json](../config.json) → `tools.kn_select` 为准。
- **请求体**：与样例 JSON **字段名、嵌套层级** 保持一致；仅按上文 **「子技能调用约束」** 调整允许变动的参数值。
- **HTTP 头**：`Content-Type: application/json`、`Authorization`（与 `auth.token` 一致）、`x-business-domain`（与 config 一致）；实现细节可对照下方「结构参考文件」中的写法，但**逻辑须落在你的临时脚本内**。

### 结构参考文件（只读对照，不得当执行入口）

下列文件与 **JSON 样例** 等价，**仅用于打开核对字段、请求头与序列化方式**；编临时脚本时从中**复制思路或片段**到**新建文件**，**不要**在任务中直接跑通联调样例文件。

| 类型 | 参考文件 | 说明 |
|------|----------|------|
| **推荐（跨平台）** | [`../scripts/kn_select_request_example.py`](../scripts/kn_select_request_example.py) | 标准库 `urllib` 发起 POST；`--insecure` 跳过 TLS；`-c ../config.json` 对齐编排默认。 |
| **备选（curl）** | [`../scripts/kn_select_request_example.sh`](../scripts/kn_select_request_example.sh) | 对照 `curl` 与样例同构 JSON。 |
| **遗留对照** | [`../scripts/kn_select_request_example.ps1`](../scripts/kn_select_request_example.ps1) | 仅作 Windows PowerShell / `Invoke-RestMethod` 对照，**非**推荐入口。 |

临时脚本为 **单次任务专用**；联调 **成功后** 可删除；**失败时** 保留临时脚本与终端输出便于定位。仓库长期维护的 `*_request_example*` **勿在任务中当入口执行**；需要变更时只改你的临时副本。

### 执行示例（仅执行你新建的临时脚本）

推荐用 **Python**（Windows / Linux / macOS 通用；假设已生成与样例同构的 `_tmp_kn_my_task.py`）。

Linux/macOS（Bash）示例：

```bash
# token 与 auth.token、Authorization 一致；勿写入仓库或日志
export KN_SELECT_TOKEN="$(kweaver token | tr -d '\r\n')"
# 若为空、取 token 报错或 401：先执行 kweaver auth login <网关根地址>
python path/to/_tmp_kn_my_task.py --insecure -q "销售域上月各区域销售额统计应选用哪个知识网络？"
```

Windows PowerShell 中取 token 并调用：

```powershell
$env:KN_SELECT_TOKEN = (npx kweaver token 2>&1 | Out-String).Trim()
# 若未配 npx，可改用 (kweaver token).Trim() 等与当前环境一致的方式
python path\to\_tmp_kn_my_task.py --insecure -q "销售域上月各区域销售额统计应选用哪个知识网络？"
```

**注意**：提示符为 **`PS ...>`** 时是 **PowerShell**，**不能**用 CMD 的 `set KN_SELECT_TOKEN=...`（不会写入当前进程环境变量，Python 读不到）。请始终用上一节 **`$env:KN_SELECT_TOKEN = ...`**，或直接用 **`python ... --token '...'`**。

Windows CMD 示例（仅 **`cmd.exe` 命令提示符**）：

```cmd
set KN_SELECT_TOKEN=<your-token>
python path\to\_tmp_kn_my_task.py --insecure -q "销售域上月各区域销售额统计应选用哪个知识网络？"
```

若使用 **Bash + curl 临时脚本**（已对脚本 `chmod +x`，与样例 shell 同构）：

```bash
TOKEN=$(kweaver token | tr -d '\r\n')
./path/to/_tmp_kn_my_task.sh -t "$TOKEN" -q "销售域上月各区域销售额统计应选用哪个知识网络？" -k
```

（`python ... --insecure` 与 [`kn_select_request_example.py`](../scripts/kn_select_request_example.py) 一致；`-k` / `curl --insecure` 与 [`kn_select_request_example.sh`](../scripts/kn_select_request_example.sh) 一致。）

**无脚本环境**：仍须以下方 **JSON 样例** 为体，用 Postman、`curl` 等 HTTP 工具 **原样结构** 发送。

## 样例（assistant 工具网关）

以下 `token`、`query`、`kn_ids` 由调用方替换；`kn_ids` 可与 [config.json](../config.json) → `tools.kn_select.kn_ids` 一致。

**Header**

```http
Content-Type: application/json
x-business-domain: bd_public
Authorization: {token}
```

**Body**

```json
{
  "auth": {
    "token": "{token}"
  },
  "query": "销售域中需要查询上个月各区域销售额与订单量，目标是定位可用于统计的订单明细表与相关维度表",
  "kn_ids": ["d71o5e1e8q1nr9l7mb80"]
}
```

## 响应处理示意

接口成功时，从返回中解析 **`kn_id`**（字段名以实际网关为准），供下一步 `text2sql` 的 `data_source.kn` 使用。

```json
{
  "kn_id": "d71o5e1e8q1nr9l7mb80",
  "matched_by": "question",
  "confidence": 0.92
}
```

## 注意事项

- `auth.token` 与 Header `Authorization` 一致；缺失时须由调用方显式提供，不从本 skill 配置自动推断用户 Token。
- 表匹配优先于问题匹配（见原 skill 说明）。
- **元数据 KN**：`idrm_metadata_kn_object_lbb` 等仅用于找表/元数据检索，**禁止**列入问数 `kn_ids`；详见 [../SKILL.md](../SKILL.md)「知识网络约束（问数）」与 [text2sql.md](text2sql.md)。
