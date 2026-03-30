package carousels

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/carousels"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	_ "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Service 结构体
// 包含 CarouselService 用于业务逻辑处理
type Service struct {
	carouselService domain.IService
	initOnce        sync.Once
}

// NewService 创建一个新的 Service 实例
func NewService(carouselService domain.IService) *Service {
	s := &Service{
		carouselService: carouselService,
	}
	// 启动定时任务
	//go s.startInitTask()
	return s
}

func (s *Service) startInitTask() {
	// 使用 sync.Once 确保只执行一次
	s.initOnce.Do(func() {
		// 等待服务完全启动
		log.Info(`Waiting for service to upload default images start...`)
		time.Sleep(5 * time.Second)
		// 创建一个新的 gin.Context
		c := &gin.Context{}
		c.Request = &http.Request{}
		c.Request = c.Request.WithContext(context.Background())
		if err := s.InitDefaultImage(c); err != nil {
			log.WithContext(c).Errorf("Failed to initialize default image: %v", err)
		} else {
			log.WithContext(c).Info("Successfully initialized default image")
		}
	})
}

// 添加一个手动触发初始化的方法（可选）
func (s *Service) TriggerInit() {
	s.startInitTask()
}

// Upload 上传附件
//
//		@Description	上传附件
//		@Tags			轮播图管理
//		@Summary		上传附件
//		@Accept			multiparty/form-data
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//	 @param          file   formData   file   true   "上传的文件"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels  [post]
func (s *Service) Upload(c *gin.Context) {
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
	formFile := headers[0]
	file, err := s.carouselService.Upload(c, formFile, "", "")
	fmt.Printf("%v", file)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, file)
}

// Delete 删除附件
//
//		@Description	删除附件
//		@Tags			轮播图管理
//		@Summary		删除附件
//		@Accept			application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//
// @Router			/api/configuration-center/v1/carousels/:id   [DELETE]
func (s *Service) Delete(c *gin.Context) {
	req := &domain.IDPathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in delete file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.carouselService.Delete(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete carousel item, id: %v, error: %v", req.ID, err)
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Get 查询文件列表
//
//		@Description	查询图片列表
//		@Tags			轮播图管理
//		@Summary		查询图片
//		@Accept			application/json
//	    @Param       Authorization header   string                    true "token"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//
// @Router			/api/configuration-center/v1/carousels/   [GET]
func (s *Service) Get(c *gin.Context) {
	//req := &domain.ListReq{}
	var req domain.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get address book list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	// 设置默认值
	if req.Offset == 0 {
		req.Offset = 1
	}
	if req.Limit == 0 {
		req.Limit = 10
	}
	resp, err := s.carouselService.GetList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		//ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Replace 替换附件
//
//		@Description	替换附件
//		@Tags			轮播图管理
//		@Summary		替换附件
//		@Accept			multiparty/form-data
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//	 @param          file   formData   file   true   "上传的新文件"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/{id}/replace [post]
func (s *Service) Replace(c *gin.Context) {
	req := &domain.ReplaceFileReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
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
	//打印headers中长度
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}
	newFile := headers[0]
	err = s.carouselService.Replace(c, req, newFile)
	ginx.ResOKJson(c, req.ID)
}

// preview 文件预览
//
//		@Description	文件预览
//		@Tags			轮播图管理
//		@Summary		文件预览
//		@Produce		application/json
//	    @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/{id}/preview [get]

func (s *Service) Preview(c *gin.Context) {
	req := &domain.IDPathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	file, err := s.carouselService.Preview(c, req)
	if err != nil {
	}
	ginx.ResOKJson(c, file)
}

// UploadCase 上传案例附件
//
//		@Description	上传案例附件
//		@Tags			轮播图管理
//		@Summary		上传案例附件
//		@Accept			multiparty/form-data
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//	 @param          file   formData   file   true   "上传的文件"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/{id}/{type}/upload-case [post]
func (s *Service) UploadCase(c *gin.Context) {
	req := &domain.UploadCasePathReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in upload file, err: %v", err)
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
	formFile := headers[0]
	file, err := s.carouselService.Upload(c, formFile, req.ID, req.Type)
	fmt.Printf("%v", file)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, file)
}

// UpdateCase 更新案例附件
//
//		@Description	更新案例附件
//		@Tags			轮播图管理
//		@Summary		更新案例附件
//		@Accept			multiparty/form-data
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//	 @param          file   formData   file   true   "上传的新文件"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/{id}/replace [post]
func (s *Service) UpdateCase(c *gin.Context) {
	req := &domain.UploadCasePathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
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
	//打印headers中长度
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}
	newFile := headers[0]

	err = s.carouselService.UpdateCase(c, req, newFile)
	ginx.ResOKJson(c, req.ID)
}

// GetOSSFile 浏览器查看oss图片
//
//		@Description	浏览器查看oss图片
//		@Tags			轮播图管理
//		@Summary		浏览器查看oss图片
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/oss/{id} [get]

