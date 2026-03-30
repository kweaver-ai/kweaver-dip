package impl

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system"
	datasourcemq "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/data_connection"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	business_structure_domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/datasource"
	user_domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type dataSourceUseCase struct {
	repo              datasource.Repo
	ve                virtualization_engine.DrivenVirtualizationEngine
	dc                data_connection.DrivenDataConnection
	mqHandle          datasourcemq.DataSourceHandle
	infoSystemRepo    info_system.Repo
	user              user_domain.UseCase
	departmentRepo    business_structure.Repo
	configurationRepo configuration.Repo
}

func NewDataSourceUseCase(repo datasource.Repo,
	ve virtualization_engine.DrivenVirtualizationEngine,
	dc data_connection.DrivenDataConnection,
	mqHandle datasourcemq.DataSourceHandle,
	infoSystemRepo info_system.Repo,
	user user_domain.UseCase,
	departmentRepo business_structure.Repo,
	configurationRepo configuration.Repo,
) domain.UseCase {
	return &dataSourceUseCase{
		repo:              repo,
		ve:                ve,
		dc:                dc,
		mqHandle:          mqHandle,
		infoSystemRepo:    infoSystemRepo,
		user:              user,
		departmentRepo:    departmentRepo,
		configurationRepo: configurationRepo,
	}
}

