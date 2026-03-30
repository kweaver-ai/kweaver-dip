package impl

import (
	"context"
	"errors"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_version"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"gorm.io/gen/field"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	txConflictErr = errors.New("tx conflict")
)

type flowchartVersionRepo struct {
	q *query.Query
}

func NewFlowchartVersionRepo(db *gorm.DB) flowchart_version.Repo {
	return &flowchartVersionRepo{q: common.GetQuery(db)}
}
func NewFlowchartVersionRepoNative(DB *gorm.DB) flowchart_version.Repo {
	return &flowchartVersionRepo{q: common.GetQuery(DB)}
}

func (f *flowchartVersionRepo) Get(ctx context.Context, vId string) (*model.FlowchartVersion, error) {
	return f.get(ctx, vId, false)
}

func (f *flowchartVersionRepo) GetUnscoped(ctx context.Context, vId string) (*model.FlowchartVersion, error) {
	return f.get(ctx, vId, true)
}

func (f *flowchartVersionRepo) get(ctx context.Context, vId string, unscoped bool) (*model.FlowchartVersion, error) {
	fcVDo := f.q.FlowchartVersion

	do := fcVDo.WithContext(ctx).Where(fcVDo.ID.Eq(vId))

	if unscoped {
		do = do.Unscoped()
	}

	fcV, err := do.First()
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get flowchart version form db, flowchart vid: %v, err: %v", vId, err)
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.FlowchartVersionNotExist, err)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return fcV, nil
}

func (f *flowchartVersionRepo) GetByIds(ctx context.Context, ids ...string) ([]*model.FlowchartVersion, error) {
	ms, err := f.ListByIds(ctx, ids...)
	if err != nil {
		return nil, err
	}

	if len(ms) != len(ids) {
		log.WithContext(ctx).Error("flowchart version not all found", zap.Strings("flowchart version ids", ids))
		return nil, errorcode.Detail(errorcode.FlowchartVersionNotExist, err)
	}

	return ms, nil
}

func (f *flowchartVersionRepo) ListByIds(ctx context.Context, ids ...string) ([]*model.FlowchartVersion, error) {
	if len(ids) < 1 {
		return nil, nil
	}

	fcVDo := f.q.FlowchartVersion

	ms, err := fcVDo.WithContext(ctx).Where(fcVDo.ID.In(ids...)).Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to list flowchart version form db", zap.Strings("flowchart version ids", ids), zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return ms, nil
}

