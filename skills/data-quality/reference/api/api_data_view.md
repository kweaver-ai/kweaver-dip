# dataView
**版本**: 1.0.0.0
**描述**: data view

## 服务器信息
- **URL**: `{DATA_QUALITY_BASE_URL}/api/data-view/v1`
- **协议**: HTTPS

## 认证信息
- **Header**: `Authorization: {DATA_QUALITY_AUTH_TOKEN}`

## 接口详情
### 质量规则

#### GET /explore-rule
**摘要**: 获取规则列表
**描述**: 获取规则列表
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| dimension | query | string | 否 | 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计 |
| enable | query | boolean | 否 | 启用状态，true为已启用，false为未启用，不传该参数则不跟据启用状态筛选 |
| field_id | query | string | 否 | 字段id |
| form_view_id | query | string | 否 | 视图id |
| keyword | query | string | 否 | 关键字查询 |
| rule_level | query | string | 否 | 规则级别，元数据级 字段级 行级 视图级 |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.GetRuleResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### POST /explore-rule
**摘要**: 新建规则
**描述**: 新建规则
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.CreateRuleReq

##### 响应
**201 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.RuleIDResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /explore-rule/repeat
**摘要**: 规则重名校验
**描述**: 规则重名校验
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| field_id | query | string | 否 | 字段id |
| form_view_id | query | string | 否 | 视图id |
| rule_id | query | string | 否 | 规则id |
| rule_name | query | string | 是 | 规则名称 |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_common_models_response.BoolResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### PUT /explore-rule/status
**摘要**: 修改规则启用状态
**描述**: 修改规则启用状态
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.UpdateRuleStatusReqBody

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_common_models_response.BoolResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /explore-rule/{id}
**摘要**: 获取规则详情
**描述**: 获取规则详情
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 规则ID |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.GetRuleResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### PUT /explore-rule/{id}
**摘要**: 修改规则
**描述**: 修改规则
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 规则ID |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.UpdateRuleReqBody

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.RuleIDResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### DELETE /explore-rule/{id}
**摘要**: 删除规则
**描述**: 删除规则
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 规则ID |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.RuleIDResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

### 探查任务

#### GET /explore-task
**摘要**: 获取探查任务列表
**描述**: 获取探查任务列表
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| direction | query | string | 否 | 排序方向，枚举：asc：正序；desc：倒序。默认倒序 |
| keyword | query | string | 否 | 关键字查询，字符无限制 |
| limit | query | integer | 否 | 每页大小，默认10 |
| offset | query | integer | 否 | 页码，默认1 |
| sort | query | string | 否 | 排序类型，枚举：created_at：按创建时间排序 |
| status | query | string | 否 | 任务状态，枚举 "queuing" "running" "finished" "canceled" "failed"可以多选，逗号分隔 |
| type | query | string | 否 | 探查类型，"explore_data","explore_timestamp","explore_classification" |
| work_order_id | query | string | 否 | 质量检测工单id |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.ListExploreTaskResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### PUT /explore-task/{id}
**摘要**: 取消探查任务
**描述**: 取消探查任务
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 探查任务ID |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.CancelTaskReqBody

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.ExploreTaskIDResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

### 逻辑视图

#### GET /form-view
**摘要**: 获取逻辑视图列表
**描述**: 获取逻辑视图列表,包括元数据视图、自定义视图、逻辑实体视图
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| datasource_id | query | string | 否 | 数据源id |
| keyword | query | string | 否 | 关键字查询，字符无限制 |
| limit | query | integer | 否 | 每页大小，默认10 |
| offset | query | integer | 否 | 页码，默认1 |
| sort | query | string | 否 | 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序 |
| direction | query | string | 否 | 排序方向，枚举：asc：正序；desc：倒序。默认倒序 |
| mdl_id | query | string | 否 | 统一视图id |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.PageListFormViewResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /form-view/{id}/details
**摘要**: 获取逻辑视图详情
**描述**: 获取单个逻辑视图的详细信息
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 逻辑视图ID |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.FormViewV2
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### POST /logic-view/field/multi
**摘要**: 获取多个逻辑视图字段
**描述**: 获取多个逻辑视图字段
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |

