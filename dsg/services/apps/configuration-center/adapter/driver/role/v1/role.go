package role

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc    domain.UseCase
	clock clock.Clock
}

func NewService(uc domain.UseCase) *Service {
	return &Service{
		uc:    uc,
		clock: clock.RealClock{},
	}
}

// New
// @Summary     新增系统角色
// @Description 新增系统角色
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Param 		data body domain.SystemRoleCreateReq  true "新增系统角色请求体"
// @Success     200 {array} response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles [post]
func (s *Service) New(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqBody := &configuration_center_v1.Role{}
	if err := c.ShouldBind(reqBody); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}
	if reqBody.ID == "" {
		id, err := uuid.NewV7()
		if err != nil {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
			return
		}
		reqBody.ID = id.String()
	}
	userInfo, err := user_util.GetUserInfo(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserNotExist, err))
		return
	}
	now := meta_v1.NewTime(s.clock.Now())
	reqBody.CreatedBy = userInfo.ID
	reqBody.CreatedAt = now
	reqBody.UpdatedBy = userInfo.ID
	reqBody.UpdatedAt = now
	rid, err := s.uc.Create(ctx, reqBody)
	if err != nil {
		log.WithContext(ctx).Error("failed to create system role", zap.Any("req", reqBody), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.NameIDResp{
		Name: reqBody.Name,
		ID:   rid,
	})
}

// Modify
// @Summary     修改系统角色
// @Description 修改系统角色
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Param 		data body domain.SystemRoleUpdateReq  true "修改系统角色请求体"
// @Success     200 {array} response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{rid} [put]
func (s *Service) Modify(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqBody := &configuration_center_v1.Role{}
	if err := c.ShouldBind(reqBody); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}
	reqBody.ID = c.Param("rid")
	reqBody.UpdatedAt = meta_v1.NewTime(s.clock.Now())
	userInfo, err := user_util.GetUserInfo(ctx)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserNotExist, err))
		return
	}
	reqBody.UpdatedBy = userInfo.ID
	if err := s.uc.Update(ctx, reqBody); err != nil {
		log.WithContext(ctx).Error("failed to edit system role", zap.Any("req", reqBody), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, response.NameIDResp{
		Name: reqBody.Name,
		ID:   reqBody.ID,
	})
}

