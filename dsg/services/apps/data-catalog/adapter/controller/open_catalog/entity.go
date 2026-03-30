package entity

type VerifyNameRepeatReq struct {
	Id   uint64 `json:"id" form:"id" binding:"omitempty,min=1"`
	Name string `json:"name" form:"name" binding:"required,VerifyNameStandard"`
}

type CatalogID struct {
	CatalogID uint64 `json:"catalogID" form:"catalogID" uri:"catalogID" binding:"required,gt=0"`
}
