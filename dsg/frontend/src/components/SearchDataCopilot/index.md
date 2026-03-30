# SearchDataCopilot 组件文档

## 1. 组件介绍

-   **组件用途**：提供固定在页面上的数据搜索 Copilot 助手按钮，点击后打开抽屉显示 AI 对话界面
-   **使用场景**：在数据资产目录、数据搜索等页面中，用户可以随时点击固定按钮打开 AI 助手进行数据搜索和问答

## 2. 组件结构

-   **所在目录**：`src/components/SearchDataCopilot/`
-   **组件名称**：SearchDataCopilot
-   **文件**：
    -   `index.tsx` - 组件主文件
    -   `styles.module.less` - 样式文件
    -   `index.md` - 组件文档

## 3. 交互设计

### 3.1 Figma 设计稿链接

-   **组件设计**: 无

### 3.2 布局结构

-   **固定按钮**：固定在页面右下角，圆形按钮，尺寸 56x56px，距离右侧和底部各 24px
-   **抽屉布局**：使用 antd Drawer 组件，从右侧滑出，宽度 480px，占满整个视口高度
-   **Copilot 内容**：抽屉内使用 `@kweaver-ai/chatkit` 的 Copilot 组件显示对话界面

### 3.3 交互行为

-   **用户操作**：
    -   点击固定按钮：打开/关闭抽屉
    -   点击抽屉关闭按钮：关闭抽屉
    -   抽屉打开时：自动调用接口获取 Agent 信息并初始化 Copilot
-   **状态变化**：
    -   按钮悬浮时：背景色变浅，阴影加深，轻微上移
    -   抽屉打开时：显示加载状态，获取 Agent 信息后显示 Copilot 界面
    -   抽屉关闭时：清空 Agent 信息，下次打开时重新获取
-   **默认行为**：
    -   组件挂载时按钮默认显示，抽屉默认关闭
    -   抽屉关闭时不销毁内容（`destroyOnClose={false}`），但会清空 Agent 信息

### 3.4 外部链接/跳转

-   **外部链接**：无
-   **链接文案**：无

## 4. 代码实现

### 4.1 Props 接口

-   **接口定义**：组件无外部 Props，所有状态内部管理
-   **参数说明**：无
-   **示例**：

    ```typescript
    // 组件使用方式
    import SearchDataCopilot from '@/components/SearchDataCopilot'

    // 在页面中直接使用，无需传参
    ;<SearchDataCopilot />
    ```

### 4.2 默认行为

-   **初始化状态**：
    -   `visible`: `false` - 抽屉默认关闭
    -   `loading`: `false` - 默认不加载
    -   `agentInfo`: `null` - 默认无 Agent 信息
-   **默认值**：
    -   固定按钮位置：`right: 24px, bottom: 24px`
    -   抽屉宽度：`480px`
    -   抽屉位置：`right`（从右侧滑出）

### 4.3 数据加载

-   **数据来源**：
    -   Agent 信息：调用 `/api/af-sailor-agent/v1/assistant/search/info` 接口
    -   Token 信息：从 `microAppProps.props.token` 或 `Cookies.get('af.oauth2_token')` 获取
-   **加载时机**：
    -   抽屉打开时（`visible === true`）且 `agentInfo` 为空时触发接口调用
    -   Token 信息在组件挂载时通过 `useMemo` 计算获取
-   **加载状态**：
    -   接口调用期间显示 `Loader` 组件
    -   接口失败时显示错误提示
    -   接口成功后将 Agent 信息传递给 Copilot 组件

### 4.4 样式规范

-   **样式方案**：使用 CSS Modules（`.module.less`）
-   **关键样式**：
    -   固定按钮：`position: fixed`，`z-index: 1000`，圆形，蓝色背景（`#1890ff`）
    -   按钮悬浮效果：背景色 `#40a9ff`，阴影加深，`transform: translateY(-2px)`
    -   抽屉容器：`padding: 0`，`height: 100%`
    -   加载容器：居中显示，占满高度
