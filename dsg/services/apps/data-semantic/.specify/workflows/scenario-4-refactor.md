# 场景四：大规模重构

> **适用于**: 架构变更、接口重新设计、涉及破坏性变更

---

## 适用条件

| 条件 | 状态 |
|------|------|
| specs/{feature}/ 目录 | ✅ 存在 |
| 已有 spec.md | ✅ 存在 |
| 变更规模 | 🔄 大 (重构) |
| 是否涉及破坏性变更 | ✅ 是 |
| 是否需要数据迁移 | 可能 |

---

## 典型场景

- 架构重构
- 接口签名变更
- 数据库结构重大调整
- 功能合并或拆分
- 技术栈迁移

---

## 工作流总览

```
Step 1: 审查现有文档
    ↓
Step 2: 创建 v2 版本目录
    ↓
Step 3: 重新设计 spec.md
    ↓ ⚠️ 人工检查点
Step 4: 重新设计 plan.md
    ↓ ⚠️ 人工检查点
Step 5: 创建迁移任务
    ↓ ⚠️ 人工检查点
Step 6: 执行迁移
```

---

## Step 1: 审查现有文档

### 目标
全面理解现有设计和实现

### 活动
1. 阅读 `specs/{feature}/spec.md`
2. 阅读 `specs/{feature}/plan.md`
3. 审查实际代码实现
4. 识别问题和改进点

### 输出
- 现有设计分析报告
- 重构原因和目标

### 检查清单
- [ ] 理解现有设计
- [ ] 明确重构原因
- [ ] 评估影响范围

---

## Step 2: 创建 v2 版本目录

### 目标
保留旧版本，创建新版本

### 活动

```bash
# 创建 v2 目录
mkdir -p specs/{feature}-v2

# 复制现有文档作为基础
cp specs/{feature}/spec.md specs/{feature}-v2/spec.md
cp specs/{feature}/plan.md specs/{feature}-v2/plan.md
```

### 目录结构

```
specs/
├── user-auth/          # v1 (保留)
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
│
└── user-auth-v2/       # v2 (重构版本)
    ├── spec.md         # 重新设计
    ├── plan.md         # 重新设计
    ├── tasks.md        # 迁移任务
    └── migration.md    # 迁移方案 (可选)
```

### 输出
- `specs/{feature}-v2/` 目录

---

## Step 3: 重新设计 spec.md

### 目标
使用 **Delta 格式** 重新定义需求

### 活动

在 v2 版本的 `spec.md` 中使用 Delta 标记变更:

```markdown
# {Feature} Specification v2.0

## 重构背景

**原因**: 说明为什么需要重构
**目标**: 重构要达成的目标
**影响**: 受影响的模块和接口

---

## MODIFIED Requirements

### Story 1: 原功能 (重新设计)

原设计: ...
新设计: ...

(完整的新版本文本)

---

## ADDED Requirements

### Story N: 新增功能

...

---

## REMOVED Requirements

### Story X: 移除的功能

**移除原因**: 说明原因
**替代方案**: 如有
```

### 检查清单
- [ ] 明确了重构原因
- [ ] MODIFIED 包含完整新设计
- [ ] REMOVED 说明了原因

### ⚠️ 人工检查点
**停止并确认**: 重构后的需求是否合理？

---

## Step 4: 重新设计 plan.md

### 目标
重新设计技术方案

### 活动

```markdown
# {Feature} Implementation Plan v2.0

## 架构变更

### 旧架构
...

### 新架构
...

---

## MODIFIED API

### 变更的接口

| 原接口 | 新接口 | 变更内容 |
|--------|--------|----------|
| POST /auth/login | POST /auth/v2/login | 返回格式变更 |

---

## MODIFIED DDL

### 变更的表结构

```sql
-- 旧结构
-- ...

-- 新结构
ALTER TABLE xxx ...
```

---

## 迁移策略

### 数据迁移
...

### 接口兼容
1. 保留旧接口 N 天
2. 通知客户端升级
3. 下线旧接口
```

