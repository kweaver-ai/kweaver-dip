# 目录功能
**版本**: last

## 服务器信息
- **URL**: `{DATA_QUALITY_BASE_URL}/api/standardization`
- **协议**: HTTPS

## 认证信息
- **Header**: `Authorization: {DATA_QUALITY_AUTH_TOKEN}`

## 标签说明
- **标准管理-目录功能**: 标准管理-目录功能

## 接口详情

### 标准管理

#### GET /v1/catalog/{id}
**摘要**: 通过id查看目录单例属性
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| id | path | string | 是 |  |

##### 请求体

##### 响应
**200 successful operation**
- Content-Type: */*
  - 类型: ResponseGetv1catalogid200_3

---

#### GET /v1/rule/{id}
**摘要**: 编码规则_详情查看
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `{DATA_QUALITY_AUTH_TOKEN}` |
| id | path | string | 是 | 唯一标识 |

##### 请求体

##### 响应
**200 successful operation**
- Content-Type: */*
  - 类型: ResponseGetv1ruleid200_11

---

#### GET /v1/dataelement/detail
**摘要**: 查看数据元详情
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| type | query | string | 是 | 类型：1是id匹配、2是code匹配 |
| value | query | string | 是 | 值,根据类型传递id值或code值 |

##### 请求体

##### 响应
**200 successful operation**
- Content-Type: */*
  - 类型: ResponseGetv1dataelementdetail200_7

---

#### GET /v1/dataelement/dict/{id}
**摘要**: 码表详情查询_根据唯一标识id
##### 请求参数
| 参数名 | 位置 | 类型 | 必填 | 描述 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | token |
| id | path | string | 是 | 主键ID |

##### 请求体

##### 响应
**200 successful operation**
- Content-Type: */*
  - 类型: ResponseGetv1dataelementdictid200_3

---


## 数据模型

### ResponseGetv1catalogid200_3Detail
**描述**: 触发原因
错误细节
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|

### ResponseGetv1catalogid200_3DataChildrenItemChildrenItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|

### ResponseGetv1catalogid200_3DataChildrenItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | integer | 否 | 目录唯一标识
唯一标识 |
| catalogName | string | 是 | 目录名称 |
| description | string | 否 | 目录说明 |
| level | number | 是 | 目录级别 |
| parentId | integer | 是 | 父级标识 |
| type | string | 是 | 目录类型
目录类型
1-数据元，2-码表，3-编码规则，4-文件 |
| authorityId | string | 否 | 权限域（目前为预留字段） |
| children | Array[ResponseGetv1catalogid200_3DataChildrenItemChildrenItem] | 否 |  |

### ResponseGetv1catalogid200_3Data
**描述**: 返回数据对象
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | integer | 否 | 目录唯一标识
唯一标识 |
| catalogName | string | 是 | 目录名称 |
| description | string | 否 | 目录说明 |
| level | number | 是 | 目录级别 |
| parentId | integer | 是 | 父级标识 |
| type | string | 是 | 目录类型
目录类型
1-数据元，2-码表，3-编码规则，4-文件 |
| authorityId | string | 否 | 权限域（目前为预留字段） |
| children | Array[ResponseGetv1catalogid200_3DataChildrenItem] | 否 |  |

### ResponseGetv1catalogid200_3
**描述**: 目录单例属性
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| code | string | 否 | 返回代码 |
| description | string | 否 | 返回消息 |
| totalCount | integer | 否 | 返回消息
总条数，默认20 |
| detail | ResponseGetv1catalogid200_3Detail | 否 |  |
| solution | string | 否 | 解决对策 |
| data | ResponseGetv1catalogid200_3Data | 否 |  |

### ResponseGetv1ruleid200_11Detail
**描述**: 触发原因
错误细节
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|

### ResponseGetv1ruleid200_11DataCustomItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| segment_length | integer | 是 | 分段长度 |
| name | string | 否 | 名称 |
| type | string | 是 | 自定义规则类型：1-码表 2-数字 3-英文字母 4-汉字 5-任意字符 6-日期 7-分割字符串 |
| value | string | 是 | 值 |

