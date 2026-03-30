package impl

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"golang.org/x/exp/slices"
)

type ObjectKind interface {
	Key() string
}

// checkSubjectIsObjectOwner 检查 subject 是否为 object 的 owner
func (a *auth) checkSubjectIsObjectOwner(ctx context.Context, subType, subID, objType, objID string) (ok bool, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 资源的 Owner 一定是一个用户而不是角色或部门，所以不需要判断访问者类型不是
	// 用户的鉴权请求
	if subType != enum.SubjectTypeUser {
		return
	}

	objectInfo, err := a.helper.getObjectInfo(ctx, objType, objID)
	if err != nil {
		return false, err
	}

	// 判断访问者是否是资源的 Owner 之一
	return slices.Contains(objectInfo.OwnerIDSlice(), subID), nil
}
