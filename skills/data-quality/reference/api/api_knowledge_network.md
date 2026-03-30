# knowledgeNetwork
**版本**: 1.0
**描述**: knowledge network service - 知识网络管理

## 服务器信息
- **URL**: `{DATA_QUALITY_BASE_URL}/api/ontology-manager/v1`
- **协议**: HTTPS

## 认证信息
- **Header**: `Authorization: {DATA_QUALITY_AUTH_TOKEN}`

## 接口详情

### 知识网络管理

#### GET /knowledge-networks
**摘要**: 获取知识网络列表
**描述**: 分页获取知识网络列表，支持按名称/ID模糊搜索、排序和分页

##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| X-Business-Domain | header | string | 是 | 业务域ID，如 `bd_public` |
| offset | query | integer | 否 | 页码偏移量，默认0 |
| limit | query | integer | 否 | 每页大小，默认50 |
| direction | query | string | 否 | 排序方向，枚举：asc（正序）、desc（倒序），默认desc |
| sort | query | string | 否 | 排序字段，如 `update_time`（更新时间）、`name`（知识网络名称） |
| name_pattern | query | string | 否 | 知识网络名称/ID模糊搜索关键字，支持URL编码的中文 |

##### 请求体
无

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: KnowledgeNetworkListResp

**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

**401 未授权**
- Content-Type: application/json
  - 类型: rest.HttpError

**403 禁止访问**
- Content-Type: application/json
  - 类型: rest.HttpError

---

#### GET /knowledge-networks/{id}/object-types
**摘要**: 获取知识网络下的对象/对象类列表
**描述**: 分页获取指定知识网络下的对象类型列表，包含数据源信息、数据属性、主键等详细配置

##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| id | path | string | 是 | 知识网络ID |
| offset | query | integer | 否 | 页码偏移量，默认0 |
| limit | query | integer | 否 | 每页大小，默认5 |
| name_pattern | query | string | 否 | 对象名称/ID模糊搜索关键字，支持URL编码的中文 |

##### 请求体
无

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: ObjectTypeListResp

**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

**401 未授权**
- Content-Type: application/json
  - 类型: rest.HttpError

**403 禁止访问**
- Content-Type: application/json
  - 类型: rest.HttpError

**404 资源不存在**
- Content-Type: application/json
  - 类型: rest.HttpError

---

## 数据模型

### KnowledgeNetworkListResp
**描述**: 知识网络列表响应
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| total_count | integer | 是 | 符合条件的知识网络总数 |
| entries | Array[KnowledgeNetworkResp] | 是 | 知识网络列表 |

### KnowledgeNetworkResp
**描述**: 知识网络信息响应
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 知识网络ID |
| name | string | 是 | 知识网络名称 |
| tags | Array[string] | 是 | 标签列表 |
| comment | string | 是 | 备注说明 |
| icon | string | 是 | 图标标识，如 `icon-dip-suanziguanli` |
| color | string | 是 | 颜色代码，如 `#0e5fc5` |
| detail | string | 是 | 详细描述 |
| branch | string | 是 | 分支名称，如 `main` |
| business_domain | string | 是 | 所属业务域ID |
| creator | UserInfo | 是 | 创建者信息 |
| create_time | integer | 是 | 创建时间，Unix时间戳（毫秒） |
| updater | UserInfo | 是 | 更新者信息 |
| update_time | integer | 是 | 更新时间，Unix时间戳（毫秒） |
| module_type | string | 是 | 模块类型，如 `knowledge_network` |
| operations | Array[string] | 是 | 允许的操作列表 |

### UserInfo
**描述**: 用户信息
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 用户ID |
| type | string | 是 | 用户类型，如 `user` |
| name | string | 是 | 用户名称 |

### ObjectTypeListResp
**描述**: 对象类型列表响应
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| entries | Array[ObjectTypeResp] | 是 | 对象类型列表 |
| total_count | integer | 是 | 对象类型总数 |

### ObjectTypeResp
**描述**: 对象类信息响应
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 对象ID |
| name | string | 是 | 对象名称 |
| data_source | DataSourceInfo | 是 | 数据源信息 |
| data_properties | Array[DataProperty] | 是 | 数据属性列表 |
| primary_keys | Array[string] | 是 | 主键字段列表 |
| display_key | string | 是 | 显示字段 |
| incremental_key | string | 是 | 增量更新字段 |
| tags | Array[string] | 是 | 标签列表 |
| comment | string | 是 | 备注说明 |
| icon | string | 是 | 图标标识 |
| color | string | 是 | 颜色代码 |
| detail | string | 是 | 详细描述 |
| kn_id | string | 是 | 所属知识网络ID |
| branch | string | 是 | 分支名称 |
| status | ObjectTypeStatus | 是 | 对象类型状态信息 |
| creator | UserInfo | 是 | 创建者信息 |
| create_time | integer | 是 | 创建时间，Unix时间戳（毫秒） |
| updater | UserInfo | 是 | 更新者信息 |
| update_time | integer | 是 | 更新时间，Unix时间戳（毫秒） |
| module_type | string | 是 | 模块类型，如 `object_type` |

