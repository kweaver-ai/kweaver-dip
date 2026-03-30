package anydata_search

// import (
// 	"encoding/json"
// )

// /*
// 	全文搜索请求体
// 	{
// 	  "page": 1,
// 	  "size": 0,
// 	  "query": "access_log",
// 	  "search_config": [],
// 	  "kg_id": "21",
// 	  "matching_rule": "portion",
// 	  "matching_num": 20
// 	}
// */

// func NewADLineageFulltextReqBody(kgID, query string, config []*SearchConfig) []byte {
// 	requestMap := map[string]any{
// 		"kg_id":         kgID,
// 		"query":         query,
// 		"page":          1,
// 		"size":          0,
// 		"matching_rule": "portion",
// 		"matching_num":  20,
// 	}
// 	if len(config) > 0 {
// 		requestMap["search_config"] = config
// 	}

// 	requestBody, _ := json.Marshal(requestMap)
// 	return requestBody
// }

// type SearchConfig struct {
// 	Tag        string        `json:"tag"`
// 	Properties []*SearchProp `json:"properties"`
// }

// type SearchProp struct {
// 	Name      string `json:"name"`      // f_db_type f_tb_name f_db_name
// 	Operation string `json:"operation"` // eq
// 	OpValue   string `json:"op_value"`
// }

// func NewADLineageFulltextResp(body any) *ADLineageFulltextResp {
// 	resp := ADLineageFulltextResp{}
// 	bytes, _ := json.Marshal(body)
// 	_ = json.Unmarshal(bytes, &resp)
// 	return &resp
// }

// type ADLineageFulltextResp struct {
// 	Res *FulltextSearchResp `json:"res"`
// }

// type FulltextSearchResp struct {
// 	Count  int            `json:"count"`  // tag总数
// 	Result []*TagInfoResp `json:"result"` // 结果列表
// }

// type TagInfoResp struct {
// 	Alias    string              `json:"alias"`   // 别名
// 	Color    string              `json:"color"`   // 颜色
// 	Icon     string              `json:"icon"`    // 图标
// 	Tag      string              `json:"tag"`     // 点的类型
// 	Vertexes []*FulltextVertexes `json:"vertexs"` // 点的列表
// }

// type FulltextVertexes struct {
// 	ID              string            `json:"id"`
// 	Color           string            `json:"color"`
// 	Icon            string            `json:"icon"`
// 	DefaultProperty *Property         `json:"default_property"`
// 	Tags            []string          `json:"tags"`
// 	Properties      []*PropertiesInfo `json:"properties"` //实体属性
// }
