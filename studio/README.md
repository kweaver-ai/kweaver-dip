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
   同时配置 `BKN_BACKEND_URL` 和 `APP_USER_TOKEN`，用于转发 BKN Backend 请求。
3. 在 `assets` 目录下执行 OpenSSL 命令生成 Ed25519 PEM 私钥和 PEM 公钥，用于调用 OpenClaw Gateway 接口时进行签名
```bash
cd assets
openssl genpkey -algorithm ED25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```
4. 执行 `npm run init:agents` 初始化 OpenClaw 默认配置、builtin agents 以及 extensions
5. 执行 `npm run build` 构建
6. 执行 `npm run dev` 启动服务


### 调试

在 VSCode 中配置 `launch.json`

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug DIP Studio Dev",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "runtimeExecutable": "npm",
            "runtimeArgs": [
                "run",
                "dev"
            ],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "env": {
                "NODE_ENV": "development"
            }
        }
    ]
}
```

## Studio Web

DIP 数字员工 Web 界面

GitHub：https://github.com/kweaver-ai/web

请参考 [`apps/dip`](https://github.com/kweaver-ai/web/tree/main/apps/dip) 下的 README.md 安装 Web 界面

## API

除白名单接口外，所有接口都需要在请求头中携带 `Authorization: Bearer <access-token>`。服务端会通过 Hydra `/admin/oauth2/introspect` 做令牌内省；在 `NODE_ENV=development` 时，会跳过 Hydra，改为使用 `.env` 中的 `OAUTH_MOCK_USER_ID` 作为鉴权用户。

### 数字员工

公开接口基础路径：`/api/dip-studio/v1`

#### 获取会话列表

`GET /api/dip-studio/v1/sessions`

支持查询参数：`search`、`agentId`、`limit`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| ts | number | 服务端时间戳（毫秒） |
| path | string | 会话来源路径 |
| count | number | 会话总数 |
| sessions | SessionSummary[] | 会话摘要列表 |

服务端会根据 `sessionKey` 中的用户信息，仅返回当前登录用户可见的会话。

#### 获取单个会话详情

`GET /api/dip-studio/v1/sessions/{key}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| key | string | 是 | 会话 key |

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| key | string | 会话 key |
| kind | string | 会话类型 |
| sessionId | string | 会话实例 ID |
| updatedAt | number | 最近更新时间（毫秒） |
| label | string | 会话标签 |
| displayName | string | 展示名称 |

返回指定会话的摘要详情；服务端会始终返回推导标题。

#### 获取数字员工列表

`GET /api/dip-studio/v1/digital-human`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].id | string | 数字员工 ID |
| [\].name | string | 数字员工名称 |
| [\].avatar | string | 数字员工头像，可选 |

#### 获取全局启用技能列表

`GET /api/dip-studio/v1/skills`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].name | string | 技能名称 |
| [\].description | string | 技能描述，可选 |

#### 业务知识网络转发

公开接口基础路径：`/api/dip-studio/v1`

服务会将以下请求转发到 `BKN_BACKEND_URL` 的 BKN Backend 接口，并使用环境变量 `APP_USER_TOKEN` 生成上游请求头 `Authorization: Bearer <APP_USER_TOKEN>`。

两个接口均支持请求头 `x-business-domain`：会原样透传到 BKN Backend；若调用方未传或值为空，服务端会默认使用 `bd_public`。

`GET /api/dip-studio/v1/knowledge-networks`

请求头：`x-business-domain`（可选，默认 `bd_public`）

查询参数（含义与 BKN Backend 参考文档 `docs/references/openapi/bkn-backend/business-knowledge-network.yaml` 中 `GET /api/bkn-backend/v1/knowledge-networks` 一致）：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name_pattern | string | 按业务知识网络名称模糊查询；默认为空。 |
| sort | string | 排序字段：`update_time`、`name`；默认 `update_time`。 |
| direction | string | 排序方向：`asc`、`desc`；默认 `desc`。 |
| offset | integer | 分页起始偏移量；须 ≥ 0；默认 `0`。 |
| limit | integer | 每页最大条数；分页可取 `1`–`1000`，`-1` 表示不分页；默认 `10`。 |
| tag | string | 按标签精确匹配；默认为空。 |

`GET /api/dip-studio/v1/knowledge-networks/{kn_id}`

请求头：`x-business-domain`（可选，默认 `bd_public`）

