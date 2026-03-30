package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/operation_log"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/operation_log"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type OperationLogUserCase struct {
	repo       operation_log.Repo
	userDomain user.IUser
}

func NewOperationLogUserCase(repo operation_log.Repo, userDomain user.IUser) domain.UserCase {
	return &OperationLogUserCase{repo: repo, userDomain: userDomain}
}

func (o OperationLogUserCase) Create(ctx context.Context, operationLog *model.OperationLog) error {
	return o.repo.Insert(ctx, operationLog)
}

func (o OperationLogUserCase) Query(ctx context.Context, query *domain.OperationLogQueryParams) (*response.PageResult, error) {
	total, logs, err := o.repo.Get(ctx, query)
	if err != nil {
		return &response.PageResult{}, errorcode.Desc(errorcode.OperationLogDatabaseError)
	}
	return &response.PageResult{
		Entries:    o.GenOperationLogListSlice(logs),
		TotalCount: total,
		Offset:     query.Offset,
		Limit:      query.Limit,
	}, err
}
func (o OperationLogUserCase) GenOperationLogListSlice(operationLogs []*model.OperationLog) []*domain.OperationLogListModel {
	results := make([]*domain.OperationLogListModel, 0)
	for _, operationLog := range operationLogs {
		results = append(results, &domain.OperationLogListModel{
			ID:            operationLog.ID,
			Name:          operationLog.Name,
			Result:        operationLog.Result,
			CreatedByUID:  operationLog.CreatedByUID,
			CreatedByName: o.userDomain.GetNameByUserId(context.Background(), operationLog.CreatedByUID),
			CreatedAt:     operationLog.CreatedAt.UnixMilli(),
		})
	}
	return results
}
