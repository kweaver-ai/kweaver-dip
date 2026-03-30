package impl

// func (f *flowchartUseCase) UploadImage(ctx context.Context, req *domain.UploadImageReqParamBody, fId int64) (*domain.UploadImageRespParam, error) {
// 	// 运营流程与运营流程版本匹配检测
// 	fc, fcV, err := f.FlowchartAndVersionExistCheck(ctx, fId, *req.VersionID)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	// 运营流程状态检测，只有编辑中的状态才可以去设置缩略图
// 	if fc.EditStatus == constant.FlowchartEditStatusNormal || fcV.EditStatus == constant.FlowchartEditStatusNormal {
// 		log.WithContext(ctx).Errorf("flowchart not in edit status, fid: %v, vid: %v", fId, req.VersionID)
// 		err = fmt.Errorf("flowchart not in edit status")
// 		return nil, errorcode.Detail(errorcode.FlowchartNotInEditing, err)
// 	}
//
// 	fcV.Image = *req.Image
// 	err = f.repoFlowchartVersion.UpdateImage(ctx, fcV)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	return &domain.UploadImageRespParam{
// 		ID:        fc.ID,
// 		VersionID: fcV.ID,
// 		Name:      fc.Name,
// 	}, nil
// }
