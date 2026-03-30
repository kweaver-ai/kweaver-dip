package data_catalog

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"

type dataCatalogSearch struct {
	UpdateCycle      []int    `json:"update_cycle,omitempty" binding:"omitempty,unique,dive,min=1,max=8" example:"7"` // 更新频率 1实时 2每日 3每周 4每月 5每季度 6每半年 7每年 8其他
	SharedType       []int    `json:"shared_type,omitempty" binding:"omitempty,unique,dive,oneof=1 2 3" example:"2"`  // 共享条件 1 无条件共享 2 有条件共享 3 不予共享
	DataRange        []int    `json:"data_range,omitempty" binding:"omitempty,unique,dive,oneof=1 2 3" example:"2"`   // 数据范围 1全市 2市直 3区县
	BusinessObjectID []string `json:"business_object_id,omitempty" binding:"omitempty"`                               // 业务对象ID
	// StartUpdateTime  string   `json:"start_update_time"`                                                              // 目录开始更新时间
	// EndUpdateTime    string   `json:"end_update_time"`                                                                // 目录结束更新时间
	OnlyFileResource string `json:"only_file_resource"` // 仅挂接文件资源的目录
}

// 普通用户搜索的字段
type DataCatalogSearchFilter struct {

	//基本的搜索
	common.Filter

	dataCatalogSearch
}

// 运营工程师和开发工程师搜索的字段
type DataCatalogSearchFilterForOper struct {

	//基本的搜索
	common.FilterForOper

	dataCatalogSearch
}

type NextFlag []string

// 用于过滤未分类、不属于任何主题域的数据资源
const UncategorizedSubjectDomainID = "Uncategorized"

// 用于过滤未分类、不属于任何部门的数据资源
const UncategorizedDepartmentID = "Uncategorized"
