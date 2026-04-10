# Empty（空状态）

在列表、区块或整页无数据、加载失败、搜索无结果时使用的**居中空态展示**：上图下文，可配主标题、说明、副说明与底部操作区（`children`）。图标可由内置 `type` 选择，也可完全自定义。

---

## 适合谁读

- 要在页面里统一空态样式的贡献者  
- 需要区分「无数据 / 搜索无结果 / 加载失败」三种默认配图的同学  

---

## 功能概览

| 能力 | 说明 |
|------|------|
| 内置配图 | `type` 为 `empty`（默认）、`search`、`failed` 时分别使用 `assets/images/abnormal/` 下对应资源 |
| 自定义图标 | 传入 `iconSrc` 时**优先**于 `type` |
| 文案层级 | 可选 `title`、`desc`、`subDesc`（均为 string 或 React 节点） |
| 扩展区 | `children` 常用于放置「去创建」等按钮 |
| 根布局 | 根节点为 `flex` 垂直居中，默认 `h-full w-full`，由父级控制占位区域大小 |

---

## 目录结构（速查）

```
Empty/
├── index.tsx      # 单文件组件
└── __tests__/     # Vitest：文案、type 配图、iconSrc 优先级
```

---

## 组件接口

主要 props（与实现一致）：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'empty' \| 'search' \| 'failed'` | `'empty'` | 无 `iconSrc` 时决定内置图 |
| `iconSrc` | 任意（作 `img` 的 `src`） | — | 有值则覆盖 `type` 对应图 |
| `iconHeight` | `number`（实现中较宽松） | `144` | 图标显示高度（px） |
| `title` | 通常为 `string` | `''` | 主标题（与 `IEmpty` 继承的 div 属性同名，仅作展示文案） |
| `desc` | `ReactElement \| string` | `''` | 说明文案 |
| `subDesc` | `ReactElement \| string` | — | 更小字号说明 |
| `children` | `ReactElement` | — | 如图标下方的操作按钮 |

类型 `IEmpty` 虽扩展了 `HTMLAttributes<HTMLDivElement>`，当前实现**未**对剩余属性做 `...rest` 透传；若需根节点 `className` 等，请以 `index.tsx` 实际解构为准。

---

## 内置资源路径

| type | 资源（相对 `src`） |
|------|---------------------|
| `empty` | `@/assets/images/abnormal/empty.svg` |
| `search` | `@/assets/images/abnormal/searchEmpty.svg` |
| `failed` | `@/assets/images/abnormal/loadFailed.png` |

---

## 样式说明

- 使用 **Tailwind** 做垂直居中与间距；文案颜色使用 CSS 变量 `--dip-text-color-75`。  
- 无独立 `*.module.less`。

---

## 使用场景（示例）

业务中多处通过 `import Empty from '@/components/Empty'` 使用，例如数字员工管理、技能列表、知识/技能配置空列表、微应用容器等。具体以各页面需求为准。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅本组件：

```bash
pnpm vitest run src/components/Empty
```
