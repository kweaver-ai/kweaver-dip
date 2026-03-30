package impl

// func (f *flowchartUseCase) PreEdit(ctx context.Context, fId int64) (*domain.PreEditRespParam, error) {
// 	fc, err := f.FlowchartExistCheckDie(ctx, fId)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	var fcV *model.FlowchartVersion
// 	var prevFcV *model.FlowchartVersion
// 	var isNewVersion bool
// 	var suc bool
// 	rand.Seed(time.Now().UnixNano())
// 	for i := 0; i < 2; i++ {
// 		if i > 0 {
// 			time.Sleep(time.Duration(rand.Intn(10)+1) * 100 * time.Millisecond) // rand sleep 0.1s~1s
// 		}
//
// 		fc, err = f.FlowchartExistCheckDie(ctx, fId)
// 		if err != nil {
// 			break
// 		}
//
// 		// 新建/编辑状态下的运营流程，直接返回当前草稿版本
// 		if fc.EditStatus == constant.FlowchartEditStatusCreating || fc.EditStatus == constant.FlowchartEditStatusEditing {
// 			fcV, err = f.FlowchartVersionExistAndMatchCheckDie(ctx, fc.ID, fc.EditingVersionID)
// 			if err != nil {
// 				break
// 			}
//
// 			suc = true
// 			isNewVersion = false
// 			break
// 		}
//
// 		// 发布状态下的运营流程，需新建草稿版本
// 		prevFcV, err = f.FlowchartVersionExistAndMatchCheckDie(ctx, fc.ID, fc.CurrentVersionID)
// 		if err != nil {
// 			break
// 		}
//
// 		var maxVNum int32
// 		maxVNum, err = f.repoFlowchartVersion.GetMaxVersionNum(ctx, fc.ID)
// 		newVNum := maxVNum + 1
// 		curTime := time.Now()
// 		fcV = &model.FlowchartVersion{
// 			Name:           util.GenFlowchartVersionName(newVNum),
// 			Version:        newVNum,
// 			EditStatus:     constant.FlowchartEditStatusCreating,
// 			Image:          prevFcV.Image,
// 			FlowchartID:    fc.ID,
// 			DrawProperties: prevFcV.DrawProperties,
// 			CreatedAt:      curTime,
// 			UpdatedAt:      curTime,
// 		}
//
// 		fcV, suc, err = f.repoFlowchart.PreEdit(ctx, fc, fcV)
// 		if err != nil {
// 			log.WithContext(ctx).Errorf("failed to pre edit flowchart, err: %v", err)
// 			break
// 		}
//
// 		if suc {
// 			isNewVersion = true
// 			break
// 		}
//
// 		log.Warnf("failed to pre edit flowchart, possible transaction conflict, fid: %v, status: %v", fc.ID, fc.EditStatus)
// 	}
//
// 	if err == nil && !suc {
// 		err = fmt.Errorf("possible transaction conflict")
// 		log.WithContext(ctx).Errorf("failed to pre edit flowchart, fid: %v, status: %v, err: %v", fc.ID, fc.EditStatus, err)
// 		err = errorcode.Detail(errorcode.FlowchartAlreadyInEditing, err)
// 	}
//
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	return &domain.PreEditRespParam{
// 		ID:           fc.ID,
// 		VersionID:    fcV.ID,
// 		IsNewVersion: isNewVersion,
// 		Name:         fc.Name,
// 	}, nil
// }
