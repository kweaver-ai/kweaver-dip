# 场景三：功能扩展

> **适用于**: 在已有功能基础上添加子功能，保持向后兼容

---

## 适用条件

| 条件 | 状态 |
|------|------|
| specs/{feature}/ 目录 | ✅ 存在 |
| 已有 spec.md | ✅ 存在 |
| 变更规模 | ➕ 中等 (扩展) |
| 是否涉及新需求 | ✅ 是 (新增) |
| 是否涉及架构变更 | ❌ 否 (保持现有架构) |

---

## 典型场景

- 添加新的 API 端点
- 扩展数据库字段
- 添加子功能模块
- 功能增强

---

## 工作流总览

```
Step 1: 分析扩展点
    ↓
Step 2: 扩展 spec.md (添加 User Story + AC)
    ↓ ⚠️ 人工检查点
Step 3: 扩展 plan.md (添加 API/DDL)
    ↓ ⚠️ 人工检查点
Step 4: 更新 tasks.md (添加扩展任务)
    ↓ ⚠️ 人工检查点
Step 5: 执行实现
```

---

## Step 1: 分析扩展点

### 目标
确定扩展的范围和影响

### 活动
1. 阅读现有 `specs/{feature}/spec.md`
2. 理解现有架构和设计
3. 确定新增功能与现有功能的关系

### 输出
- 扩展范围定义
- 影响分析

### 检查清单
- [ ] 理解现有功能
- [ ] 确认不涉及破坏性变更
- [ ] 明确扩展边界

---

## Step 2: 扩展 spec.md

### 目标
使用 **Delta 格式** 添加新需求

### 活动

在 `specs/{feature}/spec.md` 中**追加**:

```markdown
---

## ADDED Requirements (v1.x 扩展)

### Story N: 新增功能标题 (P2)

AS a [角色]
I WANT [功能]
SO THAT [价值]

**独立测试**: 测试方法

### 新增验收标准

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-N1 | 场景 | WHEN 触发条件 | THE SYSTEM SHALL 行为 |
| AC-N2 | 场景 | WHEN 触发条件 | THE SYSTEM SHALL 行为 |

### 新增 Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-N1 | 边界情况 | 预期行为 |

### 新增 Business Rules

| ID | Rule | Description |
|----|------|-------------|
| BR-N1 | 规则 | 说明 |
```

### 更新版本历史

```markdown
| 1.1 | 2026-01-03 | 扩展人 | 新增: xxx 功能 |
```

### 检查清单
- [ ] 使用 Delta 格式标记
- [ ] 新增 Story 有独立测试
- [ ] AC 使用 EARS 格式
- [ ] 版本历史已更新

### ⚠️ 人工检查点
**停止并确认**: 新增需求定义是否完整？

---

## Step 3: 扩展 plan.md

### 目标
添加新功能的技术设计

### 活动

在 `specs/{feature}/plan.md` 中**追加**:

```markdown
---

## ADDED Design (v1.x 扩展)

### 新增 API 设计

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/xxx | 新功能 |

### .api 文件新增

```api
// 新增请求/响应类型
type NewReq { ... }
type NewResp { ... }

// 新增路由
@handler NewHandler
post /xxx (NewReq) returns (NewResp)
```

### 新增 DDL

```sql
ALTER TABLE xxx ADD COLUMN new_field VARCHAR(100);
-- 或新表
CREATE TABLE new_table (...);
```
```

### 检查清单
- [ ] API 与现有设计兼容
- [ ] DDL 不影响现有数据
- [ ] 新增设计已标记

### ⚠️ 人工检查点
**停止并确认**: 技术扩展方案是否可行？

---

## Step 4: 更新 tasks.md

### 目标
添加扩展实现任务

### 活动

在 `specs/{feature}/tasks.md` 中**追加**:

```markdown
---

## 扩展任务 (v1.x)

### Task N: [DDL] 新增 xxx 字段

**引用**: spec.md#AC-N1, plan.md#DDL
**预计代码**: ~10 行
...

### Task N+1: [API] 生成新增 API 代码

**引用**: plan.md#API
**预计代码**: ~50 行
...

### Task N+2: [LOGIC] 实现 xxx 逻辑

**引用**: spec.md#AC-N1
**预计代码**: ~40 行
...
```

### 检查清单
- [ ] 任务有明确引用
- [ ] 每个任务 < 50 行
- [ ] 任务顺序合理

### ⚠️ 人工检查点
**停止并确认**: 任务拆分是否合理？

---

## Step 5: 执行实现

### 目标
按顺序执行扩展任务

### 活动
1. 执行 DDL 任务
2. 执行 API 生成任务
3. 执行 Logic 实现任务
4. 运行测试验证

---

## 扩展最佳实践

### 1. 保持向后兼容

- 新增字段设置默认值
- 新 API 端点独立，不修改已有
- 逐步迁移，避免一次性大改

### 2. 渐进式扩展

```
第一步: 新增数据字段
第二步: 新增 API 端点
第三步: 前端适配
第四步: 上线验证
```

### 3. 清晰的标记

在 spec/plan/tasks 中使用统一标记:
- `## ADDED` - 新增内容
- `v1.x 扩展` - 版本标识

---

## 示例

### 场景: 在用户认证功能中添加密码重置

```
Step 1: 分析扩展点
  - 现有: 注册、登录、密码修改
  - 扩展: 添加密码重置 (需验证码验证身份)

Step 2: 扩展 spec.md
  ## ADDED Requirements (v1.1 扩展)
  ### Story 5: 密码重置 (P2)
  AC-07: 发送重置验证码
  AC-08: 重置密码成功
  BR-09: 密码重置后令牌失效

Step 3: 扩展 plan.md
  新增 API: POST /auth/send-reset-code
  新增 API: POST /auth/reset-password

Step 4: 更新 tasks.md
  Task N: [API] 新增重置密码 API
  Task N+1: [LOGIC] 实现发送验证码逻辑
  Task N+2: [LOGIC] 实现密码重置逻辑

Step 5: 执行实现
```

---

## 触发命令

```
/speckit.start 添加密码重置功能
/speckit.start 新增用户头像上传接口
/speckit.start 扩展登录支持记住我功能
```
