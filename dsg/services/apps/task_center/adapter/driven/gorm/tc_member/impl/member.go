package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_member"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/samber/lo"
)

type MemberRepo struct {
	data *db.Data
}

func NewMemberRepo(data *db.Data) tc_member.Repo {
	return &MemberRepo{data: data}
}

func (m *MemberRepo) Query(ctx context.Context, obj int8, objId string) (ms []*model.TcMember, err error) {
	err = m.data.DB.WithContext(ctx).Where("obj=? and obj_id=? ", obj, objId).Find(&ms).Error
	return
}

func (m *MemberRepo) QueryProjectMembers(ctx context.Context, objId string) (ms []*model.TcMember, err error) {
	err = m.data.DB.WithContext(ctx).Where("obj=? and obj_id=? ", constant.ProjectObjValue, objId).Order("-created_at").Find(&ms).Error
	return
}

func (m *MemberRepo) QueryUserProject(ctx context.Context, userID string) (ps []string, err error) {
	ms := make([]*model.TcMember, 0)
	err = m.data.DB.WithContext(ctx).Distinct("obj_id").Where("user_id=? and obj=? ", userID, constant.ProjectObjValue).Find(&ms).Error
	if err != nil {
		return nil, err
	}
	return lo.Times(len(ms), func(index int) string {
		return ms[index].ObjID
	}), nil
}
