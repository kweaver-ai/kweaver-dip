# data-semantic

数据语义服务技能文档（增强版）。

该技能用于对逻辑视图执行语义理解相关操作，覆盖：
- 查询逻辑视图列表
- 查询单视图语义结果
- 触发单视图/数据源理解
- 批量理解（统计输出）
- 批量业务对象匹配

## 技能信息

- 名称：`数据语义服务-增强版`
- 版本：`1.2.0`
- 可直接调用：`true`
- Skill Key：`data_semantic`

默认配置（来自 `SKILL.md`）：
- `kn_id`: `d6ptuq46vfkhfektuntg`
- `ot_id`: `d6rmtl46vfkhfektuoe0`
- `base_url`: `https://dip.aishu.cn/api/data-semantic/v1`
- `logic_view_base_url`: `https://dip.aishu.cn/api/data-view/v1`

## `kn_id` 与 `ot_id` 说明

这两个 ID 主要用于 `match`（批量对象匹配）操作：

- `kn_id`：通用知识网络 ID（Knowledge Network ID）
  - 含义：指定要在哪一个知识网络中做匹配。
  - 作用：限定匹配上下文，不同网络的对象语义可能不同。
  - 使用建议：优先使用当前业务域对应的知识网络，不建议跨域复用。

- `ot_id`：业务对象类 ID（Object Type ID）
  - 含义：指定匹配目标对象类（例如“客户”“订单”“设备”等对象类型）。
  - 作用：把 `entries` 中的名称匹配到某个对象类语义空间。
  - 使用建议：与 `kn_id` 保持同一网络内的一致性，避免“网络A + 对象类B(来自网络C)”的混用。

### 什么时候必须传

- `match` 操作：`kn_id` 和 `ot_id` 都应提供（显式传入或使用技能默认配置）。
- 其他操作（`list/query/understand/batch`）：通常不需要这两个参数。

### 取值来源建议

1. 优先使用 `SKILL.md` 中已配置的默认值（稳定场景）。
2. 多环境/多租户场景下，建议在调用时显式传入，避免误用默认配置。
3. 若出现匹配结果异常，先检查：
   - `kn_id` 是否指向正确业务网络；
   - `ot_id` 是否确实属于该网络；
   - `entries.name` 是否为业务可识别名称（避免简称、歧义词）。

## 功能速览

| 操作 | 说明 | 关键参数 |
|------|------|----------|
| `list` | 查询逻辑视图列表 | `keyword`, `datasource_id` |
| `query` | 查询语义理解结果 | `form_view_id` |
| `understand` | 触发表单理解 | `form_view_id` 或 `datasource_id` |
| `batch` | 批量理解（<=100） | `form_view_ids` |
| `match` | 批量对象匹配 | `kn_id`, `ot_id`, `entries` |

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `operation` | 是 | `list/query/understand/batch/match` |
| `auth_token` | 是 | JWT Token |
| `form_view_id` | 条件必填 | `query/understand` 场景使用 |
| `datasource_id` | 条件必填 | 数据源理解场景使用 |
| `keyword` | 否 | 逻辑视图搜索关键字 |
| `form_view_ids` | 条件必填 | `batch` 场景使用，数组 |
| `entries` | 条件必填 | `match` 场景使用，对象名列表 |

## 快速开始

### 1) 查询逻辑视图列表

```bash
operation: list
auth_token: <JWT>
keyword: 用户
```

### 2) 查询语义理解结果（单视图）

```bash
operation: query
auth_token: <JWT>
form_view_id: <uuid>
```

输出包含：字段语义表格 + 业务对象表格 + 属性表格。

### 3) 触发单视图理解

```bash
operation: understand
auth_token: <JWT>
form_view_id: <uuid>
```

### 4) 批量理解（仅统计）

```bash
operation: batch
auth_token: <JWT>
form_view_ids: [<uuid1>, <uuid2>, ...]
```

说明：批量输出仅包含统计结果，不返回每个视图的完整语义详情。

### 5) 数据源批量理解

```bash
operation: understand
auth_token: <JWT>
datasource_id: <uuid>
```

### 6) 批量对象匹配

```bash
operation: match
auth_token: <JWT>
kn_id: <配置值或显式传入>
ot_id: <配置值或显式传入>
entries: [{"name": "客户信息"}]
```

## 状态机说明

| 状态码 | 状态名称 | 处理动作 |
|--------|----------|----------|
| 0 | 未理解 | 触发生成 -> 轮询等待 -> 状态2后提交确认 -> 重新生成 -> 轮询 -> 提交确认 -> 完成 |
| 1 | 理解中 | 轮询等待 -> 状态2/3/4 -> 按状态2流程处理 |
| 2 | 待确认 | 提交确认 -> 重新生成 -> 轮询等待 -> 状态2后提交确认 -> 完成 |
| 3 | 已完成 | 触发重新生成 -> 轮询等待 -> 状态2后提交确认 -> 完成 |
| 4 | 待确认(重新理解) | 触发重新生成 -> 轮询等待 -> 状态2后提交确认 -> 完成 |
| 5 | 理解失败 | 输出失败原因，终止 |

注意：批量理解时，即使当前是已完成（3）或待确认（4），也会触发重新理解。

## 大数据量处理策略

保护机制：
- `<=50`：直接执行
- `>50`：建议改用 Python 脚本
- `>1000`：建议非工作时间执行
- `>5000`：建议联系技术团队

脚本位于：`scripts/data_semantic_batch.py`

```bash
# 数据源批量理解
python scripts/data_semantic_batch.py --token <JWT> --datasource-id <UUID>

# 批量视图理解
python scripts/data_semantic_batch.py --token <JWT> --view-ids <id1,id2>

# 断点续传
python scripts/data_semantic_batch.py --token <JWT> --resume
```

## 输出说明

单视图输出：
- 数据语义理解报告（视图技术名、业务名、状态）
- 识别统计（字段语义补全数、业务对象与属性数）
- 字段语义补全明细（已补全/未补全）
- 业务对象识别结果（对象属性映射）

批量输出：
- 仅统计报告：总数、成功数、失败数

## 注意事项

1. 所有操作都需要有效 `auth_token`。
2. API 返回可能出现 GBK 编码，需要做兼容解码（如 latin1 中转）。
3. `match` 操作涉及中文内容时，注意避免请求体乱码。
4. 字段语义与业务对象数据来自不同表，结果可能存在差异。

## 相关文件

- 技能定义：`SKILL.md`
- 状态机：`references/state-machine.md`
- 输出格式：`references/output-formats.md`
- 字段映射：`references/field-mapping.md`
- API 参考：`references/api.md`
- 批处理脚本：`scripts/data_semantic_batch.py`
