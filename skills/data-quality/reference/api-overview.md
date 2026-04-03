---
name: "data-quality-api-overview"
description: "数据质量管理 API 概览和指南。当用户需要 API 参考或实现细节时使用。"
---

# API 概览

## 基础 URL

**详细API路径和使用指南请参考：[API 使用指南](./api-usage-guide.md)**

| 服务 | 基础路径 |
|------|----------|
| Data View | `{BASE_URL}/api/data-view/v1` |
| Task Center | `{BASE_URL}/api/task-center/v1` |
| Knowledge Network | `{BASE_URL}/api/ontology-manager/v1` |
| Session | `{BASE_URL}/api/eacp/v1` |
| Standardization | `{BASE_URL}/api/standardization/v1` |

## 认证

所有 API 都需要 Bearer Token 认证：

```http
Authorization: Bearer {token}
```

## 通用响应格式

### 成功响应
```json
{
  "data": {},
  "code": 200,
  "message": "success"
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误描述"
}
```

## 分页

**详细分页规则请参考：[分页参数使用规范](./pagination.md)**

列表端点支持分页：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | integer | 20 | 每页数量 |
| offset | integer | 1 或 0 | 页偏移量（不同接口起始值不同） |

## API 端点

### Data View API
- `GET /form-view` - 查询视图列表
- `GET /form-view/{id}/details` - 获取视图详情
- `POST /logic-view/field/multi` - 获取字段
- `GET /explore-rule` - 查询规则列表
- `POST /explore-rule` - 创建规则
- `PUT /explore-rule/{id}` - 更新规则
- `DELETE /explore-rule/{id}` - 删除规则
- `GET /form-view/explore-report` - 查询视图探查报告（质量报告）

### Task Center API
- `GET /v1/work-order` - 查询工单列表
- `GET /v1/work-order/{id}` - 获取工单
- `POST /v1/work-order` - 创建工单
- `PUT /v1/work-order/{id}` - 更新工单

### Knowledge Network API
- `GET /v1/knowledge-networks` - 查询知识网络列表
- `GET /v1/knowledge-networks/{id}/object-types` - 查询对象类列表

## 详细 API 文档

- [Data View API](./api/api_data_view.md)
- [Task Center API](./api/api_task_center.md)
- [Knowledge Network API](./api/api_knowledge_network.md)
- [Session API](./api/api_eacp.md)
- [Standardization API](./api/api_std.md)
