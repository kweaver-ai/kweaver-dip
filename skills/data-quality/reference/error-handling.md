# 错误处理完整指南

> **说明**: 本文档提供数据质量技能的完整错误处理规范。

## HTTP 状态码

| 状态码 | 含义 | 处理策略 |
|--------|------|----------|
| 200 | 成功 | 正常处理 |
| 201 | 创建成功 | 正常处理 |
| 400 | 请求参数错误 | 检查参数格式、必填项、枚举值 |
| 401 | 未授权 | Token 无效或过期，提示检查认证配置 |
| 403 | 禁止访问 | Token 权限不足，提示联系管理员 |
| 404 | 资源不存在 | 检查 ID 是否正确 |
| 408 | 请求超时 | 重试一次，间隔 5 秒 |
| 429 | 请求过于频繁 | 退避 30 秒后重试 |
| 500 | 服务器内部错误 | 记录日志，提示用户稍后重试 |
| 503 | 服务不可用 | 检查服务状态，稍后重试 |

## 业务错误码

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| `DataView.Driven.DataExplorationGetReportError` | 探查报告不存在 | 按"暂无质量报告"处理，继续进入检测确认步骤 |
| `DataView.Rule.DuplicateName` | 规则名称重复 | 提示用户更换名称，使用 name-check 接口预检查 |
| `DataView.Rule.InvalidConfig` | 规则配置无效 | 检查 SQL 语法或正则表达式是否符合规范 |
| `DataView.Rule.LevelMismatch` | 级别与维度不匹配 | 参照约束矩阵调整规则级别或维度 |
| `DataView.Rule.FieldNotFound` | 字段不存在 | 检查 field_id 是否正确 |
| `DataView.Rule.ViewNotFound` | 视图不存在 | 检查 form_view_id 是否正确 |
| `TaskCenter.WorkOrder.DuplicateName` | 工单名称重复 | 提示用户更换名称，使用 name-check 预检查 |
| `TaskCenter.WorkOrder.InvalidStatus` | 工单状态无效 | 检查工单当前状态 |
| `TaskCenter.WorkOrder.NotFound` | 工单不存在 | 检查工单 ID 是否正确 |
| `Ontology.KnowledgeNetwork.NotFound` | 知识网络不存在 | 检查知识网络 ID 或名称是否正确 |
| `Ontology.ObjectType.NotFound` | 对象类不存在 | 检查对象类 ID 或名称是否正确 |

## 超时与重试策略

| API 类型 | 超时时间 | 最大重试 | 退避策略 |
|----------|----------|----------|----------|
| 查询类 GET | 30s | 2 | 指数退避 (5s, 15s) |
| 创建类 POST | 60s | 3 | 指数退避 (5s, 15s, 45s) |
| 更新类 PUT | 60s | 2 | 指数退避 (5s, 15s) |
| 删除类 DELETE | 30s | 2 | 指数退避 (5s, 15s) |

### 重试伪代码

```python
import time

def call_with_retry(api_func, max_retries=3, base_delay=5):
    """带退避的重试机制"""
    for attempt in range(max_retries):
        try:
            response = api_func()
            return response
        except TimeoutError:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)  # 指数退避
                time.sleep(delay)
            else:
                raise
```

## 批量操作部分失败处理

| 场景 | 处理策略 | 用户反馈 |
|------|----------|----------|
| 批量创建规则部分失败 | 记录成功项，继续处理失败项 | "X 条规则创建成功，Y 条失败：{失败详情}" |
| 批量启用规则部分失败 | 记录成功项，继续处理失败项 | "X 条规则启用成功，Y 条失败：{失败详情}" |
| 全部成功 | 正常完成 | "成功创建 X 条规则" |
| 全部失败 | 终止流程，报告错误 | "所有规则操作失败，请检查参数：{错误详情}" |

### 批量操作示例

```
场景: 批量创建 5 条规则，其中 2 条失败

处理结果:
✅ 规则1: customer_name非空检查 - 创建成功
✅ 规则2: customer_id唯一性检查 - 创建成功
❌ 规则3: email格式检查 - 失败 (SQL语法错误)
❌ 规则4: phone格式检查 - 失败 (正则表达式无效)
✅ 规则5: order_date完整性检查 - 创建成功

用户反馈:
"批量创建规则完成：3 条成功，2 条失败

失败详情:
- email格式检查: SQL表达式语法错误，请检查 LENGTH() 函数用法
- phone格式检查: 正则表达式 ^1[3-9]\d{9}$ 无效

是否需要修正后重试?"
```

## 异常恢复指南

| 异常场景 | 检测方法 | 恢复步骤 |
|----------|----------|----------|
| 网络中断 | 请求超时/连接失败 | 1. 等待网络恢复 2. 重试最后操作 3. 验证结果 |
| 服务重启 | 503/504 响应 | 1. 等待 30 秒 2. 重新认证 3. 重试操作 |
| 数据不一致 | 规则列表与预期不符 | 1. 重新查询列表 2. 核对已操作项 3. 补齐遗漏项 |
| Token 过期 | 401 响应 | 1. 提示用户刷新 Token 2. 重新认证 3. 重试操作 |
| 规则创建超时 | 创建请求超时 | 1. 查询规则列表确认是否创建成功 2. 如未创建则重试 |

