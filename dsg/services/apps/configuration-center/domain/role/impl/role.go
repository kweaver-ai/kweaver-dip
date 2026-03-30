package impl

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/permission"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_permission_binding"
	"github.com/kweaver-ai/idrm-go-common/interception"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	sharemanagement "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift/sharemgnt"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift_gen/sharemgnt"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
	"github.com/kweaver-ai/idrm-go-common/built_in"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type roleUseCase struct {
	repo                      role.Repo
	configurationRepo         configuration.Repo
	userRepo                  user2.IUserRepo
	shareMgnDriven            sharemanagement.ShareMgnDriven
	userMgm                   user_management.DrivenUserMgnt
	producer                  kafkax.Producer
	rolePermissionBindingRepo role_permission_binding.Repo
	permissionRepo            permission.Repo
	roleRepo                  role2.Repo
}

func NewRoleUseCase(
	repo role.Repo,
	u user2.IUserRepo,
	configurationRepo configuration.Repo,
	s sharemanagement.ShareMgnDriven,
	userMgm user_management.DrivenUserMgnt,
	producer kafkax.Producer,
	rolePermissionBindingRepo role_permission_binding.Repo,
	permissionRepo permission.Repo,
	roleRepo role2.Repo,
) domain.UseCase {
	return &roleUseCase{
		repo:                      repo,
		configurationRepo:         configurationRepo,
		userRepo:                  u,
		shareMgnDriven:            s,
		userMgm:                   userMgm,
		producer:                  producer,
		rolePermissionBindingRepo: rolePermissionBindingRepo,
		permissionRepo:            permissionRepo,
		roleRepo:                  roleRepo,
	}
}

func (r *roleUseCase) Create(ctx context.Context, role *configuration_center_v1.Role) (string, error) {
	if role.Icon != "" && !constant.ValidIcon(role.Icon) {
		return "", errorcode.Desc(errorcode.RoleIconNotExist)
	}
	//providers, err := r.configurationRepo.GetByType(ctx, 3)
	//if err != nil {
	//	log.WithContext(ctx).Error("GetProjectProvider DatabaseError", zap.Error(err))
	//	return "", errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	//} else if len(providers) < 1 {
	//	return "", errorcode.Detail(errorcode.PublicDatabaseError, errors.New("provider not exist"))
	//}
	//providerType := enum.Get[constant.ProviderType](providers[0].Value)
	//if providerType.Integer == nil {
	//	return "", errorcode.Detail(errorcode.PublicDatabaseError, errors.New("provider not right"))
	//}
	//systemRole := role.GenSystemRole(providerType.Integer.Int32())

	if err := r.repo.Insert(ctx, convertV1ToModel_Role(role)); err != nil {
		log.WithContext(ctx).Error("insert system role error", zap.Error(err), zap.Any("parameter", role))
		return "", err
	}
	return role.ID, nil
}

