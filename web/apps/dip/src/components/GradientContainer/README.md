# GradientContainer（渐变背景容器）

一层带**固定背景图**的布局容器：使用 `@/assets/images/gradient-container-bg.png` 作为 `background-image`，并叠加 Tailwind 类 `bg-no-repeat bg-cover relative`。常用于登录结果、错误页、应用商店/我的应用等全屏或大块内容区衬底。

---

## 适合谁读

- 要在页面级统一「浅底图」视觉的贡献者  
- 需要覆盖 `className` 做 flex / 全高布局的同学  

---

## 功能概览

| 点 | 说明 |
|----|------|
| 子节点 | 任意 `ReactNode`，渲染在容器内 |
| 背景 | 内联 `style.backgroundImage` 指向打包后的图片 URL；`className` 默认含 `bg-no-repeat bg-cover relative` |
| `style` | 可与背景合并传入；当前 `useMemo` 依赖为 `[]`，**仅首次渲染时读取**传入的 `style`，后续若父组件改变 `style` 可能不会同步（以代码为准） |

---

## 目录结构（速查）

```
GradientContainer/
├── index.tsx      # 单文件组件
└── __tests__/     # 子节点、背景图、className
```

---

## 组件接口

| 属性 | 类型 | 说明 |
|------|------|------|
| `children` | `ReactNode` | 内容 |
| `className` | `string` | 追加在默认类名后（`classnames`） |
| `style` | `CSSProperties` | 与默认 `backgroundImage` 合并 |

---

## 样式说明

- 背景图为 **PNG 资源**，由构建工具处理为 URL。  
- 布局与间距一般由业务侧通过 **`className`**（多为 Tailwind）控制，例如 `h-full`、`flex`、`p-6`。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅本组件：

```bash
pnpm vitest run src/components/GradientContainer
```
