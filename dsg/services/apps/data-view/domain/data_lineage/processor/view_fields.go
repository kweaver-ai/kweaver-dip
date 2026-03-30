package processor

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-common/database_callback/data_lineage"
	"github.com/kweaver-ai/idrm-go-common/util"
	local_util "github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"encoding/json"
	"fmt"
	"github.com/samber/lo"
	"strings"
)

type FieldStruct struct {
	Field   *model.FormViewField
	SceneID string
}

func (f FormViewInfoFetcher) handlerFormViewField(ctx context.Context, value callback.DataModel, opt string) (any, error) {
	formViewField, err := f.queryBaseViewField(ctx, value)
	if err != nil {
		return nil, fmt.Errorf("invalid callback formViewField model %v", string(lo.T2(json.Marshal(value)).A))
	}

	if opt == data_lineage.ChangeOptionCreate {
		table, err := f.deleteFormViewBase(ctx, formViewField.FormViewID)
		if err != nil {
			return nil, err
		}
		fieldInfo, err := f.formFieldBase(ctx, formViewField)
		if err != nil {
			return nil, err
		}
		fieldInfo.ColumnUniqueIDS, fieldInfo.ExpressionName = f.genColumnUniqueID(table, formViewField)
		return fieldInfo, nil
	}
	if opt == data_lineage.ChangeOptionUpdate {
		table, err := f.deleteFormViewBase(ctx, formViewField.FormViewID)
		if err != nil {
			return nil, err
		}
		fieldInfo := data_lineage.LineageField{
			UUID:          formViewField.ID,
			UniqueID:      formViewField.ID,
			BusinessName:  formViewField.BusinessName,
			TechnicalName: formViewField.TechnicalName,
			DataType:      formViewField.DataType,
			PrimaryKey:    local_util.BoolToInt8(formViewField.PrimaryKey.Bool),
			TableUniqueID: table.UniqueID,
			UpdatedAt:     table.UpdatedAt,
			CreatedAt:     table.CreatedAt,
		}
		fieldInfo.ColumnUniqueIDS, fieldInfo.ExpressionName = f.genColumnUniqueID(table, formViewField)
		return fieldInfo, nil
	}
	if opt == data_lineage.ChangeOptionDelete {
		table, err := f.deleteFormViewBase(ctx, formViewField.FormViewID)
		if err != nil {
			return nil, err
		}
		fieldInfo := &data_lineage.LineageField{
			UUID:          formViewField.ID,
			UniqueID:      formViewField.ID,
			BusinessName:  formViewField.BusinessName,
			TechnicalName: formViewField.TechnicalName,
			TableUniqueID: table.UniqueID,
			UpdatedAt:     table.UpdatedAt,
			CreatedAt:     table.CreatedAt,
		}
		fieldInfo.ColumnUniqueIDS, fieldInfo.ExpressionName = f.genColumnUniqueID(table, formViewField)
		return fieldInfo, nil
	}
	return nil, fmt.Errorf("option %v, invalid callback formViewField model %v", opt, string(lo.T2(json.Marshal(value)).A))
}

func (f FormViewInfoFetcher) queryBaseViewField(ctx context.Context, data callback.DataModel) (*model.FormViewField, error) {
	id, ok := data[new(model.FormViewField).UniqueKey()]
	if !ok {
		return nil, fmt.Errorf("invalid DataModel %v", callback.PrintModel(data))
	}
	return callback.QueryFromRaw[*model.FormViewField](ctx, f.db, fmt.Sprintf("%v", id))
}

// formFieldBase 视图字段信息的基本方法
func (f FormViewInfoFetcher) formFieldBase(ctx context.Context, d *model.FormViewField) (*data_lineage.LineageField, error) {
	viewInfo, err := f.getTableInfo(ctx, d.FormViewID)
	if err != nil {
		return nil, err
	}
	return &data_lineage.LineageField{
		UUID:           d.ID,
		UniqueID:       d.ID,
		BusinessName:   d.BusinessName,
		TechnicalName:  d.TechnicalName,
		DataType:       d.DataType,
		PrimaryKey:     local_util.BoolToInt8(d.PrimaryKey.Bool),
		TableUniqueID:  d.FormViewID,
		ExpressionName: "",
		CreatedAt:      viewInfo.CreatedAt,
		UpdatedAt:      viewInfo.UpdatedAt,
	}, nil
}

func (f FormViewInfoFetcher) genColumnUniqueID(table *data_lineage.LineageTable, formViewField *model.FormViewField) (string, string) {
	if table.CatalogName != "" {
		return util.MD5(fmt.Sprintf("%s%s%s%s", strings.ToLower(table.CatalogName), strings.ToLower(table.DatabaseName),
			strings.ToLower(table.TechnicalName), strings.ToLower(formViewField.TechnicalName))), ""
	}
	if table.SceneID != "" {
		refFieldDict, err := f.QueryViewSourceFields(context.Background(), table.SceneID)
		if err != nil {
			log.Errorf("QueryViewSourceFields error %v", err.Error())
		}
		ex, ok := refFieldDict[formViewField.ID]
		if ok {
			return strings.Join(ex.Ref, ","), strings.Join(ex.Expr, ",")
		}
	}
	return "", ""
}
