package v1

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	object "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/register"
	users "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	register     domain.UseCase
	object       object.UseCase
	u            users.UseCase
	userRegister register.UserServiceClient
}

func NewService(service domain.UseCase, object object.UseCase, u users.UseCase, userRegister register.UserServiceClient) *Service {
	return &Service{register: service, object: object, u: u, userRegister: userRegister}
}

// RegisterUser
// @Summary 注册用户
// @Description 注册用户
// @Tags 用户
// @Accept json
// @Produce json
// @Param req body domain.RegisterReq true "用户注册信息"

func (s *Service) RegisterUser(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req []*domain.UserReq
	if _, err := form_validator.BindJsonAndValid(c, &req, true); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in RegisterUser api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	var successfulIDs []string
	var failedUsers []map[string]interface{}

	for _, userReq := range req {
		//与服务端接口对接
		user, err := s.u.GetByUserId(ctx, userReq.UserId)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get user %s, err: %v", userReq.UserId, err)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
			return
		}
		name := user.LoginName
		userName := user.Name
		Phone := user.PhoneNumber
		mail := user.MailAddress
		log.Info("-------------enter register----------------register user" + name)
		createReq := &register.CreateReq{
			LoginName: name,
			Name:      userName,
			Phone:     Phone,
			Mail:      mail,
		}
		log.Info("-------------prepared invoke -user_register.CreateUser---------------start")
		r, err := s.userRegister.CreateUser(ctx, createReq)
		log.Info("-------------invoke -user_register.CreateUser---------------finished")
		if err != nil {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err)
			return
		}
		if r.Code != 200 {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, r.Message))
			return
		}
		log.Info("-------------invoke -user_register.CreateUser---------------finished------------->" + r.Data.Id)

		// 设置网关ID
		userReq.ThirdServiceId = r.Data.Id
		id, err := s.register.Register(ctx, userReq)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to register user %s, err: %v", userReq.UserId, err)
			failedUsers = append(failedUsers, map[string]interface{}{
				"login_name": userReq.UserId,
				"error":      err.Error(),
			})
			continue
		}
		successfulIDs = append(successfulIDs, id.ID)
	}

	response := map[string]interface{}{
		"successful_ids": successfulIDs,
		"total_count":    len(req),
		"success_count":  len(successfulIDs),
		"failed_count":   len(failedUsers),
	}

	if len(failedUsers) > 0 {
		response["failed_users"] = failedUsers
	}

	ginx.ResOKJson(c, response)
}

