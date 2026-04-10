# DigitalHumanSetting（数字员工配置）

本目录包含「数字员工」在**创建 / 编辑 / 查看**场景下的**配置内容区**：左侧为配置项导航，右侧为对应表单与列表。**顶栏（返回、标题、取消、发布等）不在本组件内**，由外层页面（如详情页）负责。

---

## 适合谁读

- 想改「基本设定 / 技能 / 知识 / 通道」任一子模块的贡献者  
- 需要知道数据从哪来、和哪些 API / Store 打交道的前端同学  

---

## 功能概览

| 模块 | 说明 |
|------|------|
| 基本设定 | 名称、描述、形象与灵魂等基础信息 |
| 技能配置 | 已绑定技能、选择/上传技能等 |
| 知识配置 | 知识库选择与绑定 |
| 通道接入 | 渠道/凭证类配置 |

菜单项与顺序见 `utils.tsx` 中的 `deSettingMenuItems`，键名枚举为 `DESettingMenuKey`（`types.ts`）。

---

## 目录结构（速查）

```
DigitalHumanSetting/
├── index.tsx              # 左侧菜单 + 右侧内容路由（按菜单切换子组件）
├── types.ts               # 菜单 key、菜单项类型
├── utils.tsx              # 菜单配置数据
├── digitalHumanStore.ts   # Zustand：当前数字员工详情、技能、知识、通道、dirty 等
├── BasicSetting/          # 基本设定
├── SkillConfig/           # 技能配置（含弹窗、抽屉、上传等）
├── KnowledgeConfig/       # 知识配置
├── ChannelConfig/         # 通道接入
├── ActionModal/           # 如删除等通用弹窗
└── AdPromptInput/         # 与提示词编辑相关的输入组件（供配置区复用）
```

各子目录通常包含 `index.tsx`、按需的 `*.module.less`，以及 `__tests__/` 下的 Vitest 测试。

---

## 组件接口

`DigitalHumanSetting` 接收：

| 属性 | 类型 | 说明 |
|------|------|------|
| `readonly` | `boolean`（可选） | 为 `true` 时子模块以只读方式展示，避免误编辑 |

---

## 数据与状态

- **页面级共享状态**在 `digitalHumanStore.ts`（Zustand）：当前 `uiMode`（create / edit / view）、`digitalHumanId`、详情快照、基础信息、技能列表、知识 `bkn`、通道 `channel`、`dirty` 等。  
- 子模块通过该 store 与 `@/apis` 类型协作；改某一子域前建议先读 store 里的字段含义与 `bindDigitalHuman` 等行为。

---

## 样式说明

- 本组件根布局使用 **Tailwind** 类名（与项目全局样式变量如 `--dip-primary-color` 等配合）。  
- 子模块中复杂区块使用 **CSS Modules**（`*.module.less`），与仓库其余页面保持一致。

---

## 设计稿（Figma，可选参考）

以下为产品/设计参考链接，若权限或文件变更导致无法打开，以当前代码为准。

- [整体 - 基本设定节点](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=1-644&t=OnGVj9Tt0YHIbMMR-4)  
- **技能配置**  
  - [已配置 - 空](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=12-146&t=OnGVj9Tt0YHIbMMR-4)  
  - [已配置 - 有数据](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=12-659&t=OnGVj9Tt0YHIbMMR-4)  
  - 创建技能： [步骤一](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=23-1020&t=OnGVj9Tt0YHIbMMR-4) · [步骤二](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=23-1502&t=OnGVj9Tt0YHIbMMR-4) · [步骤三](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=24-1768&t=OnGVj9Tt0YHIbMMR-4)  
- [知识配置](https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=24-1986&t=OnGVj9Tt0YHIbMMR-4)  

---

## 相关测试

子目录下的 `__tests__` 覆盖各模块行为；修改交互或 store 时建议运行应用内测试命令（见 `apps/dip` 的 `package.json` 中 test 脚本）。
