---
description: 启动 SDD 工作流 (智能场景判断)
---

## SDD 智能启动

**你的需求**: $ARGUMENTS

---

### Step 1: 场景判断

我会自动分析当前情况:

#### 1.1 检查项目状态

- `specs/{feature}/` 目录是否存在？
- 是否有现有的 `spec.md`、`plan.md`、`tasks.md`？

#### 1.2 分析变更类型

| 场景 | 条件 | 工作流 |
|------|------|--------|
| 🆕 **新功能** | specs/{feature}/ 不存在 | 完整 5 阶段 |
| 🔧 **小改动** | 已有 spec, 变更<50行 | 快速 4 步骤 |
| ➕ **扩展** | 添加子功能，保持架构 | 增量 5 步骤 |
| 🔄 **重构** | 涉及破坏性变更 | 迁移 6 步骤 |

---

### Step 2: 执行对应工作流

根据判断结果，参考对应文档:

- 场景一: `.specify/workflows/scenario-1-new.md`
- 场景二: `.specify/workflows/scenario-2-update.md`
- 场景三: `.specify/workflows/scenario-3-extend.md`
- 场景四: `.specify/workflows/scenario-4-refactor.md`

---

### Step 3: Delta 格式 (场景三/四)

扩展或重构时，使用 Delta 格式标记变更:

```markdown
## ADDED Requirements
新增的需求...

## MODIFIED Requirements
修改的需求 (完整更新后文本)...

## REMOVED Requirements
移除的需求...
```

---

### Step 4: 人工检查点

⚠️ 每个阶段完成后我会停止等待确认:

- **Phase 2 (Specify)** → 确认需求定义
- **Phase 3 (Plan)** → 确认技术方案
- **Phase 4 (Tasks)** → 确认任务拆分

---

### 参考文档

- 场景决策树: `.specify/workflows/README.md`
- 项目宪法: `.specify/memory/constitution.md`
- Spec 模板: `.specify/templates/spec-template.md`
