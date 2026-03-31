<p align="center">
  <img alt="KWeaver DIP" src="./assets/logo/kweaver-dip.png" width="320" />
</p>

[English](./README.md) | 中文

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

# KWeaver DIP

KWeaver DIP 是 AI 原生的数字员工开发与管理平台，围绕业务知识网络构建可理解、可执行、可治理的数字员工应用体系。

## 项目目标

- 为企业提供可规模化的数字员工开发平台。
- 通过业务知识网络统一业务语义、规则与执行路径。
- 打通从能力开发、应用呈现到运行治理的全链路。

## 快速链接

- 🌐 [在线体验](https://dip-poc.aishu.cn/studio/agent/development/my-agent-list) — 在线试用 KWeaver（用户名：`kweaver`，密码：`111111`）
- 🤝 [贡献指南](rules/CONTRIBUTING.zh.md) — 如何参与本项目贡献
- 🚢 [部署说明](deploy/README.md) — 一键部署至 Kubernetes
- 📄 [许可证](LICENSE) — Apache License 2.0

## 快速开始

安装与部署相关内容：TODO。

## 平台架构

<p align="center">
  <img alt="KWeaver DIP 平台架构" src="./assets/kweaver-dip-architecture%20.png" />
</p>

## 关键概念
| 中文 | 英文 | 详细释义 |
| ---- | ---- | ---- |
| Kweaver DIP | Kweaver DIP | KWeaver DIP是一个AI原生的开源决策智能平台，基于组织的全局业务知识网络，为各业务域提供自主决策型数字员工，来实现企业全链路生产力跃升。 |
| DIP Studio | DIP Studio | DIP Studio 是企业级数字员工的管理、协作的工作台。 |
| 数字员工 | Digital Workers | 用户根据岗位职责分解、设计、构建、管理的，具备自主决策能力的执行体。它是DIP Studio，计量经济效益的最小单元。 |
| 技能 | Skill | 技能是为数字员工设定的一组用于完成特定任务的指令和工具。 |
| 决策智能体 | Decision Agent | 决策智能体是采用业务知识网络实现自主理解、规划并执行复杂任务、辅助决策的自主型智能体。 |
| 工作流 | Workflow | 工作流是围绕业务目标，对任务执行过程进行组织与编排的流程定义，用于描述步骤顺序与协同关系。 |
| 业务知识网络 | BKN | 业务知识网络是在组织所定义的业务世界之上，将数据、逻辑与行动统一映射为可查询、可推理、可执行的语义基础设施，为决策智能体提供统一的语义层。由个人业务知识网络/领域业务知识网络/通用业务知识网络构成 |
| 数据 | Data | 数据（Data）是对业务世界中对象、属性及其关系的结构化表达，是逻辑与行动执行的输入与基础载体。 |
| 逻辑 | Logic | 逻辑是对业务规则与计算过程的结构化封装单元，基于数据进行推理与处理产出结果或驱动执行。 |
| 行动 | Actions | 行动是对业务对象状态进行实际变更的执行单元。 |
| 风险 | Risk | Risk 是附着在 Action 上的结构化风险校验机制，由多个 RiskType 及其对应的 RiskRule 组成，用于在执行过程中对状态变更进行约束与判定。 |
| 数据流 | Dataflow | 数据流是描述数据在系统中流转路径与依赖关系的结构化表示。 |
| 执行工厂 | Execution Factory | 执行工厂是提供算子、工具及 MCP 服务的统一接入、管理与调度能力的执行基础设施。 |
| 算子 | Operator | 算子是最小粒度的可执行计算单元，封装具体的数据处理或算法逻辑。 |
| 工具 | Tool | 工具是对外部能力或系统的封装，用于执行具有副作用的操作。 |
| MCP | MCP | MCP 是用于统一连接模型与外部工具/数据源的协议层，使能力可被标准化发现与调用。 |
| 信息安全编织 | Information Security Fabric | 信息安全编织是对系统中身份认证、权限控制、访问策略、日志审计等安全能力进行统一整合与协同管理的机制，用于在各模块与执行过程之间提供一致的安全保障与治理能力。 |
| TraceAI | TraceAI | TraceAI 是对系统执行过程进行全链路追踪与可观测的机制，用于记录、还原与分析各环节的行为、依赖关系及结果。 |

## 开源社区阅读路径

1. 先读本文件，了解项目目标与范围。
2. 打开 `docs/README.md`，按角色选择文档入口。
3. 阅读 `docs/PROJECT_STRUCTURE.md`，了解代码模块边界。
4. 进入各业务模块目录，查看模块级 `README.md`。

## 贡献指南

我们欢迎贡献！请查看我们的[贡献指南](rules/CONTRIBUTING.zh.md)了解如何为项目做出贡献。

快速开始：

1. Fork 代码库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

在本仓库提交变更时，建议同步更新：模块目录下 `README.md`、`docs/PROJECT_STRUCTURE.md`（目录职责）、`release-notes/`（版本变更记录）。

## 许可证

本项目采用 Apache License 2.0 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 💬 交流社区

<div align="center">
<img src="./docs/qrcode.png" alt="KWeaver 交流群二维码" width="30%"/>

扫码加入 KWeaver 交流群
</div>

## 支持与联系

- **贡献指南**: [贡献指南](rules/CONTRIBUTING.zh.md)
- **问题反馈**: [GitHub Issues](https://github.com/kweaver-ai/kweaver/issues)
- **许可证**: [Apache License 2.0](LICENSE)