func (s *Service) GetOSSFile(c *gin.Context) {
	req := &domain.IDPathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	bytes, err := s.carouselService.GetOssFile(c, req)
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

// UpdateCaseState 更新案例状态
//
//		@Description	更新案例状态
//		@Tags			轮播图管理
//		@Summary		更新案例状态
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@body			body	domain.UploadCaseStateParam	true	"更新案例状态"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/update-case-state [put]

func (s *Service) UpdateCaseState(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	jsonParam := &domain.UploadCaseStateParam{}
	if _, err := form_validator.BindJsonAndValid(c, jsonParam); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req body param, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	file, err := s.carouselService.UpdateState(c, jsonParam)
	if err != nil {
	}
	ginx.ResOKJson(c, file)
}

// GetByCaseName 根据案例名称查询案例
//
//		@Description	根据案例名称查询案例
//		@Tags			轮播图管理
//		@Summary		根据案例名称查询案例
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@body			body	domain.ListCaseReq	true	"根据案例名称查询案例"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/case [get]

func (s *Service) GetByCaseName(c *gin.Context) {
	var req domain.ListCaseReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get address book list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	file, err := s.carouselService.GetByCaseName(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	finalResp := make([]*domain.CarouselCaseQuery, len(file))
	for i := range file {
		finalResp[i] = &domain.CarouselCaseQuery{
			ID:                   file[i].ID,
			ApplicationExampleID: file[i].ApplicationExampleID,
			Name:                 file[i].Name,
			Type:                 file[i].Type,
			State:                file[i].State,
			IsTop:                file[i].IsTop,
			CaseName:             file[i].CaseName,
			Uuid:                 file[i].UUID,
		}
	}

	ginx.ResOKJson(c, finalResp)
}

// DeleteCase 删除案例
//
//		@Description	删除案例
//		@Tags			轮播图管理
//		@Summary		删除案例
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/api/configuration-center/v1/carousels/ [delete]
func (s *Service) DeleteCase(c *gin.Context) {
	req := &domain.IDPathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	_, err := s.carouselService.DeleteCase(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// UpdateInterval 更新轮播图案例轮播间隔时间
//
//		@Description	更新轮播图案例轮播间隔时间
//		@Tags			轮播图管理
//		@Summary		更新轮播图案例轮播间隔时间
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@body			body	domain.IntervalSeconds	true	"更新轮播图案例轮播间隔时间"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应
//		@Router			/api/configuration-center/v1/carousels/interval [put]

func (s *Service) UpdateInterval(c *gin.Context) {
	req := &domain.IntervalSeconds{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	err := s.carouselService.UpdateInterval(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// UpdateTop 更新轮播图案例置顶
//
//		@Description	更新轮播图案例置顶
//		@Tags			轮播图管理
//		@Summary		更新轮播图案例置顶
//		@Produce		application/json
//	 @Param       Authorization header   string                    true "token"
//		@Param			id		path		string			true	"附件ID"
//		@Success		200	{object}	domain.IDResp	"成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应
//      @Router			/api/configuration-center/v1/carousels/update-top [put]

func (s *Service) UpdateTop(c *gin.Context) {
	req := &domain.IDResp{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	err := s.carouselService.UpdateTop(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
	}
	ginx.ResOKJson(c, true)
}

// 在Service结构体中添加初始化方法
func (s *Service) InitDefaultImage(c *gin.Context) error {
	// 检查是否已存在默认图片
	exists, err := s.carouselService.CheckDefaultImageExists(c)
	if err != nil {
		return fmt.Errorf("check default image exists failed: %v", err)
	}
	if exists {
		return nil
	}
	defaultImagePath := "/app/assets/default/default.png"
	// 检查文件是否存在
	if _, err := os.Stat(defaultImagePath); os.IsNotExist(err) {
		return fmt.Errorf("default image file not found at path: %s", defaultImagePath)
	}
	// 检查文件是否存在
	if _, err := os.Stat(defaultImagePath); os.IsNotExist(err) {
		return fmt.Errorf("default image file not found at path: %s", defaultImagePath)
	}
	// 读取默认图片文件
	file, err := os.Open(defaultImagePath)
	if err != nil {
		return fmt.Errorf("open default image file failed: %v", err)
	}
	defer file.Close()

	// 读取文件内容
	fileContent, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("read file content failed: %v", err)
	}

	// 创建 multipart 请求
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 创建文件部分
	part, err := writer.CreateFormFile("file", "default_image.jpg")
	if err != nil {
		return fmt.Errorf("create form file failed: %v", err)
	}

	// 写入文件内容
	if _, err := part.Write(fileContent); err != nil {
		return fmt.Errorf("write file content failed: %v", err)
	}

	// 关闭 writer
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close writer failed: %v", err)
	}

	// 创建请求
	req, err := http.NewRequest("POST", "", body)
	if err != nil {
		return fmt.Errorf("create request failed: %v", err)
	}

	// 设置 Content-Type
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// 解析 multipart 表单
	if err := req.ParseMultipartForm(32 << 20); err != nil {
		return fmt.Errorf("parse multipart form failed: %v", err)
	}

	// 获取文件
	fileHeader := req.MultipartForm.File["file"][0]

	// 上传默认图片
	_, err = s.carouselService.Upload(c, fileHeader, "", "")
	return err
}

// 实现 multipart.File 接口
type fileWrapper struct {
	*bytes.Reader
}

func (f *fileWrapper) Close() error {
	return nil
}

// UpdateSort 更新排序
// @Summary 更新轮播图排序
// @Description 更新指定轮播图的排序位置，支持按类型分组排序
// @Tags 轮播图管理
// @Accept json
// @Produce json
// @Param id query string true "轮播图ID"
// @Param position query int true "目标排序位置，从1开始"
// @Param type query string true "轮播图类型，支持单个类型如'0'或多个类型如'1,2'，可以带单引号"
// @Success 200 {object} ginx.Response "成功返回轮播图ID"
// @Failure 400 {object} ginx.Response "参数错误"
// @Failure 500 {object} ginx.Response "服务器内部错误"
// @Router /api/configuration-center/v1/carousels/update-sort [put]
func (s *Service) UpdateSort(c *gin.Context) {
	req := &domain.UpdateSortReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in preview file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	if err := s.carouselService.UpdateSort(c, req); err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, req.ID)
}
