package impl

type ObjectIDReqParam struct {
	IDS  []string `json:"ids" form:"ids" binding:"required,gt=0,unique,dive,uuid"`
	Type string   `json:"type" form:"type" binding:"required,oneof=business_system business_matters"`
}
