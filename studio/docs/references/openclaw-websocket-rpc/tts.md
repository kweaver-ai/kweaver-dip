# TTS WebSocket RPC

- 这里统计的是客户端通过 WebSocket 发送的 `type: "req"` 请求方法，不包含服务端主动推送的 `event` 帧。
- 参数列中带 `*` 的字段为必填；未标记则为可选。

| Method | Params | Response | Method 说明 |
| --- | --- | --- | --- |
| `tts.status` | 无参数；依赖当前连接上下文。 | `{ enabled, auto, provider, fallbackProvider, fallbackProviders, prefsPath, hasOpenAIKey, hasElevenLabsKey, edgeEnabled }`。 | 查询 TTS 当前状态、provider 与可用密钥。 |
| `tts.enable` | 无参数；依赖当前连接上下文。 | `{ enabled: true }`。 | 启用 TTS。 |
| `tts.disable` | 无参数；依赖当前连接上下文。 | `{ enabled: false }`。 | 禁用 TTS。 |
| `tts.convert` | `text*`: string，待转换文本<br>`channel`: string，按目标渠道选择更合适的语音输出策略 | `{ audioPath, provider, outputFormat, voiceCompatible }`。 | 把文本转换为语音文件。 |
| `tts.setProvider` | `provider*`: string，`openai`、`elevenlabs` 或 `edge` | `{ provider }`。 | 切换当前 TTS provider。 |
| `tts.providers` | 无参数；依赖当前连接上下文。 | `{ providers, active }`；`providers[]` 元素通常含 `{ id, name, configured, models, voices? }`。 | 列出 TTS provider、模型与语音配置。 |