// Detail
// @Summary     获取系统角色详情
// @Description 获取系统角色详情
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Param       rid path string true "系统角色ID"
// @Success     200 {object} domain.SystemRoleInfo "成功响应参数"
// @Failure     400 {object} rest.HttpError         "失败响应参数"
// @Router      /roles/{rid} [GET]
func (s *Service) Detail(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqId := &domain.UriReqParamRId{}
	if _, err = form_validator.BindUriAndValid(c, reqId); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in discard SystemRole api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	roleInfo, err := s.uc.Detail(ctx, *reqId.RId)
	if err != nil {
		log.WithContext(ctx).Error("failed to discard SystemRole", zap.Any("roleId", *reqId.RId), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, roleInfo)
}

// Delete
// @Summary     废弃系统角色
// @Description 废弃系统角色
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Param       role_id path string true "系统角色标识"
// @Success     200 {object} response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{id} [delete]
func (s *Service) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqId := &domain.UriReqParamRId{}
	if _, err = form_validator.BindUriAndValid(c, reqId); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in discard SystemRole api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if err := s.uc.Discard(ctx, *reqId.RId); err != nil {
		log.WithContext(ctx).Error("failed to discard SystemRole", zap.Any("roleId", *reqId.RId), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.NameIDResp{
		ID:   *reqId.RId,
		Name: "",
	})
}

// ListPage
// @Summary     查询系统角色列表
// @Description 查询系统角色列表
// @Tags        系统角色
// @Accept      plain
// @Produce     application/json
// @param       keyword        query    string    false "搜索条件，角色名称"
// @param       offset         query 	integer   false "页码，默认1，大于1"                                    default(1)  minimum(1)
// @param       limit          query 	integer   false "页数，默认10，大于1"                                   default(10) minimum(1) maximum(100)
// @param       sort           query 	string    false "排序类型，枚举：[创建时间 created_at(默认)，修改时间 updated_at]" Enums(created_at, updated_at)
// @param       direction      query 	string    false "排序方向，枚举： [正序asc，逆序desc(默认)]"   Enums(asc, desc)
// @Success     200 {object} response.PageResult{entries=domain.SystemRoleInfo}  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles [get]
func (s *Service) ListPage(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	queryReq := &configuration_center_v1.RoleListOptions{}
	if err := c.ShouldBind(queryReq); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}

	queryResp, err := s.uc.Query(ctx, queryReq)
	if err != nil {
		log.WithContext(ctx).Error("failed to query SystemRole", zap.Any("QueryParams", queryReq), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, queryResp)
}

// RoleInfoQuery
// @Summary      查询系统角色信息
// @Description  查询系统角色信息
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Param 		data query domain.QueryRoleInfoParams  true "查询系统角色列表请求体"
// @Success     200 {array} domain.SystemRoleInfo "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/info [get]
func (s *Service) RoleInfoQuery(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	queryReq := &domain.QueryRoleInfoParams{}
	if _, err = form_validator.BindQueryAndValid(c, queryReq); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in RoleInfoQuery api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	roleIds := strings.Split(queryReq.RoleIds, ",")
	keys := strings.Split(queryReq.Keys, ",")
	roleInfos, err := s.uc.QueryByIds(ctx, roleIds, keys)
	if err != nil {
		log.WithContext(ctx).Error("failed to query SystemRole in RoleInfoQuery api", zap.Any("QueryParams", queryReq), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, roleInfos)
}

// CheckRepeat  godoc
// @Summary     判断角色名称是否重复
// @Description 判断角色名称是否重复
// @Accept      plain
// @Produce     application/json
// @Tags        系统角色
// @Param       id    query    string    false  "角色id, uuid(36)"
// @Param       name  query    string    true   "角色名称"
// @Success     200 {string} response.CheckRepeatResp
// @Failure     400 {object} rest.HttpError
// @Router      /role/duplicated [GET]
func (s *Service) CheckRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.NameRepeatReq
	_, err = form_validator.BindQueryAndValid(c, &req)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in CheckRepeat SystemRole api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if err := s.uc.CheckRepeat(ctx, req); err != nil {
		log.WithContext(ctx).Error("failed to CheckRepeat in SystemRole", zap.Any("NameRepeatReq", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: false})
}

// GetAllRoleIcons
// @Summary     获取所有的角色图标
// @Description 获取所有的角色图标
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Success     200 {array} constant.IconInfo    "成功响应参数"
// @Router      /roles/icons [get]
func (s *Service) GetAllRoleIcons(c *gin.Context) {
	ginx.ResOKJson(c, constant.AllIcons())
}

// AddUsersToRole
// @Summary     添加角色用户关系
// @Description 添加角色用户关系
// @Tags        角色用户关系
// @Accept      application/json
// @Produce     json
// @Param 		rid path string  true "给用户添加角色标识"
// @Param 		uids body domain.ForSwag  true "给用户添加角色的用户标识列表"
// @Success     200 {array} response.NameIDResp2 "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{rid}/relations [post]
func (s *Service) AddUsersToRole(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.AddRoleToUserReq
	valid, errs := form_validator.BindUriAndValid(c, &req.UriReqParamRId)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
		return
	}

	valid, errs = form_validator.BindJsonAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.UserRoleInvalidParameterJson))
		}
		return
	}

	res, err := s.uc.AddRoleToUser(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DeleteRoleRelation
// @Summary     删除角色下的用户关系
// @Description 删除角色下的用户关系
// @Tags        角色用户关系
// @Accept      application/json
// @Produce     json
// @Param 		rid path string true "删除角色下用户角色标识"
// @Param 		uid query string true "删除用户标识列表"
// @Success     200 {array} response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{rid}/relations [delete]
func (s *Service) DeleteRoleRelation(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.UidRidReq
	valid, errs := form_validator.BindUriAndValid(c, &req.UriReqParamRId)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
		return
	}
	valid, errs = form_validator.BindQueryAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.UserRoleInvalidParameterJson))
		}
		return
	}
	err = s.uc.DeleteRoleToUser(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, []response.NameIDResp{{ID: *req.RId, Name: ""}})
}

