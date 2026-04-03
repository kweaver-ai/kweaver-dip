# taskCenter
**版本**: 1.0
**描述**: task center

## 服务器信息
- **URL**: `{DATA_QUALITY_BASE_URL}/api/task-center`
- **协议**: HTTPS

## 认证信息
- **Header**: `Authorization: {DATA_QUALITY_AUTH_TOKEN}`

## 接口详情

### 工单

#### GET /work-order/created-by-me
**摘要**: 查看工单列表_创建人是我
**描述**: 查看工单列表_创建人是我
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| direction | query | string | 否 | 排序 - 方向 |
| fields | query | Array[string] | 否 | 关键子匹配字段 |
| finished_at | query | integer | 否 | 创建时间结束 |
| keyword | query | string | 否 | 关键字 |
| limit | query | integer | 否 | 每页大小 |
| offset | query | integer | 否 | 页码，从 1 开始 |
| priority | query | string | 否 | 过滤 - 优先级 |
| sort | query | string | 否 | 排序 - 字段 |
| started_at | query | integer | 否 | 创建时间开始 |
| status | query | string | 否 | 过滤 - 状态：未派发、进行中、已完成 |
| type | query | string | 否 | 过滤 - 类型 |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: adapter_driver_work_order_v1.WorkOrderListCreatedByMeEntryList
**400 Bad Request**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /work-order/my-responsibilities
**摘要**: 查看工单列表_责任人是我
**描述**: 查看工单列表_责任人是我
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| fields | query | Array[string] | 否 | 关键子匹配字段 |
| finished_at | query | integer | 否 | 创建时间结束 |
| keyword | query | string | 否 | 关键字 |
| priority | query | string | 否 | 过滤 - 优先级 |
| started_at | query | integer | 否 | 创建时间开始 |
| status | query | string | 否 | 过滤 - 状态：未派发、进行中、已完成 |
| type | query | string | 否 | 过滤 - 类型 |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: adapter_driver_work_order_v1.WorkOrderListMyResponsibilitiesEntryList
**400 Bad Request**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### POST /api/task-center/v1/work-order
**摘要**: 创建工单
**描述**: 创建工单

##### 前置条件
创建工单前，必须先调用用户信息接口获取当前用户ID：
1. 调用 `GET {DATA_QUALITY_BASE_URL}/api/eacp/v1/user/get` 获取用户ID
2. 将返回的 `userid` 字段值作为 `responsible_uid` 参数

##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderCreateReq

**请求体字段说明**：

| 字段名 | 类型 | 必填 | 固定值 | 描述 |
|--------|------|------|--------|------|
| `name` | string | 是 | - | 工单名称 |
| `type` | string | 是 | `data_quality_audit` | 工单类型（固定值：数据质量稽核） |
| `draft` | boolean | 是 | `false` | 是否为草稿（固定值：false） |
| `source_type` | string | 是 | `standalone` | 来源类型（固定值：standalone） |
| `responsible_uid` | string | 是 | - | 责任人ID，从用户信息接口获取 |
| `remark` | string | 是 | - | 备注，JSON格式字符串，详见下方模板 |

**remark参数模板**：

**场景1：对数据源创建质量检测工单**
```json
{
  "datasource_infos": [
    {
      "datasource_id": "数据源UUID",
      "datasource_name": "数据源名称",
      "datasource_type": "数据源类型",
      "form_view_ids": []
    }
  ]
}
```

**场景2：对视图创建质量检测工单**
```json
{
  "datasource_infos": [
    {
      "datasource_id": "数据源UUID",
      "datasource_name": "数据源名称",
      "datasource_type": "数据源类型",
      "form_view_ids": ["逻辑视图UUID"]
    }
  ]
}
```

**参数说明**：
- `datasource_id`: 数据源ID，必须为有效的UUID格式（如：`a1b2c3d4-e5f6-7890-abcd-ef1234567890`）
- `datasource_name`: 数据源名称
- `datasource_type`: 数据源类型（如 MySQL、Oracle 等）
- `form_view_ids`: 逻辑视图ID数组
  - 对数据源创建工单时：为空数组 `[]`
  - 对视图创建工单时：包含逻辑视图UUID的数组（如：`["view-uuid-001"]`）
  - **所有ID必须为有效的UUID格式**

