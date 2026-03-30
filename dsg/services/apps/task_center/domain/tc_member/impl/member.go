package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_member"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_member"
)

type MemberUserCase struct {
	repo tc_member.Repo
}

func NewMemberUserCase(repo tc_member.Repo) domain.UserCase {
	return &MemberUserCase{
		repo: repo,
	}
}
