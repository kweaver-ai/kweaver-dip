package flowchart

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type UseCase interface {
	ListByPaging(ctx context.Context, req *QueryPageReqParam) (*QueryPageReapParam, error)
	Delete(ctx context.Context, fid string) (*response.NameIDResp, error)
	NameExistCheck(ctx context.Context, name string, fid *string) (bool, error)
	Get(ctx context.Context, fId string) (*GetResp, error)
	PreCreate(ctx context.Context, req *PreCreateReqParam, uid string) (*PreCreateRespParam, error)
	Edit(ctx context.Context, body *EditReqParamBody, fId string, uid string) (*response.NameIDResp, error)
	SaveContent(ctx context.Context, req *SaveContentReqParamBody, fId string) (*SaveContentRespParam, error)
	GetContent(ctx context.Context, req *GetContentReqParamQuery, fId string) (*GetContentRespParam, error)
	GetNodesInfo(ctx context.Context, req *GetNodesInfoReqParamQuery, fId string) (*GetNodesInfoRespParam, error)
	HandleRoleMissing(ctx context.Context, rid string) error
	Migration(ctx context.Context) error
	// UploadImage(ctx context.Context, req *UploadImageReqParamBody, fId int64) (*UploadImageRespParam, error)
	// PreEdit(ctx context.Context, fId int64) (*PreEditRespParam, error)
	// DeleteUnsavedVersion(ctx context.Context, vId, fId int64) (*DeleteUnsavedVersionRespParam, error)
}

// ///////////////// Common ///////////////////

