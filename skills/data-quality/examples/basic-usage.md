---
name: "data-quality-examples-basic"
description: "数据质量管理基础用法示例。当用户需要实用代码示例时使用。"
---

# 基础用法示例

## 示例 1: 查询视图和字段

```python
import requests

BASE_URL = "https://10.4.134.36"
TOKEN = "Bearer xxxxxx"
headers = {"Authorization": TOKEN}

# 1. 查询视图
response = requests.get(
    f"{BASE_URL}/api/data-view/v1/form-view?limit=10&offset=1",
    headers=headers
)
views = response.json()["entries"]

# 2. 获取第一个视图的字段
view_id = views[0]["id"]
response = requests.post(
    f"{BASE_URL}/api/data-view/v1/logic-view/field/multi",
    headers={**headers, "Content-Type": "application/json"},
    json={"ids": [view_id]}
)
fields = response.json()["logic_views"][0]["fields"]
```

## 示例 2: 创建完整性规则

```python
import json

# 创建检查字段是否为空的规则
rule_data = {
    "form_view_id": "视图UUID",
    "rule_name": "检查客户名不为空",
    "dimension": "completeness",
    "dimension_type": "custom",
    "rule_level": "field",
    "field_id": "字段UUID",
    "rule_config": json.dumps({
        "rule_expression": {
            "sql": "customer_name IS NOT NULL"
        }
    }),
    "enable": True,
    "draft": False
}

response = requests.post(
    f"{BASE_URL}/api/data-view/v1/explore-rule",
    headers={**headers, "Content-Type": "application/json"},
    json=rule_data
)
if response.status_code in (200, 201):
    rule_id = response.json()["rule_id"]
```

## 示例 3: 创建检测工单（完整流程）

```python
import json
import requests
from datetime import datetime

BASE_URL = "https://10.4.134.36"
TOKEN = "Bearer xxxxxx"
headers = {"Authorization": TOKEN}

# ========== 步骤 1: 获取用户信息（获取 responsible_uid） ==========
user_response = requests.get(
    f"{BASE_URL}/api/eacp/v1/user/get",
    headers=headers
)
responsible_uid = user_response.json()["userid"]
print(f"获取到用户 ID: {responsible_uid}")

# ========== 步骤 2: 准备工单参数 ==========
# 生成唯一工单名称（建议格式：{视图名}_{数据源}_{时间戳}）
work_order_name = f"客户主数据_生产库_{datetime.now().strftime('%Y%m%d%H%M%S')}"

# 构建 remark 参数（对指定视图创建工单）
remark_data = {
    "datasource_infos": [
        {
            "datasource_id": "550e8400-e29b-41d4-a716-446655440001",
            "datasource_name": "生产数据库",
            "datasource_type": "mysql",
            "form_view_ids": ["550e8400-e29b-41d4-a716-446655440002"]
        }
    ]
}

# ========== 步骤 3: 检查工单名称是否重复 ==========
check_response = requests.get(
    f"{BASE_URL}/api/task-center/v1/work-order/name-check",
    headers=headers,
    params={"name": work_order_name, "type": "data_quality_audit"}
)

# name-check 返回布尔值：当前文档约定 False 表示名称可用，True 表示已重名
name_duplicated = check_response.json() if check_response.status_code == 200 else True

if check_response.status_code != 200 or name_duplicated:
    print("工单名称已存在，请更换名称")
    exit()

# ========== 步骤 4: 创建工单 ==========
# 固定参数：
# - type: "data_quality_audit"
# - source_type: "standalone"
# - draft: False
# - responsible_uid: 从用户信息接口获取
work_order_data = {
    "name": work_order_name,
    "type": "data_quality_audit",        # 固定值
    "source_type": "standalone",          # 固定值
    "responsible_uid": responsible_uid,   # 从用户信息接口获取
    "draft": False,                       # 固定值
    "remark": json.dumps(remark_data)     # JSON 字符串
}

response = requests.post(
    f"{BASE_URL}/api/task-center/v1/work-order",
    headers={**headers, "Content-Type": "application/json"},
    json=work_order_data
)

# ========== 步骤 5: 处理响应 ==========
if response.status_code == 200:
    work_order_id = response.json().get("id") or response.json().get("work_order_id")
    print(f"工单创建成功: {work_order_id}")
else:
    print(f"工单创建失败: {response.text}")
```

## 示例 4: 创建检测工单（对数据源下所有视图）

