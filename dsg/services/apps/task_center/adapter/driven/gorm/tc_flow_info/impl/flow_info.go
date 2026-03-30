package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type FlowInfoRepo struct {
	data *db.Data
}

func NewFlowInfoRepo(data *db.Data) tc_flow_info.Repo {
	return &FlowInfoRepo{data: data}
}

func (f *FlowInfoRepo) GetById(ctx context.Context, fid, flowVersion, nid string) (flowInfo *model.TcFlowInfo, err error) {
	err = f.data.DB.WithContext(ctx).Where("flow_id=? and flow_version =? and node_unit_id=?", fid, flowVersion, nid).First(&flowInfo).Error
	return
}

func (f *FlowInfoRepo) GetByIds(ctx context.Context, fId, flowVersion string, nids []string) (flowInfos []*model.TcFlowInfo, err error) {
	err = f.data.DB.WithContext(ctx).
		Where("flow_id=? and flow_version=? ", fId, flowVersion).
		Where(fmt.Sprintf(" node_unit_id in ('%s')", strings.Join(nids, "','"))).
		Find(&flowInfos).Error
	return
}

func (f *FlowInfoRepo) GetByNodeId(ctx context.Context, fid, flowVersion, nid string) (flowInfos *model.TcFlowInfo, err error) {
	err = f.data.DB.WithContext(ctx).
		Where("flow_id=? and flow_version =? and node_unit_id=? ", fid, flowVersion, nid).
		First(&flowInfos).Error
	return
}

func (f *FlowInfoRepo) GetNodes(ctx context.Context, fid, flowVersion string) (flowInfos []*model.TcFlowInfo, err error) {
	err = f.data.DB.WithContext(ctx).Where("flow_id=? and flow_version =?", fid, flowVersion).Find(&flowInfos).Error
	return
}
func (f *FlowInfoRepo) GetByRoleId(ctx context.Context, rid string) (flowInfos []*model.TcFlowInfo, err error) {
	err = f.data.DB.WithContext(ctx).Where("task_exec_role=? ", rid).Find(&flowInfos).Error
	return
}

func (f *FlowInfoRepo) GetFollowNodes(ctx context.Context, nid string) (flowInfos []*model.TcFlowInfo, err error) {
	err = f.data.DB.WithContext(ctx).Where("prev_node_unit_ids like ? ", "%"+nid+"%").Find(&flowInfos).Error
	return
}
