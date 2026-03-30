package business_grooming

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
)

type Call interface {
	GetRemoteDomainInfo(ctx context.Context, subjectDomainId string) (*BusinessDomainInfo, error)
	GetRemoteBusinessModelInfo(ctx context.Context, businessModelId string) (*BriefModelInfo, error)
	QueryFormInfoWithModel(ctx context.Context, businessModelId string, formIds ...string) (*RelationDataList, error)
	GetBusinessIndicator(ctx context.Context, businessIndicatorID string) (*BusinessIndicator, error)
	GetRemoteDomainInfos(ctx context.Context, domainIds ...string) ([]*BusinessDomainInfo, error)
	GetRemoteProcessInfo(ctx context.Context, taskId string) (*BusinessDomainInfos, error)
	GetRemoteDiagnosisInfo(ctx context.Context, taskId string) (*DiagnosisInfos, error)
	GetRemoteModelInfo(ctx context.Context, processId string) (*NodeResp, error)
	UpdateBusinessDiagnosisTaskStaus(ctx context.Context, taskId string) error
}

type BusinessDomainInfo struct {
	ID              int64  `json:"business_domain_id" format:"业务域标识"`
	DomainID        string `json:"id" format:"业务域标识"`
	Name            string `json:"name" example:"业务域名称" format:"业务域名称"`                                            // 业务域名称
	ModelID         string `json:"model_id" example:"业务域名称" format:"业务模型名称"`                                       // 业务模型
	ModelName       string `json:"model_name" example:"业务模型名称" format:"业务模型名称"`                                    // 业务模型
	ModelLocked     bool   `json:"model_locked"`                                                                   // 业务模型是否被锁
	DataModelID     string `json:"data_model_id" binding:"uuid"`                                                   // 关联的模型id
	DataModelName   string `json:"data_model_name" binding:"VerifyName128NoSpace"`                                 // 业务模型名称
	DataModelLocked bool   `json:"data_model_locked"`                                                              // 业务模型是否被锁
	Description     string ` json:"description" example:"业务域描述" format:"业务域描述"`                                    // 业务域描述
	AuditStatus     string `json:"audit_status" form:"audit_status" binding:"required,max=10" example:"published"` // 审核状态published已上线,
}

func (i BusinessDomainInfo) NewRelationDataList() *RelationDataList {
	return &RelationDataList{
		DomainID:   i.DomainID,
		DomainName: i.Name,
	}
}

// BriefModelInfo main business response
type BriefModelInfo struct {
	BusinessModelID   string `json:"business_model_id"`                   //业务模型id
	SubjectDomainID   string `json:"subject_domain_id"`                   // 主题域id
	SubjectDomainName string `json:"subject_domain_name"`                 //主题域名称
	DomainID          string `json:"domain_id"`                           // 业务流程id
	DomainName        string `json:"domain_name"`                         //业务流程名称
	MainBusinessId    string `json:"main_business_id"`                    //业务模型&数据模型ID
	Name              string `json:"name"`                                //业务模型&数据模型名称
	Description       string `json:"description"`                         //业务模型&数据模型描述 	// 删除时间(逻辑删除)
	Status            uint32 `json:"status"`                              //业务模型&数据模型状态（草稿0、待审核1、审核驳回2、审核通过3)
	TaskID            string `gorm:"column:task_id" json:"task_id"`       //任务id，为空表示未关联任务
	ProjectID         string `gorm:"column:project_id" json:"project_id"` //项目id，为空表示未关联项目
}

func (b BriefModelInfo) NewRelationDataList(taskType int32) *RelationDataList {
	relationData := &RelationDataList{
		SubjectDomainID:   b.SubjectDomainID,
		SubjectDomainName: b.SubjectDomainName,
		DomainID:          b.DomainID,
		DomainName:        b.DomainName,
		BusinessModelID:   b.BusinessModelID,
		MainBusinessId:    b.MainBusinessId,
		MainBusinessName:  b.Name,
		TaskID:            b.TaskID,
		ProjectID:         b.ProjectID,
		Data:              make([]*RelationDataInfo, 0),
	}
	if taskType == constant.TaskTypeDataMainBusiness.Integer.Int32() {
		relationData.DataModelID = b.BusinessModelID
		relationData.BusinessModelID = ""
	}
	return relationData
}

