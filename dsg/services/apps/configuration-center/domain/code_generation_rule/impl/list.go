package impl

import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/sets"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// List implements domain.UseCase.
func (c *UseCase) List(ctx context.Context) (*domain.CodeGenerationRuleList, error) {
	rules, err := c.codeRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	var list = &domain.CodeGenerationRuleList{
		Entries:    make([]domain.CodeGenerationRule, len(rules)),
		TotalCount: len(rules),
	}
	for i := range rules {
		rules[i].DeepCopyInto(&list.Entries[i].CodeGenerationRule)
	}

	c.completeCodeGenerationRuleListUpdaterName(ctx, list)
	return list, nil

}

func (c *UseCase) completeCodeGenerationRuleListUpdaterName(ctx context.Context, list *domain.CodeGenerationRuleList) {
	log := log.WithContext(ctx)

	// updater 的 ID 集合
	updaterIDSet := sets.New[uuid.UUID]()
	for _, r := range list.Entries {
		updaterIDSet.Insert(r.UpdaterID)
	}

	var updaterIDStrings []string
	for _, id := range updaterIDSet.UnsortedList() {
		updaterIDStrings = append(updaterIDStrings, id.String())
	}

	users, err := c.userRepo.ListUserByIDs(ctx, updaterIDStrings...)
	if err != nil {
		log.Warn("list updaters fail", zap.Error(err), zap.Stringers("updaterIDs", updaterIDSet.UnsortedList()))
		return
	}

	// updater 的 ID 到 Name 的映射
	var userIDName = make(map[string]string)
	for _, u := range users {
		if u == nil {
			continue
		}
		userIDName[u.ID] = u.Name
	}

	// 设置编码规则的 UpdaterName
	for i, r := range list.Entries {
		n, ok := userIDName[r.UpdaterID.String()]
		if !ok {
			log.Warn("updater name is not found", zap.Stringer("id", r.UpdaterID))
		}
		list.Entries[i].UpdaterName = n
	}

	return
}
