---
name: "data-quality-api-usage-guide"
description: "数据质量管理 API 使用指南。确保接口 URL 使用正确以及传参合理化。"
---

# API 使用指南

## 接口 URL 正确性确保

**详细API路径验证请参考：[API路径规范与验证机制](./api-path-validation.md)**

### 服务基础路径

| 服务 | 基础路径 | 示例完整路径 |
|------|----------|-------------|
| Data View | `{BASE_URL}/api/data-view/v1` | `http://example.com/api/data-view/v1/form-view` |
| Task Center | `{BASE_URL}/api/task-center/v1` | `http://example.com/api/task-center/v1/work-order` |
| Knowledge Network | `{BASE_URL}/api/ontology-manager/v1` | `http://example.com/api/ontology-manager/v1/knowledge-networks` |
| Session | `{BASE_URL}/api/eacp/v1` | `http://example.com/api/eacp/v1/user/get` |

### 常见 URL 错误及修正

| 错误 URL | 正确 URL | 说明 |
|---------|---------|------|
| `/api/ontology/v1/ontology` | `/api/ontology-manager/v1/knowledge-networks` | 路径错误，应为 knowledge-networks |
| `/api/ontology/v1/ontology/{id}/object-class` | `/api/ontology-manager/v1/knowledge-networks/{id}/object-types` | 路径错误，应为 object-types |
| `/api/task-center/work-order` | `/api/task-center/v1/work-order` | 缺少 v1 版本号 |
| `/api/data-view/form-view` | `/api/data-view/v1/form-view` | 缺少 v1 版本号 |

## 传参合理化指南

### 1. 知识网络查询传参

#### 按名称模糊匹配
```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?name_pattern={关键词}&offset=0&limit=50
Authorization: {DATA_QUALITY_AUTH_TOKEN}
X-Business-Domain: bd_public
```

**参数说明**：
- `name_pattern`：知识网络名称或ID的模糊匹配关键词
- `offset`：从 0 开始（知识网络接口特殊规则）
- `limit`：每页数量，建议 10-50

#### 按 ID 精确查询
```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks/{id}
Authorization: {DATA_QUALITY_AUTH_TOKEN}
X-Business-Domain: bd_public
```

### 2. 对象类查询传参

#### 按名称模糊匹配
```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types?name_pattern={关键词}&offset=0&limit=5
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**参数说明**：
- `name_pattern`：对象类名称或ID的模糊匹配关键词
- `offset`：从 0 开始（知识网络接口特殊规则）
- `limit`：每页数量，默认 5

#### 按 ID 精确查询
```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types/{object_id}
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

### 3. 逻辑视图查询传参

#### 按名称模糊匹配
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?keyword={关键词}&limit=10&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**参数说明**：
- `keyword`：视图名称的模糊匹配关键词
- `offset`：从 1 开始（标准接口规则）
- `limit`：每页数量，默认 10

#### 按统一视图 ID 查询
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?mdl_id={统一视图ID}&limit=10&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**说明**：对象类的 `data_source.id` 对应 `mdl_id` 参数

#### 按数据源 ID 查询
```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?datasource_id={数据源ID}&limit=10&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

### 4. 质量报告查询传参

```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view/explore-report?id={view_id}&third_party=false
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**参数说明**：
- `id`：逻辑视图 ID（必填）
- `third_party`：固定值 `false`，表示系统生成的报告
- `version`：报告版本号（可选）

### 5. 工单创建传参

```http
POST {DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "name": "知识网络质量检测_{时间戳}",
  "type": "data_quality_audit",
  "source_type": "standalone",
  "responsible_uid": "用户ID",
  "draft": false,
  "remark": "{\"datasource_infos\":[{\"datasource_id\":\"数据源ID\",\"datasource_name\":\"数据源名称\",\"datasource_type\":\"数据源类型\",\"form_view_ids\":[\"视图ID\"]}]}"
}
```

**参数说明**：
- `name`：工单名称，建议包含时间戳
- `type`：固定值 `data_quality_audit`
- `source_type`：固定值 `standalone`
- `responsible_uid`：从用户信息接口获取的用户 ID
- `draft`：固定值 `false`
- `remark`：JSON 格式的数据源和视图信息

### 6. 工单重名检查传参

```http
GET {DATA_QUALITY_BASE_URL}/api/task-center/v1/work-order/name-check?name={工单名称}&type=data_quality_audit
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

**参数说明**：
- `name`：工单名称
- `type`：必填，当前环境使用 `data_quality_audit`

### 7. 创建规则传参兼容说明

```http
POST {DATA_QUALITY_BASE_URL}/api/data-view/v1/explore-rule
Authorization: {DATA_QUALITY_AUTH_TOKEN}
Content-Type: application/json