func (f *flowchartVersionRepo) UpdateDrawPropertiesAndImage(ctx context.Context, fcV *model.FlowchartVersion, hasImage bool) (bool, error) {
	err := f.q.Transaction(func(tx *query.Query) error {
		fcDo := tx.Flowchart
		fcVDo := tx.FlowchartVersion
		_fcDo := fcDo.WithContext(ctx)
		_fcVDo := fcVDo.WithContext(ctx)

		fc, err := _fcDo.Where(fcDo.ID.Eq(fcV.FlowchartID)).First()
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorcode.Detail(errorcode.FlowchartNotExist, err)
			}

			return err
		}

		if fc.EditStatus == int32(constant.FlowchartEditStatusNormal) {
			// 运营流程是发布状态，需要新建一个运营流程版本
			fcV.ID = util.NewUUID()
			info, err := _fcDo.Where(fcDo.ID.Eq(fc.ID), fcDo.EditStatus.Eq(fc.EditStatus), fcDo.UpdatedAt.Eq(fc.UpdatedAt)).UpdateSimple(fcDo.EditStatus.Value(int32(constant.FlowchartEditStatusEditing)), fcDo.EditingVersionID.Value(fcV.ID))
			if err != nil {
				return err
			}
			if info.RowsAffected < 1 {
				// 更新失败，已被其它地方更新
				return txConflictErr
			}

			var curVNum int32
			curVNum, err = f.GetMaxVersionNum(ctx, fc.ID)
			if err != nil {
				return err
			}

			curVNum += 1
			fcV.Name = util.GenFlowchartVersionName(curVNum)
			fcV.Version = curVNum
			fcV.EditStatus = int32(constant.FlowchartEditStatusEditing) // 只能是编辑
			err = _fcVDo.Create(fcV)
			if err != nil {
				return err
			}

			fc.EditStatus = int32(constant.FlowchartEditStatusEditing)
			fc.EditingVersionID = fcV.ID

		} else {
			// 运营流程是新建/编辑状态，使用正在编辑的运营流程版本
			var curEditFcV *model.FlowchartVersion
			curEditFcV, err = _fcVDo.Where(fcVDo.ID.Eq(fc.EditingVersionID)).First()
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errorcode.Detail(errorcode.FlowchartVersionNotExist, err)
				}

				return err
			}

			if curEditFcV.EditStatus == int32(constant.FlowchartEditStatusNormal) {
				return txConflictErr
			}

			info, err := _fcDo.Where(fcDo.ID.Eq(fc.ID), fcDo.EditStatus.Eq(fc.EditStatus), fcDo.UpdatedAt.Eq(fc.UpdatedAt), fcDo.EditingVersionID.Eq(fc.EditingVersionID)).UpdateSimple(fcDo.UpdatedAt.Value(time.Now()))
			if err != nil {
				return err
			}
			if info.RowsAffected < 1 {
				return txConflictErr
			}

			curEditFcV.DrawProperties = fcV.DrawProperties
			if hasImage {
				curEditFcV.Image = fcV.Image
			}
			fcV = curEditFcV
			updatedCols := []field.AssignExpr{fcVDo.DrawProperties.Value(fcV.DrawProperties)}
			if hasImage {
				updatedCols = append(updatedCols, fcVDo.Image.Value(fcV.Image))
			}
			_, err = _fcVDo.Where(fcVDo.ID.Eq(fcV.ID)).UpdateSimple(updatedCols...)
			if err != nil {
				return err
			}

			// fcV.UpdatedAt = time.Now()
			// // UPDATE `flowchart_version` AS fcv INNER JOIN `flowchart` AS fc
			// // 		ON fc.`id`=fcv.`flowchart_id`
			// // SET fcv.`draw_properties`=?, fcv.`image`=?
			// // WHERE fcv.`id`=? AND fcv.`edit_status`=? AND fcv.`updated_at`=? AND fcv.`deleted_at` IS NULL
			// // 		AND fc.`id`=? AND fc.`edit_status`=? AND fc.`updated_at`=? AND fc.`deleted_at` IS NULL;
			// sql := fmt.Sprintf("UPDATE `%s` AS fcv INNER JOIN `%s` AS fc "+
			// 	"ON fc.`%s`=fcv.`%s` "+
			// 	"SET fcv.`%s`=?, fcv.`%s`=?, fcv.`%s`=? "+
			// 	"WHERE fcv.`%s`=? AND fcv.`%s`=? AND fcv.`%s`=? AND fcv.`%s` IS NULL "+
			// 	"AND fc.`%s`=? AND fc.`%s`=? AND fc.`%s`=? AND fc.`%s` IS NULL",
			// 	fcVDo.TableName(), fcDo.TableName(),
			// 	fcDo.ID.ColumnName(), fcVDo.FlowchartID.ColumnName(),
			// 	fcVDo.DrawProperties.ColumnName(), fcVDo.Image.ColumnName(), fcVDo.UpdatedAt.ColumnName(),
			// 	fcVDo.ID.ColumnName(), fcVDo.EditStatus.ColumnName(), fcVDo.UpdatedAt.ColumnName(), fcVDo.DeletedAt.ColumnName(),
			// 	fcDo.ID.ColumnName(), fcDo.EditStatus.ColumnName(), fcDo.UpdatedAt.ColumnName(), fcDo.DeletedAt.ColumnName())
			// exec := _fcVDo.UnderlyingDB().WithContext(ctx).Exec(sql, fcV.DrawProperties, fcV.Image, fcV.UpdatedAt.Format("2006-01-02 15:04:05.000"), fcV.ID, fcV.EditStatus, fcV.UpdatedAt, fc.ID, fc.EditStatus, fc.UpdatedAt)
			// if exec.Error != nil {
			// 	return err
			// }
			// if exec.RowsAffected < 1 {
			// 	return txConflictErr
			// }
		}

		return nil
	})
	if err == nil {
		return true, nil
	}

	if errors.Is(err, txConflictErr) || errors.Is(err, gorm.ErrInvalidTransaction) {
		// 事务失败
		log.WithContext(ctx).Error("failed to update flowchart version content to db", zap.String("flowchart version id", fcV.ID), zap.Error(err))
		return false, nil
	}

	agerr := &agerrors.Error{}
	if errors.As(err, &agerr) {
		return false, err
	}

	log.WithContext(ctx).Error("failed to update flowchart version content to db", zap.String("flowchart version id", fcV.ID), zap.Error(err))
	return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
}

