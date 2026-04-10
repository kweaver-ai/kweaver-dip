# DigitalHumanList（数字员工列表）

以**响应式网格**展示 `DigitalHuman[]`：容器宽度变化时自动计算列数，每张卡片宽度约束在合理区间内；单张卡片展示头像、名称、简介，以及技能 / 知识网络 / 通道数量摘要，并支持整卡点击与右上角更多菜单。

---

## 适合谁读

- 要改列表布局、卡片信息展示或列宽算法的贡献者  
- 在业务页接入列表、需要对接 `onCardClick` / `menuItems` 的同学  

---

## 功能概览

| 能力 | 说明 |
|------|------|
| 响应式列布局 | 使用 `react-virtualized-auto-sizer` 测量宽度，`computeColumnCount` 计算列数（见 `utils.tsx`） |
| 卡片展示 | `EmployeeCard`：头像（或 `AppIcon` 占位）、名称、`creature` 简介、底部三项计数 |
| 交互 | 可选整卡点击；可选按行传入 Ant Design `Dropdown` 菜单项 |

列表**不**负责拉取数据：由父组件传入 `digitalHumans`（例如 `src/pages/DigitalHuman/Management/index.tsx` 配合 `getDigitalHumanList`）。

---

## 目录结构（速查）

```
DigitalHumanList/
├── index.tsx        # 列表容器：AutoSizer + Row/Col + ScrollBarContainer
├── EmployeeCard.tsx # 单张卡片 UI 与菜单
├── utils.tsx        # 列数计算与卡片宽高、间距等常量
└── __tests__/       # Vitest：index、EmployeeCard、utils
```

---

## 组件接口

`DigitalHumanList` 接收：

| 属性 | 类型 | 说明 |
|------|------|------|
| `digitalHumans` | `DigitalHuman[]` | 列表数据，类型来自 `@/apis` |
| `onCardClick` | `(digitalHuman: DigitalHuman) => void`（可选） | 点击卡片（非菜单按钮区域由 Card 触发） |
| `menuItems` | `(digitalHuman: DigitalHuman) => MenuProps['items']`（可选） | 每张卡片可配置不同的下拉菜单项 |

`EmployeeCard` 另接收由列表计算的 `width`，一般不单独对外导出使用场景以外再包一层。

---

## 布局与算法说明

- **列数**：`computeColumnCount(containerWidth)` 在 `minCardWidth`（348）与 `maxCardWidth`（480）之间折中列数，使 `width / count` 落在合理范围；实现见 `utils.tsx` 注释。  
- **滚动**：外层使用项目内 `ScrollBarContainer`，列表区域为 `flex-1` / `min-h-0` 以在父级 flex 布局下正确滚动。  
- **卡片高度**：固定约 282px（与 `cardHeight` 常量一致），底部栏展示技能 / 知识 / 通道数量；扩展字段来自 `digitalHuman` 上的可选 `skills`、`bkn`、`channel`（与详情结构对齐时由接口填充）。

---

## 类型名说明

后端/类型定义中可能存在名为 `DigitalHumanList` 的 **TypeScript 类型**（例如列表接口返回类型），与本目录的 **React 组件** `DigitalHumanList` 同名不同义：阅读代码时以 import 来源为准。

---

## 样式说明

- 列表与卡片主要使用 **Tailwind** 与 Ant Design `Card` / `Dropdown`；无独立 `*.module.less`。

---

## 相关测试

在 `apps/dip` 目录下执行（与仓库脚本一致）：

```bash
pnpm test
```

仅跑本组件相关用例时可用 Vitest 文件过滤，例如：

```bash
pnpm vitest run src/components/DigitalHumanList
```
