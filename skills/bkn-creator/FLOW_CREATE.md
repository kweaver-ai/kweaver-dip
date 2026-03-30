# 新增流程（Create）

## 流程目标

从业务输入生成可推送的 BKN，并完成绑定、推送与验证。

## 验证阶段：流程路由确认（进入新增流程前）

- MUST：先回显“识别结果 + 路由目标 + 输入摘要”，并发起确认请求
- MUST：仅当用户明确确认“进入新增流程”后，才可进入阶段一
- Never：在验证阶段未确认前输出“阶段一/Step 1”或任何提取动作

## 阶段序列（5 阶段）

1. 阶段一：建模意图澄清
2. 阶段二：生成 BKN 草案
3. 阶段三：环境检查（执行前）
4. 阶段四：数据视图绑定
5. 阶段五：推送与验证

## 阶段门禁

| 阶段 | 进入条件 | 退出条件（MUST） |
|------|----------|-------------------|
| 阶段一 | 用户确认进入新增流程 | 视角确认（A1/B1）+ 清单确认（A2/B2 或 C1）+ 业务规则检查完成（或用户确认带风险继续） |
| 阶段二 | 阶段一完成 | `kweaver bkn validate` 通过 + 用户确认草案 |
| 阶段三 | 阶段二完成 | 连通性完成 + GKN 情况记录完成 |
| 阶段四 | 阶段三完成 | 绑定率 `>= 80%` 或用户确认“跳过未绑定对象并继续” + 用户确认绑定结果 |
| 阶段五 | 阶段四完成 | 推送成功 + 完整性检查 + 孤悬检查反馈 |

> 详细确认语义与全局约束见 `./COMMON_RULES.md`。对用户可见输出必须使用“用户回显模板（统一格式）”。

## 展示策略（MUST）

- 默认仅输出摘要回显（数量、状态、风险、下一步），避免重复展开同一数据
- 同一轮仅允许一种主展示格式，禁止同一数据同时用表格与 YAML/JSON 重复展示
- 仅当用户明确请求时才输出详情（如“展开详情”“导出 YAML”“给我表格”）
- 详情输出一次仅允许一种格式（表格 或 YAML/JSON）

## 阶段一：建模意图澄清

进入条件（前置）：验证阶段路由确认已通过。

### Step 1：输入类型判定

- A 结构化文档：可直接提取实体
- B 部分信息：可识别出 3+ 候选对象
- C 委托建模顾问：输入或中间结果不稳定，需要建模顾问收敛

### 路径 A（结构化文档）

1. 声明采用单一建模视角（如实体-关系）
2. 门禁确认 A1：用户确认视角后再提取
3. 提取对象类/关系类清单（先经 `./references/DOMAIN_ROUTING.md` 统一调度）
4. 门禁确认 A2：用户确认清单后进入阶段二

### 路径 B（部分信息）

1. 提出 2-3 个建模视角并对比
2. 门禁确认 B1：用户确认所选视角
3. 提取对象类/关系类清单
4. 门禁确认 B2：用户确认清单后进入阶段二

### A1/B1 门禁硬约束（MUST）

- 在 A1 或 B1 未确认前，Never 执行任何对象类/关系类提取动作
- 若误执行了提取，必须立即中止并回滚到 A1/B1 确认步骤

### 路径 C（委托建模顾问）

触发条件（满足任一即可，MUST）：

1. 输入模糊：对象/关系不清晰
2. 领域冲突：候选领域分差小且用户未确认主领域
3. 待确认项过多：`pending_objects >= 3`
4. 清单质量不足：关系方向冲突、主键缺失或命名异常导致无法稳定进入阶段二

1. 读取并委托：`../bkn-modeling-advisor/SKILL.md`
2. 接收建模清单（对象/关系/操作）
3. 门禁确认 C1：展示并确认后进入阶段二

### 领域识别与统一调度（并行规则）

若 A1/B1 已确认，MUST 先读取 `./references/DOMAIN_ROUTING.md` 进行领域识别与路由，再执行提取：

1. 命中领域：读取 `./references/<domain>/domain_*.md` 执行领域提取  
2. 候选冲突：先请求用户确认主领域，再进入领域提取  
3. 未命中领域：读取 `./references/common/generic_extraction.md` 执行通用提取

### 业务规则提取检查清单（阶段一末尾，MUST）

阶段一结束前，必须完成业务规则检查并形成结构化结果（默认以摘要回显给用户）：

| 检查项 | 提取位置 | 完成标准 |
|--------|----------|----------|
| 主键/外键规则 | 对象描述 / Data Properties | 已标注关联字段与主键候选 |
| 数据过滤规则 | 对象描述 / 关系证据 | 已记录过滤条件 |
| 状态枚举规则 | Data Properties Description | 已列出关键枚举值 |
| 计算/判定规则 | Logic Properties / 对象描述 | 已记录公式或判断条件 |
| 层级/BOM规则 | 对象描述 | 已说明层级与替代/版本约束 |

