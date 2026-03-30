package v1

import (
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type TreeService struct {
	uc domain.UseCaseTree
}

func NewTreeService(uc domain.UseCaseTree) *TreeService {
	return &TreeService{uc: uc}
}

// Add 添加一个类目树节点, 位置在首部
//
//	@Description	添加一个类目树节点, 位置在首部
//	@Tags			类目节点管理
//	@Summary		添加一个类目树节点, 位置在首部
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			category_id		path		string						true	"类目ID，uuid"
//	@Param			_				body		domain.AddTreeReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.TreeRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/trees-node [post]
func (s *TreeService) Add(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.AddTreeReqParama](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "Add", req, s.uc.Add)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to add tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除一个类目树节点
//
//	@Description	删除一个类目树节点
//	@Tags			类目节点管理
//	@Summary		删除一个类目树节点
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			category_id		path		string					true	"目录ID，uuid"
//	@Param			node_id			path		string					true	"目录树节点ID，uuid"
//	@Success		200				{object}	domain.TreeRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/trees-node/{node_id} [delete]
func (s *TreeService) Delete(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.DeleteTreeReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "Delete", req, s.uc.Delete)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Edit 修改一个类目树节点基本信息
//
//	@Description	修改一个类目树节点基本信息
//	@Tags			类目节点管理
//	@Summary		修改一个类目树节点基本信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			category_id		path		string						true	"目录ID，uuid"
//	@Param			node_id			path		string						true	"目录树节点ID，uuid"
//	@Param			_				body		domain.EditReqaBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.TreeRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/trees-node/{node_id} [put]
func (s *TreeService) Edit(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.EditTreeReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}
	resp, err := traceDomainFunc(c, "Edit", req, s.uc.Edit)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to edit tree node, req: %v, err: %v", *req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// NameExistCheck 检测类目树节点名称是否已存在
//
//	@Description	检测类目树节点名称是否已存在
//	@Tags			类目节点管理
//	@Summary		检测类目树节点名称是否已存在
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			category_id		path		string						true	"目录ID，uuid"
//	@Param			_				query		domain.TreeQueryParam		false	"查询参数"
//	@Success		200				{object}	domain.NameExistRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/trees-node/name-check [get]
func (s *TreeService) NameExistCheck(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.NameTreeExistReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}
	fmt.Println(req.NodeID)

	resp, err := traceDomainFunc(c, "NameExistCheck", req, s.uc.NameExistCheck)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to check tree node name exist, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Reorder 对父节点下的子目录分类重新排序
//
//	@Description	插入目录分类到父节点下并将子目录分类重新排序
//	@Tags			类目节点管理
//	@Summary		插入目录分类到父节点下并将子目录分类重新排序
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			category_id		path		string					true	"目录ID，uuid"
//	@Param			_				body		domain.RecpderParam		true	"请求参数"
//	@Success		200				{object}	domain.CategorRespParam	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/trees-node/trees-node [put]
func (s *TreeService) Reorder(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.RecoderReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	resp, err := traceDomainFunc(c, "Reorder", req, s.uc.Reorder)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to reorder tree node, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *TreeService) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}
