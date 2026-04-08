# DIP 数字员工运营平台

本项目基于 OpenClaw，使用 TypeScript 开发

```
请选择 ** v2026.3.11 ** 版本的 OpenClaw。
```

## 开发模式

### 准备

1. 部署 OpenClaw 项目。项目地址：https://openclaw.ai 或从 GitHub：https://github.com/openclaw/openclaw
2. 执行 `openclaw gateway` 启动 OpenClaw
3. 完成 OpenClaw 配置后，从 `openclaw.json` 中复制 `gateway.auth.token`
4. 执行 `openclaw gateway status`，从 `Gateway: bind=loopback (127.0.0.1), port=19001 (env/config)` 记住 OpenClaw 网关地址和端口

### 启动

1. 执行 `npm install` 安装依赖
2. 重命名 `.env.example` → `.env`，配置 OpenClaw 连接信息以及 OpenClaw 的 Auth Token。
   同时配置 `KWEAVER_BASE_URL` 和 `KWEAVER_TOKEN`，用于转发 KWeaver Core 请求。
3. 默认使用仓库 `assets/` 目录中已提交的 Ed25519 PEM 私钥和 PEM 公钥，用于调用 OpenClaw Gateway 接口时进行签名
4. 执行 `npm run init:agents` 初始化 OpenClaw 默认配置、builtin agents 以及 extensions
5. 执行 `npm run build` 构建
6. 执行 `NODE_ENV=development npm run dev` 启动服务


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

## 生产模式

### 准备

1. 部署 OpenClaw 项目。项目地址：https://openclaw.ai 或从 GitHub：https://github.com/openclaw/openclaw
2. 使用 lan 模式启动 OpenClaw：`openclaw gateway --bind lan`，监听 0.0.0.0:18789


### 启动

1. 通过 Helm Chart 部署 DIP-Studio 服务和 KWeaver Web

2. 执行 `openclaw devices list`，找到如下的待授权设备：

```bash
Pending (1)
┌──────────────────────────────────────┬──────────────────────────────────────────────────┬──────────┬───────────────┬──────────┬────────┐
│ Request                              │ Device                                           │ Role     │ IP            │ Age      │ Flags  │
├──────────────────────────────────────┼──────────────────────────────────────────────────┼──────────┼───────────────┼──────────┼────────┤
│ 3ef1700e-cc91-4978-a980-4fb783925028 │ cc8d2143cf8fcd04161ade9e5161006c410a0bee65f835e2 │ operator │ 192.169.0.104 │ just now │        │
│                                      │ 629792aa584bb119                                 │          │               │          │        │
└──────────────────────────────────────┴──────────────────────────────────────────────────┴──────────┴───────────────┴──────────┴────────┘
```

3. 执行`openclaw devices approve <Request>` 进行授权。

当提示：

```bash
Approved cc8d2143cf8fcd04161ade9e5161006c410a0bee65f835e2629792aa584bb119 (3ef1700e-cc91-4978-a980-4fb783925028)
```
表示授权成功。

4. 访问 DIP 首页进行登录和使用。

## Studio Web

DIP 数字员工 Web 界面

GitHub：https://github.com/kweaver-ai/web

