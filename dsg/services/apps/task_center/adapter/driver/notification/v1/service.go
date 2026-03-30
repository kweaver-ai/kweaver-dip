package notification

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/notification"
	asset_portal_v1 "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1"
	asset_portal_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1/frontend"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	Notification notification.Interface
}

func New(notification notification.Interface) *Service {
	return &Service{Notification: notification}
}

// List 获取当前用户收到的通知
//
//	@Summary	获取当前用户收到的通知
//	@Tags		用户通知
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string								true	"token"
//	@Success	200				{object}	asset_portal_v1.NotificationList	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/asset-portal/v1/notifications [GET]
func (s *Service) List(c *gin.Context) {
	// 解析 Query 参数
	opts := &asset_portal_v1.NotificationListOptions{}
	if err := opts.UnmarshalQuery(c.Request.URL.Query()); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameter))
		return
	}

	// 获取发起请求的用户信息
	u, err := user_util.ObtainUserInfo(c)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetUserInfoFailed))
		return
	}

	// TODO: Completion
	if opts.Limit == 0 {
		opts.Limit = 10
	}
	if opts.Offset == 0 {
		opts.Offset = 1
	}

	// TODO: Validation

	result, err := s.Notification.List(c, uuid.MustParse(u.ID), opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// ReadAll 标记当前用户收到的所有通知为已读
//
//	@Summary	标记当前用户收到的所有通知为已读
//	@Tags		用户通知
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header	string	true	"token"
//	@Success	200
//	@Failure	400	{object}	rest.HttpError	"失败响应参数"
//	@Router		/api/asset-portal/v1/notifications [PUT]
func (s *Service) ReadAll(c *gin.Context) {
	// 获取当前用户
	u, err := user_util.ObtainUserInfo(c)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetUserInfoFailed))
		return
	}

	// TODO: Completion

	// TODO: Validation

	if err := s.Notification.ReadAll(c, uuid.MustParse(u.ID)); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// 为了使 swag 能找解析 asset_portal_v1_frontend
var _ asset_portal_v1_frontend.Notification

// Get 获取用户收到的一条通知
//
//	@Summary	获取用户收到的一条通知
//	@Tags		用户通知
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string									true	"token"
//	@Param		id				path		string									true	"通知 ID"
//	@Success	200				{object}	asset_portal_v1_frontend.Notification	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError							"失败响应参数"
//	@Router		/api/asset-portal/v1/notifications/{id} [GET]
func (s *Service) Get(c *gin.Context) {
	// 获取 path 参数
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameter))
		return
	}

	// 获取当前用户
	u, err := user_util.ObtainUserInfo(c)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetUserInfoFailed))
		return
	}

	result, err := s.Notification.Get(c, uuid.MustParse(u.ID), id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// Read 标记当前用户收到的一条通知为已读
//
//	@Summary	标记当前用户收到的一条通知为已读
//	@Tags		用户通知
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string									true	"token"
//	@Param		id				path		string									true	"通知 ID"
//	@Success	200				{object}	asset_portal_v1_frontend.Notification	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError							"失败响应参数"
//	@Router		/api/asset-portal/v1/notifications/{id} [PUT]
func (s *Service) Read(c *gin.Context) {
	// 获取 path 参数
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameter))
		return
	}

	// 获取当前用户
	u, err := user_util.ObtainUserInfo(c)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetUserInfoFailed))
		return
	}

	if err := s.Notification.Read(c, uuid.MustParse(u.ID), id); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, nil)
}
