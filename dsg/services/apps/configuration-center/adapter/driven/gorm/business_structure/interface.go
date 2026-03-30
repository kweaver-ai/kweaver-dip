package business_structure

import (
	"context"

	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	GetObjByID(ctx context.Context, id string) (*model.Object, error)
	GetObjectsByIDs(ctx context.Context, ids []string) ([]*model.Object, error)
	//GetChildObjectByID(ctx context.Context, upper string) ([]*model.Object, error)
	GetObjByPathID(ctx context.Context, id string) ([]*model.Object, error)
	Create(ctx context.Context, object *model.Object) (string, error)
	CreateIfNotExist(ctx context.Context, object *model.Object) (id string, err error)
	Update(ctx context.Context, id, name, attr string, objs []*model.Object) error
	UpdateAttr(ctx context.Context, id, attr string) error
	UpdatePath(ctx context.Context, id, name string, objs []*model.Object) error
	UpdateRegister(ctx context.Context, objs *model.Object) error
	//Delete(ctx context.Context, ids []string) ([]*model.Object, error)
	GetObject(ctx context.Context, id string) (detail *business_structure.ObjectVo, err error)
	GetObjectType(ctx context.Context, id string, catalog int32) (detail *business_structure.ObjectVo, err error)
	// 判断机构标识是否存在
	GetUniqueTag(ctx context.Context, tag string) (bool, error)
	ListByPaging(ctx context.Context, query *business_structure.QueryPageReqParam) ([]*business_structure.ObjectVo, int64, error)
	ListOrgByPaging(ctx context.Context, query *business_structure.QueryOrgPageReqParam) ([]*business_structure.ObjectVo, int64, error)
	UpdateAttribute(ctx context.Context, id, attr string) error
	UpdateObjectName(ctx context.Context, id, name, path string) error
	DeleteObject(ctx context.Context, id string) error
	DeleteObject2(ctx context.Context, id string) error
	Expand(ctx context.Context, id string, objType []int32) (bool, error)
	GetDepartmentPrecision(ctx context.Context, ids []string) ([]*model.Object, error)
	GetObjectByDepartName(ctx context.Context, Paths []string) (resp *CommonRest.GetDepartmentByPathRes, err error)
	GetObjIds(ctx context.Context) ([]string, error)
	UpdateStructure(ctx context.Context, id, name, pathId, path string) error
	BatchDelete(ctx context.Context, ids []string) error
	GetAllObjects(ctx context.Context) (objs []*model.Object, err error)
	FirstLevelDepartment1(ctx context.Context) (res []*business_structure.FirstLevelDepartmentRes, err error)
	GetSecondLevelNotDepart(ctx context.Context) (res []string, err error)
	FirstLevelDepartment2(ctx context.Context, pathID string) (res []*business_structure.FirstLevelDepartmentRes, err error)
	GetDepartmentByIdOrThirdId(ctx context.Context, id string) (detail *business_structure.ObjectVo, err error)
}
