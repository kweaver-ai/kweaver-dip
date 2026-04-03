# Windows 环境下 HTTP 取数 / Token 排错备忘

本文记录在本仓库 **问数链路**（`text2sql`、`kweaver token`、Python `urllib` 等）在 **Windows** 上实际踩坑与纠偏方式，供以后遇到同类现象时快速对照。

**主流程与请求体约定**（`show_ds` / `gen_exec`、样例结构）见 **[text2sql.md](text2sql.md)**；本文仅补充 Windows 侧执行与排错。

---

## 1. PowerShell 与 CMD 语法混用

**现象**：命令行报错，提示 `&&`、`for /f` 等「不是有效的语句分隔符」或解析失败。

**原因**：Cursor/终端默认常为 **PowerShell**，而网上复制的片段多为 **CMD** 语法，二者不通用。

**纠偏**：

- 在 PowerShell 中：用 `;` 分隔命令，用 `$env:NAME = 'value'` 设环境变量，不要用 `set A=B && ...`。
- 需要 CMD 行为时：显式 `cmd /c "..."` 包一层。
- 跨平台脚本优先用仓库内 **Python 示例**（`scripts/text2sql_request_example.py`），减少对 Shell 方言的依赖。

---

## 2. `UnicodeEncodeError: latin-1`（请求头 / `putheader`）

**现象**：Python 发起 HTTPS 请求时在 `http.client` / `putheader` 处报错，提示 `'latin-1' codec can't encode characters`。

**原因**：`urllib` 要求 HTTP 头值为 **latin-1**。若环境变量 **`TEXT2SQL_TOKEN`**（或 `Authorization` 同源内容）里混入了 **非 ASCII 字符**，就会失败。常见来源：

- PowerShell：`(npx kweaver token 2>&1 | Out-String).Trim()` 把 **stderr 与 stdout 合并**，stderr 里若有中文提示，会拼进「token」字符串。

**纠偏**：

- 取 token 时尽量 **只收 stdout**，例如：`cmd /c "npx kweaver token 2>nul"`，再 `.Trim()`。
- 在脚本侧对 token 做 **清洗**：只保留 ASCII 行或逐字符过滤 `ord(c) < 128`，取最长疑似 JWT 的一行（见本仓库临时任务中 `clean_token()` 思路）。
- 避免把整段 `Out-String`（含多行、含报错）原样赋给 `TEXT2SQL_TOKEN`。

---

## 3. Python `subprocess` 调用 `npx` 报 `FileNotFoundError`

**现象**：`subprocess.check_output(['npx', 'kweaver', 'token'], ...)` 提示找不到指定文件。

**原因**：子进程 **PATH** 与当前交互式终端不一致，`npx` 不在子进程可见路径中（Windows 常见）。

**纠偏**：

- 优先用 **`cmd /c "npx kweaver token 2>nul"`** 由外层 Shell 解析，或确保 `npx` 所在目录已加入系统 PATH 并在同一会话中验证。
- 或在脚本中传入 **`shell=True`** 并调用完整命令字符串（注意安全边界），或写死 `npx` 的绝对路径（按本机安装位置）。

---

## 4. 终端输出中文乱码（JSON 本身正常）

**现象**：`gen_exec` / API 返回的 JSON 在控制台打印后，「企业名称」等字段显示为乱码。

**原因**：响应体多为 **UTF-8**；Windows 控制台 / PowerShell 默认代码页与管道编码不一致，**显示层**解码错误；**并非**接口未返回中文。

**纠偏**：

- 将 stdout **重定向到 UTF-8 文件** 再打开，例如 PowerShell：`... | Out-File -Encoding utf8 result.json`。
- 或在 Python 内 `open(path, 'w', encoding='utf-8')` 写入 `json.dumps(..., ensure_ascii=False)`。
- 需要控制台可读时：可先 `chcp 65001` 并设置 `[Console]::OutputEncoding`，但文件落盘更稳。

---

## 5. 快速自检清单（遇到请求失败时）

1. 当前终端是 **PowerShell 还是 CMD**？语法是否与之一致？
2. `TEXT2SQL_TOKEN` 是否 **仅含 ASCII**、无多行、无中文提示混入？
3. 本机 `npx kweaver token` 在 **同一终端** 是否可手动成功？
4. 若仅「显示乱码」，先试 **UTF-8 文件** 保存响应再查看。

---

## 与仓库文档的关系

- 正式调用约定仍以 [text2sql.md](text2sql.md) 为准；本文 **不替代** 其中的请求体结构与 `show_ds` / `gen_exec` 顺序约束。
- [text2sql.md](text2sql.md) 中「结构参考文件」表、Windows PowerShell 示例与「注意事项」已 **跳转回本文**，便于双向查阅。
- 新增 Windows 特有坑位可继续追加本节，保持 **现象 → 原因 → 纠偏** 三段式即可。
