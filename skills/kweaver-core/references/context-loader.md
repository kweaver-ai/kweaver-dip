# Context Loader 命令参考

MCP JSON-RPC 协议的分层检索。需要先配置 KN 上下文。

## 配置

```bash
kweaver context-loader config set --kn-id kn-123 [--name myconfig]
kweaver context-loader config use myconfig
kweaver context-loader config list
kweaver context-loader config show
kweaver context-loader config remove myconfig
```

## MCP 内省

```bash
kweaver context-loader tools           # 可用工具列表
kweaver context-loader resources       # 可用资源列表
kweaver context-loader resource <uri>  # 读取资源
kweaver context-loader templates       # 资源模板
kweaver context-loader prompts         # 可用 prompt
kweaver context-loader prompt <name> [--args '<json>']
```

## Layer 1 — Schema 搜索

```bash
kweaver context-loader kn-search "Pod" [--only-schema]
kweaver context-loader kn-schema-search "Pod" [--max 10]
```

## Layer 2 — 实例查询

```bash
# 条件查询
kweaver context-loader query-object-instance '{"ot_id": "ot-1", "condition": {"operation": "and", "sub_conditions": [{"field": "name", "operation": "==", "value_from": "const", "value": "web-pod"}]}, "limit": 5}'

# 子图查询
kweaver context-loader query-instance-subgraph '{"relation_type_paths": [{"start_ot_id": "ot-1", "paths": [{"rt_id": "rt-1", "direction": "positive"}]}]}'
```

## Layer 3 — 逻辑属性 & Action

```bash
# 获取逻辑属性
kweaver context-loader get-logic-properties '{"ot_id": "ot-1", "query": "status", "_instance_identities": [{"id": "123"}], "properties": ["status", "cpu"]}'

# 获取 Action 信息
kweaver context-loader get-action-info '{"at_id": "at-1", "_instance_identity": {"id": "123"}}'
```

## JSON 格式

### condition

```json
{
  "operation": "and",
  "sub_conditions": [
    {"field": "name", "operation": "==", "value_from": "const", "value": "Pod-1"},
    {"field": "status", "operation": "in", "value_from": "const", "value": ["Running", "Pending"]}
  ]
}
```

支持的 operation: `==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not_in`, `like`（模糊匹配）

> **注意**：`match`（全文检索）仅在 OpenSearch 索引模式下可用，SQL 视图数据源会返回 500 错误。优先使用 `like` 做文本模糊匹配。`eq`、`gt`、`lt` 等不是合法操作符，请用 `==`、`>`、`<`。