### DataSourceInfo
**描述**: 数据源信息
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| type | string | 是 | 数据源类型，如 `data_view` |
| id | string | 是 | 统一视图id |
| name | string | 是 | 数据源名称 |

### DataProperty
**描述**: 数据属性
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | 是 | 属性名称 |
| display_name | string | 是 | 显示名称 |
| type | string | 是 | 数据类型，如 `string`、`datetime` |
| comment | string | 是 | 属性说明 |
| mapped_field | MappedField | 是 | 映射字段信息 |
| condition_operations | Array[string] | 是 | 支持的条件操作，如 `["==", "!=", "in", "not_in"]` |

### MappedField
**描述**: 映射字段信息
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | 是 | 字段名称 |
| type | string | 是 | 字段类型 |
| display_name | string | 是 | 字段显示名称 |

### ObjectTypeStatus
**描述**: 对象类型状态信息
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| incremental_key | string | 是 | 增量更新字段 |
| incremental_value | string | 是 | 增量更新值 |
| index | string | 是 | 索引名称 |
| index_available | boolean | 是 | 索引是否可用 |
| doc_count | integer | 是 | 文档数量 |
| storage_size | integer | 是 | 存储大小（字节） |
| update_time | integer | 是 | 状态更新时间，Unix时间戳（毫秒） |

### rest.HttpError
**描述**: HTTP错误响应
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

### 1. 获取知识网络列表示例

> **中文编码说明**: `name_pattern`参数支持中文模糊搜索，中文内容需进行URL编码（UTF-8）。
> - 原始中文: `质量`
> - URL编码: `%E8%B4%A8%E9%87%8F`

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?offset=0&limit=50&direction=desc&sort=update_time&name_pattern=%E8%B4%A8%E9%87%8F
Authorization: {DATA_QUALITY_AUTH_TOKEN}
X-Business-Domain: bd_public
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?offset=0&limit=50&direction=desc&sort=update_time&name_pattern=%E8%B4%A8%E9%87%8F" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}" \
  -H "X-Business-Domain: bd_public"
