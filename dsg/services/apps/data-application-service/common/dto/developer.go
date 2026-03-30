package dto

type Developer struct {
	ID            string `json:"id" uri:"id" binding:"omitempty"`                              // 开发商id
	Name          string `json:"name" binding:"omitempty,VerifyDescription,max=128"`           // 开发商名称
	ContactPerson string `json:"contact_person" binding:"omitempty,VerifyDescription,max=128"` // 联系人
	ContactInfo   string `json:"contact_info" binding:"omitempty,VerifyDescription,max=128"`   // 联系方式
	CreateTime    string `json:"create_time,omitempty"`                                        // 创建时间
	UpdateTime    string `json:"update_time,omitempty"`                                        // 更新时间
}

type DeveloperCreateReq struct {
	Developer
}

type DeveloperGetReq struct {
	Id string `json:"id" uri:"id" binding:"required,uuid"`
}

type DeveloperGetRes struct {
	Developer
}

type DeveloperListReq struct {
	PageInfo
	Name string `json:"name" form:"name" binding:"omitempty,VerifyDescription"`
}

type DeveloperListRes struct {
	PageResult[Developer]
}

type DeveloperUpdateReq struct {
	DeveloperUpdateUriReq
	DeveloperUpdateBodyReq
}

type DeveloperUpdateUriReq struct {
	Id string `json:"id" uri:"id" binding:"required,uuid"`
}

type DeveloperUpdateBodyReq struct {
	Developer
}

type DeveloperDeleteReq struct {
	Id string `json:"id" uri:"id" binding:"required,uuid"`
}
