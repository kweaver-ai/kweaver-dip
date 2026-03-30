package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/permission"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Service struct {
	Permission permission.Domain
}

func NewService(p permission.Domain) *Service {
	return &Service{Permission: p}
}

// 获取指定权限
func (s *Service) Get(c *gin.Context) {
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation

	got, err := s.Permission.Get(c, id)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 获取权限列表
func (s *Service) List(c *gin.Context) {
	got, err := s.Permission.List(c)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// QueryPermissionUserList
// @Summary   单个根据权限ids查询用户列表
// @Description 单个根据权限ids查询用户列表
// @Tags        权限管理
// @Accept      application/json
// @Produce     json
// @Param 		data body permission.PermissionIdsReq true "权限ID集合"
// @Success     200 {object} permission.PermissionUserResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /permission/query-permission-user-list/{id} [get]
// 根据权限数组查询用户
func (s *Service) QueryPermissionUserList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	idReq := &permission.IdReq{}
	if _, err := form_validator.BindUriAndValid(c, idReq); err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	reqBody := &permission.PermissionIdsReq{}
	reqBody.PermissionType = 1
	reqBody.PermissionIds = []string{idReq.ID}
	got, err := s.Permission.QueryUserListByPermissionIds(ctx, reqBody)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// QueryPermissionUserList
// @Summary   单个根据权限ID和用户名称及第三方ID查询用户列表
// @Description 单个根据权限ID和用户名称及第三方ID查询用户列表
// @Tags        权限管理
// @Accept      application/json
// @Produce     json
// @Param 		data body permission.PermissionIdsReq true "权限ID集合"
// @Success     200 {object} permission.PermissionUserResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /permission/query-permission-user-list/search/{id} [get]
// 根据权限数组查询用户
func (s *Service) QueryPermissionSearchUserList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	idReq := &permission.IdReq{}
	if _, err := form_validator.BindUriAndValid(c, idReq); err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	var req permission.UserReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	reqBody := &permission.PermissionIdsReq{}
	reqBody.PermissionType = 1
	reqBody.PermissionIds = []string{idReq.ID}
	reqBody.Keyword = req.Keyword
	reqBody.ThirdUserId = req.ThirdUserId
	got, err := s.Permission.QueryUserListByPermissionIds(ctx, reqBody)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// QueryBatchPermissionUserList
// @Summary     批量根据权限ids查询用户列表
// @Description 批量根据权限ids查询用户列表
// @Tags        权限管理
// @Accept      application/json
// @Produce     json
// @Param 		data body permission.PermissionIdsReq true "权限ID集合"
// @Success     200 {object} permission.PermissionUserResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /permission/query-permission-user-list [post]
// 根据权限数组查询用户
func (s *Service) QueryBatchPermissionUserList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqBody := &permission.PermissionIdsReq{}
	if err := c.ShouldBind(reqBody); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}
	got, err := s.Permission.QueryUserListByPermissionIds(ctx, reqBody)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// GetUserPermissionScopeList
// @Summary     根据用戶id查询权限列表和范围
// @Description 根据用戶id查询权限列表和范围
// @Tags        权限管理
// @Accept      application/json
// @Produce     json
// @Param 		data body permission.UriReqParamUId true "权限ID集合"
// @Success     200 {object} permission.PermissionUserResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /permission/user-permission-scope-list [get]
// 根据用户获取权限列表
func (s *Service) GetUserPermissionScopeList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	userInfo, err := user_util.GetUserInfo(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserPermissionInvalidParameter, err))
		return
	}
	var uid = userInfo.ID
	log.WithContext(ctx).Infof("==GetUserPermissionScopeList==uid=%s=", uid)
	got, err := s.Permission.GetUserPermissionScopeList(ctx, uid)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// UserCheckPermission
// @Summary      该用户是否在该权限下
// @Description 该用户是否在该权限下
// @Tags        权限管理
// @Accept      plain
// @Produce     application/json
// @param       permissionId       	   path     string    false "权限ID"
// @param       uid       	   path     string    false "用户ID"
// @Success     200 {boolean} boolean "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /permission/check/{permissionId}/{uid} [get]
func (s *Service) UserCheckPermission(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := permission.UserCheckPermissionReq{}
	if _, err = form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in UserCheckPermission api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	pageResult, err := s.Permission.UserCheckPermission(ctx, req.PermissionId, req.Uid)
	if err != nil {
		log.WithContext(ctx).Error("failed to get UserCheckPermission api", zap.Any("queryArgs", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}
