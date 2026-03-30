package data_resource_catalog

import (
	"context"
	"errors"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"

	"github.com/kweaver-ai/idrm-go-common/rest/virtual_engine"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/task_center"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
)

type DataResourceCatalogDomain interface {
	SaveDataCatalogDraft(ctx context.Context, req *SaveDataCatalogDraftReqBody) (resp *IDResp, err error)
	SaveDataCatalog(ctx context.Context, req *SaveDataCatalogReqBody) (resp *IDResp, err error)
	ImportDataCatalog(ctx context.Context, formFile *multipart.FileHeader) (res *ImportDataCatalogRes, err error)
	GetDataCatalogList(ctx context.Context, req *GetDataCatalogList) (*DataCatalogRes, error)
	FrontendGetDataCatalogDetail(ctx context.Context, catalogID uint64) (*FrontendCatalogDetail, error)
	GetDataCatalogDetail(ctx context.Context, catalogID uint64) (*CatalogDetailRes, error)
	GetDataCatalogColumns(ctx context.Context, req CatalogColumnPageInfo) (*GetDataCatalogColumnsRes, error)
	GetDataCatalogColumnsByViewID(ctx context.Context, id string) ([]*ColumnInfo, error)
	GetDataCatalogMountList(ctx context.Context, catalogID uint64) (*GetDataCatalogMountListRes, error)
	GetResourceCatalogList(ctx context.Context, req *GetResourceCatalogListReq) (*GetResourceCatalogListRes, error)
	GetDataCatalogRelation(ctx context.Context, catalogID uint64) (*GetDataCatalogRelationRes, error)
	DeleteDataCatalog(ctx context.Context, catalogID uint64) error
	CheckRepeat(ctx context.Context, catalogID uint64, name string) (bool, error)
	CreateESIndex(ctx context.Context)
	CreateAuditInstance(ctx context.Context, req *CreateAuditInstanceReq) error
	AuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error
	PushCatalogToEs(ctx context.Context, req *PushCatalogToEsReq) error
	GetBriefList(ctx context.Context, catalogIdStr string) (datas []*model.TDataCatalog, err error)
	TotalOverview(ctx context.Context, req *TotalOverviewReq) (res *TotalOverviewRes, err error)
	//CollectDailyAuditRecords()
	StatisticsOverview(ctx context.Context, req *StatisticsOverviewReq) (res *StatisticsOverviewRes, err error)
	GetColumnListByIds(ctx context.Context, req *GetColumnListByIdsReq) (*GetColumnListByIdsResp, error)
	GetDataCatalogTask(ctx context.Context, catalogID uint64) (*GetDataCatalogTaskResp, error)
	UpdateApplyNum(ctx context.Context, req *EsIndexApplyNumUpdateMsg) error
	UpdateApplyNumComplete(ctx context.Context, req *EsIndexApplyNumUpdateMsg) error
	CreateDataCatalogApply(ctx context.Context, catalogID uint64, applyNum int32) error
	GetSampleData(ctx context.Context, req *CatalogIDRequired) (*GetSampleDataRes, error)
	DataGetOverview(ctx context.Context, req *DataGetOverviewReq) (res *DataGetOverviewRes, err error)
	DataGetDepartmentDetail(ctx context.Context, req *DataGetDepartmentDetailReq) (res *DataGetDepartmentDetailRes, err error)
	DataGetAggregationOverview(ctx context.Context, req *DataGetDepartmentDetailReq) (res *DataGetAggregationOverviewRes, err error)
	DataAssetsOverview(ctx context.Context, req *DataAssetsOverviewReq) (res *DataAssetsOverviewRes, err error)
	DataAssetsDetail(ctx context.Context, req *DataAssetsDetailReq) (res *DataAssetsDetailRes, err error)
	DataUnderstandOverview(ctx context.Context, req *DataUnderstandOverviewReq) (res *DataUnderstandOverviewRes, err error)
	DataUnderstandDepartTopOverview(ctx context.Context, req *DataUnderstandDepartTopOverviewReq) (res *DataUnderstandDepartTopOverviewRes, err error)
	DataUnderstandDomainOverview(ctx context.Context, req *DataUnderstandDomainOverviewReq) (res *DataUnderstandDomainOverviewRes, err error)
	DataUnderstandTaskDetailOverview(ctx context.Context, req *DataUnderstandTaskDetailOverviewReq) (res *DataUnderstandTaskDetailOverviewRes, err error)
	DataUnderstandDepartDetailOverview(ctx context.Context, req *DataUnderstandDepartDetailOverviewReq) (res *DataUnderstandDepartDetailOverviewRes, err error)
}
type DataResourceCatalogInternal interface {
	GenEsEntity(ctx context.Context, catalogID uint64) ([]*es.MountResources, []*es.BusinessObject, []*es.CateInfo, []*model.TDataCatalogColumn, error)
}

// region common