### ResponseGetv1ruleid200_11Data
**描述**: 返回数据对象
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| catalogId | integer | 否 | 所属目录ID,默认全部目录ID为33 |
| name | string | 是 | 规则名称 |
| orgType | string | 是 | 规则来源
标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准 |
| ruleType | string | 是 | 规则类型:REGEX-正则表达式 CUSTOM-自定义配置 |
| regex | string | 否 | 规则详情
规则说明,rule_type为REGEX时该字段必填 |
| custom | Array[ResponseGetv1ruleid200_11DataCustomItem] | 否 |  |
| description | string | 否 | 备注
描述 |
| stdFiles | Array[integer] | 否 | 校验集合长度
标准文件ID数组，最多10个 |
| state | string | 否 | 启用停用：enable-启用，disable-停用 |
| departmentIds | string | 否 | 部门ID |
| id | integer | 否 | 主键 |
| version | integer | 否 | 版本号，规则：1、2逐渐递增。
版本号 |
| catalogName | string | 否 | 所属目录名称 |
| fullCatalogName | string | 否 | 目录全路径名称 |
| disableReason | string | 否 | 停用原因 |
| deleted | boolean | 否 | 是否删除：true-已删除，false-未删除 |
| createTime | string | 否 | 创建时间 |
| createUser | string | 否 | 创建用户 |
| updateTime | string | 否 | 更新时间 |
| updateUser | string | 否 | 修改用户 |
| usedFlag | boolean | 否 | 是否被引用,true-已被数据元引用 false-未被引用 |
| departmentId | string | 否 | 部门ID |
| departmentName | string | 否 | 部门名称 |
| departmentPathNames | string | 否 | 部门路径名称 |

### ResponseGetv1ruleid200_11
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| code | string | 否 | 返回代码 |
| description | string | 否 | 返回消息 |
| totalCount | integer | 否 | 返回消息
总条数，默认20 |
| detail | ResponseGetv1ruleid200_11Detail | 否 |  |
| solution | string | 否 | 解决对策 |
| data | ResponseGetv1ruleid200_11Data | 否 |  |

### ResponseGetv1dataelementdetail200_7Detail
**描述**: 触发原因
错误细节
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|

### ResponseGetv1dataelementdetail200_7DataStdfilesItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| fileId | integer | 否 | 主键
数据元标准文件ID |
| fileName | string | 否 | 文件名称 |
| name | string | 否 | 文件元数据名称 |
| isUrl | boolean | 否 | 文件类型 |
| fileState | string | 否 | 文件启停状态
文件启用和停用状态 |
| fileDeleted | boolean | 否 | 文件删除状态
文件删除状态，0未删除 |

### ResponseGetv1dataelementdetail200_7DataHistoryvolistItemUpdatecontentKeyItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|

### ResponseGetv1dataelementdetail200_7DataHistoryvolistItemUpdatecontent
**描述**: 更新内容
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| key | Array[ResponseGetv1dataelementdetail200_7DataHistoryvolistItemUpdatecontentKeyItem] | 否 |  |

### ResponseGetv1dataelementdetail200_7DataHistoryvolistItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| updateUser | string | 否 | 更新用户 |
| updateTime | string | 否 | 更新时间 |
| versionOut | string | 否 | 版本号 |
| updateContent | ResponseGetv1dataelementdetail200_7DataHistoryvolistItemUpdatecontent | 否 |  |

