package impl

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/IBM/sarama"
	"github.com/google/uuid"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system"
	liyue_registrations_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/liyue_registrations"
	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system"
	user_domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/built_in"
	"github.com/kweaver-ai/idrm-go-common/interception"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

type infoSystemUseCase struct {
	business_structure_repo business_structure.Repo
	liyueRegistrationsRepo  liyue_registrations_repo.LiyueRegistrationsRepo
	repo                    info_system.Repo
	user                    user_domain.UseCase
	register                register.UserServiceClient
	// Kafka 的消息生产者
	producer sarama.SyncProducer
}

func NewInfoSystemUseCase(
	repo info_system.Repo,
	liyueRegistrationsRepo liyue_registrations_repo.LiyueRegistrationsRepo,
	user user_domain.UseCase,
	business_structure_repo business_structure.Repo,
	register register.UserServiceClient,
	// Kafka 客户端
	kafka sarama.Client,
) (domain.UseCase, func(), error) {
	p, err := sarama.NewSyncProducerFromClient(kafka)
	if err != nil {
		return nil, func() {}, err
	}

	return &infoSystemUseCase{
		repo:                    repo,
		liyueRegistrationsRepo:  liyueRegistrationsRepo,
		user:                    user,
		business_structure_repo: business_structure_repo,
		register:                register,
		producer:                p,
	}, func() { p.Close() }, nil
}

func NewInfoSystemUseCaseWithRepoOnly(repo info_system.Repo) domain.UseCase {
	return &infoSystemUseCase{repo: repo}
}

// CreateInfoSystem 创建信息系统
func (uc *infoSystemUseCase) CreateInfoSystem(ctx context.Context, req *domain.CreateInfoSystem) (*response.NameIDResp, error) {

	exist, err := uc.repo.NameExistCheck(ctx, req.Name)
	if err != nil {
		return nil, err
	}
	if exist {
		return nil, errorcode.Desc(errorcode.InfoSystemNameExist)
	}

	userInfo := ctx.Value(interception.InfoName).(*model.User)
	m := &model.InfoSystem{
		Name: req.Name,
		Description: sql.NullString{
			String: req.Description,
			Valid:  true,
		},
		DepartmentId:      sql.NullString{String: req.DepartmentId, Valid: true},
		AcceptanceAt:      sql.NullInt64{Int64: req.AcceptanceAt, Valid: true},
		IsRegisterGateway: sql.NullInt32{Int32: domain.NotRegisteGateway, Valid: true},
		CreatedByUID:      userInfo.ID,
		UpdatedByUID:      userInfo.ID,
		JsDepartmentId:    sql.NullString{String: req.JsDepartmentId, Valid: true},
		Status:            req.Status,
	}
	if err = uc.repo.Insert(ctx, m); err != nil {
		return nil, err
	}

	// 发送消息
	if err := sendWatchEvent(ctx, uc.producer, meta_v1.Added, m); err != nil {
		log.Warn("send event fail", zap.Error(err))
	}

	return &response.NameIDResp{
		ID:   m.ID,
		Name: req.Name,
	}, nil
}

func (uc *infoSystemUseCase) CheckInfoSystemRepeat(ctx context.Context, req *domain.NameRepeatReq) (bool, error) {
	exist, err := uc.repo.NameExistCheck(ctx, req.Name, req.ID)
	if err != nil {
		return false, err
	}
	if exist {
		return false, errorcode.Desc(errorcode.InfoSystemNameExist)
	}
	return true, nil
}

