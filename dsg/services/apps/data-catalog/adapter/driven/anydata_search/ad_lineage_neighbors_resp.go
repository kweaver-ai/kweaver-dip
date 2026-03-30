package anydata_search

// import (
// 	"encoding/json"
// )

// func NewADLineageNeighborsReqBody(kgID, vid string, steps int) []byte {
// 	requestMap := map[string]any{
// 		"id":        kgID,
// 		"steps":     steps,
// 		"direction": "reverse",
// 		"vids": []string{
// 			vid,
// 		},
// 		"page":    1,
// 		"size":    -1,
// 		"filters": []string{},
// 	}

// 	requestBody, _ := json.Marshal(requestMap)
// 	return requestBody
// }

// func NewADLineageNeighborsResp(body any) *ADLineageNeighborsResp {
// 	resp := ADLineageNeighborsResp{}
// 	bytes, _ := json.Marshal(body)
// 	_ = json.Unmarshal(bytes, &resp)
// 	return &resp
// }

// type ADLineageNeighborsResp struct {
// 	Res *LineageNeighborsResp `json:"res"`
// }

// type LineageNeighborsResp struct {
// 	VCount  int                `json:"v_count"`  // 点的数量
// 	VResult []*NeighborsVGroup `json:"v_result"` // 点的结果
// }

// type NeighborsVGroup struct {
// 	Alias    string              `json:"alias"`    // 别名
// 	Color    string              `json:"color"`    // 颜色
// 	Icon     string              `json:"icon"`     // 图标
// 	Tag      string              `json:"tag"`      // 点的类型
// 	Vertexes []*NeighborsVResult `json:"vertexes"` // 点的列表
// }

// type NeighborsVResult struct {
// 	DefaultProperty *Property         `json:"default_property"` // 属性
// 	ID              string            `json:"id"`               // 点的id
// 	InEdges         []string          `json:"in_edges"`         // 进边列表
// 	OutEdges        []string          `json:"out_edges"`        // 出边列表
// 	Properties      []*PropertiesInfo `json:"properties"`       //属性列表
// 	Tags            []string          `json:"tags"`             // 实体tag
// }

// type Property struct {
// 	A string `json:"a"` // 属性别名 alias缩写
// 	N string `json:"n"` // 属性字段名 name缩写
// 	V string `json:"v"` // 属性值 value缩写
// }

// type PointInfo struct {
// 	Color      string            `json:"color"`       // 实体颜色
// 	DefaultTag []*Property       `json:"default_tag"` //属性列表
// 	Icon       string            `json:"icon"`        // 图标
// 	ID         string            `json:"id"`          // 实体id
// 	Properties []*PropertiesInfo `json:"properties"`  //实体属性
// 	Tags       []string          `json:"tags"`        // 点的类型
// }

// type PropertiesInfo struct {
// 	Props []*Prop `json:"props"` // 属性集合
// 	Tag   string  `json:"tag"`   // 实体类名
// }

// type Prop struct {
// 	Alias string `json:"alias"` // 属性显示名
// 	Name  string `json:"name"`  // 属性名
// 	Type  string `json:"type"`  // 属性类型
// 	Value string `json:"value"` // 属性值
// }
