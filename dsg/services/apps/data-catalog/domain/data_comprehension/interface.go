package data_comprehension

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type ComprehensionDomain interface {
	//Config(ctx context.Context) *Configuration                                                       //获取数据理解维度配置
	Upsert(ctx context.Context, req *ComprehensionUpsertReq) (*ComprehensionDetail, error)                //插入或者更新维度理解
	Detail(ctx context.Context, catalogId uint64, queryReq *ReqQueryParams) (*ComprehensionDetail, error) //获取理解详情
	Delete(ctx context.Context, catalogId uint64) error                                                   // 删除理解重置理解
	GetCatalogListInfo(ctx context.Context, catalogIds []uint64) (map[uint64]CatalogListInfo, error)      //获取编目列表所需的信息
	UpdateMark(ctx context.Context, catalogId uint64, taskId string) error
	UpsertResults(ctx context.Context, ds []*ComprehensionResult) (*ComprehensionDetail, error) //  导入数据理解信息
	TemplateNameExist(ctx context.Context, req *TemplateNameExistReq) error
	CreateTemplate(ctx context.Context, ds *TemplateReq, tx ...*gorm.DB) (string, error)
	UpdateTemplate(ctx context.Context, ds *UpdateTemplateReq) (err error)
	GetTemplateList(ctx context.Context, req *GetTemplateListReq) (*GetTemplateListRes, error)
	GetTemplateDetail(ctx context.Context, req *GetTemplateDetailReq) (res *GetTemplateDetailRes, err error)
	GetTemplateConfig(ctx context.Context, templateID string) (*Configuration, error)
	//GetDataComprehensionList(ctx context.Context, ids []string) (res *GetTaskCatalogListRes, err error)
	GetTaskCatalogList(ctx context.Context, req *GetTaskCatalogListReq) (*GetTaskCatalogListRes, error)
	DeleteTemplate(ctx context.Context, req *IDRequired) (err error)
	GetReportList(ctx context.Context, req *GetReportListReq) (*GetReportListRes, error)
	GetCatalogList(ctx context.Context, req *GetCatalogListReq) (*GetCatalogListRes, error)
}

const (
	NotComprehend = 1 //未生成
	Comprehended  = 2 //已通过
	Auditing      = 3 //审批中
	Refuse        = 4 //审批未通过
	WaitOnline    = 5 //待上线
)
const ComprehensionReportAuditType = "af-data-comprehension-report" //数据理解报告
const (
	AllNoChange = 1
	TaskChange  = 2
	ModelChange = 3
	AllChange   = 4
)

/************Upsert 接口*************/

// ComprehensionUpsertReq 理解的创建请求体
type ComprehensionUpsertReq struct {
	ReqPathParams
	CatalogCode      string           `json:"catalog_code" binding:"required" example:""`                    //数据目录的code
	Operation        string           `json:"operation" binding:"required,oneof=save upsert" example:"save"` //操作，是保存还是更新插入
	DimensionConfigs []*ConfigContent `json:"dimension_configs"  binding:"required"`                         //维度配置详情，属性结构
	ColumnComments   []ColumnComment  `json:"column_comments" binding:"required"`                            //字段注释理解
	TemplateID       string           `json:"template_id" binding:"omitempty,uuid"`                          //数据理解模板id
	TaskId           string           `json:"task_id" binding:"omitempty,uuid"`                              //任务ID
	Updater          string           `json:"-"`                                                             //更新用户名称
	UpdaterId        string           `json:"-"`                                                             //更新用户ID
	Mark             int8             `json:"-"`                                                             //红点标记参数
	Configuration    *Configuration   `json:"-"`
	CatalogCreate    bool             `json:"catalog_create"` //目录创建报告
}

func (c *ComprehensionUpsertReq) Comprehension(content string) *model.DataComprehensionDetail {
	return &model.DataComprehensionDetail{
		CatalogID:   c.CatalogID.Uint64(),
		TemplateID:  c.TemplateID,
		TaskId:      c.TaskId,
		Code:        c.CatalogCode,
		Mark:        c.Mark,
		Status:      NotComprehend,
		Details:     content,
		CreatorUID:  c.UpdaterId,
		CreatorName: c.Updater,
		UpdaterUID:  c.UpdaterId,
		UpdaterName: c.Updater,
	}
}

