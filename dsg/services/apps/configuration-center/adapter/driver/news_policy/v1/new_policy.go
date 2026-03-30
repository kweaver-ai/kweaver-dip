package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/news_policy"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	newsPolicy domain.UseCase
}

func NewService(service domain.UseCase) *Service {
	return &Service{newsPolicy: service}
}

//List 查询列表
// @Summary		获取帮助文档列表
// @Tags				帮助文档
// @Accept			application/json
// @Produce			application/json
// @Param				body	body		domain.NewsPolicyAddRes	true	"body"
// @Security		ApiKeyAuth
// @Produce			application/json
// @Success			200		{object}	domain.ListResp
// @Router			/api/configuration-center/v1/news_policy [get]

func (s *Service) List(c *gin.Context) {
	opts := &domain.ListReq{}
	if _, err := form_validator.BindQueryAndValid(c, &opts); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get address book list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.newsPolicy.Get(c, opts)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)

}

// @Summary      创建新闻/政策
// @Description  根据传入的表单数据和文件创建一个新的新闻策略条目
// @Tags         NewsPolicy
// @Accept       multipart/form-data
// @Produce      json
// @Param        file formData file true "上传的文件"
// @Param        title formData string true "新闻标题"
// @Param        content formData string true "新闻内容"
// @Param        type formData string true "新闻类型"
// @Param        status formData string true "状态 (例如: active, inactive)"
// @Success      200  {object}  gin.H{data=domain.NewsPolicyResponse}
// @Failure      400  {object}  errorcode.ErrorResponse
// @Router       /api/configuration-center/v1/news-policy/create [post]

func (s *Service) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.NewsPolicyAddRes{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	form, err := c.MultipartForm()
	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}
	headers := form.File["file"]
	if headers == nil {
		resp, err := s.newsPolicy.NewAdd(c, req, nil, userInfo.ID)
		if err != nil {
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
			return
		}
		c.JSON(200, gin.H{"data": resp})
	} else {
		resp, err := s.newsPolicy.NewAdd(c, req, headers[0], userInfo.ID)
		if err != nil {
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, err)
			return
		}
		c.JSON(200, gin.H{"data": resp})
	}

}

// Update @Summary      更新新闻策略
// @Description  根据传入的 ID 和表单数据更新一个已有的新闻策略条目（可选上传新文件）
// @Tags         NewsPolicy
// @Accept       multipart/form-data
// @Produce      json
// @Param        id path string true "新闻策略ID"
// @Param        file formData file false "可选：上传的新文件"
// @Param        title formData string true "新闻标题"
// @Param        content formData string true "新闻内容"
// @Param        type formData string true "新闻类型"
// @Param        status formData string true "状态 (例如: active, inactive)"
// @Success      200  {object}  gin.H{data=domain.NewsPolicyResponse}
// @Failure      400  {object}  errorcode.ErrorResponse
// @Router       /api/configuration-center/v1/news-policy/{id} [put]
func (s *Service) Update(c *gin.Context) {
	var err error
	id := &domain.NewsPolicySaveReq{}
	if _, err := form_validator.BindUriAndValid(c, id); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.NewsPolicyAddRes{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormExistRequiredEmpty))
		return
	}
	headers := form.File["file"]

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}
	if headers == nil {
		resp, err := s.newsPolicy.UpdateAdd(c, req, nil, id.ID, userInfo.ID)
		if err != nil {
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, err)
			return
		}
		c.JSON(200, gin.H{"data": resp})
	} else {
		resp, err := s.newsPolicy.UpdateAdd(c, req, headers[0], id.ID, userInfo.ID)
		if err != nil {
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, err)
			return
		}
		c.JSON(200, gin.H{"data": resp})
	}

}

// 删除
// Delete @Summary      删除新闻策略
// @Description  根据传入的 ID 删除一个新闻策略条目
// @Tags         NewsPolicy
// @Accept       json
// @Produce      json
// @Param        id path string true "新闻策略ID"
// @Success      200  {object}  gin.H{data=domain.NewsPolicyResponse}
// @Failure      400  {object}  errorcode.ErrorResponse
// @Router       /api/configuration-center/v1/news-policy/{id} [delete]

