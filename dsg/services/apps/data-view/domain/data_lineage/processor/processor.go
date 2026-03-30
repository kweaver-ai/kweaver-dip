package processor

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-common/database_callback/data_lineage"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	datasourceRpoo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	scene_analysis "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/scene_analysis"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"encoding/json"
	"fmt"
	"github.com/jinzhu/copier"
	"github.com/samber/lo"
	"gorm.io/gorm"
	"sync"
)

type FormViewInfoFetcher struct {
	formViewRepo   form_view.FormViewRepo
	db             *gorm.DB
	userRepo       user.UserRepo
	datasourceRepo datasourceRpoo.DatasourceRepo
	cc             configuration_center.Driven
	sa             scene_analysis.SceneAnalysisDriven
	poolDict       map[string]*sync.Pool
}

func NewFormViewInfoFetcher(c configuration_center.Driven,
	formViewRepo form_view.FormViewRepo,
	db *gorm.DB,
	userRepo user.UserRepo,
	datasourceRepo datasourceRpoo.DatasourceRepo,
	sa scene_analysis.SceneAnalysisDriven,
) *FormViewInfoFetcher {
	return &FormViewInfoFetcher{
		formViewRepo:   formViewRepo,
		db:             db,
		userRepo:       userRepo,
		datasourceRepo: datasourceRepo,
		cc:             c,
		sa:             sa,
		poolDict:       make(map[string]*sync.Pool),
	}
}

func (f FormViewInfoFetcher) HandlerCallback(ctx context.Context, value callback.DataModel, tableName, opt string) (any, error) {
	if tableName == (new(model.FormView)).TableName() {
		data, err := f.handlerFormView(ctx, value, opt)
		if err != nil {
			return nil, err
		}
		return callback.DataLineageContent{
			Type:      opt,
			ClassName: callback.LineageEntityTypeTable,
			Entities:  []any{data},
		}, nil
	}
	if tableName == (new(model.FormViewField)).TableName() {
		data, err := f.handlerFormViewField(ctx, value, opt)
		if err != nil {
			return nil, err
		}
		return callback.DataLineageContent{
			Type:      opt,
			ClassName: callback.LineageEntityTypeField,
			Entities:  []any{data},
		}, nil
	}
	return nil, fmt.Errorf("%v: invalid callback model: %v", opt, string(lo.T2(json.Marshal(value)).A))
}

///////////////////////////////下面是具体的工具方法

func (f FormViewInfoFetcher) getTableInfo(ctx context.Context, id string) (*data_lineage.TableInfo, error) {
	viewInfo, err := f.formViewRepo.GetExistedViewByID(ctx, id)
	if err != nil {
		log.Errorf("query table %v info error", id)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	tableInfo := new(data_lineage.TableInfo)
	copier.Copy(&tableInfo, &viewInfo)
	tableInfo.CreatedAt = viewInfo.CreatedAt.Format(data_lineage.DataLineageTimeFormat)
	tableInfo.UpdatedAt = viewInfo.UpdatedAt.Format(data_lineage.DataLineageTimeFormat)
	tableInfo.SceneID = viewInfo.SceneAnalysisId
	return tableInfo, nil
}

func (f FormViewInfoFetcher) getDepartmentInfo(ctx context.Context, id string) (*data_lineage.DepartmentInfo, error) {
	result, err := f.cc.GetDepartmentPrecision(ctx, []string{id})
	if err != nil {
		log.Errorf("query department info %v error %v", id, err.Error())
		return nil, err
	}
	if len(result.Departments) <= 0 {
		err := fmt.Errorf("empty department info %v", id)
		log.Errorf("empty department info %v", id)
		return nil, err
	}
	departmentInfo := new(data_lineage.DepartmentInfo)
	copier.Copy(&departmentInfo, &result.Departments[0])
	return departmentInfo, nil
}

func (f FormViewInfoFetcher) getInfoSystem(ctx context.Context, id string) (*data_lineage.InfoSystemInfo, error) {
	infoSystems, err := f.cc.GetInfoSystemsPrecision(ctx, []string{id},nil)
	if err != nil {
		log.Errorf("query infosystem info %v error %v", id, err.Error())
		return nil, err
	}
	if len(infoSystems) <= 0 {
		err := fmt.Errorf("empty infosystem info %v", id)
		log.Errorf("empty infosystem info %v", id)
		return nil, err
	}
	infoSystem := new(data_lineage.InfoSystemInfo)
	copier.Copy(&infoSystem, &infoSystems[0])
	return infoSystem, nil

}

func (f FormViewInfoFetcher) getUserInfo(ctx context.Context, id string) (*data_lineage.UserInfo, error) {
	userInfo, err := f.userRepo.GetByUserId(ctx, id)
	if err != nil {
		log.Errorf("query user info %v error %v", id, err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	info := new(data_lineage.UserInfo)
	copier.Copy(&info, &userInfo)
	return info, nil
}

func (f FormViewInfoFetcher) getDatasourceInfo(ctx context.Context, id string) (*data_lineage.DataSource, error) {
	datasourceInfo, err := f.datasourceRepo.GetById(ctx, id)
	if err != nil {
		log.Errorf("query datasource info %v error %v", id, err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	datasource := new(data_lineage.DataSource)
	copier.Copy(&datasource, &datasourceInfo)
	return datasource, nil
}
