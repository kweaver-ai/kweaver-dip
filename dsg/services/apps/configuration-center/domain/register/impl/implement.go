package impl

import (
	"context"
	"time"

	"github.com/google/uuid"
	db "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

type registerUseCase struct {
	repo     repo.UseCase
	db       db.Repo
	userrepo user2.IUserRepo
	userMgnt user_management.DrivenUserMgnt
	usergrpc register.UserServiceClient
}

func NewUseCase(repo repo.UseCase, user2 user2.IUserRepo, userrMgnt user_management.DrivenUserMgnt, usergrpc register.UserServiceClient, db db.Repo) domain.UseCase {
	return &registerUseCase{repo: repo, userrepo: user2, userMgnt: userrMgnt, usergrpc: usergrpc, db: db}
}

// implement  user
func (svc *registerUseCase) Register(ctx context.Context, req *domain.UserReq) (*domain.IDReps, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	register := &model.User{
		ID:             req.UserId,
		IsRegistered:   2,
		ThirdServiceId: req.ThirdServiceId,
		RegisterAt:     beijingTime.Format("2006-01-02 15:04:05.000"),
	}
	err = svc.userrepo.Update(ctx, register)
	//err = svc.repo.RegisterUser(ctx, register)
	if err != nil {
		return nil, err
	}
	return &domain.IDReps{
		ID: req.UserId,
	}, nil

}

func (s *registerUseCase) GetRegisterInfo(ctx context.Context, req *domain.ListUserReq) (*domain.ListUserResp, error) {
	list, total, err := s.repo.GetRegisterInfo(ctx, req)
	if err != nil {
		return nil, err
	}
	// 构建返回结果
	var result []*domain.RegisterReq
	for _, content := range list {
		if content == nil {
			continue
		}
		departments, err := s.userMgnt.GetUserParentDepartments(ctx, content.UserId)
		if err != nil {
			return nil, err
		}
		var deptID, deptName string
		if len(departments) > 0 {
			firstDeptList := departments[0]
			// 避免直接访问 nil 切片
			if firstDeptList != nil && len(firstDeptList) > 0 {
				deptID = firstDeptList[0].ID
				deptName = firstDeptList[0].Name
			} else {
				// 可选：记录未找到部门信息的日志
				log.Warn("No department found for user", zap.String("userID", content.ID))
				deptID = ""
				deptName = ""
			}
		} else {
			log.Warn("No department found for user", zap.String("userID", content.ID))
			deptID = ""
			deptName = ""
		}
		log.Info("GetUserParentDepartments", zap.Any("deptID", deptID))
		result = append(result, &domain.RegisterReq{
			ID:           content.ID,
			Name:         content.Name,
			LoginName:    content.LoginName,
			Mail:         content.Mail,
			PhoneNumber:  content.PhoneNumber,
			DepartmentID: content.DepartmentID,
			Department:   deptName,
			UserId:       content.UserId,
			CreatedAt:    convertUTCToLocalString(content.CreatedAt),
		})
	}

	return &domain.ListUserResp{
		Items: result,
		Total: total,
	}, nil

}

func (s *registerUseCase) GetUserInfo(ctx context.Context, req *domain.IDPath) (*domain.RegisterReq, error) {
	content, err := s.repo.GetUserInfo(ctx, req)
	if err != nil {
		return nil, err
	}
	if content == nil {
		return nil, nil
	}
	var result *domain.RegisterReq
	departments, err := s.userMgnt.GetUserParentDepartments(ctx, content.UserId)
	if err != nil {
		return nil, err
	}
	var deptID, deptName string
	if len(departments) > 0 {
		firstDeptList := departments[0]
		// 避免直接访问 nil 切片
		if firstDeptList != nil && len(firstDeptList) > 0 {
			deptID = firstDeptList[0].ID
			deptName = firstDeptList[0].Name
		} else {
			// 可选：记录未找到部门信息的日志
			log.Warn("No department found for user", zap.String("userID", content.ID))
			deptID = ""
			deptName = ""
		}
	} else {
		log.Warn("No department found for user", zap.String("userID", content.ID))
		deptID = ""
		deptName = ""
	}
	log.Info("GetUserParentDepartments", zap.Any("deptID", deptID))
	result = &domain.RegisterReq{
		ID:           content.ID,
		Name:         content.Name,
		LoginName:    content.LoginName,
		Mail:         content.Mail,
		PhoneNumber:  content.PhoneNumber,
		DepartmentID: content.DepartmentID,
		Department:   deptName,
		UserId:       content.UserId,
		CreatedAt:    convertUTCToLocalString(content.CreatedAt),
	}
	return result, nil
}

func convertUTCToLocalString(utcStr string) string {
	t, err := time.Parse(time.RFC3339, utcStr)
	if err != nil {
		// 解析失败，直接返回原始字符串或空字符串
		return utcStr
	}
	return t.Format("2006-01-02 15:04:05.000")
}
func (s *registerUseCase) UserUnique(ctx context.Context, req *domain.UserUniqueReq) (bool, error) {
	return s.repo.UserUnique(ctx, req)
}

func (s *registerUseCase) GetUserList(ctx context.Context, req *domain.ListReq) (*domain.ListUserAllResp, error) {
	list, total, err := s.repo.GetUserList(ctx, req)
	if err != nil {
		return nil, err
	}
	// 构建返回结果
	var result []*domain.UserReg
	for _, content := range list {
		if content == nil {
			continue
		}
		log.Info("GetUserParentDepartments", zap.Any("content.ID", content.ID))
		departments, err := s.userMgnt.GetUserParentDepartments(ctx, content.ID)
		if err != nil {
			return nil, err
		}

		// 打印原始数据用于调试
		log.Info("GetUserParentDepartments", zap.Any("departments", departments))

		var deptID, deptName string
		if departments != nil && len(departments) > 0 && departments[0] != nil && len(departments[0]) > 0 {
			deptID = departments[0][0].ID
			deptName = departments[0][0].Name
		} else {
			// 可选：记录未找到部门信息的日志
			log.Warn("No department found for user", zap.String("userID", content.ID))
			deptID = ""
			deptName = ""
		}

		// 判断是否过滤
		if req.Department != "" && deptID != req.Department {
			continue // 跳过不匹配的
		}

		result = append(result, &domain.UserReg{
			ID:           content.ID,
			Name:         content.Name,
			LoginName:    content.LoginName,
			MailAddress:  content.MailAddress,
			PhoneNumber:  content.PhoneNumber,
			DepartmentId: deptID,
			Department:   deptName,
			IsRegister:   content.IsRegister == "1",
		})
	}

	return &domain.ListUserAllResp{
		Items: result,
		Total: total,
	}, nil

}

// implement  organization
func (s *registerUseCase) OrganizationRegister(ctx context.Context, req *domain.LiyueRegisterReq) (*domain.IDReps, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var id string
	if req.ID == "" {
		id = uuid.New().String()
		req.ID = id
	}
	register := &domain.LiyueRegisterReq{
		ID:      req.ID,
		LiyueID: req.LiyueID,
		Type:    req.Type,
		UserID:  req.UserID,
	}
	err = s.repo.OrganizationRegister(ctx, register)
	if err != nil {
		return nil, err
	}
	return &domain.IDReps{
		ID: id,
	}, nil
}

// implement  organization
func (s *registerUseCase) OrganizationUpdate(ctx context.Context, req *domain.LiyueRegisterReq) (*domain.IDReps, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	register := &domain.LiyueRegisterReq{
		ID:      req.ID,
		UserID:  req.UserID,
		LiyueID: req.LiyueID,
		Type:    req.Type,
	}
	err = s.repo.OrganizationUpdate(ctx, register)
	if err != nil {
		return nil, err
	}
	return &domain.IDReps{
		ID: req.ID,
	}, nil

}

func (s *registerUseCase) OrganizationDelete(ctx context.Context, id string) (*domain.IDReps, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	err = s.repo.OrganizationDelete(ctx, id)
	if err != nil {
		return nil, err
	}
	return &domain.IDReps{
		ID: id,
	}, nil
}

// implement  organization
func (s *registerUseCase) OrganizationList(ctx context.Context, req *domain.ListReq) (*domain.ListOrganizationResp, error) {
	list, total, err := s.repo.OrganizationList(ctx, req)
	if err != nil {
		return nil, err
	}
	// 构建返回结果
	var result []*domain.OrganizationRegisterReq
	for _, content := range list {
		if content == nil {
			continue
		}
		user, _ := s.userrepo.GetByUserId(ctx, content.UserID)
		//判断user是否为空，如果返回为空，直接设置空
		var userName string
		if user == nil {
			userName = ""
		} else {
			userName = user.Name
		}
		result = append(result, &domain.OrganizationRegisterReq{
			ID:               content.ID,
			OrganizationID:   content.OrganizationID,
			OrganizationName: content.OrganizationName,
			OrganizationCode: content.OrganizationCode,
			UserID:           content.UserID,
			BusinessDuty:     content.BusinessDuty,
			CreatedAt:        convertUTCToLocalString(content.CreatedAt),
			UserName:         userName,
		})
	}
	return &domain.ListOrganizationResp{
		Items: result,
		Total: total,
	}, nil
}

func (s *registerUseCase) OrganizationUnique(ctx context.Context, req *domain.OrganizationUniqueReq) (bool, error) {
	return s.db.GetUniqueTag(ctx, req.OrganizationCode)
}

func (s *registerUseCase) GetOrganizationInfo(ctx context.Context, id string) (*domain.LiyueRegisterReq, error) {
	organization, err := s.repo.GetOrganizationInfo(ctx, id)
	if err != nil {
		return nil, err
	}
	// 构建返回结果
	if organization == nil {
		return nil, nil
	}

	return organization, nil

}

func (s *registerUseCase) DeleteOrganization(ctx context.Context, id string) error {
	return s.repo.OrganizationDelete(ctx, id)
}