func (r *roleUseCase) Update(ctx context.Context, role *configuration_center_v1.Role) error {
	systemRoleInfo, err := r.repo.Get(ctx, role.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Detail(errorcode.RoleNotExist, err)
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	//预置角色不可修改
	if systemRoleInfo.System == constant.SystemRoleIsPresetInt32 {
		return errorcode.Desc(errorcode.DefaultRoleCannotEdit)
	}
	//废弃角色不可修改
	if systemRoleInfo.DeletedAt != 0 {
		return errorcode.Desc(errorcode.DiscardRoleCannotEdit)
	}

	//检查名字是否重复
	exists, err := r.repo.CheckRepeat(ctx, role.ID, role.Name)
	if err != nil {
		log.WithContext(ctx).Error("check repeat error in update", zap.Error(err), zap.Any("parameter", role))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Detail(errorcode.RoleNotExist, err)
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if exists {
		return errorcode.Desc(errorcode.RoleNameRepeat)
	}
	err = r.roleRepo.Update(ctx, convertV1ToModel_Role(role))
	if err != nil {
		log.WithContext(ctx).Error("update system role error", zap.Error(err), zap.Any("parameter", role))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// InsertRelations insert role-user relations
func (r *roleUseCase) InsertRelations(ctx context.Context, rid string, userIds []string) error {
	if len(userIds) <= 0 {
		return nil
	}

	uniqueUserIds := make([]string, 0)
	filterMap := make(map[string]int)
	for _, userId := range userIds {
		//check duplicated userId
		_, ok := filterMap[userId]
		if ok {
			continue
		}
		filterMap[userId] = 1
		//add unique userId
		uniqueUserIds = append(uniqueUserIds, userId)
	}
	/*	if err := r.repo.InsertMultiRelations(ctx, relations); err != nil {
		log.WithContext(ctx).Error("add user to role failed", zap.Error(err), zap.Any("roleId", rid))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}*/
	return nil
}

// CheckRepeat check role repeat
func (r *roleUseCase) CheckRepeat(ctx context.Context, req domain.NameRepeatReq) error {
	exist, err := r.repo.CheckRepeat(ctx, req.Id, req.Name)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Detail(errorcode.RoleNotExist, err)
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.RoleNameRepeat)
	}
	return nil
}

func (r *roleUseCase) Query(ctx context.Context, args *configuration_center_v1.RoleListOptions) (*configuration_center_v1.RoleList, error) {
	var err error
	newCtx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	roles, count, err := r.repo.Query(newCtx, args)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return &configuration_center_v1.RoleList{
		Entries:    ConvertModelToV1_Roles(roles),
		TotalCount: int(count),
	}, nil
}

func (r *roleUseCase) QueryByIds(ctx context.Context, roleIds []string, keys []string) ([]map[string]interface{}, error) {
	roles, err := r.repo.QueryByIds(ctx, roleIds)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.RoleNotExist, err)
		}
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	//添加角色用户关系
	userIdsMap := make(map[string][]string)
	if strings.Contains(strings.Join(keys, ","), "userIds") {
		urRelations, err := r.repo.GetRolesUsers(ctx, roleIds...)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		for _, relation := range urRelations {
			us, ok := userIdsMap[relation.RoleID]
			if !ok {
				us = make([]string, 0)
			}
			us = append(us, relation.UserID)
			userIdsMap[relation.RoleID] = us
		}
	}

	//根据key返回需要的值
	infos := make([]map[string]interface{}, 0, len(roles))
	for _, role := range roles {
		bts, _ := json.Marshal(role)
		sr := make(map[string]interface{})
		json.Unmarshal(bts, &sr)

		dr := make(map[string]interface{})
		for _, key := range keys {
			_, ok := sr[key]
			if ok {
				dr[key] = sr[key]
			}
			if key == "userIds" {
				us, ok := userIdsMap[role.ID]
				if !ok {
					us = make([]string, 0)
				}
				dr[key] = us
			}
		}
		infos = append(infos, dr)
	}
	return infos, nil
}

func (r *roleUseCase) Discard(ctx context.Context, rid string) error {
	mqMessage := domain.NewDeleteRoleMessage(rid)
	if err := r.repo.Discard(ctx, rid, mqMessage); err != nil {
		return err
	}
	if err := r.producer.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
		log.WithContext(ctx).Error("send discard role info error", zap.Error(err))
		return errorcode.Desc(errorcode.RoleDeleteMessageSendError)
	}
	if err := r.repo.DeleteMQMessage(ctx, mqMessage.ID); err != nil {
		log.WithContext(ctx).Errorf("save delete role info error", zap.Error(err))
	}
	return nil
}

