package units

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/session/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func HttpContextWithTimeout(c *gin.Context, timeouts ...time.Duration) (context.Context, context.CancelFunc) {
	if len(timeouts) > 1 {
		log.Warn("too many timeouts")
	}

	timeout := constant.DefaultHttpRequestTimeout
	if len(timeouts) > 0 {
		timeout = timeouts[0]
	}

	return context.WithTimeout(c.Request.Context(), timeout)
}
func TransAnyStruct(a any) map[string]any {
	result := make(map[string]any)
	bts, err := json.Marshal(a)
	if err != nil {
		return result
	}
	json.Unmarshal(bts, &result)
	return result
}

// FindTagName find tag value in structField c
func FindTagName(c reflect.StructField, tagName string) string {
	tagValue := c.Tag.Get(tagName)
	ts := strings.Split(tagValue, ",")
	if tagValue == "" || tagValue == "omitempty" || ts[0] == "" {
		return c.Name
	}
	if tagValue == "-" {
		return ""
	}
	if len(ts) == 1 {
		return tagValue
	}
	return ts[0]
}

// 设配ipv6的函数
func ParseHost(host string) string {
	if strings.Contains(host, ":") {
		return fmt.Sprintf("[%s]", host)
	}
	return host
}