{
  "form_view_id": "视图ID",
  "rule_name": "规则名称",
  "dimension": "completeness",
  "dimension_type": "custom",
  "rule_level": "field",
  "field_id": "字段ID",
  "rule_config": "{\"rule_expression\":{\"sql\":\"field_tech_name IS NOT NULL\"}}",
  "enable": true,
  "draft": false
}
```

**说明**：
- 当前环境优先使用 `rule_name`、`rule_level`
- `rule_config` 需要传 JSON 字符串，而不是对象
- 创建规则成功状态兼容 `200/201`
- 创建工单成功响应优先读取 `id`，并兼容 `work_order_id`

## 传参合理化策略

### 1. 模糊匹配策略

| 输入类型 | 推荐参数 | 示例 |
|---------|---------|------|
| 知识网络名称 | `name_pattern` | `name_pattern=数据质量` |
| 知识网络 ID | `name_pattern` | `name_pattern=d5tbjbvqqu64a7vl7pjg` |
| 对象类名称 | `name_pattern` | `name_pattern=逻辑视图` |
| 对象类 ID | `name_pattern` | `name_pattern=d5tcqbmop61d6d0kfa40` |
| 视图名称 | `keyword` | `keyword=客户主数据` |

### 2. 分页参数策略

**详细分页规则请参考：[分页参数使用规范](./pagination.md)**

| 接口类型 | `offset` 起始值 | 建议 `limit` 范围 |
|---------|----------------|-----------------|
| Knowledge Network | 0 | 10-50 |
| Data View | 1 | 10-20 |
| Task Center | 1 | 10-20 |

### 3. 错误处理策略

| 错误类型 | 处理方式 |
|---------|---------|
| URL 错误 | 检查基础路径和端点是否正确 |
| 认证失败 | 检查 Token 有效性和格式 |
| 参数错误 | 检查参数名称和值是否正确 |
| 404 错误 | 检查 ID 是否存在 |
| 500 错误 | 检查服务状态和请求参数 |

## 最佳实践

1. **URL 构建**：使用服务基础路径 + 端点的方式构建完整 URL
2. **参数校验**：在发起请求前校验所有必需参数
3. **错误处理**：实现完整的错误处理机制
4. **分页处理**：根据接口类型使用正确的 offset 起始值
5. **模糊匹配**：当用户提供名称或 ID 时，使用相应的模糊匹配参数
6. **环境变量**：使用环境变量存储 BASE_URL 和 Token
7. **日志记录**：记录 API 调用和响应情况

## 示例代码

### Python 示例

```python
import os
import requests
import urllib.parse

# 环境变量配置
BASE_URL = os.getenv('DATA_QUALITY_BASE_URL')
TOKEN = os.getenv('DATA_QUALITY_AUTH_TOKEN')

headers = {
    'Authorization': TOKEN,
    'X-Business-Domain': 'bd_public'
}

# 1. 按名称模糊查询知识网络
def search_knowledge_networks(keyword):
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"{BASE_URL}/api/ontology-manager/v1/knowledge-networks"
    params = {
        'name_pattern': encoded_keyword,
        'offset': 0,
        'limit': 50
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

# 2. 按名称模糊查询对象类
def search_object_types(kn_id, keyword):
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"{BASE_URL}/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types"
    params = {
        'name_pattern': encoded_keyword,
        'offset': 0,
        'limit': 5
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

# 3. 按名称模糊查询逻辑视图
def search_views(keyword):
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"{BASE_URL}/api/data-view/v1/form-view"
    params = {
        'keyword': encoded_keyword,
        'offset': 1,
        'limit': 10
    }
    headers_no_domain = {'Authorization': TOKEN}
    response = requests.get(url, headers=headers_no_domain, params=params)
    return response.json()

# 4. 查询质量报告
def get_quality_report(view_id):
    url = f"{BASE_URL}/api/data-view/v1/form-view/explore-report"
    params = {
        'id': view_id,
        'third_party': False
    }
    headers_no_domain = {'Authorization': TOKEN}
    response = requests.get(url, headers=headers_no_domain, params=params)
    return response.json()
```

### JavaScript 示例

```javascript
// 环境变量配置
const BASE_URL = process.env.DATA_QUALITY_BASE_URL;
const TOKEN = process.env.DATA_QUALITY_AUTH_TOKEN;

const headers = {
    'Authorization': TOKEN,
    'X-Business-Domain': 'bd_public'
};

// 1. 按名称模糊查询知识网络
async function searchKnowledgeNetworks(keyword) {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `${BASE_URL}/api/ontology-manager/v1/knowledge-networks`;
    const params = new URLSearchParams({
        'name_pattern': encodedKeyword,
        'offset': 0,
        'limit': 50
    });
    
    const response = await fetch(`${url}?${params}`, {
        headers: headers
    });
    return response.json();
}

// 2. 按名称模糊查询逻辑视图
async function searchViews(keyword) {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `${BASE_URL}/api/data-view/v1/form-view`;
    const params = new URLSearchParams({
        'keyword': encodedKeyword,
        'offset': 1,
        'limit': 10
    });
    
    const headersNoDomain = {'Authorization': TOKEN};
    const response = await fetch(`${url}?${params}`, {
        headers: headersNoDomain
    });
    return response.json();
}
```

## 总结

本指南确保了：

1. **URL 正确性**：提供了正确的 API 路径和常见错误修正
2. **传参合理化**：
   - 知识网络和对象类使用 `name_pattern` 进行模糊匹配
   - 逻辑视图使用 `keyword` 进行模糊匹配
   - 分页参数根据接口类型使用正确的起始值
3. **错误处理**：提供了常见错误类型和处理方式
4. **最佳实践**：包含了 API 调用的最佳实践和示例代码

通过遵循本指南，可以确保 API 调用的正确性和高效性，避免常见的 URL 和传参错误。