# DIP 数字员工运营平台

本项目基于 OpenClaw，使用 TypeScript 开发

## 准备

1. 部署 OpenClaw 项目。项目地址：https://openclaw.ai 或从 GitHub：https://github.com/openclaw/openclaw
2. 启动 OpenClaw Gateway
3. 完成 OpenClaw 配置后，从 `openclaw.json` 中复制 `gateway.auth.token`
4. 执行 `openclaw config set gateway.http.endpoints.responses.enabled true`，开启 POST /v1/responses HTTP 接口

## 启动

1. 执行 `npm install` 安装依赖
2. 重命名 `.env.example` → `.env`，配置 OpenClaw 连接信息以及 OpenClaw 的 Auth Token。
3. 在 `assets` 目录下执行 OpenSSL 命令生成 Ed25519 PEM 私钥和 PEM 公钥，用于调用 OpenClaw Gateway 接口时进行签名
```bash
cd assets
openssl genpkey -algorithm ED25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```
4. 执行 `npm run init:agents` 初始化openclaw默认配置、builtin agents以及extensions
5. 执行 `npm run build` 构建
6. 执行 `npm run dev` 启动服务

## API

### 数字员工

公开接口基础路径：`/api/dip-studio/v1`

#### 获取数字员工列表

`GET /api/dip-studio/v1/digital-human`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].id | string | 数字员工 ID |
| [\].name | string | 数字员工名称 |
| [\].avatar | string | 数字员工头像，可选 |

#### 创建数字员工

`POST /api/dip-studio/v1/digital-human`

请求：`application/json`

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 否 | 数字员工 ID；不传时后端自动生成 UUID |
| name | string | 是 | 数字员工名称 |
| avatar | string | 否 | 数字员工头像 |
| identity | string | 否 | `IDENTITY.md` 内容 |
| soul | string | 否 | `SOUL.md` 内容 |
| skills | string[] | 否 | 技能名称列表 |

响应：`201 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| id | string | 数字员工 ID |

#### 进行数字员工对话

`POST /api/dip-studio/v1/digital-human/{id}/chat/responses`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 数字员工 ID |

请求：`application/json`

请求体为透传对象，支持任意 JSON 字段。

响应：`200 text/event-stream`

返回数字员工响应事件流，响应体为 SSE 流。
