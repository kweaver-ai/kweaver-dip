package data_comprehension

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

const (
	businessInfo   = "business"
	valueInfo      = "value"
	businessMetric = "businessMetric"
	businessObj    = "businessObj"
	businessRule   = "businessRule"
)

// Configuration 数据理解配置
type Configuration struct {
	Note            string              `json:"note"`
	DimensionConfig []*DimensionConfig  `json:"dimension_config"`
	Choices         map[string][]Choice `json:"choices"`
}

type DimensionConfig struct {
	CatalogId models.ModelID     `json:"-"`                     //目录ID
	Id        string             `json:"id" binding:"required"` //配置的ID
	Name      string             `json:"name"`                  //数据理解名称
	Category  string             `json:"category"`              //所属分类, business:业务信息;value:价值信息
	Error     string             `json:"error,omitempty"`       //维度错误,详情接口的返回错误
	Children  []*DimensionConfig `json:"children,omitempty"`    //子维度,，叶子节点没有Children配置
	Detail    *DimensionDetail   `json:"detail,omitempty"`      //具体的配置, 非叶子节点没有该配置
}

type DimensionDetail struct {
	CatalogId         models.ModelID `json:"-"`                        //目录ID
	DimensionConfigId string         `json:"-"`                        //理解配置ID
	DimensionName     string         `json:"-"`                        //维度名称
	Required          bool           `json:"required"`                 //是否必填
	IsMulti           bool           `json:"is_multi"`                 //是否有多个值
	MaxMulti          int            `json:"max_multi"`                //最高支持几个值
	ItemLength        int            `json:"item_length"`              //单个理解的最大长度
	Content           any            `json:"content,omitempty"`        //理解的内容
	AIContent         any            `json:"ai_content,omitempty"`     //AI理解的内容
	ContentType       int            `json:"content_type"`             //理解内容的类型
	ContentErrors     ContentError   `json:"content_errors,omitempty"` //包含的错误
	Note              string         `json:"note"`                     //悬浮提示
	Error             string         `json:"error,omitempty"`          //理解维度报错

	ListErr string `json:"-"` //列表错误
}

// DimensionError 从详情里面提取错误到维度
func (d *DimensionConfig) DimensionError() {
	if !d.IsLeaf() {
		return
	}
	if len(d.Detail.ContentErrors) <= 0 {
		return
	}
	err, ok := d.Detail.ContentErrors["-1"]
	if !ok {
		return
	}
	d.Error = err
}

// 理解类型，每种类型抽象成一个接口，给出对应的编解码方法
const (
	ContentTypeArrayText           = 1 //文本数组：  []string{"文本1","文本2"}
	ContentTypeDate                = 2 //时间日期：  []timestamp{124324,345353}
	ContentTypeListed              = 3 //选择菜单：  信用信息、金融信息、医疗健康、城市交通、文化旅游、行政执法、党的建设
	ContentTypeColumnComprehension = 4 //字段理解：  []ColumnComprehension{	ColumnInfo:{},Content:""}
	ContentTypeCatalogRelation     = 5 //联合其他字段的符合表达：  []CatalogRelation{	CatalogInfo:{},Content:""}
)

