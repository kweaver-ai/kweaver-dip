# 数据质量管理技能

> **技能名称**: data-quality
> **版本**: 2.1.0
> **最后更新**: 2026-03-26

## 概述

本技能基于 Data View 和 Task Center API 提供数据质量管理能力。

## 快速开始

| 层级 | 文档 | 用途 |
|------|------|------|
| L1 | [SKILL.md](./SKILL.md) | 主入口，包含完整入参说明和核心约束 |
| L1 | [core/core.md](./core/core.md) | 核心概念和快速参考 |
| L2 | [guides/quickstart.md](./guides/quickstart.md) | 详细示例和参数说明 |
| L2 | [guides/detailed-guide.md](./guides/detailed-guide.md) | 完整工作流和高级用法 |

## 核心能力

1. **质量规则管理** - 创建、查询、更新、删除质量规则
2. **逻辑视图查询** - 查询视图列表和字段信息
3. **检测工单** - 创建和跟踪检测工单
4. **知识网络集成** - 基于知识网络配置规则

## 优化策略

本技能采用**共享约束引用**设计：

- **单一事实来源**: `core-constraints.md` 定义所有共享约束
- **链接替代重复**: 各文档链接到共享约束，避免内容复制
- **完整错误处理**: `error-handling.md` 提供统一错误处理规范
- **统一评分格式**: 评分不带 "/100" 后缀，四舍五入到两位小数

## 文档索引

| 文档 | 说明 |
|------|------|
| [SKILL.md](./SKILL.md) | **主入口** - 入参说明、核心约束、快速导航 |
| [core/core.md](./core/core.md) | 核心概念 |
| [guides/quickstart.md](./guides/quickstart.md) | 快速开始 |
| [guides/detailed-guide.md](./guides/detailed-guide.md) | 详细指南 |
| [reference/core-constraints.md](./reference/core-constraints.md) | **共享约束参考** |
| [reference/error-handling.md](./reference/error-handling.md) | 错误处理指南 |
| [reference/quality-report-scoring.md](./reference/quality-report-scoring.md) | 评分处理策略 |
| [reference/glossary.md](./reference/glossary.md) | 术语表 |
| [reference/quality-inspection-workflow.md](./reference/quality-inspection-workflow.md) | 质量检测工作流 |
| [reference/knowledge-network-workflow.md](./reference/knowledge-network-workflow.md) | 知识网络工作流 |
| [reference/api-overview.md](./reference/api-overview.md) | API 概览 |

## 更新日志

参见 [CHANGELOG.md](./CHANGELOG.md) 了解版本历史。