func (s *Service) GetRegisterInfo(c *gin.Context) {
	var req domain.ListUserReq
	if err := c.ShouldBindQuery(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query GetRegisterInfo api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	//与服务端接口对接
	/*ListReq := &register.ListReq{
		Name:      req.Name,
		Direction: req.Direction,
		Limit:     int32(req.Limit),
		Offset:    int32(req.Offset),
	}

	response, error := s.user_register.ListUser(c, ListReq)

	if error != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, error)
		return
	}
	if response.Code != 200 {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, response.Message))
		return
	}*/

	info, err := s.register.GetRegisterInfo(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}

func (s *Service) GetUserInfo(c *gin.Context) {
	var req domain.ListReq
	if err := c.ShouldBindQuery(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query GetRegisterInfo api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	info, err := s.register.GetUserList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}

func (s *Service) GetUserDetail(c *gin.Context) {
	id := &domain.IDPath{}
	if _, err := form_validator.BindUriAndValid(c, id); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	info, err := s.register.GetUserInfo(c, id)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}

func (s *Service) UserUnique(c *gin.Context) {
	var req domain.UserUniqueReq
	if err := c.ShouldBindQuery(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query UserUnique api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	info, err := s.register.UserUnique(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}

func (s *Service) OrganizationRegister(c *gin.Context) {
	var req domain.LiyueRegisterReqs
	if err := c.ShouldBindJSON(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query OrganizationRegister api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	// 检查 UserIDs 是否为空
	if len(req.UserIDs) == 0 {
		log.WithContext(c).Errorf("user_ids cannot be empty")
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errors.New("user_ids cannot be empty")))
		return
	}

	// 校验当前机构是否已经注册了
	/**org, err3 := s.register.GetOrganizationInfo(c, req.DeptId)
	if err3 != nil {
		log.WithContext(c).Errorf("failed to get organization info for dept %s, err: %v", req.DeptId, err3)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err3)
		return
	}
	if org != nil {
		log.WithContext(c).Errorf("organization %s has already registered", req.DeptId)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterUniqueError, errors.New("organization has already registered")))
		return
	}**/

	// 遍历 UserIDs 并为每个 user_id 执行注册逻辑
	// 收集所有 ThirdServiceId
	var thirdServiceIds []string
	for _, userID := range req.UserIDs {
		userinfo, err3 := s.u.GetByUserId(c, userID.UserID)
		if err3 != nil {
			log.WithContext(c).Errorf("failed to register user %s, err: %v", userID.UserID, err3)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err3)
			return
		}
		if userinfo == nil {
			log.WithContext(c).Errorf("No found register user %s", userID.UserID)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errors.New("user not found"))
			return
		}
		thirdServiceIds = append(thirdServiceIds, userinfo.ThirdServiceId)
	}

	// 获取部门信息
	obj, err2 := s.object.Get(c, req.DeptId)
	if err2 != nil {
		log.WithContext(c).Errorf("failed to get object for dept %s, err: %v", req.DeptId, err2)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err2)
		return
	}
	log.Info("-------------invoke -OrganizationRegister---------------start------------->" + obj.ID)

	// 创建组织机构
	r, err2 := s.userRegister.CreateOrganization(c, &register.CreateOrganizationReq{
		OrganizationName: obj.Name,
		OrganizationCode: req.DeptTag,
		Managers:         thirdServiceIds,
	})
	if err2 != nil {
		log.WithContext(c).Errorf("failed to create organization, err: %v", err2)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err2)
		return
	}
	if r.Code != 200 {
		log.WithContext(c).Errorf("create organization failed, code: %d, message: %s", r.Code, r.Message)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, r.Message))
		return
	}
	log.Info("-------------invoke -OrganizationRegister---------------end------------->" + r.Data.Id)

	now := time.Now().UTC()
	// 更新主表
	currentReq := &model.Object{
		ID:         req.DeptId,
		IsRegister: 2,
		RegisterAt: &now,
		DeptTag:    req.DeptTag,
	}
	err4 := s.object.UpdateObjectRegister(c, currentReq)
	var ids []string
	if err2 != nil {
		log.WithContext(c).Errorf("failed to register user %s, err: %v", req.UserIDs, err4)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err4)
		return
	}

	// 构造请求参数，将所有 userID.UserID 拼接成逗号分隔的字符串
	var userIds []string
	for _, userID := range req.UserIDs {
		userIds = append(userIds, userID.UserID)
	}

	q := &domain.LiyueRegisterReq{
		LiyueID: req.DeptId,
		Type:    1,
		UserID:  strings.Join(userIds, ","), // 多个用户 ID 用逗号拼接
		ID:      r.Data.Id,
	}

	// 只执行一次注册
	info, err := s.register.OrganizationRegister(c, q)
	if err != nil {
		log.WithContext(c).Errorf("failed to register organization info, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ids = append(ids, info.ID)

	// 返回结果（可以只返回最后一个结果或合并所有结果）
	ginx.ResOKJson(c, ids)
}

func (s *Service) EditRegister(c *gin.Context) {
	var req domain.LiyueRegisterReqs
	id := &domain.IDPath{}
	if _, err := form_validator.BindUriAndValid(c, id); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query OrganizationRegister api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	// 检查 UserIDs 是否为空
	if len(req.UserIDs) == 0 {
		log.WithContext(c).Errorf("user_ids cannot be empty")
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errors.New("user_ids cannot be empty")))
		return
	}

	// 遍历 UserIDs 并为每个 user_id 执行注册逻辑
	// 收集所有 ThirdServiceId
	var thirdServiceIds []string
	for _, userID := range req.UserIDs {
		userinfo, err3 := s.u.GetByUserId(c, userID.UserID)
		if err3 != nil {
			log.WithContext(c).Errorf("failed to register user %s, err: %v", userID.UserID, err3)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err3)
			return
		}
		if userinfo == nil {
			log.WithContext(c).Errorf("No found register user %s", userID.UserID)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errors.New("user not found"))
			return
		}
		thirdServiceIds = append(thirdServiceIds, userinfo.ThirdServiceId)
	}

	// 获取部门信息
	obj, err2 := s.object.Get(c, req.DeptId)
	if err2 != nil {
		log.WithContext(c).Errorf("failed to get object for dept %s, err: %v", req.DeptId, err2)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err2)
		return
	}
	log.Info("-------------invoke ----update-----OrganizationRegister---------------start------------->" + obj.ID)
	//根据机构id查询机构信息
	orgInfo, err := s.register.GetOrganizationInfo(c, id.ID)
	if err != nil {
		log.WithContext(c).Errorf("failed to get organization info, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	log.Info("-------------invoke ----update------OrganizationRegister---------------start------------->" + orgInfo.ID)
	orgId := orgInfo.ID

	// 更新组织机构负责人
	r, err2 := s.userRegister.UpdateOraganization(c, &register.UpdateOrganizationReq{
		OrganizationName: obj.Name,
		OrganizationCode: req.DeptTag,
		Manager:          thirdServiceIds,
		Id:               orgId,
	})
	if err2 != nil {
		log.WithContext(c).Errorf("failed to update organization, err: %v", err2)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err2)
		return
	}
	if r.Code != 200 {
		log.WithContext(c).Errorf("update organization failed, code: %d, message: %s", r.Code, r.Message)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, r.Message))
		return
	}
	log.Info("-------------invoke ----update------OrganizationRegister---------------end------------->")

	now := time.Now().UTC()
	//更新主表
	currentReq := &model.Object{
		ID:         req.DeptId,
		IsRegister: 2,
		RegisterAt: &now,
		DeptTag:    req.DeptTag,
	}

	err5 := s.object.UpdateObjectRegister(c, currentReq)
	var ids []string
	if err5 != nil {
		log.WithContext(c).Errorf("failed to register user %s, err: %v", req.UserIDs, err5)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err5)
		return
	}

	// 构造请求参数，将所有 userID.UserID 拼接成逗号分隔的字符串
	var userIds []string
	for _, userID := range req.UserIDs {
		userIds = append(userIds, userID.UserID)
	}

	q := &domain.LiyueRegisterReq{
		ID:      orgId,
		LiyueID: req.DeptId,
		Type:    1,
		UserID:  strings.Join(userIds, ","), // 多个用户 ID 用逗号拼接
	}

	// 只执行一次更新
	info, err := s.register.OrganizationUpdate(c, q)
	if err != nil {
		log.WithContext(c).Errorf("failed to update organization info, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ids = append(ids, info.ID)
	// 返回结果（可以只返回最后一个结果或合并所有结果）
	ginx.ResOKJson(c, ids)
}

/*func (s *Service) OrganizationRegister(c *gin.Context) {
var req domain.OrganizationRegisterReq
if err := c.ShouldBindJSON(&req); err != nil {
	log.WithContext(c).Errorf("failed to bind req param in query OrganizationRegister api, err: %v", err)
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
}
//与服务端接口对接
/*r, err2 := s.user_register.CreateOrganization(c, &register.CreateOrganizationReq{
	OrganizationName: req.OrganizationName,
	OrganizationCode: req.OrganizationCode,
	Managers:         []string{req.UserID},
})
if err2 != nil {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err2)
	return
}
if r.Code != 200 {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, r.Message))
	return
}
req.ID = r.Data.Id*/

/*info, err := s.register.OrganizationRegister(c, &req)
if err != nil {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
	return
}
ginx.ResOKJson(c, info)*/
//}

// 机构查询
func (s *Service) OrganizationList(c *gin.Context) {
	var req domain.ListReq
	if err := c.ShouldBindQuery(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query OrganizationList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	info, err := s.register.OrganizationList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}

// 机构唯一性检测
func (s *Service) IsOrganizationRegistered(c *gin.Context) {
	var req domain.OrganizationUniqueReq
	if err := c.ShouldBindQuery(&req); err != nil {
		log.WithContext(c).Errorf("failed to bind req param in query IsOrganizationRegistered api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	info, err := s.register.OrganizationUnique(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}

// 机构详情查询
func (s *Service) GetOrganizationInfo(c *gin.Context) {
	id := &domain.IDPath{}
	if _, err := form_validator.BindUriAndValid(c, id); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in replace file, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	info, err := s.register.GetOrganizationInfo(c, id.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, info)
}
