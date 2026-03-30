package user

import (
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user/impl"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// ExtendedUserListOptions 扩展的用户列表选项，包含子部门查询参数
type ExtendedUserListOptions struct {
	configuration_center_v1.UserListOptions
	IncludeSubDepartments bool `form:"include_sub_departments" json:"include_sub_departments"`
}

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// GetUserRoles
// @Summary     用户添加的角色列表
// @Description 用户添加的角色列表
// @Tags        登录用户
// @Accept      application/json
// @Produce     json
// @Param 		uid query string  false "用户标识"
// @Success     200 {array} model.SystemRole "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /users/roles [get]
func (s *Service) GetUserRoles(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.UriReqParamUId
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
		return
	}
	var uid string
	if req.UId == nil {
		uid = ""
	} else {
		uid = *req.UId
	}
	res, err := s.uc.GetUserRoles(ctx, uid)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// AccessControl
// @Summary     用户角色的权限值
// @Description 用户角色的权限值
// @Tags        访问控制
// @Accept      application/json
// @Produce     json
// @Success     200 {object} access_control.ScopeTransfer "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /users/access-control [get]
func (s *Service) AccessControl(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, userRoles, err := s.uc.AccessControl(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	resp := access_control.AddExtraAccessControl(userRoles, res)
	ginx.ResOKJson(c, resp)
}

// HasAccessPermission
// @Summary     是否有访问许可
// @Description 是否有访问许可
// @Tags        访问控制
// @Accept      application/json
// @Produce     json
// @Param       _   query    domain.HasAccessPermissionReq true "查询参数"
// @Success     200 {boolean} boolean "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /access-control [get]
func (s *Service) HasAccessPermission(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.HasAccessPermissionReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in HasAccessPermission api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.HasAccessPermission(ctx, req.UserId, access_control.AccessType(req.AccessType), access_control.Resource(req.Resource))
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// HasManageAccessPermission
// @Summary     是否有管理员访问许可
// @Description 是否有管理员访问许可
// @Tags        访问控制
// @Accept      application/json
// @Produce     json
// @Success     200 {boolean} boolean "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /users/access-control/manager [get]
func (s *Service) HasManageAccessPermission(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.HasManageAccessPermission(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) AddAccessControl(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	err = s.uc.AddAccessControl(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
}

// GetUserDepart
// @Summary     登录用户所属部门
// @Description 登录用户所属部门
// @Tags        登录用户
// @Accept      application/json
// @Produce     json
// @Param 		Authorization header string  true "用户令牌"
// @Success     200 {array} domain.Depart "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /users/depart [get]
func (s *Service) GetUserDepart(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	res, err := s.uc.GetUserDirectDepart(ctx)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) GetUserIdDepart(c *gin.Context) {
	req := &domain.GetUserPathParameters{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	res, err := s.uc.GetUserIdDirectDepart(c, req.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetUserByDepartAndRole
// @Summary     查询用户列表
// @Description 查询用户列表，条件：部门角色
// @Tags        用户
// @Accept      application/json
// @Produce     json
// @Param 		Authorization header string  true "用户令牌"
// @Param 		req query domain.GetUserByDepartAndRoleReq  true "请求参数"
// @Success     200 {array} domain.User "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /users/filter [get]
func (s *Service) GetUserByDepartAndRole(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetUserByDepartAndRoleReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in HasAccessPermission api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetUserByDirectDepartAndRole(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDepartUsers
// @Summary     查询部门下的用户
// @Description 查询部门下的用户
// @Tags        用户
// @Accept      application/json
// @Produce     json
// @Param 		Authorization header string  true "用户令牌"
// @Param 		req query domain.GetDepartUsersReq  true "请求参数"
// @Success     200 {array} domain.GetDepartUsersRespItem "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /depart/users [get]
func (s *Service) GetDepartUsers(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetDepartUsersReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in HasAccessPermission api", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetDepartUsers(ctx, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDepartAndUsersPage
// @Summary     查询部门和用户列表
// @Description 查询部门和用户列表
// @Tags        用户
// @Accept      application/json
// @Produce     json
// @Param 		Authorization header string  true "用户令牌"
// @Param 		req query domain.GetDepartUsersReq  true "请求参数"
// @Success     200 {array} model.User "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /depart-users [get]
func (s *Service) GetDepartAndUsersPage(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DepartAndUserReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in HasAccessPermission api", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetDepartAndUsersPage(ctx, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetUserDeparts
//
//	@Summary     获取指定用户，所属部门
//	@Tags       用户
//	@Accept     application/json
//	@Produce    json
//	@Router     /api/internal/configuration-center/v1/user/:id/departs [get]
func (s *Service) GetUserDeparts(c *gin.Context) {
	ctx, span := af_trace.StartServerSpan(c)
	defer span.End()

	pathParameters := &domain.GetUserPathParameters{}
	if _, err := form_validator.BindUriAndValid(c, pathParameters); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("failed to bind uri to GetUserPathParameters", zap.Error(err), zap.String("uri", c.Request.URL.Path))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	queryParameters := &domain.GetUserQueryParameters{}
	if err := c.ShouldBindQuery(queryParameters); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("failed to bind query to GetUserQueryParameters", zap.Error(err), zap.String("query", c.Request.URL.RawQuery))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	domain.CompleteGetUserOptions(&queryParameters.GetUserOptions)
	if err := domain.ValidateGetUserOptions(&queryParameters.GetUserOptions); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("failed to validate GetUserOptions", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetUserDeparts(ctx, pathParameters.ID, queryParameters.GetUserOptions)
	if err != nil {
		span.RecordError(err)
		// TODO: 根据错误返回不同的 http status code
		return
	}
	ginx.ResOKJson(c, res)
}

// GetUser
//
//	@Summary    获取指定用户
//	@Tags       用户
//	@Accept     application/json
//	@Produce    json
//	@Router     /api/configuration-center/v1/users/:id [get]
func (s *Service) GetUser(c *gin.Context) {
	ctx, span := af_trace.StartServerSpan(c)
	defer span.End()

	pathParameters := &domain.GetUserPathParameters{}
	if _, err := form_validator.BindUriAndValid(c, pathParameters); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("failed to bind uri to GetUserPathParameters", zap.Error(err), zap.String("uri", c.Request.URL.Path))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	queryParameters := &domain.GetUserQueryParameters{}
	if err := c.ShouldBindQuery(queryParameters); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("failed to bind query to GetUserQueryParameters", zap.Error(err), zap.String("query", c.Request.URL.RawQuery))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	domain.CompleteGetUserOptions(&queryParameters.GetUserOptions)
	if err := domain.ValidateGetUserOptions(&queryParameters.GetUserOptions); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("failed to validate GetUserOptions", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetUser(ctx, pathParameters.ID, queryParameters.GetUserOptions)
	if err != nil {
		span.RecordError(err)
		// TODO: 根据错误返回不同的 http status code
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) GetUserByIds(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	req := &domain.GetUserByIdsReqParam{}
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.GetUserByIds(ctx, req.Ids)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) QueryUserByIds(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	req := &domain.QueryUserIdsReq{}
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		return
	}

	res, err := s.uc.QueryUserByIds(ctx, req.IDs)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetUserDetail
// @Summary     获取指定用户详情
// @Description 获取指定用户详情
// @Tags        用户
// @Accept      application/json
// @Produce     json
// @Param 		_ path domain.GetUserPathParameters  true "请求参数"
// @Success     200 {object} domain.UserRespItem "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /api/configuration-center/v1/user/:id [get]
func (s *Service) GetUserDetail(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	req := &domain.GetUserPathParameters{}
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}

	res, err := s.uc.GetUserDetail(ctx, req.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetUserList
// @Summary     获取用户列表
// @Description 获取用户列表
// @Tags        用户
// @Accept      application/json
// @Produce     json
// @Param 		Authorization header string  true "用户令牌"
// @Param 		req query domain.GetUserListReq  true "请求参数"
// @Success     200 {object} domain.ListResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /api/configuration-center/v1/users [get]
func (s *Service) GetUserList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetUserListReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in HasAccessPermission api", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetUserList(ctx, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// UpdateScopeAndPermissions 更新指定用户的权限
func (s *Service) UpdateScopeAndPermissions(c *gin.Context) {
	sap := &configuration_center_v1.ScopeAndPermissions{}
	if err := c.ShouldBindJSON(sap); err != nil {
		// TODO: 返回结构化错误
		return
	}
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation

	if err := s.uc.UpdateScopeAndPermissions(c, id, sap); err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	//go func(ctx context.Context) {
	userIds := []string{id}
	s.uc.SyncUserAuditToProton(c, userIds)
	//}(c)
	ginx.ResOKJson(c, nil)
}

// GetScopeAndPermissions 获取指定用户的权限
func (s *Service) GetScopeAndPermissions(c *gin.Context) {
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation

	got, err := s.uc.GetScopeAndPermissions(c, id)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// UserRoleOrRoleGroupBindingBatchProcessing 更新用户角色或角色组绑定，批处理
func (s *Service) UserRoleOrRoleGroupBindingBatchProcessing(c *gin.Context) {
	p := &configuration_center_v1.UserRoleOrRoleGroupBindingBatchProcessing{}
	if err := c.ShouldBindJSON(p); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion
	completeUserRoleOrRoleGroupBindingBatchProcessing(p)
	// TODO: Validation

	if err := s.uc.UserRoleOrRoleGroupBindingBatchProcessing(c, p); err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	//go func(ctx context.Context) {
	userIds := make([]string, 0)
	for _, b := range p.Bindings {
		userIds = append(userIds, b.UserID)
	}
	s.uc.SyncUserAuditToProton(c, userIds)
	//}(c)
	ginx.ResOKJson(c, nil)
}

// FrontGet 获取指定用户及其相关数据
func (s *Service) FrontGet(c *gin.Context) {
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation

	got, err := s.uc.FrontGet(c, id)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// FrontList 获取用户列表及其相关数据
func (s *Service) FrontList(c *gin.Context) {
	extendedOpts := &ExtendedUserListOptions{}
	if err := c.ShouldBindQuery(extendedOpts); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// 转换为原始的结构体
	opts := &extendedOpts.UserListOptions

	// TODO: Completion
	completeUserListOptions(opts)
	// TODO: Validation
	if err := validateUserListOptions(opts, nil); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// 传递扩展选项给domain层
	got, err := s.uc.FrontListWithSubDepartments(c, opts, extendedOpts.IncludeSubDepartments)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

func (s *Service) ListUserNames(c *gin.Context) {
	res, err := s.uc.ListUserNames(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetUserIdByMainDeptIds
//
//	@Summary    根据用户id查询部门及主部门及子部门的ID
//	@Tags       用户管理
//	@Accept     application/json
//	@Produce    json
//	@Router     /api/internal/configuration-center/v1/user/:id/main-depart-ids [get]
func (s *Service) GetUserIdByMainDeptIds(c *gin.Context) {
	ctx, span := af_trace.StartServerSpan(c)
	defer span.End()

	pathParameters := &domain.GetUserPathParameters{}
	if _, err := form_validator.BindUriAndValid(c, pathParameters); err != nil {
		span.RecordError(err)
		log.WithContext(ctx).Error("GetUserIdByMainDeptIds to bind uri to GetUserPathParameters", zap.Error(err), zap.String("uri", c.Request.URL.Path))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	res, err := s.uc.GetUserIdByMainDeptIds(ctx, pathParameters.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetFrontendUserMainDept
//
//	@Summary    获取用户的默认主部门信息
//	@Tags       用户管理
//	@Accept     application/json
//	@Produce    json
//	@Router     /api/configuration-center/v1/frontend/user/main-depart-id [get]
func (s *Service) GetFrontendUserMainDept(c *gin.Context) {
	ctx, span := af_trace.StartServerSpan(c)
	defer span.End()

	userInfo, err := user_util.GetUserInfo(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserPermissionInvalidParameter, err))
		return
	}

	res, err := s.uc.GetFrontendUserMainDept(ctx, userInfo.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