**UUID格式要求**：
- 标准UUID格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- 8-4-4-4-12位十六进制字符
- 示例：`550e8400-e29b-41d4-a716-446655440000`

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.IDResp

**兼容说明**:
- 当前环境创建成功后优先返回 `{"id":"..."}`。
- 调用方建议同时兼容 `id` 和 `work_order_id` 两种字段名。
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /api/task-center/v1/work-order/name-check
**摘要**: 检查工单是否同名
**描述**: 检查工单是否同名
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | query | string | 否 | 工单id |
| name | query | string | 是 | 工单名称 |
| type | query | string | 是 | 工单类型：数据理解、数据归集、数据标准化、数据融合、数据质量、数据质量稽核 |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: boolean
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /api/task-center/v1/work-order/{id}
**摘要**: 查看工单详情
**描述**: 查看工单详情
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 工单id |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderDetailResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### POST /work-order/{id}/re-explore
**摘要**: 质量检测工单重新发起检测
**描述**: 质量检测工单重新发起检测
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 工单id |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.ReExploreReq

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.IDResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

## 数据模型

### adapter_driver_work_order_v1.WorkOrderListCreatedByMeEntryList
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| entries | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderListCreatedByMeEntry] | 否 |  |
| total_count | integer | 否 |  |

### adapter_driver_work_order_v1.WorkOrderListMyResponsibilitiesEntryList
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| entries | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderListMyResponsibilitiesEntry] | 否 |  |
| total_count | integer | 否 |  |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderListCreatedByMeEntry
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| audit_apply_id | string | 否 | 审核申请ID |
| audit_description | string | 否 | 审核意见 |
| audit_status | string | 否 | 审核状态 |
| code | string | 否 | 编号 |
| draft | boolean | 否 | 是否是草稿 |
| finished_at | string | 否 | 截止日期，空代表无截止日期 |
| id | string | 否 | ID |
| name | string | 否 | 名称 |
| node_inactive | boolean | 否 | 工单所属项目节点未开启。仅在工单来源类型是项目时有值。 |
| priority | string | 否 | 优先级 |
| responsible_user |  | 否 | 责任人 |
| sources | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderSource] | 否 | 来源 |
| status |  | 否 | 状态 |
| synced | boolean | 否 | 是否已经同步到第三方 |
| type | string | 否 | 类型 |
| work_order_task_count |  | 否 | 属于这个工单的工单任务数量 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderListMyResponsibilitiesEntry
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| code | string | 否 | 编号 |
| creator_name | string | 否 | 创建人名称 |
| finished_at | string | 否 | 截止日期，空代表无截止日期 |
| id | string | 否 | ID |
| name | string | 否 | 名称 |
| priority | string | 否 | 优先级 |
| responsible_user |  | 否 | 责任人 |
| sources | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderSource] | 否 | 来源 |
| status |  | 否 | 状态 |
| type | string | 否 | 类型 |
| work_order_task_count |  | 否 | 属于这个工单的工单任务数量 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderSource
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 否 | ID |
| name | string | 否 | 名称 |
| type | string | 否 | 类型 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderCreateReq
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| draft | boolean | 否 | 是否是草稿。对应界面的"暂存" |
| name | string | 是 | 名称 |
| remark | string | 否 | 备注
| responsible_uid | string | 否 |  |
| source_type | string | 否 | 来源类型 |
| type | string | 是 | 工单类型：数据理解、数据归集、数据标准化、数据融合、数据质量、数据质量稽核 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.IDResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 否 | UUID |