// RelationDataUpdateModel 任务项目关联数据更新模型, 每次都是全量更新
type RelationDataUpdateModel struct {
	BusinessModelId string   `json:"business_model_id"  binding:"uuid"`                                       //主干业务的模型ID，检查是否是表单的主干业务
	TaskType        string   `json:"task_type"`                                                               //任务类型，判断是否需要检查IDs
	TaskID          string   `json:"task_id" form:"task_id" binding:"omitempty,uuid"`                         //关联的任务ID
	ProjectID       string   `json:"project_id"  form:"project_id" binding:"omitempty,uuid"`                  //关联的项目ID
	IdsType         string   `json:"ids_type" form:"ids_type" binding:"oneof=businessModelId businessFormId"` //关联的数据类型
	Ids             []string `json:"ids"  form:"ids" binding:"required,gte=1,dive,uuid"`                      //关联的数据列表
	Updater         string   `json:"updater" form:"updater"  binding:"required,uuid"`                         //更新人的ID
}

type RelationDataList struct {
	SubjectDomainID   string              `json:"subject_domain_id"`            // 主题域id
	SubjectDomainName string              `json:"subject_domain_name"`          //主题域名称
	DomainID          string              `json:"domain_id"`                    // 业务流程id
	DomainName        string              `json:"domain_name"`                  //业务流程名称
	BusinessModelID   string              `json:"business_model_id"`            //业务模型&数据模型id
	DataModelID       string              `json:"data_model_id"`                //业务模型&数据模型id
	MainBusinessId    string              `json:"main_business_id"`             //主干业务ID
	MainBusinessName  string              `json:"main_business_name,omitempty"` //主干业务名字
	TaskID            string              `json:"task_id,omitempty"`            //任务ID
	ProjectID         string              `json:"project_id,omitempty"`         //项目ID
	DataType          string              `json:"data_type"`                    //关联的ID类型
	Data              []*RelationDataInfo `json:"data"`                         //关联数据结构体
}

type RelationDataInfo struct {
	Id   string `json:"id"`   //关联数据的ID
	Name string `json:"name"` //关联数据的名称
}

type BusinessIndicator struct {
	ID                 string `json:"id"`                  // 业务指标ID
	Name               string `json:"name"`                // 业务指标名称
	Description        string `json:"description"`         // 业务指标描述
	CalculationFormula string `json:"calculation_formula"` // 业务指标计算公式
	PathID             string `json:"unit"`                // 业务指标单位
	StatisticsCycle    string `json:"statistics_cycle"`    // 业务指标统计周期
	StatisticsCaliber  string `json:"statistical_caliber"` // 业务指标统计口径
}

type BusinessDomainInfos struct {
	Entries    []*NodeResp `json:"entries"`
	TotalCount int64       `json:"total_count"`
}

