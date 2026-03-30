package tc_project

import (
	"fmt"

	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"

	"github.com/jinzhu/copier"
	"gorm.io/plugin/soft_delete"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// ProjectReqModel create project request model
type ProjectReqModel struct {
	ID          string `json:"-"`                                                                                         // 不用填
	Name        string `json:"name" binding:"trimSpace,required,VerifyXssString"  example:"xx自建房屋统计"`                     //项目名称
	Description string `json:"description" binding:"trimSpace,min=0,max=255,VerifyXssString"  example:"xx自建房屋统计"`         //项目描述
	Image       string `json:"image"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`            // 图片id，uuid（36）
	FlowID      string `json:"flowchart_id"  binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`      // 流水线id，uuid（36）
	FlowVersion string `json:"flowchart_version"  binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //流水版本id，uuid（36）

	Priority       string          `json:"priority"   binding:"omitempty,oneof=common emergent urgent" example:"common"`     //项目优先级，枚举 "common" "emergent" "urgent"
	OwnerID        string          `json:"owner_id"  binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //项目负责人id，uuid（36）
	Deadline       int64           `json:"deadline" binding:"verifyDeadline" example:"4102329600"`                           //项目截止时间 时间戳
	CreatedByUID   string          `json:"-"`                                                                                // 创建人id，uuid（36） 从token获取，请求体中不需要
	Members        []ProjectMember `json:"members"  binding:"omitempty,dive"`                                                //项目成员列表
	ThirdProjectId string          `json:"third_project_id"  binding:"omitempty,lte=36" example:"410232960000"`              //第三方项目ID
}

type ProjectMember struct {
	UserId string   `json:"user_id"  binding:"required,uuid"  example:"37a051c9-07cf-4786-8f8e-6b287bd0f6c7"`            //参与人员id，uuid（36）
	Roles  []string `json:"roles"  binding:"omitempty,gte=1,dive,uuid"   example:"3c86b2ff-97e0-4d8b-a904-c8a01fc444fd"` //角色id数组，uuid（36）                                //参与人员角色
}

type ProjectMemberExport struct {
	UserId   string   `json:"id"`    //参与人员id，uuid（36）
	UserName string   `json:"name"`  //参与人中文名字
	Roles    []string `json:"roles"` //参与人员角色
}

func (p ProjectReqModel) GenProject() (*model.TcProject, error) {
	pro := model.TcProject{}

	err := copier.Copy(&pro, &p)
	if err != nil {
		return nil, nil
	}
	if pro.ThirdProjectId != "" {
		pro.ProjectType = constant.ProjectTypeFromThirdParty.Integer.Int32()
	} else {
		// 这里默认为本地的
		pro.ProjectType = constant.ProjectTypeFromLocal.Integer.Int32()
	}

	pro.UpdatedByUID = pro.CreatedByUID
	// 创建时，创建默认是 ready
	pro.Status = constant.CommonStatusReady.Integer.Int8()
	// 优先级
	pro.Priority = enum.ToInteger[constant.CommonPriority](p.Priority).Int8()
	// deadline转换 :时间戳->time.Time: pro.Deadline = time.Unix(p.Deadline, 0)

	return &pro, nil
}

func (p ProjectReqModel) GenMembers() ([]*model.TcMember, error) {
	ms := make([]*model.TcMember, 0)
	for _, m := range p.Members {
		if m.Roles != nil && len(m.Roles) > 0 {
			for i := range m.Roles {
				ms = append(ms, &model.TcMember{
					Obj:    1,
					ObjID:  p.ID,
					RoleID: m.Roles[i],
					UserID: m.UserId,
				})
			}
		} else {
			ms = append(ms, &model.TcMember{
				Obj:   1,
				ObjID: p.ID,
				//RoleID: "",
				UserID: m.UserId,
			})
		}
	}
	return ms, nil
}

func (p *ProjectReqModel) GenRelations() map[string]int {
	mp := make(map[string]int)
	for _, m := range p.Members {
		for i := range m.Roles {
			key := fmt.Sprintf("%s-%s", m.UserId, m.Roles[i])
			mp[key] = 1
		}
	}
	return mp
}

func (p *ProjectReqModel) RemoveInvalid(invalids map[string]int) {
	for i := range p.Members {
		roles := make([]string, 0)
		for j := range p.Members[i].Roles {
			key := fmt.Sprintf("%s-%s", p.Members[i].UserId, p.Members[i].Roles[j])
			if _, ok := invalids[key]; !ok {
				roles = append(roles, p.Members[i].Roles[j])
			}
		}
		p.Members[i].Roles = roles
	}
}

// GenRoles parse all the role for existence check
func (p *ProjectReqModel) GenRoles() []string {
	distinct := make(map[string]int)
	for _, m := range p.Members {
		for _, r := range m.Roles {
			distinct[r] = 1
		}
	}
	roleIds := make([]string, 0, len(distinct))
	for r, _ := range distinct {
		roleIds = append(roleIds, r)
	}
	return roleIds
}

// ProjectEditModel update project request model
type ProjectEditModel struct {
	ID             string          `json:"-"   binding:"required" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                          // 路径参数：项目id，uuid（36）
	Name           string          `json:"name" binding:"trimSpace,required,min=0,max=128,VerifyXssString"  example:"xx自建房屋统计"`            //项目名称
	Description    string          `json:"description" binding:"trimSpace,min=0,max=255,VerifyXssString"   example:"xx自建房屋统计"`             //项目描述
	Image          *string         `json:"image" binding:"omitempty,verifyUuidNotRequired" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 图片id，uuid（36）
	Status         string          `json:"status"      binding:"omitempty,oneof=ready ongoing completed"  example:"ready"`                 //项目状态，不填或者枚举 "ready" "ongoing" "completed"
	Priority       string          `json:"priority"    binding:"omitempty,oneof=common emergent urgent"  example:"common"`                 //项目优先级，不填或者枚举 "common" "emergent" "urgent"
	OwnerID        string          `json:"owner_id"  binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`               //项目负责人id，uuid（36）
	Deadline       int64           `json:"deadline"  example:"4102329600"`                                                                 //项目截止时间(秒时间戳 10/11位)
	CreatedByUID   string          `json:"-"`
	UpdatedByUID   string          `json:"-"`                                                                   // 更新人id
	Members        []ProjectMember `json:"members"  binding:"omitempty,dive"`                                   //项目成员列表
	ThirdProjectId string          `json:"third_project_id"  binding:"omitempty,lte=36" example:"410232960000"` //第三方项目ID
}

func (p ProjectEditModel) GenTcProject() (*model.TcProject, error) {
	pro := model.TcProject{}
	err := copier.Copy(&pro, &p)
	if err != nil {
		return nil, err
	}
	if pro.ThirdProjectId != "" {
		pro.ProjectType = constant.ProjectTypeFromThirdParty.Integer.Int32()
	} else {
		pro.ProjectType = constant.ProjectTypeFromLocal.Integer.Int32()
	}
	pro.CreatedByUID = p.CreatedByUID
	pro.UpdatedByUID = p.UpdatedByUID
	pro.Status = enum.ToInteger[constant.CommonStatus](p.Status).Int8()
	pro.Priority = enum.ToInteger[constant.CommonPriority](p.Priority).Int8()
	return &pro, nil
}
func (p ProjectEditModel) GenMembers() []*model.TcMember {
	if p.Members == nil {
		return nil
	}
	ms := make([]*model.TcMember, 0)
	for _, m := range p.Members {
		if m.Roles != nil && len(m.Roles) > 0 {
			for i := range m.Roles {
				ms = append(ms, &model.TcMember{
					Obj:    1,
					ObjID:  p.ID,
					RoleID: m.Roles[i],
					UserID: m.UserId,
				})
			}
		} else {
			ms = append(ms, &model.TcMember{
				Obj:   1,
				ObjID: p.ID,
				//RoleID: "",
				UserID: m.UserId,
			})
		}
	}
	return ms
}

func (p *ProjectEditModel) GenRelations() map[string]int {
	mp := make(map[string]int)
	for _, m := range p.Members {
		for i := range m.Roles {
			key := fmt.Sprintf("%s-%s", m.UserId, m.Roles[i])
			mp[key] = 1
		}
	}
	return mp
}
func (p *ProjectEditModel) RemoveInvalid(invalids map[string]int) {
	for i := range p.Members {
		roles := make([]string, 0)
		for j := range p.Members[i].Roles {
			key := fmt.Sprintf("%s-%s", p.Members[i].UserId, p.Members[i].Roles[j])
			if _, ok := invalids[key]; !ok {
				roles = append(roles, p.Members[i].Roles[j])
			}
		}
		p.Members[i].Roles = roles
	}
}

// GenRoles parse all the role for existence check
func (p *ProjectEditModel) GenRoles() []string {
	distinct := make(map[string]int)
	for _, m := range p.Members {
		for _, r := range m.Roles {
			distinct[r] = 1
		}
	}
	roleIds := make([]string, 0, len(distinct))
	for r, _ := range distinct {
		roleIds = append(roleIds, r)
	}
	return roleIds
}

// ProjectDetailModel for get project detail info
type ProjectDetailModel struct {
	ID             string                `json:"id"`                                                        //项目ID
	Name           string                `json:"name"`                                                      //项目名称
	Description    string                `json:"description"`                                               //项目描述
	Image          string                `json:"image"`                                                     //项目图片UUID
	FlowID         string                `json:"flow_id"`                                                   //项目流水线ID
	FlowName       string                `json:"flow_name"`                                                 //项目流水线的名字
	FlowVersion    string                `json:"flow_version"`                                              //项目流水线版本
	Status         string                `json:"status"`                                                    //项目状态
	Priority       string                `json:"priority"`                                                  //项目优先级
	OwnerID        string                `json:"owner_id"`                                                  //项目负责人ID
	OwnerName      string                `json:"owner_name"`                                                //项目负责人名称
	Deadline       int64                 `json:"deadline"`                                                  //项目截止日期时间戳
	CreatedBy      string                `json:"created_by"`                                                //创建人姓名
	CreatedByUID   string                `json:"created_by_uid"`                                            // 创建人id
	CreatedAt      string                `json:"created_at"`                                                // 创建时间
	UpdatedBy      string                `json:"updated_by"`                                                // 更新人姓名
	UpdatedByUID   string                `json:"updated_by_uid"`                                            // 更新人id
	UpdatedAt      string                `json:"updated_at"`                                                // 更新时间
	Members        []ProjectMemberExport `json:"members"`                                                   //项目人员集合
	ThirdProjectId string                `json:"third_project_id"  binding:"lte=36" example:"410232960000"` //第三方项目ID
}

// ProjectListModel for search project result
type ProjectListModel struct {
	ID                   string `json:"id"`                                                        //项目ID
	Name                 string `json:"name"`                                                      //项目名称
	Description          string `json:"description"`                                               //项目描述
	Image                string `json:"image"`                                                     //项目图片
	FlowID               string `json:"flow_id"`                                                   //项目流水线ID
	FlowVersion          string `json:"flow_version"`                                              //项目版本
	Status               string `json:"status"`                                                    //项目状态
	Priority             string `json:"priority"`                                                  //项目优先级
	OwnerID              string `json:"owner_id"`                                                  //项目负责人ID
	OwnerName            string `json:"owner_name"`                                                //项目负责人名称
	Deadline             int64  `json:"deadline"`                                                  //项目截止日期
	CompleteTime         int64  `json:"complete_time"`                                             //项目完成时间
	HasBusinessModelData bool   `json:"has_business_model_data"`                                   //判断有没有业务模型的数据
	HasDataModelData     bool   `json:"has_data_model_data"`                                       //判断有没有数据模型数据
	ProjectType          string `json:"project_type"`                                              // 项目类型枚举值，默认local本地项目、thirtParty来自第三方项目
	UpdatedBy            string `json:"updated_by"`                                                //更新人姓名
	UpdatedByUID         string `json:"updated_by_uid"`                                            //更新人id
	UpdatedAt            string `json:"updated_at"`                                                //更新时间
	ThirdProjectId       string `json:"third_project_id"  binding:"lte=36" example:"410232960000"` //第三方项目ID
}

type ProjectPathModel struct {
	Id string `json:"id" uri:"pid"`
}
type ProjectID struct {
	Id string `json:"id" uri:"id" form:"id" binding:"required,uuid"`
}

type FlowIdModel struct {
	Id          string `json:"id" form:"id" binding:"verifyUuidNotRequired"`                  // 项目ID
	FlowID      string `json:"flow_id"  form:"flow_id"   binding:"required,uuid"`             //项目流水线ID
	FlowVersion string `json:"flow_version"   form:"flow_version"    binding:"required,uuid"` //项目版本
}

type ProjectNameRepeatReq struct {
	Id   string `json:"id" form:"id"  binding:"verifyUuidNotRequired"`
	Name string `json:"name" form:"name" binding:"trimSpace,required,min=0,max=128,VerifyXssString"`
}

type ProjectCardQueryReq struct {
	Offset      uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                                 // 页码
	Limit       uint64 `json:"limit" form:"limit,default=10" binding:"min=1,max=120"`                          // 每页大小
	Direction   string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`               // 排序方向
	Sort        string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name"` // 排序类型
	Name        string `json:"name" form:"name"  binding:"min=0,max=128,VerifyXssString"`
	Status      string `json:"status" form:"status"  binding:"verifyMultiStatus"`
	ProjectType string `json:"project_type" form:"project_type"`
}
type FlowchartView struct {
	Content string `json:"content"` //流水线视图内容
}
type FlowchartPath struct {
	// uuid tag 默认必填
	PId string `uri:"pid" form:"pid" binding:"uuid"` //ID
}

func NewProjectDetailModel(p *model.TcProject) *ProjectDetailModel {
	return &ProjectDetailModel{
		ID:             p.ID,
		Name:           p.Name,
		Description:    p.Description.String,
		Image:          p.Image.String,
		FlowID:         p.FlowID,
		FlowVersion:    p.FlowVersion,
		Status:         enum.ToString[constant.CommonStatus](p.Status),
		Priority:       enum.ToString[constant.CommonPriority](p.Priority),
		OwnerID:        p.OwnerID,
		OwnerName:      "",
		Deadline:       p.Deadline.Int64,
		CreatedBy:      "",
		CreatedByUID:   p.CreatedByUID,
		CreatedAt:      p.CreatedAt.Format(constant.CommonTimeFormat),
		UpdatedBy:      "",
		UpdatedByUID:   p.UpdatedByUID,
		UpdatedAt:      p.UpdatedAt.Format(constant.CommonTimeFormat),
		ThirdProjectId: p.ThirdProjectId,
	}
}

// ProjectCandidates  project candidates
type ProjectCandidates struct {
	Id         string      `json:"id"`          //项目ID
	RoleGroups []RoleGroup `json:"role_groups"` // 某个角色下的用户
}

// RoleGroup  group of a role
type RoleGroup struct {
	RoleID    string                 `json:"role_id"`    //角色ID
	RoleName  string                 `json:"role_name"`  //角色名称
	RoleColor string                 `json:"role_color"` //角色icon背景色
	RoleIcon  string                 `json:"role_icon"`  //角色icon
	Members   []UserInfoWithRoleInfo `json:"members"`    //角色下的所有用户
}
type UserInfoWithRoleInfo struct {
	UserID   string `json:"id"`        //用户标识
	UserName string `json:"name"`      //用户名称
	RoleID   string `json:"role_id"`   //角色标识
	RoleName string `json:"role_name"` //角色名称
}

// TaskTypeGroup  group of a task_type
type TaskTypeGroup struct {
	TaskType string        `json:"task_type"` //任务类型
	Members  []*model.User `json:"members"`   //角色下的所有用户
}

type PipeLineInfo struct {
	Id      string         `json:"id"`         //流水线id
	Version string         `json:"version_id"` //流水线版本id
	Name    string         `json:"name"`       //流水线名字
	Nodes   []FlowNodeInfo `json:"nodes"`      //流水线名字

	Content string `json:"content"` //流水线视图内容
}

func NewProjectListModel(p *model.TcProject, OwnerName, UpdatedBy string) ProjectListModel {
	return ProjectListModel{
		ID:             p.ID,
		Name:           p.Name,
		Description:    p.Description.String,
		Image:          p.Image.String,
		FlowID:         p.FlowID,
		FlowVersion:    p.FlowVersion,
		Status:         enum.ToString[constant.CommonStatus](p.Status),
		Priority:       enum.ToString[constant.CommonPriority](p.Priority),
		OwnerID:        p.OwnerID,
		OwnerName:      OwnerName,
		Deadline:       p.Deadline.Int64,
		CompleteTime:   p.CompleteTime,
		ProjectType:    enum.ToString[constant.ProjectType](p.ProjectType),
		UpdatedBy:      UpdatedBy,
		UpdatedByUID:   p.UpdatedByUID,
		UpdatedAt:      p.UpdatedAt.Format(constant.CommonTimeFormat),
		ThirdProjectId: p.ThirdProjectId,
	}
}

type FlowNodeInfo struct {
	NodeCompletionMode string `json:"completion_mode"` // 节点完成方式
	NodeStartMode      string `json:"start_mode"`      // 节点启动方式
	NodeID             string `json:"id"`              // 节点后端ID
	NodeName           string `json:"name"`            // 节点名称
	NodeUnitID         string `json:"unit_id"`         // 节点前端ID

	PrevNodeIds     []string `json:"prev_node_ids"`      // 前序节点后端ID数组，逗号分割的数组
	PrevNodeUnitIds []string `json:"prev_node_unit_ids"` // 前序节点前端ID数组，逗号分割的数组

	Stage           FlowNodeStage  `json:"stage"` // 阶段
	TaskConfig      NodeTaskConfig `json:"node_task_config"`
	WorkOrderConfig WorkOrdeConfig `json:"node_work_order_config"`

	DeletedAt soft_delete.DeletedAt `json:"deleted_at"` // 删除时间(逻辑删除)
}
type FlowNodeStage struct {
	StageID     string `json:"id"`      // 阶段的后端ID
	StageName   string `json:"name"`    // 阶段名称
	StageOrder  int32  `json:"order"`   // 阶段顺序
	StageUnitID string `json:"unit_id"` // 阶段的前端ID
}

type NodeTaskConfig struct {
	ExecRole       TaskExecRole `json:"exec_role"`
	CompletionMode string       `json:"completion_mode"`
	// 新增任务类型
	TaskType []string `json:"task_type"`
}

type WorkOrdeConfig struct {
	ExecRole TaskExecRole `json:"exec_role"`
	// CompletionMode string       `json:"completion_mode"`
	// 新增任务类型
	WorkOrderType []string `json:"work_order_type"`
}

type TaskExecRole struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func NewProjectChangeMsg(projectId string, businessProcessIDSlice, dataProcessIDSlice []string, token string) *kafkax.RawMessage {
	header := kafkax.NewRawMessage()
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["project_id"] = projectId
	payload["business_process_slice"] = businessProcessIDSlice
	payload["data_process_slice"] = dataProcessIDSlice
	payload["token"] = token
	msg["payload"] = payload
	msg["header"] = header
	return &msg
}

type ProjectDomainInfo struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Status           string   `json:"status"`
	BusinessDomainID []string `json:"business_domain_id"` //任务关联的业务流程ID
	DataDomainID     []string `json:"data_domain_id"`     //任务关联的业务流程ID
}