func (uc *infoSystemUseCase) GetInfoSystems(ctx context.Context, req *domain.QueryPageReqParam) (*domain.QueryPageRes, error) {
	models, total, err := uc.repo.ListByPagingNew(ctx, req)
	if err != nil {
		return nil, err
	}
	//var departmentIds []string
	//for _, model := range models {
	//	departmentIds = append(departmentIds, model.DepartmentId)
	//}
	//objects, _ := uc.business_structure_repo.GetObjectsByIDs(ctx, departmentIds)
	//departmentIdNameMap := make(map[string]string)
	//for _, object := range objects {
	//	departmentIdNameMap[object.ID] = object.Name
	//}
	entries := make([]*domain.InfoSystemPage, len(models), len(models))
	for i, m := range models {
		// 获取责任人
		registrations, err := uc.liyueRegistrationsRepo.GetLiyueRegistrations(ctx, m.ID)
		if err != nil {
			return nil, err
		}
		Responsiblers := make([]*domain.Responsibler, 0)
		for _, registration := range registrations {
			Responsiblers = append(Responsiblers, &domain.Responsibler{
				ID:   registration.UserID,
				Name: registration.UserName,
			})
		}

		registerAt := m.RegisterAt.UnixMilli()
		if registerAt < 0 {
			registerAt = 0
		}
		entries[i] = &domain.InfoSystemPage{
			ID:           m.ID,
			Name:         m.Name,
			Description:  m.Description.String,
			DepartmentId: m.DepartmentId,
			//DepartmentName: departmentIdNameMap[m.DepartmentId],
			DepartmentName:    m.DepartmentName,
			DepartmentPath:    m.DepartmentPath,
			Responsiblers:     Responsiblers,
			SystemIdentifier:  m.SystemIdentifier,
			RegisterAt:        registerAt,
			AcceptanceAt:      m.AcceptanceAt.Int64,
			IsRegisterGateway: m.IsRegisterGateway.Int32 == domain.RegisteGateway,
			CreatedAt:         m.CreatedAt.UnixMilli(),
			//CreatedUser:    uc.user.GetUserNameNoErr(ctx, m.CreatedByUID),
			UpdatedAt:        m.UpdatedAt.UnixMilli(),
			UpdatedUser:      m.UpdatedUserName,
			JsDepartmentId:   m.JsDepartmentId,
			JsDepartmentName: m.JsDepartmentName,
			JsDepartmentPath: m.JsDepartmentPath,
			Status:           m.Status,
		}
	}
	return &domain.QueryPageRes{
		Entries:    entries,
		TotalCount: total,
	}, nil
}

func (uc *infoSystemUseCase) GetInfoSystemByIds(ctx context.Context, req *domain.GetInfoSystemByIdsReq) ([]*domain.GetInfoSystemByIdsRes, error) {
	var infoSystems []*model.InfoSystem
	var err error
	if len(req.ID) > 0 {
		infoSystems, err = uc.repo.GetByIDs(ctx, req.ID)
		if err != nil {
			return nil, err
		}
	} else {
		infoSystems, err = uc.repo.GetByNames(ctx, req.Names)
		if err != nil {
			return nil, err
		}
	}
	uids := make([]string, 0)
	for _, infoSystem := range infoSystems {
		uids = append(uids, infoSystem.CreatedByUID)
		uids = append(uids, infoSystem.UpdatedByUID)
	}
	nameMap, err := uc.user.GetByUserNameMap(ctx, uids)
	if err != nil {
		return nil, err
	}
	res := make([]*domain.GetInfoSystemByIdsRes, len(infoSystems), len(infoSystems))
	for i, infoSystem := range infoSystems {
		res[i] = &domain.GetInfoSystemByIdsRes{
			ID:           infoSystem.ID,
			Name:         infoSystem.Name,
			Description:  infoSystem.Description.String,
			DepartmentId: infoSystem.DepartmentId.String,
			CreatedAt:    infoSystem.CreatedAt.UnixMilli(),
			CreatedByUID: nameMap[infoSystem.CreatedByUID],
			UpdatedAt:    infoSystem.UpdatedAt.UnixMilli(),
			UpdatedByUID: nameMap[infoSystem.UpdatedByUID],
		}
	}
	return res, nil
}

func (uc *infoSystemUseCase) GetInfoSystem(ctx context.Context, req *domain.GetInfoSystemReq) (*model.InfoSystem, error) {
	infoSystem, err := uc.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return infoSystem, nil
}