type IDStrRequired struct {
	ID string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"1"`
}

type IDRequired struct {
	ID models.ModelID `json:"id" form:"id" uri:"id" binding:"required,VerifyModelID" example:"1"`
}
type IDOmitempty struct {
	ID models.ModelID `json:"id" form:"id" uri:"id" binding:"omitempty,VerifyModelID" example:"1"`
}
type CatalogIDRequired struct {
	CatalogID models.ModelID `json:"catalog_id" form:"catalog_id" uri:"catalog_id" binding:"required,VerifyModelID" example:"1"` //目录ID
}
type CatalogIDOmitempty struct {
	CatalogID models.ModelID `json:"catalog_id" form:"catalog_id" uri:"catalog_id" binding:"omitempty,VerifyModelID" example:"1"`
}

type CatalogInfoDraft struct {
	Name                  string   `json:"name" binding:"required,VerifyNameStandard" example:"数据资源目录名称"`                   // 数据资源目录名称
	SourceDepartmentID    string   `json:"source_department_id" binding:"omitempty,uuid"`                                   // 数据资源来源部门id ;上报 数据提供方
	DepartmentID          string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" `                    // 所属部门id
	InfoSystemID          string   `json:"info_system_id" form:"info_system_id" binding:"omitempty,uuid"`                   // 信息系统id
	SubjectID             []string `json:"subject_id" form:"subject_id" binding:"omitempty,dive,uuid"`                      // 所属主题id
	AppSceneClassify      *int8    `json:"app_scene_classify"  binding:"omitempty,oneof=1 2 3 4" example:"4"`               // 应用场景分类 1 政务服务、2 公共服务、3 监管、4 其他 ;上报应用场景
	OtherAppSceneClassify string   `json:"other_app_scene_classify"  binding:"omitempty,max=300" example:"分类"`              // 其他应用场景分类
	DataRelatedMatters    string   `json:"data_related_matters"  binding:"omitempty,VerifyDataRelatedMatters" example:"事项"` // 数据所属事项
	BusinessMatters       []string `json:"business_matters"  binding:"omitempty" example:"业务事项"`                            // 业务事项,替代data_related_matters
	DataRange             int32    `json:"data_range" binding:"omitempty,oneof=1 2 3 4 5 6 7" example:"1"`                  // 数据范围：1-全国 2-全省 3-各市（州） 4-全市（州） 5-各区（县） 6-全区（县） 7-其他 ;上报 数据区域范围
	UpdateCycle           int32    `json:"update_cycle" binding:"omitempty,min=1,max=8" example:"1"`                        // 更新频率 参考数据字典：GXZQ，1实时 2每日 3每周 4每月 5每季度 6每半年 7每年 8其他
	OtherUpdateCycle      string   `json:"other_update_cycle" binding:"omitempty,max=300" example:""`                       // 其他更新频率
	DataClassify          string   `json:"data_classify" binding:"omitempty"`                                               // 数据分级【标签】
	Description           string   `json:"description" binding:"omitempty,VerifyDescription,max=1000" example:"描述"`         // 数据资源目录描述
	IsImport              bool     `json:"-"`                                                                               // 是否导入
	ReportInfo                     //上报属性
}
type CatalogInfo struct {
	Name                  string   `json:"name" binding:"required,VerifyNameStandard" example:"数据资源目录名称"`                                                // 数据资源目录名称
	SourceDepartmentID    string   `json:"source_department_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`                 // 数据资源来源部门id  ;上报 数据提供方
	DepartmentID          string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`   // 所属部门id
	InfoSystemID          string   `json:"info_system_id" form:"info_system_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 信息系统id
	SubjectID             []string `json:"subject_id" form:"subject_id" binding:"required,dive,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`     // 所属主题id
	AppSceneClassify      *int8    `json:"app_scene_classify"  binding:"omitempty,oneof=1 2 3 4" example:"4"`                                            // 应用场景分类 1 政务服务、2 公共服务、3 监管、4 其他;上报应用场景
	OtherAppSceneClassify string   `json:"other_app_scene_classify"  binding:"max=300" example:"分类"`                                                     // 其他应用场景分类
	DataRelatedMatters    string   `json:"data_related_matters"  binding:"omitempty,VerifyDataRelatedMatters"  example:"事项"`                             // 数据所属事项
	BusinessMatters       []string `json:"business_matters"  binding:"required" example:"业务事项"`                                                          // 业务事项,替代data_related_matters
	DataRange             int32    `json:"data_range" binding:"omitempty,oneof=1 2 3 4 5 6 7" example:"1"`                                               // 数据范围：1-全国 2-全省 3-各市（州） 4-全市（州） 5-各区（县） 6-全区（县） 7-其他 ;上报 数据区域范围
	UpdateCycle           int32    `json:"update_cycle" binding:"omitempty,min=1,max=8" example:"1"`                                                     // 更新频率 参考数据字典：GXZQ，1实时 2每日 3每周 4每月 5每季度 6每半年 7每年 8其他
	OtherUpdateCycle      string   `json:"other_update_cycle" binding:"max=300" example:""`                                                              // 其他更新频率
	DataClassify          string   `json:"data_classify" binding:"required"`                                                                             // 数据分级【标签】
	Description           string   `json:"description" binding:"omitempty,VerifyDescription,max=1000" example:""`                                        // 数据资源目录描述
	ReportInfo                     //上报属性
}
type SharedOpenInfoDraft struct {
	SharedType      int8   `json:"shared_type" binding:"omitempty,oneof=1 2 3" example:"1"`                         // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition string `json:"shared_condition" binding:"omitempty,VerifyDescription,min=1,max=255" example:""` // 共享条件
	OpenType        int8   `json:"open_type" binding:"omitempty,oneof=1 2 3" example:"1"`                           // 开放属性 1 无条件开 2 有条件开 3 不予开
	OpenCondition   string `json:"open_condition" binding:"omitempty,VerifyDescription,max=255" example:""`         // 开放条件
	SharedMode      int8   `json:"shared_mode" binding:"omitempty,oneof=1 2 3" example:"1"`                         // 共享方式 1 共享平台方式 2 邮件方式 3 介质方式
}
type SharedOpenInfo struct {
	SharedType      int8   `json:"shared_type" binding:"required,oneof=1 2 3" example:"1"`                                                       // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition string `json:"shared_condition" binding:"required_unless=SharedType 1,omitempty,VerifyDescription,min=1,max=255" example:""` // 共享条件
	OpenType        int8   `json:"open_type" binding:"required,oneof=1 2 3" example:"1"`                                                         // 开放属性 1 无条件开 2 有条件开 3 不予开
	OpenCondition   string `json:"open_condition" binding:"omitempty,VerifyDescription,max=255" example:""`                                      // 开放条件
	SharedMode      int8   `json:"shared_mode" binding:"omitempty,oneof=1 2 3" example:"1"`                                                      // 共享方式 1 共享平台方式 2 邮件方式 3 介质方式
}
type MoreInfoDraft struct {
	PhysicalDeletion    *int8  `json:"physical_deletion" binding:"omitempty,oneof=0 1" example:"0"`      // 挂接实体资源是否存在物理删除(1 是 ; 0 否)
	SyncMechanism       int8   `json:"sync_mechanism" binding:"omitempty,oneof=1 2" example:"2"`         // 数据同步机制(1 增量 ; 2 全量)
	SyncFrequency       string `json:"sync_frequency" binding:"omitempty,max=128" example:""`            // 同步频率
	PublishFlag         *int8  `json:"publish_flag" binding:"omitempty,omitempty,oneof=0 1" example:"0"` // 是否发布到超市 (1 是 ; 0 否)
	OperationAuthorized *int8  `json:"operation_authorized" binding:"omitempty,oneof=0 1" example:"0"`   //是否可授权运营字段
}
type MoreInfo struct {
	PhysicalDeletion    *int8  `json:"physical_deletion" binding:"omitempty,oneof=0 1" example:"0"`     // 挂接实体资源是否存在物理删除(1 是 ; 0 否)
	SyncMechanism       int8   `json:"sync_mechanism" binding:"omitempty,oneof=1 2" example:"2"`        // 数据归集机制(1 增量 ; 2 全量)
	SyncFrequency       string `json:"sync_frequency" binding:"omitempty,max=128" example:""`           // 同步频率
	PublishFlag         *int8  `json:"publish_flag" binding:"required,omitempty,oneof=0 1" example:"1"` // 是否发布到超市 (1 是 ; 0 否)
	OperationAuthorized *int8  `json:"operation_authorized" binding:"required,oneof=0 1" example:"0"`   //是否可授权运营字段
}

type ImportDataCatalogRes struct {
	SuccessCreateCatalog      []*SuccessCatalog `json:"success_create_catalog"`       // 成功创建的目录
	FailCreateCatalog         []*FailCatalog    `json:"fail_create_catalog"`          // 失败创建的目录
	SuccessCreateCatalogCount int               `json:"success_create_catalog_count"` // 成功创建的目录数量
	FailCreateCatalogCount    int               `json:"fail_create_catalog_count"`    // 失败创建的目录数量
}
type SuccessCatalog struct {
	Name string `json:"name"` // 名称
	Id   string `json:"id"`   // id
}
type FailCatalog struct {
	Name  string         `json:"name"`  // 名称
	Error ginx.HttpError `json:"error"` //错误
}
type ColumnInterface interface {
	GetDataFormat() (int32, error)
	GetDataLength() *int32
	GetDataPrecision() *int32
}

func CheckColumnValid[T ColumnInfoDraft | ColumnInfo](columns []*T) error {
	for i := range columns {
		if v, ok := any(*columns[i]).(ColumnInterface); ok {
			dataFormat, err := v.GetDataFormat()
			if err != nil {
				return errorcode.Detail(errorcode.PublicInvalidParameter, "字段类型不能为空")
			}
			switch dataFormat {
			case 8:
				l := v.GetDataLength()
				if l == nil {
					return errorcode.Detail(errorcode.PublicInvalidParameter, "高精度型数据长度不能为空")
				}
				if *l > 38 {
					return errorcode.Detail(errorcode.PublicInvalidParameter, "高精度型数据长度必须 1~38 之间的整数")
				}
				p := v.GetDataPrecision()
				if p == nil {
					return errorcode.Detail(errorcode.PublicInvalidParameter, "高精度型数据精度不能为空")
				}
				if *p > *l {
					return errorcode.Detail(errorcode.PublicInvalidParameter, "高精度型数据精度不能大于数据长度")
				}
			default:
				break
			}
		} else {
			return errors.New("invalid param type")
		}
	}
	return nil
}

func DataLengthPrecisionProc[T ColumnInfoDraft | ColumnInfo](columns *T) (length *int32, precision *int32) {
	if v, ok := any(*columns).(ColumnInterface); ok {
		dataFormat, _ := v.GetDataFormat()
		switch dataFormat {
		case 1: // 字符型
			length = v.GetDataLength()
		case 8: // 高精度型
			length = v.GetDataLength()
			precision = v.GetDataPrecision()
		}
	}
	return length, precision
}

type ColumnInfoDraft struct {
	IDOmitempty
	BusinessName  string `json:"business_name" binding:"required,min=1,max=255" example:"业务名称"`     // 信息项业务名称
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=255" example:"技术名称"`    // 信息项技术名称
	SourceID      string `json:"source_id" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`          // 来源id
	StandardCode  string `json:"standard_code"`                                                     // 关联数据标准code
	CodeTableID   string `json:"code_table_id"`                                                     // 关联码表IDe
	DataFormat    *int32 `json:"data_type" binding:"omitempty,oneof=0 1 2 3 5 6 7 8 9" example:"1"` // 字段类型 0:数字型 1:字符型 2:日期型 3:日期时间型 5:布尔型 6:其他 7:小数型 8:高精度型 9:时间型
	DataLength    *int32 `json:"data_length" binding:"omitempty,gte=1,lte=65535" example:"255"`     // 数据长度
	DataPrecision *int32 `json:"data_precision" binding:"omitempty,gte=0,lte=38" example:"38"`      // 数据精度
	DataRange     string `json:"data_range" binding:"omitempty,VerifyRange" example:""`             // 数据值域 中英文、数字、下划线及中划线，且不能以下划线和中划线开头 128个字符
	SharedType    int8   `json:"shared_type" binding:"omitempty,oneof=1 2 3" example:"1"`           // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	//SharedCondition string `json:"shared_condition" binding:"omitempty,VerifyDescription,min=1,max=255" example:""` // 共享条件
	OpenType       int8   `json:"open_type" binding:"omitempty,oneof=1 2 3" example:"1"`                   // 开放属性 1 无条件开 2 有条件开 3 不予开
	OpenCondition  string `json:"open_condition" binding:"omitempty,VerifyDescription,max=255" example:""` // 开放条件
	ClassifiedFlag *int16 `json:"classified_flag" binding:"required,oneof=0 1" example:"0"`                // 是否涉密属性(1 是 ; 0 否)
	SensitiveFlag  *int16 `json:"sensitive_flag" binding:"required,oneof=0 1" example:"0"`                 // 是否敏感属性(1 是 ; 0 否)
	TimestampFlag  *int16 `json:"timestamp_flag" binding:"omitempty,oneof=0 1" example:"0"`                // 是否时间戳(1 是 ; 0 否)
	PrimaryFlag    *int16 `json:"primary_flag" binding:"omitempty,oneof=0 1" example:"0"`                  // 是否主键(1 是 ; 0 否)

	//上报属性
	ColumnReportInfo
}

