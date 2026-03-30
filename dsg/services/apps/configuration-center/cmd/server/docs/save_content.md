请求参数中`content`字段应该为一个json对象数组，数组中每个item对象中必须包含以下相关数据：
```json
{
    "id": "单元ID（阶段、节点、连接线ID），required",
    "shape": "单元类型（阶段：stage，节点：input_node，连接线：edge），required",
    "parent": "父单元ID，eg：节点所在的阶段ID，omitempty",
    "source": { // 连接线的源端节点信息，连接线单元才会有
        "cell": "源端节点ID"
    },
    "target": { // 连接线的目的端节点信息，连接线单元才会有
        "cell": "目的端节点ID"
    },
    "data": {
        "name": "单元名称（阶段、节点名称），required", // 连接线没有名称
        "node_config": { // 只有节点类型才有此字段
            "start_mode": "节点启动方式（任一前序节点完成：any_node_completion；全部前序节点完成：all_node_completion），required",
            "completion_mode": "节点完成方式（手动完成：manual；自动完成：auto），required"
        },
        "task_config": { // 只有节点类型才有此字段
            "exec_role_id": "角色ID，required",
            "task_type": ["任务类型1","任务类型2"]
        }
    }
}
```