### rest.HttpError
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| cause | string | 否 | 错误原因 |
| code | string | 否 | 返回错误码，格式: 服务名.模块.错误 |
| description | string | 否 | 错误描述 |
| detail |  | 否 | 错误详情, 一般是json对象 |
| solution | string | 否 | 错误处理办法 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.ReExploreReq
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| re_explore_mode | string | 是 | 重新探查模式：all 全部重新检测，failed 仅重新检测失败任务 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderDetailResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| audit_status | string | 否 | 审核状态 |
| catalog_infos | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.CatalogInfo] | 否 | 关联数据资源目录 |
| code | string | 否 | 工单编号 |
| created_at | integer | 否 | 创建时间 |
| created_by | string | 否 | 创建人 |
| data_aggregation_inventory |  | 否 | 关联的数据归集清单，工单类型是数据归集时有值 |
| data_quality_improvement |  | 否 | 整改内容 |
| data_research_report |  | 否 | 关联的数据调研报告的 |
| description | string | 否 | 工单说明 |
| draft | boolean | 否 | 是否为草稿 |
| finished_at | integer | 否 | 截止日期 |
| form_views | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderDetailFormView] | 否 | 标准化工单关联的逻辑视图列表 |
| fusion_table |  | 否 | 融合工单关联的融合表 |
| name | string | 否 | 名称 |
| node_id | string | 否 | 所属项目的运营流程节点 ID，仅当工单来源类型是项目时有值。 |
| node_name | string | 否 | 所属项目的运营流程节点名称，仅当工单来源类型是项目时有值。 |
| priority | string | 否 | 优先级 |
| processing_instructions | string | 否 | 处理说明 |
| quality_audit_form_views | Array[data_view.ViewInfo] | 否 | 质量稽核工单关联逻辑视图列表 |
| reject_reason | string | 否 | 驳回理由 |
| remark | string | 否 | 备注 |
| responsible_uid | string | 否 | 责任人 |
| responsible_uname | string | 否 | 责任人名称 |
| source_id | string | 否 | 来源id |
| source_ids | Array[string] | 否 | 来源id列表，第一项与 SourceId 相同 |
| source_name | string | 否 | 来源名称 |
| source_type | string | 否 | 来源类型 |
| stage_id | string | 否 | 所属项目的运营流程阶段 ID，仅当工单来源类型是项目时有值。 |
| status | string | 否 | 工单状态 |
| synced | boolean | 否 | 工单是否已经同步到第三方，例如华傲 |
| type | string | 否 | 工单类型 |
| updated_at | integer | 否 | 修改时间 |
| updated_by | string | 否 | 修改人 |
| work_order_id | string | 否 | 工单id |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.CatalogInfo
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| catalog_id | string | 否 | 数据资源目录id |
| catalog_name | string | 否 | 数据资源目录名称 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderDetailFormView
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| business_name | string | 否 | 业务名称 |
| datasource_name | string | 否 | 所属数据源的名称 |
| department_path | string | 否 | 所属部门的完整路径 |
| description | string | 否 | 描述 |
| fields | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderDetailFormViewField] | 否 | 字段列表 |
| id | string | 否 | ID |
| technical_name | string | 否 | 技术名称 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_task_center_domain_work_order.WorkOrderDetailFormViewField
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| business_name | string | 否 | 业务名称 |
| data_element |  | 否 | 标准化后，字段关联的数据元。缺少此字段，代表未被标准化。 |
| id | string | 否 | ID |
| standard_required | boolean | 否 | 是否需要标准化 |
| technical_name | string | 否 | 技术名称 |

### data_view.ViewInfo
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| business_name | string | 否 | 表业务名称 |
| datasource_name | string | 否 | 数据源名称 |
| department | string | 否 | 所属部门 |
| department_id | string | 否 | 所属部门id |
| department_path | string | 否 | 所属部门路径 |
| description | string | 否 | 描述 |
| id | string | 否 | ID |
| is_audit_rule_configured | boolean | 否 | 是否已配置稽核规则 |
| status | string | 否 | 逻辑视图状态\扫描结果 |
| technical_name | string | 否 | 表技术名称 |
| type | string | 否 | 视图类型 |
| uniform_catalog_code | string | 否 | 逻辑视图编码 |

---

## 使用示例

