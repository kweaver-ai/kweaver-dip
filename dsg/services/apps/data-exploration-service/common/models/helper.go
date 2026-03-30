package models

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

func HttpContextWithTimeout(c *gin.Context, timeouts ...time.Duration) (context.Context, context.CancelFunc) {
	if len(timeouts) > 1 {
		log.Warn("too many timeouts")
	}

	timeout := constant.DefaultHttpRequestTimeout
	if len(timeouts) > 0 {
		timeout = timeouts[0]
	}

	return context.WithTimeout(c, timeout)
}
