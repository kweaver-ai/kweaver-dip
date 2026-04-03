# 子能力：Department Duty Query（部门职责）

在 **找表主流程第 2 步** 调用：基于第 1 步得到的 **部门线索 / 主题域 / 表候选**，查询职责与治理边界，用于回答「谁负责、职责是什么、如何协同」。

## 与本流程的衔接

- **输入 `query`**：建议包含部门名 + 数据对象 + 业务语境，例如「数据管理部对采购主题数据资产的职责是什么？」。
- **`kn_id`**：默认使用 [config.json](../config.json) → `tools.department_duty_query.kn_id`（当前示例 `duty`），通常与元数据检索网不同。
- **输出**：职责条目、职责动作、适用范围；与第 1 步表候选合并后给出总结。

## 完整参数与约束

配置以编排级默认 [../config.json](../config.json) 中 `tools.department_duty_query` 为准。

**请求体为直传 JSON**：须包含 **`auth`**、**`query`**、**`kn_id`**（不是 tool-box 三层 `body` / `query` / `header` 结构）。

**子技能调用约束**：

- **请求参数结构不可变动**：`auth`、`query`、`kn_id` 三块必须存在。
- **仅允许变动以下参数值**：
  - `query`（自然语言问题）
  - `kn_id`（须与环境一致，推荐使用配置默认职责网）
  - `auth.token`
- **HTTP 层 Header**：
  - `Content-Type: application/json`
  - `x-business-domain`：如 `bd_public`
  - `Authorization`：与 `auth.token` 为同一凭证
  - `x-trace-id`：建议每次请求唯一（UUID）

## 请求方式（先写临时脚本，再执行临时脚本）

**执行顺序（强约束）**：

1. **先** 在本机任务目录 **新建临时脚本**（推荐 `_tmp_ddq_<主题>.py`；不要覆盖仓库样例）。
2. 在临时脚本中按本文 **「样例（assistant 工具网关）」** 组装同构 JSON，并 POST 到 `base_url` + `tools.department_duty_query.url_path`。
3. **再** 在终端 **仅执行该临时脚本**。

**禁止**：

- **禁止**直接执行仓库内 `department_duty_query_request_example.py/.sh/.ps1` 作为本轮任务入口。
- **禁止**凭记忆删字段或脱离样例手写零散 `curl`。

**必须**以本文样例 JSON 为结构蓝本。

### 编写临时脚本的要点

- **URL**：`base_url` + `url_path` 以 [config.json](../config.json) → `tools.department_duty_query` 为准。
- **请求体**：字段名与嵌套层级与样例一致。
- **请求头**：`Authorization`、`x-business-domain`、`x-trace-id` 与样例一致。

### 结构参考文件（只读对照，不得当执行入口）

| 类型 | 参考文件 | 说明 |
|------|----------|------|
| **推荐（跨平台）** | [`../scripts/department_duty_query_request_example.py`](../scripts/department_duty_query_request_example.py) | 标准库 `urllib` 发起 POST；`--insecure` 跳过 TLS；可选 `--config` 对齐编排配置。 |
| **备选（curl）** | [`../scripts/department_duty_query_request_example.sh`](../scripts/department_duty_query_request_example.sh) | 对照 `curl` 请求头与 JSON 结构。 |
| **遗留对照** | [`../scripts/department_duty_query_request_example.ps1`](../scripts/department_duty_query_request_example.ps1) | 仅作 PowerShell 对照，**非推荐入口**。 |

### 执行示例（仅执行你新建的临时脚本）

推荐用 **Python**：

Linux/macOS（Bash）：

```bash
export DDQ_TOKEN="$(kweaver token | tr -d '\r\n')"
python path/to/_tmp_ddq_my_task.py --insecure \
  -q "数据管理部对采购主题数据资产的职责是什么？"
```

Windows PowerShell：

```powershell
$env:DDQ_TOKEN = (npx kweaver token 2>&1 | Out-String).Trim()
python path\to\_tmp_ddq_my_task.py --insecure `
  -q "数据管理部对采购主题数据资产的职责是什么？"
```

Windows CMD（仅 `cmd.exe`）：

```cmd
set DDQ_TOKEN=<your-token>
python path\to\_tmp_ddq_my_task.py --insecure -q "数据管理部对采购主题数据资产的职责是什么？"
```

**无脚本环境**：可用 Postman / `curl`，但请求体与样例字段层级必须一致。

## 样例（assistant 工具网关）

以下 `token`、`query`、`kn_id` 由调用方替换。

**Header**

```http
Content-Type: application/json
x-business-domain: bd_public
Authorization: {token}
x-trace-id: {uuid}
```

**Body**

```json
{
  "auth": {
    "token": "{token}"
  },
  "query": "信息技术部在企业数据资产目录与指标口径管理中的职责是什么？与采购订单类宽表治理有何关系？",
  "kn_id": "duty"
}
```

## 响应处理示意

抽取 **部门、职责动作、适用范围**；去重后与第 1 步候选表/视图对照，说明「职责-资产」关系。若为空结果，优先改写 `query`（补充部门名或业务主题）。

## 注意事项

- `auth.token` 与 Header `Authorization` 必须一致。
- 建议显式传 `kn_id`，避免误用非职责网络。
