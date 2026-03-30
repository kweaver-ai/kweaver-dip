package flowchart

import (
	"errors"
	"net/http"

	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// QueryPage godoc
// @Description 获取运营流程列表，支持分页
// @Tags      open运营流程配置
// @Summary     获取运营流程列表
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _   query    domain.QueryPageReqParam  false "查询参数"
// @Success     200 {object} domain.QueryPageReapParam "成功响应参数"
// @Failure     400 {object} rest.HttpError            "失败响应参数"
// @Router      /flowchart-configurations [get]
func (s *Service) QueryPage(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.QueryPageReqParam{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	var res *domain.QueryPageReapParam
	// keyword放到domain层去处理，因为未发布和发布的运营流程数量无论keyword校验是否通过，都要返回这部分信息
	res, err = s.uc.ListByPaging(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to list domain", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// Get 获取指定运营流程信息
// @Description 获取指定运营流程信息
// @Tags        open运营流程配置
// @Summary     获取指定运营流程信息
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       fid path     string         true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// @Success     200 {object} domain.GetResp "成功响应参数"
// @Failure     400 {object} rest.HttpError "失败响应参数"
// @Router      /flowchart-configurations/{fid} [get]
func (s *Service) Get(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.UriReqParamFId{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get flowchart api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	fid := *uriParam.FId

	resp, err := s.uc.Get(ctx, fid)
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowchart info", zap.String("flowchart id", fid), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete godoc
// @Description 删除指定的运营流程
// @Tags        运营流程配置
// @Summary     删除指定的运营流程
// @Accept      json
// @Produce     json
// @Param       fid path     string              true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// @Success     200 {array}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError      "失败响应参数"
// @Router      /flowchart-configurations/{fid} [delete]
func (s *Service) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.UriReqParamFId{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in delete flowchart api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	fid := *uriParam.FId
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	var resp *response.NameIDResp
	resp, err = s.uc.Delete(ctx, fid)
	if err != nil {
		log.WithContext(ctx).Error("failed to delete flowchart", zap.String("flowchart id", fid), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	log.Infof("user: %v ,id: %v Delete flowchart:%v", info.ID, info.Name, uriParam.FId)
	ginx.ResOKJson(c, []*response.NameIDResp{resp})
}

// PreCreate godoc
// @Description 预创建运营流程
// @Tags        运营流程配置
// @Summary     预创建运营流程
// @Accept      json
// @Produce     json
// @Param       _   body     domain.PreCreateReqParam  true "请求参数"
// @Success     200 {object} domain.PreCreateRespParam "成功响应参数"
// @Failure     400 {object} rest.HttpError            "失败响应参数"
// @Router      /flowchart-configurations [post]
func (s *Service) PreCreate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.PreCreateReqParam{}
	_, err = form_validator.BindJsonAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to binding req param in pre create flowchart api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	resp, err := s.uc.PreCreate(ctx, req, info.ID)
	if err != nil {
		log.WithContext(ctx).Error("failed to pre create flowchart", zap.Any("req", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Edit 编辑指定运营流程基本信息
// @Description 编辑指定运营流程基本信息
// @Tags        运营流程配置
// @Summary     编辑指定运营流程基本信息
// @Accept      json
// @Produce     json
// @Param       fid path     string                  true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// @Param       _   body     domain.EditReqParamBody true "请求参数"
// @Success     200 {array}  response.NameIDResp     "成功响应参数"
// @Failure     400 {object} rest.HttpError          "失败响应参数"
// @Router      /flowchart-configurations/{fid} [put]
func (s *Service) Edit(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.EditReqParam{}
	_, err = form_validator.BindUriAndValid(c, &req.UriReqParamFId)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in edit flowchart api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	_, err = form_validator.BindJsonAndValid(c, &req.EditReqParamBody)
	if err != nil {
		log.WithContext(ctx).Error("failed to binding req param in edit flowchart api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	resp, err := s.uc.Edit(ctx, &req.EditReqParamBody, *req.FId, info.ID)
	if err != nil {
		log.WithContext(ctx).Error("failed to edit flowchart", zap.Any("req", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, []*response.NameIDResp{resp})
}

// NameExistCheck godoc
// @Description 运营流程名称唯一性存在检测
// @Tags        运营流程配置
// @Summary     运营流程名称唯一性存在检测
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _   query    domain.NameRepeatReq     true "查询参数"
// @Success     200 {object} response.CheckRepeatResp "成功响应参数"
// @Failure     400 {object} rest.HttpError           "失败响应参数"
// @Router      /flowchart-configurations/check [get]
func (s *Service) NameExistCheck(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.NameRepeatReq{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to binding req param in flowchart name exist check", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	exist, err := s.uc.NameExistCheck(ctx, *req.Name, req.FlowchartID)
	if err != nil {
		log.WithContext(ctx).Error("failed to check flowchart name exist", zap.Any("req", *req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	if exist {
		log.WithContext(ctx).Error("flowchart name already exist", zap.String("name", *req.Name))
		err = errorcode.Desc(errorcode.FlowchartNameAlreadyExist)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	resp := &response.CheckRepeatResp{
		Name:   *req.Name,
		Repeat: exist,
	}

	ginx.ResOKJson(c, resp)
}

// // PreEdit 预编辑运营流程
// // @Description 预编辑运营流程
// // @Tags        运营流程配置
// // @Summary     预编辑运营流程
// // @Accept      json
// // @Produce     json
// // @Param       fid path     string            true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// // @Success     200 {object} domain.PreEditRespParam "成功响应参数"
// // @Failure     400 {object} rest.HttpError          "失败响应参数"
// // @Router      /flowchart-configurations/{fid} [post]
// func (s *Service) PreEdit(c *gin.Context) {
//	req := &domain.UriReqParamFId{}
//	_, err := form_validator.BindUriAndValid(c, &req)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to bind req param in pre edit flowchart api", zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
//		return
//	}
//
//	log.Infof("pre edit flowchart req: %v", req)
//
//	ctx, cancel := models.HttpContextWithTimeout(c)
//	defer cancel()
//
//	resp, err := s.uc.PreEdit(ctx, *req.FId)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to pre edit flowchart", zap.Any("req", req), zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, err)
//		return
//	}
//
//	log.Infof("pre edit flowchart req: %v, resp: %v", req, resp)
//	ginx.ResOKJson(c, resp)
// }

// SaveContent 保存运营流程内容
// @Description 保存运营流程内容
// @Tags    运营流程配置
// @Summary 保存运营流程内容
// @Accept  json
// @Produce json
// @Param   fid path     string                         true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// @Param   _   body     domain.SaveContentReqParamBody true "请求参数"
// @Success 200 {object} domain.SaveContentRespParam    "成功响应参数"
// @Failure 400 {object} rest.HttpError                 "失败响应参数"
// @Router  /flowchart-configurations/{fid}/content [post]
func (s *Service) SaveContent(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.SaveContentReqParam{}
	_, err = form_validator.BindUriAndValid(c, &req.UriReqParamFId)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in save flowchart content api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	_, err = form_validator.BindJsonAndValid(c, &req.SaveContentReqParamBody)
	if err != nil {
		log.WithContext(ctx).Error("failed to binding req param in save flowchart content api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.uc.SaveContent(ctx, &req.SaveContentReqParamBody, *req.FId)
	if err != nil {
		log.WithContext(ctx).Error("failed to save flowchart content", zap.Any("req", req), zap.Error(err))
		if is, validErr := form_validator.IsBindError(c, err); is {
			err = errorcode.Detail(errorcode.FlowchartContentInvalid, validErr)
		}
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetContent 获取运营流程内容
// @Description 获取运营流程内容
// @Tags        运营流程配置
// @Summary     获取运营流程内容
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       fid path     string                         true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// @Param       _   query    domain.GetContentReqParamQuery true "查询参数"
// @Success     200 {object} domain.GetContentRespParam     "成功响应参数"
// @Failure     400 {object} rest.HttpError                 "失败响应参数"
// @Router      /flowchart-configurations/{fid}/content [get]
func (s *Service) GetContent(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetContentReqParam{}
	_, err = form_validator.BindUriAndValid(c, &req.UriReqParamFId)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get flowchart content api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	_, err = form_validator.BindQueryAndValid(c, &req.GetContentReqParamQuery)
	if err != nil {
		log.WithContext(ctx).Error("failed to binding req param in get flowchart content api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.GetContent(ctx, &req.GetContentReqParamQuery, *req.FId)
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowchart content", zap.Any("req", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// // DeleteUnsavedVersion 删除指定运营流程处于编辑状态的版本
// // @Description 删除指定运营流程处于编辑状态的版本，目前只能删除进入到编辑画布但是没有进行任何编辑动作的运营流程版本
// // @Tags        运营流程配置
// // @Summary     删除指定运营流程处于编辑状态的版本
// // @Accept      json
// // @Produce     json
// // @Param       fid path     string            true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// // @Param       _   body     domain.DeleteUnsavedVersionReqParamBody true "请求参数"
// // @Success     200 {object} domain.DeleteUnsavedVersionRespParam    "成功响应参数"
// // @Failure     400 {object} rest.HttpError                          "失败响应参数"
// // @Router      /flowchart-configurations/{fid}/content [delete]
// func (s *Service) DeleteUnsavedVersion(c *gin.Context) {
//	req := &domain.DeleteUnsavedVersionReqParam{}
//	_, err := form_validator.BindUriAndValid(c, &req.UriReqParamFId)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to bind req param in upload flowchart image api", zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
//		return
//	}
//
//	_, err = form_validator.BindJsonAndValid(c, &req.DeleteUnsavedVersionReqParamBody)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to binding req param in upload flowchart image api", zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		if errors.As(err, &form_validator.ValidErrors{}) {
//			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
//			return
//		}
//
//		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
//		return
//	}
//
//	log.Infof("upload flowchart image req: %v", req)
//
//	ctx, cancel := models.HttpContextWithTimeout(c)
//	defer cancel()
//
//	resp, err := s.uc.DeleteUnsavedVersion(ctx, *req.DeleteUnsavedVersionReqParamBody.VersionID, *req.FId)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to upload flowchart image", zap.Any("req", req), zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, err)
//		return
//	}
//
//	log.Infof("upload flowchart image req: %v, resp: %v", req, resp)
//	ginx.ResOKJson(c, resp)
// }

// // UploadImage 上传运营流程图片
// // @Description 上传运营流程图片
// // @Tags        运营流程配置
// // @Summary     上传运营流程图片
// // @Accept      json
// // @Produce     json
// // @Param       fid path     string            true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// // @Param       _   body     domain.UploadImageReqParamBody true "请求参数"
// // @Success     200 {object} domain.UploadImageRespParam    "成功响应参数"
// // @Failure     400 {object} rest.HttpError                 "失败响应参数"
// // @Router      /flowchart-configurations/{fid}/image [post]
// func (s *Service) UploadImage(c *gin.Context) {
//	req := &domain.UploadImageReqParam{}
//	_, err := form_validator.BindUriAndValid(c, &req.UriReqParamFId)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to bind req param in upload flowchart image api", zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
//		return
//	}
//
//	_, err = form_validator.BindJsonAndValid(c, &req.UploadImageReqParamBody)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to binding req param in upload flowchart image api", zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
//		return
//	}
//
//	log.Infof("upload flowchart image req: %v", req)
//
//	ctx, cancel := models.HttpContextWithTimeout(c)
//	defer cancel()
//
//	var resp *domain.UploadImageRespParam
//	resp, err = s.uc.UploadImage(ctx, &req.UploadImageReqParamBody, *req.FId)
//	if err != nil {
//		log.WithContext(ctx).Error("failed to upload flowchart image", zap.Any("req", req), zap.Error(err))
//		c.Writer.WriteHeader(http.StatusBadRequest)
//		ginx.ResErrJson(c, err)
//		return
//	}
//
//	log.Infof("upload flowchart image req: %v, resp: %v", req, resp)
//	ginx.ResOKJson(c, resp)
// }

// GetNodesInfo 获取运营流程节点信息
// @Description 获取运营流程节点信息
// @Tags        open运营流程配置
// @Summary     获取运营流程节点信息
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       fid path     string                           true "运营流程ID，uuid" default(4a5a3cc0-0169-4d62-9442-62214d8fcd8d) format(uuid)
// @Param       _   query    domain.GetNodesInfoReqParamQuery true "查询参数"
// @Success     200 {object} domain.GetNodesInfoRespParam     "成功响应参数"
// @Failure     400 {object} rest.HttpError                   "失败响应参数"
// @Router      /flowchart-configurations/{fid}/nodes [get]
func (s *Service) GetNodesInfo(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetNodesInfoReqParam{}
	_, err = form_validator.BindUriAndValid(c, &req.UriReqParamFId)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get flowchart content api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	_, err = form_validator.BindQueryAndValid(c, &req.GetNodesInfoReqParamQuery)
	if err != nil {
		log.WithContext(ctx).Error("failed to binding req param in get flowchart content api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.uc.GetNodesInfo(ctx, &req.GetNodesInfoReqParamQuery, *req.FId)
	if err != nil {
		log.WithContext(ctx).Error("failed to get flowchart content", zap.Any("req", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.Is(err, errorcode.FlowChartMissingRoleError) {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.FlowchartRoleMissing))
			return
		}
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
