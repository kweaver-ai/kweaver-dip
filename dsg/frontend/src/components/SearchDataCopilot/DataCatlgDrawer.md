# DataCatlgDrawer 组件文档

## 1. 组件介绍

-   **组件用途**：数据目录抽屉组件，用于在抽屉中展示数据目录列表，支持点击打开目录详情
-   **使用场景**：在数据搜索、智能问答等场景中，当 AI 返回数据目录推荐结果时，通过抽屉形式展示给用户，用户可点击查看目录详情

## 2. 组件结构

-   **所在目录**：`src/components/SearchDataCopilot/`
-   **组件名称**：DataCatlgDrawer
-   **文件**：
    -   `DataCatlgDrawer.tsx` - 组件主文件（待实现）
    -   `DataCatlgDrawer.md` - 组件文档

## 3. 交互设计

### 3.1 Figma 设计稿链接

-   **组件设计**: https://www.figma.com/design/ikuqIWpd1CmGh6fMO9PHlK/%E6%99%BA%E8%83%BD%E9%97%AE%E6%95%B0?node-id=117-8218&t=n5yXi5d0XIihT97D-4

### 3.2 布局结构

-   **抽屉容器**：使用 antd Drawer 组件，支持自定义位置（placement）
-   **列表展示**：抽屉内展示数据目录列表，每个目录项包含标题、描述等信息
-   **交互按钮**：每个目录项支持点击操作，触发打开目录详情

### 3.3 交互行为

-   **用户操作**：
    -   点击目录项：触发 `onOpenCatlog` 回调，打开目录详情
    -   点击关闭按钮或遮罩：触发 `onClose` 回调，关闭抽屉
-   **状态变化**：
    -   `open` 为 `true` 时显示抽屉，为 `false` 时隐藏抽屉
    -   抽屉位置由 `placement` 参数控制（如 `right`、`left`、`top`、`bottom`）
-   **默认行为**：
    -   组件挂载时根据 `open` 参数决定是否显示
    -   数据为空时显示空状态

### 3.4 外部链接/跳转

-   **外部链接**：无
-   **链接文案**：无

## 4. 代码实现

### 4.1 Props 接口

-   **接口定义**：

```typescript
interface IDataCatlgDrawerProps {
    /** 控制抽屉显示/隐藏 */
    open: boolean
    /** 抽屉位置，可选值：'left' | 'right' | 'top' | 'bottom' */
    placement?: 'left' | 'right' | 'top' | 'bottom'
    /** 数据目录列表数据 */
    data: IDataCatalogItem[]
    /** 关闭抽屉回调 */
    onClose: () => void
    /** 打开目录详情回调 */
    onOpenCatlog: (item: IDataCatalogItem) => void
}

interface IDataCatalogItem {
    /** 目录 ID */
    id: number
    /** 目录编码 */
    code: string
    /** 目录类型 */
    type: 'data_catalog'
    /** 目录标题 */
    title: string
    /** 目录描述 */
    description?: string
}
```

-   **参数说明**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| open | boolean | 是 | - | 控制抽屉显示/隐藏 |
| placement | 'left' \| 'right' \| 'top' \| 'bottom' | 否 | 'right' | 抽屉位置 |
| data | IDataCatalogItem[] | 是 | - | 数据目录列表数据 |
| onClose | () => void | 是 | - | 关闭抽屉回调函数 |
| onOpenCatlog | (item: IDataCatalogItem) => void | 是 | - | 打开目录详情回调函数，参数为点击的目录项数据 |

-   **示例**：

```typescript
import DataCatlgDrawer from '@/components/SearchDataCopilot/DataCatlgDrawer'

const [drawerOpen, setDrawerOpen] = useState(false)
const [catalogData, setCatalogData] = useState<IDataCatalogItem[]>([])

// 使用组件
<DataCatlgDrawer
    open={drawerOpen}
    placement="right"
    data={catalogData}
    onClose={() => setDrawerOpen(false)}
    onOpenCatlog={(item) => {
        // 打开目录详情
        console.log('打开目录:', item)
    }}
/>
```

### 4.2 默认行为

-   **初始化状态**：
    -   `open`: 由外部传入，控制抽屉显示/隐藏
    -   `placement`: 默认 `'right'`（从右侧滑出）
    -   `data`: 由外部传入，默认为空数组
-   **默认值**：
    -   抽屉宽度（placement 为 left/right 时）：`480px`
    -   抽屉高度（placement 为 top/bottom 时）：`400px`
    -   遮罩可点击关闭：`true`
    -   显示关闭按钮：`true`

### 4.3 数据加载

-   **数据来源**：由外部通过 `data` 参数传入
-   **加载时机**：组件不负责数据加载，数据由父组件管理
-   **加载状态**：组件不处理加载状态，由父组件控制

### 4.4 样式规范

