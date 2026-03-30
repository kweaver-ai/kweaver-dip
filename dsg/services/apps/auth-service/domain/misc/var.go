package misc

import (
	_ "embed"
	"encoding/base64"
	"fmt"
	api_data_application_service "github.com/kweaver-ai/idrm-go-common/api/data_application_service/v1"
)

const mediaTypeImageSVGAsXML string = "image/svg+xml"

// AuditIconAPI 接口的审核图标
//
//go:embed api.svg
var AuditIconAPI []byte

// ApiWorkflowAuditIconString 返回接口审核的图标字符串
func ApiWorkflowAuditIconString() string {
	return fmt.Sprintf("data:%s;base64,%s", mediaTypeImageSVGAsXML, base64.StdEncoding.EncodeToString(AuditIconAPI))
}

// ApiWorkflowTextFor 返回接口审核的文本说明
func ApiWorkflowTextFor(s *api_data_application_service.Service) string {
	return fmt.Sprintf("接口名称：%s", s.ServiceInfo.ServiceName)
}

var (
	// 原子API的审核图标
	//go:embed atomic.svg
	AuditIconAPIAtomicSVG []byte
	// 衍生API的审核图标
	//go:embed derived.svg
	AuditIconAPIDerivedSVG []byte
	// 复合API的审核图标
	//go:embed composite.svg
	AuditIconAPICompositeSVG []byte
)

var (
	// 原子指标的审核图标
	//go:embed atomic.svg
	AuditIconIndicatorAtomicSVG []byte
	// 衍生指标的审核图标
	//go:embed derived.svg
	AuditIconIndicatorDerivedSVG []byte
	// 复合指标的审核图标
	//go:embed composite.svg
	AuditIconIndicatorCompositeSVG []byte
)
