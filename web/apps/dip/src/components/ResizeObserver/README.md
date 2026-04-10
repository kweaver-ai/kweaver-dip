# ResizeObserver（尺寸监听）

对**单个子节点**使用浏览器 `ResizeObserver`，在尺寸变化时通过 `getBoundingClientRect` 回调 **宽度、高度、DOM 引用** 以及一个 **`visible` 布尔值**（当前实现为 `width !== 0` 时的推导，用于区分「宽度为 0」的隐藏/折叠态）。

---

## 适合谁读

- 需要根据容器宽高做自适应布局、图表重绘、虚拟列表等的贡献者  
- 接入时注意：**子节点必须是单个可挂 `ref` 的 React 元素**  

---

## 功能概览

| 点 | 说明 |
|----|------|
| 实现 | `ResizeObserver` API + `React.cloneElement` 把 `ref` 赋给唯一子节点 |
| 回调数据 `ResizeProps` | `width`、`height`（来自 `getBoundingClientRect`）、`dom`、`visible` |
| `visible` | 当前代码为 `width !== 0`；类型注释中的「视口可见」与实现不完全一致，以代码为准 |
| 约束 | **`children` 只能是一个父级节点**（单个 ReactElement），且需能接收 `ref` |

---

## 目录结构（速查）

```
ResizeObserver/
├── index.tsx      # 默认导出 `DipResizeObserver`
└── __tests__/     # 回调字段、width 为 0 时 visible
```

---

## 组件接口

| 属性 | 类型 | 说明 |
|------|------|------|
| `children` | 单个 `ReactElement` | 被监听 DOM，会合并 `ref` |
| `onResize` | `(data: ResizeProps) => void` | 尺寸变化时触发 |

```typescript
export type ResizeProps = {
  width: number
  height: number
  dom: HTMLElement
  visible: boolean
}
```

`useEffect` 依赖为空数组：观察器在挂载时创建、卸载时 `disconnect`；若需随 `onResize` 引用更新而调整，以当前实现为准（必要时自行封装）。

---

## 样式说明

无独立样式文件；由子节点与父级布局决定尺寸。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅本组件：

```bash
pnpm vitest run src/components/ResizeObserver
```
