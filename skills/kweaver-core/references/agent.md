# Agent 命令参考

Decision Agent CRUD、发布管理与对话。

与 CLI 一致：运行 `kweaver agent` 或 `kweaver agent chat --help` 等可查看与当前版本同步的用法。`history` 的参数为 **conversation_id**（由 `agent sessions` 返回），不是 `agent_id` + `session_id` 两个参数。

## CRUD 命令

```bash
kweaver agent list [--name <kw>] [--limit 50] [--verbose]
kweaver agent get <agent_id> [--verbose]
kweaver agent get-by-key <key>
kweaver agent create --name <name> --profile <profile> --llm-id <model_id> [--key <key>] [--product-key DIP|AnyShare|ChatBI] [--system-prompt <sp>] [--llm-max-tokens 4096]
kweaver agent update <agent_id> [--name <n>] [--profile <p>] [--system-prompt <sp>]
kweaver agent delete <agent_id> [-y]
```

## 发布管理

```bash
kweaver agent publish <agent_id>
kweaver agent unpublish <agent_id>
```

## 对话

```bash
kweaver agent chat <agent_id> -m '<message>' [--conversation-id <id>] [--stream/--no-stream]
kweaver agent chat <agent_id>                    # 交互式模式
kweaver agent sessions <agent_id> [--limit <n>]
kweaver agent history <conversation_id> [--limit <n>]
```

## 说明

- `create` 需要 `--llm-id`，可通过模型工厂 API 查询可用 LLM：`GET /api/mf-model-manager/v1/llm/list?page=1&size=100`
- `update` 采用 read-modify-write 模式：先 GET 当前配置，修改字段后 PUT 回去
- `list` 只返回已发布的 agent；`get` 可以获取未发布的（需要是 owner）
- `publish` 后 agent 才会出现在 `list` 里

## 端到端示例

```bash
# 创建 → 发布 → 对话 → 清理
kweaver agent create --name "测试助手" --profile "SDK 测试用" --llm-id <model_id> --system-prompt "你是一个测试助手"
kweaver agent publish <agent_id>
kweaver agent chat <agent_id> -m "你好"
kweaver agent unpublish <agent_id>
kweaver agent delete <agent_id> -y

# 多轮对话
kweaver agent chat <agent_id> -m "分析库存数据" --no-stream
kweaver agent chat <agent_id> -m "给出改进建议" --conversation-id <conv_id>
kweaver agent history <conv_id>
```