func (c ColumnInfoDraft) GetDataFormat() (int32, error) {
	if c.DataFormat == nil {
		return 0, errors.New("invalid column data type")
	}
	return *c.DataFormat, nil
}

func (c ColumnInfoDraft) GetDataLength() *int32 {
	return c.DataLength
}

func (c ColumnInfoDraft) GetDataPrecision() *int32 {
	return c.DataPrecision
}

type ColumnInfo struct {
	IDOmitempty
	BusinessName  string `json:"business_name" binding:"required,min=1,max=255" example:"业务名称"`    // 信息项业务名称
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=255" example:"技术名称"`   // 信息项技术名称
	SourceID      string `json:"source_id" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`         // 来源id
	StandardCode  string `json:"standard_code"`                                                    // 关联数据标准code
	CodeTableID   string `json:"code_table_id"`                                                    // 关联码表IDe
	DataFormat    *int32 `json:"data_type" binding:"required,oneof=0 1 2 3 5 6 7 8 9" example:"1"` // 字段类型 0:数字型 1:字符型 2:日期型 3:日期时间型 5:布尔型 6:其他 7:小数型 8:高精度型 9:时间型
	DataLength    *int32 `json:"data_length" binding:"omitempty,gte=1,lte=65535" example:"255"`    // 数据长度
	DataPrecision *int32 `json:"data_precision" binding:"omitempty,gte=0,lte=38" example:"38"`     // 数据精度
	DataRange     string `json:"data_range" binding:"omitempty,VerifyRange" example:""`            // 数据值域 中英文、数字、下划线及中划线，且不能以下划线和中划线开头 128个字符
	SharedType    int8   `json:"shared_type" binding:"omitempty,oneof=1 2 3" example:"1"`          // 共享属性 1 无条件共享 2 有条件共享 3 不予共享  （省直达非必填，市必填）
	//SharedCondition string `json:"shared_condition" binding:"required_unless=SharedType 1,omitempty,VerifyDescription,min=1,max=255" example:""` // 共享条件
	OpenType       int8   `json:"open_type" binding:"required,oneof=1 2 3" example:"1"`                    // 开放属性 1 无条件开 2 有条件开 3 不予开
	OpenCondition  string `json:"open_condition" binding:"omitempty,VerifyDescription,max=255" example:""` // 开放条件
	ClassifiedFlag *int16 `json:"classified_flag" binding:"required,oneof=0 1" example:"0"`                // 是否涉密属性(1 是 ; 0 否)
	SensitiveFlag  *int16 `json:"sensitive_flag" binding:"required,oneof=0 1" example:"0"`                 // 是否敏感属性(1 是 ; 0 否)
	TimestampFlag  *int16 `json:"timestamp_flag" binding:"required,oneof=0 1" example:"0"`                 // 是否时间戳(1 是 ; 0 否)
	PrimaryFlag    *int16 `json:"primary_flag" binding:"required,oneof=0 1" example:"0"`                   // 是否主键(1 是 ; 0 否)
	Index          int    `json:"index" example:"1"`                                                       // 信息项顺序

	//上报属性
	ColumnReportInfo
}

func (c ColumnInfo) GetDataFormat() (int32, error) {
	if c.DataFormat == nil {
		return 0, errors.New("invalid column data type")
	}
	return *c.DataFormat, nil
}

func (c ColumnInfo) GetDataLength() *int32 {
	return c.DataLength
}

func (c ColumnInfo) GetDataPrecision() *int32 {
	return c.DataPrecision
}

type ColumnReportInfo struct {
	SourceTechnicalName string `json:"source_technical_name,omitempty"`                                   // 来源技术名称
	SourceSystemId      string `json:"source_system_id,omitempty"`                                        // 来源系统id
	SourceSystemSchema  string `json:"source_system_schema,omitempty"`                                    // 来源系统
	SourceSystemLevel   int32  `json:"source_system_level,omitempty" binding:"omitempty,oneof=1 2 3 4 5"` // 来源系统分级 1 自建自用 2 国直(国家部委统一平台) 3省直(省级统一平台) 4市直(市级统一平台) 5县直(县级统一平台)
	InfoItemLevel       string `json:"info_item_level"`                                                   // 信息项分级 自动分级
	SourceSystem        string `json:"source_system"`                                                     // 来源系统
}

// region MountResource

type MountResource struct {
	ResourceType int8   `json:"resource_type" binding:"required,oneof=1 3" example:"1"` // 挂接资源类型 1逻辑视图 2 接口（自动） 3 文件资源
	ResourceID   string `json:"resource_id" binding:"required"`                         // 挂接资源ID

	//上报属性
	MountResourceReportInfo
}

// 上报属性

type MountResourceReportInfo struct {
	SchedulingInfo         // 调度信息
	RequestFormat  string  `json:"request_format,omitempty" binding:"omitempty,oneof=application/json application/xml application/x-www-form-urlecoded multipart/form-data text/plain;charset=uft-8 others"`  // 服务请求报文格式application/json application/xml application/x-www-form-urlencoded multipart/form-data text/plain;charset-uft-8 others
	ResponseFormat string  `json:"response_format,omitempty" binding:"omitempty,oneof=application/json application/xml application/x-www-form-urlecoded multipart/form-data text/plain;charset=uft-8 others"` // 服务响应报文格式application/json application/xml application/x-www-form-urlencoded multipart/form-data text/plain;charset-uft-8 others
	RequestBody    []*Body `json:"request_body,omitempty"`                                                                                                                                                    // 请求体
	ResponseBody   []*Body `json:"response_body,omitempty"`                                                                                                                                                   // 响应体
}
type SchedulingInfo struct {
	SchedulingPlan int32  `json:"scheduling_plan,omitempty"  binding:"omitempty,oneof=1 2 3 4 5"`                         // 调度计划 1 一次性、2按分钟、3按天、4按周、5按月
	Interval       int32  `json:"interval,omitempty" binding:"required_if=SchedulingPlan 2 4 5,omitempty,min=1,max=60"`   // 间隔
	Time           string `json:"time,omitempty" binding:"required_if=SchedulingPlan 3 4 5,omitempty,ValidateTimeString"` // 时间
}
type Body struct {
	ID         string `json:"id"`
	Name       string `json:"name"`                                                                                       //参数名
	Type       string `json:"type" binding:"omitempty,oneof=int32 int64 float double byte binary date date-time boolean"` //int32 int64 float double byte binary date date-time boolean
	IsArray    bool   `json:"is_array"`                                                                                   //是否数组
	HasContent bool   `json:"has_content"`                                                                                //是否有内容
}

type MountResourceItem struct {
	ResourceType int8                 `json:"resource_type" binding:"required,oneof=1 2"` // 挂接资源类型 1逻辑视图 2 接口
	Entries      []*MountResourceBase `json:"entries" binding:"required,min=1,unique=ResourceID,dive"`
}
type MountResourceBase struct {
	ResourceID   string `json:"resource_id" binding:"required,min=1"`                     // 挂接资源ID
	ResourceName string `json:"resource_name" binding:"required,TrimSpace,min=1,max=255"` // 挂接资源名称
}

//endregion

type IDResp struct {
	ID string `json:"id"` // 资源对象ID
}

type Category struct {
	CategoryID     string `json:"category_id"  binding:"required,uuid"`      // 资源属性分类
	CategoryNodeID string `json:"category_node_id"  binding:"required,uuid"` // 资源属性分类节点id
}

//endregion

// region ReportInfo

