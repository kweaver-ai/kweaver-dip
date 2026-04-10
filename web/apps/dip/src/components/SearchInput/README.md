# SearchInput（搜索输入框）

基于 Ant Design `Input` 的轻量封装：左侧搜索图标、`allowClear`、默认宽度，并对 `onSearch` 做**防抖**；与上次已提交内容相同时不会重复触发。

---

## 适合谁读

- 在列表、弹窗等场景接入搜索且希望减少请求次数的贡献者  
- 需要区分「输入防抖」与「回车立即提交」行为的同学  

---

## 行为说明

| 行为 | 说明 |
|------|------|
| 受控方式 | 内部 `useState` 维护输入值；**未**暴露 Ant Design 的受控 `value`（类型上已 `Omit` 掉 `value` / `onChange`） |
| `onSearch` | 防抖后调用；`debounceDelay === 0` 时每次变更**立即**调用（若值相对上次提交有变化） |
| 去重 | 与 `lastSearchValue` 相同则不触发 |
| Enter | `keydown` 为 Enter 时**立即**触发一次搜索（跳过防抖等待） |
| 卸载 | `useEffect` 清理定时器，避免泄漏 |

---

## 目录结构（速查）

```
SearchInput/
├── index.tsx      # 单文件组件
└── __tests__/     # Vitest：防抖、delay=0、回车立即搜索
```

---

## 组件接口

在 `Omit<InputProps, 'onChange' | 'value'>` 之上扩展：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onSearch` | `(value: string) => void` | — | 防抖后的搜索回调 |
| `debounceDelay` | `number` | `300` | 防抖毫秒数；`0` 表示立即触发（仍会去重） |
| `defaultValue` | `string` | `''` | 仅初始值，非受控同步 |
| `placeholder` | `string` | `'搜索'` | — |

其余属性透传给 `Input`（如 `disabled`、`id` 等），但**不要**依赖 `value` / `onChange` 做受控（类型已排除）。

默认 UI：`variant="outlined"`、`prefix` 为 `IconFont` 的 `icon-search`、`className` 前缀含 `bg-white w-[220px]`，可与传入的 `className` 拼接。

---

## 样式说明

- 以 **Tailwind** 与 Ant Design `Input` 为主。  
- 无独立 `*.module.less`。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅本组件：

```bash
pnpm vitest run src/components/SearchInput
```
