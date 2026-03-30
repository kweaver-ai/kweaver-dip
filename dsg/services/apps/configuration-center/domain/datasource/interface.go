package datasource

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
)

type UseCase interface {
	CreateDataSource(ctx context.Context, req *CreateDataSource) (*response.NameIDResp, error)
	CheckDataSourceRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	GetDataSources(ctx context.Context, req *QueryPageReqParam) (*QueryPageResParam, error)
	GetDataSource(ctx context.Context, req *DataSourceId) (*DataSourceDetail, error)
	DeleteDataSource(ctx context.Context, datasourceId string) (*response.NameIDResp, error)
	ModifyDataSource(ctx context.Context, req *ModifyDataSourceReq) (*response.NameIDResp, error)
	GetDataSourceSystemInfos(ctx context.Context, req *DataSourceIds) ([]*response.GetDataSourceSystemInfosRes, error)
	GetDataSourcesByIds(ctx context.Context, IDs []string) ([]*configuration_center.DataSourcesPrecision, error)
	GetAll(ctx context.Context) ([]*configuration_center.DataSources, error)
	GetDataSourceGroupBySourceType(ctx context.Context) ([]*DataSourceGroupBySourceType, error)
	GetDataSourceGroupByType(ctx context.Context) ([]*DataSourceGroupByType, error)
	UpdateConnectStatus(ctx context.Context, req *UpdateConnectStatusReq) error
}

type PageInfo struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                          // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=2000" default:"12"`                                 // 每页大小，默认12
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type QueryPageReqParam struct {
	PageInfo
	Keyword      string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"`                                            // 关键字查询，字符无限制
	Type         string `json:"type"  form:"type"  binding:"omitempty" example:"mariadb"`                                                      // 数据源类型
	InfoSystemId string `json:"info_system_id" form:"info_system_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //信息系统id
	SourceType   string `json:"source_type" form:"source_type" binding:"omitempty,oneof=records analytical sandbox" example:"records"`         // 数据源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	HuaAoID      string `json:"hua_ao_id,omitempty" form:"hua_ao_id" binding:"omitempty" example:"114514"`                                     // 华傲数据源 ID
	OrgCode      string `json:"org_code,omitempty" form:"org_code" binding:"omitempty,uuid" example:"114514"`                                  // 组织编码
}
type DataSourceDetail struct {
	ID              string `json:"id"`                // 数据源标识
	InfoSystemId    string `json:"info_system_id" `   //信息系统id
	InfoSystemName  string `json:"info_system_name" ` //信息系统名称
	Name            string `json:"name"`              // 数据源名称
	Type            string `json:"type"`              // 数据源类型
	CatalogName     string `json:"catalog_name"`      // 数据源catalog名称
	SourceType      string `json:"source_type"`       // 数据源来源类型
	DatabaseName    string `json:"database_name"`     // 数据库名称
	Schema          string `json:"schema"`            // 数据库模式
	Host            string `json:"host"`              // 连接地址
	Port            int32  `json:"port"`              // 端口
	Username        string `json:"username"`          // 用户名
	UpdatedByUID    string `json:"updated_by_uid"`    // 修改人
	UpdatedAt       int64  `json:"updated_at"`        // 修改时间
	ExcelProtocol   string `json:"excel_protocol" `   //excel 存储位置
	ExcelBase       string `json:"excel_base" `       //excel 路径
	DepartmentId    string `json:"department_id"`     //关联部门id
	DepartmentName  string `json:"department_name"`   //关联部门名称
	ConnectStatus   int32  `json:"connect_status"`    //连接状态 1已连接 2未连接
	Password        string `json:"password"`          // 密码
	Token           string `json:"token"`             // token认证，当前仅inceptor数据源使用，和account/passwaord 二选一认证
	Comment         string `json:"comment"`           // 描述
	ConnectProtocol string `json:"connect_protocol"`  // 连接方式
}
type DataSourcePage struct {
	ID             string `json:"id"`              // 数据源id
	Name           string `json:"name"`            // 数据源名称
	CatalogName    string `json:"catalog_name"`    // 数据源catalog名称
	Type           string `json:"type"`            // 数据源类型
	SourceType     string `json:"source_type"`     // 数据源来源类型
	DatabaseName   string `json:"database_name"`   // 数据库名称
	Schema         string `json:"schema"`          // 数据库模式
	DepartmentID   string `json:"department_id"`   // 数据库部门ID
	DepartmentName string `json:"department_name"` // 数据源部门名称
	UpdatedByUID   string `json:"updated_by_uid"`  // 修改人
	UpdatedAt      int64  `json:"updated_at"`      // 修改时间
	// 华傲数据源 ID
	HuaAoID       string `json:"hua_ao_id,omitempty"`
	ConnectStatus int32  `json:"connect_status"` //连接状态 1已连接 2未连接
}

type QueryPageResParam struct {
	Entries    []*DataSourcePage `json:"entries" binding:"required"`                      // 运营流程对象列表
	TotalCount int64             `json:"total_count" binding:"required,ge=0" example:"3"` // 当前筛选条件下的运营流程数量
}
type BasicDataSource struct {
	Name          string `json:"name"`                                                                                   // 数据源名称
	SourceType    string `json:"source_type" binding:"required,oneof=records analytical sandbox" example:"records"`      // 数据源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	DatabaseName  string `json:"database_name"  binding:"omitempty,VerifyDescriptionReduceSpace"`                        // 数据库名称
	Schema        string `json:"schema"`                                                                                 // 数据库模式
	Host          string `json:"host"`                                                                                   // 连接地址
	Port          int32  `json:"port"`                                                                                   // 端口
	GuardianToken string `json:"guardian-token"  binding:"omitempty"`                                                    // 用户token
	Username      string `json:"username"  binding:"omitempty,lte=128,VerifyDescriptionReduceSpace"`                     // 用户名
	Password      string `json:"password"  binding:"omitempty,lte=1024,VerifyBase64"`                                    // 密码
	InfoSystemId  string `json:"info_system_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //信息系统id
	ExcelProtocol string `json:"excel_protocol"`                                                                         //excel 存储位置
	ExcelBase     string `json:"excel_base"`                                                                             //excel 路径
	DepartmentId  string `json:"department_id"`                                                                          //关联部门id
	Enabled       bool   `json:"enabled"`                                                                                //是否启用
	HuaAoId       string `json:"hua_ao_id"`                                                                              //华傲数据源id
}
type CreateDataSource struct {
	BasicDataSource
	Type string `json:"type"  binding:"required" example:"maria"` // 数据库类型
}

