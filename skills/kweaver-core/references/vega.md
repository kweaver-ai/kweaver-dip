# Vega 命令参考

Vega 可观测平台：Catalog 管理、数据资源查询、连接器类型、健康巡检。

## 概览

```bash
kweaver vega                         # 帮助信息
kweaver vega health                  # 服务健康检查
kweaver vega stats                   # Catalog 数量统计
kweaver vega inspect                 # 聚合诊断（health + catalog 数量 + 运行中的 discover 任务）
```

## Catalog

```bash
kweaver vega catalog list [--status healthy|degraded|unhealthy|offline|disabled] [--limit N] [--offset N]
kweaver vega catalog get <id>
kweaver vega catalog health <ids...> | --all
kweaver vega catalog test-connection <id>
kweaver vega catalog discover <id> [--wait]
kweaver vega catalog resources <id> [--category table|index|...] [--limit N]
```

## Resource

```bash
kweaver vega resource list [--catalog-id <id>] [--category table] [--status active] [--limit N] [--offset N]
kweaver vega resource get <id>
kweaver vega resource query <id> -d '<json-body>'
kweaver vega resource preview <id> [--limit N]
```

## Connector Type

```bash
kweaver vega connector-type list
kweaver vega connector-type get <type>
```

## 公共参数

所有子命令支持：

- `-bd, --biz-domain <s>` — 业务域（默认 `bd_public`）
- `--pretty` — 格式化 JSON 输出（默认开启）

## 端到端示例

```bash
# 巡检
kweaver vega inspect
kweaver vega catalog health --all

# 查看 catalog 下的资源
kweaver vega catalog list
kweaver vega catalog resources <catalog-id> --category table

# 预览资源数据
kweaver vega resource preview <resource-id> --limit 5

# 查询资源数据
kweaver vega resource query <resource-id> -d '{"page": 1, "limit": 10}'

# 查看连接器类型
kweaver vega connector-type list
```
