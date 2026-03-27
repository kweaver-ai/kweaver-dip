# 数据语义服务 API 参考

**⚠️ 认证必填**: 所有 API 调用必须在 Header 中携带有效的 JWT Token，否则返回 401 未授权错误

---

## 逻辑视图服务 API

Base URL: 在 config.logic_view_base_url 中配置（默认 `https://dip.aishu.cn/api/data-view/v1`）

### 查询逻辑视图列表

```
GET /form-view
```

**参数:**
- `keyword`: 关键字搜索（可选，按业务名称或技术名称模糊匹配）
- `datasource_id`: 数据源 ID 筛选（可选）
- `limit`: 每页大小，默认 100（可选）
- `offset`: 页码，默认 1（可选）

**响应:**
```json
{
  "entries": [
    {
      "id": "xxx-xxx",
      "business_name": "用户管理",
      "technical_name": "user_info_v1",
      "subject_domain_id": "domain_xxx",
      "subject_id_path": "/path/to/entity",
      "subject_path": "数据域/用户域"
    }
  ],
  "total_count": 100
}
```

---

## 数据语义服务 API

Base URL: 在 config.base_url 中配置（默认 `https://dip.aishu.cn/api/data-semantic/v1`）

### 状态码

| 状态码 | 名称 | 说明 |
|--------|------|------|
| 0 | 未理解 | 尚未进行语义理解 |
| 1 | 理解中 | 语义理解进行中 |
| 2 | 待确认 | 理解完成待确认 |
| 3 | 已完成 | 已确认完成 |
| 4 | 待确认(已重新理解) | 重新理解后待确认 |
| 5 | 理解失败 | 语义理解失败 |

---

### 1. 查询状态

```
GET /:id/status
```

**响应:**
```json
{
  "understand_status": 3,
  "tech_name": "mdl_xxx",
  "biz_name": "客户管理视图",
  "description": "用于管理客户信息",
  "understand_time": "2024-01-15 10:30:00"
}
```

---

### 2. 触发生成

```
POST /:id/generate
```

**请求体 (可选):**
```json
{
  "fields": ["field1", "field2"]
}
```

**响应:**
```json
{
  "understand_status": 1
}
```

---

### 3. 提交确认

```
POST /:id/submit
```

**响应:**
```json
{
  "success": true
}
```

---

### 4. 查询字段语义

```
GET /:id/fields
```

**响应:**
```json
{
  "form_view_id": "xxx",
  "fields": [
    {
      "field_id": "f1",
      "tech_name": "customer_name",
      "biz_name": "客户名称",
      "field_role": 1,
      "field_desc": "客户姓名",
      "completion_status": 1
    }
  ]
}
```

---

### 5. 查询业务对象

```
GET /:id/business-objects
```

**响应:**
```json
{
  "form_view_id": "xxx",
  "business_objects": [
    {
      "object_id": "o1",
      "object_name": "客户信息",
      "attributes": [
        {
          "attr_id": "a1",
          "attr_name": "客户姓名",
          "tech_name": "customer_name",
          "biz_name": "客户名称",
          "field_role": 1,
          "field_desc": "客户姓名"
        }
      ]
    }
  ]
}
```

---

### 6. 批量对象匹配

```
POST /batch-object-match
```

**请求体:**
```json
{
  "entries": [
    {
      "name": "客户信息",
      "data_source": {
        "id": "view_123",
        "name": "客户视图"
      }
    }
  ],
  "kn_id": "$KNID",
  "ot_id": "$OTID"
}
```

**⚠️ 中文编码注意**: 包含中文时使用管道方式:
```bash
echo '{"entries":[{"name":"订单"}]}' | curl -d @- -H "Authorization: Bearer $TOKEN"
```

**响应:**
```json
{
  "entries": [
    {
      "name": "客户信息",
      "data_source": [
        {
          "id": "mdl_customer",
          "name": "客户主档视图",
          "object_name": "客户信息"
        }
      ]
    }
  ],
  "need_understand": ["mdl_customer"]
}
```

---

## 状态机流程图

```
┌─────────┐ generate ┌─────────┐ status=2 ┌─────────┐
│ 0-未理解│ ─────────►│ 1-理解中│ ─────────►│ 2-待确认│
└─────────┘          └─────────┘           └────┬────┘
                                                │
                              submit            │
                                                ▼
┌─────────┐ generate ┌─────────┐          ┌──────────┐
│ 3-已完成│ ◄────────│4-待确认  │          │ 理解失败 │
└─────────┘          └─────────┘          └──────────┘
```
