package business_structure

import (
	"context"
	"encoding/json"
	"mime/multipart"
	"strings"
	"time"

	"gorm.io/plugin/soft_delete"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type UseCase interface {
	//Check(ctx context.Context, id, name, objType, mid string) (bool, error)
	//CheckRepeat(ctx context.Context, checkType, id, name, objType string) (bool, error)
	//CreateObject(ctx context.Context, req *ObjectCreateReq) (id, name string, err error)
	UpdateObject(ctx context.Context, req *ObjectUpdateReq, uid string) (string, error)
	UpdateObjectRegister(ctx context.Context, req *model.Object) error
	//MoveObject(ctx context.Context, id, targetId, name string) (string, error)
	//DeleteObjects(ctx context.Context, req *ObjectDeleteReq) error
	ListByPaging(ctx context.Context, req *QueryPageReqParam) (*QueryPageReapParam, error)
	ListByPagingWithRegisterAndTag(ctx context.Context, req *QueryOrgPageReqParam) (*QueryPageReapParam, error)
	Get(ctx context.Context, id string) (*GetResp, error)
	GetType(ctx context.Context, id string, catalog int32) (*GetResp, error)
	GetFile(ctx context.Context, id string, fileId string) ([]byte, string, error)
	Save(ctx context.Context, id string, files []*multipart.FileHeader) (string, error)
	//GetNames(ctx context.Context, ids []string, objectType string) ([]ObjectInfoResp, error)
	//GetObjectPathInfo(ctx context.Context, id string) ([]*ObjectPathInfoResp, error)
	//GetSuggestedName(ctx context.Context, id, parentID string) (string, error)
	//HandleMainBusinessCreate(ctx context.Context, id, name, departmentID string, businessSystemID, businessMattersID []string, createdAt time.Time) error
	//HandleMainBusinessModify(ctx context.Context, id, name string, businessSystemID, businessMattersID []string, updatedAt time.Time) error
	//HandleMainBusinessMove(ctx context.Context, id, newParentID, newName string) error
	//HandleMainBusinessDelete(ctx context.Context, id string) error
	//HandleBusinessFormCreate(ctx context.Context, id, name, mid string, createdAt time.Time) error
	//HandleBusinessFormRename(ctx context.Context, id, name, mid string) error
	//HandleBusinessFormDelete(ctx context.Context, id string) error
	HandleDepartmentCreate(ctx context.Context, id, name string) error
	HandleDepartmentRename(ctx context.Context, id, newName string) error
	HandleDepartmentDelete(ctx context.Context, id string) error
	HandleDepartmentMove(ctx context.Context, id, newPathId string) error

	ToTree(ctx context.Context, req *QueryPageReqParam) (tree []*SummaryInfoTreeNode, err error)
	GetDepartmentPrecision(ctx context.Context, req *GetDepartmentPrecisionReq) (*GetDepartmentPrecisionRes, error)
	GetDepartsByPaths(ctx context.Context, req *CommonRest.GetDepartmentByPathReq) (resp *CommonRest.GetDepartmentByPathRes, err error)
	SyncStructure(ctx context.Context) (bool, error)
	GetSyncTime() (*GetSyncTimeResp, error)
	UpdateFileById(ctx context.Context, d *ObjectUpdateFileReq, id string) (string, error)
	FirstLevelDepartment(ctx context.Context) (res []*FirstLevelDepartmentRes, err error)
	GetDepartmentByIdOrThirdId(ctx context.Context, id string) (*GetResp, error)
	GetDepartmentsByIds(ctx context.Context, ids []string) ([]*GetResp, error)
}

type SummaryInfoTreeNode struct {
	ID         string                 `json:"id" binding:"required,uuid"`                            // 对象ID
	FatherID   string                 `json:"-"`                                                     // 对象上层节点ID
	Name       string                 `json:"name" binding:"required,VerifyObjectName"`              // 对象名称
	Type       string                 `json:"type" binding:"required,oneof=organization department"` // 对象类型
	Expand     bool                   `json:"expand"`                                                // 是否能展开
	Attributes any                    `json:"attributes,omitempty"`                                  // 对象属性
	Children   []*SummaryInfoTreeNode `json:"children"`                                              // 当前对象子节点列表，结构同对象
}

type TreeQueryParam struct {
	ID      string `json:"id" form:"id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 指定id下的所有节点
	Keyword string `json:"keyword" form:"keyword"`                                                               // 关键字查询
}

type QueryType struct {
	Type int `json:"type" form:"type" binding:"omitempty"` // 对象类型
}
type ObjectPathParam struct {
	ID string `json:"id" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象ID
}

type IdsReq struct {
	IDs []string `json:"ids" form:"ids" binding:"required,dive"`
}

type DownloadReq struct {
	FileId string `json:"file_id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 文件ID
}

/*
type CheckRepeatReq struct {
	ID         string  `json:"id" form:"id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                    // 对象ID，check_type = create表示上层节点ID，check_type = update表示节点自身ID
	CheckType  string  `json:"check_type" form:"check_type" binding:"required,oneof=create update"`                                     // 重复性校验类型：创建、更新
	ObjectType string  `json:"object_type" form:"object_type" binding:"omitempty,oneof=business_system business_matters main_business"` // 重复性校验对象类型，仅在check_type = create时生效
	Name       *string `json:"name" form:"name" binding:"TrimSpace,required,min=1,max=255,VerifyObjectName255"`                         // 对象名称
}
*/

/*
type ObjectCreateReq struct {
	Name      *string `json:"name" binding:"TrimSpace,required,min=1,max=255,VerifyObjectName"`                 // 对象名称
	UpperID   string  `json:"upper_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 上层对象ID
	Type      string  `json:"type" form:"type" binding:"required,oneof=business_matters"`                       // 对象类型
	Attribute any     `json:"attribute"`                                                                        // 类型对应对象属性，限制json object格式
}
*/

type ObjectUpdateReq struct {
	ObjectPathParam
	ObjectUpdateReqBody
}

type ObjectUpdateReqBody struct {
	Attribute    any   `json:"attribute"`                                      // 类型对应对象属性，限制json object格式，非必填，name attribute不能同时为空
	Subtype      int32 `json:"subtype" binding:"omitempty,min=1,max=3"`        // 对象子类型，用于对象类型二次分类，有效值包括1-行政区 2-部门 3-处（科）室
	MainDeptType int32 `json:"main_dept_type" binding:"omitempty,min=0,max=1"` //主部门设置，1主部门
}

type ObjectUpdateFileReq struct {
	FileId   string `json:"file_id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 文件ID
	FileName string `json:"file_name" binding:"required" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`    // 文件名称
}

/*
type ObjectMoveReqBody struct {
	OID  string `json:"oid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象id
	Name string `json:"name" binding:"omitempty,VerifyObjectName255"`                               // 对象重命名之后的名称，非必填
}
*/

type ObjectDeleteReq struct {
	IDS []string `json:"ids" binding:"len=1,dive,required,uuid"`
}

type BaseObject struct {
	ObjectPathParam
	Name   string `json:"name" binding:"required"`                                                                                           // object name
	IDPath string `json:"id_path"`                                                                                                           // path to object, concat by object ids
	Path   string `json:"path"`                                                                                                              // path to object, concat by object names
	Type   string `json:"type" form:"type" binding:"omitempty,oneof=organization department business_system business_matters business_form"` // 对象类型
}

type Organization struct {
	BaseObject
	OrgAttribute
}

type Department struct {
	BaseObject
	DepartmentAttribute
}

type BusinessSystem struct {
	BaseObject
}

type BusinessMatters struct {
	BaseObject
	BusinessMattersAttribute
}

type OrgAttribute struct {
	ShortName         string `json:"short_name" binding:"omitempty,VerifyNameStandard"`
	UniformCreditCode string `json:"uniform_credit_code" binding:"omitempty,VerifyUniformCreditCode"`
	Contacts          string `json:"contacts" binding:"omitempty,VerifyNameStandard"`
	PhoneNumber       string `json:"phone_number" binding:"omitempty,VerifyPhoneNumber"`
}

type DepartmentAttribute struct {
	DepartmentResponsibilities string `json:"department_responsibilities"  binding:"omitempty"`
	Contacts                   string `json:"contacts"  binding:"omitempty,VerifyNameStandard"`
	PhoneNumber                string `json:"phone_number"  binding:"omitempty,VerifyPhoneNumber"`
	FileSpecificationID        string `json:"file_specification_id" binding:"omitempty"`
	FileSpecificationName      string `json:"file_specification_name"  binding:"TrimSpace,omitempty"`
}

type BusinessMattersAttribute struct {
	DocumentBasisID   string `json:"document_basis_id" binding:"omitempty,uuid"`
	DocumentBasisName string `json:"document_basis_name" binding:"TrimSpace,omitempty,VerifyNameStandard"`
}

type MainBusinessAttribute struct {
	BusinessSystem  []string `json:"business_system"`
	BusinessMatters []string `json:"business_matters"`
}

type MainBusinessAttributeInfo struct {
	BusinessSystem  []ObjectInfo `json:"business_system"`
	BusinessMatters []ObjectInfo `json:"business_matters"`
}

type QueryPageReqParam struct {
	Offset         int    `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                                    // 页码
	Limit          int    `json:"limit" form:"limit,default=10" binding:"min=0,max=100" default:"10"`                                            // 每页大小，为0时不分页
	Sort           string `json:"sort" form:"sort,default=name" binding:"omitempty,oneof=created_at updated_at name register_at" default:"name"` // 排序类型
	Direction      string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向
	ID             string `json:"id" form:"id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                          // 对象id
	Keyword        string `json:"keyword" form:"keyword"`                                                                                        // 关键字查询
	IsAll          bool   `json:"is_all" form:"is_all,default=true" binding:"omitempty"`                                                         // 是否获取全部对象，默认true(获取全部对象)
	Type           string `json:"type" form:"type" binding:"omitempty,VerifyMultiObjectType"`                                                    // 对象类型，有效值包括organization（表示组织）和department（表示部门）
	Subtype        int32  `json:"subtype" form:"subtype" binding:"omitempty,min=1,max=3"`                                                        // 对象子类型，用于对象类型二次分类，有效值包括1-行政区 2-部门 3-处（科）室
	Names          string `json:"names"  form:"names"  binding:"omitempty"`                                                                      //多个对象名字的精确查找
	IDs            string `json:"ids" form:"ids" binding:"omitempty"`                                                                            // 多个对象id
	ExpandType     string `json:"expand_type" form:"expand_type" binding:"omitempty,oneof=department"`                                           // 展开到哪一层节点
	IsAttrReturned bool   `json:"is_attr_returned" form:"is_attr_returned,default=false" binding:"omitempty"`                                    // 是否返回属性
	// 第三方 ID
	ThirdDeptId string `json:"third_dept_id,omitempty" form:"third_dept_id"`
	Registered  int32  `json:"registered,omitempty" form:"registered"`
	Source      string `json:"source,omitempty" form:"source"`
}

type QueryOrgPageReqParam struct {
	Offset         int    `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                                    // 页码
	Limit          int    `json:"limit" form:"limit,default=10" binding:"min=0,max=100" default:"10"`                                            // 每页大小，为0时不分页
	Sort           string `json:"sort" form:"sort,default=name" binding:"omitempty,oneof=created_at updated_at name register_at" default:"name"` // 排序类型
	Direction      string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向
	ID             string `json:"id" form:"id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                          // 对象id
	Keyword        string `json:"keyword" form:"keyword"`                                                                                        // 关键字查询
	IsAll          bool   `json:"is_all" form:"is_all,default=true" binding:"omitempty"`                                                         // 是否获取全部对象，默认true(获取全部对象)
	Type           string `json:"type" form:"type" binding:"omitempty,VerifyMultiObjectType"`                                                    // 对象类型，有效值包括organization（表示组织）和department（表示部门）
	Subtype        int32  `json:"subtype" form:"subtype" binding:"omitempty,min=1,max=3"`                                                        // 对象子类型，用于对象类型二次分类，有效值包括1-行政区 2-部门 3-处（科）室
	Names          string `json:"names"  form:"names"  binding:"omitempty"`                                                                      //多个对象名字的精确查找
	IDs            string `json:"ids" form:"ids" binding:"omitempty"`                                                                            // 多个对象id
	ExpandType     string `json:"expand_type" form:"expand_type" binding:"omitempty,oneof=department"`                                           // 展开到哪一层节点
	IsAttrReturned bool   `json:"is_attr_returned" form:"is_attr_returned,default=false" binding:"omitempty"`                                    // 是否返回属性
	// 第三方 ID
	ThirdDeptId string `json:"third_dept_id,omitempty" form:"third_dept_id"`
	Registered  int32  `json:"registered,omitempty" form:"registered"`
	Source      string `json:"source,omitempty" form:"source"`
}

/*
type ObjectIDReqParam struct {
	IDS  []string `json:"ids" form:"ids" binding:"required,gt=0,unique,dive,uuid"`
	Type string   `json:"type" form:"type" binding:"required,oneof=business_system business_matters"`
}
*/

type ObjectInfo struct {
	ID   string `json:"id"`   // 对象ID
	Name string `json:"name"` // 对象名称
}

/*
type ObjectInfoResp struct {
	ID     string `json:"id"`      // 对象ID
	Name   string `json:"name"`    // 对象名称
	Path   string `json:"path"`    // 对象路径
	PathID string `json:"path_id"` // 对象路径ID
}
*/

type ObjectVo struct {
	ID           string                `gorm:"column:id;primaryKey" json:"id"`                                            // 对象ID
	Name         string                `gorm:"column:name;not null" json:"name"`                                          // 对象名称
	PathID       string                `gorm:"column:path_id;not null" json:"path_id"`                                    // 路径ID
	Path         string                `gorm:"column:path;not null" json:"path"`                                          // 路径
	Subtype      int32                 `gorm:"column:subtype" json:"subtype"`                                             // 对象子类型，用于对象类型二次分类
	MainDeptType int32                 `gorm:"column:main_dept_type" json:"main_dept_type"`                               //主部门设置，1主部门,0或空不是主部门
	Type         int32                 `gorm:"column:type" json:"type"`                                                   // 类型
	Attribute    string                `gorm:"column:attribute" json:"attribute"`                                         // 属性信息：包括简称、机构编码、信用代码等
	CreatedAt    time.Time             `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	UpdatedAt    time.Time             `gorm:"column:updated_at;not null;default:current_timestamp(3)" json:"updated_at"` // 更新时间
	DeletedAt    soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`             // 删除时间(逻辑删除)
	ThirdDeptId  string                `gorm:"column:f_third_dept_id" json:"third_dept_id"`                               //第三方部门ID
	IsRegister   int32                 `gorm:"column:is_register" json:"registered"`
	RegisterAt   time.Time             `gorm:"column:register_at" json:"register_at"`
	DeptTag      string                `gorm:"column:dept_tag" json:"dept_tag"`
	UserIds      string                `gorm:"column:user_ids" json:"user_ids"`
	OrgId        string                `gorm:"column:org_id" json:"org_id"`
}

type SummaryInfo struct {
	ID           string    `json:"id" binding:"required,uuid"`                            // 对象ID
	Name         string    `json:"name" binding:"required,VerifyObjectName"`              // 对象名称
	Type         string    `json:"type" binding:"required,oneof=organization department"` // 对象类型
	Subtype      int32     `json:"subtype" binding:"required,min=0,max=3"`                // 对象子类型，用于对象类型二次分类，有效值包括0-未分类 1-行政区 2-部门 3-处（科）室
	MainDeptType int32     `json:"main_dept_type" binding:"required,min=0,max=1"`         //主部门设置，1主部门
	Path         string    `json:"path" binding:"lte=65535"`                              // 对象路径
	PathID       string    `json:"path_id" binding:"lte=65535,gte=36"`                    // 对象ID路径
	Expand       bool      `json:"expand"`                                                // 是否能展开
	Attributes   any       `json:"attributes,omitempty"`                                  // 对象属性
	UpdatedAt    int64     `json:"updated_at,omitempty"`                                  // 更新时间
	ThirdDeptId  string    `json:"third_dept_id"`                                         //第三方部门ID
	IsRegister   int32     `gorm:"column:is_register" json:"registered"`
	RegisterAt   time.Time `gorm:"column:register_at" json:"register_at"`
	DeptTag      string    `gorm:"column:dept_tag" json:"dept_tag"`
	UserIds      string    `gorm:"column:user_ids" json:"user_ids"`
	UserName     string    `gorm:"-" json:"user_name"`
	OrgId        string    `gorm:"column:org_id" json:"org_id"`
	BusinessDuty string    `gorm:"-" json:"business_duty"`
}

type QueryPageReapParam struct {
	Entries    []*SummaryInfo `json:"entries" binding:"required"`                      // 对象列表
	TotalCount int64          `json:"total_count" binding:"required,ge=0" example:"3"` // 当前筛选条件下的对象数量
}

type UriReqParamOId struct {
	Id *string ` json:"id,omitempty" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象ID，uuid
}

type GetResp struct {
	ID                   string    `json:"id" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d" binding:"required,uuid"` // 对象ID
	Name                 string    `json:"name" binding:"required,VerifyObjectName"`                                  // 对象名称
	Path                 string    `json:"path" binding:"lte=65535"`
	PathID               string    `json:"path_id" binding:"lte=65535,gte=36"`
	Type                 string    `json:"type" binding:"required,oneof=root organization department"`
	Subtype              int32     `json:"subtype" binding:"required,min=0,max=3"`                 // 部门子类型，用于对象类型二次分类，有效值包括0-未分类 1-行政区 2-部门 3-处（科）室
	MainDeptType         int32     `json:"main_dept_type" binding:"required,min=0,max=1"`          //主部门设置，1主部门
	ParentTypeEditStatus int32     `json:"parent_type_edit_status" binding:"required,min=0,max=1"` // 父类型是否编辑状态1是，0否
	Attributes           any       `json:"attributes"`                                             // 对象属性
	ThirdDeptId          string    `json:"third_dept_id"`                                          //第三方部门ID
	IsRegister           int32     `gorm:"column:is_register" json:"registered"`
	RegisterAt           time.Time `gorm:"column:register_at" json:"register_at"`
	DeptTag              string    `gorm:"column:dept_tag" json:"dept_tag"`
	UserIds              string    `gorm:"-" json:"user_ids"`   // 用户ID，逗号分隔
	UserNames            string    `gorm:"-" json:"user_names"` // 用户名称，逗号分隔
}

type QueryReqParam struct {
	ID    string `json:"id" form:"id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象id
	IsAll bool   `json:"is_all" form:"is_all,default=true" binding:"omitempty"`                                // 是否显示全部子对象类型,默认显示全部
}

type TypeInfo struct {
	Types []string `json:"types"`
}

/*
type ObjectPathInfoResp struct {
	ID   string `json:"id" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 对象ID
	Name string `json:"name" example:"域"`                                  // 对象名称
	Type string `json:"type" example:"domain"`                             // 对象类型
}
*/

/*
type SuggestedNameReq struct {
	ParentID string `json:"parent_id" form:"parent_id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 新的父对象ID
}
*/

/*
func (req *ObjectCreateReq) ToModel(ctx context.Context, upper *model.Object) (*model.Object, error) {

	if upper == nil {
		upper = &model.Object{
			Type: -1,
		}
	}

	attrMap, err := jsonToMap(req.Attribute)
	if err != nil {
		return nil, err
	}

	id := util.NewUUID()

	var obj = &model.Object{
		Name: *req.Name,
		ID:   id,
		Type: constant.ObjectTypeStringToInt(req.Type),
	}
	if upper.PathID == "" || upper.Path == "" {
		obj.PathID = id
		obj.Path = *req.Name
	} else {
		obj.PathID = upper.PathID + "/" + id
		obj.Path = upper.Path + "/" + *req.Name
	}

	var attrBytes []byte
	switch constant.ObjectTypeString(req.Type) {
	case constant.ObjectTypeStringOrganization:
		orgAttribute := &OrgAttribute{
			ShortName:         getStringFieldOrDefault(attrMap, "short_name"),
			UniformCreditCode: getStringFieldOrDefault(attrMap, "uniform_credit_code"),
			Contacts:          getStringFieldOrDefault(attrMap, "contacts"),
			PhoneNumber:       getStringFieldOrDefault(attrMap, "phone_number"),
		}

		valid, err := form_validator.BindStructAndValid(orgAttribute)
		if !valid {
			log.WithContext(ctx).Error(err.Error())
			_, ok := err.(form_validator.ValidErrors)
			if ok {
				err = errorcode.Detail(errorcode.PublicInvalidParameter, err)
				return nil, err
			}
		}

		attrBytes, err = json.Marshal(orgAttribute)

	case constant.ObjectTypeStringDepartment:
		depAttr := &DepartmentAttribute{
			DepartmentResponsibilities: getStringFieldOrDefault(attrMap, "department_responsibilities"),
			Contacts:                   getStringFieldOrDefault(attrMap, "contacts"),
			PhoneNumber:                getStringFieldOrDefault(attrMap, "phone_number"),
			FileSpecificationID:        getStringFieldOrDefault(attrMap, "file_specification_id"),
			FileSpecificationName:      getStringFieldOrDefault(attrMap, "file_specification_name"),
		}

		if len(depAttr.FileSpecificationID) != 0 || len(depAttr.FileSpecificationName) != 0 {
			return nil, errorcode.Desc(errorcode.BusinessStructureObjectUpdateFileName)
		}

		valid, err := form_validator.BindStructAndValid(depAttr)
		if !valid {
			log.WithContext(ctx).Error(err.Error())
			_, ok := err.(form_validator.ValidErrors)
			if ok {
				err = errorcode.Detail(errorcode.PublicInvalidParameter, err)
				return nil, err
			}
		}

		attrBytes, err = json.Marshal(depAttr)
	case constant.ObjectTypeStringBusinessMatters:
		mattersAttr := &BusinessMattersAttribute{
			DocumentBasisID:   getStringFieldOrDefault(attrMap, "document_basis_id"),
			DocumentBasisName: getStringFieldOrDefault(attrMap, "document_basis_name"),
		}

		if len(mattersAttr.DocumentBasisID) != 0 || len(mattersAttr.DocumentBasisName) != 0 {
			return nil, errorcode.Desc(errorcode.BusinessStructureObjectUpdateFileName)
		}

		valid, err := form_validator.BindStructAndValid(mattersAttr)
		if !valid {
			log.WithContext(ctx).Error(err.Error())
			_, ok := err.(form_validator.ValidErrors)
			if ok {
				err = errorcode.Detail(errorcode.PublicInvalidParameter, err)
				return nil, err
			}
		}

		attrBytes, err = json.Marshal(mattersAttr)

	default:
		err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
	}

	if err != nil {
		return nil, errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
	}

	if len(attrBytes) == 2 {
		attrBytes = nil
	}
	obj.Attribute = string(attrBytes)

	return obj, nil
}
*/

func (req *ObjectUpdateReq) ToModel(ctx context.Context, objType string) (obj *model.Object, resMap map[string]interface{}, err error) {
	if req.Attribute == nil {
		err = errorcode.Desc(errorcode.BusinessStructureObjectAttrEmpty)
		return
	}
	attrMap, ok := req.Attribute.(map[string]interface{})
	if !ok {
		err = errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
		return
	}
	resMap = make(map[string]interface{})

	obj = &model.Object{}
	var attrBytes []byte

	switch constant.ObjectTypeString(objType) {

	case constant.ObjectTypeStringOrganization:

		orgAttribute := &OrgAttribute{
			ShortName:         getStringFieldOrDefault(attrMap, "short_name"),
			UniformCreditCode: getStringFieldOrDefault(attrMap, "uniform_credit_code"),
			Contacts:          getStringFieldOrDefault(attrMap, "contacts"),
			PhoneNumber:       getStringFieldOrDefault(attrMap, "phone_number"),
		}
		if v, ok := attrMap["short_name"]; ok {
			resMap["short_name"] = v
		}
		if v, ok := attrMap["uniform_credit_code"]; ok {
			resMap["uniform_credit_code"] = v
		}
		if v, ok := attrMap["contacts"]; ok {
			resMap["contacts"] = v
		}
		if v, ok := attrMap["phone_number"]; ok {
			resMap["phone_number"] = v
		}
		var valid bool
		valid, err = form_validator.BindStructAndValid(orgAttribute)
		if !valid {
			log.WithContext(ctx).Error(err.Error())
			_, ok := err.(form_validator.ValidErrors)
			if ok {
				err = errorcode.Detail(errorcode.PublicInvalidParameter, err)
				return
			}
		}

		attrBytes, err = json.Marshal(orgAttribute)

	case constant.ObjectTypeStringDepartment:

		depAttr := &DepartmentAttribute{
			DepartmentResponsibilities: getStringFieldOrDefault(attrMap, "department_responsibilities"),
			Contacts:                   getStringFieldOrDefault(attrMap, "contacts"),
			PhoneNumber:                getStringFieldOrDefault(attrMap, "phone_number"),
			FileSpecificationID:        getStringFieldOrDefault(attrMap, "file_specification_id"),
			FileSpecificationName:      getStringFieldOrDefault(attrMap, "file_specification_name"),
		}

		if len(depAttr.FileSpecificationID) != 0 || len(depAttr.FileSpecificationName) != 0 {
			fileIds := strings.Split(depAttr.FileSpecificationID, ",")
			fileNames := strings.Split(depAttr.FileSpecificationName, ",")
			if len(fileIds) != len(fileNames) {
				return nil, nil, errorcode.Desc(errorcode.BusinessStructureObjectUpdateFileName)
			}
		}

		if v, ok := attrMap["department_responsibilities"]; ok {
			resMap["department_responsibilities"] = v
		}
		if v, ok := attrMap["contacts"]; ok {
			resMap["contacts"] = v
		}
		if v, ok := attrMap["phone_number"]; ok {
			resMap["phone_number"] = v
		}
		if v, ok := attrMap["file_specification_id"]; ok {
			resMap["file_specification_id"] = v
		}
		if v, ok := attrMap["file_specification_name"]; ok {
			resMap["file_specification_name"] = v
		}
		var valid bool
		valid, err = form_validator.BindStructAndValid(depAttr)
		if !valid {
			log.WithContext(ctx).Error(err.Error())
			_, ok := err.(form_validator.ValidErrors)
			if ok {
				err = errorcode.Detail(errorcode.PublicInvalidParameter, err)
				return nil, nil, err
			}
		}

		attrBytes, err = json.Marshal(depAttr)
	default:
		err = errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
	}

	if err != nil {
		return nil, nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
	}

	if len(attrBytes) == 2 {
		attrBytes = nil
	}

	obj.Attribute = string(attrBytes)

	return obj, resMap, err
}

/*
func jsonToMap(attr interface{}) (map[string]any, error) {
	if attr == nil {
		return make(map[string]any), nil
	}
	res, ok := attr.(map[string]interface{})
	if !ok {
		return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
	}
	return res, nil
}
*/

func getStringFieldOrDefault(attrMap map[string]any, field string) string {
	res, ok := attrMap[field]
	if !ok {
		res = ""
	}
	return res.(string)
}

func getArrayFieldOrDefault(attrMap map[string]any, field string) []string {
	res, ok := attrMap[field]
	if !ok {
		res = nil
	}
	return res.([]string)
}

func UpdateAttr(dbAttr, reqAttr string) string {
	var dbMap = make(map[string]string)
	var reqMap = make(map[string]string)
	json.Unmarshal([]byte(dbAttr), &dbMap)
	json.Unmarshal([]byte(reqAttr), &reqMap)

	for k, _ := range reqMap {
		if v, ok := reqMap[k]; ok {
			dbMap[k] = v
		}
		//dbMap[k] = reqMap[k]
	}
	res, _ := json.Marshal(dbMap)
	if len(res) == 2 {
		res = nil
	}
	return string(res)
}

func NewRenameObjectMessage(id, name string, oType int32) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["id"] = id
	payload["name"] = name
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	/*
		if oType == int32(constant.ObjectTypeBusinessSystem) {
			return &model.MqMessage{
				Topic:   producers.RenameBusinessSystemTopic,
				Message: string(msg.Marshal()),
			}
		} else if oType == int32(constant.ObjectTypeBusinessMatters) {
			return &model.MqMessage{
				Topic:   producers.RenameBusinessMattersTopic,
				Message: string(msg.Marshal()),
			}
		} else*/if oType == int32(constant.ObjectTypeDepartment) {
		return &model.MqMessage{
			Topic:   kafka.RenameDepartmentTopic,
			Message: string(msg.Marshal()),
		}
	} else if oType == int32(constant.ObjectTypeOrganization) {
		return &model.MqMessage{
			Topic:   kafka.RenameOrganizationTopic,
			Message: string(msg.Marshal()),
		}
	}
	return nil
}