type ReportInfo struct {
	DataDomain            int32  `json:"data_domain,omitempty" binding:"omitempty,min=1,max=27" example:"1"`                                                     // 数据所属领域
	DataLevel             int32  `json:"data_level,omitempty"  binding:"omitempty,min=1,max=4" example:"1"`                                                      // 数据所在层级
	TimeRange             string `json:"time_range,omitempty" example:""`                                                                                        // 数据时间范围
	ProviderChannel       int32  `json:"provider_channel,omitempty" binding:"omitempty,min=1,max=3" example:"1"`                                                 // 提供渠道
	AdministrativeCode    *int32 `json:"administrative_code,omitempty" binding:"omitempty,min=0,max=99" example:"1"`                                             // 行政区划代码
	CentralDepartmentCode int32  `json:"central_department_code,omitempty" binding:"omitempty,min=2,max=99" example:"1"`                                         // 中央业务指导部门代码
	ProcessingLevel       string `json:"processing_level,omitempty" binding:"omitempty,oneof=sjjgcd01 sjjgcd02 sjjgcd03 sjjgcd04 sjjgcd05 0" example:"sjjgcd01"` // 数据加工程度
	CatalogTag            int32  `json:"catalog_tag,omitempty"  binding:"omitempty,min=1,max=50" example:"1"`                                                    // 目录 标签
	IsElectronicProof     *bool  `json:"is_electronic_proof,omitempty" example:"true"`                                                                           // 是否电子证明编码
}

//endregion

// region SaveDataCatalogDraft

type SaveDataCatalogDraftReqBody struct {
	//UpdateOnly          bool               `json:"update_only"`
	CatalogIDOmitempty                     //目录ID,区分创建暂存 还是 已创建暂存
	CatalogInfoDraft                       //基本属性
	CategoryNodeIds     []string           `json:"category_node_ids"  binding:"omitempty,max=10,unique,dive,uuid"` // 资源属性分类节点id
	SharedOpenInfoDraft                    //共享开放信息
	Columns             []*ColumnInfoDraft `json:"columns" binding:"omitempty,unique=BusinessName,unique=TechnicalName,dive"` // 信息项
	MountResources      []*MountResource   `json:"mount_resources" binding:"omitempty,dive"`                                  // 挂接资源
	MoreInfoDraft                          //更多信息
}

//endregion

// region SaveDataCatalog

type SaveDataCatalogReqBody struct {
	UpdateOnly         bool             `json:"update_only"`
	CatalogIDOmitempty                  //目录ID,区分创建保存 还是 已创建保存
	CatalogInfo                         //基本属性
	CategoryNodeIds    []string         `json:"category_node_ids"  binding:"required,max=10,unique,dive,uuid"` // 资源属性分类节点id
	SharedOpenInfo                      //共享开放信息
	Columns            []*ColumnInfo    `json:"columns" binding:"omitempty,unique=BusinessName,unique=TechnicalName,dive"` // 关联信息项
	MountResources     []*MountResource `json:"mount_resources" binding:"required,min=1"`                                  // 挂接资源
	MoreInfo                            //更多信息
}

//endregion

// region GetDataCatalogList

type CatalogPageInfo struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                                        // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name apply_num published_at online_time" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序 apply_num 申请量
}
type GetDataCatalogList struct {
	CatalogPageInfo
	//ResourceType  *int8    `json:"resource_type" form:"resource_type" binding:"omitempty,oneof=1 2 3" example:"1"`                                                                                      // 资源类型 1逻辑视图 2 接口 3 文件资源
	OnlineStatus  []string `json:"online_status"  form:"online_status" binding:"omitempty,dive,oneof=notline online offline up-auditing down-auditing up-reject down-reject offline-up-auditing offline-up-reject" example:"online"` //上线状态
	PublishStatus []string `json:"publish_status" form:"publish_status" binding:"omitempty,dive,oneof=unpublished pub-auditing published pub-reject change-auditing change-reject" example:"published"`                              //发布状态
	MountType     []string `json:"mount_type" form:"mount_type" binding:"omitempty,dive,oneof=view_count api_count file_count" example:"view"`                                                                                       //发布状态

	ComprehensionStatus  string   `form:"comprehension_status" binding:"omitempty"`                          // 理解状态,逗号分隔，支持多个状态查询
	UpdatedAtStart       int64    `json:"updated_at_start" form:"updated_at_start" binding:"omitempty,gt=0"` //编辑开始时间
	UpdatedAtEnd         int64    `json:"updated_at_end" form:"updated_at_end" binding:"omitempty,gt=0"`     //编辑结束时间
	SubjectID            string   `json:"subject_id" form:"subject_id" binding:"omitempty,uuid"`             // 主题id
	SubSubjectIDs        []string `json:"-"`                                                                 // 子主题域名id
	DepartmentID         string   `json:"department_id" form:"department_id" binding:"omitempty,uuid"`       // 部门id
	SubDepartmentIDs     []string `json:"-"`                                                                 // 部门的子部门id
	SubDepartmentIDs2    []string `json:"-"`                                                                 // 部门的子部门id
	InfoSystemID         string   `json:"info_system_id" form:"info_system_id" binding:"omitempty,uuid"`     // 信息系统id
	CategoryNodeId       string   `json:"category_node_id" form:"category_node_id" binding:"omitempty,uuid"` // 资源属性分类节点id
	CategoryNodeIDs      []string `json:"-"`
	SharedType           int8     `json:"shared_type"  binding:"omitempty,oneof=1 2 3" example:"1"`                     // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	UpdateCycle          *int32   `json:"update_cycle" form:"update_cycle" binding:"omitempty,min=0,max=9" example:"1"` // 更新周期 0未分类 1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	OpenType             *int8    `json:"open_type" form:"open_type" binding:"omitempty,oneof=0 1 2" example:"1"`       // 开放属性 0未分类 1 向公众开放 2 不向公众开放
	ColumnUnshared       bool     `json:"column_unshared"  form:"column_unshared" `                                     // 信息项不予共享
	ResourceNegativeList bool     `json:"resource_negative_list" form:"resource_negative_list"`                         // 资源负面清单查询标识
	UserDepartment       bool     `json:"user_department"  form:"user_department" `                                     // 本部门的目录
	SourceDepartmentID   string   `json:"source_department_id"`                                                         // 数据资源来源部门id
	ResShow
	MyDepartmentResource bool `json:"my_department_resource" form:"my_department_resource"` //本部门资源
}
type ResShow struct {
	SubjectShow bool `json:"subject_show"  form:"subject_show" ` // 主题域展示
	ExploreShow bool `json:"explore_show" form:"explore_show"`   // 探查结果展示
	StatusShow  bool `json:"status_show" form:"status_show"`     // 目录任务状态展示
}

/*
func (req *GetDataCatalogList) HasJoin() bool {
	return req.DepartmentID == constant.UnallocatedId ||
		req.SubjectID == constant.UnallocatedId ||
		req.InfoSystemID == constant.UnallocatedId ||
		req.CategoryNodeId == constant.UnallocatedId ||
		len(req.SubSubjectIDs) != 0 ||
		len(req.SubDepartmentIDs) != 0 ||
		(req.InfoSystemID != "" && req.InfoSystemID != constant.UnallocatedId) ||
		len(req.CategoryNodeIDs) != 0
}
*/

func (req *GetDataCatalogList) ComprehensionStateSlice() []int8 {
	comprehensionStates := make([]int8, 0)
	if req.ComprehensionStatus != "" {
		cs := strings.Split(req.ComprehensionStatus, ",")
		for _, s := range cs {
			si, _ := strconv.Atoi(s)
			if si > 0 {
				comprehensionStates = append(comprehensionStates, int8(si))
			}
		}
	}
	return comprehensionStates
}

type DataCatalogRes struct {
	Entries    []*DataCatalog `json:"entries"`     // 对象列表
	TotalCount int64          `json:"total_count"` // 当前筛选条件下的对象数量
}
type DataCatalog struct {
	ID                   string                      `json:"id"`                     // id
	Name                 string                      `json:"name"`                   // 数据资源名称
	Code                 string                      `json:"code"`                   // 编码
	Resource             []*Resource                 `json:"resource"`               // 挂载资源
	DepartmentId         string                      `json:"department_id"`          // 所属部门id
	Department           string                      `json:"department"`             // 所属部门
	DepartmentPath       string                      `json:"department_path"`        // 所属部门路径
	SourceDepartmentId   string                      `json:"source_department_id"`   // 数据资源来源部门id
	SourceDepartment     string                      `json:"source_department"`      // 数据资源来源部门
	SourceDepartmentPath string                      `json:"source_department_path"` // 数据资源来源部门路径
	PublishStatus        string                      `json:"publish_status" `        // 发布状态
	OnlineStatus         string                      `json:"online_status"`          // 上线状态
	UpdatedAt            int64                       `json:"updated_at"`             // 编辑时间
	PublishFlag          int8                        `json:"publish_flag"`           // 编辑时间
	PublishedAt          int64                       `json:"published_at,omitempty"` // 发布时间
	AuditAdvice          string                      `json:"audit_advice"`           // 审核意见
	SharedType           int8                        `json:"shared_type"`            // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SubjectInfo          []*common_model.SubjectInfo `json:"subject_info"`           // 所属主题
	Comprehension        ComprehensionCatalogInfo    `json:"comprehension"`          //  数据理解需要的字段
	CompletenessScore    *float64                    `json:"completeness_score"`     // 完整性维度评分，缺省为NULL
	TimelinessScore      *float64                    `json:"timeliness_score"`       // 及时性评分，缺省为NULL
	AccuracyScore        *float64                    `json:"accuracy_score"`         // 准确性维度评分，缺省为NULL
	DraftID              string                      `json:"draft_id"`               // 草稿id
	ReportStatus         int8                        `json:"report_status"`          // 数据理解报告状态
	*task_center.CatalogTaskStatusResp
	ApplyNum           int64 `json:"apply_num"`            // 申请次数
	ApplyDepartmentNum int64 `json:"apply_department_num"` // 申请部门数
	FavoritesNum       int64 `json:"favorites_num"`        // 收藏次数
	OnlineTime         int64 `json:"online_time"`          // 上线时间
	IsImport           bool  `json:"is_import"`            // 是否导入
}
type Resource struct {
	ResourceType  int8 `json:"resource_type"`  // 资源类型 1逻辑视图 2 接口 3 文件资源
	ResourceCount int  `json:"resource_count"` // 资源数量
}

