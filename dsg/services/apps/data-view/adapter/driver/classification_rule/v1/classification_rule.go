package v1

import (
	"fmt"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/classification_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/xuri/excelize/v2"
)

type ClassificationRuleService struct {
	uc classification_rule.ClassificationRuleUseCase
}

func NewClassificationRuleService(uc classification_rule.ClassificationRuleUseCase) *ClassificationRuleService {
	return &ClassificationRuleService{uc: uc}
}

// PageList 获取分类规则列表
//
//	@Description	获取分类规则列表
//	@Tags			分类规则
//	@Summary		获取分类规则列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			query			query		classification_rule.PageListClassificationRuleReq	true	"查询参数"
//	@Success		200				{object}	classification_rule.PageListClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/classification-rule [get]
func (f *ClassificationRuleService) PageList(c *gin.Context) {
	req := form_validator.Valid[classification_rule.PageListClassificationRuleReq](c)
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

// Create 创建分类规则
//
//	@Description	创建分类规则
//	@Tags			分类规则
//	@Summary		创建分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			body			body		classification_rule.CreateClassificationRuleReq	true	"请求参数"
//	@Success		200				{object}	classification_rule.CreateClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/classification-rule [post]
func (f *ClassificationRuleService) Create(c *gin.Context) {
	req := form_validator.Valid[classification_rule.CreateClassificationRuleReq](c)
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

// Update 更新分类规则
//
//	@Description	更新分类规则
//	@Tags			分类规则
//	@Summary		更新分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			id				path		string					                true	"分类规则ID"
//	@Param			body			body		classification_rule.UpdateClassificationRuleReq	true	"请求参数"
//	@Success		200				{object}	classification_rule.UpdateClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/classification-rule/{id} [put]
func (f *ClassificationRuleService) Update(c *gin.Context) {
	req := form_validator.Valid[classification_rule.UpdateClassificationRuleReq](c)
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

// GetDetailById 获取分类规则详情
//
//	@Description	获取分类规则详情
//	@Tags			分类规则
//	@Summary		获取分类规则详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"分类规则ID"
//	@Success		200				{object}	classification_rule.ClassificationRuleDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/classification-rule/{id} [get]
func (f *ClassificationRuleService) GetDetailById(c *gin.Context) {
	req := form_validator.Valid[classification_rule.GetDetailByIdReq](c)
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

// Delete 删除分类规则
//
//	@Description	删除分类规则
//	@Tags			分类规则
//	@Summary		删除分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"分类规则ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	classification_rule.DeleteClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/classification-rule/{id} [delete]
func (f *ClassificationRuleService) Delete(c *gin.Context) {
	req := form_validator.Valid[classification_rule.DeleteClassificationRuleReq](c)
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

// Export 导出分类规则
//
//	@Description	导出分类规则
//	@Tags			分类规则
//	@Summary		导出分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			body			body		classification_rule.ExportClassificationRuleReq	true	"请求参数"
//	@Success		200				{object}	classification_rule.ExportClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/classification-rule/export [post]
func (f *ClassificationRuleService) Export(c *gin.Context) {
	req := form_validator.Valid[classification_rule.ExportClassificationRuleReq](c)
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
	dateFormat := "2006-01-02"
	dateStr := now.Format(dateFormat)
	fileName := fmt.Sprintf("classification_rule_%s.xlsx", dateStr)
	sheetName := "Sheet1"

	headers := []string{"识别规则名称", "描述", "引用识别算法", "算法", "识别字段分类", "启用状态"}
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
		values := []interface{}{data.RuleName, data.Description, data.AlgorithmName, data.Algorithm, data.SubjectName, status}
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

// Start 启动分类规则
//
//	@Description	启动分类规则
//	@Tags			分类规则
//	@Summary		启动分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"分类规则ID"
//	@Success		200				{object}	classification_rule.StartClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/classification-rule/{id}/start [post]
func (f *ClassificationRuleService) Start(c *gin.Context) {
	req := form_validator.Valid[classification_rule.StartClassificationRuleReq](c)
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

// Stop 停止分类规则
//
//	@Description	停止分类规则
//	@Tags			分类规则
//	@Summary		停止分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"分类规则ID"
//	@Success		200				{object}	classification_rule.StopClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/classification-rule/{id}/stop [post]
func (f *ClassificationRuleService) Stop(c *gin.Context) {
	req := form_validator.Valid[classification_rule.StopClassificationRuleReq](c)
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

// Statistics 统计分类规则
//
//	@Description	统计分类规则
//	@Tags			分类规则
//	@Summary		统计分类规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Success		200				{object}	classification_rule.StatisticsClassificationRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/classification-rule/statistics [get]
func (f *ClassificationRuleService) Statistics(c *gin.Context) {
	req := form_validator.Valid[classification_rule.StatisticsClassificationRuleReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.Statistics)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func Write(ctx *gin.Context, fileName string, file *excelize.File) {
	ctx.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	ctx.Writer.Header().Set("Content-disposition", disposition)
	ctx.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(ctx.Writer)
}
