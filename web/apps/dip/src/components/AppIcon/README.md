# AppIcon（应用图标）

用于展示**应用图标**：优先渲染 Base64 / `data:` 图片；无图或加载失败时回退为 Ant Design **`Avatar` 首字**（取自 `name`）。可选 **`isBuiltIn`** 角标、`hasBorder` 边框与自定义尺寸/形状。

---

## 适合谁读

- 在应用列表、微应用菜单、项目等场景展示应用头像的贡献者  
- 需要区分「内置应用」角标两种形态（无图 / 有图）的同学  

---

## 功能概览

| 场景 | 行为 |
|------|------|
| 无 `icon` 或图片 `onError` | `Avatar` 显示 `name` 首字符；`isBuiltIn` 时在左上角叠 **`BuiltInIcon`** |
| 有 `icon` | 若已是 `data:` 前缀则原样作 `src`，否则按 **`data:image/png;base64,${icon}`** 拼接 |
| `hasBorder` | 使用带边框的 `Avatar` 包裹图片，图片区域约为 `size - 16` 的方形；无 `hasBorder` 时为普通 `<img>`，边长 `size` |
| `isBuiltIn` 且有有效图标 | 右下角 **`SystemIcon`** + `Tooltip`「内置应用」 |

默认 `size = 24`、`shape = 'circle'`。

---

## 目录结构（速查）

```
AppIcon/
├── index.tsx      # 单文件组件
└── __tests__/     # 首字、base64、onError 回退、角标
```

---

## 组件接口

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | `string` | — | Base64 字符串或完整 `data:` URL |
| `name` | `string` | — | 用于首字回退与无障碍语义 |
| `size` | `number` | `24` | 图标像素尺寸 |
| `shape` | `'circle' \| 'square'` | `'circle'` | 对应 `Avatar` |
| `className` | `string` | — | 外层容器 |
| `style` | `CSSProperties` | — | 外层容器 |
| `hasBorder` | `boolean` | `false` | 是否使用带边框的 `Avatar` 包图 |
| `isBuiltIn` | `boolean` | `false` | 内置应用角标（无图与有图两种资源不同，见上表） |

---

## 样式说明

- 以 **Ant Design `Avatar`**、**Tailwind**（`clsx`）与内联宽高为主。  
- 角标资源：`@/assets/images/project/builtIn.svg`、`system.svg`（`?react`）。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅本组件：

```bash
pnpm vitest run src/components/AppIcon
```
