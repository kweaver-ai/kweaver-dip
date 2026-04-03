<p align="center">
  <img alt="KWeaver DIP" src="./assets/logo/kweaver-dip.png" width="320" />
</p>

[English](./README.md) | 中文

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

# KWeaver DIP

KWeaver DIP 是 AI 原生的数字员工开发与管理平台，围绕业务知识网络构建可理解、可执行、可治理的数字员工应用体系。

该平台基于 KWeaver Core 开源项目构建的企业级数字员工平台，该平台可以基于业务知识网络下决策智能体构建智能体进行使用，也可以基于 Openclaw 构建数字员工进行使用。

## 快速链接

- 🌐 [在线体验](https://dip-poc.aishu.cn/studio/agent/development/my-agent-list) — 在线试用 KWeaver（用户名：`kweaver`，密码：`111111`）

## 快速开始

部署 KWeaver DIP 之前，请先准备 OpenClaw：

1. 先部署 [OpenClaw](https://openclaw.ai)，当前只支持 `v2026.3.11` 版本。也可以参考 [kweaver-ai/dip-studio/studio/README.md](https://github.com/kweaver-ai/dip-studio/blob/main/studio/README.md) 中的 `## 准备`。
2. 启动 OpenClaw Gateway。
3. 从 `openclaw.json` 中复制 `gateway.auth.token`，然后执行 `openclaw gateway status`，记录 Gateway 的绑定地址和端口。
4. 执行 `openclaw config set gateway.http.endpoints.responses.enabled true`，开启 `POST /v1/responses` HTTP 接口。
5. 确保执行 `deploy.sh` 的机器能够访问 OpenClaw 的配置文件和 workspace 目录。如果希望提前配置，可在 `deploy/conf/config.yaml` 或自定义配置文件中设置 `dipStudio.openClaw.configHostPath` 和 `dipStudio.openClaw.workspaceHostPath`。

完成上述准备后，直接使用仓库内置的 `deploy` 目录：

```bash
git clone https://github.com/kweaver-ai/kweaver-dip.git
cd kweaver-dip/deploy
sudo ./deploy.sh kweaver-dip install
```

部署完成后，可以访问：

- `https://<节点IP>/dip-hub`：KWeaver DIP Studio

完整安装要求、配置项说明、参数说明和离线部署方式请参考 [deploy/README.zh.md](deploy/README.zh.md)。


## 开源社区阅读路径

1. 先读本文件，从总体上了解项目价值、目标与能力范围。
2. 进入各业务模块目录，查看模块级 `README.md`了解各个模块的功能说明。

## 💬 交流社区

<div align="center">
<img src="./docs/qrcode.png" alt="KWeaver 交流群二维码" width="30%"/>

扫码加入 KWeaver 交流群
</div>

## 支持与联系

- **贡献指南**: [贡献指南](rules/CONTRIBUTING.zh.md)
- **问题反馈**: [GitHub Issues](https://github.com/kweaver-ai/kweaver/issues)
- **许可证**: [Apache License 2.0](LICENSE)
