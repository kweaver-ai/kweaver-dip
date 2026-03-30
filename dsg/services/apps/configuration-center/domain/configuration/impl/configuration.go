package impl

import (
	"context"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"

	configuration_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type Configuration struct {
	ConfigurationRepo configuration_repo.Repo
	mqHandle          configuration.ConfigurationHandle
}

func NewConfiguration(configurationRepo configuration_repo.Repo, mqHandle configuration.ConfigurationHandle) domain.ConfigurationCase {
	return &Configuration{
		ConfigurationRepo: configurationRepo,
		mqHandle:          mqHandle,
	}
}

func (c *Configuration) GetThirdPartyAddr(ctx context.Context, req *domain.GetThirdPartyAddressReq) ([]*domain.GetThirdPartyAddressRes, error) {
	var addrs []*model.Configuration
	var err error
	if req.Name != "" {
		if addrs, err = c.ConfigurationRepo.GetByName(ctx, req.Name); err != nil {
			log.WithContext(ctx).Error("GetThirdPartyAddr DatabaseError", zap.Error(err))
			return nil, errorcode.Desc(errorcode.PublicDatabaseError)
		}
	} else {
		var t int32 = 2
		if req.Path {
			t = 1
		}
		if addrs, err = c.ConfigurationRepo.GetByType(ctx, t); err != nil {
			log.WithContext(ctx).Error("GetThirdPartyAddr DatabaseError", zap.Error(err))
			return nil, errorcode.Desc(errorcode.PublicDatabaseError)
		}
	}
	res := make([]*domain.GetThirdPartyAddressRes, len(addrs))
	for i, addr := range addrs {
		res[i] = &domain.GetThirdPartyAddressRes{
			Name: addr.Key,
			Addr: addr.Value,
		}
	}
	return res, nil
}

func (c *Configuration) GetConfigValue(ctx context.Context, key string) (*domain.GetConfigValueRes, error) {
	var configs []*model.Configuration
	var err error
	if configs, err = c.ConfigurationRepo.GetByName(ctx, key); err != nil {
		log.WithContext(ctx).Error("GetConfigValue DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(configs) > 0 {
		return &domain.GetConfigValueRes{
			Key:   configs[0].Key,
			Value: configs[0].Value,
		}, nil
	}

	// 没有找到
	return nil, nil
}

func (c *Configuration) GetConfigValues(ctx context.Context, key string) ([]*domain.GetConfigValueRes, error) {
	var configs []*model.Configuration
	var resps []*domain.GetConfigValueRes
	var keys []string
	var err error
	if key != "" {
		keys = strings.Split(key, ",")
	}
	if configs, err = c.ConfigurationRepo.GetByNames(ctx, keys); err != nil {
		log.WithContext(ctx).Error("GetConfigValues DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(configs) > 0 {
		for _, config := range configs {
			resps = append(resps, &domain.GetConfigValueRes{
				Key:   config.Key,
				Value: config.Value,
			})
		}
	}

	return resps, nil
}

func (c *Configuration) PutConfigValue(ctx context.Context, key, value string) error {
	updateObj := &model.Configuration{
		Key:   key,
		Value: value,
	}
	if err := c.ConfigurationRepo.Update(ctx, updateObj); err != nil {
		log.WithContext(ctx).Error("DatabaseError or key not exists", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (c *Configuration) GetByTypeList(ctx context.Context, resType int32) ([]*domain.GetConfigValueRes, error) {
	var addrs []*model.Configuration
	var err error
	if addrs, err = c.ConfigurationRepo.GetByType(ctx, resType); err != nil {
		log.WithContext(ctx).Error("GetThirdPartyAddr DatabaseError", zap.Error(err))
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	res := make([]*domain.GetConfigValueRes, len(addrs))
	for i, addr := range addrs {
		res[i] = &domain.GetConfigValueRes{
			Key:   addr.Key,
			Value: addr.Value,
		}
	}
	return res, nil
}

func (c *Configuration) GetProjectProvider(ctx context.Context) (*domain.GetProjectProviderRes, error) {
	providers, err := c.ConfigurationRepo.GetByType(ctx, 3)
	if err != nil {
		log.WithContext(ctx).Error("GetProjectProvider DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(providers) > 0 {
		return &domain.GetProjectProviderRes{
			Key:   providers[0].Key,
			Value: providers[0].Value,
		}, nil
	}
	return nil, errorcode.Desc(errorcode.PublicDatabaseError)
}
func (c *Configuration) GetBusinessDomainLevel(ctx context.Context) ([]string, error) {
	businessDomainLevels, err := c.ConfigurationRepo.GetByName(ctx, constant.BusinessDomainLevel)
	if err != nil {
		log.WithContext(ctx).Error("GetBusinessDomainLevel DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	var businessDomainLevel string
	if len(businessDomainLevels) == 0 {
		if err = c.ConfigurationRepo.Insert(ctx, &model.Configuration{
			Key:   constant.BusinessDomainLevel,
			Value: constant.BusinessDomainLevelDefault,
		}); err != nil {
			return nil, err
		}
		businessDomainLevel = constant.BusinessDomainLevelDefault

	} else {
		businessDomainLevel = businessDomainLevels[0].Value
	}
	split := strings.Split(businessDomainLevel, ",")
	res := make([]string, len(split))
	for i, s := range split {
		atoi, err := strconv.Atoi(s)
		if err != nil {
			return nil, err
		}
		res[i] = enum.ToString[constant.BusinessDomainLevelEnum](atoi)
	}
	return res, nil
}

func (c *Configuration) SetBusinessDomainLevel(ctx context.Context, businessDomainLevelsArr []string) error {
	var value string
	for i, s := range businessDomainLevelsArr {
		if i == 0 {
			value = value + strconv.Itoa(enum.ToInteger[constant.BusinessDomainLevelEnum](s).Int())
		} else {
			value = value + "," + strconv.Itoa(enum.ToInteger[constant.BusinessDomainLevelEnum](s).Int())
		}
	}
	businessDomainLevels, err := c.ConfigurationRepo.GetByName(ctx, constant.BusinessDomainLevel)
	if err != nil {
		log.WithContext(ctx).Error("SetConfigValue DatabaseError", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(businessDomainLevels) == 0 {
		if err = c.ConfigurationRepo.Insert(ctx, &model.Configuration{
			Key:   constant.BusinessDomainLevel,
			Value: value,
		}); err != nil {
			log.WithContext(ctx).Error("SetBusinessDomainLevel Insert ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		return nil
	}
	if businessDomainLevels[0].Value == value {
		return nil
	}
	if err = c.ConfigurationRepo.Update(ctx, &model.Configuration{
		Key:   constant.BusinessDomainLevel,
		Value: value,
	}); err != nil {
		log.WithContext(ctx).Error("SetBusinessDomainLevel Update ", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	//发消息
	if err = c.mqHandle.SetBusinessDomainLevel(ctx, &configuration.BusinessDomainLevelMessage{
		Level: businessDomainLevelsArr,
	}); err != nil {
		log.WithContext(ctx).Error("SetBusinessDomainLevel mqHandle error ", zap.Error(err))
	}

	return nil
}

func (c *Configuration) GetDataUsingType(ctx context.Context) (*domain.GetDataUsingTypeRes, error) {
	dataUsingType, err := c.ConfigurationRepo.GetByName(ctx, "using")
	if err != nil {
		log.WithContext(ctx).Error("GetDataUsingType DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(dataUsingType) == 0 {
		return &domain.GetDataUsingTypeRes{Using: 0}, nil

	}
	value, err := strconv.Atoi(dataUsingType[0].Value)
	if err != nil {
		return nil, err
	}
	res := &domain.GetDataUsingTypeRes{Using: value}

	return res, nil
}

func (c *Configuration) PutDataUsingType(ctx context.Context, req *domain.PutDataUsingTypeReq) error {
	dataUsingType, err := c.ConfigurationRepo.GetByName(ctx, "using")
	if err != nil {
		log.WithContext(ctx).Error("GetDataUsingType DatabaseError", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(dataUsingType) == 0 {
		if err = c.ConfigurationRepo.Insert(ctx, &model.Configuration{
			Key:   "using",
			Value: strconv.Itoa(req.Using),
		}); err != nil {
			return err
		}
	} else {
		if err = c.ConfigurationRepo.Update(ctx, &model.Configuration{
			Key:   "using",
			Value: strconv.Itoa(req.Using),
		}); err != nil {
			log.WithContext(ctx).Error("PutDataUsingType Update ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}

	return nil
}

func (c *Configuration) PutGovernmentDataShare(ctx context.Context, req *domain.PutGovernmentDataShareReq) error {
	onRes, err := c.ConfigurationRepo.GetByName(ctx, "government_data_share")
	if err != nil {
		log.WithContext(ctx).Error("PutGovernmentDataShare DatabaseError", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(onRes) == 0 {
		if err := c.ConfigurationRepo.Insert(ctx, &model.Configuration{
			Key:   "government_data_share",
			Value: strconv.FormatBool(req.On),
		}); err != nil {
			return err
		}
	} else {
		if err := c.ConfigurationRepo.Update(ctx, &model.Configuration{
			Key:   "government_data_share",
			Value: strconv.FormatBool(req.On),
		}); err != nil {
			log.WithContext(ctx).Error("PutGovernmentDataShare Update ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}
	return nil
}

func (c *Configuration) GetGovernmentDataShare(ctx context.Context) (*domain.GetGovernmentDataShareRes, error) {
	onRes, err := c.ConfigurationRepo.GetByName(ctx, "government_data_share")
	if err != nil {
		log.WithContext(ctx).Error("GetGovernmentDataShare DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(onRes) == 0 {
		return &domain.GetGovernmentDataShareRes{On: false}, nil

	}

	on, _ := strconv.ParseBool(onRes[0].Value)
	res := &domain.GetGovernmentDataShareRes{On: on}

	return res, nil
}

func (c *Configuration) GetCssjjStatus(ctx context.Context) (*domain.GetCssjjStatusRes, error) {
	cssjjRes, err := c.ConfigurationRepo.GetByName(ctx, "cssjj")
	if err != nil {
		log.WithContext(ctx).Error("GetCssjjStatus DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(cssjjRes) == 0 {
		return &domain.GetCssjjStatusRes{Enabled: false}, nil
	}

	enabled, _ := strconv.ParseBool(cssjjRes[0].Value)
	res := &domain.GetCssjjStatusRes{Enabled: enabled}

	return res, nil
}

func (c *Configuration) GetTimestampBlacklist(ctx context.Context) (res []string, err error) {
	timestampBlacklists, err := c.ConfigurationRepo.GetByName(ctx, "timestamp_blacklist")
	if err != nil {
		log.WithContext(ctx).Error("GetBusinessDomainLevel DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	var timestampBlacklist string
	if len(timestampBlacklists) > 0 {
		timestampBlacklist = timestampBlacklists[0].Value
		if timestampBlacklist != "" {
			res = strings.Split(timestampBlacklist, ",")
		}
	}

	return res, nil
}

func (c *Configuration) SetTimestampBlacklist(ctx context.Context, TimestampBlacklistArr []string) error {
	var value string
	for i, s := range TimestampBlacklistArr {
		if i == 0 {
			value = value + s
		} else {
			value = value + "," + s
		}
	}
	timestampBlacklists, err := c.ConfigurationRepo.GetByName(ctx, "timestamp_blacklist")
	if err != nil {
		log.WithContext(ctx).Error("SetConfigValue DatabaseError", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(timestampBlacklists) == 0 {
		if err = c.ConfigurationRepo.Insert(ctx, &model.Configuration{
			Key:   "timestamp_blacklist",
			Value: value,
		}); err != nil {
			log.WithContext(ctx).Error("SetTimestampBlacklist Insert ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		return nil
	}
	if timestampBlacklists[0].Value == value {
		return nil
	}
	if err = c.ConfigurationRepo.Update(ctx, &model.Configuration{
		Key:   "timestamp_blacklist",
		Value: value,
	}); err != nil {
		log.WithContext(ctx).Error("SetTimestampBlacklist Update ", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (c *Configuration) GetApplicationVersion(ctx context.Context) (*domain.GetApplicationVersionRes, error) {
	version := settings.ConfigInstance.Config.ProductVersion
	buildDate := settings.ConfigInstance.Config.BuildDate
	if version == "" || buildDate == "" {
		return nil, errorcode.Desc(errorcode.ConfigurationNotFindError)
	}
	return &domain.GetApplicationVersionRes{Version: version, BuildDate: buildDate}, nil
}