type ComprehensionCatalogInfo struct {
	MountSourceName  string `json:"mount_source_name,omitempty"`          // 挂载的数据表名称
	Status           int8   `json:"status,omitempty"`                     // 理解状态
	UpdateTime       int64  `json:"comprehension_update_time,omitempty"`  // 理解更新时间
	ExceptionMessage string `json:"exception_message,omitempty"`          // 异常信息
	HasChange        bool   `json:"has_change"`                           // 是否有理解变更，红点逻辑
	Creator          string `json:"creator,omitempty"`                    // 理解创建人
	CreatedTime      int64  `json:"comprehension_created_time,omitempty"` // 理解创建时间
	UpdateBy         string `json:"update_by,omitempty"`                  // 理解更新人
}

//endregion

// region CatalogDetail

type FrontendCatalogDetail struct {
	*CatalogDetailRes
	PreviewCount int64  `json:"preview_count"`             // 预览量
	FavorID      uint64 `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored    bool   `json:"is_favored"`                // 是否已收藏
}

//endregion

// region CatalogDetail

type CatalogDetailRes struct {
	Name                 string `json:"name" binding:"required,VerifyNameStandard,min=1,max=255" example:"数据资源目录名称"` // 数据资源目录名称
	Code                 string `json:"code" binding:"required" example:"2024052020195225034001"`                    // 目录编码
	SourceDepartment     string `json:"source_department"`                                                           // 数据资源来源部门
	SourceDepartmentPath string `json:"source_department_path"`                                                      // 数据资源来源部门path
	SourceDepartmentID   string `json:"source_department_id" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`         // 数据资源来源部门id
	//ResourceType         int8   `json:"resource_type" binding:"omitempty,oneof=1 2 3" example:"1"`                   // 资源类型 1逻辑视图 2 接口
	common_model.DepartmentInfo
	common_model.InfoSystemInfo
	CategoryInfos         []*common_model.CategoryInfo                  `json:"category_infos"`                                             //自定义类目
	SubjectInfo           []*common_model.SubjectInfo                   `json:"subject_info"`                                               // 所属主题
	AppSceneClassify      *int8                                         `json:"app_scene_classify"  binding:"omitempty" example:"4"`        // 应用场景分类
	OtherAppSceneClassify string                                        `json:"other_app_scene_classify,omitempty" example:"分类"`            // 其他应用场景分类
	DataRelatedMatters    string                                        `json:"data_related_matters"`                                       // 数据所属事项
	BusinessMatters       []*configuration_center.BusinessMattersObject `json:"business_matters"`                                           // 业务事项,替代data_related_matters
	DataRange             int32                                         `json:"data_range" example:"1"`                                     // 数据范围：1-全国 2-全省 3-各市（州） 4-全市（州） 5-各区（县） 6-全区（县） 7-其他
	UpdateCycle           int32                                         `json:"update_cycle" binding:"omitempty,min=1,max=8" example:"1"`   // 更新频率 参考数据字典：GXZQ，1实时 2每日 3每周 4每月 5每季度 6每半年 7每年 8其他
	OtherUpdateCycle      string                                        `json:"other_update_cycle,omitempty"`                               // 其他更新频率
	DataClassify          string                                        `json:"data_classify" `                                             // 数据分级
	Description           string                                        `json:"description" binding:"omitempty,VerifyDescription,max=1000"` // 数据资源目录描述
	ReportInfo
	SharedOpenInfo //共享开放信息
	//MountResources            *MountResource              `json:"mount_resources" binding:"required,min=1,max=2,unique=ResType,dive"` // 挂接资源
	MoreInfo //更多信息

	ComprehensionStatus int32  `json:"comprehension_status"` // 是否有数据理解报告，1没有，2有
	PublishStatus       string `json:"publish_status"`       // 发布状态
	PublishAt           int64  `json:"publish_at"`           // 发布时间
	OnlineStatus        string `json:"online_status"`        // 上线状态
	OnlineTime          int64  `json:"online_time"`          // 上线时间
	AuditAdvice         string `json:"audit_advice"`         // 审核意见
	CreatedAt           int64  `json:"created_at"`           // 创建时间
	UpdatedAt           int64  `json:"updated_at"`           // 编辑时间
	DraftID             string `json:"draft_id"`             // 草稿id

	TimeRange string `json:"time_range"` // 数据时间范围
	ApplyNum  int64  `json:"apply_num"`  // 申请量

}

//endregion

// region GetDataCatalogColumns

type ColumnInfoRes struct {
	ColumnInfo
	SourceName       *ColumnSourceName `json:"source_name"`        // 来源字段名称
	StandardCode     string            `json:"standard_code"`      // 数据标准code
	Standard         string            `json:"standard"`           // 数据标准名称
	StandardType     int               `json:"standard_type"`      // 数据标准类型
	StandardTypeName string            `json:"standard_type_name"` // 数据标准类型名称
	StandardStatus   string            `json:"standard_status"`    // 数据标准状态
	CodeTable        string            `json:"code_table"`         // 码表名称
	CodeTableStatus  string            `json:"code_table_status"`  // 码表状态
}
type ColumnSourceName struct {
	TechnicalName string `json:"technical_name"` // 列技术名称
	BusinessName  string `json:"business_name"`  // 列业务名称
	OriginalName  string `json:"original_name"`  // 原始字段名称
}

type GetDataCatalogColumnsRes struct {
	Columns    []*ColumnInfoRes `json:"columns"` // 关联信息项
	TotalCount int64            `json:"total_count"`
}

// ByIndex 实现 sort.Interface 接口
type ByIndex []*ColumnInfoRes

func (a ByIndex) Len() int           { return len(a) }
func (a ByIndex) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByIndex) Less(i, j int) bool { return a[i].Index < a[j].Index }

//endregion
// region GetDataCatalogMountList

type MountResourceRes struct {
	MountResourceReportInfo
	ResourceType   int8                `json:"resource_type"` // 挂接资源类型 1逻辑视图 2 接口 3 文件资源
	ResourceID     string              `json:"resource_id"`   // 挂接资源ID
	Name           string              `json:"name"`
	Code           string              `json:"code"`            // 统一编目编码
	DepartmentId   string              `json:"department_id"`   // 所属部门id
	Department     string              `json:"department"`      // 所属部门
	DepartmentPath string              `json:"department_path"` // 所属部门路径
	PublishAt      int64               `json:"publish_at"`      // 发布时间
	Status         int8                `json:"status"`          // 视图状态,1正常,2删除
	Children       []*MountResourceRes `json:"children"`        // 子节点

}

type GetDataCatalogMountListRes struct {
	MountResource []*MountResourceRes `json:"mount_resource"` // 挂载资源
}

//endregion

// region GetResourceCatalogList

type GetResourceCatalogListReq struct {
	ResourceIDs     []string `json:"resource_ids"`      //数据资源ID
	CatalogInfoShow bool     `json:"catalog_info_show"` //目录信息展示
}

type GetResourceCatalogListRes struct {
	ResourceCatalogs []*ResourceCatalog `json:"resource_catalogs"`
}
type ResourceCatalog struct {
	Resource *data_resource.DataResource `json:"resource"`
	Catalog  *DataCatalog                `json:"catalog"`
}
type DataResource struct {
	ResourceId     string `json:"resource_id"`     // 数据资源id
	Name           string `json:"name"`            // 数据资源名称
	Code           string `json:"code"`            // 编码
	ResourceType   int8   `json:"resource_type"`   // 资源类型 1逻辑视图 2 接口 3 文件资源
	DepartmentID   string `json:"department_id"`   // 所属部门id
	Department     string `json:"department"`      // 所属部门
	DepartmentPath string `json:"department_path"` // 所属部门路径
	SubjectID      string `json:"subject_id"`      // 所属主题id
	Subject        string `json:"subject"`         // 所属主题
	SubjectPathId  string `json:"subject_path_id"` // 所属主题路径id

	PublishAt int64 `json:"publish_at"` // 发布时间时间

}

//endregion

// region GetDataCatalogRelation

type DataCatalogWithMount struct {
	CatalogName  string `json:"catalog_name"`  //目录名称
	CatalogID    uint64 `json:"catalog_id"`    //目录id
	ResourceName string `json:"resource_name"` //资源名称
	ResourceID   string `json:"resource_id"`   //资源id
}

type GetDataCatalogRelationRes struct {
	Api  []*DataCatalogWithMount `json:"catalog_api"`  // 接口目录
	View *DataCatalogWithMount   `json:"catalog_view"` // 视图目录
}

//endregion

//region CreateAuditInstance

type AuditType struct {
	AuditType string `uri:"audit_type" json:"audit_type" form:"audit_type" binding:"required,oneof=af-data-catalog-publish af-data-catalog-change af-data-catalog-online af-data-catalog-offline af-elec-licence-online af-elec-licence-offline" example:"af-data-catalog-online"` // 审核类型 af-data-catalog-publish 发布审核 af-data-catalog-change 变更审核 af-data-catalog-online 上线审核 af-data-catalog-offline 下线审核
}
type CreateAuditInstanceReq struct {
	CatalogIDRequired
	AuditType
}

//endregion

//region GetDataCatalogColumnList

type CatalogColumnPageInfo struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction  *string `json:"direction" form:"direction,default=asc" binding:"omitempty,oneof=asc desc" example:"asc"`                     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort       *string `json:"sort" form:"sort,default=index" binding:"omitempty,oneof=technical_name business_name index" example:"index"` // 排序类型
	ID         uint64  `json:"-"`                                                                                                           // id
	SharedType int8    `json:"shared_type" form:"shared_type" binding:"omitempty,oneof=1 2 3" example:"1"`                                  // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	ReportShow bool    `json:"report_show"`                                                                                                 //上报信息展示
}

//endregion

type CatalogBriefInfoReq struct {
	CatalogIds string `json:"catalog_ids" form:"catalog_ids" binding:"required,uuid"`
}

//region TotalOverviewReq

type TotalOverviewReq struct {
	// id
}

type TotalOverviewRes struct {
	DataCatalogCount `json:"data_catalog_count"` //数据资源目录统计

	DataResourceCount `json:"data_resource_count"` //数据资源统计

	DepartmentCounts []*DepartmentCount `json:"department_count"` //部门提供目录统计

	CatalogShareConditional `json:"share_conditional"` //目录共享统计

	CatalogUsingCount `json:"catalog_using_count"` //目录使用统计

	CatalogFeedbackCount `json:"catalog_feedback_count"` //目录反馈统计

}
type DataCatalogCount struct {
	CatalogCount          int64 `json:"catalog_count"`
	UnPublishCatalogCount int64 `json:"un_publish_catalog_count"`
	PublishCatalogCount   int64 `json:"publish_catalog_count"`
	NotlineCatalogCount   int64 `json:"notline_catalog_count"`
	OnlineCatalogCount    int64 `json:"online_catalog_count"`
	OfflineCatalogCount   int64 `json:"offline_catalog_count"`

	PublishAuditingCatalogCount int64 `json:"publish_auditing_catalog_count"`
	PublishPassCatalogCount     int64 `json:"publish_pass_catalog_count"`
	PublishRejectCatalogCount   int64 `json:"publish_reject_catalog_count"`

	OnlineAuditingCatalogCount int64 `json:"online_auditing_catalog_count"`
	OnlinePassCatalogCount     int64 `json:"online_pass_catalog_count"`
	OnlineRejectCatalogCount   int64 `json:"online_reject_catalog_count"`

	OfflineAuditingCatalogCount int64 `json:"offline_auditing_catalog_count"`
	OfflinePassCatalogCount     int64 `json:"offline_pass_catalog_count"`
	OfflineRejectCatalogCount   int64 `json:"offline_reject_catalog_count"`
}
type DataResourceCount struct {
	ResourceCount   int64 `json:"resource_count"`    //资源总数量
	ViewCount       int64 `json:"view_count"`        //逻辑视图数量
	ApiCount        int64 `json:"api_count"`         //接口数量
	FileCount       int64 `json:"file_count"`        //文件数量
	ManualFormCount int64 `json:"manual_form_count"` //手工表数量

	ResourceMount   int64 `json:"resource_mount"`    //已挂载目录的资源数量
	ViewMount       int64 `json:"view_mount"`        //已挂载目录的逻辑视图数量
	ApiMount        int64 `json:"api_mount"`         //已挂载目录的接口数量
	FileMount       int64 `json:"file_mount"`        //已挂载目录的文件数量
	ManualFormMount int64 `json:"manual_form_mount"` //已挂载目录的手工表数量

	ResourceUnMount   int64 `json:"resource_un_mount"`    //未挂载目录的资源数量
	ViewUnMount       int64 `json:"view_un_mount"`        //未挂载目录的逻辑视图数量
	ApiUnMount        int64 `json:"api_un_mount"`         //未挂载目录的接口数量
	FileUnMount       int64 `json:"file_un_mount"`        //未挂载目录的文件数量
	ManualFormUnMount int64 `json:"manual_form_un_mount"` //未挂载目录的手工表数量

}
type DepartmentCount struct {
	DepartmentId   string `json:"department_id"`   //部门id
	DepartmentName string `json:"department_name"` //部门名称
	DepartmentPath string `json:"department_path"` //部门路径
	Count          int    `json:"count"`           //目录数量
}
type CatalogShareConditional struct {
	UnconditionalShared int64 `json:"unconditional_shared"` //  无条件共享
	ConditionalShared   int64 `json:"conditional_shared"`   // 有条件共享
	NotShared           int64 `json:"not_shared"`           //不予共享
}
type CatalogUsingCount struct {
	SupplyAndDemandConnection int64 `json:"supply_and_demand_connection"` // 供需对接
	SharingApplication        int64 `json:"sharing_application"`          // 共享申请
	DataAnalysis              int64 `json:"data_analysis"`                // 数据分析
}
type CatalogFeedbackCount struct {
	CatalogFeedbackStatistics int64 `json:"catalog_feedback_statistics"` // 目录反馈统计
	DataQualityIssues         int64 `json:"data_quality_issues"`         // 数据质量问题
	ResourceCatalogMismatch   int64 `json:"resource_catalog_mismatch"`   // 挂接资源和目录不一致
	InterfaceIssues           int64 `json:"interface_issues"`            // 接口问题
	Other                     int64 `json:"other"`                       // 其他
}

//endregion

//region StatisticsOverview

type StatisticsOverviewReq struct {
	Type  string `json:"type" binding:"required,oneof=year quarter month" example:"year"` //年、季度、月
	Start string `json:"start" binding:"omitempty" example:"2006-01-02 15:04:05"`         //开始时间
	End   string `json:"end" binding:"omitempty" example:"2006-01-02 15:04:05"`           //结束时间
}
type StatisticsOverviewRes struct {
	CatalogCount  *CatalogCount `json:"catalog_count"`
	FeedbackCount []*Count      `json:"feedback_count"`
	Err           []error       `json:"err"`
}
type CatalogCount struct {
	Auditing *AuditTypeCount `json:"auditing"` //审核中
	Pass     *AuditTypeCount `json:"pass"`     //通过
	Reject   *AuditTypeCount `json:"reject"`   //拒绝
}

type AuditTypeCount struct {
	Publish []*Count `json:"publish"` //发布
	Online  []*Count `json:"online"`  //上线
	Offline []*Count `json:"offline"` //下线
}
type Count struct {
	Type  int    `json:"type"`  //类型，1 视图、2 接口、3 文件、4 手工表
	Dive  string `json:"dive"`  //年、季度、月
	Count int    `json:"count"` //数量
}

//endregion

//region GetColumnListByIds

type GetColumnListByIdsReq struct {
	IDs []uint64 `json:"ids"` // 信息项id
}
type GetColumnListByIdsResp struct {
	Columns []*ColumnNameInfo `json:"columns"` // 信息项
}
type ColumnNameInfo struct {
	ID            uint64 `json:"id" binding:"required" example:"1"`
	BusinessName  string `json:"business_name" binding:"required,min=1,max=255" example:"业务名称"`  // 信息项业务名称
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=255" example:"技术名称"` // 信息项技术名称
}

