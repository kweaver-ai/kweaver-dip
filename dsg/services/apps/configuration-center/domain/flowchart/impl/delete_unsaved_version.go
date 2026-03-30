package impl

// func (f *flowchartUseCase) DeleteUnsavedVersion(ctx context.Context, vId, fId int64) (*domain.DeleteUnsavedVersionRespParam, error) {
// 	// 运营流程与运营流程版本匹配检测
// 	fc, fcV, err := f.FlowchartAndVersionExistCheck(ctx, fId, vId)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	if fcV.EditStatus != constant.FlowchartEditStatusEditing {
// 		// 目前删除只能删除编辑状态下的运营流程版本
// 		err = errorcode.Desc(errorcode.FlowchartVersionCanNotDeleteByNotInEditing)
// 		log.WithContext(ctx).Errorf("failed to delete unsaved flowchart version, flowchart version not in editing status, fid: %v, vid: %v, err: %v", fId, vId, err)
// 		return nil, err
// 	}
//
// 	if !fcV.CreatedAt.Equal(fcV.UpdatedAt) {
// 		// 创建时间不等于更新时间，说明已经更新过了，不能删除
// 		// 目前删除只能删除进入了编辑界面但是没有进行任何编辑动作的运营流程版本
// 		err = errorcode.Desc(errorcode.FlowchartVersionCanNotDeleteByEdited)
// 		log.WithContext(ctx).Errorf("failed to delete unsaved flowchart version, flowchart version has been edited, fid: %v, vid: %v, err: %v", fId, vId, err)
// 		return nil, err
// 	}
//
// 	err = f.repoFlowchartVersion.RealDelete(ctx, fcV.ID)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to delete unsaved flowchart version, fid: %v, vid: %v, err: %v", fId, vId, err)
// 		return nil, err
// 	}
//
// 	return &domain.DeleteUnsavedVersionRespParam{
// 		ID:        fc.ID,
// 		VersionID: fcV.ID,
// 		Name:      fc.Name,
// 	}, nil
// }
