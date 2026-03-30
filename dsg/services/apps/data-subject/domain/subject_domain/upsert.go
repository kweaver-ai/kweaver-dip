package subject_domain

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/iter"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (c *SubjectDomainUsecase) CacheSubjectStandard(ctx context.Context, subjects []*model.SubjectDomain) error {
	standardIDSlice := iter.Gen(subjects, func(d *model.SubjectDomain) string {
		if d.StandardID > 0 {
			return fmt.Sprintf("%v", d.StandardID)
		}
		return ""
	})
	return c.CacheStandard(ctx, standardIDSlice...)
}

func (c *SubjectDomainUsecase) CacheStandard(ctx context.Context, sid ...string) error {
	if len(sid) <= 0 {
		return nil
	}
	standardInfoSlice, err := c.standardDriven.GetDataElementDetailByCode(ctx, sid...)
	if err != nil {
		log.Errorf("GetDataElementDetail error %v", err.Error())
		return err
	}
	standardModels := make([]*model.StandardInfo, 0, len(standardInfoSlice))
	for _, standardInfo := range standardInfoSlice {
		codeTable := ""
		if standardInfo.DictID != "" {
			codeTable = standardInfo.DictNameCN + ">><<" + standardInfo.DictID
		}
		var dataLength sql.NullInt32
		var dataAccuracy sql.NullInt32
		if standardInfo.DataTypeName == "数字型" || standardInfo.DataTypeName == "字符型" || standardInfo.DataTypeName == "二进制" {
			dataLength.Int32 = int32(standardInfo.DataLength)
			dataLength.Valid = true
		} else {
			dataLength.Int32 = 0
			dataLength.Valid = false
		}
		if standardInfo.DataPrecision != nil {
			dataAccuracy.Int32 = int32(*standardInfo.DataPrecision)
			dataAccuracy.Valid = true
		} else {
			dataAccuracy.Int32 = 0
			dataAccuracy.Valid = false
		}
		dataType := enum.Get[constant.DataType](standardInfo.DataType)
		standardID, _ := strconv.ParseUint(standardInfo.Code, 10, 64)
		if standardID <= 0 {
			log.Errorf("cache standard error %v", standardInfo.ID)
			continue
		}
		standard := &model.StandardInfo{
			ID:             standardID,
			Name:           standardInfo.NameCn,
			NameEn:         standardInfo.NameEn,
			DataType:       dataType.String,
			DataLength:     dataLength,
			DataAccuracy:   dataAccuracy,
			ValueRange:     standardInfo.DataRange,
			FormulateBasis: int32(standardInfo.StdType),
			CodeTable:      codeTable,
		}
		standardModels = append(standardModels, standard)
	}
	if len(standardModels) <= 0 {
		return nil
	}
	// 记录标准信息
	if err := c.standard.Upsert(ctx, standardModels); err != nil {
		log.WithContext(ctx).Errorf("upsert standardModels error:%v", err.Error())
		return err
	}
	return nil
}
