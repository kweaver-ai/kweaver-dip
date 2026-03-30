package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (p *ProjectUserCase) genRoleGroup(ctx context.Context, roles []string) ([]tc_project.RoleGroup, error) {
	rs := make([]tc_project.RoleGroup, 0)
	rolesMap, err := configuration_center.GetRolesInfoMap(ctx, roles)
	if err != nil {
		log.WithContext(ctx).Error("GetRolesInfoMap error ", zap.Error(err))
		return rs, err
	}
	for _, role := range roles {
		roleInfo := rolesMap[role]
		if roleInfo == nil {
			continue
		}
		getUsers, err := p.GetUsers(ctx, roleInfo, roleInfo.UserIds)
		if err != nil {
			return nil, err
		}
		gs := tc_project.RoleGroup{
			RoleID:    role,
			RoleName:  roleInfo.Name,
			RoleColor: roleInfo.Color,
			RoleIcon:  roleInfo.Icon,
			Members:   getUsers,
		}
		rs = append(rs, gs)
	}
	return rs, nil
}
func (p *ProjectUserCase) genRole(ctx context.Context, roles []string) ([]tc_project.UserInfoWithRoleInfo, error) {
	rs := make([]tc_project.UserInfoWithRoleInfo, 0)
	rolesMap, err := configuration_center.GetRolesInfoMap(ctx, roles)
	if err != nil {
		log.WithContext(ctx).Error("GetRolesInfoMap error ", zap.Error(err))
		return rs, err
	}
	for _, role := range roles {
		roleInfo := rolesMap[role]
		if roleInfo == nil {
			continue
		}
		getUsers, err := p.GetUsers(ctx, roleInfo, roleInfo.UserIds)
		if err != nil {
			return nil, err
		}
		rs = append(rs, getUsers...)
	}
	return rs, nil
}
func (p *ProjectUserCase) GetUsers(ctx context.Context, roleInfo *configuration_center.RoleInfo, uids []string) ([]tc_project.UserInfoWithRoleInfo, error) {
	infos := make([]tc_project.UserInfoWithRoleInfo, 0)
	users, err := p.userDomain.GetByUserIds(ctx, uids)
	if err != nil {
		return nil, err
	}
	for _, user := range users {
		if user.Status == int32(constant.UserNormal) {
			infos = append(infos, tc_project.UserInfoWithRoleInfo{
				UserID:   user.ID,
				UserName: user.Name,
				RoleID:   roleInfo.Id,
				RoleName: roleInfo.Name,
			})
		}
	}
	return infos, nil
}

// chosen filter very role group, return chosen member
func chosen(rs []tc_project.RoleGroup, ms []*model.TcMember) {
	mdict := make(map[string]int)
	for _, m := range ms {
		key := fmt.Sprintf("%v-%v", m.UserID, m.RoleID)
		mdict[key] = 1
	}

	for i, roleInfo := range rs {
		us := make([]tc_project.UserInfoWithRoleInfo, 0)
		for _, m := range roleInfo.Members {
			key := fmt.Sprintf("%v-%v", m.UserID, m.RoleID)
			if mdict[key] == 1 {
				us = append(us, m)
			}
		}
		rs[i].Members = us
	}
}

/*
// chosenByTaskType filter very role group, return chosen member
func chosenByTaskType(rs []tc_project.TaskTypeGroup, ms []*model.TcMember) {
	mdict := make(map[string]int)
	for _, m := range ms {
		key := fmt.Sprintf("%v-%v", m.UserID, m.RoleID)
		mdict[key] = 1
	}

	for i, roleInfo := range rs {
		us := make([]tc_project.UserInfoWithRoleInfo, 0)
		for _, m := range roleInfo.Members {
			key := fmt.Sprintf("%v-%v", m.UserID, m.RoleID)
			if mdict[key] == 1 {
				us = append(us, m)
			}
		}
		rs[i].Members = us
	}
}
*/

func GenFlowView(info *tc_project.PipeLineInfo) (*model.TcFlowView, error) {
	res := new(model.TcFlowView)
	err := copier.Copy(res, info)
	if err != nil {
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	res.ID = info.Id
	return res, nil
}

func GenFlowInfo(info *tc_project.PipeLineInfo) ([]*model.TcFlowInfo, error) {
	arr := make([]*model.TcFlowInfo, len(info.Nodes))

	for i, node := range info.Nodes {
		arr[i] = new(model.TcFlowInfo)
		err := copier.Copy(arr[i], node)
		if err != nil {
			return nil, err
		}
		arr[i].FlowID = info.Id
		arr[i].FlowVersion = info.Version
		arr[i].FlowName = info.Name

		// prev
		arr[i].PrevNodeIds = strings.Join(node.PrevNodeIds, ",")
		arr[i].PrevNodeUnitIds = strings.Join(node.PrevNodeUnitIds, ",")

		//stage
		arr[i].StageID = node.Stage.StageID
		arr[i].StageName = node.Stage.StageName
		arr[i].StageUnitID = node.Stage.StageUnitID
		arr[i].StageOrder = node.Stage.StageOrder

		//task 生成taskType
		//arr[i].TaskExecTools = "" //暂时没有 TODO
		//arr[i].TaskExecRole = node.TaskConfig.ExecRole.Id
		arr[i].TaskType = constant.TaskTypeStringArrToInt(node.TaskConfig.TaskType)
		arr[i].WorkOrderType = constant.WorkOrderTypeStringArrToString(node.WorkOrderConfig.WorkOrderType)
		arr[i].TaskCompletionMode = node.TaskConfig.CompletionMode
	}

	return arr, nil
}

// CheckRoleExistence  检查角色是否存在, 不存在或者查询错误返回error
func CheckRoleExistence(ctx context.Context, flowRoles map[string]int, relations map[string]int, roles []string) error {
	for _, roleId := range roles {
		if _, ok := flowRoles[roleId]; !ok {
			return errorcode.Detail(errorcode.ProjectInvalidRole, fmt.Sprintf("Invalid role %v", roleId))
		}
	}
	roleMap, err := configuration_center.GetRolesInfoMap(ctx, roles)
	if err != nil {
		return errorcode.Detail(errorcode.ProjectRoleNotFoundError, err.Error())
	}
	for _, role := range roles {
		roleInfo, ok := roleMap[role]
		if !ok {
			return errorcode.Desc(errorcode.ProjectRoleNotFoundError)
		}
		//没有添加用户，就不用校验用户关系了
		if len(relations) <= 0 {
			continue
		}
		//删除存在的，保留不存在的，为下一步过滤准备
		for _, uid := range roleInfo.UserIds {
			key := fmt.Sprintf("%s-%s", uid, role)
			if _, ok := relations[key]; ok {
				delete(relations, key)
			}
		}
	}
	return nil
}
