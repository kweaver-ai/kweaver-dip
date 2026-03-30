# SmartDataQuery 组件文档

## 1. 组件介绍

-   **组件用途**：SmartDataQuery 是智能问数能力的主入口页面，承载「选择助手 + 右侧智能问数输入框 + 对话页跳转」的完整链路。
-   **使用场景**：在数据资产、数据目录、数据搜索等业务场景中，用户在 SmartDataQuery 中选择合适的智能助手，输入自然语言问题，一键跳转到对话页面进行智能问数。

## 2. 页面与组件结构

-   **文档所在目录**：`src/components/SmartDataQuery/index.md`
-   **相关代码目录**：
    -   `src/apps/smartDataQuery/`：SmartDataQuery 微应用入口及路由
    -   `src/components/Assistant/`：助手列表与入口卡片区域
    -   `src/components/SearchDataCopilot/`：全局数据搜索 Copilot 入口（悬浮按钮 + 抽屉）
    -   `src/components/Chatkit/`：智能问数对话页面（`/chatkit/:agentKey`）
-   **关键路由配置**（节选自 `src/apps/smartDataQuery/Routes.tsx`）：

    ```typescript
    const routes = [
        {
            path: '/',
            element: <SmartDataQuery />, // 默认首页：助手列表 & 右侧输入框
        },
        {
            path: '/Assistant',
            element: <Assistant />, // 全部助手列表 & 管理页
        },
        {
            path: '/chatkit/:agentKey',
            element: <ChatKit />, // 智能问数对话页
        },
    ]
    ```

## 3. 交互设计

### 3.1 Figma 设计稿链接

