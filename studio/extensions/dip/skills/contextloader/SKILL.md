---
name: contextloader
version: "1.0.0"
description: 基于 Context Loader API 加载业务知识网络上下文。适用于概念检索、对象类或行动类识别、对象实例查询、实例子图扩展、逻辑属性解析、动态动作工具召回，以及知识网络构建任务状态查询。
metadata:
  {
    "openclaw":
      {
        "requires": { "env": ["APP_USER_ID", "CONTEXT_LOADER_BASE_URL"] },
      }
  }
---

# Context Loader

当任务涉及从业务知识网络加载上下文时，使用本技能。

典型触发场景：

- 用户想知道某个问题相关的概念、对象类、关系类或行动类
- 用户想查询某个已知对象类下的实例
- 用户想围绕某个对象实例扩展关联图谱上下文
- 用户需要计算某些实例的逻辑属性或指标值
- 用户希望基于真实对象实例召回可执行动作
- 用户想确认知识网络是否仍在构建，或希望触发重建

## 内置参考资料

按需读取以下文件：

- `references/api-calling.md`：请求构造模式与最小调用示例
- `references/examples.md`：中文端到端调用链示例
- `references/openapi/kn_schema_search.yaml`
- `references/openapi/kn_search.yaml`
- `references/openapi/query_object_instance.yaml`
- `references/openapi/query_instance_subgraph.yaml`
- `references/openapi/get_logic_properties_values.yaml`
- `references/openapi/get_action_info.yaml`
- `references/openapi/ontology_job.yaml`

如果你不确定字段名、必填参数、枚举值或请求体结构，先查对应的 OpenAPI 文件，再发起请求。

## 标准工作流

除非用户已经明确提供可靠标识，否则优先按以下顺序执行：

1. 如果用户没有明确给出 `kn_id`，先读取当前 agent 工作区中的 `SOUL.md`
2. 从 `SOUL.md` 的 `## 业务知识网络` 表格中识别候选 BKN 地址，并尝试提取 `kn_id`
3. 当 `ot_id` 或 `at_id` 未知时，先用 `kn_schema_search` 做概念识别
4. 当用户需求较模糊时，用 `kn_search` 做混合检索
5. 当 `kn_id` 和 `ot_id` 已知时，调用 `query_object_instance`
6. 当需要围绕真实实例扩展图谱上下文时，调用 `query_instance_subgraph`
7. 当需要逻辑属性或指标值时，调用 `get_logic_properties_values`
8. 只有拿到真实 `_instance_identity` 后，才调用 `get_action_info`

## `kn_id` 读取规则

如果用户没有直接提供 `kn_id`，优先从当前 agent 的 `SOUL.md` 读取。

本项目里的 `SOUL.md` 约定包含一个业务知识网络表格：

- 标题：`## 业务知识网络`
- 表头：`| 名称 | 地址 |`

处理步骤：

1. 读取当前工作区的 `SOUL.md`
2. 找到 `## 业务知识网络` 段落
3. 解析表格中的每一行 `名称` / `地址`
4. 从 `地址` 中提取 `kn_id`

优先按以下方式从 `地址` 提取 `kn_id`：

- 如果地址中带有查询参数 `kn_id=<value>`，直接取该值
- 如果地址路径中包含 `/knowledge-networks/<kn_id>`，取该路径段
- 如果地址路径中包含 `/bkns/<kn_id>`，取该路径段
- 如果地址本身就是一个明显的知识网络标识，例如 `kn_xxx`，直接使用该值

如果 `SOUL.md` 中有多个 BKN 条目：

- 先根据用户问题语义匹配最相关的 `名称`
- 如果仍然无法唯一确定，先列出候选 BKN 并请用户确认

如果 `SOUL.md` 中没有 BKN 表格，或无法从地址中稳定提取 `kn_id`：

- 不要猜测 `kn_id`
- 直接向用户追问，或先通过其他上游上下文确认

## 强约束

