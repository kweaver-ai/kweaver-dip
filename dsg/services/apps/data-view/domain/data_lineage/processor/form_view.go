package processor

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-common/database_callback/data_lineage"
	"github.com/samber/lo"
)

func (f FormViewInfoFetcher) handlerFormView(ctx context.Context, value callback.DataModel, opt string) (any, error) {
	formView, err := f.queryViewFromDB(ctx, value)
	if err != nil {
		return nil, fmt.Errorf("invalid callback model %v", string(lo.T2(json.Marshal(value)).A))
	}
	if opt == data_lineage.ChangeOptionCreate {
		return f.formViewBase(ctx, formView)
	}
	if opt == data_lineage.ChangeOptionUpdate {
		formViewInfo, err := f.getTableInfo(ctx, formView.ID)
		if err != nil {
			return nil, err
		}
		//补充下datasource
		formView.DatasourceID = formViewInfo.DatasourceID
		table, err0 := f.formViewBase(ctx, formView)
		if err0 != nil {
			return nil, err0
		}
		return table, nil
	}
	if opt == data_lineage.ChangeOptionDelete {
		return f.deleteFormViewBase(ctx, formView.ID)
	}
	return nil, fmt.Errorf("option %v, invalid callback model %v", opt, string(lo.T2(json.Marshal(value)).A))
}

func (f FormViewInfoFetcher) queryViewFromDB(ctx context.Context, data callback.DataModel) (*model.FormView, error) {
	id, ok := data[new(model.FormView).UniqueKey()]
	if !ok {
		return nil, fmt.Errorf("invalid DataModel %v", callback.PrintModel(data))
	}
	return callback.QueryFromRaw[*model.FormView](ctx, f.db, fmt.Sprintf("%v", id))
}

func (f FormViewInfoFetcher) formViewBase(ctx context.Context, d *model.FormView) (*data_lineage.LineageTable, error) {
	table := &data_lineage.LineageTable{
		UUID:          d.ID,
		UniqueID:      d.ID,
		BusinessName:  d.BusinessName,
		TechnicalName: d.TechnicalName,
		Comment:       d.Description.String,
		TableType:     nodeType(d.Type),
		CreatedAt:     d.CreatedAt.Format(data_lineage.DataLineageTimeFormat),
		UpdatedAt:     d.UpdatedAt.Format(data_lineage.DataLineageTimeFormat),
		DatasourceID:  d.DatasourceID,
		OwnerId:       d.OwnerId.String,
		DepartmentID:  d.DepartmentId.String,
	}
	//补充部门信息
	if d.DepartmentId.String != "" {
		departmentInfo, err := f.getDepartmentInfo(ctx, d.DepartmentId.String)
		if err == nil {
			table.DepartmentName = departmentInfo.Name
		}
	}
	//补充owner信息
	if d.OwnerId.String != "" {
		userInfo, err := f.getUserInfo(ctx, d.OwnerId.String)
		if err == nil {
			table.OwnerName = userInfo.Name
		}
	}
	//补充信息系统名称
	if table.InfoSystemID != "" {
		infoSystem, err := f.getInfoSystem(ctx, table.InfoSystemID)
		if err == nil {
			table.InfoSystemName = infoSystem.Name
		}
	}
	//补充datasource info
	if d.DatasourceID != "" {
		dataSourceInfo, _ := f.getDatasourceInfo(ctx, d.DatasourceID)
		if dataSourceInfo != nil {
			table.DatasourceName = dataSourceInfo.Name
			table.DatabaseName = dataSourceInfo.Schema
			table.CatalogName = dataSourceInfo.CatalogName
			table.CatalogType = dataSourceInfo.TypeName
			table.CatalogAddr = fmt.Sprintf(`%v@%v:%v`, dataSourceInfo.Username, dataSourceInfo.Host, dataSourceInfo.Port)
		}
	}
	return table, nil
}

func (f FormViewInfoFetcher) deleteFormViewBase(ctx context.Context, id string) (*data_lineage.LineageTable, error) {
	formViewInfo, err := f.getTableInfo(ctx, id)
	if err != nil {
		return nil, err
	}
	table := &data_lineage.LineageTable{
		UUID:          formViewInfo.ID,
		UniqueID:      formViewInfo.ID,
		TableType:     nodeType(formViewInfo.Type),
		BusinessName:  formViewInfo.BusinessName,
		TechnicalName: formViewInfo.TechnicalName,
		DatasourceID:  formViewInfo.DatasourceID,
		SceneID:       formViewInfo.SceneID,
		CreatedAt:     formViewInfo.CreatedAt,
		UpdatedAt:     formViewInfo.UpdatedAt,
	}
	//补充datasource info
	if formViewInfo.DatasourceID != "" {
		dataSourceInfo, _ := f.getDatasourceInfo(ctx, formViewInfo.DatasourceID)
		if dataSourceInfo != nil {
			table.DatabaseName = dataSourceInfo.Schema
			table.CatalogName = dataSourceInfo.CatalogName
			table.DataViewSource = dataSourceInfo.DataViewSource
		}
	}
	return table, nil
}

func nodeType(vType int32) string {
	switch vType {
	case constant.FormViewTypeDatasource.Integer.Int32():
		return data_lineage.LineageNodeTypeFormView.String
	case constant.FormViewTypeCustom.Integer.Int32():
		return data_lineage.LineageNodeTypeCustomView.String
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		return data_lineage.LineageNodeTypeLogicView.String
	}
	return "unknown"
}