// ConfigContent  upsert理解的参数
type ConfigContent struct {
	Id        string           `json:"id" binding:"required"` //配置的ID
	Children  []*ConfigContent `json:"children"`              //子维度,，叶子节点没有Children配置
	Content   any              `json:"content"`               //具体的配置, 非叶子节点没有该配置
	AIContent any              `json:"ai_content"`            //AI理解, 非叶子节点没有该配置
}

// Detail 根据用户填写的配置，得出详细的理解+配置
func (c *ConfigContent) Detail(configMap map[string]*DimensionConfig) *DimensionConfig {
	nc, ok := configMap[c.Id]
	if !ok {
		return nil
	}
	newNc := new(DimensionConfig)
	copier.Copy(newNc, nc)

	cs := make([]*DimensionConfig, 0)
	for _, child := range c.Children {
		if detail := child.Detail(configMap); detail != nil {
			cs = append(cs, detail)
		}
	}
	newNc.Children = cs
	if newNc.IsLeaf() {
		if newNc.Detail == nil {
			newNc.Detail = &DimensionDetail{}
		}
		newNc.Detail.Content = c.Content
		newNc.Detail.AIContent = c.AIContent
	}
	return newNc
}

// ColumnComment  信息项详情
type ColumnComment struct {
	ID         models.ModelID `json:"id" example:"1"`             //字段ID
	ColumnName string         `json:"column_name" example:"name"` //字段名称
	NameCN     string         `json:"name_cn" example:"字段中文名称"`   //字段中文名称
	DataFormat int32          `json:"data_format" example:"1"`    //字段类型
	Comment    string         `json:"comment"`                    //字段注释理解
	AIComment  string         `json:"ai_comment"`                 //AI生成的理解
	Error      string         `json:"error,omitempty"`            //检查生成的错误
	Sync       bool           `json:"sync" example:"false"`       //是否同步到数据资产中心的字段理解
}

/************Detail 接口*************/

