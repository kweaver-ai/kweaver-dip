package v1

import (
	"fmt"
	"regexp"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_privacy_policy"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	// my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/gin-gonic/gin"
)

type DataPrivacyPolicyService struct {
	uc data_privacy_policy.DataPrivacyPolicyUseCase
}

func NewDataPrivacyPolicyService(uc data_privacy_policy.DataPrivacyPolicyUseCase) *DataPrivacyPolicyService {
	return &DataPrivacyPolicyService{uc: uc}
}

// PageList 获取数据隐私策略列表
//
//	@Description	获取数据隐私策略列表
//	@Tags			数据隐私策略
//	@Summary		获取数据隐私策略列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			query			query		data_privacy_policy.PageListDataPrivacyPolicyReq	true	"查询参数"
//	@Success		200				{object}	data_privacy_policy.PageListDataPrivacyPolicyResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/data-privacy-policy [get]
func (f *DataPrivacyPolicyService) PageList(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.PageListDataPrivacyPolicyReq](c)
	if req == nil {
		return
	}

	if req.DatasourceId != "" {
		regexPattern := regexp.MustCompile(constant.UUIDRegexString)
		if !regexPattern.MatchString(req.DatasourceId) {
			ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"datasource_id": "must be uuid"}))
			return
		}
	}
	resp, err := util.TraceA1R2(c, req, f.uc.PageList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Create 创建数据隐私策略
//
//	@Description	创建数据隐私策略
//	@Tags			数据隐私策略
//	@Summary		创建数据隐私策略
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			body			body		data_privacy_policy.CreateDataPrivacyPolicyReq	true	"请求参数"
//	@Success		200				{object}	data_privacy_policy.CreateDataPrivacyPolicyResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/data-privacy-policy [post]
func (f *DataPrivacyPolicyService) Create(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.CreateDataPrivacyPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.Create)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	log.Info(fmt.Sprintf("req.FieldList : %s", req.FieldList))
	// If there are fields to process, create them in batch
	if len(req.FieldList) > 0 {
		log.Info(fmt.Sprintf("req.FieldList : %s", req.FieldList))
		fieldIDs := make([]string, 0, len(req.FieldList))
		ruleIDs := make([]string, 0, len(req.FieldList))

		for _, field := range req.FieldList {
			fieldIDs = append(fieldIDs, field.FormViewFieldID)
			ruleIDs = append(ruleIDs, field.DesensitizationRuleID)
		}
		log.Info(fmt.Sprintf("req.fieldIDs : %s", fieldIDs))
		log.Info(fmt.Sprintf("req.ruleIDs : %s", ruleIDs))
		fieldBatchReq := &data_privacy_policy.CreateDataPrivacyPolicyFieldBatchReq{
			CreateDataPrivacyPolicyFieldBatchReqBody: data_privacy_policy.CreateDataPrivacyPolicyFieldBatchReqBody{
				DataPrivacyPolicyID:    res.ID,
				FormViewFieldIDs:       fieldIDs,
				DesensitizationRuleIDs: ruleIDs,
			},
		}
		log.Info(fmt.Sprintf("fieldBatchReq : %s", fieldBatchReq))
		_, err = f.uc.CreateFieldBatch(c, fieldBatchReq)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
	}

	ginx.ResOKJson(c, res)
}

// Update 更新数据隐私策略
//
//	@Description	更新数据隐私策略
//	@Tags			数据隐私策略
//	@Summary		更新数据隐私策略
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			id				path		string					                true	"数据隐私策略ID"
//	@Param			body			body		data_privacy_policy.UpdateDataPrivacyPolicyReq	true	"请求参数"
//	@Success		200				{object}	data_privacy_policy.UpdateDataPrivacyPolicyResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/data-privacy-policy/{id} [put]
func (f *DataPrivacyPolicyService) Update(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.UpdateDataPrivacyPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.Update)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	log.Info(fmt.Sprintf("req.FieldList : %s", req.FieldList))
	// If there are fields to process, create them in batch
	if len(req.FieldList) > 0 {
		fieldIDs := make([]string, 0, len(req.FieldList))
		ruleIDs := make([]string, 0, len(req.FieldList))

		for _, field := range req.FieldList {
			fieldIDs = append(fieldIDs, field.FormViewFieldID)
			ruleIDs = append(ruleIDs, field.DesensitizationRuleID)
		}
		log.Info(fmt.Sprintf("req.fieldIDs : %s", fieldIDs))
		log.Info(fmt.Sprintf("req.ruleIDs : %s", ruleIDs))
		fieldBatchReq := &data_privacy_policy.CreateDataPrivacyPolicyFieldBatchReq{
			CreateDataPrivacyPolicyFieldBatchReqBody: data_privacy_policy.CreateDataPrivacyPolicyFieldBatchReqBody{
				DataPrivacyPolicyID:    res.ID,
				FormViewFieldIDs:       fieldIDs,
				DesensitizationRuleIDs: ruleIDs,
			},
		}
		log.Info(fmt.Sprintf("fieldBatchReq : %s", fieldBatchReq))
		_, err = f.uc.CreateFieldBatch(c, fieldBatchReq)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
	}

	ginx.ResOKJson(c, res)
}

