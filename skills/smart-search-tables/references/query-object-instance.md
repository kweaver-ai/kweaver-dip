# 子能力：Query Object Instance（对象实例 / 找表元数据）

在 **找表主流程第 1 步** 调用：在业务知识网络下，按语义检索 **对象实例**（常用于 **表/视图/数据资产** 等元数据对象），为后续职责查询提供 **对象名、归属部门线索、业务域关键词**。

## 与本流程的衔接

- **检索词**：将用户「找表、找数」问题提炼为 `search`（写入 `condition` 里 `match` / `knn` 的 `value`）。
- **默认 KN / ot_id**：见 [config.json](../config.json) → `tools.query_object_instance`（`kn_id`、`default_query.ot_id` 等）。
- **账号头**：JSON 根级 **`header`** 必填。ontology 侧若报 **`Access denied: missing account ID or type`**，需在 [config.json](../config.json) 的 **`envelope_header`** 中提供有效组合；**dip-poc** 上已验证可用 **`x-account-id` = 与 `user_id` 同一 UUID**、**`x-account-type` = `user`**（与 `defaults.user_id` / `tools.*.user_id` 对齐）。

## 完整参数与约束

配置以编排级默认 [../config.json](../config.json) 中 `tools.query_object_instance` 为准。

**当接口 URL 包含 `agent-operator-integration/v1/tool-box/` 时**，请求体为 **三层结构**：顶层 `body`（检索条件）、顶层 `query`（知识网络与对象类型）、顶层 `header`（账户维度）。**不要把 `kn_id` 只写在浏览器 URL 上**；应放在 JSON 的 **`query.kn_id`** 中。

**子技能调用约束（新增）**：

- **请求参数结构不可变动**：必须保持 `body`、`query`、`header` 三层结构，且其中字段均按样例完整传递（均为必传参数）。
- **仅允许变动以下参数值**：
  - `body.limit`
  - `body.condition.sub_conditions[0].value`
  - `body.condition.sub_conditions[1].value`
  - `query.kn_id`
  - `header.x-account-id`

**HTTP 层 Header**（与部门职责等接口一致，仍需要）：

- `Content-Type: application/json`
- `x-business-domain`：如 `bd_public`（与 [defaults](../config.json) 对齐）
- `Authorization`：与 `body.auth.token` 为同一凭证

**`match` / `knn`**：部分数据源上 `match` 可能不可用，可仅保留 `knn` 或按平台文档改用 `like` 等。

## 请求方式（先写临时脚本，再执行临时脚本）

**执行顺序（强约束）**：

1. **先** 在本机任务目录 **新建临时脚本**（推荐 `_tmp_qoi_<主题>.py`；可选 `.sh`；**不要**覆盖仓库内样例脚本）。
2. 在临时脚本内按本文 **「样例（tool-box 调试网关）」** 组装 **与样例同构** 的三层 `body` + `query` + `header`，再发起 POST。
3. **再** 在终端 **仅执行该临时脚本**，完成本轮 `query_object_instance` 调用。

**禁止**：

- **禁止**直接执行仓库内 `query_object_instance_request_example.py`、`query_object_instance_request_example.sh`、`query_object_instance_request_example.ps1` 等 **样例脚本**（仅供对照结构，非本轮任务入口）。
- **禁止**凭记忆删减字段或脱离样例手写零散 `curl`，以免与网关约定不一致。

**必须**以本文下方 **「样例（tool-box 调试网关）」** 一节中的 JSON 为 **唯一结构蓝本**。

### 编写临时脚本的要点

- **URL**：`base_url` + `url_path` 以 [config.json](../config.json) → `tools.query_object_instance` 为准；勿只把 `kn_id` 写在查询字符串上，`kn_id` 必须出现在 **`query.kn_id`**。
- **请求体**：与样例 JSON **字段名、嵌套层级、布尔类型**（`include_*` 等为 JSON `false`，非字符串）保持一致；仅按上文 **「完整参数与约束」** 中子技能调用约束调整允许变动的参数值。
- **HTTP 头**：除脚本内 `Content-Type: application/json` 外，须带 `Authorization`（与 `body.auth.token` 一致）、`x-business-domain`（与 [defaults](../config.json) 一致）；实现细节可对照下方「结构参考文件」中的写法，但**逻辑须落在你的临时脚本内**。
- **检索词**：将任务中的找表问题写入 `body.condition.sub_conditions` 里 **`match` 与 `knn` 的 `value`**（通常与 `{search}` 相同）。

### 结构参考文件（只读对照，不得当执行入口）

下列文件与 **JSON 样例** 等价，**仅用于打开核对字段、请求头与序列化方式**；编临时脚本时从中**复制思路或片段**到**新建文件**，**不要**在任务中 `.\query_object_instance_request_example.ps1` 直接跑通联调。

| 类型 | 参考文件 | 说明 |
|------|----------|------|
| **推荐（跨平台）** | [`../scripts/query_object_instance_request_example.py`](../scripts/query_object_instance_request_example.py) | 标准库 `urllib` 调用；`--insecure` 跳过 TLS；支持 `--config` 对齐编排配置。 |
| **备选（curl）** | [`../scripts/query_object_instance_request_example.sh`](../scripts/query_object_instance_request_example.sh) | 对照 `curl` 与三层 JSON 的拼装方式。 |
| **遗留对照** | [`../scripts/query_object_instance_request_example.ps1`](../scripts/query_object_instance_request_example.ps1) | 仅作 PowerShell 对照，**非推荐入口**。 |

