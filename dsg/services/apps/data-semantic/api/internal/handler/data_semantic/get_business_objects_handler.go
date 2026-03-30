// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/logic/data_semantic"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/httpxutil"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// 查询业务对象识别结果
func GetBusinessObjectsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetBusinessObjectsReq
		if err := httpxutil.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := data_semantic.NewGetBusinessObjectsLogic(r.Context(), svcCtx)
		resp, err := l.GetBusinessObjects(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