// DeleteInfoSystem 删除信息系统
func (uc *infoSystemUseCase) DeleteInfoSystem(ctx context.Context, req *domain.InfoSystemId) (*response.NameIDResp, error) {
	// 1 校验该信息系统是否存在
	infoSystem, err := uc.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	m := &model.InfoSystem{
		ID: req.ID,
	}
	if err = uc.repo.Delete(ctx, m); err != nil {
		return nil, err
	}

	// 发送消息
	if err := sendWatchEvent(ctx, uc.producer, meta_v1.Deleted, infoSystem); err != nil {
		log.Warn("send event fail", zap.Error(err))
	}

	return &response.NameIDResp{
		ID:   m.ID,
		Name: infoSystem.Name,
	}, nil
}

// ModifyInfoSystem 修改信息系统
func (uc *infoSystemUseCase) ModifyInfoSystem(ctx context.Context, req *domain.ModifyInfoSystemReq) (*response.NameIDResp, error) {
	// 1 校验该信息系统是否存在
	infoSystem, err := uc.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	// 2 如果名称修改则信息系统下名称校验
	if infoSystem.Name != req.Name {
		if exist, err := uc.repo.NameExistCheck(ctx, req.Name, req.ID); err != nil {
			return nil, err
		} else if exist {
			return nil, errorcode.Desc(errorcode.InfoSystemNameExist)
		}
	}

	userInfo := ctx.Value(interception.InfoName).(*model.User)
	// 4 信息系统信息更新
	m := &model.InfoSystem{
		ID:   req.ID,
		Name: req.Name,
		Description: sql.NullString{
			String: req.Description,
			Valid:  true,
		},
		DepartmentId:   sql.NullString{String: req.DepartmentId, Valid: true},
		AcceptanceAt:   sql.NullInt64{Int64: req.AcceptanceAt, Valid: true},
		CreatedAt:      infoSystem.CreatedAt,
		CreatedByUID:   infoSystem.CreatedByUID,
		UpdatedAt:      time.Now(),
		UpdatedByUID:   userInfo.ID,
		JsDepartmentId: sql.NullString{String: req.JsDepartmentId, Valid: true},
		Status:         req.Status,
	}
	if err = uc.repo.Update(ctx, m); err != nil {
		return nil, err
	}

	// 发送消息
	if err := sendWatchEvent(ctx, uc.producer, meta_v1.Modified, m); err != nil {
		log.FromContext(ctx).Warn("send event fail", zap.Error(err))
	}

	return &response.NameIDResp{
		ID:   m.ID,
		Name: infoSystem.Name,
	}, nil
}

