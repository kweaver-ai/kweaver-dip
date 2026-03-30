package user

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_grade"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user/impl"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc domain.DataGradeCase
}

func NewService(uc domain.DataGradeCase) *Service {
	return &Service{uc: uc}
}

// Add  添加/编辑分级标签
// @Summary     添加/编辑分级标签
// @Description 添加/编辑分级标签
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Param 		 data body domain.AddReqParam true "保存标签的请求体"
// @Success      200 {object} rest.HttpError
// @Failure      400 {object} rest.HttpError
// @Router      /configuration-center/v1/grade-label [post]
func (s *Service) Add(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.AddReqParam
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.Add(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// Reorder  标签移动重排序
// @Summary     标签移动重排序
// @Description 标签移动重排序
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Param        data body domain.ReorderReqParam true "标签移动的请求体"
// @Success      200 {object} rest.HttpError
// @Failure      400 {object} rest.HttpError
// @Router      /configuration-center/v1/grade-label/reorder [post]
func (s *Service) Reorder(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.ReorderReqParam
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.Reorder(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// ListTree  标签查询
// @Summary     标签查询
// @Description 标签查询
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Param 		req query domain.ListTreeReqParam  false "查询标识"
// @Success     200 {array} domain.ListTreeRespParam "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /configuration-center/v1/grade-label [get]
func (s *Service) ListTree(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.ListTreeReqParam
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.ListTree(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// StatusOpen  标签开启
// @Summary     标签开启
// @Description 标签开启
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Success     200 {object} rest.HttpError  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /configuration-center/v1/grade-label/status [post]
func (s *Service) StatusOpen(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	res, err := s.uc.StatusOpen(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// StatusCheck  标签状态查询
// @Summary     标签状态查询
// @Description 标签状态查询
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Success     200 {object} rest.HttpError  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数
// @Router      /configuration-center/v1/grade-label/status [get]
func (s *Service) StatusCheck(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	res, err := s.uc.StatusCheckOpen(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// Delete  删除标签
// @Summary     删除标签
// @Description 删除标签
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Success     200 {object} rest.HttpError  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数
// @Router      /configuration-center/v1/grade-label/{id} [delete]
func (s *Service) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.DeleteReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	res, err := s.uc.Delete(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// ListByParentID  通过父级标签查询标签列表
// @Summary     通过父级标签查询标签列表
// @Description 通过父级标签查询标签列表
// @Tags        通过父级标签查询标签列表
// @Accept      application/json
// @Produce     json
// @Param 		Keyword query string  false "查询标识"
// @Success     200 {array} domain.ListRespParam "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /configuration-center/v1/grade-label/{parentID} [get]
func (s *Service) ListByParentID(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.ListByParentIDReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.ListByParentID(ctx, req.ParentID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetInfoByID  通过ID查询标签信息
// @Summary     通过ID查询标签信息
// @Description 通过ID查询标签信息
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Success     200 {object} rest.HttpError  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数
// @Router      /configuration-center/v1/grade-label/{id} [get]
func (s *Service) GetInfoByID(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.GetInfoByIDReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	res, err := s.uc.GetInfoByID(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	if res == nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelNotExist, errs))
		return
	}
	ginx.ResOKJson(c, res)
}

// GetInfoByName  通过name查询标签信息
// @Summary     通过name查询标签信息
// @Description 通过name查询标签信息
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Success     200 {object} rest.HttpError  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数
// @Router      /configuration-center/v1/grade-label/{id} [get]
func (s *Service) GetInfoByName(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.GetInfoByNameReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	res, err := s.uc.GetInfoByName(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// CheckNameRepeat  全局检查名称是否重复
// @Summary     全局检查名称是否重复
// @Description 全局检查名称是否重复
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Param 		 data body domain.CheckNameReqParam true "保存标签的请求体"
// @Success      200 {object} rest.HttpError
// @Failure      400 {object} rest.HttpError
// @Router      /configuration-center/v1/grade-label/check-name/:name [get]
func (s *Service) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.CheckNameReqParam
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	res, err := s.uc.ExistByName(ctx, req.Name, req.ID, req.NodeType)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// ListIcon  icon查询
// @Summary     icon查询
// @Description icon查询
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Param 		Keyword query string  false "查询标识"
// @Success     200 {array} string "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /configuration-center/v1/grade-label [get]
func (s *Service) ListIcon(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	//var req domain.ListTreeReqParam
	//valid, errs := form_validator.BindQueryAndValid(c, &req)
	//if !valid {
	//	c.Writer.WriteHeader(400)
	//	ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
	//	return
	//}

	res, err := s.uc.ListIcon(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetListByIds 通过ID查询标签列表
// @Summary     通过ID查询标签列表
// @Description 通过ID查询标签列表
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Param 		Keyword query string  false "查询标识"
// @Success     200 {object} domain.TreeNodeExtInfoList "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /configuration-center/v1/grade-label [get]
func (s *Service) GetListByIds(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.ListByIdsReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.GetListByIds(ctx, req.Ids)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetInfoByID  通过ID查询标签绑定信息
// @Summary     通过ID查询标签绑定信息
// @Description 通过ID查询标签绑定信息
// @Tags        标签管理
// @Accept      application/json
// @Produce     json
// @Success     200 {object} domain.ListBindObjects  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数
// @Router      /configuration-center/v1/grade-label/{id} [get]
func (s *Service) GetBindObjectsByID(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.GetInfoByIDReqParam
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	res, err := s.uc.GetBindObjects(ctx, req.ID.String())
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	if res == nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelNotExist, errs))
		return
	}
	ginx.ResOKJson(c, res)
}