##### 请求体
**Content-Type**: application/json
**类型**: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.GetMultiViewsFieldsBody

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.GetMultiViewsFieldsRes
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /form-view/explore-report
**摘要**: 探查报告查询
**描述**: 探查报告查询
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | query | string | 是 | 逻辑视图id |
| third_party | query | boolean | 否 | 第三方报告 |
| version | query | integer | 否 | 报告版本 |

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreReportResp
**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError
**404 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

---

## 数据模型

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.GetRuleResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| dimension | string | 否 | 维度，完整性 规范性 唯一性 准确性 一致性 及时性 |
| dimension_type | string | 否 | 维度类型 |
| draft | boolean | 否 | 是否草稿 |
| enable | boolean | 否 | 是否启用 |
| field_id | string | 否 | 字段id |
| rule_config | string | 否 | 规则配置 |
| rule_description | string | 否 | 规则描述 |
| rule_id | string | 否 | 规则id |
| rule_level | string | 否 | 规则级别，元数据级 字段级 行级 视图级 |
| rule_name | string | 否 | 规则名称 |
| template_id | string | 否 | 模板id |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.CreateRuleReq
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| dimension | string | 否 | 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计 |
| dimension_type | string | 否 | 维度类型,行数据空值项检查 行数据重复值检查 空值项检查 码值检查 重复值检查 格式检查 自定义规则                                                                  // 维度类型 |
| draft | boolean | 否 | 是否草稿 |
| enable | boolean | 是 | 是否启用 |
| field_id | string | 否 | 字段id |
| form_view_id | string | 否 | 视图id |
| rule_config | string | 否 | 规则配置 |
| rule_description | string | 否 | 规则描述 |
| rule_level | string | 否 | 规则级别，元数据级 字段级 行级 视图级 |
| rule_name | string | 否 | 规则名称 |
| template_id | string | 否 | 模板id |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.RuleIDResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| rule_id | string | 否 | 规则id |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_common_models_response.BoolResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| value | boolean | 否 | 布尔值 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.UpdateRuleStatusReqBody
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| enable | boolean | 是 | 是否启用 |
| rule_ids | Array[string] | 是 | 规则id数组 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_rule.UpdateRuleReqBody
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| draft | boolean | 否 | 是否草稿 |
| enable | boolean | 否 | 是否启用 |
| rule_config | string | 否 | 规则配置 |
| rule_description | string | 否 | 规则描述 |
| rule_name | string | 是 | 规则名称 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.ListExploreTaskResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| entries | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.ExploreTaskInfo] | 否 | 对象列表 |
| total_count | integer | 否 | 当前筛选条件下的对象数量 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.ExploreTaskInfo
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| config | string | 否 | 探查配置 |
| created_at | integer | 否 | 开始时间 |
| created_by | string | 否 | 发起人 |
| datasource_id | string | 否 | 数据源id |
| datasource_name | string | 否 | 数据源名称 |
| datasource_type | string | 否 | 数据源类型 |
| finished_at | integer | 否 | 结束时间 |
| form_view_id | string | 否 | 视图id |
| form_view_name | string | 否 | 视图名称 |
| form_view_type | string | 否 | 视图类型 |
| remark | string | 否 | 异常原因 |
| status | string | 否 | 任务状态 |
| task_id | string | 否 | 任务id |
| type | string | 否 | 任务类型 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.CancelTaskReqBody
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| status | string | 是 | 探查状态 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_explore_task.ExploreTaskIDResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| task_id | string | 否 | 探查任务id |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.PageListFormViewResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| entries | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.FormViewV1] | 是 | 对象列表 |
| explore_time | integer | 否 | 最近一次探查数据源的探查时间,仅单个数据源返回 |
| total_count | integer | 是 | 当前筛选条件下的对象数量 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.FormViewV1
#### 属性
| 字段名 | 类型 | 是否必填 | 描述 |
|--------|------|----------|------|
| id | string | 否 | 逻辑视图uuid |
| uniform_catalog_code | string | 否 | 逻辑视图编码 |
| technical_name | string | 否 | 表技术名称 |
| business_name | string | 否 | 表业务名称 |
| original_name | string | 否 | 原始表名称 |
| type | string | 否 | 逻辑视图来源 |
| datasource_id | string | 否 | 数据源id |
| datasource | string | 否 | 数据源 |
| datasource_type | string | 否 | 数据源类型 |
| datasource_catalog_name | string | 否 | 数据源catalog |
| status | string | 否 | 逻辑视图状态\扫描结果 |
| publish_at | integer | 否 | 发布时间 |
| online_time | integer | 否 | 上线时间 |
| online_status | string | 否 | 上线状态 |
| audit_advice | string | 否 | 审核意见，仅驳回时有用 |
| edit_status | string | 否 | 内容状态 |
| metadata_form_id | string | 否 | 元数据表id |
| created_at | integer | 否 | 创建时间 |
| created_by | string | 否 | 创建人 |
| updated_at | integer | 否 | 编辑时间 |
| updated_by | string | 否 | 编辑人 |
| view_source_catalog_name | string | 否 | 视图源 |
| database_name | string | 否 | 数据库名称 |
| subject_id | string | 否 | 所属主题id |
| subject | string | 否 | 所属主题 |
| subject_path_id | string | 否 | 所属主题路径id |
| subject_path | string | 否 | 所属主题路径 |
| department_id | string | 否 | 所属部门id |
| department | string | 否 | 所属部门 |
| department_path | string | 否 | 所属部门路径 |
| owners | array | 否 | 数据Owner |
| explore_job_id | string | 否 | 探查作业ID |
| explore_job_version | integer | 否 | 探查作业版本 |
| scene_analysis_id | string | 否 | 场景分析画布id |
| explored_data | integer | 否 | 探查数据 |
| explored_timestamp | integer | 否 | 探查时间戳 |
| explored_classification | integer | 否 | 探查数据分类 |
| excel_file_name | string | 否 | excel文件名 |
| data_origin_form_id | string | 否 | 生成的数据原始表ID |
| source_sign | integer | 否 | 来源标识 |
| field_count | integer | 否 | 字段数量 |
| apply_num | integer | 否 | 申请次数 |
| data_catalog_id | string | 否 | 所属目录ID |
| data_catalog_name | string | 否 | 所属目录 |
| catalog_provider | string | 否 | 目录提供方 |
| has_dwh_data_auth_req_form | boolean | 否 | 有数仓数据权限请求的表单 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.FormViewV2
#### 属性
| 字段名 | 类型 | 是否必填 | 描述 |
|--------|------|----------|------|
| technical_name | string | 否 | 表技术名称 |
| business_name | string | 否 | 表业务名称 |
| original_name | string | 否 | 原始名称 |
| type | string | 否 | 视图类型 |
| uniform_catalog_code | string | 否 | 逻辑视图编码 |
| datasource_id | string | 否 | 数据源id（不可编辑） |
| datasource_name | string | 否 | 数据源名称（不可编辑） |
| datasource_department_id | string | 否 | 数据源所属部门ID |
| schema | string | 否 | 库名称（不可编辑） |
| info_system_id | string | 否 | 关联信息系统ID（不可编辑） |
| info_system | string | 否 | 关联信息系统（默认显示所属数据源信息系统，非必填，以用户修改为准） |
| description | string | 否 | 描述 |
| comment | string | 否 | 注释 |
| subject_id | string | 否 | 所属主题id |
| subject_path_id | string | 否 | 所属主题path id |
| subject | string | 否 | 所属主题 |
| department_id | string | 否 | 所属部门id |
| department | string | 否 | 所属部门 |
| owners | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.Owner] | 否 | 数据Owner |
| scene_analysis_id | string | 否 | 场景分析画布id |
| view_source_catalog_name | string | 否 | 视图源 |
| publish_at | integer | 否 | 发布时间 |
| online_status | string | 否 | 上线状态 |
| online_time | integer | 否 | 上线时间 |
| created_at | integer | 否 | 创建时间 |
| created_by | string | 否 | 创建人 |
| updated_at | integer | 否 | 编辑时间 |
| updated_by | string | 否 | 编辑人 |
| sheet | string | 否 | sheet页，逗号分隔 |
| start_cell | string | 否 | 起始单元格 |
| end_cell | string | 否 | 结束单元格 |
| has_headers | boolean | 否 | 是否首行作为列名 |
| sheet_as_new_column | boolean | 否 | 是否将sheet作为新列 |
| excel_file_name | string | 否 | excel文件名 |
| source_sign | integer | 否 | 来源标识 |
| is_favored | boolean | 否 | 是否已收藏 |
| favor_id | integer | 否 | 收藏项ID，仅已收藏时返回该字段 |
| publish_status | string | 否 | 发布状态 |
| catalog_provider | string | 否 | 目录提供方路径 |
| update_cycle | integer | 否 | 更新周期 |
| shared_type | integer | 否 | 共享属性 |
| open_type | integer | 否 | 开放属性 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.Owner
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| owner_id | string | 否 | 数据Owner id |
| owner_name | string | 否 | 数据Owner name |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.GetMultiViewsFieldsBody
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| ids | Array[string] | 是 | 视图id |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.GetMultiViewsFieldsRes
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| logic_views | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.LogicViewFields] | 否 |  |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.LogicViewFields
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| business_name | string | 否 | 业务名称 |
| fields | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.FieldsRes] | 否 |  |
| id | string | 否 |  |
| technical_name | string | 否 | 技术名称 |
| uniform_catalog_code | string | 否 | 逻辑视图编码 |
| view_source_catalog_name | string | 否 | 视图源 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.FieldsRes
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| attribute_id | string | 否 | L5属性ID |
| attribute_name | string | 否 | L5属性名称 |
| attribute_path | string | 否 | 路径id |
| business_name | string | 否 | 列业务名称 |
| business_timestamp | boolean | 否 | 是否业务时间字段 |
| classfity_type | integer | 否 | 分类类型,1自动2人工 |
| code_table | string | 否 | 码表名称 |
| code_table_id | string | 否 | 码表ID |
| code_table_status | string | 否 | 码表状态 |
| comment | string | 否 | 列注释 |
| data_accuracy | integer | 否 | 数据精度（仅DECIMAL类型） |
| data_length | integer | 否 | 数据长度 |
| data_type | string | 否 | 数据类型 |
| enable_rules | integer | 否 | 已开启字段级规则数 |
| grade_type | integer | 否 | 分级类型,1自动2人工 |
| id | string | 否 | 列uuid |
| index | integer | 否 | 字段顺序 |
| is_downloadable | boolean | 否 | 当前用户是否有此字段的下载权限 |
| is_nullable | string | 否 | 是否为空 ,YES/NO |
| is_readable | boolean | 否 | 当前用户是否有此字段的读取权限 |
| label_icon | string | 否 | 标签颜色 |
| label_id | string | 否 | 标签ID |
| label_is_protected | boolean | 否 | 标签是否受数据查询保护 |
| label_name | string | 否 | 标签名称 |
| label_path | string | 否 | 标签路径 |
| open_type | integer | 否 | 开放属性 |
| original_data_type | string | 否 | 原始数据类型 |
| original_name | string | 否 | 原始字段名称 |
| primary_key | boolean | 否 | 是否主键 |
| reset_before_data_type | string | 否 | 重置前数据类型 |
| reset_convert_rules | string | 否 | 重置转换规则 （仅日期类型） |
| reset_data_accuracy | integer | 否 | 重置数据精度（仅DECIMAL类型） |
| reset_data_length | integer | 否 | 重置数据长度（仅DECIMAL类型） |
| secret_type | integer | 否 | 涉密属性 |
| sensitive_type | integer | 否 | 敏感属性 |
| shared_type | integer | 否 | 共享属性 |
| simple_type | string | 否 | 数据大类型 |
| standard | string | 否 | 数据标准名称 |
| standard_code | string | 否 | 数据标准code |
| standard_status | string | 否 | 数据标准状态 |
| standard_type | string | 否 | 数据标准类型 |
| standard_type_name | string | 否 | 数据标准类型名称 |
| status | string | 否 | 列视图状态,扫描结果 0：无变化、1：新增、2：删除 |
| technical_name | string | 否 | 列技术名称 |
| total_rules | integer | 否 | 字段级规则总数 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreReportResp
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| code | string | 否 | 数据探查报告编号 |
| explore_field_details | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreFieldDetail] | 否 | 字段级探查结果详情 |
| explore_metadata_details | devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreDetails| 否 | 元数据级探查结果详情 |
| explore_row_details | devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreDetails | 否 | 行级探查结果详情 |
| explore_time | integer | 否 | 探查时间 |
| explore_view_details | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.RuleResult] | 否 | 视图级探查结果详情 |
| overview | devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ReportOverview | 否 | 总览信息 |
| task_id | string | 否 | 任务ID |
| total_sample | integer | 否 | 采样条数 |
| version | integer | 否 | 任务版本 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreFieldDetail
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| accuracy_score | number | 否 | 准确性维度评分，缺省为NULL |
| code_info | string | 否 | 码表信息 |
| completeness_score | number | 否 | 完整性维度评分，缺省为NULL |
| consistency_score | number | 否 | 一致性维度评分，缺省为NULL |
| details | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.RuleResult] | 否 | 规则结果明细（仅返回部分需要呈现的字段规则输出结果） |
| field_id | string | 否 | 字段id |
| standardization_score | number | 否 | 规范性维度评分，缺省为NULL |
| uniqueness_score | number | 否 | 唯一性维度评分，缺省为NULL |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreDetails
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| accuracy_score | number | 否 | 准确性维度评分，缺省为NULL |
| completeness_score | number | 否 | 完整性维度评分，缺省为NULL |
| consistency_score | number | 否 | 一致性维度评分，缺省为NULL |
| explore_details | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.RuleResult] | 否 | 探查结果详情 |
| standardization_score | number | 否 | 规范性维度评分，缺省为NULL |
| uniqueness_score | number | 否 | 唯一性维度评分，缺省为NULL |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ReportOverview
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| accuracy_score | number | 否 | 准确性维度评分，缺省为NULL |
| completeness_score | number | 否 | 完整性维度评分，缺省为NULL |
| consistency_score | number | 否 | 一致性维度评分，缺省为NULL |
| fields | devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreFieldsInfo | 否 | 表字段信息 |
| score_trend | Array[devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ScoreTrend] | 否 | 六性评分历史趋势数据 |
| standardization_score | number | 否 | 规范性维度评分，缺省为NULL |
| uniqueness_score | number | 否 | 唯一性维度评分，缺省为NULL |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ScoreTrend
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| accuracy_score | number | 否 | 准确性维度评分，缺省为NULL |
| completeness_score | number | 否 | 完整性维度评分，缺省为NULL |
| consistency_score | number | 否 | 一致性维度评分，缺省为NULL |
| explore_time | integer | 否 | 探查时间 |
| standardization_score | number | 否 | 规范性维度评分，缺省为NULL |
| task_id | string | 否 | 任务ID |
| uniqueness_score | number | 否 | 唯一性维度评分，缺省为NULL |
| version | integer | 否 | 任务版本 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.ExploreFieldsInfo
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| explore_count | integer | 否 | 探查字段数 |
| total_count | integer | 否 | 总字段数 |