func (uc *infoSystemUseCase) Migration(ctx context.Context) error {
	businessSystem, err := uc.repo.GetBusinessSystem(ctx)
	if err != nil {
		log.Error("Migration failed to GetBusinessSystem", zap.Error(err))
		return err
	}
	if len(businessSystem) == 0 {
		return nil
	}
	infoSystems := make([]*model.InfoSystem, len(businessSystem), len(businessSystem))
	for i, object := range businessSystem {
		sonyflakeId, err := utils.GetUniqueID()
		if err != nil {
			log.Errorf("Migration failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
		}
		infoSystems[i] = &model.InfoSystem{
			InfoStstemID: sonyflakeId,
			ID:           object.ID,
			Name:         object.Name,
			CreatedAt:    object.CreatedAt,
			CreatedByUID: built_in.NCT_USER_ADMIN,
			UpdatedAt:    object.UpdatedAt,
			UpdatedByUID: built_in.NCT_USER_ADMIN,
		}
	}

	if err = uc.repo.Inserts(ctx, infoSystems); err != nil {
		log.Errorf("Migration failed to Inserts infoSystems, err: %v", err)
		return err
	}

	if err = uc.repo.DeleteBusinessSystem(ctx); err != nil {
		log.Error("Migration failed to DeleteBusinessSystem", zap.Error(err))
		return err
	}
	return nil
}

// sendWatchEvent 发送 WatchEvent 使其他服务处理资源 InfoSystem 的创建、删除、更新
func sendWatchEvent(ctx context.Context, p sarama.SyncProducer, t meta_v1.WatchEventType, m *model.InfoSystem) (err error) {
	ctx, span := trace.StartProducerSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	id, err := uuid.Parse(m.ID)
	if err != nil {
		return
	}

	createdBy, err := uuid.Parse(m.CreatedByUID)
	if err != nil {
		return
	}

	updatedBy, err := uuid.Parse(m.UpdatedByUID)
	if err != nil {
		return
	}

	var departmentID uuid.UUID
	if m.DepartmentId.String != "" {
		departmentID, err = uuid.Parse(m.DepartmentId.String)
		if err != nil {
			return
		}
	}

	event, err := json.Marshal(&meta_v1.WatchEvent[configuration_center_v1.InfoSystem]{
		Type: t,
		Resource: configuration_center_v1.InfoSystem{
			Metadata: meta_v1.Metadata{
				ID:        id.String(),
				CreatedAt: meta_v1.NewTime(m.CreatedAt),
				UpdatedAt: meta_v1.NewTime(m.UpdatedAt),
			},
			CreatedBy:    createdBy,
			UpdatedBy:    updatedBy,
			Name:         m.Name,
			Description:  m.Description.String,
			DepartmentID: departmentID,
		},
	})
	if err != nil {
		return
	}

	log.FromContext(ctx).Debug("send kafka message", zap.Any("event", event))
	_, _, err = p.SendMessage(&sarama.ProducerMessage{
		// topic 格式 af.{服务}.{版本}.{资源}
		Topic: "af.configuration-center.v1.info-systems",
		// 使用 ID 作为 Key 使同一个信息系统的创建、更新、删除发送到相同的
		// Partition
		Key:   sarama.StringEncoder(m.ID),
		Value: sarama.ByteEncoder(event),
	})
	return
}

// EnqueueInfoSystem 入队信息系统
func (uc *infoSystemUseCase) EnqueueInfoSystem(ctx context.Context, id string) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 获取信息系统
	s, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// 入队
	return sendWatchEvent(ctx, uc.producer, meta_v1.Added, s)
}

// 每次入队 enqueueBatchSize 个信息系统
const enqueueBatchSize int = 1 << 11

// EnqueueInfoSystems 入队信息系统，批量。
func (uc *infoSystemUseCase) EnqueueInfoSystems(ctx context.Context) (res *domain.EnqueueInfoSystemRes, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	res = new(domain.EnqueueInfoSystemRes)
	var infoSystems []model.InfoSystem
	// 每次入队的结果
	var enqueueSucceed = make([]bool, enqueueBatchSize)
	// 每次入队 enqueueBatchSize 个信息系统
	for id := uint64(0); id == 0 || len(infoSystems) == enqueueBatchSize; id = infoSystems[len(infoSystems)-1].InfoStstemID {
		infoSystems, err = uc.repo.ListOrderByInfoStstemID(ctx, id, enqueueBatchSize)
		if err != nil || infoSystems == nil {
			break
		}

		// 重置 enqueueSucceed 每一项为 false
		for i := range enqueueSucceed {
			enqueueSucceed[i] = false
		}

		g, ctxG := errgroup.WithContext(ctx)
		g.SetLimit(1 << 4)
		for i, m := range infoSystems {
			g.Go(func() error {
				// 已存在的信息系统，入队 MODIFIED
				t := meta_v1.Modified
				// 已删除的信息系统，入队 DELETED
				if m.DeletedAt != 0 {
					t = meta_v1.Deleted
				}
				// 入队，发送消息
				if err := sendWatchEvent(ctxG, uc.producer, t, &m); err != nil {
					log.Warn("send watch event fail", zap.Error(err), zap.Any("infoSystem", &m))
					return nil
				}
				// 记录入队是否成功
				enqueueSucceed[i] = err == nil

				return nil
			})
		}
		// must return nil
		_ = g.Wait()

		res.Succeed += lo.Count(enqueueSucceed, true)
		res.Failed += len(infoSystems) - lo.Count(enqueueSucceed, true)
	}

	return res, nil
}
