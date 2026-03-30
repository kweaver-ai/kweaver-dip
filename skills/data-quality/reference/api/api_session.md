# session
**版本**: 1.0
**描述**: session service

## 服务器信息
- **URL**: `{DATA_QUALITY_BASE_URL}/af/api/session/v1`
- **协议**: HTTPS

## 认证信息
- **Header**: `Authorization: {DATA_QUALITY_AUTH_TOKEN}`

## 接口详情

### 用户信息

#### GET /userinfo
**摘要**: 获取用户信息
**描述**: 获取当前登录用户的基本信息
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |

##### 请求体
无

##### 响应
**200 成功响应参数**
- Content-Type: application/json
  - 类型: UserInfoResp

**400 失败响应参数**
- Content-Type: application/json
  - 类型: rest.HttpError

**401 未授权**
- Content-Type: application/json
  - 类型: rest.HttpError

---

## 数据模型

### UserInfoResp
**描述**: 用户信息响应
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| ID | string | 是 | 用户ID(uuid) |

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

## 使用示例

### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/af/api/session/v1/userinfo
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

### 响应示例
```json
{
  "ID": "550e8400-e29b-41d4-a716-446655440000"
}
```

### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/af/api/session/v1/userinfo" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```