### devops_aishu_cn_AISHUDevOps_AnyFabric__git_data-view_domain_form_view.RuleResult
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| accuracy_score | number | 否 | 准确性维度评分，缺省为NULL |
| completeness_score | number | 否 | 完整性维度评分，缺省为NULL |
| consistency_score | number | 否 | 一致性维度评分，缺省为NULL |
| dimension | string | 否 | 维度属性 0准确性,1及时性,2完整性,3唯一性，4一致性,5规范性,6数据统计 |
| dimension_type | string | 否 | 维度类型 |
| inspected_count | integer | 否 | 检测数据量 |
| issue_count | integer | 否 | 问题数据量 |
| result | string | 否 | 规则输出结果 []any规则输出列级结果 |
| rule_config | string | 否 |  |
| rule_description | string | 否 | 规则描述 |
| rule_id | string | 否 | 规则ID |
| rule_name | string | 否 | 规则名称 |
| standardization_score | number | 否 | 规范性维度评分，缺省为NULL |
| uniqueness_score | number | 否 | 唯一性维度评分，缺省为NULL |

### rest.HttpError
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| cause | string | 否 | 错误原因 |
| code | string | 否 | 返回错误码，格式: 服务名.模块.错误 |
| description | string | 否 | 错误描述 |
| detail |  | 否 | 错误详情, 一般是json对象 |
| solution | string | 否 | 错误处理办法 |

