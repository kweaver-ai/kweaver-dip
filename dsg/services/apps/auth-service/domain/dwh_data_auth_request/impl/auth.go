package impl

import (
	"context"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

// UpsertUserMonopolySubView 保证一个用户在某个视图只有一个独享的行列规则
func (u *useCaseImpl) UpsertUserMonopolySubView(ctx context.Context, req *dto.DataAuthFormDetail) error {
	if req.SubView.ID == "" {
		return u.createUserMonopolySubView(ctx, req)
	}
	return u.updateUserMonopolySubView(ctx, req)
}

// createUserMonopolySubView 新建用户独占的行列规则
// 1: 当前用户退出当前视图的所有行列规则的读取权限
// 2: 新建独占的行列规则
func (u *useCaseImpl) createUserMonopolySubView(ctx context.Context, req *dto.DataAuthFormDetail) error {
	subViewIDSlice, err := u.getUserAuthSubviewInThisView(ctx, req.Applicant, req.DataID)
	if err != nil {
		log.Error("getUserAuthSubviewInThisView error: ", zap.Error(err))
		return err
	}
	if err = u.exitUserFromSubViews(ctx, req.Applicant, subViewIDSlice); err != nil {
		return err
	}
	return u.createViewAuthorizingRules(ctx, req)
}

// createViewAuthorizingRules 新建申请单，生成子视图，添加权限，保存子视图的ID
func (u *useCaseImpl) createViewAuthorizingRules(ctx context.Context, req *dto.DataAuthFormDetail) error {
	subViewID, err := u.handleCreateRequest(ctx, req)
	if err != nil {
		log.Error("handlerCreateRequest error: ", zap.Error(err))
		return err
	}
	specInfoBody := &model.TDwhAuthRequestSpec{
		RequestFormID: req.ID,
		ID:            subViewID,
	}
	return u.repo.SaveSubViewID(ctx, specInfoBody)
}

// updateUserMonopolySubView 更新用户独占的行列规则
// 1: 保持当前行列权限的独占性。查询用户的当前的是否独占一个行列规则
// 1.1: 如果是独占，那么更新当前的规则
// 1.2: 如果不是独占，那么退出当前行列规则的读取权限，添加新的行列规则并添加权限
// 2: 退出当前用户的其他行列权限
func (u *useCaseImpl) updateUserMonopolySubView(ctx context.Context, req *dto.DataAuthFormDetail) error {
	subViewIDSlice, err := u.getUserAuthSubviewInThisView(ctx, req.Applicant, req.DataID)
	if err != nil {
		log.Error("getUserAuthSubviewInThisView error: ", zap.Error(err))
		return err
	}
	//查询当前用户独占的行列规则
	onlySelf, err := u.checkIsUserMonopolyThisSubView(ctx, req.Applicant, req.SubView.ID)
	if err != nil {
		log.Error("checkIsUserMonopolyThisSubView error: ", zap.Error(err))
		return err
	}
	//不是独占，新建一个
	if !onlySelf {
		if err = u.exitUserFromSubViews(ctx, req.Applicant, subViewIDSlice); err != nil {
			return err
		}
		return u.createViewAuthorizingRules(ctx, req)
	}
	//独占，去掉自己，更新
	excludeSelf := lo.Filter(subViewIDSlice, func(item string, index int) bool {
		return item != req.SubView.ID
	})
	if err = u.exitUserFromSubViews(ctx, req.Applicant, excludeSelf); err != nil {
		return err
	}
	return u.updateViewAuthorizingRules(ctx, req)
}

// updateViewAuthorizingRules 处理更新申请单，更新视图，更新权限
func (u *useCaseImpl) updateViewAuthorizingRules(ctx context.Context, req *dto.DataAuthFormDetail) error {
	syncFunc := func() error {
		if err := u.handleUpdateRequest(ctx, req); err != nil {
			log.Error("UpsertViewAuthorizingRules error: ", zap.Error(err))
			return err
		}
		return nil
	}
	//保存结果
	if err := u.repo.UpdateAfterAuditApproved(ctx, req.ID, syncFunc); err != nil {
		log.Error("update audited status error: ", zap.Error(err))
		return err
	}
	return nil
}

// handlerCreateRequest 处理新增申请单的case
func (u *useCaseImpl) handleCreateRequest(ctx context.Context, req *dto.DataAuthFormDetail) (string, error) {
	//新建视图
	subView, err := u.dataViewLocal.CreateSubViewInternally(ctx, req.SubView.Spec)
	if err != nil {
		log.Warnf("CreateSubViewInternally error %v", err.Error())
		//遇到错误，改个名字继续试下
		req.SubView.Spec.Name = genUniqueSubViewName(req.SubView.Spec.Name)
		subView, err = u.dataViewLocal.CreateSubViewInternally(ctx, req.SubView.Spec)
		if err != nil {
			log.Errorf("CreateSubViewInternally error %v", err.Error())
			return "", err
		}
	}
	//保存好subViewID
	req.SubView.ID = subView.ID
	//授权
	return subView.ID, u.authSubViewForApplicant(ctx, req.SubView)
}

// handlerCreateRequest 处理更新申请单的case
func (u *useCaseImpl) handleUpdateRequest(ctx context.Context, req *dto.DataAuthFormDetail) error {
	//更新子视图
	if req.SpecChanged() {
		if req.DraftSpec != "" {
			req.SubView.Spec.Detail = req.DraftSpec
		}
		if _, err := u.dataViewLocal.UpdateSubViewInternally(ctx, req.SubView.ID, req.SubView.Spec); err != nil {
			log.Warnf("UpdateSubViewInternally error %v", err.Error())
			//遇到错误，改个名字继续试下
			req.SubView.Spec.Name = genUniqueSubViewName(req.SubView.Spec.Name)
			if _, err = u.dataViewLocal.UpdateSubViewInternally(ctx, req.SubView.ID, req.SubView.Spec); err != nil {
				log.Errorf("UpdateSubViewInternally error %v", err.Error())
				return fmt.Errorf("更新行列规则失败")
			}
		}
	}
	if req.ExpiredAtChanged() {
		//更新授权时间
		updatePolicy := &dto.PolicyUpdateReq{
			UpdatePolicy: dto.UpdatePolicy{
				Object: dto.Object{
					ObjectId:   req.SubView.ID,
					ObjectType: dto.ObjectSubView.Str(),
				},
				Subjects: []dto.Subject{
					{
						SubjectId:   req.Applicant,
						SubjectType: dto.SubjectUser.Str(),
						Permissions: lo.Times(len(req.SubView.Policies[0].Actions), func(index int) dto.Permission {
							return dto.Permission{
								Action: req.SubView.Policies[0].Actions[index].Str(),
								Effect: enum.EffectAllow,
							}
						}),
						ExpiredAt: timestampToExpiredAt(req.DraftExpiredAt),
					},
				},
				Partial: true,
			},
		}
		if err := u.auth.PolicyUpdateInternal(ctx, updatePolicy); err != nil {
			log.Errorf("PolicyUpdateInternal Error %v", err.Error())
			return fmt.Errorf("更新授权失败")
		}
	}
	return nil
}

// authSubViewForApplicant 添加权限
func (u *useCaseImpl) authSubViewForApplicant(ctx context.Context, spec dto.SubViewAuthorizingRequestSpec) error {
	subject := spec.Policies[0]
	policy := dto.Policy{
		Object: dto.Object{
			ObjectId:   spec.ID,
			ObjectType: dto.ObjectSubView.Str(),
		},
		Subjects: []dto.Subject{
			{
				SubjectId:   subject.SubjectID,
				SubjectType: subject.SubjectType.Str(),
				Permissions: lo.Times(len(subject.Actions), func(index int) dto.Permission {
					return dto.Permission{
						Action: subject.Actions[index].Str(),
						Effect: enum.EffectAllow,
					}
				}),
				ExpiredAt: subject.ExpiredAt,
			},
		},
	}
	return u.auth.PolicyWrite(ctx, policy)
}
