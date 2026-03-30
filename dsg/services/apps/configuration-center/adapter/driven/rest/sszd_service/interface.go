package sszd_service

import "context"

type SszdService interface {
	CreateProvinceApp(ctx context.Context, req *AppReq) (resp *CreateProvinceAppResp, err error)
	UpdateProvinceApp(ctx context.Context, id uint64, req *AppReq) (resp *IDResp, err error)
	GetProvinceAppByID(ctx context.Context, id uint64) (*AppInfo, error)
}

type AppReq struct {
	Name         string  `json:"name"`          // 应用名称
	Description  *string `json:"description"`   // 应用描述
	OrgCode      string  `json:"org_code"`      // 应用系统所属组织机构ID
	OrgName      string  `json:"org_name"`      // 应用系统所属组织机构编码
	ProvinceUrl  string  `json:"province_url"`  // 对外提供url地址
	ProvinceIp   string  `json:"province_ip"`   // 对外提供ip地址
	ContactName  string  `json:"contact_name"`  // 联系人姓名
	ContactPhone string  `json:"contact_phone"` // 联系人联系方式
	AreaName     string  `json:"area_name"`     // 应用领域ID
	RangeName    string  `json:"range_name"`    // 应用范围ID
	DeployPlace  *string `json:"deploy_place"`  // 部署地点
	DepartmentID string  `json:"department_id"` // 选择部门
}

type IDResp struct {
	ID uint64 `json:"id,string"`
}

type CreateProvinceAppResp struct {
	ID           uint64 `json:"id,string"`
	AppID        string `json:"app_id"`
	AccessKey    string `json:"access_key"`
	AccessSecret string `json:"access_secret"`
}

type AppInfo struct {
	ID           uint64 `json:"id,string"`     // 雪花ID
	Name         string `json:"name"`          // 应用名称
	Description  string `json:"description"`   // 应用描述
	OrgCode      string `json:"org_code"`      // 应用系统所属组织机构ID
	OrgName      string `json:"org_name"`      // 应用系统所属组织机构编码
	ProvinceUrl  string `json:"province_url"`  // 对外提供url地址
	ProvinceIp   string `json:"province_ip"`   // 对外提供ip地址
	ContactName  string `json:"contact_name"`  // 联系人姓名
	ContactPhone string `json:"contact_phone"` // 联系人联系方式
	AreaName     int    `json:"area_name"`     // 应用领域ID
	RangeName    int    `json:"range_name"`    // 应用范围ID
	DeployPlace  string `json:"deploy_place"`  // 部署地点
	AppID        string `json:"app_id"`        // 省平台注册ID
	AccessKey    string `json:"access_key"`    // 省平台应用key
	AccessSecret string `json:"access_name"`   // 省平台应用secret
	DepartmentID string `json:"department_id"` // 选择部门
	// DepartmentID string `json:"department_id"` // 选择部门
}
