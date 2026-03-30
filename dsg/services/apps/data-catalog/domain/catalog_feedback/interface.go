package catalog_feedback

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	c_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback"
)

type UseCase interface {
	Create(ctx context.Context, req *CreateReq) (*IDResp, error)
	Reply(ctx context.Context, feedbackID uint64, req *ReplyReq) (*IDResp, error)
	GetList(ctx context.Context, req *ListReq) (*ListResp, error)
	GetDetail(ctx context.Context, feedbackID uint64) (*DetailResp, error)
	GetCount(ctx context.Context) (*CountResp, error)
}

type FeedbackIDPathReq struct {
	FeedbackID models.ModelID `uri:"feedback_id" binding:"TrimSpace,required,VerifyModelID"` // 目录反馈ID
}

type IDResp struct {
	ID models.ModelID `json:"id" binding:"required" example:"1"` // 目录反馈ID
}

type CreateReq struct {
	CatalogID    models.ModelID `json:"catalog_id" binding:"TrimSpace,required,VerifyModelID"`    // 目录ID
	FeedbackType string         `json:"feedback_type" binding:"TrimSpace,required,min=1,max=10"`  // 反馈类型（来自数据字典 字典类型：catalog-feedback-type）
	FeedbackDesc string         `json:"feedback_desc" binding:"TrimSpace,required,min=1,max=300"` // 反馈描述
}

type ReplyReq struct {
	ReplyContent string `json:"reply_content" binding:"TrimSpace,required,min=1,max=300"` // 回复内容
}

type ListReq struct {
	Offset          int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                                               // 页码，默认1
	Limit           int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10"`                                                    // 每页大小，默认10
	Direction       string `form:"direction,default=desc" binding:"TrimSpace,omitempty,oneof=asc desc" default:"desc"`                                   // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort            string `form:"sort,default=created_at" binding:"TrimSpace,omitempty,oneof=created_at replied_at catalog_title" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；replied_at：按回复时间排序; catalog_title: 按目录名称排序。默认按创建时间排序
	Keyword         string `form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"`                                                                  // 关键字查询
	FeedbackType    string `form:"feedback_type" binding:"TrimSpace,omitempty"`                                                                          // 反馈类型（来自数据字典 字典类型：catalog-feedback-type）
	CreateBeginTime int64  `form:"create_begin_time" binding:"omitempty,min=1"`                                                                          // 创建时间筛选（起始时间）
	CreateEndTime   int64  `form:"create_end_time" binding:"omitempty,min=1"`                                                                            // 创建时间筛选（结束时间）
	Status          string `form:"status" binding:"TrimSpace,omitempty,oneof=pending replied"`                                                           // 反馈状态 pending：待处理 replied：已回复 不传该参数默认获取全部状态
	View            string `form:"view" binding:"TrimSpace,required,oneof=applier operator"`                                                             // 列表视角 applier 反馈创建者视角 operator 运营视角
}

func ListReqParam2Map(req *ListReq) map[string]any {
	rMap := map[string]any{
		"offset":    req.Offset,
		"limit":     req.Limit,
		"direction": req.Direction,
		"sort":      req.Sort,
	}

	if req.Offset <= 1 {
		rMap["offset"] = 1
	}

	if req.Limit <= 10 {
		rMap["limit"] = 10
	} else if req.Limit >= 1000 {
		rMap["limit"] = 1000
	}

	if len(req.Direction) == 0 {
		rMap["direction"] = "desc"
	}

	if len(req.Sort) == 0 {
		rMap["sort"] = "created_at"
	}

	if len(req.Keyword) > 0 {
		rMap["keyword"] = req.Keyword
	}

	if req.CreateBeginTime > 0 {
		rMap["create_begin_time"] = time.UnixMilli(req.CreateBeginTime).Format("2006-01-02T15:04:05.000Z07:00")
	}

	if req.CreateEndTime > 0 {
		rMap["create_end_time"] = time.UnixMilli(req.CreateEndTime).Format("2006-01-02T15:04:05.000Z07:00")
	}

	if len(req.Status) > 0 {
		rMap["status"] = Status2Enum(req.Status)
	}

	if len(req.FeedbackType) > 0 {
		rMap["feedback_type"] = req.FeedbackType
	}
	return rMap
}

