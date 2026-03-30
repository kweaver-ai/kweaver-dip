package standardizationbackend

import "context"

type DrivenStandardizationRepo interface {
	GetDataElementDetail(ctx context.Context, id string) (data DataResp, err error)
	GetStandardDict(ctx context.Context, ids []string) (data map[string]DictResp, err error)
	GetStandardDictById(ctx context.Context, id string) (data map[string]string, description string, err error)
	GetRuleByStandardId(ctx context.Context, id string) (data *RuleDetailResp, err error)
}

type StandardDetailResp struct {
	Code        string   `json:"code"`
	Description string   `json:"description"`
	Data        DataResp `json:"data"`
}

type DataResp struct {
	ID            string `json:"code"`           // 标准id
	NameCn        string `json:"name_cn"`        // 标准中文名
	NameEn        string `json:"name_en"`        // 标准英文名
	DataType      int    `json:"data_type"`      // 数据类型
	DataTypeName  string `json:"data_type_name"` // 数据类型名称
	DataLength    int    `json:"data_length"`    // 数据长度
	DataPrecision *int   `json:"data_precision"` // 数据精度
	DataRange     string `json:"data_range"`     // 值域
	StdType       int    `json:"std_type"`       // 制定依据
	DictID        string `json:"dict_id"`        // 码表id
	DictNameCn    string `json:"dict_name_cn"`   // 码表中文名称
	DictNameEn    string `json:"dict_name_en"`   // 码表英文名称
	DictState     string `json:"dict_state"`     // 码表状态
	DictDeleted   bool   `json:"dict_deleted"`   // 码表状态
	State         string `json:"state"`
	Deleted       bool   `json:"deleted"`
}

type StandardDictResp struct {
	Code        string     `json:"code"`
	Description string     `json:"description"`
	Data        []DictResp `json:"data"`
}

type DictResp struct {
	ID      string `json:"id"`
	NameZh  string `json:"ch_name"`
	State   string `json:"state"`
	Deleted bool   `json:"deleted"`
}

type StandardDictDetailResp struct {
	Code        string           `json:"code"`
	Description string           `json:"description"`
	Data        []DictDetailResp `json:"data"`
}

type DictDetailResp struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Description string `json:"description"`
	DictId      string `json:"dict_id"`
	Value       string `json:"value"`
}

type GetStandardByIdsRes struct {
	Code        string              `json:"code"`
	Description string              `json:"description"`
	Data        []*StandardByIdsRes `json:"data"`
}
type StandardByIdsRes struct {
	ID      string `json:"id"`
	Code    string `json:"code"`
	NameEn  string `json:"name_en"`
	NameCn  string `json:"name_cn"`
	State   string `json:"state"`
	Deleted string `json:"deleted"`
}

type StandardRuleResp struct {
	Code        string          `json:"code"`
	Description string          `json:"description"`
	Data        *RuleDetailResp `json:"data"`
}

type RuleDetailResp struct {
	ID       string `json:"id"`
	Regex    string `json:"regex"`
	RuleType string `json:"rule_type"`
}