内部结构格式（示例，默认不对用户直出）：

```yaml
rule_extraction_check:
  - object: bom
    rules_extracted: [替代料规则(alt_priority), 版本规则(bom_version)]
    status: complete
  - object: mrp_plan_order
    rules_extracted: [过滤规则(closestatus_title)]
    status: complete
  - object: inventory
    rules_extracted: []
    status: warning
```

门禁要求（MUST）：

- 存在 `warning` 时，必须先输出风险提示并请求用户确认是否带风险继续
- 未获得“带风险继续”明确确认前，不得进入阶段二
- 默认仅回显检查摘要（完整/告警数量 + 关键告警项）；如用户明确要求，再展示完整结构详情

## 阶段二：生成 BKN 草案

- MUST 读取并委托：`../create-bkn/SKILL.md`
- MUST：目录与落盘位置仅按 `bkn-creator` 内置规则执行（`./COMMON_RULES.md` + 本文件）；禁止引用外部目录类 skill/规则
- 输出目录（统一目录管理）：`network_dir = archives/{ARCHIVE_ID}/{TIMESTAMP}/{NETWORK_DIR_NAME}`
- 生成目录前必须先拿到 `ARCHIVE_ID` 与 `TIMESTAMP`；任一缺失则中止并回执 `ARCHIVE_STATUS: BLOCKED`
- 质量检查：
  - `network.bkn` 的 `id` 留空（阶段五回填）
  - `network.bkn` MUST 补齐默认样式：`icon: icon-dip-graph`、`color: #0e5fc5`
  - 所有 `object_types/*.bkn` MUST 设置 `color`，按“随机颜色”策略分配（可复现即可，不要求真正随机源）
  - 对象类 Data Source 标记为“待绑定”，映射字段留空
  - `comment` / Description 完整
- 样式补齐门禁（MUST）：
  - 未完成网络默认样式或对象类颜色分配前，不得进入阶段三
  - 若对象类已有颜色且用户未要求覆盖，保持原值不改
- 草案人工复核门禁（MUST）：
  - 阶段二回显必须明确引导用户查看并复核草案文件：`network.bkn`、`object_types/*.bkn`、`relation_types/*.bkn`
  - 用户如需调整，必须允许其直接修改 `.bkn` 文件后再继续流程
  - 未收到“确认草案”或“已完成草案修改”前，不得进入阶段三
- 验证：委托 `kweaver-core` 执行 `kweaver bkn validate <network_dir>`

## 阶段三：环境检查（执行前）

- 读取并委托：`../kweaver-core/SKILL.md`
- 执行：`kweaver bkn list --limit 200`
- 输出：连通性状态、GKN 存在性、可用 `kn_id` 列表（完整 ID）
- 说明：若环境检查失败，保留已生成草案并暂停阶段四/五执行

## 阶段四：数据视图绑定

执行步骤（严格顺序）：

1. **Step 4.1：数据源线索提取**
   - 从输入文档与上下文提取已明确的数据视图线索
   - 产出 `data_source_map = { object_id: view_id | null }`
   - 线索值（名称/技术名/别名）仅可作为候选，不得直接写入绑定字段
2. **Step 4.2：现有视图匹配（MUST）**
   - 读取并委托 `../kweaver-core/SKILL.md` 执行视图查询与匹配
   - 视图存在性校验 MUST 使用 `kweaver dataview` 命令族执行，不得用网络/对象查询替代
   - 命中后绑定对应视图 `id`，并记录匹配依据与置信度
   - 对“对象类型中已存在的视图标识（如 `mdl_id` / 技术名）”，MUST 先通过 `kweaver dataview` 解析为视图 `id`，再做存在性校验并记录结果（`exists | not_found | ambiguous`）
   - 若原值为名称/技术名且已解析出视图 `id`，MUST 标记为“待回填替换”（`old_value -> dataview_id`）
   - 仅 `exists` 可计入“已绑定”；`not_found` / `ambiguous` 必须转入“待绑定（待修复）”
3. **Step 4.3：语义匹配（补充）**
   - 对仍未绑定对象，读取并委托 `../data-semantic/SKILL.md` 执行语义匹配
   - 记录候选视图、匹配来源与置信度
4. **Step 4.4：GKN 补充匹配**
   - 对前述仍未命中的对象，从 GKN 的对象类“业务对象”中筛选可复用视图（`mdl_id`）
5. **Step 4.5：绑定率统计与分组**
   - 输出 `binding_summary`（`total_objects` / `bound_objects` / `unbound_objects` / `binding_rate`）
   - 绑定率统计口径 MUST 基于“已通过存在性校验的绑定结果”，不得将未校验或校验失败项计入 `bound_objects`
   - 输出“已匹配组 / 未匹配组”与来源拆解（现有系统 / `data-semantic` / `GKN` / `manual`）
6. **Step 4.6：门禁确认**
   - 当 `binding_rate >= 80%`：发起确认请求，用户确认后进入阶段五
   - 当 `binding_rate < 80%`：必须暂停并要求用户选择“手动提供 / 跳过未绑定对象并继续 / 中止流程”
