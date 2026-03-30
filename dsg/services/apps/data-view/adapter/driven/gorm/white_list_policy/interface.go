package white_list_policy

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type WhiteListPolicyRepo interface {
	GetWhiteListPolicyList(ctx context.Context) (whiteListPolicy []*model.WhiteListPolicy, err error)
	GetWhiteListPolicyListByCondition(ctx context.Context, req *form_view.GetWhiteListPolicyListReq) (total int64, whiteListPolicy []*model.WhiteListPolicy, err error)
	GetWhiteListPolicyDetail(ctx context.Context, id string) (whiteListPolicy *model.WhiteListPolicy, err error)
	CreateWhiteListPolicy(ctx context.Context, whiteListPolicy *model.WhiteListPolicy) error
	UpdateWhiteListPolicy(ctx context.Context, whiteListPolicy *model.WhiteListPolicy) error
	DeleteWhiteListPolicy(ctx context.Context, id string, userid string) error
	GetWhiteListPolicyListByFormView(ctx context.Context, formViewIDs []string) (whiteListPolicy []*model.WhiteListPolicy, err error)
	GetWhiteListPolicyByFormView(ctx context.Context, formViewID string) (whiteListPolicy *model.WhiteListPolicy, err error)
}
