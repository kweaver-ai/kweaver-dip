package microservice

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/imroc/req/v2"
	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type DataCatalogListRes struct {
	Entries []struct {
		Id    string `json:"id"`
		Code  string `json:"code"`
		Title string `json:"title"`
	} `json:"entries"`
	TotalCount int64 `json:"total_count"`
}

type CategoryGetRes struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type CategoryListRes struct {
	Entries    []Category `json:"entries"`
	TotalCount int        `json:"total_count"`
}

type Category struct {
	Id        string     `json:"id"`
	Name      string     `json:"name"`
	ParentId  string     `json:"parent_id"`
	Expansion bool       `json:"expansion"`
	Children  []Category `json:"children"`
}

type DataCatalogGetRes struct {
	Id             string `json:"id"`
	Code           string `json:"code"`
	Title          string `json:"title"`
	State          int    `json:"state"`
	MountResources []struct {
		ResType int `json:"res_type"`
		Entries []struct {
			ResId   string `json:"res_id"`
			ResName string `json:"res_name"`
		} `json:"entries"`
	} `json:"mount_resources"`
}

type CategoryTreeGetRes struct {
	ID        string                     `json:"id" binding:"required" example:"d7549ded-f226-44a2-937a-6731eb256940"`               // 对象ID
	Name      string                     `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"数据分类"`          // 类目名称
	Describe  string                     `json:"describe" binding:"TrimSpace,omitempty,max=255,VerifyDescription" example:"数据分类的描述"` // 类目描述
	Using     bool                       `json:"using" form:"using" example:"false"`                                                 // 是否启用
	Required  bool                       `json:"required" binding:"" example:"true"`                                                 // 是否必填
	Type      string                     `json:"type" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"customize"`     // 类型：customize(自定义的), system(系统）
	CreatedAt int64                      `json:"created_at" binding:"required,gt=0"`                                                 // 创建时间，时间戳
	UpdatedAt int64                      `json:"updated_at" binding:"required,gt=0"`                                                 // 最终修改时间，时间戳
	CreatedBy string                     `json:"created_by" binding:"required,min=1" example:"admin"`                                // 创建用户名
	UpdatedBy string                     `json:"updated_by" binding:"required,min=1" example:"admin"`                                // 最终修改用户名
	TreeNode  []*CategoryTreeSummaryInfo `json:"tree_node" `
}

type CategoryTreeSummaryInfo struct {
	*CategoryTreeBaseInfo
	Children []*CategoryTreeSummaryInfo `json:"children,omitempty" binding:"omitempty"` // 当前TreeNode的子Node列表
}

type CategoryTreeBaseInfo struct {
	CategoryNodeID string `json:"id" form:"id" binding:"required,min=1,max=32" example:"bb96c1f2-5c07-4a01-99a0-e65d25f8f8e1"`         // 类目编码
	ParentID       string `json:"parent_id,omitempty" binding:"required,VerifyModelID" example:"bb96c1f2-5c07-4a01-99a0-e65d25f8f8e1"` // 目录类别父节点ID
	Name           string `json:"name" binding:"required,min=1,max=128" example:"类目树节点一"`                                              // 目录类别名称
	Owner          string `json:"owner" binding:"required,min=1,max=128" example:"小王"`
	OwnerUID       string `json:"ownner_uid" example:"d68be29a-b6b4-11ef-8dc7-a624066a8dd7"`
}

type DataCatalogRepo interface {
	// 资源分类列表
	CategoryList(ctx context.Context, id string) (res *CategoryListRes, err error)
	// 资源分类详情
	CategoryGet(ctx context.Context, id string) (res *CategoryGetRes, err error)
	// 数据资源目录列表
	DataCatalogList(ctx context.Context, offset, limit int, name string) (res *DataCatalogListRes, err error)
	// 数据资源目录详情
	DataCatalogGet(ctx context.Context, id string) (res *DataCatalogGetRes, err error)
	// 获取指定类目详情
	CategoryTreeGet(ctx context.Context, id string) (res *CategoryTreeGetRes, err error)
}

type dataCatalogRepo struct {
	httpclient util.HTTPClient
}

