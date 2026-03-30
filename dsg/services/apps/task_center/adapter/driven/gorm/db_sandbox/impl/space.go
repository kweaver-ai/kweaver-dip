package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

// AddSandboxSpace 更新沙箱状态，并且设置为可用状态
func (r *repoImpl) AddSandboxSpace(ctx context.Context, spaceID string, space int32) (err error) {
	err = r.db(ctx).Model(new(model.DBSandbox)).Where("id=? ", spaceID).Update("total_space",
		gorm.Expr("total_space+?", space)).Update("status", constant.SandboxSpaceStatusAvailable.Integer.Int32()).Error
	return err
}

func (r *repoImpl) GetSandboxSpace(ctx context.Context, id string) (data *model.DBSandbox, err error) {
	err = r.db(ctx).Where("id=?", id).First(&data).Error
	return data, errorcode.WrapNotfoundError(err)
}

func (r *repoImpl) GetSpaceByProjectID(ctx context.Context, projectID string) (data *model.DBSandbox, err error) {
	err = r.db(ctx).Where("project_id=?", projectID).First(&data).Error
	return nil, err
}

func (r *repoImpl) UpdateSpaceDataSet(ctx context.Context, data *domain.SandboxDataSetInfo) (err error) {
	err = r.db(ctx).Model(new(model.DBSandbox)).Where("id=?", data.SandboxID).UpdateColumn("recent_data_set", data.TargetTableName).Error
	return err
}

func (r *repoImpl) SpaceList(ctx context.Context, req *domain.SandboxSpaceListReq) (data []*domain.SandboxSpaceListItem, total int64, err error) {
	sb := &strings.Builder{}
	spaceListColumn := " ds.id AS sandbox_id, ds.project_id, tp.name as project_name, ds.applicant_id,  " +
		"  ds.applicant_name, ds.department_id ,ds.department_name, ds.total_space, ds.valid_start, ds.valid_end, ds.updated_at, " +
		"  ds.datasource_id, ds.datasource_name, ds.database_name , ds.datasource_type_name, ds.recent_data_set "

	spaceListTotal := ` count(ds.id) `

	sb.WriteString("SELECT %s FROM db_sandbox ds  join tc_project tp on ds.project_id=tp.id where ds.deleted_at=0 and tp.deleted_at=0  ")

	args := make([]interface{}, 0)
	sb.WriteString(" and  ds.status=? ")
	args = append(args, constant.SandboxSpaceStatusAvailable.Integer.Int32())

	if !req.IsDataOperationEngineer() {
		sb.WriteString(" and (ds.project_id in  ?  or  ds.applicant_id=? ) ")
		args = append(args, req.AuthorizedProjects, req.ApplicantID)
	}
	if req.Keyword != "" {
		sb.WriteString(" and tp.name like ? ")
		args = append(args, "%"+util.KeywordEscape(req.Keyword)+"%")
	}
	if req.UpdateStartTime > 0 {
		sb.WriteString(" and ds.updated_at >= ? ")
		args = append(args, time.UnixMilli(req.UpdateStartTime))
	}
	if req.UpdateEndTime > 0 {
		sb.WriteString(" and ds.updated_at <= ? ")
		args = append(args, time.UnixMilli(req.UpdateEndTime))
	}
	//获得总数
	if err = r.db(ctx).Raw(fmt.Sprintf(sb.String(), spaceListTotal), args...).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if req.Sort != nil {
		sb.WriteString(fmt.Sprintf(" order by %s %s", *req.Sort, *req.Direction))
	}
	sb.WriteString(" limit ? offset ? ")
	args = append(args, req.DBOLimit(), req.DBOffset())
	//获得具体的数据
	if err = r.db(ctx).Raw(fmt.Sprintf(sb.String(), spaceListColumn), args...).Scan(&data).Error; err != nil {
		return nil, 0, err
	}
	return data, total, nil
}