请参考 [`apps/dip`](https://github.com/kweaver-ai/web/tree/main/apps/dip) 下的 README.md 安装 Web 界面

## API

除白名单接口外，所有接口都需要在请求头中携带 `Authorization: Bearer <access-token>`。服务端会通过 Hydra `/admin/oauth2/introspect` 做令牌内省；在 `NODE_ENV=development` 时，会跳过 Hydra，改为使用 `.env` 中的 `OAUTH_MOCK_USER_ID` 作为鉴权用户。

### 数字员工

公开接口基础路径：`/api/dip-studio/v1`

#### 初始化引导

`GET /api/dip-studio/v1/guide/status`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| state | string | 初始化状态，枚举值：`ready`、`pending` |
| ready | boolean | 是否已完成初始化 |
| missing | string[] | 当前缺失的初始化项，可能值包括 `envFile`、`gatewayProtocol`、`gatewayHost`、`gatewayPort`、`gatewayToken`、`workspaceDir`、`privateKey`、`publicKey` |

`GET /api/dip-studio/v1/guide/openclaw-config`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| protocol | string | OpenClaw Gateway 协议，枚举值：`ws`、`wss` |
| host | string | OpenClaw Gateway 主机地址 |
| port | integer | OpenClaw Gateway 端口 |
| token | string | 从运行时注入环境变量中读取的 Gateway Token |

错误响应：`500`、`502`

`POST /api/dip-studio/v1/guide/initialize`

请求体示例：

```json
{
  "openclaw_address": "ws://127.0.0.1:18789",
  "openclaw_token": "your-openclaw-token",
  "kweaver_base_url": "https://kweaver.example.com",
  "kweaver_token": "your-kweaver-token"
}
```

请求体参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| openclaw_address | string | 是 | 完整 OpenClaw Gateway 地址，例如 `ws://127.0.0.1:18789` |
| openclaw_token | string | 是 | OpenClaw Gateway Token |
| kweaver_base_url | string | 否 | KWeaver 服务地址；为空时表示禁用 KWeaver 配置 |
| kweaver_token | string | 否 | KWeaver Token；当 `kweaver_base_url` 非空时必填 |

响应：`200`，无响应体。

错误响应：`400`、`500`、`502`

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

#### 删除会话

`DELETE /api/dip-studio/v1/sessions/{key}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| key | string | 是 | 会话 key |

响应：`204`

#### 获取数字员工列表

`GET /api/dip-studio/v1/digital-human`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].id | string | 数字员工 ID |
| [\].name | string | 数字员工名称 |
| [\].creature | string | 岗位/角色，可选 |
| [\].icon_id | string | 图标 ID，可选 |
| [\].soul | string | SOUL.md 内容 |
| [\].bkn | BknEntry[] | 业务知识网络条目，可选 |
| [\].skills | string[] | 绑定技能列表，可选 |
| [\].channel | ChannelConfig | 渠道配置，可选 |

#### 获取预置数字员工模板列表

`GET /api/dip-studio/v1/digital-human/built-in`

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].id | string | 预置数字员工模板 ID |
| [\].name | string | 预置数字员工名称 |
| [\].description | string | 预置数字员工描述，可选 |

#### 创建或更新预置数字员工

`PUT /api/dip-studio/v1/digital-human/built-in/{ids}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| ids | string | 是 | 预置数字员工模板 ID，多个值使用英文逗号分隔 |

响应：`201 application/json`

返回值为创建或更新后的数字员工数组，元素结构与 `POST /api/dip-studio/v1/digital-human` 响应一致。

#### 获取全局启用技能列表

`GET /api/dip-studio/v1/skills`

响应：`200 application/json`

查询参数：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 可选；按技能 ID 或展示名称/描述模糊匹配，大小写不敏感 |

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| [\].name | string | 技能 ID（同时作为展示名称；必须与 `SKILL.md` front matter `name` 一致） |
| [\].description | string | 技能描述，可选 |
| [\].built_in | boolean | 是否为 DIP 数字员工内置技能（`archive-protocol`、`schedule-plan`、`kweaver-core`） |
| [\].type | string | OpenClaw `skills.status` 响应中的 `source` 字段，例如 `openclaw-bundled`、`openclaw-managed`、`agents-skills-personal` 等 |

#### 获取技能目录树

`GET /api/dip-studio/v1/skills/{name}/tree`

路径参数：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 技能 ID |

响应：`200 application/json`

说明：

- Studio 会先通过 OpenClaw `skills.status` 解析该技能的绝对目录路径，再调用 Gateway `dip` 插件读取目录树。
- `resolvedSkillPath` 仅在 Studio 与插件之间作为内部查询参数传递，客户端无需提供。

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 技能 ID |
| entries | array | 技能目录树 |
| entries[].name | string | 文件或目录名 |
| entries[].path | string | 相对技能根目录的路径，统一使用 `/` 分隔 |
| entries[].type | string | `file` 或 `directory` |
| entries[].children | array | 当 `type=directory` 时返回子节点 |

#### 预览技能文件内容

`GET /api/dip-studio/v1/skills/{name}/content`

路径参数：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 技能 ID |

查询参数：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| path | string | 技能目录内文件的相对路径，例如 `SKILL.md`、`docs/guide.md`；不传时默认 `SKILL.md` |

说明：

- Studio 会先通过 OpenClaw `skills.status` 解析技能目录，再将解析结果作为内部参数透传给插件读取文件。
- 仅支持预览技能目录内的普通文件。
- 未传 `path` 时，默认返回 `SKILL.md` 内容。
- 路径穿越（如 `../x`）会被拒绝。
- 返回 UTF-8 文本预览，服务端当前预览上限为 1MB；超出时 `truncated=true`。

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 技能 ID |
| path | string | 相对技能根目录的文件路径 |
| content | string | 文件预览内容 |
| bytes | integer | 文件实际大小（字节） |
| truncated | boolean | 是否因预览上限被截断 |

#### 下载技能文件

`GET /api/dip-studio/v1/skills/{name}/download`

路径参数：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 技能 ID |

查询参数：

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| path | string | 技能目录内文件的相对路径；不传时默认 `SKILL.md` |

说明：

- Studio 会先通过 OpenClaw `skills.status` 解析技能目录，再将解析结果作为内部参数透传给插件下载文件。
- 返回原始文件字节流，适合浏览器直接下载。
- 仅允许下载技能目录内的普通文件。
- 响应会尽量透传 `content-type` 和 `content-disposition`。

#### 安装 .skill 包（zip）

`POST /api/dip-studio/v1/skills/install`

使用 **`multipart/form-data`**。服务端将 zip 读入内存后转发至 OpenClaw 网关 `dip` 插件（`name`、`overwrite` 作为上游查询参数），详见插件 README。单文件大小上限 **32MB**。

**支持的文件类型**

| 项目 | 说明 |
| -- | -- |
| 包格式 | **ZIP**（标准 PK zip 压缩包；OpenClaw `.skill` 包与此相同，仅为扩展名约定） |
| 建议扩展名 | **`.skill`** 或 **`.zip`**（用于浏览器/系统识别；服务端以二进制内容为准） |
| `Content-Type` | 不强制校验；常见为 `application/zip`、`application/x-zip-compressed`、`application/octet-stream` |

| 字段 | 类型 | 必填 | 说明 |
| -- | -- | -- | -- |
| file | binary | 是 | 上述 ZIP 包的字节内容（字段名固定为 `file`） |
| overwrite | string | 否 | 为 `true` 或 `1` 时，若 `skills/<name>/` 已存在则覆盖 |
| skillName | string | 否 | 技能名称。不传则按**上传文件名**推导（basename，去 `.skill`/`.zip` 后缀，须符合命名规则）。扁平包（zip 根含 `SKILL.md`）时用该名作为 `skills/<name>/` |

前端示例：`form.append("file", fileBlob, "my-skill.skill")`（可用文件名代替显式 `skillName`）；覆盖时 `form.append("overwrite", "true")`；覆盖默认推导 id 时 `form.append("skillName", "other-id")`。

> ⚠️ `SKILL.md` 中 front matter 的 `name` 字段必须与 `skillName`/目录名完全一致，否则安装会被拒绝。

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 技能 ID（来自 `SKILL.md` front matter `name`，必须与目录名一致） |
| skillPath | string | 网关上落盘目录的绝对路径 |

#### 卸载技能

`DELETE /api/dip-studio/v1/skills/{name}`

路径参数 **`name`** 为技能 ID。删除前服务会查询 OpenClaw `skills.status`，仅当 `type === "openclaw-managed"` 时允许卸载；其它来源（如 `openclaw-bundled`、`extensions/.../skills`、仓库 `skills/` 自定义包）会返回 403。满足条件后才会转发至 `dip` 插件卸载接口。

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| name | string | 已卸载的技能 ID |

#### 业务知识网络转发

公开接口基础路径：`/api/dip-studio/v1`

服务会将以下请求转发到 `KWEAVER_BASE_URL` 的 KWeaver Core 接口，并使用环境变量 `KWEAVER_TOKEN` 生成上游请求头 `Authorization: Bearer <KWEAVER_TOKEN>`。

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
| [\].built_in | boolean | 是否为 DIP 数字员工内置技能（`archive-protocol`、`schedule-plan`、`kweaver-core`） |
| [\].type | string | 同「获取全局启用技能列表」中的 `[\].type` |

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

#### 获取单条计划任务

`GET /api/dip-studio/v1/plans/{id}`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| id | string | 是 | 计划任务 ID |

响应：`200 application/json`

返回单个 `CronJob` 对象。

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
| id | string | 否 | 数字员工 ID；不传时服务端自动生成 UUID |
| name | string | 是 | 数字员工名称 |
| creature | string | 否 | 数字员工岗位/角色 |
| icon_id | string | 否 | 图标 ID |
| soul | string | 否 | `SOUL.md` 内容 |
| skills | string[] | 否 | 额外技能名称；服务端始终先绑定 `archive-protocol`、`schedule-plan`、`kweaver-core`，再与本字段合并（去重）。响应中 `skills` 为完整绑定 id 列表（含内置三项） |

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

#### 进行数字员工消息流对话

`POST /api/dip-studio/v1/chat/agent`

请求头：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| Authorization | string | 是 | `Bearer <access-token>`，用于 Hydra 内省鉴权 |
| x-openclaw-session-key | string | 是 | 必须先通过 `POST /api/dip-studio/v1/chat/session` 获取；服务会从其中的 `agent:<agentId>` 前缀解析数字员工 ID |

请求：`application/json`

请求体参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| input | string \| MessageItem[] | 是 | OpenResponse 风格输入；当前服务会从中提取最后一条 `role=user` 的文本消息，或直接使用字符串 |
| attachments | ChatAttachment[] | 否 | 附件数组。若包含文件，需先调用 `POST /api/dip-studio/v1/chat/upload` 拿到 `path`，再在此处传入 |

`ChatAttachment` 字段：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| type | string | 是 | 当前仅允许 `input_file` |
| source | object | 是 | 文件来源对象 |

`ChatAttachment.source` 字段：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| type | string | 是 | 当前仅允许 `path` |
| path | string | 是 | 文件路径（推荐传 `POST /api/dip-studio/v1/chat/upload` 返回的工作区相对路径） |

响应：`200 text/event-stream`

返回 OpenResponse 风格 SSE 事件流。服务端通过 OpenClaw WebSocket `chat.send` 建立 Agent 消息流，自动生成随机 UUID 作为 `params.idempotencyKey`，并将 `chat` 文本帧、`agent/assistant` 文本帧以及 `agent/tool` 工具调用帧转换为 `response.created`、`response.output_item.added`、`response.output_text.delta`、`response.output_item.done`、`response.completed`、`response.failed` 等事件；其中 `agent/assistant.data.delta` 优先透传，缺失时回退为 `data.text`。

当请求携带 `attachments` 时，服务会把文件路径列表追加到下游提示词中（隐藏上下文），用于兼容下游未直接消费 `attachments` 字段的场景。

固定模板如下（服务端自动注入）：

```text
<!-- DIP_HIDDEN_ATTACHMENTS_START -->
ATTACHMENT_PATHS:
1. tmp/<session>/<file>
2. tmp/<session>/<file>
ATTACHMENT_INSTRUCTION:
You must read every listed file path using available file-reading tools before answering the user.
If any file cannot be read, explicitly report which path failed and why.
<!-- DIP_HIDDEN_ATTACHMENTS_END -->
```

#### 上传对话附件

`POST /api/dip-studio/v1/chat/upload`

请求头：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| Authorization | string | 是 | `Bearer <access-token>`，用于 Hydra 内省鉴权 |
| x-openclaw-session-key | string | 是 | 必须先通过 `POST /api/dip-studio/v1/chat/session` 获取；服务会从其中的 `agent:<agentId>` 前缀解析数字员工 ID |

请求：`multipart/form-data`

| 字段 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| file | binary | 是 | 本地文件二进制内容（字段名固定为 `file`） |

响应：`200 application/json`

| 参数 | 类型 | 说明 |
| -- | -- | -- |
| path | string | 工作区相对路径，用于后续 `POST /api/dip-studio/v1/chat/agent` 的 `attachments[].path` |

推荐调用顺序：先调用 `POST /api/dip-studio/v1/chat/upload` 上传文件并拿到 `path`，再调用 `POST /api/dip-studio/v1/chat/agent` 发起对话。

#### 获取会话消息详情

`GET /api/dip-studio/v1/chat/messages`

请求头：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| Authorization | string | 是 | `Bearer <access-token>`，用于 Hydra 内省鉴权 |
| x-openclaw-session-key | string | 是 | 必须先通过 `POST /api/dip-studio/v1/chat/session` 获取 |

支持查询参数：`limit`

响应：`200 application/json`

返回指定 Chat 会话的历史消息详情，底层通过 OpenClaw WebSocket `chat.history` 获取。

#### 获取会话消息详情

`GET /api/dip-studio/v1/sessions/{key}/messages`

路径参数：

| 参数 | 类型 | 是否必填 | 说明 |
| -- | -- | -- | -- |
| key | string | 是 | 会话 key |

支持查询参数：`limit`

响应：`200 application/json`

返回指定会话的完整消息详情。该接口内部复用 `GET /api/dip-studio/v1/chat/messages` 的消息查询逻辑，但保持原有路径参数与响应结构不变。

说明：会话历史响应会自动过滤上述隐藏附件上下文模板，不会返回给前端展示。

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
