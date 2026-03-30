package dto

type SubjectDomainListReq struct{}

type SubjectDomain struct {
	Id               string   `json:"id"`                 // 对象id
	Name             string   `json:"name"`               // 对象名称
	Description      string   `json:"description"`        // 描述
	Type             string   `json:"type"`               // 对象类型
	PathId           string   `json:"path_id"`            // 路径id
	PathName         string   `json:"path_name"`          // 路径名称
	Owners           []string `json:"owners"`             // 数据owner
	CreatedBy        string   `json:"created_by"`         // 创建人
	CreatedAt        int64    `json:"created_at"`         // 创建时间
	UpdatedBy        string   `json:"updated_by"`         // 修改人
	UpdatedAt        int64    `json:"updated_at"`         // 修改时间
	ChildCount       int      `json:"child_count"`        // 子对象数量
	SecondChildCount int      `json:"second_child_count"` // 第二层子对象数量 only for BusinessObject and BusinessActivity
}

type SubjectDomainListRes struct {
	PageResult[SubjectDomain]
}
