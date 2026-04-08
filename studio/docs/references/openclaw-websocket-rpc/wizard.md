# Wizard WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `wizard.start` | `mode`: "local" \| "remote"，模式或查询模式。<br>`workspace`: string，工作区路径。 | `{ sessionId, ...WizardStartResult }`；通常含当前步骤、可选项和进度信息。 | 启动 onboarding wizard。 |
| `wizard.next` | `sessionId*`: string，会话 ID。<br>`answer`: object{stepId*:string, value:unknown}，wizard 当前步骤的回答。 | `WizardNextResult`；通常含 `{ sessionId, step, done, answers?, effects? }`。 | 提交当前 wizard 步骤答案并进入下一步。 |
| `wizard.cancel` | `sessionId*`: string，会话 ID。 | 取消后的状态对象；顶层通常含 `{ sessionId, status: "canceled", done }`。 | 取消 wizard。 |
| `wizard.status` | `sessionId*`: string，会话 ID。 | `WizardStatusResult`；通常含 `{ sessionId, status, step?, done, answers? }`。 | 查询 wizard 当前状态。 |
