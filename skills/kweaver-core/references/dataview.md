# 数据视图命令参考（dataview）

平台 **mdl-data-model** 服务暴露的原子视图 / 自定义视图（HTTP：`/api/mdl-data-model/v1/data-views`）。从数据源建表映射到对象类时，通常先对应一张原子数据视图。

## 命令

```bash
kweaver dataview list [--datasource-id <id>] [--type <atomic|custom>] [--limit <n>] [-bd value] [--pretty]
kweaver dataview find --name <name> [--exact] [--datasource-id <id>] [--wait] [--no-wait] [--timeout <ms>] [-bd value] [--pretty]
kweaver dataview get <id> [-bd value] [--pretty]
kweaver dataview delete <id> [-y] [-bd value]
```

### 参数说明

| 选项 | 含义 |
|------|------|
| `--datasource-id` | 按数据源 ID 过滤（`data_source_id`） |
| `--type` | 视图类型，如 `atomic`、`custom`（按平台实际枚举） |
| `--limit` | 返回条数上限；**`-1` 表示不限制**（与省略 `--limit` 时 CLI 默认行为一致） |
| `--name` | 仅用于 **`find`**：作为服务端 `keyword`（模糊）；加 `--exact` 时在客户端再按名称 **完全一致** 过滤 |
| `--exact` | 仅 **`find`**：在 keyword 结果上再做精确匹配 |
| `--wait` / `--no-wait` | 仅 **`find`**：是否轮询直到出现或超时（与 `bkn create-from-ds` 内「先找已有原子视图」一致） |
| `--timeout` | 仅 **`find`**：与 `--wait` 配合的总等待时间（毫秒） |
| `-bd` / `--biz-domain` | 业务域；默认来自 `kweaver config show` |

### `list` 与 `find`

| 子命令 | 作用 |
|--------|------|
| **`list`** | 仅列出视图，可按数据源 / 类型 / 条数筛选；**不支持按名称关键字搜索** |
| **`find`** | 按名称查找：默认 **模糊**（服务端 keyword）；`--exact` 为 **精确**（keyword + 客户端 `name ===`）；`--wait` 用于等待视图就绪 |

后端仅提供 `keyword` 模糊参数；**精确匹配** 由客户端在 keyword 结果上过滤实现。

## SDK（TypeScript）

```ts
const all = await client.dataviews.list({ datasourceId: "ds-id" });
const fuzzy = await client.dataviews.find("BOM", { wait: false });
const exact = await client.dataviews.find("orders", {
  datasourceId: "ds-id",
  exact: true,
  wait: true,
});
```

## 端到端示例

```bash
# 列出某一数据源下的视图（无关键字）
kweaver dataview list --datasource-id <ds-uuid> --pretty

# 按名称模糊搜索
kweaver dataview find --name BOM --pretty

# 精确名称 + 数据源 + 不等待（替代旧 find-by-table --no-wait）
kweaver dataview find --name 产品信息 --exact --datasource-id <ds-uuid> --no-wait --pretty

# 精确名称 + 轮询等待（与 create-from-ds 内部行为一致）
kweaver dataview find --name orders --exact --datasource-id <ds-uuid> --wait --pretty
```

## 与 BKN 的关系

- `kweaver bkn create-from-ds`：对每张目标表会先 **`findDataView`（exact + wait）**，已有则复用视图 ID，否则再 **create** 原子视图。调试可单独用 `kweaver dataview find`。

## 排障

- 结果为空：检查 `kweaver config show` 的 business domain 是否与平台一致；必要时 `kweaver config set-bd <uuid>`。
- `list` 结果过多：加 `--datasource-id` 或 `--limit`；按名称搜改用 `find`。
