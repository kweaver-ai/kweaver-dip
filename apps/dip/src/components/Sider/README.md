# 组件介绍

这是一个侧边栏 Sider 组件，用于展示应用导航菜单和用户信息。侧边栏从上到下分为 5 个部分：

- **Logo + 收起按钮**：顶部品牌标识和侧边栏折叠控制
- **应用菜单**：我的应用（my-app）和钉住的应用列表
- **应用商店**：应用商店入口（app-store）
- **外部链接**：AI Data Platform 和系统工作台
- **用户信息**：用户头像、名称和退出登录功能

组件支持展开/收起两种状态，收起时只显示图标，展开时显示完整菜单项。

## 组件结构

```
Sider/
├── types.ts              # 类型声明定义
├── index.tsx             # 主组件（侧边栏容器和布局逻辑）
├── SiderMenuItem.tsx     # 通用菜单项组件（可选中菜单项）
├── BottomLinkItem.tsx    # 底部外部链接菜单项组件（不可选中）
├── UserMenuItem.tsx       # 用户菜单项组件（下拉菜单）
└── GradientMaskIcon.tsx  # 渐变图标遮罩组件（用于选中态图标）
```

# 交互设计

## Figma 设计稿

- **侧边栏设计**: `https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=25-458&t=C1RkREARY5uzZSPO-4`

## 布局结构

- **整体布局**：垂直布局，从上到下排列

  - **顶部**：Logo + 收起按钮
  - **中间上部**：应用菜单（my-app）+ 钉住的应用，应用商店（app-store）
    - 应用菜单和应用商店之间有分割线
  - **中间留空**：应用商店和底部外部链接之间留空，用于弹性布局
  - **底部**：AI Data Platform + 系统工作台，用户信息
    - 外部链接和用户信息之间有分割线

- **尺寸规格**：
  - 展开宽度：`240px`
  - 收起宽度：`60px`
  - 菜单项高度：`40px`

## 交互行为

### 展开/收起

- 点击顶部收起按钮，切换侧边栏展开/收起状态
- 收起时只显示图标，展开时显示图标和文字

### 菜单项状态

1. **普通菜单项（可选中）**：

   - **默认态**：图标和文字正常显示
   - **悬浮态**：背景色使用默认悬浮背景色 `--dip-hover-bg-color`
   - **选中态**：
     - 图标：渐变色 `linear-gradient(210.47deg, #1C4DFA 17.63%, #3FA9F5 92.96%)`
     - 文字：主题色 `--dip-primary-color`
     - 背景色：主题色 0.2 透明度 `rgba(209,230,255,0.2)`
     - 左侧竖线：宽度 `2px`，渐变色 `linear-gradient(180deg, #3FA9F5 0%, #126EE3 100%)`

2. **钉住的应用**：

   - 选中时图标不变色，使用应用本身的图标
   - 其他状态与普通菜单项相同

3. **外部链接菜单项**（AI Data Platform、系统工作台）：

   - 没有选中态，只有悬浮态
   - 点击时在新标签页打开对应链接

4. **用户菜单项**：
   - 没有选中态，只有悬浮态
   - 点击时弹出下拉菜单，选项为"退出登录"

### 菜单项点击行为

- **路由菜单项**：点击后使用 `react-router-dom` 的 `navigate` 进行路由跳转
- **微应用菜单项**：点击后在新标签页打开 `/application/${appId}`
- **外部链接菜单项**：
  - AI Data Platform：`https://dip.aishu.cn/`
  - 系统工作台：`https://anyshare.aishu.cn/`
- **用户菜单项**：点击后弹出下拉菜单，选择"退出登录"后调用 `logout` 方法

### 选中逻辑

- 根据当前路由路径（`location.pathname`）自动确定选中的菜单项
- 根路径 `/` 时，默认选中第一个可见菜单项
- 微应用路由 `/application/:appId` 时，选中对应的钉住应用菜单项

# 代码实现

## Props 接口

```typescript
interface SiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /** 顶部偏移量（用于适配顶部导航栏高度） */
  topOffset?: number
}
```

## 默认行为

- 组件不管理自身的折叠状态，由父组件通过 `collapsed` prop 控制
- 根据当前路由自动确定选中菜单项
- 根据用户角色（`userInfo.role_ids`）过滤可见菜单项

## 数据加载

- **用户信息**：从 `useUserInfoStore` 获取用户信息和退出登录方法
- **钉住的应用**：从 `usePreferenceStore` 获取钉住的应用列表
- **路由配置**：从 `@/routes/routes` 和 `@/routes/utils` 获取路由配置和权限判断逻辑
- **微应用列表**：目前使用空数组（TODO: 待实现）

所有数据通过 Zustand store 管理，无需额外接口调用。

## 样式规范

- **主要使用 Tailwind CSS** 完成样式
- **特殊样式**：

  - 选中态图标渐变：使用 `GradientMaskIcon` 组件实现
  - 选中态左侧竖线渐变：使用 Tailwind 的 `bg-gradient-to-b` 类
  - 背景模糊效果：`backdrop-blur-[6px]`
  - 阴影效果：`shadow-[inset_-1px_0_0_rgba(0,0,0,0.1)]`

- **关键样式值**：
  - 展开宽度：`240px`（`w-60`）
  - 收起宽度：`60px`（`w-[60px]`）
  - 菜单项高度：`40px`（`h-10`）
  - 选中背景色：`rgba(209,230,255,0.2)`

## 性能优化

- 使用 `useMemo` 缓存侧边栏数据计算（`sidebarData`）
- 使用 `useCallback` 优化事件处理函数（`handleOpenApp`、`handleUnpin`）
- 子组件（`SiderMenuItem`、`BottomLinkItem`、`UserMenuItem`）独立封装，避免不必要的重渲染

## 注意事项

1. **权限控制**：菜单项的可见性根据用户角色动态过滤，使用 `isRouteVisibleForRoles` 判断
2. **路由匹配**：选中菜单项的逻辑需要与路由配置保持一致
3. **微应用路由**：微应用路由格式为 `/application/:appId`，菜单项 key 格式为 `micro-app-${appId}`
4. **钉住应用**：钉住的应用使用应用本身的图标（Base64 编码），不受选中态渐变影响
5. **外部链接**：AI Data Platform 和系统工作台固定顺序，AI Data Platform 在上
6. **响应式**：组件高度使用 `calc(100vh - ${topOffset}px)` 动态计算，适配不同顶部导航栏高度
