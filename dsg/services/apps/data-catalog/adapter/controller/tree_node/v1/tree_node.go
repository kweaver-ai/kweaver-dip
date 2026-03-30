package v1

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/trace_util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

const (
	defaultDataResourceClassificationTreeID models.ModelID = "1"
)

const spanNamePre = "uc TreeNodeUseCase "

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// Add 添加一个目录分类
//
//	@Description	添加一个目录分类，位置在尾部，层级最多4层
//	@Tags			目录分类管理
//	@Summary		添加一个目录分类
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				query		domain.TreeIDQueryParam	false	"查询参数"
//	@Param			_				body		domain.AddReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.AddRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes [post]
func (s *Service) Add(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.AddReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "Add", req, s.uc.Add)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to add tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除一个目录分类
//
//	@Description	删除一个目录分类
//	@Tags			目录分类管理
//	@Summary		删除一个目录分类
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			node_id			path		string					true	"目录分类ID"	default(1)	minLength(1)
//	@Param			_				query		domain.TreeIDQueryParam	false	"查询参数"
//	@Success		200				{object}	domain.DeleteRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes/{node_id} [delete]
func (s *Service) Delete(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.DeleteReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "Delete", req, s.uc.Delete)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Edit 修改目录分类基本信息
//
//	@Description	修改目录分类基本信息
//	@Tags			目录分类管理
//	@Summary		修改目录分类基本信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			node_id			path		string					true	"目录分类ID"	default(1)	minLength(1)
//	@Param			_				query		domain.TreeIDQueryParam	false	"查询参数"
//	@Param			_				body		domain.EditReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.EditRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes/{node_id} [put]
func (s *Service) Edit(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.EditReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "Edit", req, s.uc.Edit)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to edit tree node, req: %v, err: %v", *req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// List 获取父节点下的子目录分类列表（树形结构使用）
//
//	@Description	获取父节点下的子目录分类列表（树形结构使用）
//	@Tags			目录分类管理
//	@Summary		获取父节点下的子目录分类列表（树形结构使用）
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				query		domain.ListReqQueryParam	true	"请求参数"
//	@Success		200				{object}	domain.ListRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes [get]
func (s *Service) List(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.ListReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "List", req, s.uc.List)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list tree nodes, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ListTree 获取整棵树结构（数结构表格使用）
//
//	@Description	获取整棵树结构（数结构表格使用）
//	@Tags			目录分类管理
//	@Summary		获取整棵树结构（数结构表格使用）
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		domain.ListTreeReqQueryParam	true	"请求参数"
//	@Success		200				{object}	domain.ListTreeRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes/tree [get]
func (s *Service) ListTree(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.ListTreeReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "ListTree", req, s.uc.ListTree)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list tree2 nodes, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Get 获取指定目录分类的基本信息
//
//	@Description	获取指定目录分类的基本信息
//	@Tags			目录分类管理
//	@Summary		获取指定目录分类的基本信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			node_id			path		string					true	"目录分类ID"	default(1)	minLength(1)
//	@Param			_				query		domain.TreeIDQueryParam	false	"查询参数"
//	@Success		200				{object}	domain.GetRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes/{node_id} [get]
func (s *Service) Get(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.GetReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "Get", req, s.uc.Get)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Reorder 对父节点下的子目录分类重新排序
//
//	@Description	插入目录分类到父节点下并将子目录分类重新排序
//	@Tags			目录分类管理
//	@Summary		插入目录分类到父节点下并将子目录分类重新排序
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			node_id			path		string						true	"目录分类ID"	default(1)	minLength(1)
//	@Param			_				query		domain.TreeIDQueryParam		false	"查询参数"
//	@Param			_				body		domain.ReorderReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.ReorderRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes/{node_id}/reorder [put]
func (s *Service) Reorder(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.ReorderReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "Reorder", req, s.uc.Reorder)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to reorder tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// NameExistCheck 检测目录分类名称是否已存在
//
//	@Description	检测目录分类名称是否已存在
//	@Tags			目录分类管理
//	@Summary		检测目录分类名称是否已存在
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		domain.TreeIDQueryParam			false	"查询参数"
//	@Param			_				body		domain.NameExistReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.NameExistRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/trees/nodes/check [post]
func (s *Service) NameExistCheck(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.NameExistReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "NameExistCheck", req, s.uc.NameExistCheck)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to check tree node name exist, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *Service) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}

func traceDomainFunc[A1 any, R1 any, R2 any](ctx context.Context, methodName string, a1 A1, f trace_util.A1R2Func[A1, R1, R2]) (R1, R2) {
	return trace_util.TraceA1R2(ctx, spanNamePre+methodName, a1, f)
}
