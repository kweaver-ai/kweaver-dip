package v1

import (
	"fmt"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/recognition_algorithm"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/xuri/excelize/v2"
)

type RecognitionAlgorithmService struct {
	uc recognition_algorithm.RecognitionAlgorithmUseCase
}

func NewRecognitionAlgorithmService(uc recognition_algorithm.RecognitionAlgorithmUseCase) *RecognitionAlgorithmService {
	return &RecognitionAlgorithmService{uc: uc}
}

// PageList 获取识别算法列表
//
//	@Description	获取识别算法列表
//	@Tags			识别算法
//	@Summary		获取识别算法列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			query			query		recognition_algorithm.PageListRecognitionAlgorithmReq	true	"查询参数"
//	@Success		200				{object}	recognition_algorithm.PageListRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/recognition-algorithm [get]
func (f *RecognitionAlgorithmService) PageList(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.PageListRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.PageList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Create 创建识别算法
//
//	@Description	创建识别算法
//	@Tags			识别算法
//	@Summary		创建识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			body			body		recognition_algorithm.CreateRecognitionAlgorithmReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.CreateRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/recognition-algorithm [post]
func (f *RecognitionAlgorithmService) Create(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.CreateRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Create)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Update 更新识别算法
//
//	@Description	更新识别算法
//	@Tags			识别算法
//	@Summary		更新识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			id				path		string					                    true	"识别算法ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			body			body		recognition_algorithm.UpdateRecognitionAlgorithmReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.UpdateRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/recognition-algorithm/{id} [put]
func (f *RecognitionAlgorithmService) Update(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.UpdateRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Update)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetDetailById 获取识别算法详情
//
//	@Description	获取识别算法详情
//	@Tags			识别算法
//	@Summary		获取识别算法详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"识别算法ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	recognition_algorithm.RecognitionAlgorithmDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/{id} [get]
func (f *RecognitionAlgorithmService) GetDetailById(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.GetDetailByIdReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetDetailById)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除识别算法
//
//	@Description	删除识别算法
//	@Tags			识别算法
//	@Summary		删除识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"识别算法ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	recognition_algorithm.DeleteRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/{id} [delete]
func (f *RecognitionAlgorithmService) Delete(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.DeleteRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Delete)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetWorkingAlgorithmIds 获取生效的识别算法ID列表
//
//	@Description	获取生效的识别算法ID列表
//	@Tags			识别算法
//	@Summary		获取生效的识别算法ID列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			body			body		recognition_algorithm.GetWorkingAlgorithmIdsReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.GetWorkingAlgorithmIdsResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/recognition-algorithm/working-ids [post]
func (f *RecognitionAlgorithmService) GetWorkingAlgorithmIds(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.GetWorkingAlgorithmIdsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetWorkingAlgorithmIds)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// DeleteBatch 批量删除识别算法
//
//	@Description	批量删除识别算法
//	@Tags			识别算法
//	@Summary		批量删除识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			body			body		recognition_algorithm.DeleteBatchRecognitionAlgorithmReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.DeleteBatchRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/recognition-algorithm/batch-delete [post]
func (f *RecognitionAlgorithmService) DeleteBatch(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.DeleteBatchRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.DeleteBatch)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Start 启动识别算法
//
//	@Description	启动识别算法
//	@Tags			识别算法
//	@Summary		启动识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"识别算法ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	recognition_algorithm.StartRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/{id}/start [post]
func (f *RecognitionAlgorithmService) Start(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.StartRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Start)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Stop 停止识别算法
//
//	@Description	停止识别算法
//	@Tags			识别算法
//	@Summary		停止识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"识别算法ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	recognition_algorithm.StopRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/{id}/stop [post]
func (f *RecognitionAlgorithmService) Stop(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.StopRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Stop)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Export 导出识别算法
//
//	@Description	导出识别算法
//	@Tags			识别算法
//	@Summary		导出识别算法
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			body			body		recognition_algorithm.ExportRecognitionAlgorithmReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.ExportRecognitionAlgorithmResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/export [post]
func (f *RecognitionAlgorithmService) Export(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.ExportRecognitionAlgorithmReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Export)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	file := excelize.NewFile()
	now := time.Now()
	// 定义日期格式
	dateFormat := "2006-01-02"
	// 格式化时间为字符串
	dateStr := now.Format(dateFormat)
	fileName := fmt.Sprintf("recognition_algorithm_%s.xlsx", dateStr)
	sheetName := "Sheet1"

	headers := []string{"算法名称", "描述", "算法类型", "状态"}
	for colIndex, header := range headers {
		cell, err := excelize.CoordinatesToCellName(colIndex+1, 1)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
		err = file.SetCellValue(sheetName, cell, header)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
	}

	for rowIndex, data := range resp.Data {
		// Map status from 0/1 to "停用"/"启用"
		status := "停用"
		if data.Status == 1 {
			status = "启用"
		}
		values := []interface{}{data.Name, data.Description, data.Type, status}
		for colIndex, value := range values {
			cell, err := excelize.CoordinatesToCellName(colIndex+1, rowIndex+2)
			if err != nil {
				ginx.ResBadRequestJson(c, err)
				return
			}
			err = file.SetCellValue(sheetName, cell, value)
			if err != nil {
				ginx.ResBadRequestJson(c, err)
				return
			}
		}
	}

	Write(c, fileName, file)
}

func Write(ctx *gin.Context, fileName string, file *excelize.File) {
	ctx.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	ctx.Writer.Header().Set("Content-disposition", disposition)
	ctx.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(ctx.Writer)
}

// DuplicateCheck 检查识别算法名称是否存在
//
//	@Description	检查识别算法名称是否存在
//	@Tags			识别算法
//	@Summary		检查识别算法名称是否存在
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			body			body		recognition_algorithm.DuplicateCheckReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.DuplicateCheckResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/duplicate-check [post]
func (f *RecognitionAlgorithmService) DuplicateCheck(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.DuplicateCheckReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.DuplicateCheck)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetInnerType 获取识别算法内置类型
//
//	@Description	获取识别算法内置类型
//	@Tags			识别算法
//	@Summary		获取识别算法内置类型
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Success		200				{object}	recognition_algorithm.GetInnerTypeResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/inner-type [get]
func (f *RecognitionAlgorithmService) GetInnerType(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.GetInnerTypeReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetInnerType)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetSubjectsByIds 获取识别算法分类属性
//
//	@Description	获取识别算法分类属性
//	@Tags			识别算法
//	@Summary		获取识别算法分类属性
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			body			body		recognition_algorithm.GetSubjectsByIdsReq	true	"请求参数"
//	@Success		200				{object}	recognition_algorithm.GetSubjectsByIdsResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/recognition-algorithm/subjects-by-ids [post]
func (f *RecognitionAlgorithmService) GetSubjectsByIds(c *gin.Context) {
	req := form_validator.Valid[recognition_algorithm.GetSubjectsByIdsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetSubjectsByIds)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