type CreateDataSourceBatchReq struct {
	Datasource []*CreateDataSource `json:"datasource" binding:"required,dive"`
}
type DataSourceBatchRes struct {
	Success []*response.NameIDResp `json:"success"`
	Error   []*NameIDRespWithError `json:"error"`
}
type NameIDRespWithError struct {
	Name  string // 资源对象名称
	Error any
}
type UpdateConnectStatusReq struct {
	ConnectStatus int32  `json:"connect_status" binding:"required,oneof=1 2"` //连接状态 1已连接 2未连接
	ID            string `json:"id" binding:"required,uuid"`                  // 数据源标识
}
type ModifyDataSourceBatchReq struct {
	Datasource []*ModifyDataSourceReq `json:"datasource" binding:"required,dive"`
}
type NameRepeatReq struct {
	SourceType   string `json:"source_type" form:"source_type"  binding:"required,oneof=records analytical sandbox" example:"records"`        // 数据源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	InfoSystemId string `json:"info_system_id" form:"info_system_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //信息系统id
	ID           string `json:"id" uri:"id" binding:"omitempty,uuid"`                                                                         // 数据源标识，用于修改时名称校验
	Name         string `json:"name" form:"name" binding:"TrimSpace,required,min=1,max=128,VerifyNameReduceSpace" example:"DataSourceName"`   // 数据源名称
}
type DataSourceId struct {
	ID string `json:"id" uri:"id" binding:"required,uuid"` // 数据源标识
}
type DataSourceIds struct {
	IDs []int `json:"ids" form:"ids" binding:"required"` // 数据源标识
}

type IDs struct {
	IDs []string `json:"ids" form:"ids" binding:"required,dive,uuid"` // 数据源标识
}

type GetDataSourceSystemInfosRes struct {
	IDs []int `json:"ids" form:"ids" binding:"required"` // 数据源标识
}

type GetDataSourcesByIds struct {
	DataSourceID uint64 `json:"data_source_id"` // 数据源雪花id
	ID           string `json:"id"`             // 数据源业务id
	InfoSystemID string `json:"info_system_id"` // 信息系统id
	Name         string `json:"name"`           // 数据源名称
	CatalogName  string `json:"catalog_name"`   // 数据源catalog名称
	Type         int32  `json:"type"`           // 数据库类型
	TypeName     string `json:"type_name"`      // 数据库类型名称
	Host         string `json:"host"`           // 连接地址
	Port         int32  `json:"port"`           // 端口
	Username     string `json:"username"`       // 用户名
	DatabaseName string `json:"database_name"`  // 数据库名称
	Schema       string `json:"schema"`         // 数据库模式
	SourceType   int32  `json:"source_type"`    // 数据源类型 1:记录型、2:分析型
	CreatedByUID string `json:"created_by_uid"` // 创建人id
	CreatedAt    int64  `json:"created_at"`     // 创建时间
	UpdatedByUID string `json:"updated_by_uid"` // 更新人id
	UpdatedAt    int64  `json:"updated_at"`     // 更新时间
}

type DataSourceGroupBySourceType struct {
	SourceType string                   `json:"source_type"` // 数据源类型
	Entries    []*DataSourceGroupByType `json:"entries"`     // 数据源列表
}

type DataSourceGroupByType struct {
	Type    string            `json:"type"`    // 数据源类型
	Entries []*DataSourcePage `json:"entries"` // 数据源列表
}

type ModifyDataSourceReq struct {
	BasicDataSource
	ID string `json:"id"` // 数据源标识
}