-   **整体页面设计**：[SmartDataQuery 智能问数主入口](https://www.figma.com/design/7PAeY33DzcKbTKDHXRh0kb/KWeaver-DIP?node-id=12-17&t=KfYPmT9RHIlsU1ks-4)
-   **右侧输入框区域**：[智能问数右侧输入框](https://www.figma.com/design/7PAeY33DzcKbTKDHXRh0kb/KWeaver-DIP?node-id=12-23&t=KfYPmT9RHIlsU1ks-4)

### 3.2 布局结构（页面级）

-   **整体结构**：
    -   左侧：助手列表 / 卡片区域（`Assistant` 组件），用于浏览、搜索和选择可用的智能助手(不需要处理)。
    -   右侧：智能问数输入区域（参考 Figma 右侧输入框设计），包含：
        -   顶部欢迎文案；
        -   中间主输入框（多行文本，支持 Enter 提交 / Shift+Enter 换行）；
        -   输入框下方一行「场景 Agent 标签」区域（基于已发布助手列表渲染的场景标签）；
        -   右下角发送按钮。
    -   全局：页面右下角可挂载 `SearchDataCopilot` 悬浮按钮，随时打开 Copilot 抽屉进行数据搜索对话。
-   **对话页**：
    -   当用户在 SmartDataQuery 中选择某个助手并提交问题后，会跳转到 `/chatkit/:agentKey` 对话页，由 `ChatKit` 组件承载完整对话体验。

### 3.3 交互行为（输入框与场景 Agent）

-   **1）页面首次加载（默认行为）**

    -   SmartDataQuery 首页加载完成后，会调用 `getSearchAgentInfo` 接口获取默认的智能问数 Agent 信息（例如默认业务域、默认助手等）。
    -   同时调用 `getAssistantList` 接口获取已上架的场景 Agent 列表，在输入框下方渲染为「场景标签」。
    -   默认情况下未选中任何场景标签，此时使用的 Agent 为 `getSearchAgentInfo` 返回的默认 Agent（后续用于路由跳转）。

-   **2）右侧输入框提交问题**

    -   用户在右侧输入框中输入内容后，有两种触发方式：
        -   在输入框中按下 **Enter 回车键**；
        -   点击输入框内部的 **发送按钮 / 查询按钮**。
    -   触发后，会执行与 `Assistant` 组件中 `handleCardClick` 相同的跳转逻辑，将用户引导到对应助手的对话页。

    相关逻辑实现（节选自 `src/components/Assistant/index.tsx` 第 103–113 行）：

    ```typescript
    const handleCardClick = (item: IAgentItem) => {
        // 跳转到聊天页面，agentId 作为路径参数，agentName 和 businessDomain 作为查询参数
        const params = new URLSearchParams({
            agentName: item.name,
            agentKey: item.key,
            businessDomain: item.business_domain_id || '',
        })

        const newUrl = `/chatkit/${item.key}?${params.toString()}`
        navigate(newUrl)
    }
    ```

    -   右侧输入框提交时会构造与上述逻辑一致的 URL：
        -   路径参数 `:agentKey`：
            -   若**未选择场景标签**：使用 `getSearchAgentInfo` 返回的 `adp_agent_key`；
            -   若**已选择场景标签**：使用当前选中场景 Agent 的 `key`。
        -   查询参数：
            -   `agentName`：
                -   默认场景：文案固定为「智能问数」；
                -   选中场景标签时：使用该场景 Agent 的 `name`。
            -   `agentKey`：与路径参数保持一致（冗余传递，便于对话页使用）。
            -   `businessDomain`：
                -   默认场景：使用 `getSearchAgentInfo` 返回的 `adp_business_domain_id`；
                -   选中场景标签时：使用该场景 Agent 的 `business_domain_id`。

-   **3）场景 Agent 标签交互**

    -   标签位置：紧贴主输入框**上方**（当有选中场景时）或**下方**（当无选中时），见下「选中后展示」。
    -   数据来源：`getAssistantList` 返回的已上架助手集合（场景 Agent）。
    -   **未选中时**：在输入框**下方**展示一整行场景标签（若溢出则通过「更多」下拉展示）。
    -   单个场景标签：
        -   显示文案为场景 Agent 的名称；
        -   最大宽度为 120px，超出时使用省略号（`...`）展示；
        -   悬浮时通过 Tooltip 展示完整名称；
        -   高度为 32px，文案垂直居中；
        -   标签之间、以及标签与「查看更多场景」按钮之间的间距为 12px。
    -   **选中后展示与隐藏**：
        -   用户从列表中点击某个场景标签后，**整个场景标签列表区域不再显示**；
        -   当前选中的场景 Agent 以**单个标签**形式展示在**输入框上边**；
        -   该选中标签内显示：头像 + 场景名称；**悬浮时在标签内右侧出现「x」按钮**，点击 x 可删除该标签；
        -   **删除标签后**：列表重新恢复显示，状态恢复到初始（未选中任何场景、无预设问题），标签操作**不影响**输入框已有输入内容与提交逻辑。
    -   选中逻辑（提交时使用的 Agent）：
        -   点击某个场景标签后，在内存中记录当前选中场景 Agent，并调用 `getAgentVersionV0(agent.key)` 拉取该 Agent 的 `preset_questions`（见 4.4）；
        -   之后在输入框中提交问题时，使用该选中场景 Agent 的信息进行跳转；
        -   通过 x 删除选中标签后，恢复为使用默认 Agent（`getSearchAgentInfo` 返回的 Agent）进行跳转。
    -   「更多」行为：
        -   当场景标签数量较多时，只在首行展示部分标签，其余标签收纳到「更多」入口中；
        -   「更多」入口展示在标签行末尾；
        -   点击或悬浮「更多」时，展开为下拉列表，下拉中展示被收纳的标签项，交互与主行标签一致（可选中、可切换当前场景）。
    -   「查看更多场景」按钮：
        -   按钮文案固定为「查看更多场景」，按钮样式固定为 `link` 类型；
        -   当场景数量较少、未触发「更多」时，按钮直接显示在标签行最后一个标签后面；
        -   当存在「更多」入口时，按钮放入「更多」下拉中，在所有标签项之后展示；
        -   点击「查看更多场景」后，通过路由跳转到 `/Assistant` 页面，方便用户浏览和管理全部助手。

-   **3.3.1 预设问题（preset_questions）**

    -   **数据来源**：选中某个场景 Agent 后，会请求 `getAgentVersionV0(agent.key)`，从返回的 `data.config.preset_questions` 读取数组（可能不存在）。
    -   **展示**：若 `preset_questions` 存在且为非空数组，则在**输入框下方**以**标签形式纵向排列**展示，每个标签的展示值为 `preset_questions[x].question`；标签宽度随内容变化，若内容过长超出外层布局，在**标签内部换行**显示。
    -   **交互**：点击某个预设问题标签时，**直接触发与输入框回车相同的提交逻辑**，且提交的 `question` 为当前点击标签的 `question` 值（不修改输入框内的文本，仅用该 question 发起跳转）。

-   **4）跳转到 ChatKit 对话页**
    -   SmartDataQuery 只负责收集问题和路由参数，真正的对话逻辑由 `ChatKit` 组件处理。
    -   当路由跳转到 `/chatkit/:agentKey` 后，对话页会根据 URL 中的 `agentKey` 和查询参数进行初始化，加载对应助手、业务域和历史对话。

### 3.4 外部链接 / 路由跳转

-   **内部路由**：
    -   智能问数对话页：`/chatkit/:agentKey`
    -   首页（助手列表 + 右侧输入框）：`/`
-   **路由参数说明**：
    -   `:agentKey`（path param）：指定当前会话使用的助手
    -   `agentName`（query）：用于对话页展示标题、副标题等
    -   `agentKey`（query）：与 path param 保持一致，便于透传
    -   `businessDomain`（query）：用于区分不同业务域的智能问数上下文

## 4. 数据与接口说明

### 4.1 默认 Agent 信息获取（getSearchAgentInfo）

-   **接口用途**：在 SmartDataQuery 页面加载时获取默认的智能问数 Agent 信息，为右侧输入框和后续对话初始化提供基础配置。
-   **接口路径**：`/api/af-sailor-agent/v1/assistant/search/info`
-   **请求方法**：`GET`
-   **请求参数**：无
-   **返回结构**（与 `SearchDataCopilot` 共用）：

    ```typescript
    {
        res: {
            adp_agent_key: string // 关联的 adp agent key
            adp_business_domain_id: string // 关联的 adp business_domain_id
        }
    }
    ```

-   **封装方法**：`@/core/apis/afSailorService.getSearchAgentInfo()`
-   **在 SmartDataQuery 中的使用方式**：
    -   页面初始化时调用一次；
    -   将返回的 `adp_agent_key`、`adp_business_domain_id` 作为右侧输入框和后续路由跳转的**默认配置**；
    -   当用户未选中任何场景标签时，始终使用该默认 Agent 进行问数跳转。

### 4.2 场景 Agent 列表获取（getAssistantList）

-   **接口用途**：为 SmartDataQuery 右侧输入框下方的「场景 Agent 标签」区域提供数据来源。
-   **接口路径**：`/api/af-sailor-agent/assistant/agent/list`
-   **请求方法**：`POST`
-   **请求参数**：使用 `IGetAssistantListParams` 结构，根据业务配置筛选已上架的场景助手，例如：

    ```typescript
    interface IGetAssistantListParams {
        // ...
        list_flag: 0 | 1 // 是否上架（1 表示只获取已上架的助手）
        is_to_square?: 0 | 1
        publish_to_be?: IPublishToBe // 如 'web_sdk_agent'
        size?: number // 返回条数
        // ...
    }
    ```

-   **返回结构**：`IAgentList`，其中 `entries` 为 `IAgentItem[]`，每个场景 Agent 会作为一个标签展示在输入框下方。
-   **封装方法**：`@/core/apis/afSailorService.getAssistantList()`
-   **在 SmartDataQuery 中的使用方式**：
    -   页面初始化时调用一次或按需调用；
    -   使用返回的 `entries` 渲染场景标签；仅在**未选中**任何场景时展示该列表；标签点击后调用 `getAgentVersionV0` 并写入选中 Agent 与 `preset_questions` 状态。

### 4.3 Agent 版本 v0 与预设问题（getAgentVersionV0）

-   **接口用途**：在用户选中某个场景 Agent 后，获取该 Agent 的 v0 版本配置，其中包含 `preset_questions`，用于在输入框下方展示预设问题标签。
-   **接口路径**：`/api/agent-factory/v3/agent-market/agent/:key/version/v0`
-   **请求方法**：`GET`
-   **路径参数**：`key` — 场景 Agent 的 key。
-   **返回结构**：`IAgentVersionV0Res`（见 `@/core/apis/afSailorService/index.d`），其中：
    -   `data.config.preset_questions` 为可选数组，项为 `{ question: string }`；
    -   若不存在或非数组，则按空数组处理，不展示预设问题区域。
-   **封装方法**：`@/core/apis/afSailorService.getAgentVersionV0(key)`
-   **在 SmartDataQuery 中的使用方式**：
    -   在 `handleSceneTagClick` 中，用户选中某场景 Agent 后调用 `getAgentVersionV0(agent.key)`；
    -   从返回的 `data.config.preset_questions` 写入组件状态，在输入框下方以纵向标签展示；点击预设问题标签时以该 `question` 直接触发提交（等价于输入框回车）。

### 4.4 与 SearchDataCopilot 的协同

-   SmartDataQuery 页面中可以同时存在：
    -   右侧固定输入框（页面级智能问数入口 + 场景 Agent 标签）；
    -   `SearchDataCopilot` 悬浮按钮（全局 Copilot 入口）。
-   两者的差异与协同：
    -   **右侧输入框 + 场景标签**：面向当前 SmartDataQuery 场景的问数入口，用户可以快速在若干预设的场景 Agent 之间切换，直接跳转到 `/chatkit/:agentKey` 对话页。
    -   **SearchDataCopilot**：通过抽屉形式提供全局数据搜索能力，可在任意页面快速打开，适合跨场景的数据检索与分析。
    -   二者在底层都依赖 `getSearchAgentInfo`、`getAssistantList` 等接口保证 Agent 信息一致性。

## 5. 注意事项

-   **路由一致性**：右侧输入框与 `Assistant` 卡片点击都应复用同一套跳转逻辑，避免 URL 参数不一致导致对话页初始化异常。
-   **Agent 信息依赖**：`getSearchAgentInfo` 接口异常时，需要在右侧输入区域给出明显的错误提示，避免用户提交后跳转到不可用的对话页。
-   **业务域隔离**：`businessDomain` 参数是对话上下文的重要部分，在构造跳转 URL 时必须确保与当前助手/页面业务域保持一致。
-   **与 Copilot 的关系**：SmartDataQuery 的右侧输入框更偏向「当前业务页面」的问数入口，Copilot 更偏向「全局数据搜索助手」，产品设计上应避免两者角色混淆。