---

## 使用示例

### 1. 获取规则列表示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule?dimension=完整性&enable=true&limit=10&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule?dimension=完整性&enable=true&limit=10&offset=1" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "entries": [
    {
      "rule_id": "550e8400-e29b-41d4-a716-446655440000",
      "rule_name": "手机号非空检查",
      "dimension": "完整性",
      "dimension_type": "空值项检查",
      "rule_level": "字段级",
      "enable": true,
      "field_id": "field-uuid-001",
      "form_view_id": "view-uuid-001",
      "rule_description": "检查手机号字段是否为空",
      "rule_config": "{}",
      "draft": false,
      "template_id": ""
    }
  ],
  "total_count": 1
}
```

---

### 2. 新建规则示例

#### 请求示例
```http
POST {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "dimension": "完整性",
  "dimension_type": "空值项检查",
  "enable": true,
  "field_id": "field-uuid-001",
  "form_view_id": "view-uuid-001",
  "rule_level": "字段级",
  "rule_name": "手机号非空检查",
  "rule_description": "检查手机号字段是否为空",
  "rule_config": "{}",
  "draft": false,
  "template_id": ""
}
```

#### cURL示例
```bash
curl -X POST "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "dimension": "完整性",
    "dimension_type": "空值项检查",
    "enable": true,
    "field_id": "field-uuid-001",
    "form_view_id": "view-uuid-001",
    "rule_level": "字段级",
    "rule_name": "手机号非空检查",
    "rule_description": "检查手机号字段是否为空",
    "rule_config": "{}",
    "draft": false,
    "template_id": ""
  }'
