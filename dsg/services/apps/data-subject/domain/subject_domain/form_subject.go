package subject_domain

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"

	bg "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/business-grooming"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	proErrorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

// GetFormAndFieldInfo 去业务治理获取业务表信息和字段信息
func GetFormAndFieldInfo(ctx context.Context, formID string, fieldIDSlice []string, ccDriven configuration_center.Driven) (*FormAndFieldInfo, error) {
	req := bg.FormAndFieldInfoReq{
		FormID:         formID,
		SubjectIDSlice: fieldIDSlice,
	}
	if len(fieldIDSlice) <= 0 {
		req.SubjectIDSlice = nil
	}
	resp, err := bg.GetRemoteBusinessModelInfo(ctx, req)
	if err != nil {
		return nil, errorcode.Desc(proErrorcode.FormAndFieldInfoQueryError)
	}
	return &FormAndFieldInfo{
		FormAndFieldInfoResp: bg.FormAndFieldInfoResp{
			FormInfo:           resp.FormInfo,
			FormFieldInfoSlice: resp.FormFieldInfoSlice,
		},
		ccDriven: ccDriven,
	}, nil
}

// GetFormSubjects  查询业务表关联的业务对象/业务活动的信息，同时返回关联的业务对象/业务活动被其他业务表引用的信息
func (c *SubjectDomainUsecase) GetFormSubjects(ctx context.Context, req *GetFormSubjectsReqParam) (*GetFormFiledRelevanceObjectRes, error) {
	res := &GetFormFiledRelevanceObjectRes{
		FormID:       req.FID,
		SubjectInfos: make([]FormSubjectDetail, 0),
	}
	businessObjects, err := c.formRelationRepo.Get(ctx, req.FID)
	if err != nil {
		log.Error("查询业务表关联业务对象错误", zap.Error(err), zap.String("form_id", req.FID))
		return res, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(businessObjects) <= 0 {
		return res, nil
	}

	//得到字段ID
	fieldIDSlice := make([]string, 0)
	standardIDSlice := make([]uint64, 0)
	for i := range businessObjects {
		if businessObjects[i].Type == constant.Attribute && businessObjects[i].RelatedFieldID != "" {
			fieldIDSlice = append(fieldIDSlice, businessObjects[i].RelatedFieldID)
		}
		if businessObjects[i].StandardID > 0 {
			standardIDSlice = append(standardIDSlice, businessObjects[i].StandardID)
		}
	}
	//查询标准信息
	standardInfoSlice, err := c.standard.GetStandardByIdSlice(ctx, standardIDSlice...)
	if err != nil {
		return res, errorcode.Desc(errorcode.PublicDatabaseError, err.Error())
	}
	//查询业务表信息和字段信息
	detail := NewFormAndFieldInfo(c.standard, c.ccDriven, req.FID)
	if len(fieldIDSlice) > 0 {
		detail, err = GetFormAndFieldInfo(ctx, req.FID, fieldIDSlice, c.ccDriven)
		if err != nil {
			log.Error("查询业务表和业务字段信息错误", zap.Error(err), zap.ByteString("req", lo.T2(json.Marshal(fieldIDSlice)).A))
			return res, err
		}
	}
	//分组返回
	grouper := detail.NewAttributeGrouper(standardInfoSlice)
	return grouper.Group(ctx, businessObjects), nil
}

// UpdatesFormSubjects 更新业务表的关联的业务对象的关系
func (c *SubjectDomainUsecase) UpdatesFormSubjects(ctx context.Context, req *UpdateFormSubjectsReqParam) error {
	//校验业务表字段信息
	checker, err := c.NewRelationChecker(ctx, req.FormID, req.FormRelevanceObjects)
	if err != nil {
		return err
	}
	if err := checker.Check(ctx); err != nil {
		return err
	}
	//开始插入
	relations := checker.Relations()
	if err := c.formRelationRepo.Update(ctx, req.FormID, relations); err != nil {
		log.Errorf(err.Error())
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// RemoveFormSubjects 删除业务表的关联的业务对象的关系
func (c *SubjectDomainUsecase) RemoveFormSubjects(ctx context.Context, formIDSlice []string) error {
	//删除业务表和字段的关系
	if err := c.formRelationRepo.Remove(ctx, formIDSlice...); err != nil {
		log.Errorf(err.Error())
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}
