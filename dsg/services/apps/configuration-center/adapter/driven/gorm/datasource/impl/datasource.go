package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"go.uber.org/zap"
	"gorm.io/gen/field"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type dataSourceRepo struct {
	q *query.Query
}

func NewDataSourceRepo(db *gorm.DB) datasource.Repo {
	return &dataSourceRepo{q: common.GetQuery(db)}
}
func (d *dataSourceRepo) ListByPagingDiscard(ctx context.Context, pageInfo *request.PageInfo, keyword, infoSystemId string, types []string) ([]*model.Datasource, int64, error) {
	dataSourceDo := d.q.Datasource
	do := dataSourceDo.WithContext(ctx)
	if infoSystemId != "" {
		do = do.Where(dataSourceDo.InfoSystemID.Eq(infoSystemId))
	}
	if len(keyword) > 0 {
		do = do.Where(dataSourceDo.Name.Like("%" + common.KeywordEscape(keyword) + "%")).
			Or(dataSourceDo.Schema.Like("%" + common.KeywordEscape(keyword) + "%"))
	}
	if len(types) != 0 {
		do = do.Where(dataSourceDo.TypeName.In(types...))
	}

	total, err := do.Count()
	if err != nil {
		log.WithContext(ctx).Error("failed to get datasources count from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if pageInfo.Limit > 0 {
		limit := pageInfo.Limit
		offset := limit * (pageInfo.Offset - 1)
		do = do.Limit(limit).Offset(offset)
	}

	//var orderField field.OrderExpr
	//if pageInfo.Sort == constant.SortByCreatedAt {
	//	orderField = dataSourceDo.CreatedAt
	//} else {
	//	orderField = dataSourceDo.UpdatedAt
	//}

	var orderCond field.Expr
	if pageInfo.Direction == "asc" {
		orderCond = dataSourceDo.DataSourceID
	} else {
		orderCond = dataSourceDo.DataSourceID.Desc()
	}

	do = do.Order(orderCond)

	models, err := do.Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to get datasources from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	return models, total, nil
}

func (d *dataSourceRepo) ListByPaging(ctx context.Context, pageInfo *request.PageInfo, keyword, infoSystemId string, sourceType int, types []string, huaAoID string, orgCodes []string) (res []*model.Datasource, total int64, err error) {
	do := d.q.Datasource.WithContext(ctx).UnderlyingDB().WithContext(ctx)

	// 过滤掉不需要的数据源类型 Anyshare 7.0(anyshare7)、听云(tingyun)、OpenSearch(opensearch)
	do = do.Where("`type_name` not in ?", []string{"anyshare7", "tingyun", "opensearch"})

	if infoSystemId != "" {
		do = do.Where("info_system_id=?", infoSystemId)
	}
	if sourceType != 0 {
		do = do.Where("source_type=?", sourceType)
	}
	if len(keyword) > 0 {
		tmp := "%" + common.KeywordEscape(keyword) + "%"
		do = do.Where(" name like ? or schema like ? or host like ? ", tmp, tmp, tmp)
	}
	if len(types) != 0 {
		do = do.Where("type_name in ?", types)
	}
	if huaAoID != "" {
		do = do.Where(&model.Datasource{HuaAoId: huaAoID})
	}
	if len(orgCodes) != 0 {
		do = do.Where("department_id in ?", orgCodes)
	}

	if err = do.Count(&total).Error; err != nil {
		return
	}
	if pageInfo.Sort == "name" {
		do = do.Order(fmt.Sprintf(" name  %s,id asc", pageInfo.Direction))
	} else {
		do = do.Order(fmt.Sprintf("%s %s,id asc", pageInfo.Sort, pageInfo.Direction))
	}

	do = do.Offset((pageInfo.Offset - 1) * pageInfo.Limit).Limit(pageInfo.Limit)

	err = do.Find(&res).Error
	return
}

func (d *dataSourceRepo) GetByID(ctx context.Context, id string) (*model.Datasource, error) {
	dataSourceDo := d.q.Datasource
	dataSource, err := dataSourceDo.WithContext(ctx).Where(dataSourceDo.ID.Eq(id)).Take()
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.DataSourceNotExist, err)
		}
		log.WithContext(ctx).Error("failed to get datasource from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return dataSource, nil
}
func (d *dataSourceRepo) GetByID2(ctx context.Context, id string) (*model.Datasource, error) {
	dataSourceDo := d.q.Datasource
	return dataSourceDo.WithContext(ctx).Where(dataSourceDo.ID.Eq(id)).Take()
}
func (d *dataSourceRepo) GetByIDs(ctx context.Context, ids []string) ([]*model.Datasource, error) {
	dataSourceDo := d.q.Datasource
	dataSources, err := dataSourceDo.WithContext(ctx).Where(dataSourceDo.ID.In(ids...)).Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to get datasource from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return dataSources, nil
}
func (d *dataSourceRepo) GetByInfoSystemID(ctx context.Context, infoSystemId string) ([]*model.Datasource, error) {
	dataSourceDo := d.q.Datasource
	dataSources, err := dataSourceDo.WithContext(ctx).Where(dataSourceDo.InfoSystemID.Eq(infoSystemId)).Find()
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.DataSourceNotExist, err)
		}
		log.WithContext(ctx).Error("failed to get datasource ByInfoSystemID  from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return dataSources, nil
}
func (d *dataSourceRepo) ClearInfoSystemID(ctx context.Context, infoSystemId string) error {
	dataSourceDo := d.q.Datasource
	info, err := dataSourceDo.WithContext(ctx).Where(dataSourceDo.InfoSystemID.Eq(infoSystemId)).Update(dataSourceDo.InfoSystemID, "")
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errorcode.Desc(errorcode.DataSourceNameExistInNoInfoSystem)
		}
		log.WithContext(ctx).Error("failed to ClearInfoSystemID datasource from db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if info.Error != nil {
		log.WithContext(ctx).Error("failed to Update datasource to db info.Error", zap.Error(info.Error))
		return errorcode.Detail(errorcode.PublicDatabaseError, info.Error.Error())
	}
	return nil
}
func (d *dataSourceRepo) Insert(ctx context.Context, dataSource *model.Datasource) error {
	if err := d.q.Datasource.WithContext(ctx).Create(dataSource); err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errorcode.Detail(errorcode.DataSourceNameExistInfoSystem, err.Error())
		}
		log.WithContext(ctx).Error("failed to Insert datasource to db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *dataSourceRepo) Update(ctx context.Context, dataSource *model.Datasource) error {
	do := d.q.Datasource
	info, err := do.WithContext(ctx).Where(do.ID.Eq(dataSource.ID)).Updates(dataSource)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errorcode.Detail(errorcode.DataSourceNameExistInfoSystem, err.Error())
		}
		log.WithContext(ctx).Error("failed to Update datasource to db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if info.Error != nil {
		log.WithContext(ctx).Error("failed to Update datasource to db info.Error", zap.Error(info.Error))
		return errorcode.Detail(errorcode.PublicDatabaseError, info.Error.Error())
	}
	return nil
}

