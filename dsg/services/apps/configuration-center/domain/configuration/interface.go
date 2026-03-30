package configuration

import "context"

type ConfigurationCase interface {
	GetThirdPartyAddr(ctx context.Context, req *GetThirdPartyAddressReq) ([]*GetThirdPartyAddressRes, error)
	GetConfigValue(ctx context.Context, key string) (*GetConfigValueRes, error)
	GetConfigValues(ctx context.Context, key string) ([]*GetConfigValueRes, error)
	PutConfigValue(ctx context.Context, key, value string) error
	GetProjectProvider(ctx context.Context) (*GetProjectProviderRes, error)
	GetBusinessDomainLevel(ctx context.Context) ([]string, error)
	SetBusinessDomainLevel(ctx context.Context, businessDomainLevelsArr []string) error
	GetByTypeList(ctx context.Context, resType int32) ([]*GetConfigValueRes, error)
	GetDataUsingType(ctx context.Context) (*GetDataUsingTypeRes, error)
	PutDataUsingType(ctx context.Context, req *PutDataUsingTypeReq) error
	GetTimestampBlacklist(ctx context.Context) ([]string, error)
	SetTimestampBlacklist(ctx context.Context, TimestampBlacklistArr []string) error
	PutGovernmentDataShare(ctx context.Context, req *PutGovernmentDataShareReq) error
	GetGovernmentDataShare(ctx context.Context) (*GetGovernmentDataShareRes, error)
	GetCssjjStatus(ctx context.Context) (*GetCssjjStatusRes, error)
	GetApplicationVersion(ctx context.Context) (*GetApplicationVersionRes, error)
}

type GetConfigValueReq struct {
	Key string `form:"key" binding:"required,min=1,max=255" example:"AISampleDataShow"` // 配置表中对应的key
}

type GetConfigValuesReq struct {
	Keys string `form:"key" binding:"omitempty" example:"AISampleDataShow"` // 配置表中对应的key(批量)
}

type GetByTypeReq struct {
	ResType int32 `json:"resType" uri:"resType" binding:"required"` // 配置表中对应的type
}

type GetConfigValueRes struct {
	Key   string `json:"key"  binding:"required,min=1,max=255" example:"AISampleDataShow"` // 配置表中的key的值
	Value string `json:"value"  binding:"required" example:"YES"`                          // 配置表中的value的值
}

type GetThirdPartyAddressReq struct {
	Path bool   `json:"path" form:"path,default=false" default:"false"`
	Name string `json:"name" form:"name"`
}

type GetThirdPartyAddressRes struct {
	Name string `json:"name"`
	Addr string `json:"addr"`
}

type GetProjectProviderRes struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type PutBusinessDomainLevelReq struct {
	Level []string `json:"level" binding:"required,gte=3,lte=7,dive,oneof=domain_group domain process" example:"domain_group,domain,process"`
}

type PutDataUsingTypeReq struct {
	Using int `json:"using" binding:"required,oneof=1 2" example:"1"`
}
type GetDataUsingTypeRes struct {
	Using int `json:"using" example:"1"`
}

type PutGovernmentDataShareReq struct {
	On bool `json:"on"`
}
type GetGovernmentDataShareRes struct {
	On bool `json:"on"`
}

type GetCssjjStatusRes struct {
	Enabled bool `json:"enabled" example:"true"` // cssjj配置是否启用
}

type PutTimestampBlacklistReq struct {
	TimestampBlacklist []string `json:"timestamp_blacklist" binding:"required,dive,TrimSpace,min=1,max=255"` // 业务更新时间黑名单
}

type GetApplicationVersionRes struct {
	Version   string `json:"version"`
	BuildDate string `json:"build_date"`
}
