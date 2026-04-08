# Agents WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `agents.list` | 无参数。 | `{ agents }`；`agents[]` 元素通常含 `{ agentId, name, workspace, model?, avatar?, emoji? }`。 | 列出可管理的 agent。 |
| `agents.create` | `name*`: string，名称。<br>`workspace*`: string，工作区路径。<br>`emoji`: string，表情或 reaction。<br>`avatar`: string，头像或图标内容。 | `{ ok, agent }`；`agent` 通常含 `{ agentId, name, workspace, avatar?, emoji? }`。 | 创建 agent。 |
| `agents.update` | `agentId*`: string，agent ID。<br>`name`: string，名称。<br>`workspace`: string，工作区路径。<br>`model`: string，模型 ID。<br>`avatar`: string，头像或图标内容。 | `{ ok, agent }`；`agent` 是更新后的 agent 对象。 | 更新 agent。 |
| `agents.delete` | `agentId*`: string，agent ID。<br>`deleteFiles`: boolean，删除会话时是否连带文件。 | `{ ok, agentId, deletedFiles? }`。 | 删除 agent。 |
| `agents.files.list` | `agentId*`: string，agent ID。 | `{ files }`；`files[]` 元素通常含 `{ name, path, size?, updatedAtMs? }`。 | 列出 agent 文件。 |
| `agents.files.get` | `agentId*`: string，agent ID。<br>`name*`: string，名称。 | `{ name, content, path? }`。 | 读取 agent 文件。 |
| `agents.files.set` | `agentId*`: string，agent ID。<br>`name*`: string，名称。<br>`content*`: string，文件内容。 | `{ ok, name, path? }`。 | 写入 agent 文件。 |