7. **Step 4.7：回填与差异确认**
   - 绑定视图后如有变更（新增绑定、替换绑定、解绑），MUST 先展示拟回填差异并发起确认请求
   - 已通过校验但当前值仍为名称/技术名的对象，MUST 在本步骤回填为视图 `id`（替换型变更），不得维持名称/技术名
   - 仅当用户明确确认“执行回填”后，才可写入 BKN 文件；Never 自动回填

阶段四退出条件（MUST）：

- 绑定率 `>= 80%` 或用户明确确认“跳过未绑定对象并继续”
- 未绑定对象清单已完整展示
- 已绑定对象的视图存在性校验已完成并输出结果
- 已解析出视图 `id` 的对象均已完成（或已确认）回填替换，不得残留名称/技术名绑定值
- 用户已确认绑定结果

语义约束（MUST）：

- “跳过未绑定对象并继续”仅表示未绑定对象维持未绑定状态进入阶段五
- 已绑定对象的 `mdl_id` 必须保留；除非用户明确要求，不得执行解绑
- 绑定值必须是视图 `id`；名称、技术名、别名不得作为最终绑定值

## 阶段五：推送与验证

推荐方式 A：先创建网络获取 `kn_id`，回填 `network.bkn`，再推送目录。

执行前门禁（MUST）：

- 推送前必须先委托 `kweaver-core` 检查同名/相似名称网络（基于 `kweaver bkn list` 结果）
- 若存在同名或相似网络，默认使用“基名 + 最新版本号”创建新网络（如 `_v5`）；Never 尝试更新既有网络
- 版本号规则：提取同基名历史版本中的最大版本号并 `+1`；若无版本后缀但已存在同名，则从 `_v2` 起
- 在执行 `kweaver bkn create` / `kweaver bkn push` 前，必须先展示命令摘要与影响面
- 仅当用户明确确认“执行推送”后，才可进入实际执行；Never 自动更新网络

```bash
kweaver bkn create --name "名称" --comment "描述"
kweaver bkn push <network_dir> --branch main
```

### 归档回执（MUST）

- 失败回执：`ARCHIVE_STATUS: BLOCKED` | `ARCHIVE_REASON: <原因>`
- 成功回执：`ARCHIVE_STATUS: OK` | `ARCHIVE_ROOT: archives/{ARCHIVE_ID}/`
- 若返回 WebUI 卡片，`archive_grid` 必须使用 `json` 围栏代码块，且仅返回一个目录级代码块

推送后必须执行：

1. 完整性检查（草案 vs 线上）
2. 孤悬对象类检查（无关系连接）

## 常见失败恢复

- `missing required field 'id'`：先创建网络拿 `kn_id` 并回填后重试
- `KnowledgeNetwork.NotFound`：检查是否使用了截断 ID
- `referential integrity`：检查关系类引用对象是否存在

## 回显模板（对用户）

### 模板：流程路由确认（验证阶段）

```text
### 流程路由确认（confirm | 确认请求）
内容：
- 识别结果：新增（Create）
- 路由目标：FLOW_CREATE
- 输入摘要：{input_summary}
- 说明：本阶段仅做流程路由，不进入具体执行步骤
下一步：请确认是否进入新增流程（回复：确认进入新增流程 / 先调整输入）。
```

### 模板：建模意图澄清（阶段一）

```text
### 建模意图澄清（confirm | 确认请求）
内容：
- 当前路径：{A | B | C}
- 建模视角：{selected_view}
- 选择依据：{reason_summary}
下一步：请确认是否采用该视角继续（回复：确认采用该视角 / 重新选择视角）。
```

### 模板：草案确认（阶段二）

```text
### BKN 草案确认（confirm | 确认请求）
内容：
- 草案目录：{network_dir}
- 校验结果：{validate_summary}
- 关键差异：{draft_highlights}
- 文件复核指引：
  - `{network_dir}/network.bkn`
  - `{network_dir}/object_types/*.bkn`
  - `{network_dir}/relation_types/*.bkn`
- 说明：如需调整，请直接修改上述 `.bkn` 文件
下一步：请回复“确认草案”进入阶段三，或在修改完成后回复“已完成草案修改”。如需详情可回复：展开草案详情 / 导出 YAML。
```

### 模板：归档失败回执（阶段五）

```text
ARCHIVE_STATUS: BLOCKED
ARCHIVE_REASON: {blocked_reason}
```

### 模板：归档成功回执（阶段五）

```text
ARCHIVE_STATUS: OK
ARCHIVE_ROOT: archives/{ARCHIVE_ID}/
```

### 模板：archive_grid（WebUI，目录示例）

```json
{
  "type": "archive_grid",
  "data": {
    "type": "folder",
    "archive_root": "archives/{ARCHIVE_ID}",
    "subpath": "{NETWORK_DIR_NAME}",
    "name": "{NETWORK_DIR_NAME}"
  }
}
```
