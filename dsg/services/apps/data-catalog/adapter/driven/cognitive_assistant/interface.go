package cognitive_assistant

import "context"

type CogAssistant interface {
	CogSearchBak(ctx context.Context, keyword string, size int) (*CogSearchBakResp, error)
	//CogSearch(ctx context.Context, req *CogSearchReq) (*CogSearchResp, error)
	SubGraph(ctx context.Context, req *SubGraphReq) (*SubGraphResp, error)
}

type CogSearchBakResp struct {
	Data struct {
		Entities []struct {
			Starts []struct {
				Synonyms []struct {
					Source  string   `json:"source"`
					Synonym []string `json:"synonym"`
				} `json:"synonyms"`
				Relation string `json:"relation"`
				Type     string `json:"type"`
				Name     string `json:"name"`
				Hit      struct {
					Keys  []string `json:"keys"`
					Prop  string   `json:"prop"`
					Alias string   `json:"alias"`
					Value string   `json:"value"`
				} `json:"hit"`
			} `json:"starts"`
			Entity struct {
				AssetType       string `json:"asset_type"`
				Type            string `json:"type"`
				DataCatalogName string `json:"datacatalogname"`
				DataCatalogID   string `json:"datacatalogid"`
				Description     string `json:"description"`
				Code            string `json:"code"`
			} `json:"entity"`
			Score int64 `json:"score"`
		} `json:"entities"`
		Answer string `json:"answer"`
	} `json:"data"`
}

/*
type CogSearchReq struct {
	Query string `json:"query"`           // 关键字查询，字符无限制
	Limit int    `json:"limit,omitempty"` // 要获取到的记录条数

	AssetType []string `json:"asset_type,omitempty"`

	//NextFlag string `json:"next_flag"` // 分页参数，从该参数后面开始获取数据
	LastScore float64 `json:"last_score,omitempty"` // 最后一个结果的分数
	LastID    string  `json:"last_id,omitempty"`    // 最后一个结果的vid

	Stopwords    []string `json:"stopwords,omitempty"`     // 智能搜索对象，停用词
	StopEntities []string `json:"stop_entities,omitempty"` // 智能搜索维度，停用的实体

	DataKind    []int `json:"data_kind,omitempty"`    // 基础信息分类
	UpdateCycle []int `json:"update_cycle,omitempty"` // 更新频率
	SharedType  []int `json:"shared_type,omitempty"`  // 共享条件

	StartTime       int64             `json:"start_time,omitempty"` // 开始时间
	EndTime         int64             `json:"end_time,omitempty"`   // 结束时间
	StopEntityInfos []*StopEntityInfo `json:"stop_entity_infos,omitempty"`
}

type StopEntityInfo struct {
	ClassName string   `json:"class_name,omitempty"`
	Names     []string `json:"names,omitempty"`
}

type CogSearchResp struct {
	Data struct {
		Entities  []*EntryInfo `json:"entities"`
		QueryCuts []struct {
			Source     string   `json:"source"`
			Synonym    []string `json:"synonym"`
			IsStopword bool     `json:"is_stopword"`
		} `json:"query_cuts"`
		WordCountInfos []struct {
			Word      string `json:"word"`
			IsSynonym bool   `json:"isSynonym"`
			Count     int    `json:"count"`
		} `json:"word_count_infos"`
		ClassCountInfos []struct {
			ClassName        string `json:"class_name"`
			Alias            string `json:"alias"`
			Count            int    `json:"count"`
			EntityCountInfos []struct {
				Alias string `json:"alias"`
				Count int    `json:"count"`
			} `json:"entity_count_infos"`
		} `json:"class_count_infos"`
		Total int64 `json:"total"`
	} `json:"data"`
}
*/

type EntryInfo struct {
	Starts []struct {
		ClassName string `json:"class_name"`
		Alias     string `json:"alias"`
		Name      string `json:"name"`
		Hit       struct {
			Prop  string   `json:"prop"`
			Value string   `json:"value"`
			Keys  []string `json:"keys"`
			Alias string   `json:"alias"`
		} `json:"hit"`
	} `json:"starts"`
	SubGraph struct {
		Starts []string `json:"starts"`
		End    string   `json:"end"`
	} `json:"subgraph"`
	Entity struct {
		VID             string `json:"vid"`
		Type            string `json:"type"`
		DataCatalogName string `json:"datacatalogname"`
		DataCatalogID   string `json:"datacatalogid"`
		Description     string `json:"description"`
		AssetType       string `json:"asset_type"`
		Code            string `json:"code"`
		MetadataSchema  string `json:"metadata_schema"`
		DataSource      string `json:"data_source"`
		DataOwner       string `json:"data_owner"`
		PublishedAt     string `json:"published_at"`
		Department      string `json:"department"`
	} `json:"entity"`
	Score     float64  `json:"score"`
	TotalKeys []string `json:"total_keys"`
}

type SubGraphReq struct {
	ServiceName string   `json:"service_name"`
	End         string   `json:"end"`
	Starts      []string `json:"starts"`
	DataVersion string   `json:"data_version"`
}

type SubGraphResp struct {
	Res struct {
		Edges []*Edge         `json:"edges"`
		Nodes []*SubGraphNode `json:"nodes"`
		Paths []struct {
			Edges []string `json:"edges"`
			Nodes []string `json:"nodes"`
		} `json:"paths"`
	} `json:"res"`
}

type Edge struct {
	Alias      string   `json:"alias"`
	ClassName  string   `json:"class_name"`
	Color      string   `json:"color"`
	ID         string   `json:"id"`
	Properties []string `json:"properties"`
	Source     string   `json:"source"`
	Target     string   `json:"target"`
}

type SubGraphNode struct {
	Alias           string `json:"alias"`
	ClassName       string `json:"class_name"`
	Color           string `json:"color"`
	DefaultProperty struct {
		Alias string `json:"alias"`
		Name  string `json:"name"`
		Value string `json:"value"`
	} `json:"default_property"`
	Icon       string `json:"icon"`
	ID         string `json:"id"`
	Properties []struct {
		Props []struct {
			Alias    string `json:"alias"`
			Checked  bool   `json:"checked"`
			Disabled bool   `json:"disabled"`
			Name     string `json:"name"`
			Type     string `json:"type"`
			Value    string `json:"value"`
		} `json:"props"`
		Tag string `json:"tag"`
	} `json:"properties"`
}