func (s *Service) Delete(c *gin.Context) {
	req := &domain.NewsPolicyDeleteReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in delete file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.newsPolicy.Delete(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete carousel item, id: %v, error: %v", req.ID, err)
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	c.JSON(200, gin.H{"msg": resp})
}

// Detail @Summary      获取新闻策略详情
// @Description  根据查询参数获取指定新闻策略的详细信息
// @Tags         NewsPolicy
// @Accept       json
// @Produce      json
// @Param        id query string true "新闻策略ID"
// @Success      200  {object}  gin.H{data=domain.NewsPolicyDetail}
// @Failure      400  {object}  errorcode.ErrorResponse
// @Router       /api/configuration-center/v1/news-policy/detail [get]
func (s *Service) Detail(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.NewsDetailsReq{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
	}
	resp, err := s.newsPolicy.GetNewsPolicyList(ctx, req)
	c.JSON(200, resp)
}

// UpdateStatus @Summary      更新新闻策略状态
// @Description  根据传入的 ID 更新新闻策略的状态
// @Tags         NewsPolicy
// @Accept       json
// @Produce      json
// @Param        id path string true "新闻策略ID"
// @Param        status query string true "状态 (例如: active, inactive)"
// @Success      200  {object}  gin.H{data=domain.NewsPolicyResponse}
// @Failure      400  {object}  errorcode.ErrorResponse
// @Router       /api/configuration-center/v1/news-policy/{id}/status [put]
func (s *Service) UpdateStatus(c *gin.Context) {
	req := &domain.UpdatePolicyPath{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in update help document status, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	msg, err := s.newsPolicy.UpdatePolicyStatus(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	c.JSON(200, gin.H{"msg": msg})
}

// GetOSSFile 浏览器查看oss图片
//
//		@Description	浏览器查看oss图片
//		@Tags			轮播图管理
//		@Summary		浏览器查看oss图片
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/oss/{id} [get]

func (s *Service) GetOSSFile(c *gin.Context) {
	req := &domain.NewsPolicyDeleteReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	bytes, err := s.newsPolicy.GetOssFile(c, req)
	if err != nil {
	}
	_, err = c.Writer.Write(bytes)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	contentType := http.DetectContentType(bytes)
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", "inline") // inline 表示浏览器尝试预览
	c.Header("Content-Transfer-Encoding", "binary")

	c.Writer.WriteHeader(http.StatusOK)
	return
}

// CreateHelpDocument 新增帮助文档
//
//		@Description	新增帮助文档
//		@Tags			新闻政策管理
//		@Summary		新增帮助文档
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/ [post]
func (s *Service) CreateHelpDocument(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.HelpDocument{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormExistRequiredEmpty))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}
	resp, _ := s.newsPolicy.CreateHelpDocument(c, req, headers[0], userInfo.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}
	c.JSON(200, gin.H{"data": resp})
}

// UpdateHelpDocument 获取文件列表
//
//		@Description	获取文件列表
//		@Tags			新闻政策管理
//		@Summary		获取文件列表
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/ [get]

func (s *Service) HelpDocumentList(c *gin.Context) {
	req := &domain.ListHelpDocumentReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to bind list help document request, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.newsPolicy.GetHelpDocumentList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateHelpDocument 更新帮助文件
//
//		@Description	更新帮助文件
//		@Tags			新闻政策管理
//		@Summary		更新帮助文件
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/ [put]

func (s *Service) UpdateHelpDocument(c *gin.Context) {
	var err error
	id := &domain.NewsPolicySaveReq{}
	if _, err := form_validator.BindUriAndValid(c, id); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.HelpDocument{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormExistRequiredEmpty))
		return
	}
	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}
	headers := form.File["file"]
	resp, _ := s.newsPolicy.UpdateHelpDocument(c, req, headers[0], id.ID, userInfo.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}
	c.JSON(200, gin.H{"data": resp})

}

// DeleteHelpDocument 删除文件
//
//		@Description	删除文件
//		@Tags			新闻政策管理
//		@Summary		删除文件
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/preview [deleted]
func (s *Service) DeleteHelpDocument(c *gin.Context) {
	req := &domain.DeleteHelpDocumentReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to bind delete help document request, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	msg, err := s.newsPolicy.DeleteHelpDocument(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	c.JSON(200, gin.H{"msg": msg})
}

// GetHelpDocumentDetail 获取详情
//
//		@Description	获取详情
//		@Tags			新闻政策管理
//		@Summary		获取详情
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/preview [get]

func (s *Service) GetHelpDocumentDetail(c *gin.Context) {
	req := &domain.GetHelpDocumentReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to bind get help document detail request, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.newsPolicy.GetHelpDocumentDetail(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	c.JSON(200, gin.H{"data": resp})
}

// preview 文件预览
//
//		@Description	文件预览
//		@Tags			轮播图管理
//		@Summary		文件预览
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/preview [get]

func (s *Service) Preview(c *gin.Context) {
	req := &domain.NewsPolicySaveReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	file, err := s.newsPolicy.Preview(c, req)
	if err != nil {
	}
	ginx.ResOKJson(c, file)
}

// UpdateHelpDocumentStatus 更新帮助文件状态
//
//		@Description	更新帮助文件状态
//		@Tags			新闻政策管理
//		@Summary		更新帮助文件状态
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/news-policy/{id}/{status} [put]
func (s *Service) UpdateHelpDocumentStatus(c *gin.Context) {
	req := &domain.UpdateHelpDocumentPath{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in update help document status, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	msg, err := s.newsPolicy.UpdateHelpDocumentStatus(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	c.JSON(200, gin.H{"msg": msg})
}

// GetOSSPreviewFile 浏览器查看文件
//
//		@Description	浏览器查看文件
//		@Tags			轮播图管理
//		@Summary		浏览器查看文件
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	common.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/file/{id} [get]

func (s *Service) GetOSSPreviewFile(c *gin.Context) {
	req := &domain.NewsPolicyDeleteReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	file, bytes, err := s.newsPolicy.GetOssPreviewFile(c, req)
	if err != nil {
	}
	_, err = c.Writer.Write(bytes)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename=\""+file.SavePath+"\"")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Data(http.StatusOK, "application/octet-stream", bytes)

	c.Writer.WriteHeader(http.StatusOK)
	return
}
