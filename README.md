<p align="center">
  <img alt="KWeaver DIP" src="./assets/logo/kweaver-dip.png" width="320" />
</p>

[中文](./README.zh.md) | English

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

# KWeaver DIP

KWeaver DIP is an AI-native platform for developing and managing digital employees. It builds an application stack for digital employees that is understandable, executable, and governable, centered on business knowledge networks.

The platform is an enterprise digital employee platform built on the **KWeaver Core** open-source project. You can build and use agents through decision agents on a business knowledge network, or build and use digital worker on top of **Openclaw**.

## Quick Links

- 🌐 [Live Demo](https://dip-poc.aishu.cn/studio/agent/development/my-agent-list) — Try KWeaver online (username: `kweaver`, password: `111111`)

## Quick Start

Before deploying KWeaver DIP, prepare OpenClaw first:

1. Deploy [OpenClaw](https://openclaw.ai) first. The support version is `v2026.3.11`. You can also use the preparation notes in [kweaver-ai/dip-studio/studio/README.md](https://github.com/kweaver-ai/dip-studio/blob/main/studio/README.md).
2. Start OpenClaw Gateway.
3. Copy `gateway.auth.token` from `openclaw.json`, then run `openclaw gateway status` and record the gateway bind address and port.
4. Run `openclaw config set gateway.http.endpoints.responses.enabled true` to enable the `POST /v1/responses` HTTP endpoint.
5. Make sure the machine running `deploy.sh` can access the OpenClaw config file and workspace directory. If you want to preconfigure them, set `dipStudio.openClaw.configHostPath` and `dipStudio.openClaw.workspaceHostPath` in `deploy/conf/config.yaml` or in your custom config file.

Then use the built-in `deploy` directory in this repository:

```bash
git clone https://github.com/kweaver-ai/kweaver-dip.git
cd kweaver-dip/deploy
sudo ./deploy.sh kweaver-dip install
```

After deployment, open:

- `https://<node-ip>/dip-hub` for KWeaver DIP Hub

For full installation requirements, config details, flags, and offline deployment options, see [deploy/README.md](deploy/README.md).

## Community Reading Path

1. Read this file for an overall view of the project’s value, goals, and scope of capabilities.
2. Open each business module directory and read its `README.md` to learn what each module does.

## 💬 Community

<div align="center">
<img src="./docs/qrcode.png" alt="KWeaver community QR code" width="30%"/>

Scan to join the KWeaver community group
</div>

## Support & Contact

- **Contributing**: [Contributing Guide](rules/CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/kweaver-ai/kweaver/issues)
- **License**: [Apache License 2.0](LICENSE)