### ResponseGetv1dataelementdetail200_7Data
**描述**: 返回数据对象
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| state | string | 否 | 启用停用：enable-启用，disable-停用 |
| disableReason | string | 否 | 停用理由 |
| version | integer | 否 | 版本号 |
| createTime | string | 否 | 创建时间 |
| updateTime | string | 否 | 修改时间 |
| id | integer | 否 | 唯一标识、雪花算法
唯一标识 |
| code | integer | 否 | 关联标识、雪花算法 |
| nameEn | string | 是 | 英文名称 |
| nameCn | string | 是 | 中文名称 |
| synonym | string | 否 | 同义词 |
| stdType | string | 是 | 标准分类
标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准 |
| dataType | string | 是 | 数据类型
数据类型,0数字型、1字符型、2日期型、3日期时间型、5布尔型、7高精度型、8小数型、9时间型、10整数型 |
| dataLength | integer | 否 | 数据长度
数据长度,高精度型和字符型才有数据长度 |
| dataPrecision | integer | 否 | 数据精度
数据精度,高精度型才有数据精度 |
| dictCode | integer | 否 | 码表关联标识
码表关联标识，relation_type为codeTable时该字段必填 |
| description | string | 否 | 数据元说明 |
| catalogId | integer | 否 | 目录关联标识
目录ID，默认全部目录ID为11 |
| ruleId | integer | 否 | 编码规则唯一标识
编码规则唯一标识，relation_type为codeRule时该字段必填 |
| labelId | integer | 否 | 数据分级标签ID
数据分级标签 |
| relationType | string | 是 | 数据元关联类型no无限制、codeTable码表、codeRule编码规则;默认no无限制 |
| empty_flag | integer | 否 | 是否为空值标记，1是、0否，默认否 |
| departmentIds | string | 否 | 部门IDs |
| thirdDeptId | string | 否 | 第三方部门ID |
| stdFiles | Array[ResponseGetv1dataelementdetail200_7DataStdfilesItem] | 否 |  |
| historyVoList | Array[ResponseGetv1dataelementdetail200_7DataHistoryvolistItem] | 否 |  |
| dict_name_cn | string | 否 | 码表中文名称 |
| dict_name_en | string | 否 | 码表英文名称 |
| dictId | integer | 否 | 码表id |
| dict_state | string | 否 | 码表启停状态 |
| dict_deleted | boolean | 否 | 码表删除状态 |
| ruleName | string | 否 | 编码规则中文名称 |
| rule_state | string | 否 | 编码规则启停状态 |
| rule_deleted | boolean | 否 | 编码规则删除状态 |
| catalogName | string | 否 | 目录名称 |
| versionOut | string | 否 | 版本号 |
| dataRange | string | 否 | 值域 |
| dataTypeName | string | 否 | 数据类型名称 |
| stdTypeName | string | 否 | 标准分类名称 |
| labelName | string | 否 | 标签名称 |
| labelIcon | string | 否 | 标签icon |
| labelPath | string | 否 | 标签path |
| departmentId | string | 否 | 部门ID |
| departmentName | string | 否 | 部门名称 |
| departmentPathNames | string | 否 | 部门路径名称 |

### ResponseGetv1dataelementdetail200_7
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| code | string | 否 | 返回代码 |
| description | string | 否 | 返回消息 |
| totalCount | integer | 否 | 返回消息
总条数，默认20 |
| detail | ResponseGetv1dataelementdetail200_7Detail | 否 |  |
| solution | string | 否 | 解决对策 |
| data | ResponseGetv1dataelementdetail200_7Data | 否 |  |

### ResponseGetv1dataelementdictid200_3Detail
**描述**: 触发原因
错误细节
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|

### ResponseGetv1dataelementdictid200_3DataEnumsItem
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | integer | 否 | 唯一标识 |
| code | string | 是 | 码表编码，同一码表不同状态或版本编码相同。
码值 |
| value | string | 是 | 码表描述
码值描述 |
| description | string | 否 | 码表描述
码值说明 |
| dictId | integer | 否 | 字典ID
码表id |

### ResponseGetv1dataelementdictid200_3Data
**描述**: 返回数据对象
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | integer | 否 | 唯一标识 |
| code | integer | 否 | 码值 |
| chName | string | 是 | 码表中文名称
中文名称 |
| enName | string | 是 | 码表英文名称
英文名称 |
| description | string | 否 | 业务含义
说明 |
| catalogId | integer | 否 | 所属目录id
目录ID，默认全部目录ID为22 |
| orgType | string | 是 | 所属组织类型
标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准 |
| stdFiles | Array[integer] | 否 | 标准文件关联标识
标准文件id数组，最多10个 |
| enums | Array[ResponseGetv1dataelementdictid200_3DataEnumsItem] | 是 |  |
| state | string | 否 | 启用停用：enable-启用，disable-停用 |
| departmentIds | string | 否 | 部门ID |
| version | integer | 否 | 版本号，规则：1、2逐渐递增。
版本号 |
| catalogName | string | 否 | 所属目录id
目录名称 |
| disableReason | string | 否 | 停用原因 |
| deleted | boolean | 否 | 是否删除：true-已删除 false-未删除 |
| usedFlag | boolean | 否 | 是否被引用,true-已被数据元引用 false-未被引用 |
| createTime | string | 否 | 创建时间 |
| createUser | string | 否 | 创建用户 |
| updateTime | string | 否 | 更新时间 |
| updateUser | string | 否 | 修改用户 |
| departmentId | string | 否 | 部门ID |
| departmentName | string | 否 | 部门名称 |
| departmentPathNames | string | 否 | 部门路径名称 |