func (d *dataSourceRepo) Delete(ctx context.Context, dataSource *model.Datasource) error {
	do := d.q.Datasource
	info, err := do.WithContext(ctx).Where(do.ID.Eq(dataSource.ID)).Delete(dataSource)
	if err != nil {
		log.WithContext(ctx).Error("failed to Delete datasource to db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if info.Error != nil {
		log.WithContext(ctx).Error("failed to Delete datasource to db info.Error", zap.Error(info.Error))
		return errorcode.Detail(errorcode.PublicDatabaseError, info.Error.Error())
	}
	return nil
}

func (d *dataSourceRepo) NameExistCheck(ctx context.Context, name string, sourceType int32, infoSystemID string, ids ...string) (bool, error) {
	dataSourceDo := d.q.Datasource
	do := dataSourceDo.WithContext(ctx)
	if len(ids) > 0 {
		do = do.Where(dataSourceDo.ID.NotIn(ids...))
	}
	var cnt int64
	do = do.Where(dataSourceDo.Name.Eq(name)).Where(dataSourceDo.SourceType.Eq(sourceType))
	if infoSystemID != "" {
		do = do.Where(dataSourceDo.InfoSystemID.Eq(infoSystemID))
	}
	cnt, err := do.Limit(1).Count()
	if err != nil {
		log.WithContext(ctx).Error("failed to NameExistCheck datasource count from db", zap.Error(err))
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return cnt > 0, nil
}

func (d *dataSourceRepo) GetDataSourceSystemInfos(ctx context.Context, ids []int) ([]*response.GetDataSourceSystemInfosRes, error) {
	res := make([]*response.GetDataSourceSystemInfosRes, 0)
	do := d.q.Datasource.WithContext(ctx).UnderlyingDB().WithContext(ctx)
	err := do.Table("datasource d").
		Select("d.data_source_id , o.id info_system_id,  o.name info_system_name").
		Where("d.data_source_id in ?", ids).
		Joins("join info_system o on d.info_system_id=o.id").Find(&res).Error
	return res, err
}

func (d *dataSourceRepo) GetAll(ctx context.Context) ([]*model.Datasource, error) {
	res := make([]*model.Datasource, 0)
	do := d.q.Datasource.WithContext(ctx).UnderlyingDB().WithContext(ctx)
	err := do.Find(&res).Error
	return res, err
}
