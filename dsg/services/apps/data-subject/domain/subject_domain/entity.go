package subject_domain

import (
	"context"
	"encoding/json"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/af_sailor"

	"github.com/kweaver-ai/idrm-go-common/util/iter"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/classify"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/data_subject"

	bg "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/business-grooming"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/subject_domain"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/middleware"

	"github.com/google/uuid"
	"github.com/samber/lo"
)

type SubjectDomainUseCase interface {
	objectExistCheck(ctx context.Context, id string) error
	parentNodeExistCheck(ctx context.Context, parentId string) error
	AddObject(ctx context.Context, req *AddObjectReq) (*AddObjectResp, error)
	nameExistCheck(ctx context.Context, name string, parentId string, excludeIds ...string) error
	DelObject(ctx context.Context, req *DelObjectReq) (*DelObjectResp, error)
	UpdateObject(ctx context.Context, req *UpdateObjectReq) (*UpdateObjectResp, error)
	GetObject(ctx context.Context, req *GetObjectReq) (*GetObjectResp, error)
	GetPath(ctx context.Context, req *GetPathReq) (*GetPathResp, error)
	GetLevelCount(ctx context.Context, req *GetLevelCountReq) (*GetLevelCountResp, error)
	List(ctx context.Context, req *ListObjectsReq) (*ListObjectsResp, error)
	CheckRepeat(ctx context.Context, req *CheckRepeatReq) (*CheckRepeatResp, error)
	AddBusinessObject(ctx context.Context, req *AddBusinessObjectReq) (*AddBusinessObjectResp, error)
	GetBusinessObject(ctx context.Context, req *GetBusinessObjectReq) (*GetBusinessObjectResp, error)
	CheckReferences(ctx context.Context, req *CheckReferencesReq) (*CheckReferencesResp, error)
	Check(ctx context.Context, id string, ids []string) (bool, []string, error)
	GetBusinessObjectOwner(ctx context.Context, req *GetBusinessObjectOwnerReq) (*GetBusinessObjectOwnerResp, error)
}

/////////////////// ListObjects ///////////////////

type ListObjectsReq struct {
	ListObjectsReqQueryParam `param_type:"query"`
}

type ListObjectsReqQueryParam struct {
	ParentID  string `json:"parent_id" form:"parent_id" binding:"TrimSpace,omitempty,uuid"`                     // 父对象id
	Type      string `json:"type" form:"type" binding:"TrimSpace,omitempty,VerifyMultiSubjectDomainObjectType"` // 对象类型 ，subject_domain_group业务对象分组，subject_domain业务对象，business_object业务对象，business_activity业务活动，logic_entity逻辑实体，attribute属性
	IsAll     bool   `json:"is_all" form:"is_all,default=false" binding:"omitempty"`                            // 是否获取全部层级对象
	NeedCount bool   `json:"need_count" form:"need_count,default=false" binding:"omitempty"`                    // 是否计数
	NeedTotal bool   `json:"need_total" form:"need_total,default=false" binding:"omitempty" `                   // 在查询所有L1的时候是否需要总数
	request.PageInfoWithKeyword
}

type ListObjectsResp struct {
	PageResultNew[ObjectInfo]
}

type ObjectInfo struct {
	ID               string   `json:"id"  maxLength:"36"  example:"3821e024-e218-43c0-9931-e82afc32dbb1"`                            // 对象id
	Name             string   `json:"name"  maxLength:"128"  example:"用户"`                                                           // 对象名称
	Description      string   `json:"description" maxLength:"255"  example:"用户业务域分组"`                                                // 描述
	Type             string   `json:"type" maxLength:"20"  example:"subject_domain_group"`                                           // 对象类型,，subject_domain_group业务对象分组，subject_domain业务对象，business_object业务对象，business_activity业务活动，logic_entity逻辑实体，attribute属性
	LogicViewCount   int64    `json:"logic_view_count"   example:"2"`                                                                // 视图的数量
	IndicatorCount   int64    `json:"indicator_count"   example:"3"`                                                                 // 指标的数量
	InterfaceCount   int64    `json:"interface_count" example:"3"`                                                                   // 接口服务的数量
	HasChild         bool     `json:"has_child" example:"false"`                                                                     // 是否有子节点
	PathID           string   `json:"path_id"   example:"0251c03c-2123-4041-845b-27613bcb9904/2446beb9-8059-48e8-9307-e922c5bc9bbd"` // 路径id
	PathName         string   `json:"path_name"  example:"数据治理/业务梳理"`                                                                // 路径名称
	Owners           []string `json:"owners" binding:"omitempty"`                                                                    // 拥有者数组
	CreatedBy        string   `json:"created_by"  maxLength:"128"  example:"af"`                                                     // 创建人名称
	CreatedAt        int64    `json:"created_at"  `                                                                                  // 创建时间，秒
	UpdatedBy        string   `json:"updated_by" maxLength:"128"  example:"af"`                                                      // 修改人名称
	UpdatedAt        int64    `json:"updated_at"  `                                                                                  // 修改时间，秒
	ChildCount       int64    `json:"child_count"  binding:"omitempty" example:"10"`                                                 // 子对象数量
	SecondChildCount int64    `json:"second_child_count"  binding:"omitempty" example:"8"`                                           // 第二层子对象数量 only for BusinessObject and BusinessActivity
}

func ToObjectInfo(m *model.SubjectDomain) *ObjectInfo {
	return &ObjectInfo{
		ID:          m.ID,
		Name:        m.Name,
		Description: m.Description,
		Type:        constant.SubjectDomainObjectIntToString(m.Type),
		PathID:      m.PathID,
		PathName:    m.Path,
		UpdatedAt:   m.UpdatedAt.UnixMilli(),
	}
}

