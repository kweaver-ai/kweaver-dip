# 组件介绍

这是一个应用配置抽屉 AppConfigDrawer 组件，用于展示和配置应用的相关信息。整体分为 3 个部分：

- 基本信息：展示应用的基础信息（名称、描述、版本等）
- 业务知识网络：展示应用依赖的业务知识网络配置
- 智能体配置：展示应用包含的智能体配置

每个部分是一个独立的子组件，通过左侧菜单切换显示。

## 组件结构

```
AppConfigDrawer/
├── types.ts              # 类型声明、枚举定义（如 ConfigMenuType）
├── index.tsx             # 主组件（抽屉容器、菜单切换逻辑）
├── BasicConfig.tsx       # 基本信息配置组件
├── OntologyConfig.tsx    # 业务知识网络配置组件
├── AgentConfig.tsx       # 智能体配置组件
└── utils.tsx             # 工具方法（如 menuItems 配置）
```

# 交互设计

## Figma 设计稿

- **基本信息**: `https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=153-4359&t=AqJW2RaHlbF3kEdn-4`
- **业务知识网络**: `https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=128-655&t=AqJW2RaHlbF3kEdn-4`
- **智能体配置**: `https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=132-1143&t=AqJW2RaHlbF3kEdn-4`

## 布局结构

- **整体布局**：上下布局
  - 顶部：抽屉头部（标题：应用配置/`应用名称`）
  - 底部：左右布局
    - 左侧：菜单栏（固定宽度，背景色 `#F9FAFC`）
    - 右侧：配置内容区域（可滚动）

## 交互行为

1. **菜单切换**：点击左侧菜单项，切换右侧显示对应的配置内容
2. **默认选中**：抽屉打开时，默认选中"基本信息"菜单项
3. **数据加载**：切换菜单时，对应的子组件会重新挂载并调用接口获取数据

## 外部链接

- **业务知识网络配置链接**：`https://dip.aishu.cn/studio/ontology/ontology-manage/main/overview?id=${ontologyId}`
- **智能体配置链接**：`https://dip.aishu.cn/studio/dataagent/agent-web-space/agent-web-myagents/config?agentId=${agentId}`

# 代码实现

## Props 接口

```typescript
interface AppConfigDrawerProps {
  /** 已有的应用基础信息（用于标题展示） */
  appData?: ApplicationBasicInfo | null
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
}
```

## 默认行为

- 抽屉打开时，菜单默认选中"基本信息"
- 抽屉关闭时，重置菜单选中状态

## 数据加载

- **基本信息**：子组件内部根据 `appData?.key` 调用 `getApplicationsBasicInfo` 获取最新数据
- **业务知识网络**：切换菜单时，子组件调用 `getApplicationsOntologies` 获取数据
- **智能体配置**：切换菜单时，子组件调用 `getApplicationsAgents` 获取数据

所有接口定义在 `/src/apis/dip-hub/applications.ts` 中。

## 样式规范

- **主要使用 Tailwind CSS** 完成样式
- **抽屉宽度**：页面宽度的 60%，最小宽度 640px
- **左侧菜单**：
  - 宽度：160px（`w-40`）
  - 背景色：`#F9FAFC`
  - 选中项：背景色 `rgba(209,230,255,0.2)`，文字颜色为主色，左侧有蓝色渐变竖条
- **右侧内容区**：使用 `ScrollBarContainer` 组件包裹，支持自定义滚动条样式
- **卡片样式**：白色背景，圆角 8px，边框 `#E3E8EF`

## 注意事项

1. 子组件使用 `memo` 优化性能，避免不必要的重渲染
2. 子组件在切换时会重新挂载（通过 key 控制），确保数据实时更新
3. 加载状态统一使用 `Spin` 组件，位置固定在内容区域
4. 空状态显示友好的提示信息