type WorkitemsQueryParam struct {
	ProjectId    string `json:"project_id" form:"project_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 项目id，uuid（36）
	Offset       uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                                                        // 页码
	Limit        uint64 `json:"limit" form:"limit,default=10" binding:"min=1,max=1000"`                                                // 每页大小
	Direction    string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`                                      // 排序方向
	Sort         string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at deadline"`                    // 排序类型
	Keyword      string `json:"keyword" form:"keyword"  binding:"omitempty,VerifyXssString,max=32"`                                    // 对象名称
	Status       string `json:"status" form:"status" binding:"verifyMultiStatus"`                                                      // 任务状态，枚举 "ready" "ongoing" "completed" 可以多选，逗号分隔
	Priority     string `json:"priority" form:"priority" binding:"verifyMultiPriority"`                                                // 任务优先级，枚举 "common" "emergent" "urgent" 可以多选，逗号分隔
	ExecutorId   string `json:"executor_id" form:"executor_id" binding:"verifyMultiUuid"`                                              // 任务执行人id，可以多选，逗号分隔
	NodeId       string `json:"node_id" form:"node_id" binding:"omitempty,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`        // 节点id，uuid（36），节点id不为空时，项目id不能为空
	WorkitemType string `json:"workitem_type" form:"workitem_type" binding:"omitempty"`                                                // 任务类型，枚举 "normal" "modeling" "dataModeling" "standardization" 可以多选，逗号分隔。不传/传空相当于全选。
}

