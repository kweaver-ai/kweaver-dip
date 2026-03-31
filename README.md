<p align="center">
  <img alt="KWeaver DIP" src="./assets/logo/kweaver-dip.png" width="320" />
</p>

[中文](./README.zh.md) | English

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

# KWeaver DIP

KWeaver DIP is an AI-native platform for developing and managing digital employees, built on business knowledge networks for understandable, executable, and governable enterprise intelligence.

## Project Goals

- Build a scalable platform for enterprise digital employee development.
- Unify business semantics, rules, and execution paths through a business knowledge network.
- Connect capability development, application presentation, and runtime governance end to end.

## Quick Links

- 🌐 [Live Demo](https://dip-poc.aishu.cn/studio/agent/development/my-agent-list) — Try KWeaver online (username: `kweaver`, password: `111111`)
- 🤝 [Contributing](rules/CONTRIBUTING.md) — How to contribute to this project
- 🚢 [Deployment](deploy/README.md) — One-click deploy to Kubernetes
- 📄 [License](LICENSE) — Apache License 2.0

## Quick Start

Installation and deployment content: TODO.

## Platform Architecture

<p align="center">
  <img alt="KWeaver DIP platform architecture" src="./assets/kweaver-dip-architecture%20.png" />
</p>

## Key Concepts

| English | Chinese | Explanation (English) |
|---------|---------|-----------------------|
| Kweaver DIP | Kweaver DIP | KWeaver DIP is an AI-native open-source decision intelligence platform. Based on the organization's global business knowledge network, it provides autonomous decision-making digital workers for various business domains to boost the full-link productivity of enterprises. |
| DIP Studio | DIP工作室 | DIP Studio is a management and collaboration workspace for enterprise-level digital workers. |
| Digital Workers | 数字员工 | An executable entity with autonomous decision-making capabilities that users design, build and manage based on job responsibilities. It is the minimum unit for measuring economic benefits in DIP Studio. |
| Skill | 技能 | A set of instructions and tools configured for digital workers to complete specific tasks. |
| Decision Agent | 决策智能体 | An autonomous agent that leverages the business knowledge network to understand, plan and execute complex tasks independently, and support decision-making. |
| Workflow | 工作流 | A defined process organized and orchestrated around business goals, describing task sequence and collaboration relationships. |
| BKN (Business Knowledge Network) | 业务知识网络 | A semantic infrastructure that unifies data, logic and actions into queryable, inferable and executable mappings based on the defined business world, providing a unified semantic layer for decision agents. It consists of personal, domain and general business knowledge networks. |
| Data | 数据 | Structured expression of objects, attributes and relationships in the business world, serving as the basic input carrier for logic and action execution. |
| Logic | 逻辑 | A structured encapsulation unit of business rules and computing processes, which reasons based on data to generate results or drive execution. |
| Actions | 行动 | Execution units that make actual changes to the status of business objects. |
| Risk | 风险 | A structured risk verification mechanism attached to Actions, composed of multiple RiskTypes and corresponding RiskRules, to constrain and judge status changes during execution. |
| Dataflow | 数据流 | A structured description of data flow paths and dependency relationships within the system. |
| Execution Factory | 执行工厂 | An execution infrastructure that provides unified access, management and scheduling for operators, tools and MCP services. |
| Operator | 算子 | The finest-grained executable computing unit encapsulating specific data processing or algorithm logic. |
| Tool | 工具 | Encapsulation of external capabilities or systems to perform operations with side effects. |
| MCP | MCP | A protocol layer that connects models with external tools and data sources in a unified way, enabling standardized discovery and invocation of capabilities. |
| Information Security Fabric | 信息安全编织 | A unified integrated management mechanism for identity authentication, permission control, access policies, log auditing and other security capabilities, delivering consistent security guarantee and governance across all modules and execution processes. |
| TraceAI | TraceAI | A full-link tracing and observability mechanism for system execution, used to record, restore and analyze behaviors, dependencies and results in all links. |

## Community Reading Path

1. Read this file to understand project goals and scope.
2. Open `docs/README.md` and choose documentation by role.
3. Read `docs/PROJECT_STRUCTURE.md` for code module boundaries.
4. Go into business module directories for module-level `README.md` files.

## Contributing

We welcome contributions! See our [Contributing Guide](rules/CONTRIBUTING.md) for how to get involved.

Quick start:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

When submitting changes in this repository, please also update: module-level `README.md`, `docs/PROJECT_STRUCTURE.md` (directory responsibilities), and `release-notes/` (version change log).

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 💬 Community

<div align="center">
<img src="./docs/qrcode.png" alt="KWeaver community QR code" width="30%"/>

Scan to join the KWeaver community group
</div>

## Support & Contact

- **Contributing**: [Contributing Guide](rules/CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/kweaver-ai/kweaver/issues)
- **License**: [Apache License 2.0](LICENSE)
