# 组件介绍

这是一个应用列表 AppList 组件，用于展示应用卡片网格列表。组件支持两种模式：

- **我的应用模式**（MyApp）：展示用户已安装的应用，支持固定/取消固定操作
- **应用商店模式**（AppStore）：展示应用商店中的应用，支持配置、运行、授权管理、卸载等操作

组件支持按应用分类（category）进行 Tab 切换，自动根据应用数据动态生成分类 Tab。使用响应式网格布局，根据容器宽度自动计算列数和卡片宽度。

## 组件结构

```
AppList/
├── types.ts              # 类型声明、枚举定义（ModeEnum、ALL_TAB_KEY）
├── index.tsx             # 主组件（列表容器、Tab 切换、响应式布局）
├── AppCard.tsx           # 应用卡片组件（单个应用卡片展示）
├── SkeletonGrid.tsx      # 骨架屏组件（加载状态）
├── utils.tsx             # 工具方法（列数计算、菜单项生成等）
└── index.module.less     # 样式文件（Tab 样式、滚动条隐藏等）
```

# 交互设计

## Figma 设计稿

- **我的应用**: `https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=93-75&t=C1RkREARY5uzZSPO-4`
- **应用商店**: `https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=153-1119&t=9dGmzwmPEPGpCs3L-4`

## 布局结构

- **整体布局**：上下布局

  - **顶部**：Tabs 组件，显示"全部"和各个分类 Tab，每个 Tab 显示对应分类的应用数量
  - **底部**：响应式网格布局，使用 `AutoSizer` 和 `Row/Col` 实现自适应列数

- **响应式布局**：

  - 使用 `react-virtualized-auto-sizer` 的 `AutoSizer` 组件监听容器宽度变化
  - 根据容器宽度动态计算列数，确保卡片宽度在 `minCardWidth`（380px）和 `maxCardWidth`（500px）之间
  - 卡片间距：`16px`（gap）

- **卡片尺寸**：
  - 卡片高度：`171px`（固定）
  - 卡片最小宽度：`380px`
  - 卡片最大宽度：`500px`

## 交互行为

### Tab 切换

- 默认选中"全部" Tab，显示所有应用
- 点击分类 Tab，显示对应分类的应用
- Tab 标签显示格式：`分类名称 (数量)`
- 当应用数据变化导致当前选中的分类不存在时，自动重置为"全部" Tab

### 应用卡片

- **卡片菜单**：点击卡片右上角菜单按钮，弹出下拉菜单
  - **我的应用模式菜单项**：
    - 固定：固定应用到侧边栏（未固定时显示）
    - 取消固定：取消固定应用（已固定时显示）
  - **应用商店模式菜单项**：
    - 配置：打开应用配置抽屉
    - 运行：运行应用
    - 授权管理：打开授权管理
    - 卸载：卸载应用（危险操作）

### 响应式行为

- 容器宽度变化时，自动重新计算列数和卡片宽度
- 确保卡片宽度始终在合理范围内（380px - 500px）
- 使用 `useMemo` 缓存计算结果，避免不必要的重计算

# 代码实现

## Props 接口

```typescript
interface AppListProps {
  /** 组件模式：我的应用 或 应用商店 */
  mode: ModeEnum.MyApp | ModeEnum.AppStore
  /** 应用列表数据 */
  apps: Application[]
  /** 卡片菜单点击回调 */
  onMenuClick?: (action: string, app: Application) => void
}
```

## 默认行为

- 默认选中"全部" Tab（`ALL_TAB_KEY = 'all'`）
- 根据应用数据的 `category` 字段动态生成分类 Tab
- 如果应用没有 `category` 字段，则只显示"全部" Tab

## 数据加载

- **数据来源**：组件不负责数据加载，通过 `apps` prop 接收应用列表数据
- **数据分组**：组件内部根据 `category` 字段对应用进行分组
- **数据变化处理**：
  - 当 `apps` 数据变化时，自动重新分组和生成 Tab
  - 如果当前选中的 Tab 对应的分类不存在了，自动重置为"全部" Tab

## 样式规范

- **主要使用 Tailwind CSS** 完成样式
- **CSS Modules**：使用 `index.module.less` 处理 Tab 样式和滚动条隐藏等特殊样式
- **关键样式值**：

  - 卡片圆角：`rounded-xl`（12px）
  - 卡片边框：`border border-[var(--dip-border-color)]`
  - 卡片间距：`16px`（gap）
  - Tab 尺寸：`size="small"`

- **响应式计算**：
  - 使用 `computeColumnCount` 函数计算列数
  - 卡片宽度 = 容器宽度 / 列数
  - 确保卡片宽度在 380px - 500px 范围内

## 性能优化

- 使用 `memo` 包装主组件，避免不必要的重渲染
- 使用 `useMemo` 缓存分组数据、Tab 配置、当前应用列表等计算结果
- 使用 `useCallback` 优化 `renderAppCard` 函数
- 使用 `AutoSizer` 实现高效的响应式布局，避免频繁的 resize 监听

## 注意事项

1. **分类 Tab 生成**：Tab 是根据应用数据的 `category` 字段动态生成的，如果应用没有分类，则只显示"全部" Tab
2. **Tab 重置逻辑**：当应用数据变化导致当前选中的分类不存在时，会自动重置为"全部" Tab
3. **响应式布局**：组件依赖 `react-virtualized-auto-sizer` 库，确保容器有明确的宽度约束
4. **卡片菜单操作**：菜单操作的具体实现由父组件通过 `onMenuClick` 回调处理
5. **模式差异**：
   - 我的应用模式：菜单项根据应用是否固定动态显示
   - 应用商店模式：菜单项固定，包含配置、运行、授权管理、卸载等操作
6. **滚动条处理**：使用 CSS 隐藏滚动条，但保持滚动功能（`hideScrollbar` 类）
7. **卡片尺寸**：卡片高度固定为 171px，宽度根据响应式计算动态调整