### 检查清单
- [ ] 新旧对比清晰
- [ ] 迁移策略可行
- [ ] 回滚方案已规划

### ⚠️ 人工检查点
**停止并确认**: 重构方案是否可行？风险是否可控？

---

## Step 5: 创建迁移任务

### 目标
规划迁移步骤

### 活动

创建 `specs/{feature}-v2/tasks.md`:

```markdown
# v2 迁移任务

## 阶段一: 准备

### Task 1: [SETUP] 创建 v2 分支

### Task 2: [DDL] 添加新表/字段 (不删旧的)

## 阶段二: 实现

### Task 3: [API] 实现 v2 接口

### Task 4: [LOGIC] 实现新业务逻辑

### Task 5: [MIGRATE] 数据迁移脚本

## 阶段三: 切换

### Task 6: [SWITCH] 流量切换至 v2

### Task 7: [CLEANUP] 清理旧代码/表 (延迟执行)

## 阶段四: 验证

### Task 8: [TEST] 全面回归测试
```

### 任务类型
- `[MIGRATE]` - 迁移相关
- `[SWITCH]` - 切换相关
- `[CLEANUP]` - 清理相关

### 检查清单
- [ ] 分阶段规划
- [ ] 有回滚点
- [ ] 清理任务延迟执行

### ⚠️ 人工检查点
**停止并确认**: 迁移步骤是否完整？风险点已识别？

---

## Step 6: 执行迁移

### 目标
分阶段执行迁移

### 执行策略

```
阶段一: 准备
  - 风险: 低
  - 可回滚: 是

阶段二: 实现
  - v1 和 v2 并存
  - 可回滚: 是

阶段三: 切换
  - 逐步切换流量
  - 监控关键指标
  - 可回滚: 是

阶段四: 清理
  - 确认稳定后执行
  - 延迟 7-30 天
```

---

## 重构最佳实践

### 1. 渐进式迁移

```
周一: 部署 v2 接口 (不启用)
周二: 切换 10% 流量
周三: 切换 50% 流量
周四: 切换 100% 流量
下周: 清理 v1 代码
```

### 2. 完善的回滚方案

```markdown
### 回滚触发条件
- 错误率 > 1%
- 响应时间 > 500ms

### 回滚步骤
1. 切换路由至 v1
2. 停止 v2 服务
3. 通知相关人员
```

### 3. 充分的测试

- 单元测试覆盖新逻辑
- 集成测试验证迁移
- 性能测试确保不退化

### 4. 文档同步

- v1 文档标记为 `[已废弃]`
- v2 文档作为新的主版本

---

## 示例

### 场景: 将 JWT 认证迁移到 OAuth2

```
Step 1: 审查现有文档
  - 现有: JWT token 认证
  - 问题: 无法支持第三方登录
  - 目标: 迁移到 OAuth2

Step 2: 创建 v2 目录
  mkdir specs/user-auth-v2

Step 3: 重新设计 spec.md
  ## MODIFIED Requirements
  - Story 2: 登录认证 (OAuth2)
  - BR-03: 令牌有效期改为 OAuth2 规范
  
  ## ADDED Requirements
  - Story 6: 第三方登录 (微信/支付宝)

Step 4: 重新设计 plan.md
  - 新增 OAuth2 服务
  - 新增授权回调接口
  - 迁移策略: 双令牌并存期

Step 5: 创建迁移任务
  Task 1: [SETUP] 引入 OAuth2 库
  Task 2: [API] 实现授权接口
  Task 3: [MIGRATE] Token 格式迁移
  Task 4: [SWITCH] 切换至 OAuth2
  Task 5: [CLEANUP] 移除 JWT 逻辑

Step 6: 执行迁移
```

---

## 触发命令

```
/speckit.start 将认证方式从 JWT 改为 OAuth2
/speckit.start 重构用户模块，拆分为独立微服务
/speckit.start 升级数据库结构，统一字段命名
```
