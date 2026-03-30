package v2

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role_v2"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
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

// Detail
// @Summary     获取角色详情
// @Description 获取角色详情
// @Tags        系统角色
// @Accept      application/json
// @Produce     json
// @Param       rid path string true "角色ID"
// @Success     200 {object} domain.SystemRoleInfo "成功响应参数"
// @Failure     400 {object} rest.HttpError         "失败响应参数"
// @Router      /roles/{rid} [GET]
func (s *Service) Detail(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.UriReqParamRId{}
	if _, err = form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in discard SystemRole api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	roleInfo, err := s.uc.Detail(ctx, *req.RId)
	if err != nil {
		log.WithContext(ctx).Error("failed to discard SystemRole", zap.Any("roleId", *req.RId), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, roleInfo)
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
	req := &domain.ListArgs{}
	if err = c.ShouldBind(req); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}

	queryResp, err := s.uc.Query(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to query SystemRole", zap.Any("QueryParams", req), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, queryResp)
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
	req := domain.UserRolePageArgs{}
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

// GetUserRoles
// @Summary     用户添加的角色列表
// @Description 用户添加的角色列表
// @Tags        登录用户
// @Accept      application/json
// @Produce     json
// @Param 		uid query string  false "用户标识"
// @Success     200 {array}  model.SystemRole "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /users/roles [get]
func (s *Service) GetUserRoles(c *gin.Context) {
	res, err := s.uc.UserRoles(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
