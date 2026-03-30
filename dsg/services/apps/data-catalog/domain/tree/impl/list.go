package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (u *useCase) List(ctx context.Context, req *domain.ListReqParam) (*domain.ListRespParam, error) {
	// 检测keyword是否有效
	if len(req.Keyword) > 0 && !util.CheckKeyword(&req.Keyword) {
		log.WithContext(ctx).Errorf("keyword is invalid, keyword: %s", req.KeywordInfo)
		return domain.NewListRespParam(nil, 0), nil
	}

	models, total, err := u.repo.ListByPage(ctx, *req.Offset, *req.Limit, *req.Sort, *req.Direction, req.Keyword)
	if err != nil {
		return nil, err
	}

	return domain.NewListRespParam(models, total), nil
}
