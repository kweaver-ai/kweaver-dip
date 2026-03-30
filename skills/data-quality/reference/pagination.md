---
name: "data-quality-pagination"
description: "数据质量管理 API 分页参数使用规范。当使用列表查询接口时需要分页时使用。"
---

# 分页参数使用规范

## 概述

数据质量管理 API 的列表查询接口支持分页功能，通过 `limit` 和 `offset` 参数控制返回结果的数量和起始位置。

## 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | integer | 10 | 每页返回的记录数量 |
| `offset` | integer | 1 或 0 | 页码偏移量，**注意：不同接口起始值不同** |

## 接口特定的分页规则

### 1. 标准分页（offset 从 1 开始）

大多数 Data View 和 Task Center 接口使用此规则：

| 接口 | 端点 | offset 起始值 |
|------|------|---------------|
| 查询视图列表 | `GET /api/data-view/v1/form-view` | 1 |
| 查询规则列表 | `GET /api/data-view/v1/explore-rule` | 1 |
| 查询探查任务 | `GET /api/data-view/v1/explore-task` | 1 |
| 查询工单列表 | `GET /api/task-center/v1/work-order` | 1 |

### 2. 知识网络分页（offset 从 0 开始）

知识网络相关接口使用此规则：

| 接口 | 端点 | offset 起始值 |
|------|------|---------------|
| 查询知识网络 | `GET /api/ontology-manager/v1/knowledge-networks` | **0** |
| 查询对象类 | `GET /api/ontology-manager/v1/knowledge-networks/{id}/object-types` | **0** |

> ⚠️ **重要提示**：知识网络接口的 `offset` 从 **0** 开始，与其他接口（从 1 开始）不同！

## 使用示例

### 标准分页示例（offset 从 1 开始）

```http
GET {DATA_QUALITY_BASE_URL}/api/data-view/v1/form-view?limit=20&offset=1
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

### 知识网络分页示例（offset 从 0 开始）

```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks?offset=0&limit=50
Authorization: {DATA_QUALITY_AUTH_TOKEN}
X-Business-Domain: bd_public
```

### 查询对象类（offset 从 0 开始）

```http
GET {DATA_QUALITY_BASE_URL}/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types?offset=0&limit=5
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

## 响应格式

列表查询接口的标准响应格式：

```json
{
  "entries": [
    // 数据记录数组
  ],
  "total_count": 100  // 总记录数
}
```

## 分页计算

### 总页数计算

```python
total_pages = (total_count + limit - 1) // limit
```

### 获取所有数据（分页遍历）- 标准接口

```python
import requests

BASE_URL = "https://10.4.134.36"
TOKEN = "Bearer xxxxxx"
headers = {"Authorization": TOKEN}

def get_all_data(endpoint, params=None):
    """分页获取所有数据（标准接口，offset 从 1 开始）"""
    all_data = []
    offset = 1  # 标准接口从 1 开始
    limit = 100
    
    while True:
        if params is None:
            params = {}
        params['limit'] = limit
        params['offset'] = offset
        
        response = requests.get(
            f"{BASE_URL}{endpoint}",
            headers=headers,
            params=params
        )
        
        result = response.json()
        entries = result.get('entries', [])
        all_data.extend(entries)
        
        if len(entries) < limit:
            break
        
        offset += 1
    
    return all_data

# 使用示例
views = get_all_data('/api/data-view/v1/form-view')
print(f"总共获取 {len(views)} 条视图记录")
```

### 获取所有数据（分页遍历）- 知识网络接口

```python
import requests

BASE_URL = "https://10.4.134.36"
TOKEN = "Bearer xxxxxx"
headers = {
    "Authorization": TOKEN,
    "X-Business-Domain": "bd_public"
}

def get_all_knowledge_networks():
    """分页获取所有知识网络（offset 从 0 开始）"""
    all_data = []
    offset = 0  # 知识网络接口从 0 开始！
    limit = 50
    
    while True:
        response = requests.get(
            f"{BASE_URL}/api/ontology-manager/v1/knowledge-networks",
            headers=headers,
            params={'limit': limit, 'offset': offset}
        )
        
        result = response.json()
        entries = result.get('entries', [])
        all_data.extend(entries)
        
        if len(entries) < limit:
            break
        
        offset += 1
    
    return all_data

# 使用示例
knowledge_networks = get_all_knowledge_networks()
print(f"总共获取 {len(knowledge_networks)} 个知识网络")
```

## 最佳实践

1. **注意 offset 起始值**
   - Data View / Task Center 接口：offset 从 **1** 开始
   - Knowledge Network 接口：offset 从 **0** 开始

2. **合理设置 limit**
   - 建议范围：10-100
   - 过大的 limit 会增加响应时间和内存占用
   - 过小的 limit 会增加请求次数

3. **处理空结果**
   - 当 `entries` 为空数组时，表示没有更多数据
   - 当 `total_count` 为 0 时，表示没有符合条件的记录

4. **排序参数**
   - 部分接口支持 `sort` 和 `direction` 参数
   - `sort`: 排序字段（如 `created_at`, `updated_at`, `name`）
   - `direction`: 排序方向（`asc` 正序, `desc` 倒序）

## 注意事项

1. **offset 起始值差异**：
   - 标准接口（Data View / Task Center）：offset 从 **1** 开始
   - 知识网络接口（Knowledge Network）：offset 从 **0** 开始

2. **最大 limit**：不同接口可能有不同的最大 limit 限制，建议查看具体接口文档

3. **性能考虑**：对于大数据量查询，建议使用较小的 limit 值并分页获取
