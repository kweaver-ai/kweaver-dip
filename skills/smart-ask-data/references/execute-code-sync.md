# 子能力：Execute Code Sync（同步执行代码）

在 **问数主流程第 4 步（可选）** 调用：当 `text2sql` / `gen_exec` 返回的数据仍需 **二次加工** 时使用（聚合、清洗、派生指标、透视、与 `event` 中嵌入的上游结果一起做计算等）。

## 何时使用

- 需要 Python/JS/shell 逻辑，且平台侧不便一步 SQL 完成。
- 需要将多段结果在内存中合并（由上游把数据放入 `event`）。

## 何时跳过

- 仅需展示 `gen_exec` 原始结果或简单图表 → 直接进入总结或 `json2plot`。

## 调用要点

- **Query**：`poll_interval`、`sync_timeout` 按 [execute_code_sync SKILL](../../execute_code_sync/SKILL.md) 说明设置。
- **Body**：`code`（handler 模板）、`language`、`timeout`、`event`（可传入上一步结果摘要或结构化数据）。
- **认证**：Header `Authorization` 与 `body.auth.token` 一致。

## 完整说明

配置以编排默认 [../config.json](../config.json) 中 `tools.execute_code_sync` 为准。
请求 URL 约定为：`base_url` + `tools.execute_code_sync.url_path`。

## 请求方式（先写临时脚本，再执行临时脚本）

**执行顺序（强约束）**：

1. **先** 在本机任务目录新建临时脚本（例如 `_tmp_exec_sync_<主题>.py` 或 `_tmp_exec_sync_<主题>.sh`，**不要**覆盖仓库样例）。
2. 按本文样例结构组装 Query（`poll_interval`、`sync_timeout`）与 Body（`code`、`event` 等），POST 至 `base_url` + `tools.execute_code_sync.url_path`。
3. **再** 在终端仅执行你的临时脚本。

**禁止**：

- **禁止**直接把 `../scripts/execute_code_sync_request_example.py` / `.sh` 当任务入口执行。
- **禁止**在仓库 **`skills/`** 及其任意子目录下创建临时脚本；若仓库内另有 **`.claude/skills/`** 等 skill 同步树，**同样禁止** 在其下创建。**宜** 使用工作区根目录、系统临时目录（如 `/tmp`、`%TEMP%`）等与上述路径隔离的位置。

### 结构参考文件（只读对照，不得当执行入口）

| 类型 | 参考文件 | 说明 |
|------|----------|------|
| **推荐（跨平台）** | [`../scripts/execute_code_sync_request_example.py`](../scripts/execute_code_sync_request_example.py) | 支持 `--code-file`、`--event-file`、`--poll-interval`、`--sync-timeout`；标准库 `urllib`；`--insecure` 跳过 TLS；`-c ../config.json` 对齐路径与业务域。 |
| **备选（curl）** | [`../scripts/execute_code_sync_request_example.sh`](../scripts/execute_code_sync_request_example.sh) | 支持 `-C` / `-E` 传入代码与事件文件；依赖 `python3` 组装 JSON；`-K` 跳过 TLS。 |

### 执行示例（仅执行你新建的临时脚本）

Linux/macOS（Bash）：

```bash
export EXECUTE_CODE_SYNC_TOKEN="$(kweaver token | tr -d '\r\n')"
python path/to/_tmp_exec_sync.py --insecure \
  --poll-interval 0.5 --sync-timeout 300 --timeout 120
```

Windows PowerShell：

```powershell
$env:EXECUTE_CODE_SYNC_TOKEN = (npx kweaver token 2>&1 | Out-String).Trim()
python path\to\_tmp_exec_sync.py --insecure `
  --poll-interval 0.5 --sync-timeout 300 --timeout 120
```

**Bash + curl**（需 `python3` 组装 JSON）：

```bash
TOKEN="$(kweaver token | tr -d '\r\n')"
./path/to/_tmp_exec_sync.sh -t "$TOKEN" --poll-interval 0.5 --sync-timeout 300 -K
```

## 样例（对 gen_exec 结果做占比校验或派生列）

**Header**

```http
Content-Type: application/json
x-business-domain: bd_public
Authorization: {token}
```

**请求 Body（JSON）**

```json
{
  "auth": { "token": "{token}" },
  "session_id": "sess-ask-data-001",
  "code": "from typing import Dict, Any, List\n\ndef handler(event: Dict[str, Any]) -> Any:\n    rows: List[dict] = event.get(\"rows\", [])\n    total = sum(float(r.get(\"amount\", 0) or 0) for r in rows)\n    out = []\n    for r in rows:\n        amt = float(r.get(\"amount\", 0) or 0)\n        out.append({**r, \"ratio\": round(amt / total, 4) if total else 0})\n    return {\"rows\": out, \"total_amount\": total}",
  "language": "python",
  "timeout": 120,
  "event": {
    "rows": [
      { "region_name": "华东", "amount": 1200000 },
      { "region_name": "华北", "amount": 800000 }
    ]
  },
  "stream": false,
  "config": { "background": "", "session_type": "redis" }
}
```

**Query 参数（`application/x-www-form-urlencoded`）**

```json
{ "poll_interval": 0.5, "sync_timeout": 300 }
```

**响应示意**

```json
{
  "id": "exec_20260330205719_4d5e6cc7",
  "session_id": "sess-agent-default",
  "status": "completed",
  "exit_code": 0,
  "error_message": null,
  "stdout": "",
  "stderr": "",
  "return_value": {
    "rows": [
      { "region_name": "华东", "amount": 1200000, "ratio": 0.6 },
      { "region_name": "华北", "amount": 800000, "ratio": 0.4 }
    ],
    "total_amount": 2000000.0
  },
  "metrics": {
    "duration_ms": 24.91021901369095,
    "cpu_time_ms": 4.200921999995444
  }
}
```