// RoleUsers Get Role detail with userId info
func (r *roleUseCase) RoleUsers(ctx context.Context, args *domain.QueryRoleUserPageReqParam) (*response.PageResult, error) {
	/*	_, err := r.repo.Get(ctx, *args.RId)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Detail(errorcode.RoleNotExist, err)
			}
			return nil, errorcode.Desc(errorcode.PublicDatabaseError)
		}*/
	if err := r.RoleExist(ctx, *args.RId); err != nil {
		return nil, err
	}
	args.UserName = strings.Replace(args.UserName, "_", "\\_", -1)
	args.UserName = strings.Replace(args.UserName, "%", "\\%", -1)
	total, roleUsers, err := r.repo.GetRoleUsersInPage(ctx, args)
	if err != nil {
		log.WithContext(ctx).Error("query role in page", zap.Error(err))
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	res := make([]*domain.GetRoleUsersInPageRes, len(roleUsers))
	for i, roleUser := range roleUsers {
		departments, err := r.GetUserDepartments(ctx, roleUser.ID)
		if err != nil {
			if !strings.Contains(err.Error(), "those users are not existing") {
				return nil, errorcode.Detail(errorcode.DrivenGetUserDepartmentsError, err.Error())
			}
		}
		res[i] = &domain.GetRoleUsersInPageRes{
			ID:          roleUser.ID,
			Name:        roleUser.Name,
			CreatedAt:   roleUser.CreatedAt.UnixMilli(),
			Departments: departments,
		}
	}
	return &response.PageResult{
		Entries:    res,
		TotalCount: total,
	}, nil
}

func (r *roleUseCase) GetUserDepartments(ctx context.Context, uid string) ([]string, error) {
	departments, err := r.userMgm.GetUserParentDepartments(ctx, uid)
	if err != nil {
		return []string{}, err
	}
	res := make([]string, len(departments))
	for i, department := range departments {
		var departmentStr string
		for _, d := range department {
			departmentStr = departmentStr + "/" + d.Name
		}
		res[i] = strings.TrimPrefix(departmentStr, "/")
	}
	return res, nil
}

func (r *roleUseCase) ExistUserId(ctx context.Context, uid string) (bool, error) {
	_, err := r.userRepo.GetByUserIdSimple(ctx, uid)
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
func (r *roleUseCase) AddRoleToUser(ctx context.Context, req domain.AddRoleToUserReq) ([]response.NameIDResp2, error) {
	//验证角色是否存在
	if err := r.RoleExist(ctx, *req.RId); err != nil {
		return nil, err
	}
	//删除重复存在的userid
	var existUserSet = map[interface{}]bool{}
	roleUsers, err := r.repo.GetRoleUsers(ctx, *req.RId)
	if err != nil {
		log.WithContext(ctx).Error("AddRoleToUser GetRoleUsers ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.RoleDatabaseError)
	}
	for _, user := range roleUsers {
		if !existUserSet[user.UserID] {
			existUserSet[user.UserID] = true
		}
	}

	var set = map[interface{}]bool{}
	var userRoles []*model.UserRole
	res := make([]response.NameIDResp2, 0)
	for _, uId := range req.UIds {
		//uid 验证是否存在
		exist, err := r.ExistUserId(ctx, uId)
		if err != nil {
			log.WithContext(ctx).Error("AddRoleToUser ExistUserId ", zap.Error(err))
			return nil, errorcode.Desc(errorcode.RoleDatabaseError)
		}
		if !exist {
			return nil, errorcode.Desc(errorcode.UserNotExist)
		}
		//todo uids去重
		if !set[uId] && !existUserSet[uId] && !(*req.RId == access_control.TCSystemMgm && uId == built_in.NCT_USER_ADMIN) {
			userRoles = append(userRoles, &model.UserRole{
				UserID: uId,
				RoleID: *req.RId,
			})
			res = append(res, response.NameIDResp2{
				ID: uId,
			})
			set[uId] = true
		}
	}

	err = r.repo.InsertUserRole(ctx, userRoles)
	if err != nil {
		log.WithContext(ctx).Error("AddRoleToUser InsertUserRole ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.RoleDatabaseError)
	}
	//if *req.RId == access_control.BusinessMgm || *req.RId == access_control.TCDataOperationEngineer {
	if *req.RId == access_control.TCSystemMgm {
		for _, userRole := range userRoles {
			//设置超级管理员
			if err = r.shareMgnDriven.RoleSetMember(ctx, sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, &sharemgnt.NcTRoleMemberInfo{
				UserId:          userRole.UserID,
				DisplayName:     "",
				DepartmentIds:   []string{},
				DepartmentNames: []string{},
				ManageDeptInfo: &sharemgnt.NcTManageDeptInfo{
					DepartmentIds:      []string{},
					DepartmentNames:    []string{},
					LimitUserSpaceSize: -1,
					LimitDocSpaceSize:  -1,
				},
			}); err != nil {
				return nil, err
			}
		}
	}

	return res, nil
}
func (r *roleUseCase) RoleExist(ctx context.Context, rid string) error {
	if systemRole, err := r.repo.Get(ctx, rid); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.RoleNotExist)
		}
		log.WithContext(ctx).Error("RoleExist Get ", zap.Error(err))
		return errorcode.Desc(errorcode.RoleDatabaseError)
	} else if systemRole.DeletedAt != 0 {
		return errorcode.Desc(errorcode.RoleHadDiscard)
	}
	return nil
}
func (r *roleUseCase) DeleteRoleToUser(ctx context.Context, req domain.UidRidReq) error {
	//验证角色是否存在
	if err := r.RoleExist(ctx, *req.RId); err != nil {
		return err
	}
	//uid 验证是否存在
	exist, err := r.ExistUserId(ctx, req.UId)
	if err != nil {
		log.WithContext(ctx).Error("DeleteRoleToUser ExistUserId ", zap.Error(err))
		return errorcode.Desc(errorcode.RoleDatabaseError)
	}
	if !exist {
		return errorcode.Desc(errorcode.UserNotExist)
	}
	mqMessage := domain.NewDeleteUserRoleMessage(*req.RId, req.UId)
	err = r.repo.DeleteUserRole(ctx, req.UId, *req.RId, mqMessage)
	if err != nil {
		if errors.Is(err, errorcode.NoRowAffectedError) {
			return errorcode.Desc(errorcode.UserRoleAlReadyDeleted)
		}
		log.WithContext(ctx).Error("delete role user relation error", zap.Error(err))
		return errorcode.Detail(errorcode.UserRoleDeleteError, err.Error())
	}
	if *req.RId == access_control.TCSystemMgm {
		err = r.shareMgnDriven.RoleDeleteMember(ctx, sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, req.UId)
		if err != nil {
			log.WithContext(ctx).Error("DeleteRoleToUser RoleDeleteMember error", zap.Error(err), zap.String("uid", req.UId))

		}
	}
	//send mq message
	err = r.producer.Send(mqMessage.Topic, []byte(mqMessage.Message))
	if err != nil {
		log.WithContext(ctx).Error("send delete role relation info error", zap.Error(err))
		return errorcode.Desc(errorcode.UserRoleDeleteMessageSendError)
	}
	//delete mq message while success
	r.repo.DeleteMQMessage(ctx, mqMessage.ID)
	return nil
}

//func (r *roleUseCase) GetUserRole(ctx context.Context, req domain.UriReqParamUId) ([]*domain.GetUserRoleRes, error) {
//	//uid 验证是否存在
//	exist, err := r.ExistUserId(ctx, *req.UId)
//	if err != nil {
//		log.WithContext(ctx).Error("GetUserRole ExistUserId ", zap.Error(err))
//		return nil, errorcode.Desc(errorcode.RoleDatabaseError)
//	}
//	if !exist {
//		return nil, errorcode.Desc(errorcode.UserNotExist)
//	}
//
//	userRoles, err := r.repo.GetUserRole(ctx, *req.UId)
//	if err != nil {
//		return nil, err
//	}
//	//res := make([]*domain.NewRoleReq, len(userRoles), len(userRoles))
//	var rids []string
//	for _, userRole := range userRoles {
//		rids = append(rids, userRole.RoleID)
//	}
//	//todo 批量查询role info
//
//	return nil, nil
//}

// GetUserListCanAddToRole : Gets a list of users that can be added to a role
func (r *roleUseCase) GetUserListCanAddToRole(ctx context.Context, req domain.UriReqParamRId) ([]*model.User, error) {
	//验证角色是否存在
	if err := r.RoleExist(ctx, *req.RId); err != nil {
		return nil, err
	}
	roleUsers, err := r.repo.GetRoleUsers(ctx, *req.RId)
	if err != nil {
		log.WithContext(ctx).Error("GetUserListCanAddToRole GetRoleUsers ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.RoleDatabaseError)
	}
	var set = map[interface{}]bool{}
	//var res []*users.UserInfo
	res := make([]*model.User, 0)
	for _, uId := range roleUsers {
		if !set[uId.UserID] {
			set[uId.UserID] = true
		}
	}
	allUsers, err := r.userRepo.GetAll(ctx)
	if err != nil {
		log.WithContext(ctx).Error("GetUserListCanAddToRole GetAll ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.RoleDatabaseError)
	}
	for i, u := range allUsers {
		if !set[u.ID] && !(*req.RId == access_control.TCSystemMgm && u.ID == built_in.NCT_USER_ADMIN) {
			res = append(res, allUsers[i])
		}
	}
	return res, nil
}

func (r *roleUseCase) Detail(ctx context.Context, rid string) (*configuration_center_v1.Role, error) {
	roleInfo, err := r.repo.Get(ctx, rid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.RoleNotExist)
		}
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	// 是否需要返回删除状态
	//info := domain.GenSystemRoleInfo(roleInfo)
	//if roleInfo.DeletedAt == 0 {
	//	info.Status = string(constant.SystemRoleStatusStringNormal)
	//} else {
	//	info.Status = string(constant.SystemRoleStatusStringDiscard)
	//}
	return convertModelToV1_Role(roleInfo), nil
}
func (r *roleUseCase) UserIsInRole(ctx context.Context, rid, uid string) (bool, error) {
	if rid == "" || uid == "" {
		return false, nil
	}
	exist, err := r.repo.UserInRole(ctx, rid, uid)
	if err != nil {
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if exist {
		return true, nil
	}
	return false, nil
}

// GetRoleIDs implements role.UseCase.
func (r *roleUseCase) GetRoleIDs(ctx context.Context, userID string) ([]string, error) {
	return r.repo.GetUserRoleIDs(ctx, userID)
}

// UpdateScopeAndPermissions 更新指定角色的权限
func (r *roleUseCase) UpdateScopeAndPermissions(ctx context.Context, id string, sap *configuration_center_v1.ScopeAndPermissions) error {
	roleInfo, err := r.repo.Get(ctx, id)
	if err != nil {
		return err
	}
	roleInfo.UpdatedAt = time.Now()
	roleInfo.UpdatedBy = ctx.Value(interception.InfoName).(*model.User).ID
	roleInfo.Scope = string(sap.Scope)
	rolePermissions, err := r.rolePermissionBindingRepo.GetByRoleId(ctx, id)
	if err != nil {
		return err
	}
	adds := make([]*model.RolePermissionBinding, 0)
	deletes := make([]string, 0)
	for _, p := range sap.Permissions {
		found := false
		for _, rolePermission := range rolePermissions {
			if p.String() == rolePermission.PermissionID {
				found = true
				break
			}
		}
		if !found {
			adds = append(adds, &model.RolePermissionBinding{RoleID: id, PermissionID: p.String()})
		}
	}
	for _, rolePermission := range rolePermissions {
		found := false
		for _, p := range sap.Permissions {
			if rolePermission.PermissionID == p.String() {
				found = true
				break
			}
		}
		if !found {
			deletes = append(deletes, rolePermission.ID)
		}
	}
	return r.rolePermissionBindingRepo.Update(ctx, roleInfo, adds, deletes)
}

// GetScopeAndPermissions 获取指定角色的权限
func (r *roleUseCase) GetScopeAndPermissions(ctx context.Context, id string) (*configuration_center_v1.ScopeAndPermissions, error) {
	roleInfo, err := r.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	rolePermissionBindings, err := r.rolePermissionBindingRepo.GetByRoleId(ctx, id)
	if err != nil {
		return nil, err
	}
	permissions := make([]uuid.UUID, len(rolePermissionBindings))
	for _, b := range rolePermissionBindings {
		permissionId, err := uuid.Parse(b.PermissionID)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, permissionId)
	}
	return &configuration_center_v1.ScopeAndPermissions{
		Scope:       configuration_center_v1.Scope(roleInfo.Scope),
		Permissions: permissions,
	}, nil
}

func (r *roleUseCase) getRoleInfo(ctx context.Context, roleInfo *model.SystemRole) (*configuration_center_v1_frontend.Role, error) {
	createdUser := &model.User{}
	updatedUser := &model.User{}
	var err error
	if roleInfo.CreatedBy != "" {
		createdUser, err = r.userRepo.GetByUserId(ctx, roleInfo.CreatedBy)
		if err != nil {
			return nil, err
		}
	}
	if roleInfo.UpdatedBy != "" {
		updatedUser, err = r.userRepo.GetByUserId(ctx, roleInfo.UpdatedBy)
		if err != nil {
			return nil, err
		}
	}
	rolePermissionBindings, err := r.rolePermissionBindingRepo.GetByRoleId(ctx, roleInfo.ID)
	if err != nil {
		return nil, err
	}
	permissions := make([]string, len(rolePermissionBindings))
	for _, b := range rolePermissionBindings {
		permissions = append(permissions, b.PermissionID)
	}
	permissionInfos, err := r.permissionRepo.GetByIds(ctx, permissions)
	if err != nil {
		return nil, err
	}
	return &configuration_center_v1_frontend.Role{
		*convertModelToV1_MetadataWithOperator(roleInfo, createdUser.Name, updatedUser.Name),
		*convertModelToV1_RoleSpec(roleInfo),
		ConvertModelToV1_Permissions(permissionInfos),
	}, nil
}

// 获取指定角色及其相关数据
func (r *roleUseCase) FrontGet(ctx context.Context, id string) (*configuration_center_v1_frontend.Role, error) {
	roleInfo, err := r.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	return r.getRoleInfo(ctx, roleInfo)
}

// 获取角色列表及其相关数据
func (r *roleUseCase) FrontList(ctx context.Context, opts *configuration_center_v1.RoleListOptions) (*configuration_center_v1_frontend.RoleList, error) {
	got := &url.Values{}
	err := configuration_center_v1.Convert_V1_RoleListOptions_To_url_Values(opts, got)
	if err != nil {
		return nil, err
	}
	roles, count, err := r.roleRepo.QueryList(ctx, got)
	if err != nil {
		return nil, err
	}
	entries := make([]configuration_center_v1_frontend.Role, 0)
	for _, ri := range roles {
		roleInfo, err := r.getRoleInfo(ctx, ri)
		if err != nil {
			return nil, err
		}
		entries = append(entries, *roleInfo)
	}
	return &configuration_center_v1_frontend.RoleList{
		Entries:    entries,
		TotalCount: int(count),
	}, nil
}

// 检查角色名称是否可以使用
func (r *roleUseCase) FrontNameCheck(ctx context.Context, opts *configuration_center_v1.RoleNameCheck) (bool, error) {
	return r.repo.CheckRepeat(ctx, opts.Id, opts.Name)
}
