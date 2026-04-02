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
kweaver agent trace <conversation_id> [--pretty|--compact]
```

## Trace 数据

```bash
kweaver agent trace <conversation_id>
```

获取指定会话的 trace 数据，用于追踪数据流、调试问题、构建证据链。

选项：
- `--pretty`：格式化 JSON 输出（默认）
- `--compact`：紧凑 JSON 输出

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
## Trace 数据分析

当用户需要追踪数据流、调试问题、理解结果如何从 trace 数据中得出时，使用 `kweaver agent trace` 命令获取 trace 数据并构建证据链。

### 使用场景

- 用户想了解某个结果是如何得出的
- 用户需要追踪数据在系统中的流转
- 用户想通过 trace 数据调试问题
- 用户询问"证据链"或"因果关系"

### 操作步骤

1. **获取 Conversation ID**：从用户处获取或通过 `kweaver agent sessions <agent_id>` 查询

2. **获取 Trace 数据**：
   ```bash
   kweaver agent trace <conversation_id>
   ```
   
   选项：
   - `--pretty`：格式化输出（默认）
   - `--compact`：紧凑输出

3. **解析并分析 Trace 数据**：
   - 解析 JSON 响应
   - 识别关键 spans 及其关系
   - 查找与用户问题匹配的事件
   - 构建操作时间线

4. **构建证据链**：
   ```
   [步骤 1] → [步骤 2] → [步骤 3] → [结果]
      ↓           ↓           ↓
   [输入]     [处理]      [输出]
   ```

5. **呈现分析结果**：
   - 清晰的步骤说明
   - 每步的关键数据点
   - 步骤间的因果关系
   - 回答用户问题的结论

### 示例

**用户问题**："为什么订单失败了？"

**证据链**：
```
[HTTP 请求] → [校验] → [支付检查] → [失败]
      ↓           ↓           ↓          ↓
   订单数据    校验通过     余额不足    订单被拒绝
   已接收      但有警告     已检测到
```

**解释**：
1. 14:30:00 收到订单请求
2. 校验通过但标记了警告
3. 支付检查发现余额不足
4. 订单因支付失败被拒绝

### 分析技巧

- 查找 trace 中的错误事件或异常
- 关注时间戳以理解执行顺序
- 识别 spans 之间的父子关系
- 突出流程中的关键决策点
- 向用户解释时使用清晰、非技术性的语言