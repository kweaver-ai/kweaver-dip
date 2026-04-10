# DipChatKit

`DipChatKit` 是一个开箱即用的对话组件，固定使用内置真实 SSE 请求链路。

## 引入方式

```tsx
import DipChatKit from '@/components/DipChatKit'
```

## Props

| Prop | 类型 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `className` | `string` | `-` | 组件根节点自定义类名。 |
| `style` | `React.CSSProperties` | `-` | 组件根节点行内样式。 |
| `locale` | `'zh_cn' \| 'en_us' \| 'zh_tw'` | `'zh_cn'` | 组件内置国际化标识。内部会自动映射并引入对应的 `antd` + `@ant-design/x` 语言包。 |
| `showHeader` | `boolean` | `true` | 是否显示顶部 `DipChatHeader`。 |
| `initialSubmitPayload` | `AiPromptSubmitPayload` | `-` | 直接接收 `AiPromptInput onSubmit` 原始参数，组件内部会自动组装首条 `pendingSend` 消息。 |
| `sessionId` | `string` | `undefined` | 会话详情拉取开关：<br/>1. `undefined`：不接管当前会话，沿用本地对话流；<br/>2. `''` 或空白字符串：清空聊天区；<br/>3. 非空字符串：请求会话详情并渲染到聊天区域。 |
| `assignEmployeeValue` | `string` | `-` | 指定固定员工 ID。设置后会隐藏输入区的 `@` 选择按钮与员工标签，并在发送时自动使用该员工。 |
| `employeeOptions` | `AiPromptMentionOption[]` | `[]` | 输入区员工候选项。传入后使用外部数据；不传时组件内部调用 `getDigitalHumanList` 拉取。 |
| `defaultEmployeeValue` | `string` | `-` | 默认选中的员工 ID。优先匹配此值；未匹配时会回退到员工列表第一项。 |
| `inputPlaceholder` | `string` | `'发送消息...'` | 输入框占位文案。 |
| `onSessionKeyReady` | `(sessionKey: string) => void` | `-` | 当内置发送链路拿到有效 `sessionKey`（创建会话或使用既有会话）后回调。适用于外部把 `sessionKey` 同步到 URL 或埋点。 |
## `initialSubmitPayload` 结构

```ts
interface AiPromptSubmitPayload {
  content: string
  employees: Array<{ value: string; label: string }>
  files: File[]
}
```

## 内置默认行为

1. 根据当前选中的员工 ID（`payload.employees[0]?.value`，或 `defaultEmployeeValue`）创建会话 key：`POST /api/dip-studio/v1/chat/session`。
2. 使用会话 key 发起流式回答：`POST /api/dip-studio/v1/chat/agent`，请求头携带 `x-openclaw-session-key`。
3. SSE 分片会实时追加到当前回答中。
4. 点击输入区加载按钮可触发停止（通过 `AbortSignal` 中断流）。

## 初始化优先级

1. 传了 `initialSubmitPayload`：组件内部自动组装首问并自动发送。  
2. 未传 `initialSubmitPayload`：从空会话开始。

## 示例

### 1. 最小用法（完全走内置 API）

```tsx
<DipChatKit />
```

### 2. 隐藏头部 + 指定默认员工

```tsx
<DipChatKit showHeader={false} defaultEmployeeValue="employee-id-001" />
```

### 3. 直接透传 Home 页 `onSubmit` 数据

```tsx
<DipChatKit initialSubmitPayload={submitData} />
```

### 4. 传入 `sessionId` 回显会话

```tsx
<DipChatKit sessionId={sessionId} />
```

说明：当 `sessionId` 从有值变为空字符串时，聊天区域会立即清空。

### 5. 固定员工并隐藏 `@` / 员工标签

```tsx
<DipChatKit assignEmployeeValue="employee-id-001" />
```

### 6. 传入字符串 locale

```tsx
<DipChatKit locale="en_us" />
```

### 7. 监听会话 key（写入 URL 示例）

```tsx
<DipChatKit
  onSessionKeyReady={(sessionKey) => {
    // 外部可将 sessionKey 同步到查询参数
    console.log(sessionKey)
  }}
/>
```
