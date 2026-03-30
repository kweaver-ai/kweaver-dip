package dwh_auth_request_form

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/form_validator"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"net/http"
)

// QueryApplicantDWHAuthReqFormInfo 根据ID列表查询当前用户改视图的数仓申请单状态，给出当前用户对应资源的读取状态，申请状态
func (ctrl *Controller) QueryApplicantDWHAuthReqFormInfo(c *gin.Context) {
	req := &dto.UserDataAuthRequestListArgs{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}

	result, err := ctrl.service.ListUserData(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// TestAuditMsg 根据ID列表查询当前用户改视图的数仓申请单状态，给出当前用户对应资源的读取状态，申请状态
func (ctrl *Controller) TestAuditMsg(c *gin.Context) {
	req := &dto.TestAuditMsgReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}

	err := ctrl.service.TestAuditMsg(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, nil)
}
