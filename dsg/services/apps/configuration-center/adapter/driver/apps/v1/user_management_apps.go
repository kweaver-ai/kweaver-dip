package apps

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// UserManagementAppsList  godoc
// @Summary     查询proton的应用列表
// @Description AppsList Description
// @Accept      plain/text
// @Produce     application/json
// @Tags        应用授权
// @Param       offset    query    int     	false "当前页码，默认1，大于等于1"                    default(1)                    minimum(1)
// @Param       limit     query    int     	false "每页条数，默认10，大于等于1"                   default(20)                   minimum(1)
// @Param       sort      query    string  	false "排序类型，默认按date_created排序，可选date_updated, name" Enums(date_created, name) default(date_created)
// @Param       direction query    string  	false "排序方向，默认desc降序，可选asc升序"             Enums(desc, asc)              default(desc)
// @Param       keyword   query    string  	false "应用名称，支持模糊查询"
// @Success     200       {object} apps.ListRes "desc"
// @Failure     400       {object} rest.HttpError
// @Router      /user-management/apps [get]
func (s *Service) UserManagementAppsList(c *gin.Context) {
	req := &apps.UserManagementAppsListReq{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	args := &user_management.AppListArgs{
		Limit:     req.Limit,
		Offset:    req.Offset,
		Direction: req.Direction,
		Sort:      req.Sort,
		Keyword:   req.Keyword,
	}
	args.Offset = args.Offset - 1
	resp, err := s.userManagementDriven.GetUserManagementAppList(c, args)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