-   **特殊样式**：
    -   抽屉无遮罩点击关闭（`maskClosable={false}`）
    -   抽屉不销毁内容（`destroyOnClose={false}`）
    -   抽屉挂载到当前容器（`getContainer={false}`）

### 4.5 性能优化

-   **优化措施**：
    -   使用 `useMemo` 缓存 Token 计算结果，仅在 `microAppProps.token` 变化时重新计算
    -   使用 `useEffect` 监听 `visible` 状态，仅在抽屉打开且无 Agent 信息时调用接口
    -   抽屉关闭时清空 `agentInfo`，避免内存泄漏
-   **注意事项**：
    -   Token 获取逻辑参考了 `Chatkit` 组件的实现，确保一致性
    -   Copilot 组件使用 `React.createElement` 动态创建，避免类型问题

## 5. 技术实现细节

### 5.1 依赖组件

-   **@kweaver-ai/chatkit**：提供 `Copilot` 组件用于显示对话界面
-   **antd**：提供 `Drawer` 组件和 `MessageOutlined` 图标
-   **@/context**：提供 `useMicroAppProps` Hook 获取微应用 Props
-   **@/core/apis/afSailorService**：提供 `getSearchAgentInfo` 接口方法
-   **@/ui**：提供 `Loader` 组件用于加载状态

### 5.2 Token 处理逻辑

```typescript
// Token 获取优先级：
// 1. microAppProps.props.token.accessToken（微应用传入）
// 2. Cookies.get('af.oauth2_token')（Cookie 中获取）
// 3. 空字符串（默认值）

// RefreshToken 处理：
// 如果 microAppProps 提供了 refreshToken 方法，则包装为异步函数
// 否则返回 undefined
```

### 5.3 Agent 信息结构

```typescript
interface AgentInfo {
    adp_agent_key: string // 关联的 adp agent key
    adp_business_domain_id: string // 关联 adp business_domain_id
}
```

### 5.4 Copilot 组件配置

```typescript
{
    title: '数据搜索助手',                    // 组件标题
    visible: true,                           // 始终显示（由 Drawer 控制显示/隐藏）
    baseUrl: `${window.location.origin}/api/agent-app/v1`,  // API 基础路径
    agentKey: agentInfo.adp_agent_key,      // Agent Key
    token: assistantToken,                  // 访问 Token
    refreshToken: assistantRefreshToken,    // Token 刷新函数
    businessDomain: agentInfo.adp_business_domain_id,  // 业务域 ID
}
```

## 6. 注意事项

-   **特殊逻辑**：
    -   固定按钮使用 `MessageOutlined` 图标，可根据设计需求更换
    -   抽屉关闭时清空 `agentInfo`，确保下次打开时重新获取最新信息
    -   Token 处理逻辑与 `Chatkit` 组件保持一致，确保统一性
-   **边界情况**：
    -   接口调用失败时显示错误提示，用户可关闭抽屉后重试
    -   Token 为空时 Copilot 组件可能无法正常工作，需要确保 Token 正确获取
    -   抽屉打开时如果 `agentInfo` 已存在，不会重复调用接口
-   **依赖关系**：
    -   依赖 `@kweaver-ai/chatkit` 包的 `Copilot` 组件
    -   依赖 `@/core/apis/afSailorService` 的 `getSearchAgentInfo` 接口
    -   依赖 `@/context` 的 `useMicroAppProps` Hook
-   **已知问题**：
    -   无
-   **后续优化**：
    -   可考虑添加错误重试机制
    -   可考虑添加 Agent 信息缓存，避免频繁调用接口
    -   可根据实际需求调整抽屉宽度和按钮位置

## 7. 接口说明

### 7.1 获取 Agent 信息接口

-   **接口路径**：`/api/af-sailor-agent/v1/assistant/search/info`
-   **请求方法**：`GET`
-   **请求参数**：无
-   **返回结构**：
    ```typescript
    {
        res: {
            adp_agent_key: string // 关联的 adp agent key
            adp_business_domain_id: string // 关联 adp business_domain_id
        }
    }
    ```
-   **接口封装**：`@/core/apis/afSailorService.getSearchAgentInfo()`