- 不要臆造 `_instance_identity`
- 不要臆造 `ot_id` 或 `at_id`
- 不要臆造 `kn_id`
- `_instance_identity` 必须来自 `query_object_instance` 或 `query_instance_subgraph`
- `get_action_info` 当前只支持单个对象实例
- 过滤条件中的 `value_from` 与 `value` 必须同时出现
- `value_from` 当前只支持 `const`
- 路径子图查询中，`object_types` 与 `relation_types` 的顺序必须严格对应

## 环境变量从哪里注入

本技能依赖的变量已在 frontmatter 中通过 `openclaw.requires.env` 声明（`APP_USER_ID`、`CONTEXT_LOADER_BASE_URL`），便于网关或 IDE 做缺失检查。实际赋值可用下列方式（按部署选型择一或组合）：

1. **`openclaw.json` 的 `skills` 配置（推荐持久化）**：在全局配置 `skills.entries.<技能名>` 下使用 `env` 对象。技能名与目录名一致，一般为 `contextloader`。OpenClaw 会在执行该技能相关能力时把 `env` 合并进运行环境（与网关实现一致，效果等价于进程环境变量）。

   ```json
   {
     "skills": {
       "entries": {
         "contextloader": {
           "enabled": true,
           "env": {
             "APP_USER_ID": "your-app-user-id",
             "CONTEXT_LOADER_BASE_URL": "http://agent-retrieval:30779"
           }
         }
       }
     }
   }
   ```

2. **进程环境**：在启动 OpenClaw Gateway（及 Agent 执行侧）的环境中导出变量，例如 shell、`systemd` 的 `Environment=`、Kubernetes `env`、`docker-compose` 的 `environment`。工具调用进程通常继承该环境。

3. **OpenClaw `skills.update`**：通过网关 WebSocket RPC 调用 `skills.update`，传入 `skillKey`（与技能目录名一致，一般为 `contextloader`）以及 `env` 对象；写入后通常会反映到 `openclaw.json` 的 `skills.entries` 中。参见 `studio/docs/references/openclaw-websocket-rpc/skills.md` 中 `skills.update` 的参数说明。

4. **Agent / 沙箱**：若你所用版本在 `agents.list[]`、`sandbox` 等位置支持额外环境变量，也可在同一键名下设置上述变量，使对应 Agent 执行时可见。

`dip` 插件本身不解析或注入这些变量；由 OpenClaw 根据 `openclaw.json` / RPC 更新后的配置，在 **Agent 实际发起 HTTP 调用** 时提供有效环境。

## 如何调用

基础地址从环境变量 `CONTEXT_LOADER_BASE_URL` 读取：值为 Context Loader（agent-retrieval）服务的完整根 URL，不含路径与末尾斜杠，例如 `http://agent-retrieval:30779`。将 OpenAPI 中的路径与查询串拼在该根 URL 之后即为完整请求 URL。

- 如果 `CONTEXT_LOADER_BASE_URL` 未设置或为空，先停止调用并提示用户补充环境变量

使用环境中可用的任意 HTTP 请求工具即可。具体请求模板、必填请求头、最小请求体以及各接口调用指引，先查看 `references/api-calling.md`。

鉴权约定：

- 从环境变量 `APP_USER_ID` 读取 `x-account-id`
- 调用时使用请求头 `x-account-id: <APP_USER_ID>`
- 调用时固定使用 `x-account-type: app`
- 不传递 `Authorization` 请求头
- 如果 `APP_USER_ID` 缺失，先停止调用并提示用户补充环境变量

默认调用约定：

- 优先使用 `response_format=json`
- 除非 OpenAPI 明确标记为可选，否则传 `x-account-id` 与 `x-account-type`
- `x-account-type` 固定为 `app`
- 用户未提供 `kn_id` 时，先读取 `SOUL.md`，再决定是否发起接口调用

## 输出要求

每次调用后：

- 说明使用了哪个 API，以及为什么这样选
- 返回已识别出的关键标识，如 `kn_id`、`ot_id`、`at_id`、`_instance_identity`
- 如果返回多个候选实例，先列出候选项，再请用户确认下一步
- 合适时给出下一步建议调用的 API