func (f *flowchartVersionRepo) SaveContent(ctx context.Context, fcV *model.FlowchartVersion, units []*model.FlowchartUnit, nodeCfgs []*model.FlowchartNodeConfig, nodeTasks []*model.FlowchartNodeTask, hasImage bool) (bool, error) {
	err := f.q.Transaction(func(tx *query.Query) error {
		fcDo := tx.Flowchart
		fcVDo := tx.FlowchartVersion
		fcUDo := tx.FlowchartUnit
		fcNDo := tx.FlowchartNodeConfig
		fcTDo := tx.FlowchartNodeTask
		_fcDo := fcDo.WithContext(ctx)
		_fcVDo := fcVDo.WithContext(ctx)
		_fcUDo := fcUDo.WithContext(ctx)
		_fcNDo := fcNDo.WithContext(ctx)
		_fcTDo := fcTDo.WithContext(ctx)

		fc, err := _fcDo.Where(fcDo.ID.Eq(fcV.FlowchartID)).First()
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorcode.Detail(errorcode.FlowchartNotExist, err)
			}

			return err
		}

		if fc.EditStatus == int32(constant.FlowchartEditStatusNormal) {
			// 运营流程是发布状态，需要新建一个运营流程版本
			fcV.ID = util.NewUUID()
			info, err := _fcDo.Where(fcDo.ID.Eq(fc.ID), fcDo.EditStatus.Eq(fc.EditStatus),
				fcDo.UpdatedAt.Eq(fc.UpdatedAt)).UpdateSimple(fcDo.EditingVersionID.Value(fcV.ID),
				//fcDo.CurrentVersionID.Value(fcV.ID), fcDo.ConfigStatus.Value(int32(constant.FlowchartConfigStatusInt32Normal)))
				fcDo.CurrentVersionID.Value(fcV.ID))
			if err != nil {
				return err
			}
			if info.RowsAffected < 1 {
				// 更新失败，已被其它地方更新
				return txConflictErr
			}

			var curVNum int32
			curVNum, err = f.GetMaxVersionNum(ctx, fc.ID)
			if err != nil {
				return err
			}

			curVNum += 1
			fcV.Name = util.GenFlowchartVersionName(curVNum)
			fcV.Version = curVNum
			fcV.EditStatus = int32(constant.FlowchartEditStatusNormal)
			err = _fcVDo.Create(fcV)
			if err != nil {
				return err
			}

			fc.EditingVersionID = fcV.ID
			fc.CurrentVersionID = fcV.ID

		} else {
			// 运营流程是新建/编辑状态，使用当前正在编辑的运营流程版本
			var curEditFcV *model.FlowchartVersion
			curEditFcV, err = _fcVDo.Where(fcVDo.ID.Eq(fc.EditingVersionID)).First()
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errorcode.Detail(errorcode.FlowchartVersionNotExist, err)
				}

				return err
			}

			if curEditFcV.EditStatus == int32(constant.FlowchartEditStatusNormal) {
				return txConflictErr
			}

			info, err := _fcDo.Where(fcDo.ID.Eq(fc.ID), fcDo.EditStatus.Eq(fc.EditStatus), fcDo.UpdatedAt.Eq(fc.UpdatedAt),
				fcDo.EditingVersionID.Eq(fc.EditingVersionID)).UpdateSimple(fcDo.CurrentVersionID.Value(fc.EditingVersionID),
				fcDo.EditStatus.Value(int32(constant.FlowchartEditStatusNormal)))
			//fcDo.ConfigStatus.Value(int32(constant.FlowchartConfigStatusInt32Normal)))
			if err != nil {
				return err
			}
			if info.RowsAffected < 1 {
				return txConflictErr
			}

			curEditFcV.DrawProperties = fcV.DrawProperties
			if hasImage {
				curEditFcV.Image = fcV.Image
			}
			curEditFcV.EditStatus = int32(constant.FlowchartEditStatusNormal)
			fcV = curEditFcV
			updatedCols := []field.AssignExpr{fcVDo.DrawProperties.Value(fcV.DrawProperties), fcVDo.EditStatus.Value(fcV.EditStatus)}
			if hasImage {
				updatedCols = append(updatedCols, fcVDo.Image.Value(fcV.Image))
			}
			_, err = _fcVDo.Where(fcVDo.ID.Eq(fcV.ID)).UpdateColumnSimple(updatedCols...)
			if err != nil {
				return err
			}
		}

		for _, unit := range units {
			unit.FlowchartVersionID = fcV.ID
		}
		if len(units) > 0 {
			err = _fcUDo.CreateInBatches(units, common.DefaultBatchSize)
			if err != nil {
				return err
			}
		}

		for _, cfg := range nodeCfgs {
			// node id在上层赋值
			cfg.FlowchartVersionID = fcV.ID
		}
		if len(nodeCfgs) > 0 {
			err = _fcNDo.CreateInBatches(nodeCfgs, common.DefaultBatchSize)
			if err != nil {
				return err
			}
		}

		for _, task := range nodeTasks {
			// node id在上层赋值
			task.FlowchartVersionID = fcV.ID
		}
		if len(nodeTasks) > 0 {
			err = _fcTDo.CreateInBatches(nodeTasks, common.DefaultBatchSize)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err == nil {
		return true, nil
	}

	if errors.Is(err, txConflictErr) || errors.Is(err, gorm.ErrInvalidTransaction) {
		// 事务失败
		log.WithContext(ctx).Error("failed to save flowchart version content to db", zap.String("flowchart version id", fcV.ID), zap.Error(err))
		return false, nil
	}

	agerr := &agerrors.Error{}
	if errors.As(err, &agerr) {
		return false, err
	}

	log.WithContext(ctx).Error("failed to save flowchart version content to db", zap.String("flowchart version id", fcV.ID), zap.Error(err))
	return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
}