func NewDeleteObjectMessage(id string, oType int32) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["id"] = id
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	/*
		if oType == int32(constant.ObjectTypeBusinessSystem) {
			return &model.MqMessage{
				Topic:   producers.DeleteBusinessSystemTopic,
				Message: string(msg.Marshal()),
			}
		} else if oType == int32(constant.ObjectTypeBusinessMatters) {
			return &model.MqMessage{
				Topic:   producers.DeleteBusinessMattersTopic,
				Message: string(msg.Marshal()),
			}
		} else*/if oType == int32(constant.ObjectTypeDepartment) {
		return &model.MqMessage{
			Topic:   kafka.DeleteDepartmentTopic,
			Message: string(msg.Marshal()),
		}
	} else if oType == int32(constant.ObjectTypeOrganization) {
		return &model.MqMessage{
			Topic:   kafka.DeleteOrganizationTopic,
			Message: string(msg.Marshal()),
		}
	} /* else if oType == int32(constant.ObjectTypeMainBusiness) {
		return &model.MqMessage{
			Topic:   producers.DeleteMainBusinessTopic,
			Message: string(msg.Marshal()),
		}
	}*/
	return nil
}

func NewMoveObjectMessage(pathID, newPathID, path, newPath, newName string, oType int32) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["path_id"] = pathID
	payload["new_path_id"] = newPathID
	payload["path_name"] = path
	payload["new_path_name"] = newPath
	payload["new_name"] = newName
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	if oType == int32(constant.ObjectTypeOrganization) {
		return &model.MqMessage{
			Topic:   kafka.MoveOrganizationTopic,
			Message: string(msg.Marshal()),
		}
	} else if oType == int32(constant.ObjectTypeDepartment) {
		return &model.MqMessage{
			Topic:   kafka.MoveDepartmentTopic,
			Message: string(msg.Marshal()),
		}
	} /*else if oType == int32(constant.ObjectTypeBusinessSystem) {
		return &model.MqMessage{
			Topic:   producers.MoveBusinessSystemTopic,
			Message: string(msg.Marshal()),
		}
	} else if oType == int32(constant.ObjectTypeBusinessMatters) {
		return &model.MqMessage{
			Topic:   producers.MoveBusinessMattersTopic,
			Message: string(msg.Marshal()),
		}
	}*/
	return nil
}