## 规则创建错误处理

| 错误类型 | 可能原因 | 检查项 |
|----------|----------|--------|
| 400 + InvalidConfig | rule_config 格式错误 | JSON 格式、SQL 语法、正则表达式 |
| 400 + LevelMismatch | 级别与维度不匹配 | 视图级只能用 completeness |
| 400 + DuplicateName | 规则名称重复 | 使用 repeat-check 接口预检查 |
| 400 + FieldRequired | 缺少必填字段 | 检查 field_id、rule_level 等 |
| 401 | Token 无效 | 重新获取 Token |

## 工单创建错误处理

| 错误类型 | 可能原因 | 检查项 |
|----------|----------|--------|
| 400 + InvalidRemark | remark 格式错误 | JSON 格式、UUID 有效性 |
| 400 + DuplicateName | 工单名称重复 | 使用 name-check 预检查 |
| 400 + InvalidDatasource | 数据源信息无效 | 检查 datasource_id 是否正确 |
| 401 | Token 无效 | 重新获取 Token |
| 403 | 权限不足 | 检查 responsible_uid 是否有权限 |

## 探查报告错误处理

| 场景 | 响应 | 处理方式 |
|------|------|----------|
| 报告存在 | 正常返回报告数据 | 展示报告 |
| 报告不存在 | 404 + DataExplorationGetReportError | 按"暂无质量报告"处理，继续进入检测确认 |
| 视图已删除 | 404 + ViewNotFound | 跳过该视图，提示用户 |
| 权限不足 | 403 | 提示用户检查权限 |

## 错误消息模板

### 用户友好错误消息

| 错误场景 | 错误消息模板 |
|----------|--------------|
| 配置缺失 | "缺少必需的环境变量配置：{变量名}。请检查 .env 文件或环境变量设置。" |
| Token 无效 | "认证失败，请检查 DATA_QUALITY_AUTH_TOKEN 是否正确。" |
| 规则名称重复 | "规则名称「{规则名}」已存在，请使用其他名称。" |
| 规则配置无效 | "规则配置无效：{错误详情}。请检查 SQL 表达式或正则表达式格式。" |
| 级别维度不匹配 | "规则级别与维度不匹配：{规则级别}规则不支持{dim}维度。请参考约束矩阵调整。" |
| 工单名称重复 | "工单名称「{工单名}」已存在，请使用其他名称。" |
| 数据源无效 | "数据源信息无效：找不到指定的数据源。请检查 datasource_id 是否正确。" |
| 网络错误 | "网络请求失败：{错误详情}。请检查网络连接后重试。" |
| 服务不可用 | "服务暂时不可用（503），请稍后重试。" |

### 错误消息格式化示例

```python
def format_error_message(error_type, details=None):
    templates = {
        "CONFIG_MISSING": "缺少必需的环境变量配置：{}。请检查 .env 文件或环境变量设置。",
        "TOKEN_INVALID": "认证失败，请检查 DATA_QUALITY_AUTH_TOKEN 是否正确。",
        "RULE_DUPLICATE": "规则名称「{}」已存在，请使用其他名称。",
        "RULE_CONFIG_INVALID": "规则配置无效：{}。请检查 SQL 表达式或正则表达式格式。",
        "LEVEL_MISMATCH": "规则级别与维度不匹配：{}规则不支持{}维度。",
        "WORK_ORDER_DUPLICATE": "工单名称「{}」已存在，请使用其他名称。",
        "DATASOURCE_INVALID": "数据源信息无效：找不到指定的数据源。请检查 datasource_id 是否正确。",
        "NETWORK_ERROR": "网络请求失败：{}。请检查网络连接后重试。",
        "SERVICE_UNAVAILABLE": "服务暂时不可用（{}），请稍后重试。",
    }

    if error_type in templates:
        if details:
            return templates[error_type].format(details)
        return templates[error_type]
    return f"未知错误：{error_type}"
```

## 错误日志规范

| 字段 | 说明 | 示例 |
|------|------|------|
| timestamp | 错误发生时间 | 2024-01-15T14:30:25Z |
| error_type | 错误类型 | NETWORK_ERROR, API_ERROR |
| api_endpoint | API 端点 | /api/data-view/v1/explore-rule |
| request_params | 请求参数 | (不含敏感信息) |
| response_code | HTTP 响应码 | 400 |
| error_message | 错误消息 | 规则配置无效 |
| stack_trace | 堆栈跟踪 | (调试用) |

## 错误处理检查清单

### API 调用前
- [ ] 验证环境变量配置完整
- [ ] 验证 Token 有效性
- [ ] 检查必填参数是否齐全
- [ ] 检查参数格式是否正确

### API 调用后
- [ ] 检查 HTTP 状态码
- [ ] 检查业务错误码
- [ ] 验证响应数据结构
- [ ] 处理超时和网络错误

### 批量操作
- [ ] 实现部分成功处理
- [ ] 记录成功和失败项
- [ ] 提供清晰的错误反馈
- [ ] 支持重试失败项
