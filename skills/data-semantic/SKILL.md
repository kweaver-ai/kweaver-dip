---
name: 数据语义服务-增强版
description: |
  数据语义服务 API - 提供表单视图的语义理解功能。
  用于: (1) 查询字段语义和业务对象识别结果 (2) 触发/批量理解表单视图 (3) 批量业务对象匹配
version: 1.2.0
user-invocable: true
metadata:
  openclaw:
    skillKey: data_semantic
    emoji: "🧠"
config:
  kn_id: "d6ptuq46vfkhfektuntg"
  ot_id: "d6rmtl46vfkhfektuoe0"
  base_url: "https://dip.aishu.cn/api/data-semantic/v1"
  logic_view_base_url: "https://dip.aishu.cn/api/data-view/v1"
---

# 功能速览

| 操作 | 说明 | 关键参数 |
|------|------|----------|
| `list` | 查询逻辑视图列表 | `keyword`, `datasource_id` |
| `query` | 查询语义理解结果 | `form_view_id` |
| `understand` | 触发表单理解 | `form_view_id` 或 `datasource_id` |
| `batch` | 批量理解（≤100个） | `form_view_ids` |
| `match` | 批量对象匹配 | `kn_id`, `ot_id`, `entries` |

# 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `operation` | ✅ | list/query/understand/batch/match |
| `auth_token` | ✅ | JWT Token |
| `form_view_id` | query/understand | 单视图 ID |
| `datasource_id` | 数据源理解 | 数据源 UUID |
| `keyword` | 可选 | 关键字搜索 |

# 操作示例

## 1. 查询视图列表
```bash
operation: list
keyword: 用户
```

## 2. 查询语义结果（输出完整报告）
```bash
operation: query
form_view_id: <uuid>
```

> 输出：字段语义表格 + 业务对象表格 + 属性表格

## 3. 单视图理解（输出完整报告）
```bash
operation: understand
form_view_id: <uuid>
```

> 输出：字段语义表格 + 业务对象表格 + 属性表格

## 4. 批量理解（仅统计报告）
```bash
operation: batch
form_view_ids: [<uuid1>, <uuid2>, ...]
```

> 输出：仅统计报告，不输出详细语义

## 5. 数据源批量理解
```bash
operation: understand
datasource_id: <uuid>
```

> ≤50个视图直接执行，>50个调用Python脚本

## 6. 批量对象匹配
```bash
operation: match
kn_id: <配置值>
ot_id: <配置值>
entries: [{"name": "客户信息"}]
```

# 状态机

| 状态码 | 状态名称 | 处理动作 |
|--------|----------|----------|
| 0 | 未理解 | 触发生成 → 轮询等待 → 状态2后提交确认 → 重新生成 → 轮询 → 提交确认 → 完成 |
| 1 | 理解中 | 轮询等待 → 状态2/3/4 → 同状态2处理 |
| 2 | 待确认 | 提交确认 → 重新生成 → 轮询等待 → 状态2后提交确认 → 完成 |
| 3 | 已完成 | 触发重新生成 → 轮询等待 → 状态2后提交确认 → 完成 |
| 4 | 待确认(重新理解) | 触发重新生成 → 轮询等待 → 状态2后提交确认 → 完成 |
| 5 | 理解失败 | 输出失败原因，终止 |

> ⚠️ 批量理解时，无论当前状态是已完成(3)还是待确认(4)，都会触发重新理解

# 大数据量处理

## 保护机制

- **≤50 个** → 直接执行
- **>50 个** → 建议使用 Python 脚本
- **>1000 个** → 提醒非工作时间执行
- **>5000 个** → 建议联系技术团队

## Python 脚本

```bash
# 数据源批量理解
python scripts/data_semantic_batch.py --token <JWT> --datasource-id <UUID>

# 批量视图理解
python scripts/data_semantic_batch.py --token <JWT> --view-ids <id1,id2>

# 断点续传
python scripts/data_semantic_batch.py --token <JWT> --resume
```

# 输出格式

## 单视图输出（含业务对象表格）

**📊 数据语义理解报告**

| 项目 | 内容 |
|------|------|
| 视图技术名称 | `<tech_name>` |
| 视图业务名称 | `<biz_name>` |
| 理解状态 | `<status_name>` |

**📈 识别统计**

| 类别 | 统计 |
|------|------|
| 字段语义 | 总字段: `<total>`, 已补全: `<completed>` |
| 业务对象 | 对象: `<count>` 个, 属性: `<attr_count>` 个 |

## 📋 字段语义补全

### 已补全字段

| 技术名称 | 业务名称 | 字段角色 | 字段描述 |
|----------|----------|----------|----------|
| user_id | 用户ID | 业务主键 | 用户唯一标识 |
| user_name | 用户名称 | 业务特征 | 用户姓名 |
| create_time | 创建时间 | 时间字段 | 记录创建时间 |

### 未补全字段

| 技术名称 | 字段类型 | 字段描述 |
|----------|----------|----------|
| ext_field1 | VARCHAR | 扩展字段 |

## 🏢 业务对象识别结果

### 1️⃣ <业务对象名称>

| 属性名称 | 字段技术名称 | 字段业务名称 | 字段角色 | 字段描述 |
|----------|--------------|--------------|----------|----------|
| 客户ID | customer_id | 客户编号 | 业务主键 | 客户唯一标识 |
| 客户名称 | customer_name | 客户名称 | 业务特征 | 客户姓名 |

## 批量输出（仅统计报告）

**🧠 批量理解报告**

| 项目 | 内容 |
|------|------|
| 总视图数 | `<total_count>` |
| 成功 | `<success_count>` |
| 失败 | `<fail_count>` |

> 批量理解仅输出统计报告，如需详情请单独查询

# 注意事项

1. **Token 必填** - 所有操作都需要有效 JWT
2. **编码问题** - API 返回可能为 GBK，需用 latin1 解码
3. **中文乱码** - match 操作用 `echo | curl -d @-`
4. **数据差异** - 字段语义和业务对象来自不同表