查询参数（含义与同参考文档中 `GET /api/bkn-backend/v1/knowledge-networks/{kn_id}` 一致）：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| mode | string | 查询模式：空字符串表示仅知识网络详情、不含子类；`export` 为导出模式。 |
| include_statistics | boolean | 是否返回业务知识网络下概念的统计信息；默认 `false`。 |

#### 获取指定数字员工已配置技能列表

`GET /api/dip-studio/v1/digital-human/{id}/skills`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 数字员工 ID |

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].name | string | 技能名称 |
| [\].description | string | 技能描述，可选 |

#### 获取计划任务列表

`GET /api/dip-studio/v1/plans`

支持查询参数：`includeDisabled`、`limit`、`offset`、`enabled`、`sortBy`、`sortDir`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| jobs | CronJob[] | 计划任务列表 |
| total | number | 命中总数 |
| offset | number | 当前偏移量 |
| limit | number | 当前分页大小 |
| hasMore | boolean | 是否还有更多数据 |
| nextOffset | number \| null | 下一页偏移量 |

#### 获取指定数字员工的计划任务列表

`GET /api/dip-studio/v1/digital-human/{id}/plans`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 数字员工 ID |

支持查询参数：`includeDisabled`、`limit`、`offset`、`enabled`、`sortBy`、`sortDir`

响应：`200 application/json`

结构同 `GET /api/dip-studio/v1/plans`。

#### 获取计划任务运行记录

`GET /api/dip-studio/v1/plans/{id}/runs`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 计划任务 ID |

支持查询参数：`limit`、`offset`、`sortDir`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| entries | CronRunEntry[] | 运行记录列表 |
| total | number | 命中总数 |
| offset | number | 当前偏移量 |
| limit | number | 当前分页大小 |
| hasMore | boolean | 是否还有更多数据 |
| nextOffset | number \| null | 下一页偏移量 |

#### 获取计划文件内容

`GET /api/dip-studio/v1/plans/{id}/content`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 计划任务 ID |

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| content | string | 该计划关联的 `PLAN.md` 原始文本内容 |

#### 编辑计划任务

`PUT /api/dip-studio/v1/plans/{id}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 计划任务 ID |

请求：`application/json`

请求体：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| name | string | 否 | 新的计划任务名称 |
| enabled | boolean | 否 | 是否启用计划任务；`true` 为启用，`false` 为禁用 |

响应：`200 application/json`

返回更新后的 `CronJob` 对象。

#### 删除计划任务

`DELETE /api/dip-studio/v1/plans/{id}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 计划任务 ID |

响应：`204`

#### 创建数字员工

`POST /api/dip-studio/v1/digital-human`

请求：`application/json`

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| name | string | 是 | 数字员工名称 |
| creature | string | 否 | 数字员工岗位/角色 |
| soul | string | 否 | `SOUL.md` 内容 |
| skills | string[] | 否 | 技能名称列表 |

响应：`201 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| id | string | 数字员工 ID |

#### 创建会话键

`POST /api/dip-studio/v1/chat/session`

请求头：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| Authorization | string | 是 | `Bearer <access-token>`，用于 Hydra 内省鉴权 |

请求：`application/json`

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| agentId | string | 是 | 生成会话键时使用的 Agent ID |

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| sessionKey | string | 新会话键，格式为 `agent:<agentId>:user:<userid>:direct:<chatId>` |

#### 进行数字员工对话

`POST /api/dip-studio/v1/chat/responses`

请求头：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| Authorization | string | 是 | `Bearer <access-token>`，用于 Hydra 内省鉴权 |
| x-openclaw-session-key | string | 是 | 必须先通过 `POST /api/dip-studio/v1/chat/session` 获取；服务会从其中的 `agent:<agentId>` 前缀解析数字员工 ID |

请求：`application/json`

请求体为透传对象，支持任意 JSON 字段。

响应：`200 text/event-stream`

返回数字员工响应事件流，响应体为 SSE 流。

#### 获取会话消息详情

`GET /api/dip-studio/v1/sessions/{key}/messages`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| key | string | 是 | 会话 key |

支持查询参数：`limit`

响应：`200 application/json`

返回指定会话的完整消息详情。

#### 获取会话归档列表

`GET /api/dip-studio/v1/sessions/{key}/archives`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| key | string | 是 | 会话 key |

响应：`200 application/json`

返回指定会话的归档物列表。

#### 获取会话归档子路径内容

`GET /api/dip-studio/v1/sessions/{key}/archives/{subpath}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| key | string | 是 | 会话 key |
| subpath | string | 是 | 归档子路径，支持多级目录 |

响应：`200 application/json | application/octet-stream | text/plain`

目录返回 JSON，文件返回原始内容。
