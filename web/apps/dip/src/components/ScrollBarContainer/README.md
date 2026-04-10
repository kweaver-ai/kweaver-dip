# ScrollBarContainer（滚动容器）

对 [mac-scrollbar](https://github.com/GreatAuk/mac-scrollbar) 的 `MacScrollbar` 做一层薄封装：统一引入库样式与项目内滚动条主题变量，支持 **`forwardRef`**，其余行为与 **`MacScrollbarProps`** 一致。

---

## 适合谁读

- 需要在长列表、表单区、侧栏等场景使用**自定义滚动条**而非原生样式的贡献者  
- 排查滚动区域高度、`flex` 子项不收缩（`min-h-0`）等布局问题的前端同学  

---

## 功能概览

| 点 | 说明 |
|----|------|
| 依赖 | `mac-scrollbar` + 其默认样式 `mac-scrollbar/dist/mac-scrollbar.css` |
| 封装 | `forwardRef` 将 `ref` 交给内部 `MacScrollbar` |
| Props | 透传 `MacScrollbarProps`（如 `className`、`style`、子节点等），与官方文档一致 |
| 主题 | `index.less` 为 `.ms-theme-light` / `.ms-theme-dark` 定义轨道、滑块颜色与尺寸等 CSS 变量；需要时在容器上增加对应 `className`（与 mac-scrollbar 用法一致） |

---

## 目录结构（速查）

```
ScrollBarContainer/
├── index.tsx      # MacScrollbar 封装
├── index.less     # 浅色 / 深色主题变量
└── __tests__/     # 子元素渲染、ref、props 透传
```

---

## 使用注意

- **高度与滚动**：外层需限制高度（如 `h-full`、`max-h-[400px]`）并常配合 **`min-h-0`** / **`overflow-auto`** 等，才能在 flex 布局中正确出现滚动条（与业务中现有写法一致）。  
- **类型**：`ref` 类型当前为 `any`，与实现一致；若升级 mac-scrollbar 可再收紧类型。

---

## 样式说明

- 库自带基础样式；`index.less` 覆盖 `--ms-thumb-color`、`--ms-track-size` 等。  
- 业务侧多用 **Tailwind** 写在 `className` 上控制容器尺寸与内边距。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅本组件：

```bash
pnpm vitest run src/components/ScrollBarContainer
```

测试依赖 `mac-scrollbar` 渲染出的 `data-testid="mac-scrollbar"`（以当前库版本为准）。
