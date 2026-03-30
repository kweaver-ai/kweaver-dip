package v1

import (
	"fmt"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/xuri/excelize/v2"
)

type GradeRuleService struct {
	uc grade_rule.GradeRuleUseCase
}

func NewGradeRuleService(uc grade_rule.GradeRuleUseCase) *GradeRuleService {
	return &GradeRuleService{uc: uc}
}

// PageList 获取分级规则列表
//
//	@Description	获取分级规则列表
//	@Tags			分级规则
//	@Summary		获取分级规则列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			query			query		grade_rule.PageListGradeRuleReq	true	"查询参数"
//	@Success		200				{object}	grade_rule.PageListGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule [get]
func (f *GradeRuleService) PageList(c *gin.Context) {
	req := form_validator.Valid[grade_rule.PageListGradeRuleReq](c)
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

// Create 创建分级规则
//
//	@Description	创建分级规则
//	@Tags			分级规则
//	@Summary		创建分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			body			body		grade_rule.CreateGradeRuleReq	true	"请求参数"
//	@Success		200				{object}	grade_rule.CreateGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule [post]
func (f *GradeRuleService) Create(c *gin.Context) {
	req := form_validator.Valid[grade_rule.CreateGradeRuleReq](c)
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

// Update 更新分级规则
//
//	@Description	更新分级规则
//	@Tags			分级规则
//	@Summary		更新分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true    "id"
//	@Param			body			body		grade_rule.UpdateGradeRuleReq	true	"请求参数"
//	@Success		200				{object}	grade_rule.UpdateGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/{id} [put]
func (f *GradeRuleService) Update(c *gin.Context) {
	req := form_validator.Valid[grade_rule.UpdateGradeRuleReq](c)
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

// GetDetailById 获取分级规则详情
//
//	@Description	获取分级规则详情
//	@Tags			分级规则
//	@Summary		获取分级规则详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true	"分级规则ID"
//	@Success		200				{object}	grade_rule.GradeRuleDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/{id} [get]
func (f *GradeRuleService) GetDetailById(c *gin.Context) {
	req := form_validator.Valid[grade_rule.GetDetailByIdReq](c)
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

// Delete 删除分级规则
//
//	@Description	删除分级规则
//	@Tags			分级规则
//	@Summary		删除分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true	"分级规则ID"
//	@Success		200				{object}	grade_rule.DeleteGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/{id} [delete]
func (f *GradeRuleService) Delete(c *gin.Context) {
	req := form_validator.Valid[grade_rule.DeleteGradeRuleReq](c)
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

// Start 启动分级规则
//
//	@Description	启动分级规则
//	@Tags			分级规则
//	@Summary		启动分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true	"分级规则ID"
//	@Success		200				{object}	grade_rule.StartGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/{id}/start [post]
func (f *GradeRuleService) Start(c *gin.Context) {
	req := form_validator.Valid[grade_rule.StartGradeRuleReq](c)
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

// Stop 停止分级规则
//
//	@Description	停止分级规则
//	@Tags			分级规则
//	@Summary		停止分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id				path		string					true	"分级规则ID"
//	@Success		200				{object}	grade_rule.StopGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/{id}/stop [post]
func (f *GradeRuleService) Stop(c *gin.Context) {
	req := form_validator.Valid[grade_rule.StopGradeRuleReq](c)
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

// Export 导出分级规则
//
//	@Description	导出分级规则
//	@Tags			分级规则
//	@Summary		导出分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			body			body		grade_rule.ExportGradeRuleReq	true	"请求参数"
//	@Success		200				{object}	grade_rule.ExportGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/export [post]
func (f *GradeRuleService) Export(c *gin.Context) {
	req := form_validator.Valid[grade_rule.ExportGradeRuleReq](c)
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
	fileName := fmt.Sprintf("grade_rule_%s.xlsx", dateStr)
	sheetName := "Sheet1"

	headers := []string{"探查分级的识别规则名称", "表内识别出字段", "字段数据分级", "启用状态"}
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
		status := "已停用"
		if data.Status == 1 {
			status = "已启用"
		}
		values := []interface{}{data.RuleName, data.LogicalExpression, data.ClassificationGrade, status}
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

// Statistics 统计分级规则
//
//	@Description	统计分级规则
//	@Tags			分级规则
//	@Summary		统计分级规则
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Success		200				{object}	grade_rule.StatisticsGradeRuleResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/statistics [get]
func (f *GradeRuleService) Statistics(c *gin.Context) {
	req := form_validator.Valid[grade_rule.StatisticsGradeRuleReq](c)
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

// BindGroup 调整规则分组
//
//	@Description	调整规则分组
//	@Tags			分级规则
//	@Summary		调整分组
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			body			body		grade_rule.BindGradeRuleGroupReq	true	"请求参数"
//	@Success		200				{object}	grade_rule.BindGradeRuleGroupResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/group/bind [put]
func (f *GradeRuleService) BindGroup(c *gin.Context) {
	req := form_validator.Valid[grade_rule.BindGradeRuleGroupReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.BindGroup)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// BatchDelete 批量删除规则
//
//	@Description	批量删除规则
//	@Tags			分级规则
//	@Summary		批量删除
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			body			body		grade_rule.BatchDeleteReq	true	"请求参数"
//	@Success		200				{object}	grade_rule.BatchDeleteResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/grade-rule/delete/batch [post]
func (f *GradeRuleService) BatchDelete(c *gin.Context) {
	req := form_validator.Valid[grade_rule.BatchDeleteReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.BatchDelete)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