### 1. 查看工单列表（创建人）示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/task-center/work-order/created-by-me?status=进行中&limit=10&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/task-center/work-order/created-by-me?status=进行中&limit=10&offset=1" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "entries": [
    {
      "id": "work-order-uuid-001",
      "name": "客户数据质量检测",
      "type": "数据质量",
      "status": "进行中",
      "priority": "高",
      "draft": false,
      "finished_at": "2024-12-31T23:59:59Z",
      "work_order_task_count": 5
    }
  ],
  "total_count": 1
}
```

---

### 2. 创建工单示例

#### 前置步骤：获取用户信息
```http
GET {DATA_QUALITY_BASE_URL}/api/eacp/v1/user/get
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**响应**：
```json
{
  "userid": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### 场景1：对数据源创建质量检测工单

#### 请求示例
```http
POST {DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "name": "MySQL生产库数据质量检测",
  "type": "data_quality_audit",
  "draft": false,
  "source_type": "standalone",
  "responsible_uid": "550e8400-e29b-41d4-a716-446655440000",
  "remark": "{\"datasource_infos\": [{\"datasource_id\":\"datasource-uuid-001\",\"datasource_name\":\"MySQL生产库\",\"datasource_type\":\"MySQL\",\"form_view_ids\":[]}]}"
}
```

#### cURL示例
```bash
curl -X POST "{DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MySQL生产库数据质量检测",
    "type": "data_quality_audit",
    "draft": false,
    "source_type": "standalone",
    "responsible_uid": "550e8400-e29b-41d4-a716-446655440000",
    "remark": "{\"datasource_infos\": [{\"datasource_id\":\"datasource-uuid-001\",\"datasource_name\":\"MySQL生产库\",\"datasource_type\":\"MySQL\",\"form_view_ids\":[]}]}"
  }'
```

#### 响应示例
```json
{
  "id": "work-order-uuid-001"
}
```

---

#### 场景2：对视图创建质量检测工单

#### 请求示例
```http
POST {DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "name": "客户主数据表质量检测",
  "type": "data_quality_audit",
  "draft": false,
  "source_type": "standalone",
  "responsible_uid": "550e8400-e29b-41d4-a716-446655440000",
  "remark": "{\"datasource_infos\": [{\"datasource_id\":\"datasource-uuid-001\",\"datasource_name\":\"MySQL生产库\",\"datasource_type\":\"MySQL\",\"form_view_ids\":[\"view-uuid-001\"]}]}"
}
```

#### cURL示例
```bash
curl -X POST "{DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "客户主数据表质量检测",
    "type": "data_quality_audit",
    "draft": false,
    "source_type": "standalone",
    "responsible_uid": "550e8400-e29b-41d4-a716-446655440000",
    "remark": "{\"datasource_infos\": [{\"datasource_id\":\"datasource-uuid-001\",\"datasource_name\":\"MySQL生产库\",\"datasource_type\":\"MySQL\",\"form_view_ids\":[\"view-uuid-001\"]}]}"
  }'
```

#### 响应示例
```json
{
  "id": "work-order-uuid-002"
}
```

---

### 3. 查看工单详情示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order/work-order-uuid-001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order/work-order-uuid-001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "id": "work-order-uuid-001",
  "name": "客户数据质量检测",
  "type": "data_quality_audit",
  "status": "进行中",
  "draft": false,
  "priority": "高",
  "responsible_uid": "user-uuid-001",
  "responsible_uname": "张三",
  "created_at": 1704067200,
  "created_by": "user-uuid-002",
  "remark": "对客户主数据表进行质量检测",
  "form_views": [
    {
      "id": "view-uuid-001",
      "business_name": "客户主数据表",
      "technical_name": "cust_main",
      "fields": [
        {
          "id": "field-uuid-001",
          "business_name": "手机号码",
          "technical_name": "mobile_no",
          "standard_required": true
        }
      ]
    }
  ]
}
```

---

### 4. 检查工单是否同名示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order/name-check?name=客户数据质量检测&type=data_quality_audit
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order/name-check?name=客户数据质量检测&type=data_quality_audit" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
false
```

---

### 5. 质量检测工单重新发起检测示例

#### 请求示例
```http
POST {DATA_QUALITY_BASE_URL}/api/task-center/work-order/work-order-uuid-001/re-explore
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "re_explore_mode": "all"
}
```

#### cURL示例
```bash
curl -X POST "{DATA_QUALITY_BASE_URL}/api/task-center/work-order/work-order-uuid-001/re-explore" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "re_explore_mode": "all"
  }'
```

#### 响应示例
```json
{
  "id": "work-order-uuid-001"
}
```