临时脚本为 **单次任务专用**；联调/排查 **成功后** 可删除；失败时保留临时脚本与终端输出便于定位。仓库长期维护的 `query_object_instance_request_example*` **勿直接作为任务入口执行**。

### 执行示例（仅执行你新建的临时脚本）

推荐用 **Python**（假设你已创建 `_tmp_qoi_my_task.py`）：

```bash
export QOI_TOKEN="$(kweaver token | tr -d '\r\n')"
python path/to/_tmp_qoi_my_task.py --insecure -s "企业"
```

Windows PowerShell：

```powershell
$env:QOI_TOKEN = (npx kweaver token 2>&1 | Out-String).Trim()
python path\to\_tmp_qoi_my_task.py --insecure -s "企业"
```

Windows CMD（仅 `cmd.exe`）：

```cmd
set QOI_TOKEN=<your-token>
python path\to\_tmp_qoi_my_task.py --insecure -s "企业"
```

**Bash + curl** 备选：

```bash
TOKEN=$(kweaver token | tr -d '\r\n')
./path/to/_tmp_qoi_my_task.sh -t "$TOKEN" -s "企业" -k
```

**无脚本环境**：仍须以下方 JSON 为体，用 Postman、`curl` 等 HTTP 工具按原样结构发送，不得省略 `header` 子对象。

## 样例（tool-box 调试网关）

以下 `kn_id`、`token`、`account_id`、`account_type`、`search` 由调用方替换；布尔值为 JSON **`false`**（非字符串 `"false"`）。

```json
{
  "body": {
    "auth": { "token": "{token}" },
    "limit": 100,
    "need_total": true,
    "properties": ["embeddings_text"],
    "sort": [{ "direction": "", "field": "" }],
    "condition": {
      "operation": "or",
      "sub_conditions": [
        {
          "field": "embeddings_text",
          "operation": "match",
          "value": "{search}"
        },
        {
          "limit_value": 1000,
          "field": "embeddings_text",
          "operation": "knn",
          "value": "{search}",
          "limit_key": "k"
        }
      ]
    }
  },
  "query": {
    "kn_id": "idrm_metadata_kn_object_lbb",
    "ot_id": "metadata",
    "include_logic_params": false,
    "include_type_info": false
  },
  "header": {
    "x-account-id": "{account_id}",
    "x-account-type": "{account_type}"
  }
}
```

## 响应处理示意

接口成功时，返回结构通常为 `status_code` + `headers` + `body.datas`。`datas` 中每条命中记录重点关注 `embeddings_text`（主展示文本）、`_score`（相关度分值）、`_instance_id`（实例标识）。

```json
{
  "status_code": 200,
  "headers": {
    "Content-Type": "application/json",
    "Date": "Tue, 31 Mar 2026 01:52:53 GMT"
  },
  "body": {
    "datas": [
      {
        "_display": null,
        "embeddings_text": "视图技术名：gangwuqujianshefazhanbu_shifanqiyexinxi | 视图业务名：港务区建设发展部_示范企业信息 | 视图UUID：ec3e47b1-f127-4b40-9ac8-e8aaa52a1788 | 所属部门：淮海国际港务区 | 关联信息系统： | 所属主题域：未分组 | 业务对象： | 视图描述：该表用于记录港务区建设发展部所认定的示范企业相关信息，包括企业机构全称、认定部门、认定示范日期、示范项目名称、统一社会信用代码及组织机构代码等，主要用于企业资质管理、示范项目跟踪及政策支持分析等领域。 | 更新周期：其他 | 共享类型：其他 | 开放类型：其他 | \n关联字段：id(自增主键)，jigouquancheng(机构全称)，rendingbumen(认定部门)，rendingshifanriqi(认定示范日期)，shifanxiangmumingcheng(示范项目名称)，tongyishehuixinyongdaima(统一社会信用代码)，zuzhijigoudaima(组织机构代码)",
        "_score": 19.164547,
        "_instance_id": "metadata-__NULL__",
        "_instance_identity": {}
      }
    ]
  }
}
```

从 `body.datas[*].embeddings_text` 解析字段时，**至少必须提取**以下 3 项：

- `view_tech_name`：视图技术名（如 `gangwuqujianshefazhanbu_shifanqiyexinxi`）
- `view_business_name`：视图业务名（如 `港务区建设发展部_示范企业信息`）
- `view_uuid`：视图 UUID（如 `ec3e47b1-f127-4b40-9ac8-e8aaa52a1788`）

在本能力中，**视图与表按同等关系处理**，字段映射约定如下：

- `view_tech_name` 等价于 `table_tech_name`（表技术名称）
- `view_business_name` 等价于 `table_business_name`（表业务名）
- `view_uuid` 作为该表/视图对象的唯一标识

若命中多条，按 `_score` 由高到低列出 Top 候选，并记下可用于职责检索的 **部门名、数据域词**。

## 注意事项

- `token` 须显式提供，不从配置自动补全用户凭证。
- **`header` 不可省略**：空 `x-account-id` / `x-account-type` 可能导致上游 500 且 `error_details` 含 `missing account ID or type`。
- 若结果为空：放宽 `condition`、改写 `search`，或核对 **`query.kn_id` / `ot_id`** 与当前环境是否一致。
