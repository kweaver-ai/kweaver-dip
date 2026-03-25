---
name: archive-protocol
version: "1.0.0"
description: 全局归档协议。只要任务需要写入任何文件（含 PLAN.md、报告、JSON 等归档物），必须按本技能执行 sessionKey→ARCHIVE_ID、TIMESTAMP、双轨路径、回读校验与状态回执。
metadata:
  {
    "openclaw": {}
  }
---

# 全局归档协议

只要当前任务需要写入任何文件，就必须执行本协议。

归档物包括但不限于：`PLAN.md`、`report.md`、`summary.md`、`result.json`、`notes.md`。

**优先级**：本协议高于任何业务协议。定时计划类任务在 `schedule-plan` 技能中约定，且只能调用本归档规则，不能覆盖。

## 【身份文件】

若任务需要人格/身份设定，只认：

- `SOUL.md`
- `IDENTITY.md`

未确认可读或已注入上下文前，不得声称「已成功读取」。

## 【ARCHIVE_ID 规则】

`ARCHIVE_ID` 的唯一来源是 `session_status` 工具返回结果中的 `sessionKey`。

必须执行：

1. 调用 `session_status`
2. 读取 `sessionKey`
3. 使用 `:` 作为分隔符切分 `sessionKey`
4. 取切分结果的最后一段作为 `ARCHIVE_ID`

禁止：

- 禁止从其他来源生成或推断 `ARCHIVE_ID`
- 禁止在 `sessionKey` 为空、缺失或无法切分时伪造 `ARCHIVE_ID`
- 若失败，立即中止归档并返回：`ARCHIVE_STATUS: BLOCKED` / `ARCHIVE_REASON: invalid sessionKey`

## 【TIMESTAMP 规则】

生成归档文件前，必须执行：`date "+%Y-%m-%d-%H-%M-%S"`

时间格式必须固定为：`YYYY-MM-DD-HH-MM-SS`（禁止带空格或冒号）。

## 【归档路径规则】

路径执行双轨制，严禁混淆：

1. **计划文件（PLAN.md 专属）**：`archives/{ARCHIVE_ID}/PLAN.md`
2. **普通归档物（其他所有生成物）**：`archives/{ARCHIVE_ID}/{TIMESTAMP}/{ORIGIN_NAME}`

## 【写入后强制校验】

任何归档文件写入后，必须立即回读校验。未完成校验前，不得声称「已成功归档」。

校验内容：文件存在、路径正确、内容非空、关键字段存在、内容与当前任务一致。

## 【状态回执】

- 失败：`ARCHIVE_STATUS: BLOCKED` | `ARCHIVE_REASON: <原因>`
- 成功：`ARCHIVE_STATUS: OK` | `ARCHIVE_ROOT: archives/{ARCHIVE_ID}/`

## 【执行顺序】

1. 调用 `session_status` 提取 `ARCHIVE_ID`。
2. 生成 `TIMESTAMP`。
3. 判定路径：`PLAN.md` 去根目录，其他去 `TIMESTAMP` 目录。
4. 写入并回读校验。
5. 返回状态。