/*
var configuration = &Configuration{
	Note: "查看目录的信息项详情，并可「AI」生成字段理解",
	DimensionConfig: []*DimensionConfig{
		{
			Id:       "1",
			Name:     "时间维度",
			Category: businessInfo,
			Children: []*DimensionConfig{
				{
					Id:   "11",
					Name: "时间范围",
					Detail: &DimensionDetail{
						Required:    true,
						IsMulti:     false,
						MaxMulti:    1,
						ItemLength:  999,
						ContentType: ContentTypeDate,
						Note:        "",
					},
				},
				{
					Id:   "12",
					Name: "时间字段理解",
					Detail: &DimensionDetail{
						Required:    true,
						IsMulti:     true,
						MaxMulti:    50,
						ItemLength:  255,
						ContentType: ContentTypeColumnComprehension,
						Note:        "例如：根据“年报时间”可反映每年企业经营情况",
					},
				},
			},
		}, {
			Id:       "2",
			Name:     "空间维度",
			Category: businessInfo,
			Children: []*DimensionConfig{
				{
					Id:   "21",
					Name: "空间范围",
					Detail: &DimensionDetail{
						Required:    false,
						IsMulti:     false,
						MaxMulti:    1,
						ContentType: ContentTypeArrayText,
						Note:        "例如：包含全市各区县和部分省内数据",
					},
				},
				{
					Id:   "22",
					Name: "空间字段理解",
					Detail: &DimensionDetail{
						Required:    false,
						IsMulti:     true,
						MaxMulti:    50,
						ItemLength:  255,
						ContentType: ContentTypeColumnComprehension,
						Note:        "例如：根据“住所“可以反映投资自然人分布情况",
					},
				},
			},
		},
		{
			Id:       "3",
			Name:     "业务维度",
			Category: businessInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeColumnComprehension,
				Note:        "例如：通过“职务”可以分析出企业管理人员职务分布",
			},
		},
		{
			Id:       "4",
			Name:     "复合表达",
			Category: businessInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeCatalogRelation,
				Note:        "例如：联合【企业基本信息】体现自然人投资企业分布情况、投资企业的行业情况",
			},
		},
		{
			Id:       "5",
			Name:     "服务范围",
			Category: businessInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeArrayText,
				Note:        "例如：服务全市企业宏观管理，供市领导决策支撑",
			},
		},
		{
			Id:       "6",
			Name:     "服务领域",
			Category: businessInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     false,
				MaxMulti:    1,
				ItemLength:  999,
				ContentType: ContentTypeListed,
				Note:        "",
			},
		},
		{
			Id:       "7",
			Name:     "正面支撑",
			Category: valueInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeArrayText,
				Note:        "例如：企业被自然人投资情况检索、分析",
			},
		},
		{
			Id:       "8",
			Name:     "负面支撑",
			Category: valueInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeArrayText,
				Note:        "例如：企业经营情况是否良好",
			},
		},
		{
			Id:       "9",
			Name:     "保护控制",
			Category: valueInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeArrayText,
				Note:        "例如：限制迁出企业停止享受当地福利待遇享受",
			},
		},
		{
			Id:       "10",
			Name:     "促进推动",
			Category: valueInfo,
			Detail: &DimensionDetail{
				Required:    true,
				IsMulti:     true,
				MaxMulti:    50,
				ItemLength:  255,
				ContentType: ContentTypeArrayText,
				Note:        "例如：促进企业健康发展环境的培育、维护",
			},
		},
	},
	Choices: map[string][]Choice{
		"6": {
			{Id: 1, Name: "信用信息"},
			{Id: 2, Name: "金融信息"},
			{Id: 3, Name: "医疗健康"},
			{Id: 4, Name: "城市交通"},
			{Id: 5, Name: "文化旅游"},
			{Id: 6, Name: "行政执法"},
			{Id: 7, Name: "党的建设"},
		},
	},
}*/

