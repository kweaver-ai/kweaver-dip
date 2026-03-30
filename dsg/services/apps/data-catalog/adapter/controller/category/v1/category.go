package v1

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/trace_util"

	"github.com/gin-gonic/gin"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

const spanNamePre = "uc TreeNodeUseCase "

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// Add 添加一个类目
//
//	@Description	添加一个目录分类
//	@Tags			类目管理
//	@Summary		添加一个类目
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				body		domain.CategoryBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.CategorRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category [post]
func (s *Service) Add(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.AddReqParama](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "Add", req, s.uc.Add)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to add category, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除一个类目
//
//	@Description	删除一个类目
//	@Tags			类目管理
//	@Summary		删除一个类目
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			category_id		path		string					true	"类目ID，uuid"
//	@Success		200				{object}	domain.CategorRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id} [delete]
func (s *Service) Delete(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.DeleteReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "Delete", req, s.uc.Delete)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete category, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Edit 修改类目基本信息
//
//	@Description	修改类目基本信息
//	@Tags			类目管理
//	@Summary		修改类目基本信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			category_id		path		string						true	"类目ID，uuid"
//	@Param			_				body		domain.CategoryBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.CategorRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id} [put]
func (s *Service) Edit(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.EditReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "Edit", req, s.uc.Edit)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to edit category, req: %v, err: %v", *req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Get 获取指定类目详情
//
//	@Description	获取指定类目详情
//	@Tags			类目管理
//	@Summary		获取指定类目详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string				true	"token"
//	@Param			category_id		path		string				true	"类目ID，uuid"
//	@Success		200				{object}	domain.CategoryInfo	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id} [get]
func (s *Service) Get(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.GetReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "ListTree", req, s.uc.GET)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list category nodes, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
func (s *Service) GetcategoryDetailForInternal(c *gin.Context) {
	var p domain.GetReqParam
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := s.uc.GET(c, &p)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)

}

// GetAll 获取所有类目和类目树
//
//	@Description	获取所有类目和类目树
//	@Tags			open类目管理
//	@Summary		获取所有类目和类目树
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	query		domain.ListReqQueryParam		false	"查询参数"
//	@Success		200	{object}	domain.ListCategoryRespParam	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/category [get]

func (s *Service) GetAll(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.ListReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "ListTree", req, s.uc.GetAll)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list category nodes, req: %v, err: %v", resp, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// EditUsing 启用、停用类目
//
//	@Description	启用、停用类目
//	@Tags			类目管理
//	@Summary		启用、停用类目
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			category_id		path		string							true	"类目ID，uuid"
//	@Param			_				body		domain.EditUsingReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.CategorRespParam			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/using [put]
func (s *Service) EditUsing(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.EditUsingReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}
	fmt.Println(req.Using)
	resp, err := traceDomainFunc(c, "EditUsing", req, s.uc.EditUsing)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to edit category using, req: %v, err: %v", *req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// NameExistCheck 检测类目名称是否已存在
//
//	@Description	检测类目名称是否已存在
//	@Tags			类目管理
//	@Summary		检测类目名称是否已存在
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				query		domain.NameExistQueryParam	false	"查询参数"
//	@Success		200				{object}	domain.NameExistRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category/name-check [get]
func (s *Service) NameExistCheck(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.NameExistReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "NameExistCheck", req, s.uc.NameExistCheck)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to check category name exist, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// BatchEdit 批量修改类目排序（仅排序）
//
//	@Description	批量修改类目排序（仅排序）
//	@Tags			类目管理
//	@Summary		批量修改类目排序和是否必填
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				body		[]domain.BatchEditReqParam	true	"请求参数：仅包含 id、index"
//	@Success		200				{object}	[]domain.CategorRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category [put]
func (s *Service) BatchEdit(c *gin.Context) {
	var req []domain.BatchEditReqParam
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in batchedit catalog, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := traceDomainFunc(c, "BatchEdit", req, s.uc.BatchEdit)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to edit category , req: %v, err: %v", req, err)
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
