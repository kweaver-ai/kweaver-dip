package auth

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
)

type Repo interface {
	GetAccess(ctx context.Context, objectType []string, subjectId, subjectType string) (*GetAccessResp, error)
}

type GetAccessResp struct {
	response.PageResult[Object]
}

type Object struct {
	ObjectId    string        `json:"object_id"`   // 资源id
	ObjectType  string        `json:"object_type"` // 资源类型 domain 主题域 data_catalog 数据目录 data_view 数据表视图 api 接口
	Permissions []*Permission `json:"permissions"` // 权限。不需要判断哪种类型权限，只要出现在响应结果列表，一定有最基础的view权限
}

type Permission struct {
	Action string `json:"action"` // 请求动作 view 查看 read 读取 download 下载
	Effect string `json:"effect"` // 策略结果 allow 允许 deny 拒绝
}
