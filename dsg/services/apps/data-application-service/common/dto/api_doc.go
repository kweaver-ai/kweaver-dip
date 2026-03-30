package dto

import "bytes"

// ExportAPIDocReq API 文档导出请求
//
// 使用场景：
// 1. 单个PDF下载：service_ids传入1个ID，app_id可选（用于文件名前缀）
// 2. 批量ZIP下载：service_ids传入多个ID，app_id必填
// 3. 应用级批量下载：service_ids为空，app_id必填（自动查询该应用下所有接口）
//
// 文件名规则：
// - 有app_id：应用名称_接口名称_时间戳.pdf
// - 无app_id：接口名称_时间戳.pdf
//
// 允许空 body；字段均为可选筛选条件
type ExportAPIDocReq struct {
	ExportAPIDocReqBody `param_type:"body"`
}

type ExportAPIDocReqBody struct {
	ServiceIDs []string `json:"service_ids" form:"service_ids" binding:"omitempty,dive,uuid" example:"019407b3-d158-7177-a0c8-0da2f2683c50" description:"接口ID列表：传入1个ID时下载单个PDF文件，传入多个ID时下载ZIP压缩包；批量下载时如果为空，则根据app_id查询该应用下所有接口"`
	AppID      string   `json:"app_id" form:"app_id" binding:"omitempty,uuid" example:"019407b3-d158-7177-a0c8-0da2f2683c50" description:"应用ID：用于生成文件名前缀，单个下载时可选，批量下载时必填"`
}

// ExportAPIDocResp API 文档导出响应
// Buffer 为 PDF 二进制内容；FileName 为建议文件名
type ExportAPIDocResp struct {
	Buffer   *bytes.Buffer `json:"buffer"`
	FileName string        `json:"file_name"`
}
