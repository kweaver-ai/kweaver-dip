package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
)

type updateCollectingModel struct {
	UpdateReq *domain.UpdateReq
	CommonModel
}

// newUpdateCollectingModel 更新模型, 该操作只会发生在待发布阶段或之前
func (u *useCase) newUpdateCollectingModel(ctx context.Context, req *domain.UpdateReq) (*updateCollectingModel, error) {
	//查询来源表字段信息
	sourceTableInfo, err := u.queryCatalogSourceFields(ctx, req.SourceCatalogID.Uint64())
	if err != nil {
		return nil, err
	}
	//赋值下视图的信息
	req.SourceTableID = sourceTableInfo.ID
	req.SourceDataSourceUUID = sourceTableInfo.DatasourceId
	req.SourceTableName = sourceTableInfo.TechnicalName
	req.SourceDepartmentID = sourceTableInfo.DepartmentID

	//组成数据库更新对象
	oldPushModel, err := u.repo.Get(ctx, req.ID.Uint64())
	if err != nil {
		return nil, err
	}
	//审核中的无法编辑
	if oldPushModel.AuditState == constant.AuditStatusAuditing {
		return nil, errorcode.Desc(errorcode.DataSyncAuditingExecuteError)
	}
	dataPush := req.GenDataPushModel(ctx, oldPushModel)
	commonModel, err := u.NewCommonModel(ctx, dataPush)
	if err != nil {
		return nil, err
	}
	//组装参数
	localModel := &updateCollectingModel{
		UpdateReq:   req,
		CommonModel: *commonModel,
	}
	//得到目标字段数组
	localModel.TargetFieldsInfo = req.GenDataPushModelFields()
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
