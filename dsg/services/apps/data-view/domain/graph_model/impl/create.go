package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/samber/lo"
)

// createMetaModel 创建元模型
func (u *useCase) createMetaModel(ctx context.Context, req *domain.CreateModelReq) (*response.IDResp, error) {
	//通过目录查询挂载的资源
	formViewID, tableFields, err := u.queryCatalogMountedTableFields(ctx, req.CatalogID.Uint64())
	if err != nil {
		return nil, err
	}
	req.DataViewID = formViewID
	//检查字段
	tableViewDict := lo.SliceToMap(tableFields, func(item *model.TModelField) (string, *model.TModelField) {
		return item.FieldID, item
	})
	hasPrimaryKey := false
	for i := range req.Fields {
		tableField, ok := tableViewDict[req.Fields[i].FieldID]
		if !ok {
			return nil, errorcode.GraphModelFieldError.Err()
		}
		//对比逻辑
		if err = compareModelField(req.Fields[i], tableField); err != nil {
			return nil, err
		}
		if req.Fields[i].PrimaryKey {
			hasPrimaryKey = true
		}
		req.Fields[i].TechnicalName = tableField.TechnicalName
		req.Fields[i].DataType = tableField.DataType
		req.Fields[i].DataLength = tableField.DataLength
		req.Fields[i].DataAccuracy = tableField.DataAccuracy
		req.Fields[i].IsNullable = tableField.IsNullable
		req.Fields[i].Comment = tableField.Comment
	}
	if !hasPrimaryKey {
		return nil, errorcode.GraphModelModeMissingPrimaryKeyError.Err()
	}
	//检查技术名称是否重复
	if err = u.repo.ExistsTechnicalName(ctx, "", req.TechnicalName); err != nil {
		return nil, err
	}
	//检查业务名称是否重复
	if err = u.repo.ExistsBusinessName(ctx, "", req.BusinessName); err != nil {
		return nil, err
	}
	//校验subject信息
	subjectInfo, err := u.service.DataSubject.GetDataSubjectByID(ctx, []string{req.SubjectID})
	if err != nil {
		return nil, errorcode.PublicQueryDataSubjectError.Err()
	}
	if len(subjectInfo.Objects) <= 0 {
		return nil, errorcode.GraphModelSubjectNotExistError.Err()
	}
	//插入
	obj := req.MetaModel(ctx)
	if err = u.repo.CreateModel(ctx, obj, req.Fields); err != nil {
		return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
	}
	return response.ID(obj.ID), nil
}

func (u *useCase) createCompositeModel(ctx context.Context, req *domain.CreateModelReq) (*response.IDResp, error) {
	//检查名称是否重复, 业务名称
	if err := u.repo.ExistsBusinessName(ctx, "", req.BusinessName); err != nil {
		return nil, err
	}
	//校验subject信息
	subjectInfo, err := u.service.DataSubject.GetDataSubjectByID(ctx, []string{req.SubjectID})
	if err != nil {
		return nil, errorcode.PublicQueryDataSubjectError.Err()
	}
	if len(subjectInfo.Objects) <= 0 {
		return nil, errorcode.GraphModelSubjectNotExistError.Err()
	}
	//插入
	obj := req.CompositeModel(ctx)
	if err = u.repo.CreateModel(ctx, obj, nil); err != nil {
		return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
	}
	return response.ID(obj.ID), nil
}
