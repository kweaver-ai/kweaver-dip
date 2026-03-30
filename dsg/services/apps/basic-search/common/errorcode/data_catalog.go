package errorcode

import "github.com/kweaver-ai/dsg/services/apps/basic-search/common/constant"

func init() {
	registerErrorCode(dataCatalogErrorMap)
}

const (
	dataCatalogPre = constant.ServiceName + "." + dataCatalogModelName + "."
)

var dataCatalogErrorMap = errorCode{}