type UriReqParamFId struct {
	FId *string ` json:"fid,omitempty" uri:"fid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 运营流程ID，uuid
}

// ///////////////// QueryPage ///////////////////

type PageInfo struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                          // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=120" default:"12"`                                  // 每页大小，默认12
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type QueryPageReqParam struct {
	PageInfo
	Keyword      string                                  `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=0,max=128,VerifyXssString"` // 关键字查询，字符无限制
	ReleaseState constant.FlowchartReleaseState          `json:"release_state" form:"release_state" binding:"required,oneof=released unreleased"`    // 发布状态过滤，枚举：unreleased：未发布；released：已发布
	ChangeState  *constant.FlowchartReleaseChangedStatus `json:"change_state" form:"change_state" binding:"omitempty,oneof=unchanged changed"`       // 变更状态，当release_state为released时有效，不传该字段为获取全部，枚举。unchanged：已发布未变更；changed：已发布有变更；
	IsAll        bool                                    `json:"is_all" form:"is_all" binding:"omitempty"`                                           // 是否不分页获取全部，默认false
	WithImage    bool                                    `json:"with_image" form:"with_image,default=true" binding:"omitempty"`                      // 响应数据中是否包含图片信息，默认为true

}

type SummaryInfo struct {
	response.CreateUpdateUserAndTime
	ID        string                             `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`         // 运营流程ID
	VersionID string                             `json:"version_id" binding:"required,uuid" example:"3599226c-3df4-406c-b30e-a4a69036b4b6"` // 运营流程版本ID，任务中心使用。release_state是unreleased，返回的是未发布的版本ID；如果release_state是released，返回的是最新已发布的版本ID
	Name      string                             `json:"name" binding:"required,max=128" example:"flowchart_name"`                          // 运营流程名称
	Status    constant.FlowchartEditStatusString `json:"status" binding:"required,oneof=creating released editing" example:"creating"`      // 运营流程状态，枚举：creating：未发布的状态；released：已发布状态不存在变更；editing: 已发布存在变更
	//ConfigStatus      constant.FlowchartConfigStatusString `json:"config_status"`
	ClonedByID        *int64  `json:"cloned_by_id,omitempty" swaggerignore:"true"`                                                     // 从哪个运营流程克隆
	CloneByTemplateID *int64  `json:"clone_by_template_id,omitempty" swaggerignore:"true"`                                             // 从哪个了运营流程模版生成
	Image             *string `json:"image,omitempty" binding:"omitempty,base64" example:"data:image/png;base64,U3dhZ2dlciByb2Nrcw=="` // 图片内容，base64编码
}

func (s *SummaryInfo) ToHttp(flowchartModel *model.Flowchart, vId, imageContent, createUser, updateUser string, withImage bool) *SummaryInfo {
	if flowchartModel == nil {
		log.Warn("model.Flowchart inst is nil")
		return nil
	}

	ss := s
	if ss == nil {
		ss = &SummaryInfo{}
	}

	ss.ID = flowchartModel.ID
	ss.VersionID = vId
	ss.Name = flowchartModel.Name
	ss.Status = constant.FlowchartEditStatusIntToString[constant.FlowchartEditStatus(flowchartModel.EditStatus)]
	// ss.ClonedByID = &flowchartModel.ClonedByID
	// ss.CloneByTemplateID = &flowchartModel.ClonedByTemplateID
	if withImage {
		ss.Image = &imageContent
	}
	//ss.ConfigStatus = constant.FlowchartConfigStatusInt32(flowchartModel.ConfigStatus).ToString()
	ss.CreatedBy = createUser
	ss.CreatedAt = flowchartModel.CreatedAt.UnixMilli()
	ss.UpdatedBy = updateUser
	ss.UpdatedAt = flowchartModel.UpdatedAt.UnixMilli()

	return ss
}

type QueryPageReapParam struct {
	Entries              []*SummaryInfo `json:"entries" binding:"required"`                                 // 运营流程对象列表
	TotalCount           int64          `json:"total_count" binding:"required,ge=0" example:"3"`            // 当前筛选条件下的运营流程数量
	UnreleasedTotalCount int64          `json:"unreleased_total_count" binding:"required,ge=0" example:"3"` // 未发布运营流程的总数量，不受筛选条件影响
	ReleasedTotalCount   int64          `json:"released_total_count" binding:"required,ge=0" example:"2"`   // 发布运营流程的总数量，不受筛选条件影响
}

// ///////////////// Get ///////////////////

type GetResp struct {
	response.CreateUpdateUserAndTime
	ID          string                             `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`    // 运营流程ID
	Name        string                             `json:"name" binding:"required,max=128" example:"flowchart_name"`                     // 运营流程名称
	Description *string                            `json:"description,omitempty" binding:"omitempty,max=255" example:"flowchart_desc"`   // 运营流程描述
	Status      constant.FlowchartEditStatusString `json:"status" binding:"required,oneof=creating released editing" example:"creating"` // 运营流程状态，枚举：creating：未发布的状态；released：已发布状态不存在变更；editing: 已发布存在变更
}

func (r *GetResp) ToHttp(m *model.Flowchart, createUser, updateUser string) *GetResp {
	if m == nil {
		log.Warn("model.Flowchart inst is nil")
		return nil
	}

	rr := r
	if rr == nil {
		rr = &GetResp{}
	}

	rr.ID = m.ID
	rr.Name = m.Name
	if len(m.Description) > 0 {
		rr.Description = &m.Description
	}
	rr.Status = constant.FlowchartEditStatusIntToString[constant.FlowchartEditStatus(m.EditStatus)]
	rr.CreatedBy = createUser
	rr.CreatedAt = m.CreatedAt.UnixMilli()
	rr.UpdatedBy = updateUser
	rr.UpdatedAt = m.UpdatedAt.UnixMilli()

	return rr
}

// ///////////////// NameRepeat ///////////////////

type NameRepeatReq struct {
	FlowchartID *string `json:"flowchart_id,omitempty" form:"flowchart_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 运营流程ID
	Name        *string `json:"name" form:"name" binding:"TrimSpace,required,min=1,max=128,VerifyXssString" example:"flowchart_name"`               // 运营流程名称
}

// ///////////////// PreCreate ///////////////////

type PreCreateReqParam struct {
	Name               *string `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyXssString" example:"flowchart_name"`             // 运营流程名称，仅支持中英文、数字、下划线及中划线，前后空格自动去除
	Description        *string `json:"description,omitempty" binding:"TrimSpace,omitempty,max=255,VerifyXssString" example:"flowchart desc"` // 运营流程描述，仅支持中英文、数字及键盘上的特殊字符，前后空格自动去除
	ClonedById         *string `json:"-" binding:"omitempty,gt=0" swaggerignore:"true"`                                                      // 从哪个运营流程克隆
	ClonedByTemplateId *string `json:"-" binding:"omitempty,gt=0" swaggerignore:"true"`                                                      // 从哪个了运营流程模版生成
}

func (p *PreCreateReqParam) ToModel(uid string) *model.Flowchart {
	if p == nil {
		return nil
	}

	res := &model.Flowchart{
		Name:               *p.Name,
		Description:        util.PtrToValue(p.Description),
		EditStatus:         int32(constant.FlowchartEditStatusCreating),
		ClonedByID:         util.PtrToValue(p.ClonedById),
		ClonedByTemplateID: util.PtrToValue(p.ClonedByTemplateId),
		CreatedByUID:       uid,
		UpdatedByUID:       uid,
	}

	return res
}

type PreCreateRespParam struct {
	ID   string `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 运营流程ID
	Name string `json:"name" binding:"required,max=128" example:"flowchart_name"`                  // 运营流程名称
}

// ///////////////// Edit ///////////////////

type EditReqParamBody struct {
	Name        *string `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyXssString" example:"flowchart_name"`             // 运营流程名称，仅支持中英文、数字、下划线及中划线，前后空格自动去除
	Description *string `json:"description,omitempty" binding:"TrimSpace,omitempty,max=255,VerifyXssString" example:"flowchart desc"` // 运营流程描述，仅支持中英文、数字及键盘上的特殊字符，前后空格自动去除
}

type EditReqParam struct {
	UriReqParamFId
	EditReqParamBody
}

// ///////////////// SaveContent ///////////////////

type SaveContentReqParamBody struct {
	Type    *constant.FlowchartSaveType `json:"type" binding:"required,oneof=temp final" example:"temp"`                                                            // 保存类型，枚举：final：最终保存；temp：临时保存
	Content *string                     `json:"content" binding:"required,max=10485760,json"`                                                                       // 运营流程内容，json形式
	Image   *string                     `json:"image" binding:"required_if=Type final,omitempty,max=10485760" example:"data:image/png;base64,U3dhZ2dlciByb2Nrcw=="` // 图片数据，base64编码
}

type SaveContentReqParam struct {
	UriReqParamFId
	SaveContentReqParamBody
}

type SaveContentRespParam struct {
	ID   string `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 运营流程ID
	Name string `json:"name" binding:"required,max=128" example:"flowchart_name"`                  // 运营流程名称
}

// ///////////////// GetContent ///////////////////

type GetContentReqParamQuery struct {
	VersionID *string `json:"version_id" form:"version_id" binding:"omitempty,uuid" example:"3599226c-3df4-406c-b30e-a4a69036b4b6"` // 运营流程版本ID，如果指定，则返回指定版本ID的运营流程内容；如果不指定，则返回最新的版本内容--发布存在变更的内容>>发布未变更的内容>>未发布的内容
}

type GetContentReqParam struct {
	UriReqParamFId
	GetContentReqParamQuery
}

type GetContentRespParam struct {
	ID      string `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 运营流程ID
	Content string `json:"content" binding:"required,json"`                                           // 运营流程内容，json形式
}

// ///////////////// UploadImage ///////////////////

// type UploadImageReqParamBody struct {
//	VersionID *int64  `json:"version_id" binding:"required,gt=0" example:"1"`                                    // 正在编辑的运营流程版本ID，预新建/预编辑接口返回的运营流程版本ID
//	Image     *string `json:"image" binding:"required,min=1,max=10485760,base64" example:"data:image/png;base64,U3dhZ2dlciByb2Nrcw=="` // 图片数据，base64编码
// }
//
// type UploadImageReqParam struct {
//	UriReqParamFId
//	UploadImageReqParamBody
// }
//
// type UploadImageRespParam struct {
//	ID        int64  `json:"id" binding:"required,gt=0" example:"1"`                         // 运营流程ID
//	VersionID int64  `json:"version_id" binding:"required,gt=0" example:"1"`                 // 上传的运营流程图片属于哪个运营流程版本的ID
//	Name      string `json:"name" binding:"required,min=1,max=128" example:"flowchart_name"` // 运营流程名称
// }

// ///////////////// PreEdit ///////////////////

// type PreEditRespParam struct {
//	ID           int64  `json:"id" binding:"required,gt=0" example:"1"`                         // 运营流程ID
//	VersionID    int64  `json:"version_id" binding:"required,gt=0" example:"1"`                 // 要编辑的运营流程版本ID
//	IsNewVersion bool   `json:"is_new_version" binding:"required" example:"true"`               // 要编辑的运营流程版本是否是新建的
//	Name         string `json:"name" binding:"required,min=1,max=128" example:"flowchart_name"` // 运营流程名称
// }

// ///////////////// DeleteUnsavedVersion ///////////////////

// type DeleteUnsavedVersionReqParamBody struct {
//	VersionID *int64 `json:"version_id" binding:"required,gt=0" example:"1"` // 正在编辑的运营流程版本ID
// }
//
// type DeleteUnsavedVersionReqParam struct {
//	UriReqParamFId
//	DeleteUnsavedVersionReqParamBody
// }
//
// type DeleteUnsavedVersionRespParam struct {
//	ID        int64  `json:"id" binding:"required,gt=0" example:"1"`                         // 运营流程ID
//	VersionID int64  `json:"version_id" binding:"required,gt=0" example:"1"`                 // 被删除的运营流程版本ID
//	Name      string `json:"name" binding:"required,min=1,max=128" example:"flowchart_name"` // 运营流程名称
// }

// ///////////////// GetNodesInfo ///////////////////

type GetNodesInfoReqParamQuery struct {
	VersionID *string `json:"version_id" form:"version_id" binding:"required,uuid"  example:"3599226c-3df4-406c-b30e-a4a69036b4b6"` // 运营流程版本ID，必须是已经发布的版本
}

type GetNodesInfoReqParam struct {
	UriReqParamFId
	GetNodesInfoReqParamQuery
}

type StageUnitInfo struct {
	ID     string `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 阶段ID
	UnitID string `json:"unit_id" binding:"required" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 阶段unitId，前端画布里的阶段id
	Name   string `json:"name" binding:"required" example:"stage_name"`                              // 阶段名称
	Order  int32  `json:"order" binding:"required,ge=0" example:"0"`                                 // 阶段的次序，从1开始排序
}

type RoleToolIDNameSet struct {
	ID   string `json:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // id
	Name string `json:"name" binding:"required,min=1,max=128" example:"name"`                      // 名称
}

type NodeTaskConfig struct {
	//ExecRole       RoleToolIDNameSet                          `json:"exec_role" binding:"required"`                                  // 任务执行角色
	TaskTypes      constant.TaskTypeStrings                   `json:"task_type" binding:"required"`                                  // 任务类型数组
	CompletionMode constant.FlowchartTaskCompletionModeString `json:"completion_mode" binding:"required,eq=manual" example:"manual"` // 任务完成方式，目前只有manual手动完成
}

type NodeWorkOrderConfig struct {
	//ExecRole       RoleToolIDNameSet                          `json:"exec_role" binding:"required"`                                  // 任务执行角色
	WorkOrderTypes constant.WorkOrderTypeStrings              `json:"work_order_type" binding:"required"`                            // 任务类型数组
	CompletionMode constant.FlowchartTaskCompletionModeString `json:"completion_mode" binding:"required,eq=manual" example:"manual"` // 任务完成方式，目前只有manual手动完成
}

type NodeUnitInfo struct {
	ID                  string                                     `json:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                                 // 节点ID
	UnitID              string                                     `json:"unit_id" binding:"required" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`                                 // 节点unitId，前端画布里的节点id
	Name                string                                     `json:"name" binding:"required" example:"node_name"`                                                               // 节点名称
	StartMode           constant.FlowchartNodeStartModeString      `json:"start_mode" binding:"required,oneof=any_node_completion all_node_completion" example:"all_node_completion"` // 节点启动方式，枚举：all_node_completion：完成全部前序节点；any_node_completion：完成任务前序节点；any_node_start：任务前序节点为启动状态
	CompletionMode      constant.FlowchartNodeCompletionModeString `json:"completion_mode" binding:"required,eq=auto" example:"auto"`                                                 // 节点完成方式，目前只有auto自动完成
	PrevNodeIDs         []string                                   `json:"prev_node_ids,omitempty" binding:"omitempty" example:"6c52a959-0c2a-4611-9060-fc07fd83e5cc"`                // 前序节点ID集合
	PrevNodeUnitIDs     []string                                   `json:"prev_node_unit_ids,omitempty" binding:"omitempty" example:"505ca39b-9e85-4877-9c6f-6ed9d9c2ad01"`           // 前序节点UnitID集合
	Stage               *StageUnitInfo                             `json:"stage,omitempty" binding:"omitempty"`                                                                       // 节点所属阶段信息
	NodeTaskConfig      *NodeTaskConfig                            `json:"node_task_config" binding:"required"`                                                                       // 节点下任务配置信息
	NodeWorkOrderConfig *NodeWorkOrderConfig                       `json:"node_work_order_config" binding:"required"`
}

type GetNodesInfoRespParam struct {
	ID        string          `json:"id" binding:"required,uuid" example:"5be44017-dd8c-411a-b176-da8b8ba9fd7b"`         // 运营流程ID
	VersionID string          `json:"version_id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 运营流程版本ID
	Name      string          `json:"name" binding:"required,min=1,max=128" example:"flowchart_name"`                    // 运营流程名称
	Nodes     []*NodeUnitInfo `json:"nodes" binding:"required,max=200,dive"`                                             // 节点信息
	Content   string          `json:"content" binding:"required,max=10485760,json"`                                      // 运营流程内容，json形式
}