// GetDetailById 获取数据隐私策略详情
//
//	@Description	获取数据隐私策略详情
//	@Tags			数据隐私策略
//	@Summary		获取数据隐私策略详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"数据隐私策略ID"
//	@Success		200				{object}	data_privacy_policy.DataPrivacyPolicyDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/data-privacy-policy/{id} [get]
func (f *DataPrivacyPolicyService) GetDetailById(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.GetDetailByIdReq](c)
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

// GetDetailByFormViewId 获取数据隐私策略详情
//
//	@Description	获取数据隐私策略详情
//	@Tags			数据隐私策略
//	@Summary		获取数据隐私策略详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"表单视图ID"
//	@Success		200				{object}	data_privacy_policy.DataPrivacyPolicyDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/data-privacy-policy/{id}/by-form-view [get]
func (f *DataPrivacyPolicyService) GetDetailByFormViewId(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.GetDetailByFormViewIdReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, req, f.uc.GetDetailByFormViewId)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除数据隐私策略
//
//	@Description	删除数据隐私策略
//	@Tags			数据隐私策略
//	@Summary		删除数据隐私策略
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                true	"token"
//	@Param			id				path		string					                true	"数据隐私策略ID"
//	@Success		200				{object}	data_privacy_policy.DeleteDataPrivacyPolicyResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                "失败响应参数"
//	@Router			/data-privacy-policy/{id} [delete]
func (f *DataPrivacyPolicyService) Delete(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.DeleteDataPrivacyPolicyReq](c)
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

// IsExistByFormViewId 校验数据隐私策略字段是否存在
//
//	@Description	校验数据隐私策略字段是否存在
//	@Tags			数据隐私策略
//	@Summary		校验数据隐私策略字段是否存在
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                    true	"token"
//	@Param			id				path		string					                true	"数据隐私策略ID"
//	@Success		200				{object}	data_privacy_policy.IsExistByFormViewIdResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                    "失败响应参数"
//	@Router			/data-privacy-policy/{id}/is-exist [post]
func (f *DataPrivacyPolicyService) IsExistByFormViewId(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.IsExistByFormViewIdReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.IsExistByFormViewId)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetFormViewIdsByFormViewIds 获取数据隐私策略关联的视图ID列表
//
//	@Description	获取数据隐私策略关联的视图ID列表
//	@Tags			数据隐私策略
//	@Summary		获取数据隐私策略关联的视图ID列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                            true	"token"
//	@Param			id				path		string					                true	"数据隐私策略ID"
//	@Param			body			body		data_privacy_policy.GetFormViewIdsByFormViewIdsReq	true	"请求参数"
//	@Success		200				{object}	data_privacy_policy.GetFormViewIdsByFormViewIdsResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                            "失败响应参数"
//	@Router			/data-privacy-policy/{id}/form-view-ids [get]
func (f *DataPrivacyPolicyService) GetFormViewIdsByFormViewIds(c *gin.Context) {
	req := form_validator.Valid[data_privacy_policy.GetFormViewIdsByFormViewIdsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetFormViewIdsByFormViewIds)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetDesensitizationDataById 获取数据隐私策略脱敏数据
//
//	@Description	获取数据隐私策略脱敏数据
//	@Tags			数据隐私策略
//	@Summary		获取数据隐私策略脱敏数据
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					                        true	"token"
//	@Param			id				path		string					                true	"数据隐私策略ID"
//	@Success		200				{object}	data_privacy_policy.GetDesensitizationDataByIdResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			                        "失败响应参数"
//	@Router			/data-privacy-policy/{id}/desensitization-data [get]
func (f *DataPrivacyPolicyService) GetDesensitizationDataById(c *gin.Context) {
	log.Info("GetDesensitizationDataById is activated")
	req := form_validator.Valid[data_privacy_policy.GetDesensitizationDataByIdReq](c)
	if req == nil {
		return
	}
	log.Info(fmt.Sprintf("req: %+v", req))
	resp, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationDataById)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	log.Info(fmt.Sprintf("resp: %+v", resp))
	ginx.ResOKJson(c, resp)
}