type ListItem struct {
	DetailBasicInfo
	RepliedAt *int64 `json:"replied_at"` // 反馈回复时间，待处理状态下返回空
}

type ListResp struct {
	response.PageResult[ListItem]
}

type DetailBasicInfo struct {
	ID           uint64 `json:"id,string"`         // 目录反馈ID
	CatalogID    uint64 `json:"catalog_id,string"` // 目录ID
	CatalogCode  string `json:"catalog_code"`      // 目录code
	CatalogTitle string `json:"catalog_title"`     // 目录名称
	Status       string `json:"status"`            // 反馈状态 pending：待处理 replied：已回复
	OrgCode      string `json:"org_code"`          // 目录所属部门code
	OrgName      string `json:"org_name"`          // 目录所属部门名称
	OrgPath      string `json:"org_path"`          // 目录所属部门路径
	FeedbackType string `json:"feedback_type"`     // 反馈类型（来自数据字典 字典类型：catalog-feedback-type）
	FeedbackDesc string `json:"feedback_desc"`     // 反馈描述
	CreatedAt    int64  `json:"created_at"`        // 创建/反馈时间
	CreatedBy    string `json:"created_by"`        // 创建/反馈人ID
}

type LogEntry struct {
	OpType     string `json:"op_type"`      // 反馈处理类型 submit：反馈创建/提交 reply：反馈回复
	OpUserID   string `json:"op_user_id"`   // 反馈处理人ID
	OpUserName string `json:"op_user_name"` // 反馈处理人名称
	ExtendInfo string `json:"extend_info"`  // 扩展信息，json字符串 \n字段说明：reply_content 反馈内容 （仅处理类型为reply 回复时有）
	CreatedAt  int64  `json:"created_at"`   // 反馈处理时间戳
}

type DetailResp struct {
	BasicInfo  *DetailBasicInfo `json:"basic_info"`  // 目录反馈基本信息
	ProcessLog []*LogEntry      `json:"process_log"` // 反馈处理记录，回复信息从处理记录中取
}

type CountResp struct {
	*c_feedback.CountInfo
}

const (
	CFB_STATUS_PENDING = 1
	CFB_STATUS_REPLIED = 9

	S_CFB_STATUS_PENDING = "pending"
	S_CFB_STATUS_REPLIED = "replied"
)

func Status2Str(status int) string {
	switch status {
	case CFB_STATUS_PENDING:
		return S_CFB_STATUS_PENDING
	case CFB_STATUS_REPLIED:
		return S_CFB_STATUS_REPLIED
	default:
		return ""
	}
}

func Status2Enum(status string) int {
	switch status {
	case S_CFB_STATUS_PENDING:
		return CFB_STATUS_PENDING
	case S_CFB_STATUS_REPLIED:
		return CFB_STATUS_REPLIED
	default:
		return 0
	}
}

const (
	CFB_OP_TYPE_SUBMIT = 1
	CFB_OP_TYPE_REPLY  = 9

	S_CFB_OP_TYPE_SUBMIT = "submit"
	S_CFB_OP_TYPE_REPLY  = "reply"
)

func OpType2Str(opType int) string {
	switch opType {
	case CFB_OP_TYPE_SUBMIT:
		return S_CFB_OP_TYPE_SUBMIT
	case CFB_OP_TYPE_REPLY:
		return S_CFB_OP_TYPE_REPLY
	default:
		return ""
	}
}

func OpType2Enum(opType string) int {
	switch opType {
	case S_CFB_OP_TYPE_SUBMIT:
		return CFB_OP_TYPE_SUBMIT
	case S_CFB_OP_TYPE_REPLY:
		return CFB_OP_TYPE_REPLY
	default:
		return 0
	}
}