```

#### 响应示例
```json
{
  "rule_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 3. 获取逻辑视图列表示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?keyword=客户&limit=10&offset=1&sort=created_at&direction=desc
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?keyword=客户&limit=10&offset=1&sort=created_at&direction=desc" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "entries": [
    {
      "id": "view-uuid-001",
      "business_name": "客户主数据表",
      "technical_name": "cust_main",
      "original_name": "cust_main",
      "uniform_catalog_code": "CUST_MAIN_001",
      "type": "元数据视图",
      "datasource_id": "ds-uuid-001",
      "datasource": "MySQL生产库",
      "datasource_type": "mysql",
      "datasource_catalog_name": "production_db",
      "status": "0",
      "department": "数据管理部",
      "department_id": "dept-001",
      "field_count": 25,
      "created_at": 1704067200,
      "updated_at": 1706659200,
      "created_by": "user-001",
      "updated_by": "user-001",
      "subject": "客户域",
      "subject_id": "subject-001"
    }
  ],
  "total_count": 1,
  "explore_time": 1706659200
}
```

---

### 4. 通过统一视图ID(mdl_id)获取逻辑视图示例

> **场景**: 从知识网络对象类获取逻辑视图时，使用对象类的 `data_source.id` 作为 `mdl_id` 查询。

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?mdl_id=2030822182677872642&limit=10&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?mdl_id=2030822182677872642&limit=10&offset=1" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "entries": [
    {
      "id": "view-uuid-001",
      "business_name": "逻辑视图数据源表",
      "technical_name": "logic_view_datasource",
      "mdl_id": "2030822182677872642",
      "type": "元数据视图",
      "datasource_id": "ds-uuid-001",
      "datasource": "MySQL生产库",
      "field_count": 15,
      "created_at": 1704067200,
      "updated_at": 1706659200
    }
  ],
  "total_count": 1
}
```

