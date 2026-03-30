package dto

type ServiceTopData struct {
	ServiceID   string `json:"service_id"`   // 接口ID
	ServiceName string `json:"service_name"` // 接口名称
	Num         uint64 `json:"num"`          // 统计数量
}

type ServiceTopDataReq struct {
	TopNum int `form:"top_num,default=5" binding:"omitempty,min=1,max=10"` // 要获取的top数据数量, 默认 5
}

type ServiceTopDataRes struct {
	ApplyNum   []*ServiceTopData `json:"apply_num"`   // 申请量
	PreviewNum []*ServiceTopData `json:"preview_num"` // 访问量
}

type ServiceAssetCountReq struct {
}

type ServiceAssetCountRes struct {
	Available int64 `json:"available"` // 可用资产数量
	Auditing  int64 `json:"auditing"`  // 申请中资产数量
}

type QueryDomainServiceArgs struct {
	Flag       string   `json:"flag" binding:"required,oneof=all count total"` //传all，返回所有主题域关联的Service数量；传count，只返回下面ID对应的主题域关联数量，传total，只返回已发布的Service总量
	IsOperator bool     `json:"is_operator"`                                   //如果为true，表示该用户是数据运营角色或者数据开发角色，这时展示所有的接口数据
	ID         []string `json:"id"`                                            //主题域ID
}

type DomainServiceRelation struct {
	SubjectDomainID    string `json:"subject_domain_id"`    //主题域ID
	RelationServiceNum int64  `json:"relation_service_num"` //该主题域ID下关联的Service的数量
}

type QueryDomainServicesResp struct {
	Total       int64                   `json:"total"`        //QueryDomainServiceArgs的ID数组为空，返回total
	RelationNum []DomainServiceRelation `json:"relation_num"` //传参不为空，返回每个主题域关联的Service的数量
}