```python
import json
import requests
from datetime import datetime

BASE_URL = "https://10.4.134.36"
TOKEN = "Bearer xxxxxx"
headers = {"Authorization": TOKEN}

# 获取用户信息
user_response = requests.get(
    f"{BASE_URL}/api/eacp/v1/user/get",
    headers=headers
)
responsible_uid = user_response.json()["userid"]

# 构建 remark（form_view_ids 为空数组，表示检测数据源下所有视图）
remark_data = {
    "datasource_infos": [
        {
            "datasource_id": "550e8400-e29b-41d4-a716-446655440001",
            "datasource_name": "生产数据库",
            "datasource_type": "mysql",
            "form_view_ids": []  # 空数组表示检测所有视图
        }
    ]
}

work_order_data = {
    "name": f"全量检测_生产库_{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "type": "data_quality_audit",
    "source_type": "standalone",
    "responsible_uid": responsible_uid,
    "draft": False,
    "remark": json.dumps(remark_data)
}

response = requests.post(
    f"{BASE_URL}/api/task-center/v1/work-order",
    headers={**headers, "Content-Type": "application/json"},
    json=work_order_data
)

if response.status_code == 200:
    work_order_id = response.json().get("id") or response.json().get("work_order_id")
    print(f"工单创建成功: {work_order_id}")
```

## 示例 5: 检查工单状态

```python
import time

def wait_for_completion(work_order_id, timeout=300):
    """等待工单完成"""
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        # 获取工单的探查任务
        response = requests.get(
            f"{BASE_URL}/api/data-view/v1/explore-task?work_order_id={work_order_id}",
            headers=headers
        )
        tasks = response.json()["entries"]
        
        # 检查是否还有运行中的任务
        active_tasks = [t for t in tasks if t["status"] in ["queuing", "running"]]
        
        if not active_tasks:
            return True
        
        time.sleep(5)
    
    return False

# 使用
completed = wait_for_completion(work_order_id)
print(f"工单完成: {completed}")
```

## 示例 6: 批量创建规则

```python
import json

def create_rules_for_view(view_id, fields):
    """为所有非空字段创建完整性规则"""
    created_rules = []
    
    for field in fields:
        if field.get("is_nullable") == "NO":
            rule_data = {
                "form_view_id": view_id,
                "rule_name": f"{field['business_name']}_非空",
                "dimension": "completeness",
                "dimension_type": "custom",
                "rule_level": "field",
                "field_id": field["id"],
                "rule_config": json.dumps({
                    "rule_expression": {
                        "sql": f"{field['technical_name']} IS NOT NULL"
                    }
                }),
                "enable": True,
                "draft": False
            }
            
            response = requests.post(
                f"{BASE_URL}/api/data-view/v1/explore-rule",
                headers={**headers, "Content-Type": "application/json"},
                json=rule_data
            )
            
            if response.status_code in (200, 201):
                created_rules.append(response.json()["rule_id"])
    
    return created_rules

# 使用
rules = create_rules_for_view(view_id, fields)
print(f"创建了 {len(rules)} 条规则")
```

## 示例 7: 创建规范性格式检查规则

```python
import json

# 创建手机号格式检查规则
rule_data = {
    "form_view_id": "视图UUID",
    "rule_name": "手机号格式检查",
    "dimension": "standardization",
    "dimension_type": "format",
    "rule_level": "field",
    "field_id": "phone字段UUID",
    "rule_config": json.dumps({
        "format": {
            "regex": "^1[3-9]\\d{9}$"
        }
    }),
    "enable": True,
    "draft": False
}

response = requests.post(
    f"{BASE_URL}/api/data-view/v1/explore-rule",
    headers={**headers, "Content-Type": "application/json"},
    json=rule_data
)

if response.status_code in (200, 201):
    rule_id = response.json()["rule_id"]
    print(f"规则创建成功: {rule_id}")
```

## 示例 8: 创建视图级完整性规则

```python
import json

# 创建视图级完整性规则（检查多个字段）
rule_data = {
    "form_view_id": "视图UUID",
    "rule_name": "客户信息完整性检查",
    "dimension": "completeness",
    "dimension_type": "custom",
    "rule_level": "view",  # 视图级
    "rule_config": json.dumps({
        "rule_expression": {
            "sql": "customer_id IS NOT NULL AND customer_name IS NOT NULL AND phone IS NOT NULL"
        }
    }),
    "enable": True,
    "draft": False
}

response = requests.post(
    f"{BASE_URL}/api/data-view/v1/explore-rule",
    headers={**headers, "Content-Type": "application/json"},
    json=rule_data
)

if response.status_code in (200, 201):
    rule_id = response.json()["rule_id"]
    print(f"规则创建成功: {rule_id}")
```
