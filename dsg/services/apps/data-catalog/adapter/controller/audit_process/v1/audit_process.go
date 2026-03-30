package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/audit_process"
)

type Controller struct {
	ap *audit_process.AuditProcessDomain
}

func NewController(ap *audit_process.AuditProcessDomain) *Controller {
	ctl := &Controller{ap: ap}
	return ctl
}

/*
// Create 创建审核流程绑定
// @Description 创建审核流程绑定
// @Tags        审核流程绑定管理
// @Summary     创建审核流程绑定
// @Accept      json
// @Produce     json
// @Param       Authorization header     string                    true "token"
// @Param       _     body       audit_process.ReqAuditProcessBindParams true "请求参数"
// @Success     200   {object}   audit_process.IDResp    "成功响应参数"
// @Failure     400   {object}   rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/audit-process [post]
func (controller *Controller) Create(c *gin.Context) {
	var req audit_process.ReqAuditProcessBindParams
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in create audit process bind, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.ap.Create(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Update 编辑审核流程绑定
// @Description 编辑审核流程绑定
// @Tags        审核流程绑定管理
// @Summary     编辑审核流程绑定
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       bindID path     uint64                     true "流程绑定ID" default(1)
// @Param       _         body     audit_process.ReqAuditProcessBindParams true "请求参数"
// @Success     200       {object} audit_process.IDResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/audit-process/{bindID} [put]
func (controller *Controller) Update(c *gin.Context) {
	var p audit_process.ReqAuditProcessBindPathParams
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in update audit process bind, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req audit_process.ReqAuditProcessBindParams
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in update audit process bind, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.ap.Update(c, p.ID.Uint64(), &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetList 查询审核流程绑定列表
// @Description 查询审核流程绑定列表
// @Tags        审核流程绑定管理
// @Summary     查询审核流程绑定列表
// @Accept      json
// @Produce     json
// @Param       Authorization header   string                    true "token"
// @Param       _     query    audit_process.ReqFormParams true "查询参数"
// @Success     200   {object} response.PageResult[audit_process.AuditProcessBindQueryResp]    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/audit-process [get]
func (controller *Controller) GetList(c *gin.Context) {
	var req audit_process.ReqFormParams
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get catalog list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	datas, err := controller.ap.GetList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c,
		response.PageResult[audit_process.AuditProcessBindQueryResp]{
			TotalCount: int64(len(datas)),
			Entries:    datas})
}

// Delete 删除审核流程绑定
// @Description 删除审核流程绑定
// @Tags        审核流程绑定管理
// @Summary     删除审核流程绑定
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       bindID path     uint64                     true "流程绑定ID" default(1)
// @Success     200       {object} audit_process.IDResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/audit-process/{bindID} [delete]
func (controller *Controller) Delete(c *gin.Context) {
	var p audit_process.ReqAuditProcessBindPathParams
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in delete audit process bind, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	resp, err := controller.ap.Delete(c, p.ID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
*/