### ResponseGetv1dataelementdictid200_3
#### 属性
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| code | string | 否 | 返回代码 |
| description | string | 否 | 返回消息 |
| totalCount | integer | 否 | 返回消息
总条数，默认20 |
| detail | ResponseGetv1dataelementdictid200_3Detail | 否 |  |
| solution | string | 否 | 解决对策 |
| data | ResponseGetv1dataelementdictid200_3Data | 否 |  |

---

## 使用示例

### 1. 查看目录单例属性示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/standardization/v1/catalog/11
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/standardization/v1/catalog/11" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "code": "success",
  "description": "操作成功",
  "data": {
    "id": 11,
    "catalogName": "数据元目录",
    "description": "数据元标准目录",
    "level": 1,
    "parentId": 0,
    "type": "1",
    "children": [
      {
        "id": 12,
        "catalogName": "客户信息",
        "level": 2,
        "parentId": 11,
        "type": "1"
      }
    ]
  }
}
```

---

### 2. 查看编码规则详情示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/standardization/v1/rule/1001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/standardization/v1/rule/1001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "code": "success",
  "description": "操作成功",
  "data": {
    "id": 1001,
    "name": "手机号编码规则",
    "ruleType": "REGEX",
    "regex": "^1[3-9]\\d{9}$",
    "orgType": "4",
    "state": "enable",
    "catalogId": 33,
    "catalogName": "编码规则目录",
    "version": 1,
    "createTime": "2024-01-01T00:00:00Z",
    "updateTime": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 查看数据元详情示例（通过ID匹配）

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/standardization/v1/dataelement/detail?type=1&value=10001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/standardization/v1/dataelement/detail?type=1&value=10001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "code": "success",
  "description": "操作成功",
  "data": {
    "id": 10001,
    "code": 10001,
    "nameEn": "mobile_phone",
    "nameCn": "手机号码",
    "stdType": "4",
    "dataType": "1",
    "dataLength": 11,
    "relationType": "no",
    "state": "enable",
    "catalogId": 11,
    "catalogName": "数据元目录",
    "version": 1,
    "createTime": "2024-01-01T00:00:00Z",
    "updateTime": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. 查看码表详情示例

#### 请求示例
```http
GET {DATA_QUALITY_BASE_URL}/api/standardization/v1/dataelement/dict/2001
Authorization: {DATA_QUALITY_AUTH_TOKEN}
```

#### cURL示例
```bash
curl -X GET "{DATA_QUALITY_BASE_URL}/api/standardization/v1/dataelement/dict/2001" \
  -H "Authorization: {DATA_QUALITY_AUTH_TOKEN}"
```

#### 响应示例
```json
{
  "code": "success",
  "description": "操作成功",
  "data": {
    "id": 2001,
    "code": 2001,
    "chName": "性别",
    "enName": "gender",
    "orgType": "4",
    "state": "enable",
    "enums": [
      {
        "id": 1,
        "code": "0",
        "value": "未知",
        "description": "性别未知",
        "dictId": 2001
      },
      {
        "id": 2,
        "code": "1",
        "value": "男",
        "description": "男性",
        "dictId": 2001
      },
      {
        "id": 3,
        "code": "2",
        "value": "女",
        "description": "女性",
        "dictId": 2001
      }
    ],
    "catalogId": 22,
    "catalogName": "码表目录",
    "version": 1,
    "createTime": "2024-01-01T00:00:00Z",
    "updateTime": "2024-01-01T00:00:00Z"
  }
}
```
