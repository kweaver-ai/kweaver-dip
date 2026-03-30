package data_assets

type DataAssetsResp struct {
	BusinessDomainCount      int32 `json:"business_domain_count" example:"3"`        // 业务域数量
	SubjectDomainCount       int32 `json:"subject_domain_count" example:"4"`         // 主题域数量
	BusinessObjectCount      int32 `json:"business_object_count" example:"10"`       // 业务对象数量
	BusinessLogicEntityCount int32 `json:"business_logic_entity_count" example:"20"` // 已发布的业务逻辑实体数量
	BusinessAttributesCount  int32 `json:"business_attributes_count" example:"95"`   // 业务属性数量
}

type BusinessLogicEntityInfo struct {
	BusinessDomainID         string `json:"business_domain_id" example:"30cb4f67-8859-4979-aa9e-4079714f4ce6"` // 业务域id
	BusinessDomainName       string `json:"business_domain_name" example:"业务域"`                                // 业务域名称
	BusinessLogicEntityCount int32  `json:"business_logic_entity_count" example:"3"`                           // 已发布的业务逻辑实体数量
}

type DepartmentBusinessLogicEntityInfo struct {
	DepartmentID             string `json:"department_id"  example:"30cb4f67-8859-4979-aa9e-4079714f4ce6"` // 所属部门id
	DepartmentName           string `json:"department_name"  example:"部门"`                                 // 所属部门名称
	BusinessLogicEntityCount int32  `json:"business_logic_entity_count"  example:"3"`                      // 已发布的业务逻辑实体数量
}

type StandardizedRateResp struct {
	BusinessDomainID   string `json:"business_domain_id" example:"30cb4f67-8859-4979-aa9e-4079714f4ce6"` // 业务域id
	BusinessDomainName string `json:"business_domain_name"  example:"业务域"`                               // 业务域名称
	StandardizedFields int32  `json:"standardized_fields"  example:"6"`                                  // 已标准化字段数
	TotalFields        int32  `json:"total_fields"  example:"20"`                                        // 总字段数
}

type CountInfo struct {
	BusinessDomainCount int32 `json:"business_domain_count"`
	SubjectDomainCount  int32 `json:"subject_domain_count"`
	BusinessObjectCount int32 `json:"business_object_count"`
}