// ReqPathParams detail接口路径参数
type ReqPathParams struct {
	CatalogID models.ModelID `json:"catalog_id" uri:"catalog_id" binding:"required,VerifyModelID" example:"1"` //目录ID，路径参数
}
type ReqQueryParams struct {
	TemplateID string `json:"template_id" form:"template_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据理解模板id
	//TaskId     string `json:"task_id"  form:"task_id" binding:"omitempty,uuid"`                                                       //任务ID
}

// ComprehensionDetail 理解的请求体详情
type ComprehensionDetail struct {
	CatalogID               models.ModelID      `json:"catalog_id"`               //编目ID
	CatalogCode             string              `json:"catalog_code"`             //编目code
	CatalogInfo             *CatalogInfo        `json:"catalog_info"`             //数据编目相关信息
	Note                    string              `json:"note"`                     //数据理解提示语
	Status                  int8                `json:"status"`                   //编目状态
	AuditAdvice             string              `json:"audit_advice"`             //审核意见，仅驳回时有用
	UpdatedAt               int64               `json:"updated_at"`               // 更新时间
	ComprehensionDimensions []*DimensionConfig  `json:"comprehension_dimensions"` //数据理解详情
	ColumnComments          []ColumnComment     `json:"column_comments"`          //字段注释理解
	Choices                 map[string][]Choice `json:"choices"`
	Icons                   map[string]string   `json:"icons"` // icon
}

func (c *ComprehensionDetail) GetDimensionConfigIds(configs []*DimensionConfig) []string {
	ids := make([]string, 0)
	if len(configs) == 0 {
		return ids
	}
	for _, config := range configs {
		if len(config.Children) != 0 {
			ids = append(ids, c.GetDimensionConfigIds(config.Children)...)
		}
		ids = append(ids, config.Id)
	}
	return ids
}

// CatalogInfo 编目信息
type CatalogInfo struct {
	ID              models.ModelID        `json:"id"`              //编目ID
	DepartmentInfos []*common.SummaryInfo `json:"department_path"` //部门处室
	Name            string                `json:"name"`            //目录中文名称
	NameEn          string                `json:"name_en"`         //目录英文名称
	//BusinessDuties  []string              `json:"business_duties"` //业务职责
	//BaseWorks       []string              `json:"base_works"`      //开展工作
	UpdateCycle int32  `json:"update_cycle"` //更新周期
	TableName   string `json:"table_name"`   //挂载的表名
	TableId     string `json:"table_id"`     //挂载资源id
	TableDesc   string `json:"table_desc"`   //表含义
	UpdatedAt   int64  `json:"updated_at"`   //理解更新人
	UpdaterUID  string `json:"updater_uid"`  //理解更新时间
	UpdaterName string `json:"updater_name"` //更新用户名称
}

// DepartmentInfo 部门信息
type DepartmentInfo struct {
	Id     string `json:"id"`      //部门ID
	Name   string `json:"name"`    //部门名称
	Type   string `json:"type"`    //部门类型
	Path   string `json:"path"`    //路径
	PathId string `json:"path_id"` //路径ID
}

/*---------获取列表所需信息的接口GetCatalogListInfo-----------*/

type CatalogListInfo struct {
	ID               models.ModelID `json:"id"` // 编目ID
	Code             string         `json:"code"`
	MountSourceName  string         `json:"mount_source_name"`          // 挂载的数据表名称
	ExceptionMessage string         `json:"exception_message"`          // 异常信息
	Mark             int8           `json:"mark"`                       // 是否有理解变更，红点逻辑
	Status           int8           `json:"status"`                     // 理解状态
	Creator          string         `json:"creator"`                    // 理解创建人
	CreatorUID       string         `json:"creator_uid"`                // 理解创建人ID
	CreatedTime      int64          `json:"comprehension_created_time"` // 理解创建时间
	UpdateBy         string         `json:"update_by"`                  // 理解更新人
	UpdateByUID      string         `json:"update_by_uid"`              // 理解更新人ID
	UpdateTime       int64          `json:"comprehension_update_time"`  // 理解更新时间
}

type ComprehensionDetailModel struct {
	CatalogID   uint64              `json:"catalog_id"`             // 唯一id，雪花算法
	Code        string              `json:"code"`                   // 数据目录编码
	Mark        int8                `json:"mark"`                   // 是否有更新的标记，1任务更新，2编目更新，3都更新，4都没有更新
	Status      int8                `json:"status"`                 // 理解状态
	Details     ComprehensionDetail `json:"details"`                // json类型字段，数据理解详情
	CreatedAt   *util.Time          `json:"created_at"`             // 创建时间
	CreatorUID  string              `json:"creator_uid,omitempty"`  // 创建用户ID
	CreatorName string              `json:"creator_name,omitempty"` // 创建用户名称
	UpdatedAt   *util.Time          `json:"updated_at"`             // 更新时间
	UpdaterUID  string              `json:"updater_uid,omitempty"`  // 更新用户ID
	UpdaterName string              `json:"updater_name,omitempty"` // 更新用户名称
}

/*---------------红点消除接口---------*/

// MarkReqArgs  红点消除接口参数
type MarkReqArgs struct {
	TaskId    string         `json:"task_id" binding:"omitempty"`               //任务ID
	CatalogID models.ModelID `json:"catalog_id" binding:"required" example:"1"` //编目ID
}

/*----- AI相关的接口----*/

// CatalogInfoDetail 理解的请求体详情
type CatalogInfoDetail struct {
	ID          models.ModelID `json:"id"`           //编目ID
	Code        string         `json:"code"`         //编目code
	Title       string         `json:"title"`        //目录中文名称
	UpdateCycle int32          `json:"update_cycle"` //更新周期
	TableName   string         `json:"table_name"`   //挂载的标名
	TableId     uint64         `json:"table_id"`     //标准表的ID
	//DataKind            int32              `json:"data_kind"`                  //基础信息分类
	DataRange           string             `json:"data_range"`                 //数据范围
	Description         string             `json:"table_desc"`                 //表含义
	DataSourceID        string             `json:"data_source_id"`             //数据源ID
	DataSourceName      string             `json:"data_source_name"`           //数据源名称
	SchemaID            string             `json:"schema_id"`                  //schema ID
	SchemaName          string             `json:"schema_name"`                //schema名称
	DataCatalogID       string             `json:"data_catalog_id"`            //数据源在虚拟化引擎这边的ID
	ColumnInfos         []ColumnInfo       `json:"column_info_slice"`          //字段信息
	BusinessObjectNames []string           `json:"business_object_name_slice"` //关联业务对象
	RelatedInfo         []string           `json:"related_info"`               //关联的标签
	ServiceDomain       []Choice           `json:"service_domain"`             //服务领域
	DepartmentInfo      common.SummaryInfo `json:"department_info"`            //当前部门处室
}

// ColumnInfo  信息项详情
type ColumnInfo struct {
	ID         models.ModelID `json:"id"`          //字段ID
	ColumnName string         `json:"column_name"` //字段名称
	NameCN     string         `json:"name_cn"`     //字段中文名称
	DataFormat string         `json:"data_format"` //字段类型
}

// ColumnInfoShort  信息项详情
type ColumnInfoShort struct {
	ColumnName string `json:"column_name"` //字段名称
	NameCN     string `json:"name_cn"`     //字段中文名称
	DataFormat string `json:"data_format"` //字段类型
}

func GenCatalogInfoDetail(catalogInfo *model.TDataCatalog) *CatalogInfoDetail {
	return &CatalogInfoDetail{
		ID:          models.NewModelID(catalogInfo.ID),
		Code:        catalogInfo.Code,
		Title:       catalogInfo.Title,
		UpdateCycle: catalogInfo.UpdateCycle,
		//DataKind:            catalogInfo.DataKind,
		Description:         catalogInfo.Description,
		BusinessObjectNames: []string{},
	}
}

type ComprehensionResult struct {
	CatalogId     models.ModelID         `json:"catalog_id"`
	Comprehension []*ComprehensionObject `json:"comprehension"`
}

type ComprehensionObject struct {
	Dimension string `json:"dimension"`
	Answer    []any  `json:"answer"`
}

//  Template

type IDRequired struct {
	ID string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}
type IDOmitempty struct {
	ID string `json:"id" form:"id" uri:"id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

//region TemplateNameExist

type TemplateNameExistReq struct {
	IDOmitempty
	Name string `form:"name" json:"name" binding:"required,min=1,max=255" example:"xxxx"` //理解模板名称
}

//region CreateTemplate

type TemplateReq struct {
	Name           string         `json:"name" binding:"required,min=1,max=255" example:"xxxx"`                    //理解模板名称
	Description    string         `json:"description" binding:"TrimSpace,omitempty,lte=300" example:"description"` //理解模板描述
	TemplateConfig TemplateConfig `json:"template_config" binding:"required"`                                      //理解模板配置
}
type TemplateConfig struct {
	BusinessObject *bool `json:"business_object"  binding:"required"` //业务对象

	//时间维度

	TimeRange              *bool `json:"time_range" binding:"required"`               //时间范围
	TimeFieldComprehension *bool `json:"time_field_comprehension" binding:"required"` //时间字段理解

	//空间维度

	SpatialRange              *bool `json:"spatial_range" binding:"required"`               //空间范围
	SpatialFieldComprehension *bool `json:"spatial_field_comprehension" binding:"required"` //空间字段理解

	BusinessSpecialDimension *bool `json:"business_special_dimension" binding:"required"` //业务特殊维度
	CompoundExpression       *bool `json:"compound_expression" binding:"required"`        //复合表达
	ServiceRange             *bool `json:"service_range" binding:"required"`              //服务范围
	ServiceAreas             *bool `json:"service_areas" binding:"required"`              //服务领域
	FrontSupport             *bool `json:"front_support" binding:"required"`              //正面支撑
	NegativeSupport          *bool `json:"negative_support" binding:"required"`           //负面支撑

	//业务规则

	ProtectControl *bool `json:"protect_control" binding:"required"` //保护/控制什么
	PromotePush    *bool `json:"promote_push" binding:"required"`    //促进/推动什么
}

//BusinessIndicator []string `json:"business_indicator" binding:"omitempty,oneof=时间范围 时间字段理解" example:"时间范围"` //业务指标
//BusinessRule []string `json:"business_rule"  binding:"omitempty,oneof=保护控制 促进推动" example:"保护控制"` //业务规则

//endregion

//region UpdateTemplate

type UpdateTemplateReq struct {
	IDRequired //理解模板ID
	TemplateReq
}

//endregion

//region GetTemplateList

type GetTemplateListReq struct {
	common_model.PageSortKeyword
}

type GetTemplateListRes struct {
	Entries    []*TemplateListRes `json:"entries"`
	TotalCount int64              `json:"total_count"`
}
type TemplateListRes struct {
	ID          string `json:"id"`           //理解模板id
	Name        string `json:"name"`         //理解模板名称
	Description string `json:"description"`  //理解模板描述
	UpdatedAt   int64  `json:"updated_at"`   // 更新时间
	UpdatedUID  string `json:"updated_uid"`  // 更新人id
	UpdatedUser string `json:"updated_user"` // 更新人
	RelationTag bool   `json:"relation_tag"` //是否关联“未完成”数据理解任务
}

//endregion

//region GetTemplateDetail

type GetTemplateDetailReq struct {
	IDRequired //理解模板ID
}

type GetTemplateDetailRes struct {
	TemplateReq
}

//endregion

//region GetTemplateConfig

type GetTemplateConfigReq struct {
	IDRequired //理解模板ID
}

type GetTemplateConfigRes struct {
}

//endregion

//region GetDataComprehensionList

type GetDataComprehensionListReq struct {
	IDs []string `json:"ids" form:"ids" uri:"ids" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}
type GetDataComprehensionListRes struct {
	CatalogName             string `json:"catalog_name"`              //数据目录名称
	CatalogDescription      string `json:"catalog_description"`       //数据目录描述
	ViewName                string `json:"view_name"`                 //视图名称
	ReportStatus            string `json:"report_status"`             //报告状态
	ComprehensionCreateUser string `json:"comprehension_create_user"` //理解创建人
	ComprehensionUpdateTime string `json:"comprehension_update_time"` //理建更新时间
}

//endregion
//region GetTaskCatalogList

type GetTaskCatalogListReq struct {
	ID string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //任务id
}
type GetTaskCatalogListRes struct {
	CatalogList []*CatalogList `json:"entries"`
	TemplateID  string         `json:"template_id"` // 数据理解模板id
}
type CatalogList struct {
	CatalogID               string `json:"catalog_id"`                //数据目录id
	CatalogName             string `json:"catalog_name"`              //数据目录名称
	CatalogDescription      string `json:"catalog_description"`       //数据目录描述
	ViewName                string `json:"view_name"`                 //视图名称
	ReportStatus            int8   `json:"report_status"`             //报告状态  1未生成，2已通过,3审批中，4审批未通过
	ComprehensionCreateUser string `json:"comprehension_create_user"` //理解创建人
	ComprehensionUpdateTime int64  `json:"comprehension_update_time"` //理建更新时间
}

//endregion

//region GetReportList

type GetReportListReq struct {
	common_model.PageSortKeyword
	DepartmentID      string   `json:"department_id" form:"department_id"`           // 部门id
	SubDepartmentIDs  []string `json:"-"`                                            // 部门的子部门id
	CurrentDepartment *bool    `json:"current_department" form:"current_department"` // 本部门
}

type GetReportListRes struct {
	Entries    []*ReportList `json:"entries"`
	TotalCount int64         `json:"total_count"`
}
type ReportList struct {
	CatalogId      string `json:"catalog_id"`
	CatalogName    string `json:"catalog_name"`
	TemplateID     string `json:"template_id"`     // 数据理解模板id
	TaskId         string `json:"task_id"`         // 数据理解任务id
	CreatedUID     string `json:"updated_uid"`     // 创建人id
	CreatedUser    string `json:"updated_user"`    // 创建人
	UpdatedAt      int64  `json:"updated_at"`      // 更新时间
	DepartmentId   string `json:"department_id"`   // 所属部门id
	Department     string `json:"department"`      // 所属部门
	DepartmentPath string `json:"department_path"` // 所属部门路径
}

//endregion

//region GetCatalogList

type GetCatalogListReq struct {
	common_model.PageSortKeyword
	OnlineStatus string `json:"online_status" form:"online_status"` // 上线状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject
}

type GetCatalogListRes struct {
	Entries    []*Catalog `json:"entries"`
	TotalCount int64      `json:"total_count"`
}
type Catalog struct {
	CatalogId   string `gorm:"column:catalog_id" json:"catalog_id"`
	CatalogName string `gorm:"column:catalog_name" json:"catalog_name"`
}

//endregion