-   **样式方案**：使用 CSS Modules（`.module.less`）
-   **关键样式**：
    -   抽屉容器：使用 antd Drawer 组件默认样式
    -   列表项：每个目录项包含标题、描述等信息的卡片样式
    -   点击区域：整个目录项可点击，悬浮时有视觉反馈
-   **特殊样式**：
    -   目录项标题：字体加粗，支持多行显示，超出部分省略
    -   目录项描述：支持多行显示，超出部分省略，显示省略号
    -   空状态：数据为空时显示空状态提示

### 4.5 性能优化

-   **优化措施**：
    -   使用 `React.memo` 优化组件渲染，避免不必要的重渲染
    -   列表项使用虚拟滚动（如数据量大时）
    -   目录项点击事件使用防抖处理（如需要）
-   **注意事项**：
    -   数据更新时，组件会自动重新渲染
    -   建议父组件使用 `useMemo` 缓存 `data` 数据，避免频繁更新

## 5. 技术实现细节

### 5.1 依赖组件

-   **antd**：提供 `Drawer` 组件用于抽屉容器，`List` 组件用于列表展示
-   **@/icons**：提供图标组件（如需要）
-   **@/ui**：提供 `Empty` 组件用于空状态展示

### 5.2 数据格式

```typescript
// 数据目录项结构
interface IDataCatalogItem {
    id: number // 目录 ID，如：601589159219489300
    code: string // 目录编码，如："SJZYML20260111/000007"
    type: 'data_catalog' // 目录类型，固定为 'data_catalog'
    title: string // 目录标题，如："A股上市公司股本结构信息表"
    description?: string // 目录描述，可选
}

// 数据示例
const exampleData: IDataCatalogItem[] = [
    {
        description:
            '该表用于记录A股上市公司股本结构的变动信息，涵盖流通股本与非流通股本的各类细分类型，如限售股本、境内法人持股、高管持股、外资持股等。表中还包含变动日期和变动原因，用于追踪股本结构的历史变化，适用于金融分析、公司治理研究、投资决策支持等领域。',
        id: 601589159219489300,
        code: 'SJZYML20260111/000007',
        type: 'data_catalog',
        title: 'A股上市公司股本结构信息表',
    },
    {
        id: 601589158615509500,
        code: 'SJZYML20260111/000006',
        type: 'data_catalog',
        title: 'A股上市公司财务指标表',
        description:
            '本表用于记录和分析A股上市公司的财务指标，涵盖盈利能力、资产运营效率、偿债能力及现金流状况等多个维度。适用于财务分析、投资决策支持、企业绩效评估等领域，帮助用户全面了解上市公司的财务健康状况和经营表现。',
    },
]
```

### 5.3 事件处理

```typescript
// 关闭抽屉
const handleClose = () => {
    onClose()
}

// 打开目录详情
const handleOpenCatalog = (item: IDataCatalogItem) => {
    onOpenCatlog(item)
}
```

### 5.4 组件结构示例

```typescript
<Drawer
    open={open}
    placement={placement}
    onClose={onClose}
    title="数据目录"
    width={placement === 'left' || placement === 'right' ? 480 : undefined}
    height={placement === 'top' || placement === 'bottom' ? 400 : undefined}
>
    {data.length === 0 ? (
        <Empty description="暂无数据目录" />
    ) : (
        <List
            dataSource={data}
            renderItem={(item) => (
                <List.Item
                    onClick={() => handleOpenCatalog(item)}
                    className={styles.catalogItem}
                >
                    <div className={styles.itemTitle}>{item.title}</div>
                    {item.description && (
                        <div className={styles.itemDescription}>
                            {item.description}
                        </div>
                    )}
                </List.Item>
            )}
        />
    )}
</Drawer>
```

## 6. 注意事项

-   **特殊逻辑**：
    -   目录项点击时，会调用 `onOpenCatlog` 回调，并传入完整的目录项数据
    -   抽屉关闭时，会调用 `onClose` 回调，父组件需要更新 `open` 状态
    -   数据为空时，显示空状态提示
-   **边界情况**：
    -   `data` 为空数组时，显示空状态
    -   `data` 中某个目录项缺少 `title` 时，显示默认文案或 `code`
    -   `description` 为空时，不显示描述区域
    -   `onOpenCatlog` 回调中，父组件需要处理目录详情的打开逻辑
-   **依赖关系**：
    -   依赖 `antd` 的 `Drawer` 和 `List` 组件
    -   依赖父组件传入的数据和回调函数
-   **已知问题**：
    -   无
-   **后续优化**：
    -   可考虑添加目录项加载状态
    -   可考虑添加目录项搜索/筛选功能
    -   可考虑添加目录项收藏功能
    -   可根据实际需求调整抽屉宽度和样式

## 7. 接口说明

-   **组件不涉及外部接口调用**，所有数据由父组件通过 `data` 参数传入
-   **目录详情打开逻辑**：由父组件在 `onOpenCatlog` 回调中实现，可能需要调用相关接口获取目录详情