//endregion

//region GetDataCatalogTaskResp

type GetDataCatalogTaskResp struct {
	*CatalogMountFormInfo
	SourceType string `json:"source_type"` // 目录挂接的视图数据源来源
	task_center.CatalogTaskResp
}

type CatalogMountFormInfo struct {
	CatalogID   string `json:"catalog_id"`   // 目录id
	CatalogName string `json:"catalog_name"` // 目录名称
	Code        string `json:"code"`         // 目录编码
	FormId      string `json:"form_id"`      // 目录挂接的视图id
	FormName    string `json:"form_name"`    // 目录挂接的视图名称
}

//endregion

// region UpdateApplyNum

type EsIndexApplyNumUpdateMsg struct {
	Body         []*ESIndexApplyNumUpdateMsgEntity `json:"body"`
	ShareApplyID string                            `json:"share_apply_id"` // 共享申请ID
	UpdatedAt    int64                             `json:"updated_at"`     // 目录更新时间，用于异步处理消息发送结策
}

// 定义表t_data_catalog_apply结构体
type TDataCatalogApply struct {
	ID         int64  `json:"id"`
	CatalogID  string `json:"catalog_id"`
	ApplyNum   int64  `json:"apply_num"`
	CreateTime string `json:"create_time"`
}
type ESIndexApplyNumUpdateMsgEntity struct {
	ResType string   `json:"res_type"` //资源类型 catalog 数据资源目录 api 按已服务(注册接口)
	ResIDs  []string `json:"res_ids"`  //资源ID
}