// GetUserListCanAddToRole
// @Summary     角色可添加的用户列表
// @Description 角色可添加的用户列表
// @Tags        角色用户关系
// @Accept      application/json
// @Produce     json
// @Param 		rid path string  true "角色标识"
// @Success     200 {array} model.User "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{rid}/candidate [get]
func (s *Service) GetUserListCanAddToRole(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.UriReqParamRId
	valid, errs := form_validator.BindUriAndValid(c, &req)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.UserRoleInvalidParameter, errs))
		return
	}
	res, err := s.uc.GetUserListCanAddToRole(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// RoleUserInPage
// @Summary     分页查询角色下的用户
// @Description 分页查询角色下的用户
// @Tags        角色用户关系
// @Accept      plain
// @Produce     application/json
// @param       rid       	   path     string    false "角色ID"
// @param       keyword        query    string    false "搜索关键字，角色名称，模糊搜索"
// @param       offset         query 	integer   false "页码，默认1，大于1"         default(1)  minimum(1)
// @param       limit          query 	integer   false "页数，默认20，大于1"        default(20) minimum(1)
// @param       sort           query 	string    false "排序类型，枚举：[创建时间 created_at(默认)]" Enums(created_at)
// @param       direction      query 	string    false "排序方向，枚举： [正序asc，逆序desc(默认)]"   Enums(asc, desc)
// @Success     200 {object} response.PageResult{entries=model.User}  "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{id}/relations [get]
func (s *Service) RoleUserInPage(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := domain.QueryRoleUserPageReqParam{}
	if _, err = form_validator.BindUriAndValid(c, &req.UriReqParamRId); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in RoleUserInPage api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in RoleUserInPage api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	pageResult, err := s.uc.RoleUsers(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error("failed to get RoleUserInPage api", zap.Any("queryArgs", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// UserIsInRole
// @Summary     该用户是否在该角色下
// @Description 该用户是否在该角色下
// @Tags        角色用户关系
// @Accept      plain
// @Produce     application/json
// @param       rid       	   path     string    false "角色ID"
// @param       uid       	   path     string    false "用户ID"
// @Success     200 {boolean} boolean "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /roles/{rid}/{uid} [get]
func (s *Service) UserIsInRole(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := domain.UidRidParamReq{}
	if _, err = form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in RoleUserInPage api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	pageResult, err := s.uc.UserIsInRole(ctx, req.RId, req.UId)
	if err != nil {
		log.WithContext(ctx).Error("failed to get RoleUserInPage api", zap.Any("queryArgs", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// GetRoleIDs
// @Summary     获取角色 ID 列表
// @Description 获取角色 ID 列表
// @Router      /role-ids [get]
func (s *Service) GetRoleIDs(c *gin.Context) {
	ctx, span := af_trace.StartServerSpan(c)
	defer span.End()

	req := &role.RoleIDsReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind and validate query parameter", zap.Error(err))
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	roleIDs, err := s.uc.GetRoleIDs(c, req.UserID)
	if err != nil {
		log.WithContext(ctx).Error("failed to get role ids", zap.Error(err), zap.Any("request", req))
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	ginx.ResOKJson(c, roleIDs)
}

// UpdateScopeAndPermissions 更新指定角色的权限
func (s *Service) UpdateScopeAndPermissions(c *gin.Context) {
	sap := &configuration_center_v1.ScopeAndPermissions{}
	if err := c.ShouldBindJSON(sap); err != nil {
		// TODO: 返回结构化错误
		return
	}
	id := c.Param("rid")

	// TODO: Completion

	// TODO: Validation

	if err := s.uc.UpdateScopeAndPermissions(c, id, sap); err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// GetScopeAndPermissions 获取指定角色的权限
func (s *Service) GetScopeAndPermissions(c *gin.Context) {
	id := c.Param("rid")

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

// 获取指定角色及其相关数据
func (s *Service) FrontGet(c *gin.Context) {
	id := c.Param("rid")

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

// 获取角色列表及其相关数据
func (s *Service) FrontList(c *gin.Context) {
	opts := &configuration_center_v1.RoleListOptions{}
	if err := c.ShouldBindQuery(opts); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion
	if opts.Sort == "" {
		opts.Sort = "updated_at"
	}
	if opts.Direction == "" {
		opts.Direction = meta_v1.Descending
	}

	// TODO: Validation

	got, err := s.uc.FrontList(c, opts)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 检查角色组名称是否可以使用
func (s *Service) FrontRoleNameCheck(c *gin.Context) {
	opts := &configuration_center_v1.RoleNameCheck{}
	if err := c.ShouldBindQuery(opts); err != nil {
		return
	}

	// TODO: Completion

	// TODO: Validation

	repeat, err := s.uc.FrontNameCheck(c, opts)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, repeat)
}
