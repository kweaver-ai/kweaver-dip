package impl

import (
	"context"
	"errors"

	"go.uber.org/zap"
	"gorm.io/gen/field"
	"gorm.io/gorm"

	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type roleRepo struct {
	q *query.Query
}

func NewRoleRepo(db *gorm.DB) role.Repo {
	return &roleRepo{q: common.GetQuery(db)}
}

func (r roleRepo) Insert(ctx context.Context, role *model.SystemRole) error {
	err := r.q.Transaction(func(tx *query.Query) error {
		count, err := tx.SystemRole.WithContext(ctx).Where(tx.SystemRole.Name.Eq(role.Name)).Count()
		if err != nil {
			log.WithContext(ctx).Error("check repeat error in insert", zap.Error(err), zap.Any("parameter", role))
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		if count > 0 {
			return errorcode.Desc(errorcode.RoleNameRepeat)
		}
		err = tx.SystemRole.WithContext(ctx).Create(role)
		if err != nil {
			log.WithContext(ctx).Error("insert record error", zap.Error(err), zap.Any("parameter", role))
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return nil
	})

	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("Insert transaction error", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (r roleRepo) Update(ctx context.Context, role *model.SystemRole) error {
	sr := r.q.SystemRole
	updateFields := make([]field.Expr, 0)
	if role.Name != "" {
		updateFields = append(updateFields, sr.Name)
	}
	if role.Icon != "" {
		updateFields = append(updateFields, sr.Icon)
	}
	if role.Color != "" {
		updateFields = append(updateFields, sr.Color)
	}
	_, err := sr.WithContext(ctx).Where(sr.ID.Eq(role.ID)).Select(updateFields...).Updates(role)
	return err

}

func (r roleRepo) Discard(ctx context.Context, rid string, msg *model.MqMessage) error {
	err := r.q.Transaction(func(tx *query.Query) error {
		//检查当前角色是不是系统角色，系统角色不能删除
		systemRole, err := tx.SystemRole.WithContext(ctx).Unscoped().Where(tx.SystemRole.ID.Eq(rid)).First()
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.WithContext(ctx).Error("query error before delete role", zap.Error(err))
				return errorcode.Desc(errorcode.RoleNotExist)
			}
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		//预置系统角色不可以删除
		if systemRole.System == constant.SystemRoleIsPresetInt32 {
			return errorcode.Desc(errorcode.DefaultRoleCannotDeleted)
		}
		//废弃角色不可以再被删除
		if systemRole.DeletedAt != 0 {
			return errorcode.Desc(errorcode.RoleNotExist)
		}
		//mark status
		_, err = tx.SystemRole.WithContext(ctx).Where(tx.SystemRole.ID.Eq(rid)).Delete()

		if err != nil {
			log.WithContext(ctx).Error("role delete error", zap.Error(err))
			return errorcode.Desc(errorcode.RoleDeleteError)
		}
		//save message
		if err = tx.MqMessage.WithContext(ctx).Create(msg); err != nil {
			log.WithContext(ctx).Error("save delete role message error", zap.Error(err))
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("Discard transaction error", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (r roleRepo) Query(ctx context.Context, param *configuration_center_v1.RoleListOptions) ([]*model.SystemRole, int64, error) {
	sr := r.q.SystemRole
	srDo := sr.WithContext(ctx)
	if param.Keyword != "" {
		srDo = srDo.Where(sr.Name.Like("%" + common.KeywordEscape(param.Keyword) + "%"))
	}
	srDo = srDo.Order(sr.System.Desc())
	if param.Sort == sr.CreatedAt.ColumnName().String() {
		if param.Direction == "desc" {
			srDo = srDo.Order(sr.CreatedAt.Desc())
		} else {
			srDo = srDo.Order(sr.CreatedAt)
		}
	}
	if param.Sort == sr.UpdatedAt.ColumnName().String() {
		if param.Direction == "desc" {
			srDo = srDo.Order(sr.UpdatedAt.Desc())
		} else {
			srDo = srDo.Order(sr.UpdatedAt)
		}
	}
	roleInfos, total, err := srDo.FindByPage((param.Offset-1)*(param.Limit), param.Limit)
	if err != nil {
		return nil, 0, err
	}
	return roleInfos, total, nil
}

func (r roleRepo) QueryByIds(ctx context.Context, roleIds []string) ([]*model.SystemRole, error) {
	sr := r.q.SystemRole
	srDo := sr.WithContext(ctx)
	roles, err := srDo.Unscoped().Where(sr.ID.In(roleIds...)).Find()
	return roles, err
}

func (r roleRepo) Get(ctx context.Context, rid string) (*model.SystemRole, error) {
	sr := r.q.SystemRole
	return sr.WithContext(ctx).Unscoped().Where(sr.ID.Eq(rid)).First()
}

func (r roleRepo) GetByIds(ctx context.Context, rids []string) ([]*model.SystemRole, error) {
	sr := r.q.SystemRole
	return sr.WithContext(ctx).Unscoped().Where(sr.ID.In(rids...)).Find()
}

func (r roleRepo) CheckRepeat(ctx context.Context, id, name string) (bool, error) {
	sr := r.q.SystemRole
	if id == "" {
		count, err := sr.WithContext(ctx).Where(sr.Name.Eq(name)).Count()
		return count > 0, err
	}
	count, err := sr.WithContext(ctx).Where(sr.Name.Eq(name), sr.ID.Neq(id)).Count()
	return count > 0, err
}
func (r *roleRepo) InsertUserRole(ctx context.Context, userRoles []*model.UserRole) error {
	err := r.q.UserRole.WithContext(ctx).CreateInBatches(userRoles, common.DefaultBatchSize)
	return err
}

func (r *roleRepo) UpsertRelations(ctx context.Context, roleId string, userIds []string) error {
	err := r.q.Transaction(func(tx *query.Query) error {
		//delete all the users in role
		_, err := tx.UserRole.WithContext(ctx).Delete(&model.UserRole{
			RoleID: roleId,
		})
		if err != nil {
			return err
		}
		//insert new relations
		relations := make([]*model.UserRole, 0, len(userIds))
		for _, uid := range userIds {
			relations = append(relations, &model.UserRole{
				UserID: uid,
				RoleID: roleId,
			})
		}
		return tx.UserRole.WithContext(ctx).Create(relations...)
	})
	return err
}

func (r *roleRepo) DeleteUserRole(ctx context.Context, uid string, rid string, msg *model.MqMessage) error {
	err := r.q.Transaction(func(tx *query.Query) error {
		info, err := tx.UserRole.WithContext(ctx).Delete(&model.UserRole{
			UserID: uid,
			RoleID: rid,
		})
		if err != nil {
			return err
		}
		if info.RowsAffected == 0 {
			return errorcode.NoRowAffectedError
		}
		//save message
		if err = tx.MqMessage.WithContext(ctx).Create(msg); err != nil {
			return err
		}
		return nil
	})
	return err
}

func (r *roleRepo) GetUserRole(ctx context.Context, uid string) ([]*model.UserRole, error) {
	return r.q.UserRole.WithContext(ctx).Where(r.q.UserRole.UserID.Eq(uid)).Find()
}

func (r *roleRepo) UserInRole(ctx context.Context, rid, uid string) (bool, error) {
	userRoleDo := r.q.UserRole
	roleDo := r.q.SystemRole
	count, err := roleDo.WithContext(ctx).
		Join(userRoleDo, userRoleDo.RoleID.EqCol(roleDo.ID)).
		Where(
			userRoleDo.UserID.Eq(uid),
			roleDo.ID.Eq(rid),
		).
		Count()
	if err != nil {
		return false, err
	}
	if count > 0 {
		return true, nil
	}
	return false, nil
}

func (r roleRepo) GetRoleUsers(ctx context.Context, rid string) ([]*model.UserRole, error) {
	return r.q.UserRole.WithContext(ctx).Where(r.q.UserRole.RoleID.Eq(rid)).Order(r.q.UserRole.CreatedAt.Desc()).Find()
}

func (r roleRepo) GetRolesUsers(ctx context.Context, rids ...string) ([]*model.UserRole, error) {
	return r.q.UserRole.WithContext(ctx).Where(r.q.UserRole.RoleID.In(rids...)).Find()
}

func (r roleRepo) DeleteMQMessage(ctx context.Context, mid string) error {
	_, err := r.q.MqMessage.WithContext(ctx).Where(r.q.MqMessage.ID.Eq(mid)).Delete()
	return err
}

func (r roleRepo) GetRoleUsersInPage(ctx context.Context, param *domain.QueryRoleUserPageReqParam) (int64, []*role.GetRoleUsersInPageRes, error) {
	userRole := r.q.UserRole
	user := r.q.User

	resultDo := userRole.WithContext(ctx).Select(user.ALL, userRole.CreatedAt).LeftJoin(user, user.ID.EqCol(userRole.UserID))
	resultDo = resultDo.Where(userRole.RoleID.Eq(*param.RId))
	if *param.Sort == userRole.CreatedAt.ColumnName().String() {
		if *param.Direction == "desc" {
			resultDo = resultDo.Order(userRole.CreatedAt.Desc())
		} else {
			resultDo = resultDo.Order(userRole.CreatedAt)
		}
	}
	if param.UserName != "" {
		resultDo = resultDo.Where(user.Name.Like("%" + param.UserName + "%"))
	}
	resultDo = resultDo.Where(user.Status.Eq(1))
	total, err := resultDo.Count()
	if err != nil {
		return 0, nil, err
	}
	us := make([]*role.GetRoleUsersInPageRes, 0)
	err = resultDo.Offset((*param.Offset - 1) * (*param.Limit)).Limit(*param.Limit).Scan(&us)
	return total, us, err
}
func (r roleRepo) GetRolesByProvider(ctx context.Context) ([]*model.SystemRole, error) {
	sr := r.q.SystemRole
	return sr.WithContext(ctx).Find()
}

// GetUserRoleIDs implements role.Repo.
func (r *roleRepo) GetUserRoleIDs(ctx context.Context, userID string) (roleIDs []string, err error) {
	query := r.q.SystemRole.WithContext(ctx).Select(r.q.SystemRole.ID)

	if userID != "" {
		query = query.LeftJoin(r.q.UserRole, r.q.SystemRole.ID.EqCol(r.q.UserRole.RoleID))
		query = query.Where(r.q.UserRole.UserID.Eq(userID))
	}

	err = query.Scan(&roleIDs)
	return
}

// 更新指定的用户、角色关系。
//
//  1. 期望存在，实际不存在，创建
//  2. 期望不存在，实际存在，删除
//  3. 期望与实际一致，无操作
//  4. 未指定的用户、角色关系，无操作
func (r *roleRepo) ReconcileUserRoles(ctx context.Context, present, absent []model.UserRole) error {
	// 涉及的用户
	var userIDs = make(sets.Set[string])
	// 涉及的角色
	var roleIDs = make(sets.Set[string])
	for _, ur := range present {
		userIDs.Insert(ur.UserID)
		roleIDs.Insert(ur.RoleID)
	}
	for _, ur := range absent {
		userIDs.Insert(ur.UserID)
		roleIDs.Insert(ur.RoleID)
	}
	log.WithContext(ctx).Debug("reconcile user roles for specified user and roles", zap.Any("userIDs", userIDs), zap.Any("roleIDs", roleIDs))

	// 与指定的用户、角色相关的实际存在的 model.UserRole
	actual, err := r.q.UserRole.WithContext(ctx).Where(r.q.UserRole.RoleID.In(roleIDs.UnsortedList()...)).Or(r.q.UserRole.UserID.In(userIDs.UnsortedList()...)).Find()
	if err != nil {
		return err
	}

	// 需要删除的用户、角色关系
	var toDelete []*model.UserRole
	for _, want := range absent {
		for _, got := range actual {
			if got.UserID != want.UserID {
				continue
			}
			if got.RoleID != want.RoleID {
				continue
			}
			log.WithContext(ctx).Debug("user role should be present", zap.Any("userRole", got))
			toDelete = append(toDelete, got)
			break
		}
	}
	if toDelete != nil {
		log.WithContext(ctx).Info("delete user roles that should be absent", zap.Any("userRoles", toDelete))
		result, err := r.q.UserRole.WithContext(ctx).Delete(toDelete...)
		if err != nil {
			return err
		}
		log.Debug("delete user roles that should be absent", zap.Any("userRoles", toDelete), zap.Any("result", result))
	}

	// 需要创建的用户、角色关系
	var toCreate []*model.UserRole
	for _, want := range present {
		var existed bool
		for _, got := range actual {
			if got.UserID != want.UserID {
				continue
			}
			if got.RoleID != want.RoleID {
				continue
			}
			existed = true
			break
		}
		if existed {
			continue
		}
		log.WithContext(ctx).Debug("user role should be preset", zap.Any("userRole", want))
		toCreate = append(toCreate, &model.UserRole{UserID: want.UserID, RoleID: want.RoleID})
	}
	if toCreate != nil {
		log.WithContext(ctx).Info("create user roles that should be present", zap.Any("userRoles", toCreate))
		if err := r.q.UserRole.WithContext(ctx).Create(toCreate...); err != nil {
			return err
		}
	}

	return nil
}