func (f *flowchartVersionRepo) GetMaxVersionNum(ctx context.Context, fid string) (int32, error) {
	fcVDo := f.q.FlowchartVersion
	_fcDo := fcVDo.WithContext(ctx)

	var maxVNum int32
	err := _fcDo.Unscoped().Select(fcVDo.Version.Max()).Where(fcVDo.FlowchartID.Eq(fid)).Scan(&maxVNum)
	if err != nil {
		log.WithContext(ctx).Error("failed to get max flowchart version num form db", zap.String("flowchart id", fid), zap.Error(err))
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return maxVNum, nil
}
func (f *flowchartVersionRepo) GetAll(ctx context.Context) ([]*model.FlowchartVersion, error) {
	fcVDo := f.q.FlowchartVersion

	ms, err := fcVDo.WithContext(ctx).Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to list flowchart version form db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return ms, nil
}
func (f *flowchartVersionRepo) UpdateDrawProperties(ctx context.Context, fcV *model.FlowchartVersion) error {
	fcVDo := f.q.FlowchartVersion
	_fcVDo := fcVDo.WithContext(ctx)
	updatedCols := []field.AssignExpr{fcVDo.DrawProperties.Value(fcV.DrawProperties)}
	_, err := _fcVDo.Where(fcVDo.ID.Eq(fcV.ID)).UpdateSimple(updatedCols...)
	if err != nil {
		return err
	}
	return nil
}
