package entity

type VerifyNameRepeatReq struct {
	Id   uint64 `json:"id" form:"id" binding:"omitempty,min=1" example:"1"`
	Name string `json:"name" form:"name" binding:"required,VerifyNameStandard" example:"数据资源目录名称"`
}

type CatalogID struct {
	CatalogID uint64 `json:"catalogID" form:"catalogID" uri:"catalogID" binding:"required,gt=0"`
}