func (uc *dataSourceUseCase) CreateDataSource(ctx context.Context, req *domain.CreateDataSource) (*response.NameIDResp, error) {
	// 0 校验信息系统id，及清除非信息系统下信息系统id不为空情况
	sourceType := enum.ToInteger[constant.SourceType](req.SourceType).Int32()
	if req.SourceType == constant.Records.String && req.InfoSystemId != "" {
		if _, err := uc.infoSystemRepo.GetByID(ctx, req.InfoSystemId); err != nil {
			return nil, err
		}
	} else {
		req.InfoSystemId = ""
	}
	if req.Port == constant.ZkHiveDefaultPort {
		req.Port = constant.ZkHiveReplaceDefaultPort
	}
	if req.DepartmentId != "" {
		objectVo, _ := uc.departmentRepo.GetDepartmentByIdOrThirdId(ctx, req.DepartmentId)
		if objectVo != nil {
			req.DepartmentId = objectVo.ID
		}
	}
	// 检查虚拟化引擎是否支持数据库类型
	connectors, err := uc.ve.GetConnectors(ctx)
	if err != nil {
		return nil, err
	}

	// 支持的数据源类型的名称列表
	var connectorNames []string
	for _, c := range connectors.ConnectorNames {
		connectorNames = append(connectorNames, c.OLKConnectorName)
	}
	if !slices.Contains(connectorNames, req.Type) {
		return nil, errorcode.Desc(errorcode.PublicInvalidParameter, fmt.Sprintf("unsupported type %q, must be one of %s", req.Type, strings.Join(connectorNames, ",")))
	}

	connectorConfig, err := uc.ve.GetConnectorConfig(ctx, req.Type)
	if err != nil {
		return nil, err
	}

	//校验或者填充数据库模式Schema
	if !connectorConfig.SchemaExist {
		req.Schema = req.DatabaseName //没有数据库模式Schema的数据源类型dataSourceType  数据库模式Schema==数据库名称DatabaseName
	} else if req.Schema == "" {
		return nil, errorcode.Desc(errorcode.DataSourceTypeSchemaNotNull)
	}
	// xx数据局，schema 一律转为小写
	req.Schema, err = uc.DealWithSchema(ctx, req.Schema)
	if err != nil {
		return nil, err
	}

	// 1 名称校验
	exist, err := uc.repo.NameExistCheck(ctx, req.Name, sourceType, req.InfoSystemId)
	if err != nil {
		return nil, err
	}
	if exist {
		return nil, errorcode.Desc(errorcode.DataSourceNameExist)
	}

	// 2.1 虚拟化创建数据源 参数构建
	uid := uuid.New().String()
	//catalogName := strings.Replace(fmt.Sprintf("%s_%s", req.Type, uid), "-", "", -1)
	catalogName := fmt.Sprintf("%s_%s", strings.ReplaceAll(req.Type, "-", "_"), util.RandomLowLetterAndNumber(8))
	properties, err := uc.GenProperties(ctx, req.BasicDataSource, req.Type, connectorConfig)
	if err != nil {
		return nil, err
	}
	createDataSourceReq := &virtualization_engine.CreateDataSourceReq{
		CatalogName:   catalogName,
		ConnectorName: req.Type,
		Properties:    properties,
	}
	// 2.2 虚拟化创建数据源
	success, err := uc.ve.CreateDataSource(ctx, createDataSourceReq)
	if err != nil {
		return nil, err
	}
	if !success {
		return nil, errorcode.Desc(errorcode.CreateDataSourceFailed)
	}

	// 3.1 数据源信息保存 参数构建
	m := &model.Datasource{
		ID: uid,
		InfoSystemID: sql.NullString{
			String: req.InfoSystemId,
			Valid:  true,
		},
		Name:          req.Name,
		CatalogName:   catalogName,
		Host:          req.Host,
		Port:          req.Port,
		Username:      req.Username,
		Password:      req.Password,
		DatabaseName:  req.DatabaseName,
		Schema:        req.Schema,
		SourceType:    sourceType,
		CreatedByUID:  ctx.Value(interception.InfoName).(*model.User).ID,
		CreatedAt:     time.Now(),
		UpdatedByUID:  ctx.Value(interception.InfoName).(*model.User).ID,
		UpdatedAt:     time.Now(),
		TypeName:      req.Type,
		ExcelProtocol: req.ExcelProtocol,
		ExcelBase:     req.ExcelBase,
		DepartmentId:  req.DepartmentId,
		Enabled:       req.Enabled,
		HuaAoId:       req.HuaAoId,
		ConnectStatus: constant.Connected,
	}
	if m.Password == "" {
		m.Password = req.GuardianToken
	}
	//Type:         enum.ToInteger[constant.DataSourceType](req.Type).Int32(),

	// 3.2 数据源信息保存
	if err = uc.repo.Insert(ctx, m); err != nil {
		return nil, err
	}

	// 4 发送创建数据源消息
	payload := &datasourcemq.DatasourcePayload{}
	payload.Copier(m, req.GuardianToken)
	if err = uc.mqHandle.CreateDataSource(ctx, payload); err != nil {
		return nil, errorcode.Detail(errorcode.CreateDataSourceFailed, err.Error())
	}

	return &response.NameIDResp{
		ID:   m.ID,
		Name: req.Name,
	}, nil
}
func (uc *dataSourceUseCase) DealWithSchema(ctx context.Context, schema string) (string, error) {
	configs, err := uc.configurationRepo.GetByName(ctx, constant.CSSJJ)
	if err != nil {
		log.WithContext(ctx).Error("GetConfigValue DatabaseError", zap.Error(err))
		return schema, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	for _, c := range configs {
		if c.Key != constant.CSSJJ {
			continue
		}
		b, err := strconv.ParseBool(c.Value)
		if err != nil {
			log.WithContext(ctx).Error("parse cssjj value fail", zap.Error(err), zap.Any("config", c))
			return schema, err
		}
		if b {
			return strings.ToLower(schema), nil
		}
		break
	}
	return schema, nil
}
func (uc *dataSourceUseCase) GenProperties(ctx context.Context, req domain.BasicDataSource, typeName string, connectorConfig *virtualization_engine.ConnectorConfig) (properties any, err error) {
	if typeName == "excel" {
		properties = virtualization_engine.ExcelProperties{
			Protocol: req.ExcelProtocol,
			Host:     req.Host,
			Port:     fmt.Sprintf("%v", req.Port),
			Username: req.Username,
			Password: req.Password,
			Base:     req.ExcelBase,
		}
	} else { //通用方式
		connectionUrl := fmt.Sprintf("%v%v:%v/%v", connectorConfig.URL, util.ParseHost(req.Host), req.Port, req.DatabaseName)
		if connectorConfig.SchemaExist {
			connectionUrl = fmt.Sprintf("%v;schema=%v", connectionUrl, req.Schema)
		}
		if req.Username != "" && req.Password != "" {
			properties = virtualization_engine.Properties{
				ConnectionUrl:      connectionUrl,
				ConnectionUser:     req.Username,
				ConnectionPassword: req.Password,
			}
		} else if req.GuardianToken != "" {
			properties = virtualization_engine.TokenProperties{
				ConnectionUrl: connectionUrl,
				GuardianToken: req.GuardianToken,
			}
		} else {
			err = errorcode.WithDetail(errorcode.PublicInvalidParameterJson, map[string]any{"username": req.Username, "token": req.GuardianToken})
		}
	}
	return
}

func (uc *dataSourceUseCase) CheckDataSourceRepeat(ctx context.Context, req *domain.NameRepeatReq) (bool, error) {
	// 0 校验来源类型及信息系统id
	sourceType := enum.ToInteger[constant.SourceType](req.SourceType).Int32()
	if req.SourceType == constant.Records.String && req.InfoSystemId != "" {
		if _, err := uc.infoSystemRepo.GetByID(ctx, req.InfoSystemId); err != nil {
			return false, err
		}
	} else {
		req.InfoSystemId = ""
	}

	exist, err := uc.repo.NameExistCheck(ctx, req.Name, sourceType, req.InfoSystemId, req.ID)
	if err != nil {
		return false, err
	}
	if exist {
		return false, errorcode.Desc(errorcode.DataSourceNameExist)
	}
	return true, nil
}

func (uc *dataSourceUseCase) GetDataSources(ctx context.Context, req *domain.QueryPageReqParam) (*domain.QueryPageResParam, error) {
	log.Debug("get datasources", zap.Any("req", req))
	// 0 校验信息系统id
	if req.SourceType == constant.Records.String && req.InfoSystemId != "" {
		if _, err := uc.infoSystemRepo.GetByID(ctx, req.InfoSystemId); err != nil {
			return nil, err
		}
	} else {
		req.InfoSystemId = ""
	}

	var orgCodes []string
	if req.OrgCode != "" {
		orgCodes = append(orgCodes, req.OrgCode)
		datas, _, err := uc.departmentRepo.ListByPaging(ctx,
			&business_structure_domain.QueryPageReqParam{
				Offset:    1,
				Limit:     0,
				Direction: "desc",
				Sort:      "name",
				ID:        req.OrgCode,
				Type:      "department,organization",
				IsAll:     true,
			},
		)
		if err != nil {
			return nil, err
		}
		orgCodes = append(orgCodes,
			lo.Map(datas,
				func(item *business_structure_domain.ObjectVo, index int) string {
					return item.ID
				},
			)...,
		)
	}

	pageInfo := &request.PageInfo{
		Offset:    *req.Offset,
		Limit:     *req.Limit,
		Direction: *req.Direction,
		Sort:      *req.Sort,
	}
	// types 是数据源类型列表
	var types []string
	if req.Type != "" {
		types = strings.Split(req.Type, ",")
	}
	sourceType := enum.ToInteger[constant.SourceType](req.SourceType, 0).Int()
	models, total, err := uc.repo.ListByPaging(ctx, pageInfo, req.Keyword, req.InfoSystemId, sourceType, types, req.HuaAoID, orgCodes)
	if err != nil {
		return nil, err
	}
	departmentIDSlice := lo.Uniq(lo.Times(len(models), func(index int) string {
		return models[index].DepartmentId
	}))
	departmentInfoMap := make(map[string]string)
	departmentSlice, _ := uc.departmentRepo.GetDepartmentPrecision(ctx, departmentIDSlice)
	if len(departmentIDSlice) > 0 {
		departmentInfoMap = lo.SliceToMap(departmentSlice, func(item *model.Object) (string, string) {
			return item.ID, item.Name
		})
	}
	entries := make([]*domain.DataSourcePage, len(models), len(models))
	for i, m := range models {
		entries[i] = &domain.DataSourcePage{
			ID:             m.ID,
			Name:           m.Name,
			CatalogName:    m.CatalogName,
			Type:           m.TypeName,
			SourceType:     enum.ToString[constant.SourceType](m.SourceType),
			DatabaseName:   m.DatabaseName,
			Schema:         m.Schema,
			DepartmentID:   m.DepartmentId,
			DepartmentName: departmentInfoMap[m.DepartmentId],
			UpdatedByUID:   uc.user.GetUserNameNoErr(ctx, m.UpdatedByUID),
			UpdatedAt:      m.UpdatedAt.UnixMilli(),
			HuaAoID:        m.HuaAoId,
			ConnectStatus:  m.ConnectStatus,
		}
	}

	return &domain.QueryPageResParam{
		Entries:    entries,
		TotalCount: total,
	}, nil
}

func (uc *dataSourceUseCase) GetDataSource(ctx context.Context, req *domain.DataSourceId) (*domain.DataSourceDetail, error) {
	var err error
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	dataSource, err := uc.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	// 调用data-connect服务获取数据源详情信息
	vegaDataSourceInfo, err := uc.dc.GetDataSourceDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	infoSys := &model.InfoSystem{}
	if dataSource.SourceType == constant.Records.Integer.Int32() && dataSource.InfoSystemID.String != "" {
		if infoSys, err = uc.infoSystemRepo.GetByID(ctx, dataSource.InfoSystemID.String); err != nil {
			log.WithContext(ctx).Error("GetDataSource infoSystem error ", zap.String("InfoSystemID", dataSource.InfoSystemID.String), zap.Error(err))
			return nil, err
		}
	}
	var departmentName string
	if dataSource.DepartmentId != "" {
		department, err := uc.departmentRepo.GetObjByID(ctx, dataSource.DepartmentId)
		if err != nil {
			log.WithContext(ctx).Error("GetDataSource GetObjByID error ", zap.String("DepartmentId", dataSource.DepartmentId), zap.Error(err))
		}
		departmentName = department.Name
	}
	return &domain.DataSourceDetail{
		ID:              vegaDataSourceInfo.ID,
		InfoSystemId:    dataSource.InfoSystemID.String,
		InfoSystemName:  infoSys.Name,
		Name:            vegaDataSourceInfo.Name,
		Type:            vegaDataSourceInfo.Type,
		CatalogName:     vegaDataSourceInfo.BinData.CatalogName,
		SourceType:      enum.ToString[constant.SourceType](dataSource.SourceType),
		DatabaseName:    vegaDataSourceInfo.BinData.DatabaseName,
		ConnectProtocol: vegaDataSourceInfo.BinData.ConnectProtocol,
		Schema:          vegaDataSourceInfo.BinData.Schema,
		Host:            vegaDataSourceInfo.BinData.Host,
		Port:            vegaDataSourceInfo.BinData.Port,
		Username:        vegaDataSourceInfo.BinData.Account,
		Password:        vegaDataSourceInfo.BinData.Password,
		Token:           vegaDataSourceInfo.BinData.Token,
		Comment:         vegaDataSourceInfo.Comment,
		UpdatedByUID:    uc.user.GetUserNameNoErr(ctx, dataSource.UpdatedByUID),
		UpdatedAt:       dataSource.UpdatedAt.UnixMilli(),
		ExcelProtocol:   vegaDataSourceInfo.BinData.StorageProtocol,
		ExcelBase:       vegaDataSourceInfo.BinData.StorageBase,
		DepartmentId:    dataSource.DepartmentId,
		DepartmentName:  departmentName,
		ConnectStatus:   dataSource.ConnectStatus,
	}, nil
}

func (uc *dataSourceUseCase) DeleteDataSource(ctx context.Context, datasourceId string) (*response.NameIDResp, error) {
	// 1 校验该数据源是否存在
	dataSource, err := uc.repo.GetByID(ctx, datasourceId)
	if err != nil {
		return nil, err
	}

	success, err := uc.ve.DeleteDataSource(ctx, &virtualization_engine.DeleteDataSourceReq{CatalogName: dataSource.CatalogName})
	if err != nil {
		return nil, err
	}
	if !success {
		return nil, errorcode.Desc(errorcode.DeleteDataSourceFailed)
	}

	m := &model.Datasource{
		ID: datasourceId,
	}
	if err = uc.repo.Delete(ctx, m); err != nil {
		return nil, err
	}

	// 5 发送删除数据源消息
	if err = uc.mqHandle.DeleteDataSource(ctx, &datasourcemq.DatasourcePayload{
		ID: dataSource.ID,
	}); err != nil {
		return nil, errorcode.Detail(errorcode.DeleteDataMQSourceFailed, err.Error())
	}

	return &response.NameIDResp{
		ID:   m.ID,
		Name: m.Name,
	}, nil
}

// func (uc *dataSourceUseCase) ModifyDataSource(ctx context.Context, req *domain.ModifyDataSourceReq) (*response.NameIDResp, error) {
// 	sourceType := enum.ToInteger[constant.SourceType](req.SourceType).Int32()
// 	if req.SourceType == constant.Records.String && req.InfoSystemId != "" {
// 		if _, err := uc.infoSystemRepo.GetByID(ctx, req.InfoSystemId); err != nil {
// 			return nil, err
// 		}
// 	} else {
// 		req.InfoSystemId = ""
// 	}
// 	if req.Port == constant.ZkHiveDefaultPort {
// 		req.Port = constant.ZkHiveReplaceDefaultPort
// 	}
// 	// 1 校验该数据源是否存在
// 	dataSource, err := uc.repo.GetByID(ctx, req.ID)
// 	if err != nil {
// 		return nil, err
// 	}
// 	if dataSource.TypeName != "excel" && req.DatabaseName == "" {
// 		return nil, errorcode.WithDetail(errorcode.PublicInvalidParameterJson, map[string]any{"database_name": req.DatabaseName})
// 	}
// 	if req.DepartmentId != "" {
// 		objectVo, _ := uc.departmentRepo.GetDepartmentByIdOrThirdId(ctx, req.DepartmentId)
// 		if objectVo != nil {
// 			req.DepartmentId = objectVo.ID
// 		}
// 	}
// 	//校验或者填充数据库模式Schema
// 	config, err := uc.ve.GetConnectorConfig(ctx, dataSource.TypeName)
// 	if err != nil {
// 		return nil, err
// 	}
// 	if !config.SchemaExist {
// 		req.Schema = req.DatabaseName //没有数据库模式Schema的数据源类型dataSourceType  数据库模式Schema==数据库名称DatabaseName
// 	} else if req.Schema == "" {
// 		return nil, errorcode.Desc(errorcode.DataSourceTypeSchemaNotNull)
// 	}

// 	req.Schema, err = uc.DealWithSchema(ctx, req.Schema)
// 	if err != nil {
// 		return nil, err
// 	}

// 	// 2 如果名称修改则信息系统下名称校验
// 	if dataSource.Name != req.Name {
// 		if exist, err := uc.repo.NameExistCheck(ctx, req.Name, sourceType, req.InfoSystemId, req.ID); err != nil {
// 			return nil, err
// 		} else if exist {
// 			return nil, errorcode.Desc(errorcode.DataSourceNameExist)
// 		}
// 	}

// 	// 3.1 虚拟化修改数据源 参数构建 (修改需要重新输入密码，所以每次修改都要调用)
// 	properties, err := uc.GenProperties(ctx, req.BasicDataSource, dataSource.TypeName, config)
// 	if err != nil {
// 		return nil, err
// 	}
// 	modifyDataSourceReq := &virtualization_engine.ModifyDataSourceReq{
// 		CatalogName:   dataSource.CatalogName,
// 		ConnectorName: dataSource.TypeName,
// 		Properties:    properties,
// 	}
// 	// 3.2 虚拟化修改数据源
// 	success, err := uc.ve.ModifyDataSource(ctx, modifyDataSourceReq)
// 	if err != nil {
// 		return nil, err
// 	}
// 	if !success {
// 		return nil, errorcode.Desc(errorcode.ModifyDataSourceFailed)
// 	}

// 	// 4 数据源信息更新
// 	m := &model.Datasource{
// 		DataSourceID: dataSource.DataSourceID,
// 		ID:           req.ID,
// 		InfoSystemID: sql.NullString{
// 			String: req.InfoSystemId,
// 			Valid:  true,
// 		},
// 		Name:          req.Name,
// 		CatalogName:   dataSource.CatalogName,
// 		Host:          req.Host,
// 		Port:          req.Port,
// 		Username:      req.Username,
// 		Password:      req.Password,
// 		DatabaseName:  req.DatabaseName,
// 		Schema:        req.Schema,
// 		SourceType:    sourceType,
// 		UpdatedByUID:  ctx.Value(interception.InfoName).(*model.User).ID,
// 		UpdatedAt:     time.Now(),
// 		TypeName:      dataSource.TypeName,
// 		ExcelProtocol: req.ExcelProtocol,
// 		ExcelBase:     req.ExcelBase,
// 		DepartmentId:  req.DepartmentId,
// 		ConnectStatus: constant.Connected,
// 	}
// 	if err := uc.repo.Update(ctx, m); err != nil {
// 		return nil, err
// 	}

// 	// 5 发送修改数据源消息
// 	payload := &datasourcemq.DatasourcePayload{}
// 	if err = copier.Copy(payload, m); err != nil {
// 		return nil, errorcode.Detail(errorcode.ModifyDataSourceMQFailed, err.Error())
// 	}
// 	if err = uc.mqHandle.UpdateDataSource(ctx, payload); err != nil {
// 		return nil, errorcode.Detail(errorcode.ModifyDataSourceMQFailed, err.Error())
// 	}

// 	return &response.NameIDResp{
// 		ID:   m.ID,
// 		Name: m.Name,
// 	}, nil
// }

func (uc *dataSourceUseCase) ModifyDataSource(ctx context.Context, req *domain.ModifyDataSourceReq) (*response.NameIDResp, error) {
	sourceType := enum.ToInteger[constant.SourceType](req.SourceType).Int32()
	if req.SourceType == constant.Records.String && req.InfoSystemId != "" {
		if _, err := uc.infoSystemRepo.GetByID(ctx, req.InfoSystemId); err != nil {
			return nil, err
		}
	} else {
		req.InfoSystemId = ""
	}

	// 1 校验该数据源是否存在
	dataSource, err := uc.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if req.DepartmentId != "" {
		objectVo, _ := uc.departmentRepo.GetDepartmentByIdOrThirdId(ctx, req.DepartmentId)
		if objectVo != nil {
			req.DepartmentId = objectVo.ID
		}
	}

	//2 数据源信息更新
	m := &model.Datasource{
		DataSourceID: dataSource.DataSourceID,
		ID:           req.ID,
		InfoSystemID: sql.NullString{
			String: req.InfoSystemId,
			Valid:  true,
		},
		Name:          dataSource.Name,
		CatalogName:   dataSource.CatalogName,
		Host:          dataSource.Host,
		Port:          dataSource.Port,
		Username:      dataSource.Username,
		Password:      dataSource.Password,
		DatabaseName:  dataSource.DatabaseName,
		Schema:        dataSource.Schema,
		SourceType:    sourceType,
		UpdatedByUID:  ctx.Value(interception.InfoName).(*model.User).ID,
		UpdatedAt:     time.Now(),
		TypeName:      dataSource.TypeName,
		ExcelProtocol: dataSource.ExcelProtocol,
		ExcelBase:     dataSource.ExcelBase,
		DepartmentId:  req.DepartmentId,
		ConnectStatus: constant.Connected,
	}
	if err := uc.repo.Update(ctx, m); err != nil {
		return nil, err
	}

	// 3 发送修改数据源消息
	payload := &datasourcemq.DatasourcePayload{}
	if err = copier.Copy(payload, m); err != nil {
		return nil, errorcode.Detail(errorcode.ModifyDataSourceMQFailed, err.Error())
	}
	if err = uc.mqHandle.UpdateDataSource(ctx, payload); err != nil {
		return nil, errorcode.Detail(errorcode.ModifyDataSourceMQFailed, err.Error())
	}

	return &response.NameIDResp{
		ID:   m.ID,
		Name: m.Name,
	}, nil
}

func (uc *dataSourceUseCase) GetDataSourceSystemInfos(ctx context.Context, req *domain.DataSourceIds) ([]*response.GetDataSourceSystemInfosRes, error) {
	infos, err := uc.repo.GetDataSourceSystemInfos(ctx, req.IDs)
	if err != nil {
		log.WithContext(ctx).Error("GetDataSourceSystemInfos database error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return infos, nil
}

func (uc *dataSourceUseCase) GetDataSourcesByIds(ctx context.Context, IDs []string) ([]*configuration_center.DataSourcesPrecision, error) {
	dataSources, err := uc.repo.GetByIDs(ctx, IDs)
	if err != nil {
		return nil, err
	}
	uids := make([]string, 0)
	for _, dataSource := range dataSources {
		uids = append(uids, dataSource.CreatedByUID)
		uids = append(uids, dataSource.UpdatedByUID)
	}
	nameMap, err := uc.user.GetByUserNameMap(ctx, uids)
	if err != nil {
		return nil, err
	}
	res := make([]*configuration_center.DataSourcesPrecision, len(dataSources), len(dataSources))
	for i, dataSource := range dataSources {
		res[i] = &configuration_center.DataSourcesPrecision{
			DataSourceID: dataSource.DataSourceID,
			ID:           dataSource.ID,
			InfoSystemID: dataSource.InfoSystemID.String,
			DepartmentID: dataSource.DepartmentId,
			Name:         dataSource.Name,
			CatalogName:  dataSource.CatalogName,
			TypeName:     dataSource.TypeName,
			Host:         dataSource.Host,
			Port:         dataSource.Port,
			Username:     dataSource.Username,
			DatabaseName: dataSource.DatabaseName,
			Schema:       dataSource.Schema,
			SourceType:   dataSource.SourceType,
			CreatedByUID: nameMap[dataSource.CreatedByUID],
			CreatedAt:    dataSource.CreatedAt.UnixMilli(),
			UpdatedByUID: nameMap[dataSource.UpdatedByUID],
			UpdatedAt:    dataSource.UpdatedAt.UnixMilli(),
			HuaAoId:      dataSource.HuaAoId,
		}
	}
	return res, nil
}

func (uc *dataSourceUseCase) GetAll(ctx context.Context) ([]*configuration_center.DataSources, error) {
	dataSources, err := uc.repo.GetAll(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	resDatasource := make([]*configuration_center.DataSources, len(dataSources))
	for i, source := range dataSources {
		resDatasource[i] = &configuration_center.DataSources{
			DataSourceID: source.DataSourceID,
			ID:           source.ID,
			InfoSystemID: source.InfoSystemID.String,
			DepartmentID: source.DepartmentId,
			Name:         source.Name,
			CatalogName:  source.CatalogName,
			TypeName:     source.TypeName,
			Host:         source.Host,
			Port:         source.Port,
			Username:     source.Username,
			DatabaseName: source.DatabaseName,
			Schema:       source.Schema,
			SourceType:   source.SourceType,
			CreatedByUID: source.CreatedByUID,
			CreatedAt:    source.CreatedAt,
			UpdatedByUID: source.UpdatedByUID,
			UpdatedAt:    source.UpdatedAt,
		}
	}
	return resDatasource, nil
}

func (uc *dataSourceUseCase) GetDataSourceGroupBySourceType(ctx context.Context) ([]*domain.DataSourceGroupBySourceType, error) {
	dataSources, err := uc.GetDataSources(ctx, &domain.QueryPageReqParam{
		PageInfo: domain.PageInfo{
			Offset:    lo.ToPtr(1),
			Limit:     lo.ToPtr(2000),
			Direction: lo.ToPtr("asc"),
			Sort:      lo.ToPtr("name"),
		},
		Keyword:      "",
		InfoSystemId: "",
		SourceType:   "",
		Type:         "",
	})
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	groupBySourceType := make([]*domain.DataSourceGroupBySourceType, 0)
	// Group by source type first
	sourceTypeMap := make(map[string][]*domain.DataSourcePage)
	for _, dataSource := range dataSources.Entries {
		sourceTypeMap[dataSource.SourceType] = append(sourceTypeMap[dataSource.SourceType], dataSource)
	}

	// For each source type, group by database type
	for sourceType, entries := range sourceTypeMap {
		typeMap := make(map[string][]*domain.DataSourcePage)
		for _, entry := range entries {
			typeMap[entry.Type] = append(typeMap[entry.Type], entry)
		}

		// Create type groups
		typeGroups := make([]*domain.DataSourceGroupByType, 0)
		for typeName, typeEntries := range typeMap {
			typeGroups = append(typeGroups, &domain.DataSourceGroupByType{
				Type:    typeName,
				Entries: typeEntries,
			})
		}

		// Add to final result
		groupBySourceType = append(groupBySourceType, &domain.DataSourceGroupBySourceType{
			SourceType: sourceType,
			Entries:    typeGroups,
		})
	}
	if len(groupBySourceType) != 0 {
		// INSERT_YOUR_CODE
		sort.Slice(groupBySourceType, func(i, j int) bool {
			return groupBySourceType[i].SourceType < groupBySourceType[j].SourceType
		})
	}
	return groupBySourceType, nil
}

func (uc *dataSourceUseCase) GetDataSourceGroupByType(ctx context.Context) ([]*domain.DataSourceGroupByType, error) {
	dataSources, err := uc.GetDataSources(ctx, &domain.QueryPageReqParam{
		PageInfo: domain.PageInfo{
			Offset:    lo.ToPtr(1),
			Limit:     lo.ToPtr(2000),
			Direction: lo.ToPtr("asc"),
			Sort:      lo.ToPtr("name"),
		},
		Keyword:      "",
		InfoSystemId: "",
		SourceType:   "",
		Type:         "",
	})
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	groupByType := make([]*domain.DataSourceGroupByType, 0)
	// Group by type first
	typeMap := make(map[string][]*domain.DataSourcePage)
	for _, dataSource := range dataSources.Entries {
		typeMap[dataSource.Type] = append(typeMap[dataSource.Type], dataSource)
	}

	// For each type, group by source type
	for typeName, entries := range typeMap {
		sourceTypeMap := make(map[string][]*domain.DataSourcePage)
		for _, entry := range entries {
			sourceTypeMap[entry.SourceType] = append(sourceTypeMap[entry.SourceType], entry)
		}

		// Create source type groups
		sourceTypeGroups := make([]*domain.DataSourcePage, 0)
		for _, sourceTypeEntries := range sourceTypeMap {
			sourceTypeGroups = append(sourceTypeGroups, sourceTypeEntries...)
		}

		// Add to final result
		groupByType = append(groupByType, &domain.DataSourceGroupByType{
			Type:    typeName,
			Entries: sourceTypeGroups,
		})
	}
	if len(groupByType) != 0 {
		// INSERT_YOUR_CODE
		sort.Slice(groupByType, func(i, j int) bool {
			return groupByType[i].Type < groupByType[j].Type
		})
	}
	return groupByType, nil
}

func (uc *dataSourceUseCase) UpdateConnectStatus(ctx context.Context, req *domain.UpdateConnectStatusReq) error {

	// 1 校验该数据源是否存在
	dataSource, err := uc.repo.GetByID(ctx, req.ID)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	dataSource.ConnectStatus = req.ConnectStatus
	if err = uc.repo.Update(ctx, dataSource); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	// 5 发送修改数据源消息
	payload := &datasourcemq.DatasourcePayload{}
	if err = copier.Copy(payload, dataSource); err != nil {
		return errorcode.Detail(errorcode.ModifyDataSourceMQFailed, err.Error())
	}
	if err = uc.mqHandle.UpdateDataSource(ctx, payload); err != nil {
		return errorcode.Detail(errorcode.ModifyDataSourceMQFailed, err.Error())
	}

	return nil
}