/*
func NewMoveMainBusinessMessage(pathID, newPathID, path, newPath, newName, ParentType string) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["path_id"] = pathID
	payload["new_path_id"] = newPathID
	payload["path_name"] = path
	payload["new_path_name"] = newPath
	payload["new_name"] = newName
	payload["parent_type"] = ParentType
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	return &model.MqMessage{
		Topic:   producers.MoveMainBusinessTopic,
		Message: string(msg.Marshal()),
	}
}
*/

type GetDepartmentPrecisionReq struct {
	IDS []string `json:"ids" form:"ids" binding:"required,gt=0,unique,dive,uuid"`
}
type GetDepartmentPrecisionRes struct {
	Departments []*DepartmentInternal `json:"departments"`
}
type DepartmentInternal struct {
	ID          string `gorm:"column:id;primaryKey" json:"id"`                                // 对象ID
	Name        string `gorm:"column:name;not null" json:"name"`                              // 对象名称
	PathID      string `gorm:"column:path_id;not null" json:"path_id"`                        // 路径ID
	Path        string `gorm:"column:path;not null" json:"path"`                              // 路径
	Type        int32  `gorm:"column:type" json:"type"`                                       // 类型
	DeletedAt   int32  `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"` // 删除时间(逻辑删除)
	ThirdDeptId string `gorm:"column:f_third_dept_id" json:"third_dept_id"`                   //第三方部门ID
}

type GetSyncTimeResp struct {
	SyncedAt int64 `json:"synced_at" form:"synced_at" binding:"required"` //同步时间
}
type FirstLevelDepartmentRes struct {
	ID     string `json:"id" `      // 对象ID
	Name   string `json:"name"`     // 对象名称
	Path   string `json:"path" `    // 对象路径
	PathID string `json:"path_id" ` // 对象ID路径
}
