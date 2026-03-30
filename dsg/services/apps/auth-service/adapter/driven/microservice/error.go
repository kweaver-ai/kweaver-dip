package microservice

import (
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

const (
	// Schema 不存在
	ErrCode_VirtualizationEngine_SchemaNotExist = "VirtualizationEngine.SchemaNotExist."
	// Table 不存在
	ErrCode_VirtualizationEngine_TableNotExist = "VirtualizationEngine.TableNotExist."

	ErrCode_DataView_FormView_FormViewIdNotExist = "DataView.FormView.FormViewIdNotExist"
)

// ConvertUpstreamError 转换上游返回的结构化错误转
func ConvertUpstreamError(err *ginx.HttpError) error {
	switch err.Code {
	case ErrCode_DataView_FormView_FormViewIdNotExist:
		err.Description = "逻辑视图出错，请检查逻辑视图配置或更换逻辑视图"
	case ErrCode_VirtualizationEngine_SchemaNotExist:
		err.Description = "数据库配置出错，请联系管理员"
	case ErrCode_VirtualizationEngine_TableNotExist:
		err.Description = "逻辑视图出错，请联系管理员"
	default:
		// no change
	}
	return agerrors.NewCode(agcodes.New(err.Code, err.Description, err.Cause, err.Solution, err.Detail, ""))
}