**使用说明**:
1. 使用对象类的 `data_source.id` 作为 `mdl_id` 参数
2. 从响应中提取 `id` 字段作为逻辑视图ID (`form_view_id`)
3. 使用 `form_view_id` 调用详情接口获取完整视图信息

---

### 5. 获取逻辑视图详情示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view/view-uuid-001/details
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view/view-uuid-001/details" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "technical_name": "cust_main",
  "business_name": "客户主数据表",
  "original_name": "cust_main",
  "type": "元数据视图",
  "uniform_catalog_code": "CUST_MAIN_001",
  "datasource_id": "ds-uuid-001",
  "datasource_name": "MySQL生产库",
  "datasource_department_id": "dept-001",
  "schema": "production_db",
  "description": "客户主数据表，存储客户基本信息",
  "comment": "核心业务表",
  "subject_id": "subject-001",
  "subject": "客户域",
  "department_id": "dept-001",
  "department": "数据管理部",
  "owners": [
    {
      "owner_id": "user-001",
      "owner_name": "张三"
    }
  ],
  "publish_at": 1704067200,
  "online_status": "已上线",
  "online_time": 1704067200,
  "created_at": 1704067200,
  "created_by": "user-001",
  "updated_at": 1706659200,
  "updated_by": "user-001",
  "publish_status": "已发布",
  "is_favored": false
}
```

---

### 6. 获取逻辑视图字段示例

#### 请求示例
```http
POST {DATA_QUALITY_BASE_URL}/api/data-view/v1/logic-view/field/multi
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "ids": ["view-uuid-001", "view-uuid-002"]
}
```

#### cURL示例
```bash
curl -X POST "{DATA_QUALITY_BASE_URL}/api/data-view/v1/logic-view/field/multi" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["view-uuid-001", "view-uuid-002"]
  }'
