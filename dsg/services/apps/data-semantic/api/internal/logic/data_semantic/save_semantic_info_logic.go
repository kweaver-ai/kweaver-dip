// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/errorx"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_field_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type SaveSemanticInfoLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 保存库表信息补全数据
func NewSaveSemanticInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SaveSemanticInfoLogic {
	return &SaveSemanticInfoLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SaveSemanticInfoLogic) SaveSemanticInfo(req *types.SaveSemanticInfoReq) (resp *types.SaveSemanticInfoResp, err error) {
	logx.Infof("SaveSemanticInfo called with id: %s, tableData: %v, fieldData: %v",
		req.Id, req.TableData != nil, req.FieldData != nil)

	// 1. 状态校验：只有状态 2（待确认）才能编辑
	formViewModel := form_view.NewFormViewModel(l.svcCtx.DB)
	formViewData, err := formViewModel.FindOneById(l.ctx, req.Id)
	if err != nil {
		return nil, errorx.Detail(errorx.QueryFailed, err, "库表视图")
	}

	if formViewData.UnderstandStatus != form_view.StatusPendingConfirm {
		return nil, errorx.Desc(errorx.InvalidUnderstandStatus)
	}

	// 2. 使用事务执行更新操作（保证原子性）
	err = l.svcCtx.DB.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		// 获取 user_id
		userID := l.getUserIDFromContext()

		// 2.1 如果提供了 TableData，更新 t_form_view_info_temp
		if req.TableData != nil {
			formViewInfoTempModel := form_view_info_temp.NewFormViewInfoTempModelSession(session)

			// 构建更新数据
			tableInfoTemp := &form_view_info_temp.FormViewInfoTemp{
				Id:                req.TableData.Id,
				FormViewId:        req.Id,
				UserId:            &userID,
				TableBusinessName: req.TableData.TableBusinessName,
				TableDescription:  req.TableData.TableDescription,
			}

			err := formViewInfoTempModel.Update(ctx, tableInfoTemp)
			if err != nil {
				return errorx.Detail(errorx.UpdateFailed, err, "库表信息")
			}
			logx.WithContext(ctx).Infof("Updated table info: id=%s, user_id=%s", req.TableData.Id, userID)
		}

		// 2.2 如果提供了 FieldData，更新 t_form_view_field_info_temp
		if req.FieldData != nil {
			formViewFieldInfoTempModel := form_view_field_info_temp.NewFormViewFieldInfoTempModelSession(session)

			// 构建更新数据
			fieldInfoTemp := &form_view_field_info_temp.FormViewFieldInfoTemp{
				Id:                req.FieldData.Id,
				UserId:            &userID,
				FieldBusinessName: req.FieldData.FieldBusinessName,
				FieldRole:         req.FieldData.FieldRole,
				FieldDescription:  req.FieldData.FieldDescription,
			}

			err := formViewFieldInfoTempModel.Update(ctx, fieldInfoTemp)
			if err != nil {
				return errorx.Detail(errorx.UpdateFailed, err, "字段信息")
			}
			logx.WithContext(ctx).Infof("Updated field info: id=%s, user_id=%s", req.FieldData.Id, userID)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	resp = &types.SaveSemanticInfoResp{
		Code: 0,
	}

	return resp, nil
}

// getUserIDFromContext 从 context 中获取 user_id
func (l *SaveSemanticInfoLogic) getUserIDFromContext() string {
	if userInfo, ok := l.ctx.Value(middleware.InfoName).(*middleware.UserInfo); ok && userInfo != nil {
		return userInfo.ID
	}
	return ""
}