func WireDefaultConfig() *Configuration {
	return WireConfig(&model.TDataComprehensionTemplate{
		Name:                      "默认模板",
		BusinessObject:            true,
		TimeRange:                 true,
		TimeFieldComprehension:    true,
		SpatialRange:              false,
		SpatialFieldComprehension: false,
		BusinessSpecialDimension:  true,
		CompoundExpression:        true,
		ServiceRange:              true,
		ServiceAreas:              true,
		FrontSupport:              true,
		NegativeSupport:           true,
		ProtectControl:            true,
		PromotePush:               true,
	})
}
func WireConfig(template *model.TDataComprehensionTemplate) *Configuration {
	return &Configuration{
		//Note: "查看目录的信息项详情，并可「AI」生成字段理解",
		Note: "查看目录的信息项详情",
		DimensionConfig: []*DimensionConfig{
			{
				Id:       "1",
				Name:     "业务对象",
				Category: businessObj,
				Children: []*DimensionConfig{
					{
						Id:       "11",
						Name:     "业务对象",
						Category: businessObj,
						Detail: &DimensionDetail{
							Required:    template.BusinessObject,
							IsMulti:     false,
							MaxMulti:    1,
							ItemLength:  255,
							ContentType: ContentTypeArrayText,
							Note:        "例如：业务对象",
						},
					},
				},
			},
			{
				Id:       "2",
				Name:     "业务指标",
				Category: businessMetric,
				Children: []*DimensionConfig{
					{
						Id:       "21",
						Name:     "时间维度",
						Category: businessMetric,
						Children: []*DimensionConfig{
							{
								Id:   "211",
								Name: "时间范围",
								Detail: &DimensionDetail{
									Required:    template.TimeRange,
									IsMulti:     false,
									MaxMulti:    1,
									ItemLength:  999,
									ContentType: ContentTypeDate,
									Note:        "",
								},
							},
							{
								Id:   "212",
								Name: "时间字段理解",
								Detail: &DimensionDetail{
									Required:    template.TimeFieldComprehension,
									IsMulti:     true,
									MaxMulti:    50,
									ItemLength:  255,
									ContentType: ContentTypeColumnComprehension,
									Note:        "例如：根据“年报时间”可反映每年企业经营情况",
								},
							},
						},
					}, {
						Id:       "22",
						Name:     "空间维度",
						Category: businessMetric,
						Children: []*DimensionConfig{
							{
								Id:   "221",
								Name: "空间范围",
								Detail: &DimensionDetail{
									Required:    template.SpatialRange,
									IsMulti:     false,
									MaxMulti:    1,
									ContentType: ContentTypeArrayText,
									Note:        "例如：包含全市各区县和部分省内数据",
								},
							},
							{
								Id:   "222",
								Name: "空间字段理解",
								Detail: &DimensionDetail{
									Required:    template.SpatialFieldComprehension,
									IsMulti:     true,
									MaxMulti:    50,
									ItemLength:  255,
									ContentType: ContentTypeColumnComprehension,
									Note:        "例如：根据“住所“可以反映投资自然人分布情况",
								},
							},
						},
					},
					{
						Id:       "23",
						Name:     "业务维度",
						Category: businessMetric,
						Detail: &DimensionDetail{
							Required:    template.BusinessSpecialDimension,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeColumnComprehension,
							Note:        "例如：通过“职务”可以分析出企业管理人员职务分布",
						},
					},
					{
						Id:       "24",
						Name:     "复合表达",
						Category: businessMetric,
						Detail: &DimensionDetail{
							Required:    template.CompoundExpression,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeCatalogRelation,
							Note:        "例如：联合【企业基本信息】体现自然人投资企业分布情况、投资企业的行业情况",
						},
					},
					{
						Id:       "25",
						Name:     "负面支撑",
						Category: businessMetric,
						Detail: &DimensionDetail{
							Required:    template.NegativeSupport,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeArrayText,
							Note:        "例如：企业经营情况是否良好",
						},
					},
					{
						Id:       "26",
						Name:     "正面支撑",
						Category: businessMetric,
						Detail: &DimensionDetail{
							Required:    template.FrontSupport,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeArrayText,
							Note:        "例如：企业被自然人投资情况检索、分析",
						},
					},
					{
						Id:       "27",
						Name:     "服务范围",
						Category: businessMetric,
						Detail: &DimensionDetail{
							Required:    template.ServiceRange,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeArrayText,
							Note:        "例如：服务全市企业宏观管理，供市领导决策支撑",
						},
					},
					{
						Id:       "28",
						Name:     "服务领域",
						Category: businessMetric,
						Detail: &DimensionDetail{
							Required:    template.ServiceAreas,
							IsMulti:     false,
							MaxMulti:    1,
							ItemLength:  999,
							ContentType: ContentTypeListed,
							Note:        "",
						},
					},
				},
			},
			{
				Id:       "3",
				Name:     "业务规则",
				Category: businessRule,
				Children: []*DimensionConfig{
					{
						Id:       "31",
						Name:     "保护控制",
						Category: businessRule,
						Detail: &DimensionDetail{
							Required:    template.ProtectControl,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeArrayText,
							Note:        "例如：限制迁出企业停止享受当地福利待遇享受",
						},
					},
					{
						Id:       "32",
						Name:     "促进推动",
						Category: businessRule,
						Detail: &DimensionDetail{
							Required:    template.PromotePush,
							IsMulti:     true,
							MaxMulti:    50,
							ItemLength:  255,
							ContentType: ContentTypeArrayText,
							Note:        "例如：促进企业健康发展环境的培育、维护",
						},
					},
				},
			},
		},
		Choices: map[string][]Choice{
			"28": {
				{Id: 1, Name: "信用信息"},
				{Id: 2, Name: "金融信息"},
				{Id: 3, Name: "医疗健康"},
				{Id: 4, Name: "城市交通"},
				{Id: 5, Name: "文化旅游"},
				{Id: 6, Name: "行政执法"},
				{Id: 7, Name: "党的建设"},
			},
		},
	}
}
func Config() *Configuration {
	return WireDefaultConfig()
}

/*
// Deprecated: (c *ComprehensionDomainImpl) ConfigMap
func ConfigMap() map[string]*DimensionConfig {
	c := make(map[string]*DimensionConfig)
	for _, dc := range configuration.DimensionConfig {
		c[dc.Id] = dc
		//当前只有两级，就简单点了
		if len(dc.Children) <= 0 {
			continue
		}
		for _, cc := range dc.Children {
			c[cc.Id] = cc
		}
	}
	return c
}

// Deprecated:
func ChoiceMap() map[string]map[int]Choice {
	results := make(map[string]map[int]Choice)
	for cId, cs := range configuration.Choices {
		cMap := make(map[int]Choice)
		for _, c := range cs {
			cMap[c.Id] = c
		}
		results[cId] = cMap
	}
	return results
}
*/