```

#### 响应示例
```json
{
  "logic_views": [
    {
      "id": "view-uuid-001",
      "business_name": "客户主数据表",
      "technical_name": "cust_main",
      "uniform_catalog_code": "CUST_MAIN_001",
      "view_source_catalog_name": "mysql",
      "fields": [
        {
          "id": "field-uuid-001",
          "business_name": "手机号码",
          "technical_name": "mobile_no",
          "original_name": "mobile_no",
          "data_type": "VARCHAR",
          "data_length": 11,
          "data_accuracy": 0,
          "is_nullable": "NO",
          "primary_key": false,
          "enable_rules": 2,
          "total_rules": 3,
          "standard": "手机号码",
          "standard_code": "DE0001",
          "standard_status": "已发布",
          "index": 1,
          "simple_type": "字符串",
          "comment": "客户手机号码",
          "is_readable": true,
          "is_downloadable": true
        }
      ]
    }
  ]
}
```

---

### 6. 获取探查任务列表示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-task?status=finished&limit=10&offset=1&sort=created_at&direction=desc
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-task?status=finished&limit=10&offset=1&sort=created_at&direction=desc" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "entries": [
    {
      "task_id": "task-uuid-001",
      "form_view_id": "view-uuid-001",
      "form_view_name": "客户主数据表",
      "form_view_type": "元数据视图",
      "datasource_id": "ds-uuid-001",
      "datasource_name": "MySQL生产库",
      "datasource_type": "mysql",
      "status": "finished",
      "type": "explore_data",
      "config": "{}",
      "created_at": 1704067200,
      "finished_at": 1704067500,
      "created_by": "user-001",
      "remark": ""
    }
  ],
  "total_count": 1
}
```

---

### 7. 取消探查任务示例

#### 请求示例
```http
PUT {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-task/task-uuid-001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "status": "canceled"
}
```

#### cURL示例
```bash
curl -X PUT "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-task/task-uuid-001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "canceled"
  }'
```

#### 响应示例
```json
{
  "task_id": "task-uuid-001"
}
```

---

### 8. 规则重名校验示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/repeat?rule_name=手机号非空检查&form_view_id=view-uuid-001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/repeat?rule_name=手机号非空检查&form_view_id=view-uuid-001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "value": false
}
```

---

### 9. 修改规则启用状态示例

#### 请求示例
```http
PUT {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/status
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "rule_ids": ["rule-uuid-001", "rule-uuid-002"],
  "enable": false
}
```

#### cURL示例
```bash
curl -X PUT "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/status" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_ids": ["rule-uuid-001", "rule-uuid-002"],
    "enable": false
  }'
```

#### 响应示例
```json
{
  "value": true
}
```

---

### 10. 获取规则详情示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/rule-uuid-001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/rule-uuid-001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "rule_id": "rule-uuid-001",
  "rule_name": "手机号非空检查",
  "dimension": "完整性",
  "dimension_type": "空值项检查",
  "rule_level": "字段级",
  "enable": true,
  "field_id": "field-uuid-001",
  "form_view_id": "view-uuid-001",
  "rule_description": "检查手机号字段是否为空",
  "rule_config": "{}",
  "draft": false,
  "template_id": ""
}
```

---

### 11. 修改规则示例

#### 请求示例
```http
PUT {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/rule-uuid-001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "rule_name": "手机号非空检查（更新）",
  "rule_description": "检查手机号字段是否为空，更新描述",
  "rule_config": "{}",
  "enable": true,
  "draft": false
}
```

#### cURL示例
```bash
curl -X PUT "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/rule-uuid-001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "手机号非空检查（更新）",
    "rule_description": "检查手机号字段是否为空，更新描述",
    "rule_config": "{}",
    "enable": true,
    "draft": false
  }'
```

#### 响应示例
```json
{
  "rule_id": "rule-uuid-001"
}
```

---

### 12. 删除规则示例

#### 请求示例
```http
DELETE {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/rule-uuid-001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X DELETE "{DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule/rule-uuid-001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "rule_id": "rule-uuid-001"
}
```