func NewDataCatalogRepo(httpclient util.HTTPClient) DataCatalogRepo {
	return &dataCatalogRepo{
		httpclient: httpclient,
	}
}

func (u *dataCatalogRepo) DataCatalogList(ctx context.Context, offset, limit int, name string) (res *DataCatalogListRes, err error) {

	params := map[string]string{
		"offset":   strconv.Itoa(offset),
		"limit":    strconv.Itoa(limit),
		"keyword":  name,
		"res_type": "1", // 资源类型 1 库表 2 接口
	}

	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParams(params).
		Get(settings.Instance.Services.DataCatalog + "/api/data-catalog/v1/data-catalog/")
	if err != nil {
		log.WithContext(ctx).Error("DataCatalogList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataCatalogList", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DataCatalogListRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataCatalogList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, nil
}

func (u *dataCatalogRepo) DataCatalogGet(ctx context.Context, id string) (res *DataCatalogGetRes, err error) {
	// 获取资源目录详情
	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.DataCatalog + "/api/data-catalog/frontend/v2/data-catalog/" + id)
	if err != nil {
		log.WithContext(ctx).Error("DataCatalogGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataCatalogGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DataCatalogGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataCatalogGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return

}

func (u *dataCatalogRepo) CategoryList(ctx context.Context, id string) (res *CategoryListRes, err error) {
	//req.DevMode()

	query := map[string]string{
		"recursive": "true",
	}

	// 传了id 则只查该id和下级子id
	if id != "" {
		query["node_id"] = id
	}

	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParams(query).
		Get(settings.Instance.Services.DataCatalog + "/api/data-catalog/v1/trees/nodes")
	if err != nil {
		log.WithContext(ctx).Error("CategoryList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("CategoryList", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	categoryListRes := &CategoryListRes{}
	err = resp.UnmarshalJson(&categoryListRes)
	if err != nil {
		log.WithContext(ctx).Error("CategoryList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	array := u.categoryTreeToArray(ctx, categoryListRes.Entries)

	res = &CategoryListRes{
		Entries:    array,
		TotalCount: len(array),
	}

	return res, nil
}

func (u *dataCatalogRepo) categoryTreeToArray(ctx context.Context, tree []Category) (array []Category) {
	for _, category := range tree {
		array = append(array, Category{
			Id:       category.Id,
			Name:     category.Name,
			ParentId: category.ParentId,
		})

		if len(category.Children) > 0 {
			array = append(array, u.categoryTreeToArray(ctx, category.Children)...)
		}
	}

	return array
}

func (u *dataCatalogRepo) CategoryGet(ctx context.Context, id string) (res *CategoryGetRes, err error) {
	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.DataCatalog + "/api/data-catalog/v1/trees/nodes/" + id)
	if err != nil {
		log.WithContext(ctx).Error("CategoryGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("CategoryGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &CategoryGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("CategoryGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, nil
}

func (u *dataCatalogRepo) CategoryTreeGet(ctx context.Context, id string) (res *CategoryTreeGetRes, err error) {
	urlStr := fmt.Sprintf("%s/api/internal/data-catalog/v1/category/%s", settings.Instance.Services.DataCatalog, id)
	response, err := u.httpclient.Get(ctx, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetConfigValue", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	// //req.DevMode()
	// resp, err := req.SetContext(ctx).
	// 	// SetBearerAuthToken(util.GetToken(ctx)).
	// 	// Get(settings.Instance.Services.DataCatalog + "/api/data-catalog/v1/category/" + id)
	// 	Get(settings.Instance.Services.DataCatalog + "/api/internal/data-catalog/v1/category/" + id)
	// if err != nil {
	// 	log.WithContext(ctx).Error("CategoryGet", zap.Error(err))
	// 	return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	// }

	// if resp.StatusCode != 200 {
	// 	log.WithContext(ctx).Error("CategoryGet", zap.Error(errors.New(resp.String())))
	// 	return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	// }

	res = &CategoryTreeGetRes{}
	err = jsoniter.Unmarshal(response, &res)
	// err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("CategoryGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, nil
}