func NewListObjectsResp(summary []*ObjectInfo, total int64) *ListObjectsResp {
	return &ListObjectsResp{
		PageResultNew: PageResultNew[ObjectInfo]{
			Entries:    summary,
			TotalCount: total,
		},
	}
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

/////////////////// CheckRepeat ///////////////////

type CheckRepeatReq struct {
	CheckRepeatReqParamBody `param_type:"body"`
}

type CheckRepeatReqParamBody struct {
	ParentID string `json:"parent_id" binding:"TrimSpace,omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 父节点id
	ID       string `json:"id" binding:"TrimSpace,omitempty,uuid" example:"2ece555c-9095-41d9-9936-0163ae7453a7"`        // 对象id
	Name     string `json:"name" binding:"required,VerifyXssString,VerifyName128NoSpaceNoSlash"`                         // 对象名，必填，仅支持中英文数字中划线下划线
}

type CheckRepeatResp struct {
	Name   string `json:"name" example:"obj_name"` // 被检测的对象名称
	Repeat bool   `json:"repeat" example:"false"`  // 是否重复
}

/////////////////// AddObject ///////////////////

type AddObjectReq struct {
	AddObjectReqBodyParam `param_type:"body"`
}

func (r *AddObjectReq) ToModel(userInfo *middleware.User, parent *model.SubjectDomain) *model.SubjectDomain {
	if r == nil {
		return nil
	}
	var objectType int8
	if r.Type != "" {
		objectType = constant.SubjectDomainObjectStringToInt(r.Type)
	}

	id := uuid.NewString()
	var pathID, path string
	if parent == nil {
		pathID = id
		path = r.Name
	} else {
		pathID = parent.PathID + "/" + id
		path = parent.Path + "/" + r.Name
	}
	now := time.Now()
	object := &model.SubjectDomain{
		ID:           id,
		Name:         r.Name,
		Description:  r.Description,
		Type:         objectType,
		PathID:       pathID,
		Path:         path,
		Owners:       r.Owners,
		CreatedAt:    now,
		CreatedByUID: userInfo.ID,
		UpdatedAt:    now,
		UpdatedByUID: userInfo.ID,
	}
	return object
}

type AddObjectReqBodyParam struct {
	ParentID    string   `json:"parent_id" binding:"TrimSpace,omitempty,uuid"`                                                                  // 父对象id
	Name        string   `json:"name" binding:"required,VerifyXssString,min=0,max=128"`                                                         // 对象名称，仅支持中英文数字中划线下划线
	Description string   `json:"description" binding:"omitempty,VerifyXssString,min=0,max=255"`                                                 // 描述，非必填
	Owners      []string `json:"owners" binding:"omitempty,max=1,dive,uuid"`                                                                    // 用户id数组，最大长度为1
	Type        string   `json:"type" binding:"TrimSpace,required,oneof=subject_domain_group subject_domain business_object business_activity"` // 对象类型
}

type AddObjectResp struct {
	ID string `json:"id"  example:"d1529799-e8a1-4815-a7a3-533a9dbea8	bd"` // 对象ID
}

/////////////////// UpdateObject ///////////////////

type UpdateObjectReq struct {
	UpdateObjectBodyReqParam `param_type:"body"`
}

type UpdateObjectBodyReqParam struct {
	ID          string   `json:"id"  binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`                           // 对象id
	Name        string   `json:"name" binding:"required,VerifyXssString,VerifyName128NoSpaceNoSlash"`                                            // Object名称，仅支持中英文数字中划线下划线
	Description string   `json:"description" binding:"omitempty,VerifyXssString,VerifyDescription255"`                                           // 描述，非必填
	Owners      []string `json:"owners" binding:"omitempty,max=1,dive,uuid"`                                                                     // 用户id数组，最大长度为1
	Type        string   `json:"type" binding:"TrimSpace,omitempty,oneof=subject_domain_group subject_domain business_object business_activity"` // 对象类型
}

type UpdateObjectResp struct {
	ID string `json:"id"  example:"d1529799-e8a1-4815-a7a3-533a9dbea8bd"` // 对象ID
}

// ///////////////// DelObject ///////////////////
type DelObjectReq struct {
	DelObjectUriReq `param_type:"uri"`
}

type DelObjectUriReq struct {
	ObjectIDPathParam
}

type ObjectIDPathParam struct {
	DID string `json:"did" uri:"did" binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象id
}

type DelObjectResp struct {
	ID string `json:"id"  example:"d1529799-e8a1-4815-a7a3-533a9dbea8bd"` // 对象ID
}

/////////////////// GetObject ///////////////////

type GetObjectReq struct {
	ObjectIDReqQueryParam `param_type:"query"`
}
type ObjectIDReqQueryParam struct {
	ID string `json:"id"  form:"id" binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象id
}

type GetObjectResp struct {
	ID          string        `json:"id"  maxLength:"36"  example:"3821e024-e218-43c0-9931-e82afc32dbb1"`                            // 对象id
	Name        string        `json:"name"  maxLength:"128"  example:"用户"`                                                           // 对象名称
	Description string        `json:"description" maxLength:"255"  example:"用户业务域分组"`                                                // 描述
	Type        string        `json:"type"`                                                                                          // 对象类型，subject_domain_group业务对象分组，subject_domain业务对象，business_object业务对象，business_activity业务活动，logic_entity逻辑实体，attribute属性
	PathID      string        `json:"path_id"   example:"0251c03c-2123-4041-845b-27613bcb9904/2446beb9-8059-48e8-9307-e922c5bc9bbd"` // 路径id
	PathName    string        `json:"path_name"  example:"数据治理/业务梳理"`                                                                // 路径名称
	Owners      *UserInfoResp `json:"owners"`                                                                                        // 拥有者
	CreatedBy   string        `json:"created_by"  maxLength:"128"  example:"af"`                                                     // 创建人名称
	CreatedAt   int64         `json:"created_at"   `                                                                                 // 创建时间，秒
	UpdatedBy   string        `json:"updated_by" maxLength:"128"  example:"af"`                                                      // 修改人名称
	UpdatedAt   int64         `json:"updated_at" `                                                                                   // 修改时间，秒
}
type UserInfoResp struct {
	UID      string `json:"user_id"  example:"3821e024-e218-43c0-9931-e82afc32dbb1"` // 用户id，uuid
	UserName string `json:"user_name"  example:"af"`                                 // 用户名
}

func NewGetObjectResp(m *model.SubjectDomain, userInfo *middleware.User) *GetObjectResp {
	return &GetObjectResp{
		ID:          m.ID,
		Name:        m.Name,
		Description: m.Description,
		PathID:      m.PathID,
		PathName:    m.Path,
		Type:        constant.SubjectDomainObjectIntToString(m.Type),
		Owners: &UserInfoResp{
			UID:      userInfo.ID,
			UserName: userInfo.Name,
		},
	}
}

// ///////////////// GetAttribute ///////////////////
type GetAttributeReq struct {
	AttributeQueryParam `param_type:"query"`
	// RecommendInfoReqBodyParam `param_type:"body" binding:"omitempty"`
}
type AttributeQueryParam struct {
	ID       string `json:"id"  form:"id" binding:"TrimSpace,omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`              // 属性id
	ParentID string `json:"parent_id" form:"parent_id" binding:"TrimSpace,omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 父对象id
	Keyword  string `json:"keyword" form:"keyword" binding:"omitempty,VerifyXssString"`                                                   // 关键字查询，字符无限制
	ViewID   string `json:"view_id" form:"view_id" binding:"TrimSpace,omitempty,uuid"`                                                    // 视图id，推荐时候需要
	FieldID  string `json:"field_id" form:"field_id" binding:"TrimSpace,omitempty,uuid"`                                                  // 字段id，推荐时候需要
}

// type RecommendInfoReqBodyParam struct {
// 	RecommendInfo *sailor_service.DataCategorizeReq `json:"recommend_info" form:"recommend_info" binding:"omitempty"` // 推荐信息
// }

type GetAttributRes struct {
	Attributes []*GetAttributResp `json:"attributes"`
}
type GetAttributResp struct {
	ID          string `json:"id"`           // 对象id
	Name        string `json:"name"`         // 对象名称
	Description string `json:"description"`  // 描述
	Type        string `json:"type"`         // 对象类型
	PathID      string `json:"path_id"`      // 路径id
	PathName    string `json:"path_name"`    // 路径名称
	LabelId     string `json:"label_id"`     // 标签ID
	LabelName   string `json:"label_name"`   // 标签名称
	LabelIcon   string `json:"label_icon"`   // 标签颜色
	LabelPath   string `json:"label_path"`   //  标签路径
	LsRecommend bool   `json:"ls_recommend"` //是否推荐

}

type GetAttributesReq struct {
	GetAttributeBodyReqParam `param_type:"body"`
}

type GetAttributeBodyReqParam struct {
	IDs []string `json:"ids" form:"ids" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

// ///////////////// LevelCount ///////////////////
type IDReqQueryParam struct {
	ID string `json:"id" form:"id" binding:"TrimSpace,omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象id
}

type GetLevelCountReq struct {
	IDReqQueryParam `param_type:"query"`
}

type GetLevelCountResp struct {
	LevelBusinessDomain     int64                                     `json:"level_business_domain"`      // 第1级对象个数，即 业务域
	LevelSubjectDomain      int64                                     `json:"level_subject_domain"`       // 第2级对象个数，即 业务对象
	LevelBusinessObject     int64                                     `json:"level_business_object"`      // 第3级对象个数，即 业务对象/业务活动
	LevelBusinessObj        int64                                     `json:"level_business_obj"`         // 第3级对象个数，即 业务对象
	LevelBusinessAct        int64                                     `json:"level_business_act"`         // 第3级对象个数，即 业务活动
	LevelLogicEntities      int64                                     `json:"level_logic_entities"`       // 第4级对象个数，即 逻辑实体
	LevelAttributes         int64                                     `json:"level_attributes"`           // 第5级对象个数，即 属性
	TotalLogicalView        int64                                     `json:"total_logical_view"`         // 所有业务对象关联的逻辑实体的数量
	TotalIndicator          int64                                     `json:"total_indicator"`            // 所有绑定主体域的技术指标的数量
	TotalInterfaceService   int64                                     `json:"total_interface_service"`    // 所有绑定主体域的接口服务的数量
	SubjectDomainGroupCount []*subject_domain.SubjectDomainGroupCount `json:"subject_domain_group_count"` // 业务对象中逻辑实体分布
}

/////////////////// AddBusinessObject ///////////////////

type AddBusinessObjectReq struct {
	AddBusinessObjectReqBodyParam `param_type:"body"`
}

type AddBusinessObjectReqBodyParam struct {
	ID            string         `json:"id"  binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 业务对象/业务活动id
	LogicEntities []*LogicEntity `json:"logic_entities" binding:"gt=0,dive"`                                                   // 业务逻辑实体信息
	RefID         []string       `json:"ref_id" binding:"unique,dive,uuid"`                                                    // 引用业务对象/业务活动id数组
}

type LogicEntity struct {
	ID         string       `json:"id" binding:"TrimSpace,required,uuid"` // 业务逻辑实体id,uuid
	Name       string       `json:"name" binding:"required,TrimSpace"`    // 业务逻辑实体名称
	Attributes []*Attribute `json:"attributes" binding:"gt=0,dive"`       // 业务属性信息
}

type Attribute struct {
	ID         string `json:"id" binding:"TrimSpace,required,uuid"`                    // 业务属性id,uuid
	Name       string `json:"name" binding:"required,TrimSpace,VerifyName255NoSpace"`  // 业务属性名称
	Unique     bool   `json:"unique"`                                                  // 唯一标识
	StandardID string `json:"standard_id" binding:"TrimSpace,omitempty,VerifyModelID"` // 数据标准id
	LabelID    string `json:"label_id" binding:"TrimSpace,omitempty,VerifyModelID"`    //标签id
	// StandardStatus string `json:"standard_status" binding:"omitempty,oneof=normal modified deleted"` //标准化状态：""，"normal"，"modified"，"deleted"
}

type AddBusinessObjectResp struct {
	ID string `json:"id" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象id
}

/////////////////// GetBusinessObject ///////////////////

type GetBusinessObjectReq struct {
	ObjectIDReqQueryParam `param_type:"query"`
}

type GetBusinessObjectResp struct {
	LogicEntities []*LogicEntityInfo `json:"logic_entities"` // 业务逻辑实体信息
	RefInfo       []*RefInfo         `json:"ref_info"`       // 引用的业务对象/业务活动信息
}

type LogicEntityInfo struct {
	ID         string           `json:"id"`         // 业务逻辑实体id
	Name       string           `json:"name"`       // 业务逻辑实体名称
	Attributes []*AttributeInfo `json:"attributes"` // 业务属性信息
}

type AttributeInfo struct {
	ID        string `json:"id"`         // 业务属性id
	Name      string `json:"name"`       // 业务属性名称
	Path      string `json:"path"`       //路径
	Unique    bool   `json:"unique"`     // 唯一标识
	LabelID   string `json:"label_id" `  //标签id
	LabelName string `json:"label_name"` //标签名称
	LabelIcon string `json:"label_icon"` //标签颜色
	LabelPath string `json:"label_path"` //  标签路径
	// StandardStatus string        `json:"standard_status" swagger:ignore` //标准状态
	StandardInfo *StandardInfo `json:"standard_info"` // 数据标准信息
}

type StandardInfo struct {
	ID        string `json:"id"`         // 标准id
	Name      string `json:"name"`       // 标准中文名
	NameEn    string `json:"name_en"`    // 标准英文名
	DataType  string `json:"data_type"`  // 数据类型
	LabelID   string `json:"label_id" `  //标签id
	LabelName string `json:"label_name"` //标签名称
	LabelIcon string `json:"label_icon"` //标签颜色
	LabelPath string `json:"label_path"` //  标签路径

}

func NewStandardInfoFromBG(standard bg.StandardInfo) *StandardInfo {
	return &StandardInfo{
		ID:       standard.ID,
		Name:     standard.Name,
		NameEn:   standard.NameEn,
		DataType: standard.DataType,
	}
}

func NewStandardInfo(standard *model.StandardInfo) *StandardInfo {
	return &StandardInfo{
		ID:       strconv.Itoa(int(standard.ID)),
		Name:     standard.Name,
		NameEn:   standard.NameEn,
		DataType: standard.DataType,
	}
}

type RefInfo struct {
	ID       string `json:"id" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象ID
	Name     string `json:"name" example:"obj_name"`                           // 对象名称
	PathID   string `json:"path_id"`                                           // 路径id
	PathName string `json:"path_name"`                                         // 路径名称
	Type     string `json:"type"`                                              // 对象类型
}

/////////////////// CheckReferences ///////////////////

type CheckReferencesReq struct {
	CheckReferencesReqQueryParam `param_type:"query"`
}

type CheckReferencesReqQueryParam struct {
	ID    string `json:"id" form:"id" binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`                                                         // 业务对象/业务活动id
	RefID string `json:"ref_id" form:"ref_id" binding:"TrimSpace,required,verifyMultiUuid" example:"e00a4e53-a5aa-4791-9c1a-f7e74fbadfd4,d95b5f36-0d24-4a10-8ddd-c1f537a49dab"` // 引用的业务对象/业务活动id,逗号分隔
}

type CheckReferencesResp struct {
	ID                string `json:"id"`                                 // 业务对象/业务活动id
	CircularReference bool   `json:"circular_reference" example:"false"` // 是否循环引用
}

/////////////////// GetPath ///////////////////

type GetPathReq struct {
	GetPathReqQueryParam `param_type:"query"`
}

type GetPathReqQueryParam struct {
	IDS string `json:"ids" form:"ids" binding:"TrimSpace,required,verifyMultiUuid" example:"e00a4e53-a5aa-4791-9c1a-f7e74fbadfd4,d95b5f36-0d24-4a10-8ddd-c1f537a49dab"` // 业务对象/业务活动id，uuid，逗号分隔
}

type GetPathResp struct {
	PathInfo []*PathInfo `json:"path_info"`
}

type PathInfo struct {
	ID       string `json:"id"`        // 对象id
	Name     string `json:"name"`      // 获取的对象的名称
	PathID   string `json:"path_id"`   // 路径id
	PathName string `json:"path_name"` // 路径名称
	Type     int8   `json:"type"`      // 对象类型
}

/////////////////// GetBusinessObjectOwner ///////////////////

type GetBusinessObjectOwnerReq struct {
	GetBusinessObjectOwnerReqQueryParam `param_type:"query"`
}

type GetBusinessObjectOwnerReqQueryParam struct {
	IDS string `json:"ids" form:"ids" binding:"TrimSpace,required,verifyMultiUuid" example:"e00a4e53-a5aa-4791-9c1a-f7e74fbadfd4,d95b5f36-0d24-4a10-8ddd-c1f537a49dab"` // 业务对象/业务活动id，uuid，逗号分隔
}

type GetBusinessObjectOwnerResp struct {
	OwnerInfo []*OwnerInfo `json:"owner_info"`
}

type OwnerInfo struct {
	BusinessObjectID string        `json:"business_object_id"` // 业务对象/业务活动id
	UserID           string        `json:"user_id"`            // 用户id
	UserName         string        `json:"user_name"`          // 用户名称
	Departments      []*Department `json:"departments"`        // 部门
}

type Department struct {
	DepartmentID   string `json:"department_id"`   // 所属部门id
	DepartmentName string `json:"department_name"` // 所属部门名称
}

/////////////////// Get ///////////////////

type ObjectIdInternalReq struct {
	ObjectIdInternalQueryParam `param_type:"query"`
}
type ObjectIdInternalQueryParam struct {
	Id string `json:"id" form:"id" binding:"required,uuid"`
}

/////////////////// ClearFormAttributesInternal ///////////////////

type ClearFormAttributesReq struct {
	ClearFormAttributesQueryParam `param_type:"body"`
}
type ClearFormAttributesQueryParam struct {
	Ids []string `json:"ids" form:"ids" binding:"required,dive,uuid"`
}

// region BatchCreateObjectAndContent

type BatchCreateObjectAndContentReq struct {
	BatchCreateObjectAndContentReqBodyParam `param_type:"body"`
}

type BatchCreateObjectAndContentReqBodyParam struct {
	ObjectAndContent []ObjectAndContent `json:"object_content" binding:"required,gt=0,dive"` //需要创建的业务对象、业务活动及内容
}
type ObjectAndContent struct {
	ParentID      string         `json:"parent_id" binding:"required,uuid"`                                    // 父对象id
	Id            string         `json:"id" binding:"omitempty,uuid"`                                          // 业务对象/业务活动id 新建时不传，仅编辑属性时传入
	Name          string         `json:"name" binding:"VerifyXssString,required,VerifyName128NoSpaceNoSlash"`  // 对象名称，仅支持中英文数字中划线下划线
	Description   string         `json:"description" binding:"VerifyXssString,omitempty,VerifyDescription255"` // 描述，非必填
	Owner         string         `json:"owner" binding:"omitempty,uuid"`                                       // 用户id
	Type          string         `json:"type" binding:"required,oneof=business_object business_activity"`      // 对象类型 业务对象/业务活动
	LogicEntities []*LogicEntity `json:"logic_entities" binding:"gt=0,dive"`                                   // 业务逻辑实体信息
}

func (r *ObjectAndContent) ToModel(userInfo *middleware.User, parent *model.SubjectDomain) *model.SubjectDomain {
	if r == nil {
		return nil
	}
	var objectType int8
	if r.Type != "" {
		objectType = constant.SubjectDomainObjectStringToInt(r.Type)
	}

	id := uuid.NewString()
	pathID := parent.PathID + "/" + id
	path := parent.Path + "/" + r.Name
	now := time.Now()
	object := &model.SubjectDomain{
		ID:           id,
		Name:         r.Name,
		Description:  r.Description,
		Type:         objectType,
		PathID:       pathID,
		Path:         path,
		Owners:       []string{r.Owner},
		CreatedAt:    now,
		CreatedByUID: userInfo.ID,
		UpdatedAt:    now,
		UpdatedByUID: userInfo.ID,
	}
	return object
}

//endregion

// region BatchCreateObjectContent

type BatchCreateObjectContentReq struct {
	BatchCreateObjectContentReqBodyParam `param_type:"body"`
}

type BatchCreateObjectContentReqBodyParam struct {
	FormID   string    `json:"form_id" form:"form_id" binding:"required,uuid"` // 业务表ID, 传空表示清除所有的关系
	Contents []Content `json:"contents" binding:"required,gt=0,dive"`          //需要创建的业务对象、业务活动及内容
}
type Content struct {
	Id            string         `json:"id" binding:"omitempty,uuid"`        // 业务对象/业务活动id 新建时不传，仅编辑属性时传入
	LogicEntities []*LogicEntity `json:"logic_entities" binding:"gt=0,dive"` // 业务逻辑实体信息
}

//业务表关联的业务对象

// GetFormSubjectsReqParam  获取业务表业务对象参数
type GetFormSubjectsReqParam struct {
	GetFormSubjectsReq `param_type:"query"`
}

type GetFormSubjectsReq struct {
	FID string `json:"fid" form:"fid" binding:"required,uuid"`
}

type GetFormFiledRelevanceObjectRes struct {
	FormID       string              `json:"form_id"`
	SubjectInfos []FormSubjectDetail `json:"subject_infos"`
}

type FormSubjectDetail struct {
	ID            string           `json:"id"`             // 业务对象/业务活动id
	Name          string           `json:"name"`           // 业务对象/业务活动名称
	Type          string           `json:"type"`           // 业务对象/业务活动类型
	LogicalEntity []*LogicalEntity `json:"logical_entity"` // 逻辑实体
	//DisabledLogicalEntity []*DisabledLogicalEntity `json:"disabled_logical_entity"` // 不可关联的逻辑实体
}

type PureLogicalEntity struct {
	ID   string `json:"id"`   // 逻辑实体id
	Name string `json:"name"` // 逻辑实体名称
}
type LogicalEntity struct {
	PureLogicalEntity
	Attributes []*AttributeWithField `json:"attributes"` // 逻辑实体属性
}

//type DisabledLogicalEntity struct {
//	PureLogicalEntity
//	Attributes []*DisabledAttribute `json:"attributes"` // 逻辑实体属性
//}

type AttributeWithField struct {
	ID           string        `json:"id"`                             // 属性id
	Name         string        `json:"name"`                           // 属性名称
	Unique       bool          `json:"unique"`                         // 唯一标识
	StandardInfo *StandardInfo `json:"standard_info"`                  // 数据标准信息
	FieldID      string        `json:"field_id"`                       // 关联字段id
	FieldName    string        `json:"field_name"`                     // 关联字段名称
	LabelID      string        `json:"label_id"`                       //标签id
	LabelName    string        `json:"label_name" binding:"omitempty"` //标签名称
	LabelIcon    string        `json:"label_icon"`                     //标签颜色
	LabelPath    string        `json:"label_path"`                     //  标签路径
	// StandardStatus    string        `json:"standard_status" binding:"omitempty,oneof=normal modified deleted" swagger:ignore` //标准化状态：""，"normal"，"modified"，"deleted"
	FieldStandardInfo *StandardInfo `json:"field_standard_info"` // 字段标准信息
}

type DisabledAttribute struct {
	AttributeWithField
	FormName string `json:"form_name"` // 关联字段表名称
}

// UpdateFormSubjectsReqParam  获取业务表业务对象参数
type UpdateFormSubjectsReqParam struct {
	UpdateFormSubjectsReq `param_type:"body"`
}

type UpdateFormSubjectsReq struct {
	FormID               string                 `json:"form_id" form:"form_id" binding:"required,uuid"`                                // 业务表ID, 传空表示清除所有的关系
	FormRelevanceObjects []*FormRelevanceObject `json:"form_relevance_objects" form:"form_relevance_objects" binding:"omitempty,dive"` // 业务对象ID
}

type FormRelevanceObject struct {
	UpdateLogicalEntities []*UpdateLogicalEntity `json:"logical_entity" binding:"omitempty,dive"`            // 关联属性
	ObjectId              string                 `json:"object_id" form:"object_id" binding:"required,uuid"` // 业务对象/业务活动 id
}

type UpdateLogicalEntity struct {
	Id         string              `json:"id"  binding:"required,uuid"`   // 逻辑实体id
	Attributes []*UpdateAttributes `json:"attributes" binding:"required"` // 逻辑实体属性, 不继续下去校验了，允许传空的属性和字段对
}

type UpdateAttributes struct {
	Id      string `json:"id" form:"id"  binding:"required,uuid"`            // 属性id
	FieldId string `json:"field_id" form:"field_id" binding:"required,uuid"` // 关联字段id
}

// RemoveFormSubjectsReqParam  删除业务表合字段的关系
type RemoveFormSubjectsReqParam struct {
	RemoveFormSubjectsReq `param_type:"body"`
}

type RemoveFormSubjectsReq struct {
	FormIDSlice []string `json:"form_id_slice"`
}

//region GetObjectPrecision

type GetObjectPrecisionReq struct {
	GetObjectPrecisionReqParamPath `param_type:"query"`
}

type GetObjectPrecisionReqParamPath struct {
	ObjectIDs []string `json:"object_id" form:"object_id" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}
type GetObjectPrecisionRes struct {
	Object []*GetObjectResp `json:"object"`
}

//endregion

/////////////////// GetObject ///////////////////

type GetObjectChildDetailReq struct {
	GetObjectChildDetailQueryParam `param_type:"query"`
}

type GetObjectChildDetailQueryParam struct {
	ID      string `json:"id"  form:"id" binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象id
	Display string `json:"display" form:"display" binding:"TrimSpace,omitempty,oneof=tree list"`                           // 结果是tree还是列表, tree树结构，list数组结构
}

type GetObjectChildDetailResp struct {
	Display string           `json:"display"`
	Entries []*GetObjectInfo `json:"entries"`
}

type GetObjectInfo struct {
	ID             string           `json:"id"  maxLength:"36"  example:"3821e024-e218-43c0-9931-e82afc32dbb1"`                            // 对象id
	Name           string           `json:"name"  maxLength:"128"  example:"用户"`                                                           // 对象名称
	Type           string           `json:"type" maxLength:"20"  example:"subject_domain_group"`                                           // 对象类型,，subject_domain_group业务对象分组，subject_domain业务对象，business_object业务对象，business_activity业务活动，logic_entity逻辑实体，attribute属性
	PathID         string           `json:"path_id"   example:"0251c03c-2123-4041-845b-27613bcb9904/2446beb9-8059-48e8-9307-e922c5bc9bbd"` // 路径id
	PathName       string           `json:"path_name"  example:"数据治理/业务梳理"`                                                                // 路径名称
	ParentID       string           `json:"parent_id"  maxLength:"36"  example:"4821e024-e218-43c0-9931-e82afc32dbb1"`                     // 父级的ID
	LogicViewCount int64            `json:"logic_view_count" example:"2"`                                                                  //视图的数量
	IndicatorCount int64            `json:"indicator_count" example:"3"`                                                                   //指标的数量
	InterfaceCount int64            `json:"interface_count" example:"4"`                                                                   //接口服务的数量
	Child          []*GetObjectInfo `json:"child"`                                                                                         // 子节点
}

type SubjectDomainInternal struct {
	ID        string `gorm:"column:id" json:"id"`                                           // 对象ID
	Name      string `gorm:"column:name;not null" json:"name"`                              // 对象名称
	PathID    string `gorm:"column:path_id;not null" json:"path_id"`                        // 路径ID
	Path      string `gorm:"column:path;not null" json:"path"`                              // 路径
	Type      int32  `gorm:"column:type" json:"type"`                                       // 类型
	DeletedAt int32  `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"` // 删除时间(逻辑删除)
}
type GetSubjectByPathReq struct {
	Paths []string `json:"paths" binding:"required,gt=0,unique"`
}

type GetSubjectByPathRes struct {
	SubjectDomain map[string]*SubjectDomainInternal `json:"departments"`
}

//region GetSubjectDomainByPaths

type GetSubjectDomainByPathsReq struct {
	CommonRest.GetDataSubjectByPathReq `param_type:"body"`
}

//endregion

type ExportObjectIdsReq struct {
	ExportObjectIdsReqBodyParam `param_type:"body"`
}

type ExportObjectIdsReqBodyParam struct {
	IDs []string `json:"ids" form:"ids" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

/////////////////// DelLabelIds ///////////////////

type DelLabelIdsReq struct {
	DelLabelIdsUriReq `param_type:"uri"`
}

type DelLabelIdsUriReq struct {
	LabelIDS string `json:"labelIds" uri:"labelIds" binding:"TrimSpace,required"` // 标签对象ids
}

// region ClassificationQuery

type QueryClassificationReq struct {
	QueryClassificationReqParams `param_type:"query"`
}

type QueryClassificationReqParams struct {
	ID            string `json:"id"  form:"id" binding:"TrimSpace,omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`  // 对象id, 如果不传，默认是全部的L1层级
	Display       string `json:"display" form:"display,default=list" binding:"TrimSpace,omitempty,oneof=tree list" example:"list"` // 结果是tree还是列表，默认给的是list
	OpenHierarchy bool   `json:"open_hierarchy" form:"open_hierarchy"  example:"false"`                                            // 是否是开启分级状态，默认不开启分级功能
}

type QueryClassificationResp struct {
	Display string         `json:"display" binding:"required,oneof=tree list" example:"list"` //结果是tree还是列表，默认给的是list
	Entries []*SubjectNode `json:"entries"  binding:"required"`                               //返回的各级的视图，字段的统计信息
}

type SubjectNode struct {
	ID                   string          `json:"id"  binding:"required,uuid" example:"26491ca6-b3bc-4032-8da3-80f23369d23a"`        //主题对象的ID
	Name                 string          `json:"name"  binding:"required" maxLength:"300" example:"用户"`                             //主题对象的名称
	Type                 string          `json:"type"  binding:"required"  maxLength:"64"  example:"subject_domain_group"`          // 业务架构对象类型，subject_domain_group业务对象分组, subject_domain业务对象, business_object业务对象, business_activity业务活动, logic_entity逻辑实体, attribute属性,
	ParentID             string          `json:"parent_id" binding:"omitempty,uuid" example:"26491ca6-b3bc-4032-8da3-80f23369d23a"` //主题对象的父节点ID
	ClassifiedNum        int64           `json:"classified_num" binding:"gte=0" example:"2"`                                        //字段分类的总数
	HierarchyInfo        []*HierarchyTag `json:"hierarchy_info,omitempty"`                                                          //该主题层级分类统计信息
	Child                []*SubjectNode  `json:"child"`                                                                             //子节点
	HierarchyTagIndexMap map[string]int  `json:"-"`
}

// ClassifyTag 对分级标签整理，追加分分级标签
func (s *SubjectNode) ClassifyTag() {
	if s.ClassifiedNum == 0 {
		return
	}
	if s.HierarchyTagIndexMap == nil {
		s.HierarchyTagIndexMap = make(map[string]int)
	}
	total := int64(0)
	unique := make([]*HierarchyTag, 0)
	for i := 0; i < len(s.HierarchyInfo); i++ {
		total += s.HierarchyInfo[i].Count
		tagIndex, ok := s.HierarchyTagIndexMap[s.HierarchyInfo[i].ID]
		if !ok {
			unique = append(unique, s.HierarchyInfo[i])
			s.HierarchyTagIndexMap[s.HierarchyInfo[i].ID] = len(unique) - 1
		} else {
			exitTag := unique[tagIndex]
			exitTag.Count += s.HierarchyInfo[i].Count
		}
	}
	s.HierarchyInfo = unique
	if s.ClassifiedNum == total {
		return
	}
	s.HierarchyInfo = append(s.HierarchyInfo, &HierarchyTag{
		Name:  "未分级",
		Count: s.ClassifiedNum - total,
	})
}

type HierarchyTag struct {
	ID         string `json:"id"  binding:"required"  maxLength:"20"  example:"539415387041697226"` //分级标签的ID,雪花ID，最大长度19个字符
	Name       string `json:"name" binding:"required"  maxLength:"255"  example:"一般数据"`             //分级标签的名称
	Color      string `json:"color" binding:"omitempty"  maxLength:"100"  example:"#445566"`        //分级标签配置的背景色
	Count      int64  `json:"count" binding:"required,gte=0" example:"23"`                          //该分级的字段总数
	SortWeight int    `json:"-"`
}

func GenHierarchyTag(subject classify.SubjectClassify) *HierarchyTag {
	return &HierarchyTag{
		ID:         subject.LabelID,
		Name:       subject.LabelName,
		Color:      subject.LabelColor,
		Count:      subject.ClassifiedNum,
		SortWeight: subject.LabelSortWeight,
	}
}

func NewSubjectGroupNode(subject classify.SubjectClassify) *SubjectNode {
	result := &SubjectNode{
		ID:            subject.RootId,
		Name:          strings.Split(subject.PathName, "/")[0],
		ClassifiedNum: subject.ClassifiedNum,
		HierarchyInfo: nil,
	}
	if subject.LabelID != "" {
		result.HierarchyInfo = []*HierarchyTag{GenHierarchyTag(subject)}
	}
	return result
}

func NewSubjectObjectNode(subject *model.SubjectDomain, classifyInfo classify.SubjectClassify) *SubjectNode {
	result := &SubjectNode{
		ID:            subject.ID,
		Name:          subject.Name,
		Type:          constant.SubjectDomainObjectIntToString(subject.Type),
		ParentID:      util.GetParentID(subject.PathID),
		ClassifiedNum: classifyInfo.ClassifiedNum,
	}
	if classifyInfo.LabelID != "" {
		result.HierarchyInfo = append(result.HierarchyInfo, GenHierarchyTag(classifyInfo))
	}
	return result
}
func NewDefaultSubjectNode(subject *model.SubjectDomain) *SubjectNode {
	return &SubjectNode{
		ID:            subject.ID,
		Name:          subject.Name,
		Type:          constant.SubjectDomainObjectIntToString(subject.Type),
		ParentID:      util.GetParentID(subject.PathID),
		ClassifiedNum: 0,
		HierarchyInfo: nil,
	}
}

//endregion

// region QueryClassifyViewDetail

type QueryHierarchyTotalInfoReq struct {
	QueryHierarchyTotalInfoParams `param_type:"query"`
}

type QueryHierarchyTotalInfoParams struct {
	ID               string `json:"id"  form:"id" binding:"TrimSpace,required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`           // 对象id
	OpenHierarchy    bool   `json:"open_hierarchy" form:"open_hierarchy" binding:"omitempty" example:"false"`                                 // 是否是开启分级状态，默认不开启分级功能
	FormViewID       string `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"3d8360f5-25f7-49ca-a7fa-ef24494d3890"` // 视图的ID，传了代表是某个表的字段分业务
	request.PageInfo        // 排序信息
}

type QueryHierarchyTotalInfoResp struct {
	Total   int64             `json:"total" binding:"omitempty,gte=0" example:"3"` //该业务架构对象及其子对象下关联的逻辑视图字段数量
	Entries []RelatedFormView `json:"entries"`                                     // 逻辑视图字段详情
}

type RelatedFormView struct {
	FormViewID    string       `json:"form_view_id" binding:"required,uuid" example:"6c710258-cc80-4e61-993d-b4fc970db1dc"` //逻辑视图的ID
	CatalogName   string       `json:"catalog_name" binding:"required"  maxLength:"255" example:"mysql_9bg6mfbi"`           //逻辑视图的数据源catalog名称
	Schema        string       `json:"schema" binding:"required"  maxLength:"128" example:"af_main"`                        //逻辑视图的数据源schema名称
	BusinessName  string       `json:"business_name" binding:"required"  maxLength:"255" example:"用户表"`                     //逻辑视图的显示名称
	TechnicalName string       `json:"technical_name" binding:"required"  maxLength:"255" example:"user"`                   //逻辑视图在数据库中的技术名称
	Fields        []*ViewField `json:"fields"`                                                                              //字段信息
}
type ViewField struct {
	ID            string        `json:"id" binding:"required,uuid" example:"8c710389-fc09-4fdb-b0f3-8984cbaf437a"`                      //逻辑视图的ID
	BusinessName  string        `json:"business_name" binding:"required" maxLength:"255"  example:"用户表"`                                //逻辑视图的显示名称
	TechnicalName string        `json:"technical_name" binding:"required"  maxLength:"255"  example:"user"`                             //逻辑视图在数据库中的技术名称
	DataType      string        `json:"data_type"  binding:"required"  maxLength:"64"  example:"char"`                                  //字段数据类型, 目前有：numbe,char,date,datetime,timestamp,bool,binary
	IsPrimary     bool          `json:"is_primary"   binding:"required"  example:"false"`                                               //是否时主键
	SubjectID     string        `json:"subject_id"  binding:"required"  maxLength:"36"  example:"6969dd42-22a6-4c80-bbec-6be7ea01c097"` //字段关联的业务架构对象ID
	Property      *SubjectProp  `json:"property"`                                                                                       //业务架构对象属性ID
	HierarchyTag  *HierarchyTag `json:"hierarchy_tag"  binding:"omitempty"`                                                             //字段对应的标签信息，可能为空
}

type SubjectProp struct {
	ID       string `json:"id" binding:"required,uuid" example:"8c710389-fc09-4fdb-b0f3-8984cbaf437a"`                                                        //属性ID
	Name     string `json:"name" binding:"required" maxLength:"300"  example:"用户"`                                                                            //属性的名称
	PathID   string `json:"path_id"  binding:"required" maxLength:"512"  example:"8c710389-fc09-4fdb-b0f3-8984cbaf437a/8c720389-fc09-4fdb-b0f3-8984cbaf437a"` //ID的路径
	PathName string `json:"path_name"  binding:"required" maxLength:"2048"  example:"分组/业务域"`                                                                 //属性的名称路径
}

func (q QueryHierarchyTotalInfoResp) addFieldLabelAndProp(openHierarchy bool, cs []classify.SubjectClassify, attributes []*model.SubjectDomain) {
	classifyDict := iter.StringMap(cs, func(t classify.SubjectClassify) string {
		return t.ID
	})
	attributeDict := iter.StringMap(attributes, func(t *model.SubjectDomain) string {
		return t.ID
	})
	for i := range q.Entries {
		for j := range q.Entries[i].Fields {
			field := q.Entries[i].Fields[j]
			//添加分级信息
			if openHierarchy {
				classifyInfo := classifyDict[field.SubjectID]
				if classifyInfo.LabelID != "" || classifyInfo.LabelName != "" {
					field.HierarchyTag = &HierarchyTag{
						ID:    classifyInfo.LabelID,
						Name:  classifyInfo.LabelName,
						Color: classifyInfo.LabelColor,
					}
				} else {
					field.HierarchyTag = &HierarchyTag{
						Name: "未分级",
					}
				}
			}
			//添加属性信息
			attribute := attributeDict[field.SubjectID]
			if attribute != nil {
				field.Property = &SubjectProp{
					ID:       field.SubjectID,
					Name:     attribute.Name,
					PathID:   attribute.PathID,
					PathName: attribute.Path,
				}
			}
		}
	}
}

//endregion

// region GetClassificationStats

type GetClassificationStatsReq struct {
	GetClassificationStatsReqParam `param_type:"query"`
}

type GetClassificationStatsReqParam struct {
	ID string `json:"id"  form:"id" binding:"TrimSpace,omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 对象id
}

type GetClassificationStatsResp struct {
	Total        int64           `json:"total" binding:"required,gte=0" example:"3"` //该主题层级的分级字段总数
	HierarchyTag []*HierarchyTag `json:"hierarchy_tag"`                              //该主题层级的分级字段详情
}

func (q *GetClassificationStatsResp) AddNotClassify() {
	if q.Total == 0 {
		return
	}
	n := int64(0)
	for i := 0; i < len(q.HierarchyTag); i++ {
		n += q.HierarchyTag[i].Count
	}
	if q.Total == n {
		return
	}
	q.HierarchyTag = append(q.HierarchyTag, &HierarchyTag{
		Name:  "未分级",
		Count: q.Total - n,
	})
}

func (q *GetClassificationStatsResp) SortLabel() {
	sort.Slice(q.HierarchyTag, func(i, j int) bool { return q.HierarchyTag[i].SortWeight < q.HierarchyTag[j].SortWeight })
}

// endregion

type LabInfo struct {
	Name      string `json:"name"`
	LabelIcon string `json:"labelIcon"`
	LabelPath string `json:"labelPath"`
}

type DataSubjectAuditObject struct {
	ID        string `json:"id"`         // 对象ID
	Name      string `json:"name"`       // 对象名称
	OwnerName string `json:"owner_name"` // 对象owner名称
}

type BusinessSubjectRecReq struct {
	af_sailor.SailorSubjectRecReq `param_type:"body"`
}

var _ audit_v1.ResourceObject = &DataSubjectAuditObject{}

func (ro *DataSubjectAuditObject) GetName() string {
	return ro.Name
}

// GetDetail implements v1.ResourceObject.
func (ro *DataSubjectAuditObject) GetDetail() json.RawMessage { return lo.Must(json.Marshal(ro)) }