```

#### 中文编码示例

**示例1: 搜索包含"数据质量"的知识网络**
```http
# 原始中文: 数据质量
# URL编码: %E6%95%B0%E6%8D%AE%E8%B4%A8%E9%87%8F
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?name_pattern=%E6%95%B0%E6%8D%AE%E8%B4%A8%E9%87%8F
```

**示例2: 使用JavaScript进行编码**
```javascript
const keyword = "数据质量知识网络";
const encoded = encodeURIComponent(keyword);
// 结果: %E6%95%B0%E6%8D%AE%E8%B4%A8%E9%87%8F%E7%9F%A5%E8%AF%86%E7%BD%91%E7%BB%9C
const url = `${DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?name_pattern=${encoded}`;
```

**示例3: 使用Python进行编码**
```python
import urllib.parse
keyword = "数据质量知识网络"
encoded = urllib.parse.quote(keyword)
# 结果: %E6%95%B0%E6%8D%AE%E8%B4%A8%E9%87%8F%E7%9F%A5%E8%AF%86%E7%BD%91%E7%BB%9C
url = f"{DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?name_pattern={encoded}"
```

#### 响应示例
```json
{
  "total_count": 2,
  "entries": [
    {
      "id": "d6tbjbvqqu64a7vl7pjg",
      "name": "数据质量知识网络20260305",
      "tags": [],
      "comment": "",
      "icon": "icon-dip-suanziguanli",
      "color": "#0e5fc5",
      "detail": "",
      "branch": "main",
      "business_domain": "bd_public",
      "creator": {
        "id": "cbf93ec4-ea19-11f0-9c74-c2868d7b6f84",
        "type": "user",
        "name": "liberly"
      },
      "create_time": 1772697323591,
      "updater": {
        "id": "cbf93ec4-ea19-11f0-9c74-c2868d7b6f84",
        "type": "user",
        "name": "liberly"
      },
      "update_time": 1772697323591,
      "module_type": "knowledge_network",
      "operations": [
        "view_detail",
        "export",
        "create",
        "delete",
        "data_query",
        "task_manage",
        "import",
        "modify",
        "authorize"
      ]
    },
    {
      "id": "d5tbjbvqqu64a7vl7pjg",
      "name": "数据质量知识网络",
      "tags": [],
      "comment": "",
      "icon": "icon-dip-suanziguanli",
      "color": "#0e5fc5",
      "detail": "",
      "branch": "main",
      "business_domain": "bd_public",
      "creator": {
        "id": "cbf93ec4-ea19-11f0-9c74-c2868d7b6f84",
        "type": "user",
        "name": "liberly"
      },
      "create_time": 1769674314674,
      "updater": {
        "id": "cbf93ec4-ea19-11f0-9c74-c2868d7b6f84",
        "type": "user",
        "name": "liberly"
      },
      "update_time": 1772693560220,
      "module_type": "knowledge_network",
      "operations": [
        "export",
        "import",
        "view_detail",
        "data_query",
        "task_manage",
        "create",
        "modify",
        "delete",
        "authorize"
      ]
    }
  ]
}
```

---

### 2. 获取对象/对象类列表示例

> **中文编码说明**: `name_pattern`参数支持中文模糊搜索，中文内容需进行URL编码（UTF-8）。
> - 原始中文: `逻辑视图`
> - URL编码: `%E9%80%BB%E8%BE%91%E8%A7%86%E5%9B%BE`

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/d5tbjbvqqu64a7vl7pjg/object-types?offset=0&limit=5
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/d5tbjbvqqu64a7vl7pjg/object-types?offset=0&limit=5" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 中文模糊搜索示例

**示例1: 搜索包含"逻辑视图"的对象类**
```http
# 原始中文: 逻辑视图
# URL编码: %E9%80%BB%E8%BE%91%E8%A7%86%E5%9B%BE
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/d5tbjbvqqu64a7vl7pjg/object-types?name_pattern=%E9%80%BB%E8%BE%91%E8%A7%86%E5%9B%BE
```

**示例2: 使用JavaScript进行编码**
```javascript
const knId = "d5tbjbvqqu64a7vl7pjg";
const keyword = "逻辑视图数据源";
const encoded = encodeURIComponent(keyword);
// 结果: %E9%80%BB%E8%BE%91%E8%A7%86%E5%9B%BE%E6%95%B0%E6%8D%AE%E6%BA%90
const url = `${DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/${knId}/object-types?name_pattern=${encoded}`;
```

**示例3: 使用Python进行编码**
```python
import urllib.parse
kn_id = "d5tbjbvqqu64a7vl7pjg"
keyword = "逻辑视图数据源"
encoded = urllib.parse.quote(keyword)
# 结果: %E9%80%BB%E8%BE%91%E8%A7%86%E5%9B%BE%E6%95%B0%E6%8D%AE%E6%BA%90
url = f"{DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types?name_pattern={encoded}"
```

#### 响应示例
```json
{
  "entries": [
    {
      "id": "d5tcqbmop61d6d0kfa40",
      "name": "逻辑视图数据源",
      "data_source": {
        "type": "data_view",
        "id": "2030822182677872642",
        "name": "逻辑视图数据源表"
      },
      "data_properties": [
        {
          "name": "catalog_name",
          "display_name": "数据源catalog名称",
          "type": "string",
          "comment": "数据源catalog名称",
          "mapped_field": {
            "name": "catalog_name",
            "type": "string",
            "display_name": "数据源catalog名称"
          },
          "condition_operations": [
            "==",
            "!=",
            "in",
            "not_in"
          ]
        },
        {
          "name": "created_at",
          "display_name": "创建时间",
          "type": "datetime",
          "comment": "创建时间",
          "mapped_field": {
            "name": "created_at",
            "type": "datetime",
            "display_name": "创建时间"
          },
          "condition_operations": [
            "==",
            "!=",
            "in",
            "not_in"
          ]
        }
      ],
      "primary_keys": [
        "data_source_id"
      ],
      "display_key": "name",
      "incremental_key": "",
      "tags": [],
      "comment": "",
      "icon": "icon-dip-suanziguanli",
      "color": "#0e5fc5",
      "detail": "",
      "kn_id": "d5tbjbvqqu64a7vl7pjg",
      "branch": "main",
      "status": {
        "incremental_key": "",
        "incremental_value": "",
        "index": "adp-kn_ot_index-d5tbjbvqqu64a7vl7pjg-main-d5tcqbmop61d6d0kfa40-d6n8dbvqqu65p3pfr040",
        "index_available": true,
        "doc_count": 12,
        "storage_size": 165657,
        "update_time": 1773045429053
      },
      "creator": {
        "id": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
        "type": "user",
        "name": "user1"
      },
      "create_time": 1773020098968,
      "updater": {
        "id": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
        "type": "user",
        "name": "user1"
      },
      "update_time": 1773045415729,
      "module_type": "object_type"
    }
  ],
  "total_count": 14
}
```

---

## 业务域说明

### 预定义业务域

| 业务域ID | 业务域名称 | 说明 |
|----------|------------|------|
| `bd_public` | 公共业务域 | 面向所有用户，存放公共资源 |

### 业务域ID格式

业务域ID支持两种格式：
1. **预定义标识符**：如 `bd_public`（公共业务域）
2. **UUID格式**：如 `e2f0a1b8-aa83-4bb3-863f-a62c5b3033d7`