type WorkitemsQueryResp struct {
	Entries    []*WorkitemsInfo `json:"entries"`                 // 对象列表
	TotalCount int64            `json:"total_count" example:"3"` // 当前筛选条件下的任务数量
}

type WorkitemsInfo struct {
	Id               string `json:"id"`                // 对象id
	Name             string `json:"name"`              // 对象名称
	Type             string `json:"type"`              // 任务或者工单（task、work-orde）
	SubType          string `json:"sub_type"`          // 任务或者工单子类型
	StageId          string `json:"stage_id"`          // 阶段id
	NodeId           string `json:"node_id"`           // 节点id
	Status           string `json:"status"`            // 任务状态(未派发、未开始、进行中、已完成)
	ExecutorId       string `json:"executor_id"`       // 任务执行人id
	ExecutorName     string `json:"executor_name"`     // 任务执行人
	UpdatedBy        string `json:"updated_by"`        // 修改人
	Deadline         int64  `json:"deadline"`          // 截止日期
	UpdatedAt        int64  `json:"updated_at"`        // 修改时间
	AuditStatus      string `json:"audit_status"`      // 审核状态(仅工单)
	AuditDescription string `json:"audit_description"` // 审核描述（仅工单）
	NeedSync         bool   `json:"need_sync"`         // 是否需要同步（仅工单）
}
