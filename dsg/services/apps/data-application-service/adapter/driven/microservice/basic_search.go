package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type InterfaceSvcSearchReq struct {
	Keyword          string     `json:"keyword" binding:"TrimSpace,omitempty,min=1"` // 搜索关键词，支持字段：接口名称，接口说明
	OrgCodes         []string   `json:"orgcodes" binding:"omitempty"`                // 接口服务所属组织架构ID
	SubjectDomainIds []string   `json:"subject_domain_ids" binding:"omitempty"`      // 接口服务所属主题域ID
	OnlineAt         *TimeRange `json:"online_at,omitempty" binding:"omitempty"`
	Orders           []Order    `json:"orders,omitempty" binding:"omitempty,dive,unique=Sort"`
	Size             int        `json:"size,omitempty" binding:"omitempty,gt=0" default:"20" example:"20"`   // 要获取到的记录条数
	NextFlag         []string   `json:"next_flag,omitempty" binding:"omitempty,min=2,max=3" example:"1,abc"` // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

type TimeRange struct {
	StartTime *int64 `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64 `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

type Order struct {
	Direction string `json:"direction" binding:"required,oneof=asc desc" example:"desc"` // 排序方向，枚举 asc正序，desc倒序
	Sort      string `json:"sort" binding:"required,oneof=updated_at online_at"`         // 排序类型，枚举 updated_at更新时间 online_at发布时间
}

type InterfaceSvcSearchRes struct {
	dto.PageResult[InterfaceSvcBaseInfo]
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type InterfaceSvcBaseInfo struct {
	ID             string `json:"id"`                  // 接口服务id
	Name           string `json:"name"`                // 接口服务名称，可能存在高亮标签
	RawName        string `json:"raw_name"`            // 接口服务名称，不会存在高亮标签
	Description    string `json:"description"`         // 接口服务描述，可能存在高亮标签
	RawDescription string `json:"raw_description"`     // 接口服务描述，不会存在高亮标签
	UpdatedAt      int64  `json:"updated_at"`          // 接口服务更新时间
	OnlineAt       int64  `json:"online_at,omitempty"` // 接口服务发布时间
	OrgCode        string `json:"orgcode"`             // 接口服务所属组织架构ID
	OrgName        string `json:"orgname"`             // 接口服务所属组织架构ID
	RawOrgName     string `json:"raw_orgname"`
	DataOwnerID    string `json:"owner_id,omitempty"`   // data owner id
	DataOwnerName  string `json:"owner_name,omitempty"` // data owner 名称
	RawOwnerName   string `json:"raw_owner_name"`
}

type BasicSearchRepo interface {
	InterfaceSvcSearch(ctx context.Context, req *InterfaceSvcSearchReq) (res *InterfaceSvcSearchRes, err error)
}

func NewBasicSearchRepo() BasicSearchRepo {
	return &basicSearchRepo{}
}

type basicSearchRepo struct{}

func (b *basicSearchRepo) InterfaceSvcSearch(ctx context.Context, q *InterfaceSvcSearchReq) (res *InterfaceSvcSearchRes, err error) {
	url := settings.Instance.Services.BasicSearch + "/api/basic-search/v1/interface-svc/search"
	//req.DevMode()
	resp, err := req.SetBody(q).Post(url)
	if err != nil {
		log.WithContext(ctx).Error("basicSearchRepo InterfaceSvcSearch", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("basicSearchRepo InterfaceSvcSearch", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("basicSearchRepo UnmarshalJson", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}