//endregion

type SourceType enum.Object

var (
	Records    = enum.New[SourceType](1, "records")
	Analytical = enum.New[SourceType](2, "analytical")
	Sandbox    = enum.New[SourceType](3, "sandbox")
)

type GetSampleDataRes struct {
	Type string `json:"type"` //合成/样例
	*virtual_engine.FetchDataRes
}

type PushCatalogToEsReq struct {
	PublishStatus []string `json:"publish_status" form:"publish_status" `
}

type MD struct {
	MyDepartment     bool     `json:"my_department" form:"my_department"` //本部门
	SubDepartmentIDs []string `json:"-"`
}

type DataGetOverviewReq struct {
	MD
}

type DataGetOverviewRes struct {
	DepartmentCount           int                    `json:"department_count"`             //部门数
	InfoCatalogCount          int                    `json:"info_catalog_count"`           //信息资源目录
	InfoCatalogColumnCount    int                    `json:"info_catalog_column_count"`    //信息资源目录 信息项
	DataCatalogCount          int                    `json:"data_catalog_count"`           //数据资源目录
	DataCatalogColumnCount    int                    `json:"data_catalog_column_count"`    //数据资源目录 信息项
	DataResourceCount         []*DRCount             `json:"data_resource_count"`          //数据资源
	FrontEndProcessor         int                    `json:"front_end_processor"`          //前置机
	FrontEndProcessorUsing    int                    `json:"front_end_processor_using"`    //前置机使用
	FrontEndProcessorReclaim  int                    `json:"front_end_processor_reclaim"`  //前置机回收
	FrontEndLibrary           int                    `json:"front_end_library"`            //前置
	FrontEndLibraryUsing      int                    `json:"front_end_library_using"`      //前置库使用
	FrontEndLibraryReclaim    int                    `json:"front_end_library_reclaim"`    //前置库回收
	Aggregation               []*WorkOrderTask       `json:"aggregation"`                  //归集任务
	SyncMechanism             []*SyncMechanism       `json:"sync_mechanism"`               // 更新方式
	UpdateCycle               []*UpdateCycle         `json:"update_cycle"`                 //更新频率
	CatalogSubjectGroup       []*SubjectGroup        `json:"catalog_subject_group"`        //基础信息分类 目录
	ViewSubjectGroup          []*SubjectGroup        `json:"view_subject_group"`           //基础信息分类 库表
	CatalogDepartSubjectGroup []*SubjectGroup        `json:"catalog_depart_subject_group"` //基础信息分类 部门
	SubjectGroup              [][]any                `json:"subject_group"`                //基础信息分类
	OpenCount                 int                    `json:"open_count"`                   //开放数据目录数量
	OpenDepartmentCount       int                    `json:"open_department_count"`        //开放部门数量
	DataRange                 []*DataRange           `json:"data_range"`                   //目录层级
	ViewDepartmentCount       int                    `json:"view_department_count"`        //基础信息类型-库表-部门数量
	ViewCount                 int                    `json:"view_count"`                   //基础信息类型-库表-库表数量
	ViewAggregationCount      int                    `json:"view_aggregation_count"`       //基础信息类型-库表-归集数量
	APIDepartmentCount        int                    `json:"api_department_count"`         //基础信息类型-接口-部门数量
	APIGenerateCount          int                    `json:"api_generate_count"`           //基础信息类型-接口-生成接口
	APIRegisterCount          int                    `json:"api_register_count"`           //基础信息类型-接口-注册接口
	FileDepartmentCount       int                    `json:"file_department_count"`        //基础信息类型-文件-部门数量
	FileCount                 int                    `json:"file_count"`                   //基础信息类型-文件-文件数量
	Errors                    []string               `json:"errors"`
	*ViewOverview             `json:"view_overview"` // 库表分类占比
}
type DRCount struct {
	Count int    `json:"count"`
	Type  string `json:"type"` // 数据资源类型 枚举值 1：逻辑视图 2：接口 3:文件资源
}
type WorkOrderTask struct {
	Count  int    `json:"count"`
	Status string `json:"status"` //状态    Completed 已完成 （Running 进行中 Failed 异常）未完成
}
type SyncMechanism struct {
	Count         int    `json:"count"`
	SyncMechanism string `json:"sync_mechanism"` //更新方式   0未定义  1增量 2全量
}

type UpdateCycle struct {
	Count       int    `json:"count"`
	UpdateCycle string `json:"update_cycle"` //更新方式   参考数据字典：GXZQ，1实时 2每日 3每周 4每月 5每季度 6每半年 7每年 8其他
}

type SubjectGroup struct {
	Count       int    `json:"count"`
	SubjectID   string `json:"subject_id"`
	SubjectName string `json:"subject_name"`
}
type CompletedRate struct {
	Count       any    `json:"count"`
	SubjectID   string `json:"subject_id"`
	SubjectName string `json:"subject_name"`
}

type ViewOverview struct {
	SubjectGroup []*SubjectGroup `json:"subject_group"` // 基础信息分类
	DataRange    []*DataRange    `json:"data_range"`    // 目录层级
}

type DataRange struct {
	Count     int    `json:"count"`
	DataRange string `json:"data_range"` //数据所在层级：1-国家级 2-省级 3-市级 4-县（区）级
}

// 归集任务-归集任务详情

type DataGetAggregationOverviewRes struct {
	Entries    []*DataGetAggregationOverviewEntries `json:"entries"`
	TotalCount int64                                `json:"total_count"`
}

type DataGetAggregationOverviewEntries struct {
	DepartmentName    string `json:"department_name"`     //部门名称
	CompletedCount    int    `json:"completed_count"`     //完成归集任务
	NotCompletedCount int    `json:"not_completed_count"` //未完成归集任务
}

// 部门详情

type DataGetDepartmentDetailReq struct {
	MD                    // 部门的子部门id
	DepartmentID []string `json:"department_id" form:"department_id" binding:"omitempty,dive,uuid"`   //部门id
	Keyword      string   `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=500"` // 关键字查询
	Offset       int      `json:"offset,default=1" form:"offset,default=1" binding:"min=1"`           // 页码，默认1
	Limit        int      `json:"limit,default=10" form:"limit,default=10" binding:"min=1,max=2000"`  // 每页大小，默认10
}

type DataGetDepartmentDetailRes struct {
	Entries    []*DataGetDepartmentDetail `json:"entries"`
	Errors     []string                   `json:"errors"`
	TotalCount int64                      `json:"total_count"`
}
type DataGetDepartmentDetail struct {
	DepartmentID           string `json:"department_id"`             //部门id
	DepartmentName         string `json:"department_name"`           //部门名称
	DepartmentPath         string `json:"department_path"`           //部门路径
	InfoCatalogCount       int    `json:"info_catalog_count"`        //信息资源目录数量
	DataCatalogCount       int    `json:"data_catalog_count"`        //数据资源目录数量
	DataResourceCount      int    `json:"data_resource_count"`       //数据资源数量
	ViewCount              int    `json:"view_count"`                //库表数量
	APICount               int    `json:"api_count"`                 //接口数量
	FileCount              int    `json:"file_count"`                //文件数量
	FrontEndProcessorCount int    `json:"front_end_processor_count"` //前置机数量
	FrontEndLibraryCount   int    `json:"front_end_library_count"`   //前置库数量
}

type DCount struct {
	DepartmentID string `json:"department_id"`
	Count        int    `json:"count"`
}

//region DataAssetsOverview

// DataAssetsOverviewReq 数据资产概览请求
type DataAssetsOverviewReq struct {
	// 可以添加必要的查询参数
}

// DataAssetsOverviewRes 数据资产概览响应
type DataAssetsOverviewRes struct {
	Entries []*DataAssetsOverviewEntry `json:"entries"`
}

