package v1

import (
	"github.com/gin-gonic/gin"
	task_configuration_center "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type UserService struct {
	service user.IUser
}

func NewUserService(u user.IUser) *UserService {
	return &UserService{
		service: u,
	}
}

var _ task_configuration_center.User

// AllUsers  godoc
//
//	@Summary		查询所有用户
//	@Description	查询所有用户
//	@Tags			项目管理
//	@Accept			application/json
//	@Produce		application/json
//	@Param			task_type	query		string	false	"任务类型"
//	@Success		200			{object}	[]model.User
//	@Failure		400			{object}	rest.HttpError
//	@Router			/users [GET]
func (u *UserService) AllUsers(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	query := user.GetUserReq{}
	valid, errs := form_validator.BindQueryAndValid(c, &query)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	all, err := u.service.GetAll(ctx, query)
	if err != nil {
		log.WithContext(ctx).Error("get AllUsers error ", zap.Error(err))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, all)
}

// ProjectUsers  godoc
//
//	@Summary		查询项目负责人用户列表
//	@Description	查询项目负责人用户列表
//	@Tags			open项目管理
//	@Accept			application/json
//	@Produce		application/json
//	@param			keyword		query	string	false	"用户名或登录名"
//	@param			third_user_id		query	string	false	"第三方用户ID"
//	@Success		200	{object}	[]task_configuration_center.User  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/users [GET]
func (u *UserService) ProjectUsers(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req task_configuration_center.UserReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	all, err := u.service.GetProjectMgmUsers(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("get ProjectUsers error ", zap.Error(err))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, all)
}