type NodeResp struct {
	ID                   string   `json:"id" binding:"required,uuid"`                                                     // id
	Name                 string   `json:"name" binding:"required,VerifyName128NoSpace"`                                   // 名称
	Description          string   `json:"description" binding:"lte=300"`                                                  // 描述
	Type                 string   `json:"type" binding:"oneof=domain_group domain process"`                               // 节点类型，domain_group 业务域分组，domain 业务域，process 业务活动
	Expand               bool     `json:"expand"`                                                                         // 是否能展开
	PathID               string   `json:"path_id" binding:"lte=4294967295"`                                               // 路径ID
	Path                 string   `json:"path" binding:"lte=4294967295"`                                                  // 路径
	ModelCnt             int      `json:"model_cnt"`                                                                      // 关联的业务模型数量
	DataModelCnt         int      `json:"data_model_cnt"`                                                                 // 关联的数据模型数量
	ProcessCnt           int      `json:"process_cnt"`                                                                    // 流程数量
	ModelID              string   `json:"model_id" binding:"uuid"`                                                        // 关联的模型id
	ModelName            string   `json:"model_name" binding:"VerifyName128NoSpace"`                                      // 业务模型名称
	ModelLocked          bool     `json:"model_locked"`                                                                   // 业务模型是否被锁
	DataModelID          string   `json:"data_model_id" binding:"uuid"`                                                   // 关联的模型id
	DataModelName        string   `json:"data_model_name" binding:"VerifyName128NoSpace"`                                 // 业务模型名称
	DataModelLocked      bool     `json:"data_model_locked"`                                                              // 业务模型是否被锁
	ModelPublishedStatus string   `json:"model_published_status" form:"model_published_status" example:"published"`       // 审核状态published已上线,
	DepartmentID         string   `json:"department_id" binding:"uuid"`                                                   // 关联的部门id
	DepartmentName       string   `json:"department_name" binding:"VerifyName128NoSpace"`                                 // 关联的部门名称
	DepartmentIDPath     string   `json:"department_id_path" binding:"lte=4294967295"`                                    //部门的ID path
	DepartmentNamePath   string   `json:"department_name_path" binding:"lte=4294967295"`                                  //部门的name path
	BusinessSystem       []string `json:"business_system" binding:"dive,uuid,unique"`                                     // 信息系统
	BusinessSystemName   []string `json:"business_system_name" binding:"dive,VerifyName128NoSpace"`                       // 信息系统名字
	ParentType           string   `json:"parent_type" binding:"oneof=domain_group domain process"`                        //父节点类型
	ParentID             string   `json:"parent_id" binding:"uuid"`                                                       //父节点id
	ParentName           string   `json:"parent_name" binding:"VerifyName128NoSpace"`                                     //父节点name
	AuditStatus          string   `json:"audit_status" form:"audit_status" binding:"required,max=10" example:"published"` // 审核状态published已上线,
	RejectReason         string   `json:"reject_reason" form:"reject_reason"`                                             // 驳回原因
	HasDraft             bool     `json:"has_draft"  example:"true"`                                                      // 是否有草稿
	PublishedStatus      string   `json:"published_status" form:"published_status" example:"published"`                   // 审核状态published已上线,
	CreatedAt            int64    `json:"created_at" binding:"required"`                                                  // 创建时间
	CreatedBy            string   `json:"created_by" binding:"uuid"`                                                      // 创建用户ID
	UpdatedAt            int64    `json:"updated_at" binding:"required"`                                                  // 更新时间
	UpdatedBy            string   `json:"updated_by" binding:"uuid"`                                                      // 更新用户ID
	TaskID               string   `json:"task_id"`                                                                        // 任务id，为空表示未关联任务
}

type DiagnosisInfos struct {
	Entries    []*Diagnosis `json:"entries"`
	TotalCount int64        `json:"total_count"`
}

type Diagnosis struct {
	// 业务诊断的 ID
	ID uuid.UUID `json:"id" binding:"required,uuid"`
	// 业务诊断的名称
	Name string `json:"name" binding:"required,VerifyName128NoSpace"`
	// 业务诊断的创建者的 ID
	Creator uuid.UUID `json:"creator" binding:"required,uuid"`
	// 业务诊断的创建者的名称
	CreatorName string `json:"creator_name" binding:"required,max=255"`
	// 业务诊断所包含的业务流程的 ID 列表
	Processes []uuid.UUID `json:"processes" binding:"min=1,max=99,unique,dive,uuid"`
	// 业务诊断是否被取消
	Canceled bool `json:"canceled"`
	// 业务诊断处于此 phase 的原因的消息信息。
	Message string `json:"message" binding:"max=65535"`
	//审核状态
	AuditStatus string `json:"audit_status" form:"audit_status" binding:"required,max=10" example:"published"`
	//驳回的原因
	RejectReason string `json:"reject_reason" form:"reject_reason"`
	// 失败的技术原因
	TechnicalMessage string `json:"technical_message" binding:"max=65535"`
}
