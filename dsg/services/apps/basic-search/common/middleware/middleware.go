package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/hydra"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Middleware struct {
	hydra hydra.Hydra
}

func NewMiddleware(hydra hydra.Hydra) Middleware {
	return Middleware{hydra: hydra}
}

func (m Middleware) Auth() gin.HandlerFunc {
	return Auth(m.hydra)
}

func AbortResponse(c *gin.Context, err error) {
	var code = agerrors.Code(err)
	if err == nil {
		code = agcodes.CodeNotAuthorized
	}
	c.AbortWithStatusJSON(c.Writer.Status(), ginx.HttpError{
		Code:        code.GetErrorCode(),
		Description: code.GetDescription(),
		Solution:    code.GetSolution(),
		Cause:       code.GetCause(),
		Detail:      code.GetErrorDetails(),
	})
}