// DataAssetsOverviewEntry 数据资产概览条目
type DataAssetsOverviewEntry struct {
	Category  string `json:"category"`            // 类别：resource_department, info_resource, api, file, data_resource, database
	Total     int    `json:"total"`               // 总数
	Published *int   `json:"published,omitempty"` // 已发布数量（可选）
	Online    *int   `json:"online,omitempty"`    // 已上线数量（可选）
}

// DataAssetsDetailReq 数据资产部门详情请求
type DataAssetsDetailReq struct {
	request.PageBaseInfo
	DepartmentID string `json:"department_id" form:"department_id" binding:"omitempty,uuid"` // 部门ID，可选参数
}

// DataAssetsDetailRes 数据资产部门详情响应
type DataAssetsDetailRes struct {
	Entries    []*DataAssetsDetailEntry `json:"entries"`     // 部门详情列表
	TotalCount int64                    `json:"total_count"` // 总数量
}

// DataAssetsDetailEntry 数据资产部门详情条目
type DataAssetsDetailEntry struct {
	DepartmentID       string `json:"department_id"`        // 部门ID
	DepartmentName     string `json:"department_name"`      // 部门名称
	InfoResourceCount  int    `json:"info_resource_count"`  // 信息资源目录数量
	DataResourceCount  int    `json:"data_resource_count"`  // 数据资源目录数量
	DatabaseTableCount int    `json:"database_table_count"` // 库表数量
	APICount           int    `json:"api_count"`            // 接口数量
	FileCount          int    `json:"file_count"`           // 文件数量
}

//endregion

//region DataUnderstandOverview

type DataUnderstandOverviewReq struct {
	MD
}

type DataUnderstandOverviewRes struct {
	DepartmentCount               int     `json:"department_count"`                  //数据理解部门数量
	ViewCatalogCount              int     `json:"view_catalog_count"`                //库表目录数
	ViewCatalogUnderstandCount    int     `json:"view_catalog_understand_count"`     //库表目录数-已理解
	ViewCatalogNotUnderstandCount int     `json:"view_catalog_not_understand_count"` //库表目录数-未理解
	UnderstandTaskCount           int     `json:"understand_task_count"`             //理解任务数
	UnderstandTask                []*Task `json:"understand_task"`                   //理解任务

	CatalogDomainGroup map[string]int `json:"catalog_domain_group"` //服务领域 数据目录数量
	ViewDomainGroup    map[string]int `json:"view_domain_group"`    //服务领域 库表数量
	SubjectDomainGroup map[string]int `json:"subject_domain_group"` //服务领域 业务对象数量

	DepartmentUnderstand   []*SubjectGroup  `json:"department_understand"`    //基础信息分类 数据理解部门
	CompletedUnderstand    []*SubjectGroup  `json:"completed_understand"`     //基础信息分类 已理解数据目录
	NotCompletedUnderstand []*SubjectGroup  `json:"not_completed_understand"` //基础信息分类 未理解数据目录
	CompletedRate          []*CompletedRate `json:"completed_rate"`           //基础信息分类 完成率
	Errors                 []string         `json:"errors"`
}

type Task struct {
	Count  int `json:"count"`
	Status int `json:"status"` //状态 (1, "ready", "未开始") (2, "ongoing", "进行中")	(3, "completed", "已完成")  (999 全部)特殊
}

type DomainGroup struct {
	Count int    `json:"count"`
	ID    string `json:"id"`
	Name  string `json:"name"`
}

//endregion

//region DataUnderstandDepartTopOverview

type DataUnderstandDepartTopOverviewReq struct {
	MD
	SubjectID    string   `json:"subject_id"  form:"subject_id"`                                                                           //主题域id
	DepartmentID []string `json:"department_id" form:"department_id" binding:"omitempty,dive,uuid"`                                        //部门id
	Offset       int      `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                              // 页码
	Limit        int      `json:"limit" form:"limit,default=10" binding:"min=1,max=2000" default:"10"`                                     // 每页大小
	Direction    string   `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                         // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort         string   `json:"sort" form:"sort,default=completion_rate" binding:"oneof=completion_rate name" default:"completion_rate"` // 排序类型，枚举：completion_rate：完成率 name 部门名称
}
type DataUnderstandDepartTopOverviewRes struct {
	Entries    []*DataUnderstandDepartTopOverview `json:"entries"`     // 部门详情列表
	TotalCount int64                              `json:"total_count"` // 总数量
}

type DataUnderstandDepartTopOverview struct {
	DepartmentID     string  `json:"department_id"`
	Name             string  `json:"name"`
	CompletedCount   int     `json:"completed_count"`
	UncompletedCount int     `json:"uncompleted_count"`
	TotalCount       int     `json:"total_count"`
	CompletionRate   float64 `json:"completion_rate"`
}

//endregion

//region DataUnderstandDomainOverview

type DataUnderstandDomainOverviewReq struct {
	MD
}
type DataUnderstandDomainOverviewRes struct {
	CatalogInfo map[string][]*DomainCatalogInfo `json:"catalog_info"`
}

type DomainCatalogInfo struct {
	ID                uint64    `json:"id"`                                           //目录id
	Name              string    `gorm:"column:title;not null" json:"name"`            //目录名称
	ViewCount         int       `json:"view_count"`                                   // 挂接逻辑视图数量
	ApiCount          int       `json:"api_count"`                                    // 挂接接口数量
	FileCount         int       `json:"file_count"`                                   // 挂接文件资源数量
	DepartmentID      string    `json:"department_id"`                                // 所属部门ID
	DepartmentName    string    `json:"department_name"`                              // 所属部门
	CompletenessScore *float64  `json:"completeness_score"`                           //完整性维度评分，缺省为NULL
	TimelinessScore   *float64  `json:"timeliness_score"`                             //及时性评分，缺省为NULL
	AccuracyScore     *float64  `json:"accuracy_score"`                               //准确性维度评分，缺省为NULL
	UpdateCycle       int32     `json:"update_cycle"`                                 // 更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	SyncMechanism     int8      `gorm:"column:sync_mechanism" json:"sync_mechanism"`  // (1 增量 ; 2 全量)
	UpdatedAt         time.Time `gorm:"column:updated_at;not null" json:"updated_at"` // 更新时间

}

//endregion

//region DataUnderstandTaskDetailOverview

type DataUnderstandTaskDetailOverviewReq struct {
	MD
	Start     string     `json:"start" form:"start" binding:"required" example:"2006-01-02 15:04:05"` //开始时间
	End       string     `json:"end" form:"end" binding:"required" example:"2006-01-02 15:04:05"`     //结束时间
	StartTime *time.Time `json:"-"`
	EndTime   *time.Time `json:"-" `
}

//Year    int `json:"year" form:"year" binding:"required,min=2020,max=2100"`
//Quarter int `json:"quarter" form:"quarter" binding:"omitempty,min=1,max=4"`
//Month   int `json:"month" form:"month" binding:"omitempty,min=1,max=12"`

type DataUnderstandTaskDetailOverviewRes struct {
	Task []*Task `json:"task"`
}

//endregion

//region DataUnderstandDepartDetailOverview

type DataUnderstandDepartDetailOverviewReq struct {
	MD
	Understand   bool     `json:"understand" form:"understand"`                                        //已理解true 未理解false
	DepartmentID []string `json:"department_id" form:"department_id" binding:"omitempty,dive,uuid"`    //部门id
	Offset       int      `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`          // 页码
	Limit        int      `json:"limit" form:"limit,default=10" binding:"min=1,max=2000" default:"10"` // 每页大小
}
type DataUnderstandDepartDetailOverviewRes struct {
	Entries    []*DataUnderstandDepartDetail `json:"entries"`
	TotalCount int64                         `json:"total_count"` // 总数量
}

type DataUnderstandDepartDetail struct {
	ID                uint64    `json:"id"`                                           //目录id
	Name              string    `gorm:"column:title;not null" json:"name"`            //目录名称
	ViewCount         int       `json:"view_count"`                                   // 挂接逻辑视图数量
	ApiCount          int       `json:"api_count"`                                    // 挂接接口数量
	FileCount         int       `json:"file_count"`                                   // 挂接文件资源数量
	DepartmentID      string    `json:"department_id"`                                // 所属部门ID
	DepartmentName    string    `json:"department_name"`                              // 所属部门
	CompletenessScore *float64  `json:"completeness_score"`                           //完整性维度评分，缺省为NULL
	TimelinessScore   *float64  `json:"timeliness_score"`                             //及时性评分，缺省为NULL
	AccuracyScore     *float64  `json:"accuracy_score"`                               //准确性维度评分，缺省为NULL
	UpdateCycle       int32     `json:"update_cycle"`                                 // 更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	SyncMechanism     int8      `gorm:"column:sync_mechanism" json:"sync_mechanism"`  // (1 增量 ; 2 全量)
	UpdatedAt         time.Time `gorm:"column:updated_at;not null" json:"updated_at"` // 更新时间

}

//endregion
