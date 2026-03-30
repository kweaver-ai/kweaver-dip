# 批量业务对象匹配接口 Technical Plan (v1.4)

> **Branch**: `feature/batch-object-match`
> **Spec Path**: `specs/batch-object-match/`
> **Created**: 2026-03-18
> **Status**: Completed

---

## Summary

批量业务对象匹配接口，入参为业务对象名称 + kn_id + ot_id，有视图ID时原样返回，有对象名字时从外部服务(agent-retrieval)检索，检索不到则返回空。不再查询本地数据库，不再返回 need_understand。

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **ORM** | GORM / SQLx |
| **Testing** | go test |
| **Common Lib** | idrm-go-base v0.1.0+ |

> **重要约束**：不允许修改现有代码，新功能独立实现，不影响原有 API 逻辑

---

## Go-Zero 开发流程

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/data_semantic/batch_object_match.api` |
| 2 | 生成 Handler/Types | goctl | `api/internal/handler/`, `types/` |
| 3 | 实现 Logic 层 | AI 实现 | `api/internal/logic/data_semantic/` |

**goctl 命令**:
```bash
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
```

---

## File Structure

| 序号 | 文件 | 位置 |
|------|------|------|
| 1 | API 文件 | `api/doc/data_semantic/data_semantic.api` |
| 2 | Handler | `api/internal/handler/data_semantic/batch_object_match_handler.go` |
| 3 | Types | `api/internal/types/` |
| 4 | Logic | `api/internal/logic/data_semantic/batch_object_match_logic.go` |

---

## Architecture (v1.4)

```
HTTP Request → Handler → Logic → External Service (agent-retrieval)
```

| 层级 | 职责 |
|------|------|
| Handler | 解析参数、格式化响应 |
| Logic | 业务逻辑实现（调用外部服务） |
| External | agent-retrieval 服务 |

---

## API Contract

**位置**: `api/doc/data_semantic/data_semantic.api`

```api
type (
    // 批量匹配请求 (v1.4)
    BatchObjectMatchReq {
        Entries   []SourceObject `json:"entries" validate:"required,min=1,max=100"`
        KnId      string         `json:"kn_id" validate:"required,uuid"`      // 知识网络ID
        OtId      string         `json:"ot_id" validate:"required,uuid"`       // 网络中指定对象ID
    }

    // 源对象
    SourceObject {
        Name       string             `json:"name" validate:"required,max=100"`    // 业务对象名称
        DataSource *RequestDataSource `json:"data_source,optional"`              // 给定的视图数据
    }

    // 请求中的视图数据
    RequestDataSource {
        Id   string `json:"id"`   // 视图ID（对应form_view表mdl_id）
        Name string `json:"name"` // 视图名称
    }

    // 批量匹配响应
    BatchObjectMatchResp {
        Entries []MatchResult `json:"entries"`
    }

    // 匹配结果
    MatchResult {
        Name       string               `json:"name"`                  // 原始输入名称
        DataSource []ResponseDataSource `json:"data_source,optional"` // 匹配的视图列表
    }

    // 响应中的视图数据
    ResponseDataSource {
        Id          string `json:"id"`           // 视图ID（mdl_id）
        Name        string `json:"name"`         // 视图名称（TechnicalName）
        ObjectName  string `json:"object_name"`  // 业务对象名称
    }
)

@server(
    prefix: /api/data-semantic/v1
    group: data_semantic
)
service api {
    @handler BatchObjectMatch
    post /batch-object-match (BatchObjectMatchReq) returns (BatchObjectMatchResp)
}
```

---

## Matching Logic (v1.4)

### 核心处理流程

```go
func (l *BatchObjectMatchLogic) BatchObjectMatch(req *BatchObjectMatchReq) (*BatchObjectMatchResp, error) {
    resp := &BatchObjectMatchResp{
        Entries: make([]MatchResult, 0, len(req.Entries)),
    }

    // 遍历每个 entry
    for _, item := range req.Entries {
        if item.Name == "" {
            continue
        }
        result := l.processObject(item, req.KnId, req.OtId)
        resp.Entries = append(resp.Entries, result)
    }

    return resp, nil
}

func (l *BatchObjectMatchLogic) processObject(item SourceObject, knId, otId string) MatchResult {
    result := MatchResult{
        Name:       item.Name,
        DataSource: make([]ResponseDataSource, 0),
    }

    // Step 1: data_source 有值，直接追加到结果
    if item.DataSource != nil && item.DataSource.Id != "" {
        result.DataSource = append(result.DataSource, ResponseDataSource{
            Id:         item.DataSource.Id,
            Name:       item.DataSource.Name,
            ObjectName: item.Name,
        })
        return result
    }

    // Step 2: 调用外部服务 agent-retrieval 检索
    datas, err := l.callAgentRetrieval(knId, otId, item.Name)
    if err != nil {
        logx.Errorf("callAgentRetrieval error: %v", err)
        return result
    }

    // 转换外部服务响应到结果（检索不到返回空）
    for _, data := range datas {
        result.DataSource = append(result.DataSource, ResponseDataSource{
            Id:         data.MdlId,
            Name:       data.Display,
            ObjectName: data.ObjectName,
        })
    }

    return result
}
```

**说明**: v1.4 简化逻辑，不再查询本地数据库，也不再返回 need_understand 字段

### 外部服务调用

```go
// AgentRetrievalRequest 外部服务请求
type AgentRetrievalRequest struct {
    Limit      int    `json:"limit"`
    Condition  Condition `json:"condition"`
}

type Condition struct {
    Operation      string      `json:"operation"`
    SubConditions  []SubCondition `json:"sub_conditions"`
}

type SubCondition struct {
    Field         string `json:"field"`
    Operation     string `json:"operation"`
    ValueFrom     string `json:"value_from"`
    Value         string `json:"value"`
}

// AgentRetrievalResponse 外部服务响应
type AgentRetrievalResponse struct {
    StatusCode int         `json:"status_code"`
    Body       ResponseBody `json:"body"`
}

type ResponseBody struct {
    Datas []InstanceData `json:"datas"`
}

type InstanceData struct {
    FormViewId   string `json:"form_view_id"`
    ObjectName   string `json:"object_name"`
    ObjectType   int    `json:"object_type"`
    MdlId        string `json:"mdl_id"`
    InstanceId   string `json:"_instance_id"`
    Display      string `json:"_display"`
    Id           string `json:"id"`
}
```

### 字段映射

| 外部服务字段 | 响应字段 |
|-------------|----------|
| mdl_id | Id |
| _display | Name |
| object_name | ObjectName |

---

## 非功能性需求 (v1.4)

| 需求 | 说明 |
|------|------|
| 超时 | HTTP 客户端 30 秒超时 |
| 重试 | 不重试，失败时返回空结果并记录日志 |
| 外部依赖 | agent-retrieval 服务 |

---

## Testing Strategy

| 类型 | 方法 | 覆盖率 |
|------|------|--------|
| 单元测试 | Mock Model | > 80% |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-18 | - | 初始版本 |
| 1.1 | 2026-03-18 | - | 更新协议：entries列表, name字段, data_source结构, need_understand字段 |
| 1.2 | 2026-03-18 | - | 更新响应结构：增加object_name字段，data_source返回mdl_id |
| 1.3 | 2026-03-18 | - | Step4无论状态都追加视图到data_source，输入验证name非空 |
| 1.4 | 2026-03-20 | - | 新增kn_id/ot_id参数，调用外部服务替代本地数据库查询，移除need_understand |
