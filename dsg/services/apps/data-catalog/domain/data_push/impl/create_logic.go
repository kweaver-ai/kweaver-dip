package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"

	_ "embed"
)

type CreateCollectingModel struct {
	ModelReq *domain.CreateReq
	CommonModel
}

func (u *useCase) newCreateCollectingModel(ctx context.Context, req *domain.CreateReq) (*CreateCollectingModel, error) {
	//查询来源表信息
	sourceTableInfo, err := u.queryCatalogSourceFields(ctx, req.SourceCatalogID.Uint64())
	if err != nil {
		return nil, err
	}
	req.SourceTableID = sourceTableInfo.ID
	req.SourceDataSourceID = sourceTableInfo.DatasourceId
	req.SourceTableName = sourceTableInfo.TechnicalName
	req.SourceDepartmentID = sourceTableInfo.DepartmentID

	dataPush := req.GenDataPushModel(ctx)
	commonModel, err := u.NewCommonModel(ctx, dataPush)
	if err != nil {
		return nil, err
	}
	//组装参数
	localModel := &CreateCollectingModel{
		ModelReq:    req,
		CommonModel: *commonModel,
	}
	//得到目标字段数组
	localModel.TargetFieldsInfo = req.GenDataPushModelFields(dataPush.ID)
	localModel.SortFields()
	//检查目标字段是否包含主键
	if err = localModel.CommonModel.CheckPrimaryKey(); err != nil {
		return nil, err
	}
	//建表，插入表SQL
	if err = u.genSQL(ctx, &localModel.CommonModel, sourceTableInfo); err != nil {
		return nil, err
	}
	return localModel, nil
}
