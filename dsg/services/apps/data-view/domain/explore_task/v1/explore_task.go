package v1

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/template_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule"

	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	dvcc "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/configuration_center"
	dataClassifyAttrBlacklistRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_classify_attribute_blacklist"
	datasourceRpoo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_rule_config"
	exploreTaskRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_task"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	gradeRuleRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule"
	tmpExploreSubTaskRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_explore_sub_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	redisson "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/redis"
	configuration_center_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data_exploration"
	standardizationbackend "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/standardization_backend"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var exploreException = "探查异常"

const EXPLORE_TASK_EXECUTE_LOCK_KEY = "EXPLORE-TASK.EXECUTE-LOCK"

type exploreTaskUseCase struct {
	exploreTaskRepo               exploreTaskRepo.ExploreTaskRepo
	repo                          repo.FormViewRepo
	fieldRepo                     fieldRepo.FormViewFieldRepo
	userRepo                      user.UserRepo
	datasourceRepo                datasourceRpoo.DatasourceRepo
	tmpExploreSubTaskRepo         tmpExploreSubTaskRepo.TmpExploreSubTaskRepo
	dataClassifyAttrBlacklistRepo dataClassifyAttrBlacklistRepo.DataClassifyAttrBlacklistRepo
	dataExploration               data_exploration.DrivenDataExploration
	mqProducer                    *kafka.KafkaProducer
	afSailorServiceDriven         sailor_service.GraphSearch
	redissonLock                  redisson.RedissonInterface
	standardRepo                  standardizationbackend.DrivenStandardizationRepo
	configurationCenterDrivenNG   configuration_center_local.ConfigurationCenterDrivenNG
	exploreRuleConfigRepo         explore_rule_config.ExploreRuleConfigRepo
	dataSubjectDriven             data_subject_local.DrivenDataSubject
	gradeRuleRepo                 gradeRuleRepo.GradeRuleRepo
	ccDriven                      configuration_center.Driven
	token                         string // 保存当前用户的 token，后台任务取用
	dvos                          dvcc.ObjectSearch
	templateRuleRepo              template_rule.TemplateRuleRepo
}

func NewExploreTaskUseCase(
	exploreTaskRepo exploreTaskRepo.ExploreTaskRepo,
	repo repo.FormViewRepo,
	fieldRepo fieldRepo.FormViewFieldRepo,
	userRepo user.UserRepo,
	datasourceRepo datasourceRpoo.DatasourceRepo,
	tmpExploreSubTaskRepo tmpExploreSubTaskRepo.TmpExploreSubTaskRepo,
	dataClassifyAttrBlacklistRepo dataClassifyAttrBlacklistRepo.DataClassifyAttrBlacklistRepo,
	dataExploration data_exploration.DrivenDataExploration,
	mqProducer *kafka.KafkaProducer,
	afSailorServiceDriven sailor_service.GraphSearch,
	redissonLock redisson.RedissonInterface,
	standardRepo standardizationbackend.DrivenStandardizationRepo,
	exploreRuleConfigRepo explore_rule_config.ExploreRuleConfigRepo,
	configurationCenterDrivenNG configuration_center_local.ConfigurationCenterDrivenNG,
	dataSubjectDriven data_subject_local.DrivenDataSubject,
	gradeRuleRepo gradeRuleRepo.GradeRuleRepo,
	ccDriven configuration_center.Driven,
	dvos dvcc.ObjectSearch,
	templateRuleRepo template_rule.TemplateRuleRepo,
) explore_task.ExploreTaskUseCase {
	uc := &exploreTaskUseCase{
		exploreTaskRepo:               exploreTaskRepo,
		repo:                          repo,
		fieldRepo:                     fieldRepo,
		userRepo:                      userRepo,
		datasourceRepo:                datasourceRepo,
		tmpExploreSubTaskRepo:         tmpExploreSubTaskRepo,
		dataClassifyAttrBlacklistRepo: dataClassifyAttrBlacklistRepo,
		dataExploration:               dataExploration,
		mqProducer:                    mqProducer,
		afSailorServiceDriven:         afSailorServiceDriven,
		redissonLock:                  redissonLock,
		standardRepo:                  standardRepo,
		exploreRuleConfigRepo:         exploreRuleConfigRepo,
		configurationCenterDrivenNG:   configurationCenterDrivenNG,
		dataSubjectDriven:             dataSubjectDriven,
		gradeRuleRepo:                 gradeRuleRepo,
		ccDriven:                      ccDriven,
		dvos:                          dvos,
		templateRuleRepo:              templateRuleRepo,
	}

	// 启动后台循环时，取我们保存的 token 构造 ctx
	func() {
		fn := func() {
			// 如果 e.token 非空，就把它带到子协程的 ctx 里
			bgCtx := context.Background()
			if uc.token != "" {
				bgCtx = context.WithValue(bgCtx, interception.Token, uc.token)
			}
			ctx, span := af_trace.StartInternalSpan(bgCtx)
			defer func() { af_trace.TelemetrySpanEnd(span, nil) }()
			uc.taskProcess(ctx)
		}
		go func() {
			for {
				fn()
				time.Sleep(5 * time.Second)
			}
		}()
	}()

	return uc
}

func (e *exploreTaskUseCase) CreateTask(ctx context.Context, req *explore_task.CreateTaskReq) (*explore_task.CreateTaskResp, error) {
	// 在 CreateTask 一开始，就把 HTTP 请求的 token 从 ctx 里取出来，保存在 e.token
	if tv := ctx.Value(interception.Token); tv != nil {
		if t, ok := tv.(string); ok {
			e.token = t
		}
	}

	taskInfo, _ := e.exploreTaskRepo.CheckTaskRepeat(ctx, req.FormViewID, req.DatasourceID, enum.ToInteger[explore_task.TaskType](req.Type).Int32())
	if taskInfo != nil {
		return nil, errorcode.Desc(my_errorcode.ExploreTaskRepeat)
	}

	userInfo, _ := util.GetUserInfo(ctx)
	resp := &explore_task.CreateTaskResp{}
	task := &model.ExploreTask{
		Type:         enum.ToInteger[explore_task.TaskType](req.Type).Int32(),
		Status:       explore_task.TaskStatusQueuing.Integer.Int32(),
		Config:       req.Config,
		CreatedByUID: userInfo.ID,
		SubjectIDS:   strings.Join(req.SubjectIDS, ","),
	}
	if req.FormViewID != "" {
		view, err := e.repo.GetById(ctx, req.FormViewID)
		if err != nil {
			log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.FormViewID, err)
			return nil, err
		}
		if req.Config != "" {
			ret := &explore_task.FormViewExploreDataConfig{}
			if err = json.Unmarshal([]byte(req.Config), ret); err != nil {
				log.WithContext(ctx).Errorf("解析探查配置：%s 详情失败，err is %v", req.Config, err)
				return nil, errorcode.Desc(my_errorcode.GetTaskConfigError)
			}
		}
		task.FormViewID = req.FormViewID
		task.FormViewType = view.Type
		task.DatasourceID = view.DatasourceID
	} else {
		_, err := e.datasourceRepo.GetById(ctx, req.DatasourceID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.WithContext(ctx).Errorf("DatasourceExploreConfig datasource GetById error: %s ,datasource id: %s", err.Error(), req.DatasourceID)
				return nil, errorcode.Desc(my_errorcode.DataSourceIDNotExist)
			}
			log.WithContext(ctx).Error("DatasourceExploreConfig datasource GetById DatabaseError", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		if req.Config != "" {
			ret := &explore_task.DatasourceExploreDataConfig{}
			if err = json.Unmarshal([]byte(req.Config), ret); err != nil {
				log.WithContext(ctx).Errorf("解析探查配置：%s 详情失败，err is %v", req.Config, err)
				return nil, errorcode.Desc(my_errorcode.GetTaskConfigError)
			}
		}
		task.DatasourceID = req.DatasourceID
	}

	taskId, err := e.exploreTaskRepo.Create(ctx, task)
	if err != nil {
		return nil, err
	}

	if task.Type == explore_task.TaskExploreData.Integer.Int32() || task.Type == explore_task.TaskExploreTimestamp.Integer.Int32() {
		err = e.publishExploreTask(ctx, taskId, "")
		if err != nil {
			_ = e.exploreTaskRepo.Delete(ctx, taskId)
			return nil, err
		}
		log.WithContext(ctx).Infof("SyncProduce %s succeed,task_id:%s", mq.AsyncDataExploreTopic, taskId)
	}
	resp.TaskID = taskId
	return resp, nil
}

// publishExploreTask 发布探查任务
func (e *exploreTaskUseCase) publishExploreTask(ctx context.Context, taskId, userId string) (err error) {
	key := taskId
	var userName string
	if userId != "" {
		user, err := e.userRepo.GetByUserId(ctx, userId)
		if err != nil {
			return err
		}
		userName = user.Name
	} else {
		userInfo, _ := util.GetUserInfo(ctx)
		userId = userInfo.ID
		userName = userInfo.Name
	}

	value, err := newDataASyncExploreExecMsg(ctx, taskId, userId, userName)
	if err != nil {
		log.WithContext(ctx).Errorf("newDataASyncExploreExecMsg %s failed,task_id :%s, err: %v", mq.AsyncDataExploreTopic, taskId, err)
		return errorcode.Detail(my_errorcode.MqProduceError, err)
	}
	err = e.mqProducer.SyncProduce(mq.AsyncDataExploreTopic, util.StringToBytes(key), util.StringToBytes(value))
	if err != nil {
		log.WithContext(ctx).Errorf("SyncProduce %s failed,task_id :%s, err: %v", mq.AsyncDataExploreTopic, taskId, err)
		return errorcode.Detail(my_errorcode.MqProduceError, err)
	}
	return err
}

// newDataASyncExploreExecMsg 创建数据异步探查执行消息
func newDataASyncExploreExecMsg(ctx context.Context, taskId, userId, userName string) (msg string, err error) {
	dataASyncExploreMsg := &explore_task.DataASyncExploreMsg{
		TaskId:   taskId,
		UserId:   userId,
		UserName: userName,
	}
	b, err := json.Marshal(dataASyncExploreMsg)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", dataASyncExploreMsg, err)
		return msg, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg = string(b)
	return msg, err
}

func (e *exploreTaskUseCase) taskProcess(ctx context.Context) {
	for !e.redissonLock.TryLock(EXPLORE_TASK_EXECUTE_LOCK_KEY) {
		time.Sleep(5 * time.Second)
	}
	defer e.redissonLock.Unlock(EXPLORE_TASK_EXECUTE_LOCK_KEY)

	var (
		tasks []*model.ExploreTask
		err   error
	)

	// 获取待执行的任务
	tasks, err = e.exploreTaskRepo.GetV1(ctx, "",
		[]int32{
			explore_task.TaskStatusQueuing.Integer.Int32(),
			explore_task.TaskStatusRunning.Integer.Int32()},
		[]int32{
			explore_task.TaskExploreDataClassification.Integer.Int32(),
		}, 1, 0)
	if err != nil {
		log.WithContext(ctx).Errorf("获取待处理任务失败，err: %v", err)
		return
	}
	if len(tasks) == 0 {
		//log.WithContext(ctx).Infof("无待处理的任务")
		return
	}
	// 清理因异常导致的历史遗留子任务
	if err = e.tmpExploreSubTaskRepo.Delete(ctx, tasks[0].TaskID); err != nil {
		log.WithContext(ctx).Errorf("清理待执行任务遗留子任务失败，err: %v", err)
	}

	// 待执行任务状态变更为执行中
	tasks[0].Status = explore_task.TaskStatusRunning.Integer.Int32()
	if err = e.exploreTaskRepo.UpdateV1(ctx, tasks[0],
		[]int32{
			explore_task.TaskStatusQueuing.Integer.Int32(),
			explore_task.TaskStatusRunning.Integer.Int32()}); err != nil {
		log.WithContext(ctx).Errorf("更新任务状态为执行中失败，err: %v", err)
		return
	}

	// 执行任务
	//权限判断
	// hasRole, err := e.ccDriven.HasRoles(ctx, access_control.SecurityMgm)
	// if err != nil {
	// 	log.WithContext(ctx).Errorf("获取权限失败，err: %v", err)
	// 	return
	// }
	// if !hasRole {
	// 	log.WithContext(ctx).Errorf("当前用户没有权限执行探查任务")
	// 	return
	// }
	if tasks[0].Type == explore_task.TaskExploreDataClassification.Integer.Int32() {
		labelStatusCheck, err := e.dvos.GetStatusCheck(ctx)
		log.WithContext(ctx).Infof("数据分级分类探查任务： 标签开关%s", labelStatusCheck)

		if err != nil || labelStatusCheck == "close" {
			e.ExecDataClassifyExplore(ctx, tasks[0])
		} else {
			e.ExecDataClassifyGradeExplore(ctx, tasks[0])
		}
	}

	if err = e.exploreTaskRepo.UpdateV1(ctx, tasks[0], []int32{explore_task.TaskStatusRunning.Integer.Int32()}); err != nil {
		log.WithContext(ctx).Errorf("更新任务: %s 状态为%s 失败，err: %v", tasks[0].TaskID, enum.ToString[explore_task.TaskStatus](tasks[0].Status), err)
	}
}

func (e *exploreTaskUseCase) ExecDataClassifyGradeExplore(ctx context.Context, task *model.ExploreTask) {
	//首先分类
	e.ExecDataClassifyExplore(ctx, task)
	//然后分级
	e.ExecDataGradeExplore(ctx, task)
}

func (e *exploreTaskUseCase) ExecDataGradeExplore(ctx context.Context, task *model.ExploreTask) {
	var remark *explore_task.TaskRemark
	if task.FormViewID != "" {
		remark = e.ExploreDataGrade(ctx, task)
	} else if task.DatasourceID != "" {
		remark = e.DatasourceExploreDataGrade(ctx, task)
	}

	timeNow := time.Now()
	task.FinishedAt = &timeNow
	task.Status = explore_task.TaskStatusFinished.Integer.Int32()
	if remark != nil {
		task.Status = explore_task.TaskStatusFailed.Integer.Int32()
		buf, _ := json.Marshal(remark)
		task.Remark = util.BytesToString(buf)
	}

}

func (e *exploreTaskUseCase) DatasourceExploreDataGrade(ctx context.Context, task *model.ExploreTask) *explore_task.TaskRemark {
	remark := &explore_task.TaskRemark{Description: exploreException, Details: make([]*explore_task.TaskExceptionDetail, 0)}
	formviews, err := e.repo.GetFormViews(ctx, task.DatasourceID)
	if err != nil {
		log.WithContext(ctx).Errorf("数据源：%s 数据分级探查任务：%s 获取视图失败，err: %v", task.DatasourceID, task.TaskID, err)
		remark.Description = "获取任务关联视图失败"
		return remark
	}
	if len(formviews) == 0 {
		log.WithContext(ctx).Infof("数据源：%s 数据分级探查任务：%s 无关联视图，任务执行完成", task.DatasourceID, task.TaskID)
		return nil
	}
	subtasks := make([]*model.TmpExploreSubTask, len(formviews))
	for i := range formviews {
		subtasks[i] = &model.TmpExploreSubTask{
			ParentTaskID: task.TaskID,
			FormViewID:   formviews[i].ID,
			Status:       explore_task.TaskStatusQueuing.Integer.Int32(),
			CreatedAt:    time.Now(),
		}
	}
	if err = e.tmpExploreSubTaskRepo.BatchCreate(ctx, subtasks); err != nil {
		log.WithContext(ctx).Errorf("数据源：%s 数据分级探查任务：%s 创建子任务失败，err: %v", task.DatasourceID, task.TaskID, err)
		remark.Description = "创建逻辑视图探查失败"
		return remark
	}

	var (
		subtask *model.TmpExploreSubTask
		detail  *explore_task.TaskExceptionDetail
	)
	getInfoFailedViews := make([]*explore_task.ViewInfo, 0)
	exploreFailedViews := make([]*explore_task.ViewInfo, 0)
	for i := range subtasks {
		viewInfo := &explore_task.ViewInfo{
			ViewID:       formviews[i].ID,
			ViewTechName: formviews[i].TechnicalName,
			ViewBusiName: formviews[i].BusinessName,
		}
		if subtask, err = e.tmpExploreSubTaskRepo.GetByID(ctx, subtasks[i].ID); err != nil {
			log.WithContext(ctx).Errorf("数据源：%s 数据分级探查任务：%s 获取逻辑视图：%s 探查信息失败，err: %v", task.DatasourceID, task.TaskID, subtasks[i].FormViewID, err)
			detail.ExceptionDesc = "获取对应逻辑视图探查信息失败"
			getInfoFailedViews = append(getInfoFailedViews, viewInfo)
			goto LOOP
		}
		if subtask.Status == explore_task.TaskStatusCanceled.Integer.Int32() { // 有一个子任务为取消状态则不再继续该任务，删除该任务下所有子任务
			return nil
		}
		subtask.Status = explore_task.TaskStatusFailed.Integer.Int32()
		subtask.Remark = &exploreException
		if err = e.exploreDataGrade(ctx, formviews[i], task); err != nil {
			detail.ExceptionDesc = "探查逻辑视图失败"
			exploreFailedViews = append(exploreFailedViews, viewInfo)
			log.WithContext(ctx).Errorf("数据源：%s 数据分级探查任务：%s 探查逻辑视图：%s 失败，err: %v", task.DatasourceID, task.TaskID, subtasks[i].FormViewID, err)
		}
	LOOP:
		// 判断是否err，如err则更新子任务状态为异常并继续下一子任务
		if err == nil {
			timeNow := time.Now()
			subtask.Status = explore_task.TaskStatusFinished.Integer.Int32()
			subtask.FinishedAt = &timeNow
			emptyRemark := ""
			subtask.Remark = &emptyRemark
		}

		if err = e.tmpExploreSubTaskRepo.Update(ctx, subtask); err != nil {
			log.WithContext(ctx).Errorf("数据源：%s 数据分级探查任务：%s 探查逻辑视图：%s 失败，err: %v", task.DatasourceID, task.TaskID, subtasks[i].FormViewID, err)
			detail.ExceptionDesc = "探查逻辑视图失败"
			exploreFailedViews = append(exploreFailedViews, viewInfo)
		}
		if len(getInfoFailedViews) > 0 {
			remark.Details = append(remark.Details, &explore_task.TaskExceptionDetail{
				ExceptionDesc: "获取对应逻辑视图探查信息失败",
				ViewInfo:      getInfoFailedViews,
			})
			remark.TotalCount += len(getInfoFailedViews)
		}
		if len(exploreFailedViews) > 0 {
			remark.Details = append(remark.Details, &explore_task.TaskExceptionDetail{
				ExceptionDesc: "探查逻辑视图失败",
				ViewInfo:      exploreFailedViews,
			})
			remark.TotalCount += len(exploreFailedViews)
		}
	}

	if len(remark.Details) == 0 {
		return nil
	}
	return remark
}

func (e *exploreTaskUseCase) ExploreDataGrade(ctx context.Context, task *model.ExploreTask) *explore_task.TaskRemark {
	remark := &explore_task.TaskRemark{Description: exploreException, Details: make([]*explore_task.TaskExceptionDetail, 0, 1)}
	formviews, err := e.repo.GetByIds(ctx, []string{task.FormViewID})
	if err != nil {
		log.WithContext(ctx).Errorf("数据分级探查任务：%s 获取视图: %s 失败，err: %v", task.TaskID, task.FormViewID, err)
		remark.Description = "获取任务关联视图失败"
		return remark
	}

	if len(formviews) == 0 {
		log.WithContext(ctx).Errorf("数据分级探查任务：%s 待探查视图: %s 不存在", task.TaskID, task.FormViewID)
		remark.Description = "待探查视图不存在"
		return remark
	}
	createdTime := time.Now()
	err = e.exploreDataGrade(ctx, formviews[0], task)
	finishedTime := time.Now()
	if err == nil {
		subtask := &model.TmpExploreSubTask{
			ParentTaskID: task.TaskID,
			FormViewID:   task.FormViewID,
			Status:       explore_task.TaskStatusFinished.Integer.Int32(),
			CreatedAt:    createdTime,
			FinishedAt:   &finishedTime,
		}

		if err = e.tmpExploreSubTaskRepo.Create(ctx, subtask); err != nil {
			log.WithContext(ctx).Errorf("逻辑视图：%s 数据分级探查任务：%s 创建子任务失败，err: %v", task.FormViewID, task.TaskID, err)
			remark.Description = "创建逻辑视图探查失败"
			return remark
		}
		return nil
	}
	viewInfos := make([]*explore_task.ViewInfo, 0)
	viewInfos = append(viewInfos, &explore_task.ViewInfo{
		ViewID:       formviews[0].ID,
		ViewTechName: formviews[0].TechnicalName,
		ViewBusiName: formviews[0].BusinessName,
	})
	remark.Details = append(remark.Details,
		&explore_task.TaskExceptionDetail{
			ExceptionDesc: "逻辑视图探查失败",
			ViewInfo:      viewInfos,
		})
	remark.TotalCount = 1
	log.WithContext(ctx).Errorf("数据分级探查任务：%s 执行失败，err: %v", task.TaskID, err)
	return remark
}

// checkSubjectIdsSatisfyExpression checks if the given subjectIds satisfy the logical expression
func checkSubjectIdsSatisfyExpression(subjectIds []string, logicalExpression string) (bool, error) {
	type GradeRule struct {
		Operate                      string   `json:"operate"`
		ClassificationRuleSubjectIds []string `json:"classification_rule_subject_ids"`
	}

	type LogicalExpression struct {
		Operate    string      `json:"operate"`
		GradeRules []GradeRule `json:"grade_rules"`
	}

	var expr LogicalExpression
	if err := json.Unmarshal([]byte(logicalExpression), &expr); err != nil {
		return false, err
	}

	// Convert subjectIds to a map for faster lookup
	subjectMap := make(map[string]bool)
	for _, id := range subjectIds {
		subjectMap[id] = true
	}

	gradeRuleChecks := make([]bool, 0)

	//对每个二级条件组合的判断
	for _, gradeRule := range expr.GradeRules {
		allPresent := true
		operate := strings.ToUpper(gradeRule.Operate)
		if operate == "AND" {
			for _, requiredID := range gradeRule.ClassificationRuleSubjectIds {
				if !subjectMap[requiredID] {
					allPresent = false
					break
				}
			}
		} else if operate == "OR" {
			allPresent = false
			for _, requiredID := range gradeRule.ClassificationRuleSubjectIds {
				if subjectMap[requiredID] {
					allPresent = true
					break
				}
			}
		}
		gradeRuleChecks = append(gradeRuleChecks, allPresent)
	}

	//对一级条件组合的判断
	topOperate := strings.ToUpper(expr.Operate)
	for _, gradeRuleCheck := range gradeRuleChecks {
		if topOperate == "AND" {
			if !gradeRuleCheck {
				return false, nil
			}
		} else if topOperate == "OR" {
			if gradeRuleCheck {
				return true, nil
			}
		}
	}
	return false, nil
}

func (e *exploreTaskUseCase) exploreDataGrade(ctx context.Context, formview *model.FormView, task *model.ExploreTask) error {
	var (
		fields []*model.FormViewField
		err    error
	)
	if fields, err = e.fieldRepo.GetFieldsForDataGrade(ctx, formview.ID); err == nil {
		if len(fields) > 0 {
			// 获取分类属性列表
			log.WithContext(ctx).Infof("数据分级探查任务：%s 获取分类属性列表", task.TaskID)
			subjectIds := make([]string, 0)
			for _, field := range fields {
				if field.SubjectID != nil {
					subjectIds = append(subjectIds, *field.SubjectID)
				}
				subjectIds = util.DuplicateStringRemoval(subjectIds)
			}
			subjectMap := make(map[string]*data_subject_local.GetAttributResp)
			if len(subjectIds) > 0 {
				subjects, err := e.dataSubjectDriven.GetAttributeByIds(ctx, subjectIds)
				if err != nil || len(subjects.Attributes) == 0 {
					log.WithContext(ctx).Errorf("数据分级探查任务：%s 获取分类属性列表失败，err: %v", task.TaskID, err)
					return err
				}
				subjectMap = make(map[string]*data_subject_local.GetAttributResp)
				for _, subject := range subjects.Attributes {
					subjectMap[subject.ID] = subject
				}
			}

			// 获取分类属性对应的分级规则列表
			log.WithContext(ctx).Infof("数据分级探查任务：%s 获取分类属性对应的分级规则列表", task.TaskID)
			gradeRules, err := e.gradeRuleRepo.GetBySubjectIds(ctx, subjectIds)
			if err != nil {
				log.WithContext(ctx).Errorf("数据分级探查任务：%s 获取分级规则列表失败，err: %v", task.TaskID, err)
				return err
			}

			subjectGradeRuleMap := make(map[string][]*model.GradeRule)
			// 获取分级规则对应的分级标签列表数组
			log.WithContext(ctx).Infof("数据分级探查任务：%s 获取分级规则对应的分级标签列表数组", task.TaskID)
			gradeRuleLabelIds := make([]string, 0)
			for _, gradeRule := range gradeRules {
				subjectGradeRuleMap[gradeRule.SubjectID] = append(subjectGradeRuleMap[gradeRule.SubjectID], gradeRule)
				gradeRuleLabelIds = append(gradeRuleLabelIds, fmt.Sprintf("%d", gradeRule.LabelID))
			}

			// 获取当前字段已有的分级标签列表数组
			log.WithContext(ctx).Infof("数据分级探查任务：%s 获取当前字段已有的分级标签列表数组", task.TaskID)
			for _, field := range fields {
				gradeRuleLabelIds = append(gradeRuleLabelIds, fmt.Sprintf("%d", field.GradeID.Int64))
			}

			// 去重gradeRuleLabelIds
			log.WithContext(ctx).Infof("数据分级探查任务：%s 去重gradeRuleLabelIds", task.TaskID)
			gradeRuleLabelIds = util.DuplicateStringRemoval(gradeRuleLabelIds)
			labelInfos, err := e.ccDriven.GetLabelByIds(ctx, strings.Join(gradeRuleLabelIds, ","))
			if err != nil {
				log.WithContext(ctx).Errorf("数据分级探查任务：%s 获取分级标签列表失败，err: %v", task.TaskID, err)
				return err
			}
			labelInfoMap := make(map[string]*configuration_center.GetLabelByIdRes)
			for _, label := range labelInfos.Entries {
				labelInfoMap[label.ID] = label
			}

			// 循环fields，根据subjectGradeRuleMap，对数据进行分级
			log.WithContext(ctx).Infof("数据分级探查任务：%s 循环fields，根据subjectGradeRuleMap，对数据进行分级", task.TaskID)
			hasGradeChange := false
			for _, field := range fields {
				if field.SubjectID == nil {
					continue
				}
				log.WithContext(ctx).Infof("数据分级探查任务field", zap.Any("field", field))
				log.WithContext(ctx).Infof("数据分级探查任务subjectGradeRuleMap", zap.Any("subjectGradeRuleMap", subjectGradeRuleMap))
				// 判断该字段有无分级规则
				if gradeRules, ok := subjectGradeRuleMap[*field.SubjectID]; ok {
					log.WithContext(ctx).Infof("数据分级探查任务：%s 有分级规则，则根据分级规则对数据进行分级", field.ID)
					// 有分级规则，则根据分级规则对数据进行分级
					for _, gradeRule := range gradeRules {
						// 判断是否命中了分级规则
						satisfies, err := checkSubjectIdsSatisfyExpression([]string{*field.SubjectID}, gradeRule.LogicalExpression)
						if err != nil {
							// log.WithContext(ctx).Errorf("Error checking logical expression: %v", err)
							continue
						}
						if satisfies {
							if !field.GradeID.Valid || field.GradeID.Int64 == 0 {
								field.GradeID = sql.NullInt64{
									Int64: gradeRule.LabelID,
									Valid: true,
								}

								field.GradeType = sql.NullInt32{
									Int32: 1,
									Valid: true,
								}
								hasGradeChange = true
							} else {
								// 判断现有的分级是否小于新的分级
								currentWeight := labelInfoMap[fmt.Sprintf("%d", field.GradeID.Int64)].SortWeight
								newWeight := labelInfoMap[fmt.Sprintf("%d", gradeRule.LabelID)].SortWeight
								if currentWeight <= newWeight {
									field.GradeID = sql.NullInt64{
										Int64: gradeRule.LabelID,
										Valid: true,
									}
									field.GradeType = sql.NullInt32{
										Int32: 1,
										Valid: true,
									}
									hasGradeChange = true
								}
							}
						}
					}
				} else {
					log.WithContext(ctx).Infof("数据分级探查任务：%s 无分级规则，则根据字段的分类属性进行分级", field.ID)
					// 无分级规则，则根据字段的分类属性进行分级
					if subject, exists := subjectMap[*field.SubjectID]; exists {
						labelId, _ := strconv.ParseInt(subject.LabelId, 10, 64)
						// 如果字段已有的分级标签ID与分类属性对应的分级标签ID不一致，则更新字段的分级标签ID
						if field.GradeID.Int64 != labelId {
							field.GradeID = sql.NullInt64{
								Int64: labelId,
								Valid: true,
							}
							field.GradeType = sql.NullInt32{
								Int32: 1,
								Valid: true,
							}
							hasGradeChange = true
						}
					} else {
						// 如果字段已有分类属性，则清空字段的分级标签ID
						if field.GradeID.Valid {
							field.GradeID = sql.NullInt64{Valid: true}
							field.GradeType = sql.NullInt32{Valid: true}
							hasGradeChange = true
						}
					}
				}
			}
			if hasGradeChange {
				err = e.fieldRepo.BatchUpdateFieldGrade(ctx, fields)
				if err != nil {
					log.WithContext(ctx).Errorf("数据分级探查任务：%s 更新字段分级失败，err: %v", task.TaskID, err)
					return err
				}
			}
			// 释放fields
			fields = nil
		}
	}
	return err
}

func (e *exploreTaskUseCase) ExecDataClassifyExplore(ctx context.Context, task *model.ExploreTask) {
	var remark *explore_task.TaskRemark
	if task.FormViewID != "" {
		remark = e.ExploreDataClassification(ctx, task)
	} else if task.DatasourceID != "" {
		remark = e.DatasourceExploreDataClassification(ctx, task)
	}

	timeNow := time.Now()
	task.FinishedAt = &timeNow
	task.Status = explore_task.TaskStatusFinished.Integer.Int32()
	if remark != nil {
		task.Status = explore_task.TaskStatusFailed.Integer.Int32()
		buf, _ := json.Marshal(remark)
		task.Remark = util.BytesToString(buf)
	}
}

func (e *exploreTaskUseCase) DatasourceExploreDataClassification(ctx context.Context, task *model.ExploreTask) *explore_task.TaskRemark {
	remark := &explore_task.TaskRemark{Description: exploreException, Details: make([]*explore_task.TaskExceptionDetail, 0)}
	formviews, err := e.repo.GetFormViews(ctx, task.DatasourceID)
	if err != nil {
		log.WithContext(ctx).Errorf("数据源：%s 数据分类探查任务：%s 获取视图失败，err: %v", task.DatasourceID, task.TaskID, err)
		remark.Description = "获取任务关联视图失败"
		return remark
	}
	if len(formviews) == 0 {
		log.WithContext(ctx).Infof("数据源：%s 数据分类探查任务：%s 无关联视图，任务执行完成", task.DatasourceID, task.TaskID)
		return nil
	}
	subtasks := make([]*model.TmpExploreSubTask, len(formviews))
	for i := range formviews {
		subtasks[i] = &model.TmpExploreSubTask{
			ParentTaskID: task.TaskID,
			FormViewID:   formviews[i].ID,
			Status:       explore_task.TaskStatusQueuing.Integer.Int32(),
			CreatedAt:    time.Now(),
		}
	}
	if err = e.tmpExploreSubTaskRepo.BatchCreate(ctx, subtasks); err != nil {
		log.WithContext(ctx).Errorf("数据源：%s 数据分类探查任务：%s 创建子任务失败，err: %v", task.DatasourceID, task.TaskID, err)
		remark.Description = "创建逻辑视图探查失败"
		return remark
	}

	var (
		subtask *model.TmpExploreSubTask
		detail  *explore_task.TaskExceptionDetail
	)
	getInfoFailedViews := make([]*explore_task.ViewInfo, 0)
	exploreFailedViews := make([]*explore_task.ViewInfo, 0)
	for i := range subtasks {
		viewInfo := &explore_task.ViewInfo{
			ViewID:       formviews[i].ID,
			ViewTechName: formviews[i].TechnicalName,
			ViewBusiName: formviews[i].BusinessName,
		}
		if subtask, err = e.tmpExploreSubTaskRepo.GetByID(ctx, subtasks[i].ID); err != nil {
			log.WithContext(ctx).Errorf("数据源：%s 数据分类探查任务：%s 获取逻辑视图：%s 探查信息失败，err: %v", task.DatasourceID, task.TaskID, subtasks[i].FormViewID, err)
			detail.ExceptionDesc = "获取对应逻辑视图探查信息失败"
			getInfoFailedViews = append(getInfoFailedViews, viewInfo)
			goto LOOP
		}
		if subtask.Status == explore_task.TaskStatusCanceled.Integer.Int32() { // 有一个子任务为取消状态则不再继续该任务，删除该任务下所有子任务
			return nil
		}
		subtask.Status = explore_task.TaskStatusFailed.Integer.Int32()
		subtask.Remark = &exploreException
		if err = e.exploreDataClassification(ctx, formviews[i], task); err != nil {
			detail.ExceptionDesc = "探查逻辑视图失败"
			exploreFailedViews = append(exploreFailedViews, viewInfo)
			log.WithContext(ctx).Errorf("数据源：%s 数据分类探查任务：%s 探查逻辑视图：%s 失败，err: %v", task.DatasourceID, task.TaskID, subtasks[i].FormViewID, err)
		}
	LOOP:
		// 判断是否err，如err则更新子任务状态为异常并继续下一子任务
		if err == nil {
			timeNow := time.Now()
			subtask.Status = explore_task.TaskStatusFinished.Integer.Int32()
			subtask.FinishedAt = &timeNow
			emptyRemark := ""
			subtask.Remark = &emptyRemark
		}

		if err = e.tmpExploreSubTaskRepo.Update(ctx, subtask); err != nil {
			log.WithContext(ctx).Errorf("数据源：%s 数据分类探查任务：%s 探查逻辑视图：%s 失败，err: %v", task.DatasourceID, task.TaskID, subtasks[i].FormViewID, err)
			detail.ExceptionDesc = "探查逻辑视图失败"
			exploreFailedViews = append(exploreFailedViews, viewInfo)
		}
		if len(getInfoFailedViews) > 0 {
			remark.Details = append(remark.Details, &explore_task.TaskExceptionDetail{
				ExceptionDesc: "获取对应逻辑视图探查信息失败",
				ViewInfo:      getInfoFailedViews,
			})
			remark.TotalCount += len(getInfoFailedViews)
		}
		if len(exploreFailedViews) > 0 {
			remark.Details = append(remark.Details, &explore_task.TaskExceptionDetail{
				ExceptionDesc: "探查逻辑视图失败",
				ViewInfo:      exploreFailedViews,
			})
			remark.TotalCount += len(exploreFailedViews)
		}
	}

	if len(remark.Details) == 0 {
		return nil
	}
	return remark
}

func (e *exploreTaskUseCase) ExploreDataClassification(ctx context.Context, task *model.ExploreTask) *explore_task.TaskRemark {
	remark := &explore_task.TaskRemark{Description: exploreException, Details: make([]*explore_task.TaskExceptionDetail, 0, 1)}
	formviews, err := e.repo.GetByIds(ctx, []string{task.FormViewID})
	if err != nil {
		log.WithContext(ctx).Errorf("数据分类探查任务：%s 获取视图: %s 失败，err: %v", task.TaskID, task.FormViewID, err)
		remark.Description = "获取任务关联视图失败"
		return remark
	}

	if len(formviews) == 0 {
		log.WithContext(ctx).Errorf("数据分类探查任务：%s 待探查视图: %s 不存在", task.TaskID, task.FormViewID)
		remark.Description = "待探查视图不存在"
		return remark
	}
	createdTime := time.Now()
	err = e.exploreDataClassification(ctx, formviews[0], task)
	finishedTime := time.Now()
	if err == nil {
		subtask := &model.TmpExploreSubTask{
			ParentTaskID: task.TaskID,
			FormViewID:   task.FormViewID,
			Status:       explore_task.TaskStatusFinished.Integer.Int32(),
			CreatedAt:    createdTime,
			FinishedAt:   &finishedTime,
		}

		if err = e.tmpExploreSubTaskRepo.Create(ctx, subtask); err != nil {
			log.WithContext(ctx).Errorf("逻辑视图：%s 数据分类探查任务：%s 创建子任务失败，err: %v", task.FormViewID, task.TaskID, err)
			remark.Description = "创建逻辑视图探查失败"
			return remark
		}
		return nil
	}
	viewInfos := make([]*explore_task.ViewInfo, 0)
	viewInfos = append(viewInfos, &explore_task.ViewInfo{
		ViewID:       formviews[0].ID,
		ViewTechName: formviews[0].TechnicalName,
		ViewBusiName: formviews[0].BusinessName,
	})
	remark.Details = append(remark.Details,
		&explore_task.TaskExceptionDetail{
			ExceptionDesc: "逻辑视图探查失败",
			ViewInfo:      viewInfos,
		})
	remark.TotalCount = 1
	log.WithContext(ctx).Errorf("数据分类探查任务：%s 执行失败，err: %v", task.TaskID, err)
	return remark
}

func (e *exploreTaskUseCase) exploreDataClassification(ctx context.Context, formview *model.FormView, task *model.ExploreTask) error {
	var (
		fields        []*model.FormViewField
		resp          *sailor_service.DataCategorizeResp
		fid2idxMap    map[string]int
		attrBlackList []*model.DataClassifyAttrBlacklist
		err           error
	)
	if fields, err = e.fieldRepo.GetFieldsForDataClassify(ctx, formview.ID); err == nil {
		if len(fields) > 0 {
			fid2idxMap = map[string]int{}

			// 从数据源信息中提取 ViewSourceCatalogName
			var viewSourceCatalogName string
			switch formview.Type {
			case constant.FormViewTypeDatasource.Integer.Int32():
				// 获取数据源信息
				datasource, err := e.datasourceRepo.GetById(ctx, formview.DatasourceID)
				if err != nil {
					log.WithContext(ctx).Errorf("获取数据源信息失败，err: %v", err)
					return err
				}
				if datasource != nil {
					viewSourceCatalogName = datasource.DataViewSource
				}
			case constant.FormViewTypeCustom.Integer.Int32():
				viewSourceCatalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
			case constant.FormViewTypeLogicEntity.Integer.Int32():
				viewSourceCatalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
			}

			// 请求认知助手取得结果并更新字段属性
			req := &sailor_service.DataCategorizeReq{
				ViewID:                formview.ID,
				ViewTechName:          formview.TechnicalName,
				ViewBusiName:          formview.BusinessName,
				ViewDesc:              formview.Description.String,
				SubjectID:             formview.SubjectId.String,
				ViewFields:            make([]*sailor_service.ViewFiledsReq, len(fields)),
				ExploreSubjectIDS:     strings.Split(task.SubjectIDS, ","),
				ViewSourceCatalogName: viewSourceCatalogName,
			}
			for i := range fields {
				fields[i].ClassifyType = (*int)(explore_task.ClassifyTypeAuto.Integer)
				fields[i].SubjectID = nil
				fields[i].MatchScore = nil
				fid2idxMap[fields[i].ID] = i
				req.ViewFields[i] = &sailor_service.ViewFiledsReq{
					FieldID:       fields[i].ID,
					FieldTechName: fields[i].TechnicalName,
					FieldBusiName: fields[i].BusinessName,
					StandardCode:  fields[i].StandardCode.String,
				}
			}
			if resp, err = e.afSailorServiceDriven.DataClassificationExplore(ctx, req); err == nil {
				if attrBlackList, err = e.dataClassifyAttrBlacklistRepo.GetByID(ctx, formview.ID, ""); err != nil {
					return err
				}

				var (
					m  map[string]bool
					ok bool
				)
				f2attrBlackListMap := map[string]map[string]bool{}
				for i := range attrBlackList {
					if m, ok = f2attrBlackListMap[attrBlackList[i].FieldID]; !ok {
						m = map[string]bool{}
						f2attrBlackListMap[attrBlackList[i].FieldID] = m
					}
					m[attrBlackList[i].SubjectID] = true
				}
				for i := range resp.Result.Answers.ViewFields {
					m = f2attrBlackListMap[resp.Result.Answers.ViewFields[i].FieldID]
					for j := range resp.Result.Answers.ViewFields[i].MatchResults {
						if (m != nil && !m[resp.Result.Answers.ViewFields[i].MatchResults[j].SubjectID]) || m == nil {
							fields[fid2idxMap[resp.Result.Answers.ViewFields[i].FieldID]].SubjectID = &resp.Result.Answers.ViewFields[i].MatchResults[j].SubjectID
							fields[fid2idxMap[resp.Result.Answers.ViewFields[i].FieldID]].MatchScore = &resp.Result.Answers.ViewFields[i].MatchResults[j].Score
							break
						}
					}
				}
				err = e.fieldRepo.BatchUpdateFieldSuject(ctx, fields)
			}
			fid2idxMap = nil
			fields = nil
		}
	}
	return err
}

func (e *exploreTaskUseCase) ExecExplore(ctx context.Context, taskId, userId, userName string) error {
	task, err := e.exploreTaskRepo.Get(ctx, taskId)
	if err != nil {
		log.WithContext(ctx).Errorf("任务不存在：%s", taskId)
		return nil
	}
	if task.Status == explore_task.TaskStatusCanceled.Integer.Int32() {
		return nil
	}
	switch task.Type {
	case explore_task.TaskExploreData.Integer.Int32():
		if task.FormViewID != "" {
			err = e.ExploreData(ctx, taskId, task.FormViewID, userId, userName)
		} else if task.DatasourceID != "" {
			err = e.DatasourceExploreData(ctx, taskId, task.DatasourceID, userId, userName)
		}
	case explore_task.TaskExploreTimestamp.Integer.Int32():
		if task.FormViewID != "" {
			err = e.ExploreTimestamp(ctx, taskId, task.FormViewID, userId, userName)
		} else if task.DatasourceID != "" {
			err = e.DatasourceExploreTimestamp(ctx, taskId, task.DatasourceID, userId, userName)
		}
	default:
		err = errors.New("unknown explore task type")
		log.WithContext(ctx).Errorf("unknown explore task type")
	}
	return err
}

func (e *exploreTaskUseCase) DatasourceExploreData(ctx context.Context, taskId, datasourceId, userId, userName string) (err error) {
	log.WithContext(ctx).Infof("DatasourceExploreData taskId :%s", taskId)
	remark := &explore_task.TaskRemark{}
	task, err := e.exploreTaskRepo.GetByTaskId(ctx, taskId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
		return errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
	}
	if task.Type == explore_task.TaskStatusCanceled.Integer.Int32() {
		return nil
	}
	datasource, err := e.datasourceRepo.GetById(ctx, datasourceId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return e.updateTaskFailed(ctx, task, remark, "数据源不存在")
		}
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	// 解析探查配置
	ret := &explore_task.DatasourceExploreDataConfig{}
	if err = json.Unmarshal([]byte(task.Config), ret); err != nil {
		log.WithContext(ctx).Errorf("解析探查配置：%s 详情失败，err is %v", task.Config, err)
		return e.updateTaskFailed(ctx, task, remark, "探查配置错误")
	}
	if ret.MetadataConfig != nil {
		for _, rule := range ret.MetadataConfig.Rules {
			if err = e.checkRuleSupport(ctx, rule.RuleId); err != nil {
				return e.updateTaskFailed(ctx, task, remark, fmt.Sprintf("不支持对数据源进行%s", err))
			}
		}
	}
	fieldRulesMap := make(map[string][]*explore_task.RuleInfo)
	for i := range ret.FieldConf {
		rules := make([]*explore_task.RuleInfo, 0)
		for j := range ret.FieldConf[i].Rules {
			// 检查配置
			if !explore_task.ColTypeRuleMap[ret.FieldConf[i].FieldType][ret.FieldConf[i].Rules[j].RuleId] {
				log.WithContext(ctx).Errorf("不支持对类型%s进行规则%s探查", ret.FieldConf[i].FieldType, ret.FieldConf[i].Rules[j].RuleId)
				err = e.updateTaskFailed(ctx, task, remark, fmt.Sprintf("不支持对类型%s进行规则%s探查", ret.FieldConf[i].FieldType, ret.FieldConf[i].Rules[j].RuleId))
				return err
			}
			rules = append(rules, ret.FieldConf[i].Rules[j])
		}
		fieldRulesMap[ret.FieldConf[i].FieldType] = rules
	}
	if ret.ViewConfig != nil {
		for _, rule := range ret.ViewConfig.Rules {
			if err = e.checkRuleSupport(ctx, rule.RuleId); err != nil {
				return e.updateTaskFailed(ctx, task, remark, fmt.Sprintf("不支持对数据源进行%s", err))
			}
		}
	}
	formViews, err := e.repo.GetFormViews(ctx, datasourceId)
	if err != nil {
		log.WithContext(ctx).Errorf("DatasourceExploreConfig GetFormViews error: %s,datasource id: %s", err.Error(), datasourceId)
		return err
	}
	if len(formViews) == 0 {
		task.Status = explore_task.TaskStatusFinished.Integer.Int32()
		finishedTime := time.Now()
		task.FinishedAt = &finishedTime
		err = e.exploreTaskRepo.Update(ctx, task)
		return err
	}

	// 获取已经执行过的子任务
	rBuf, err := e.dataExploration.GetStatus(ctx, "", "", taskId)
	if err != nil {
		return err
	}
	// 已探查过的视图不再重复探查
	exploredViewsMap := make(map[string]int)
	if rBuf != nil {
		res := &form_view.JobStatusList{}
		if err = json.Unmarshal(rBuf, res); err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业状态失败 task id:%s，err is %v", taskId, err)
			return errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
		}
		for _, exploreTask := range res.Entries {
			if exploreTask.ExploreType == explore_task.TaskExploreData.Integer.Int32() && exploreTask.ExecStatus != explore_task.TaskStatusQueuing.Integer.Int32() {
				if _, ok := exploredViewsMap[exploreTask.TableId]; !ok {
					exploredViewsMap[exploreTask.TableId] = 1
				}
			}
		}
	}
	catalogName := strings.Split(datasource.DataViewSource, ".")[0]
	schema := strings.Split(datasource.DataViewSource, ".")[1]
	if ret.Strategy == explore_task.STRATEGY_RULES_CONFIGURED {
		// 获取已配置规则的列表
		err = e.ExploreRulesConfigured(ctx, formViews, catalogName, schema, exploredViewsMap, taskId, userId, userName, ret.TotalSample)
	} else {
		err = e.ExploreAllAndNotExplored(ctx, formViews, catalogName, schema, exploredViewsMap, ret, fieldRulesMap, taskId, userId, userName, ret.Strategy)
	}
	return err
}

// 检查规则是否支持
func (e *exploreTaskUseCase) checkRuleSupport(ctx context.Context, ruleId string) error {
	_, ok := explore_task.TemplateRuleMap[ruleId]
	if !ok {
		log.WithContext(ctx).Errorf("不支持进行规则%s探查", ruleId)
		return fmt.Errorf("不支持进行规则%s探查", ruleId)
	}
	return nil
}

// 更新任务状态为失败
func (e *exploreTaskUseCase) updateTaskFailed(ctx context.Context, task *model.ExploreTask, remark *explore_task.TaskRemark, description string) error {
	remark.Description = description
	task.Status = explore_task.TaskStatusFailed.Integer.Int32()
	buf, _ := json.Marshal(remark)
	task.Remark = util.BytesToString(buf)
	finishedTime := time.Now()
	task.FinishedAt = &finishedTime
	err := e.exploreTaskRepo.Update(ctx, task)
	if err != nil {
		return err
	}
	return nil
}

func (e *exploreTaskUseCase) ExploreRulesConfigured(ctx context.Context, formViews []*model.FormView, catalogName, schema string, exploredViewsMap map[string]int, taskId, userId, userName string, totalSample int64) error {
	formViewIds := make([]string, 0)
	for _, view := range formViews {
		formViewIds = append(formViewIds, view.ID)
	}
	rules, err := e.exploreRuleConfigRepo.GetRulesByFormViewIds(ctx, formViewIds)
	if err != nil {
		return err
	}
	formViewMap := make(map[string]int)
	for _, rule := range rules {
		if _, ok := formViewMap[rule.FormViewID]; !ok {
			formViewMap[rule.FormViewID] = 1
		}
	}
	if len(rules) > 0 {
		for _, view := range formViews {
			task, err := e.exploreTaskRepo.GetByTaskId(ctx, taskId)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil
				}
				log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
				return errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
			}
			if task.Type == explore_task.TaskStatusCanceled.Integer.Int32() {
				return nil
			}
			if _, ok := exploredViewsMap[view.ID]; ok {
				continue
			}
			if _, ok := formViewMap[view.ID]; ok {
				jc, err := e.getViewConfig(ctx, view, rules, taskId, catalogName, schema, userId, userName, totalSample)
				if err != nil {
					return err
				}
				err = e.StartExploreData(ctx, view, jc)
				if err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func (e *exploreTaskUseCase) getViewConfig(ctx context.Context, view *model.FormView, rules []*model.ExploreRuleConfig, taskId, catalogName, schema, userId, userName string, totalSample int64) (*explore_task.JobConf, error) {
	var columns []*model.FormViewField
	columns, err := e.fieldRepo.GetFormViewFields(ctx, view.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
		return nil, errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
	}
	fieldInfoMap := make(map[string]explore_task.ColumnInfo)
	for _, column := range columns {
		fieldInfoMap[column.ID] = explore_task.ColumnInfo{
			Name:       column.TechnicalName,
			Type:       column.DataType,
			OriginType: column.OriginalDataType,
		}
	}
	buf, _ := json.Marshal(fieldInfoMap)
	jc := &explore_task.JobConf{
		Name:        fmt.Sprintf("%s(%s)", view.TechnicalName, view.ID),
		TableID:     view.ID,
		TableName:   view.TechnicalName,
		Schema:      schema,
		VeCatalog:   catalogName,
		TaskEnabled: explore_task.EXPLORE_JOB_ENABLED,
		UserId:      userId,
		UserName:    userName,
		ExploreType: explore_task.TaskExploreData.Integer.Int(),
		TaskId:      taskId,
		TotalSample: totalSample,
		FieldInfo:   util.BytesToString(buf),
	}
	metadataRules := make([]*explore_task.JobRuleConf, 0)
	fieldConfRules := make([]*explore_task.JobFieldConf, 0)
	rowRules := make([]*explore_task.JobRuleConf, 0)
	viewRules := make([]*explore_task.JobRuleConf, 0)
	fieldMap := make(map[string]string)
	for _, rule := range rules {
		if rule.FormViewID == view.ID {
			ruleConfig := &explore_task.JobRuleConf{
				RuleId:          rule.RuleID,
				RuleName:        rule.RuleName,
				Dimension:       enum.ToString[explore_task.Dimension](rule.Dimension),
				RuleConfig:      rule.RuleConfig,
				RuleDescription: rule.RuleDescription,
			}
			if rule.DimensionType > 0 {
				ruleConfig.DimensionType = enum.ToString[explore_task.DimensionType](rule.DimensionType)
			}
			switch rule.RuleLevel {
			case explore_task.RuleLevelMetadata.Integer.Int32():
				result, err := e.ExploreMetadata(ctx, view.ID, rule.RuleName)
				if err != nil {
					return nil, err
				}
				ruleConfig.RuleConfig = &result
				metadataRules = append(metadataRules, ruleConfig)
			case explore_task.RuleLevelField.Integer.Int32():
				for _, column := range columns {
					if rule.FieldID == column.ID {
						if _, exist := fieldMap[rule.FieldID]; !exist {
							fieldMap[rule.FieldID] = column.TechnicalName
						}
					}
				}
			case explore_task.RuleLevelRow.Integer.Int32():
				rowRules = append(rowRules, ruleConfig)
			case explore_task.RuleLevelView.Integer.Int32():
				viewRules = append(viewRules, ruleConfig)
			}
		}
	}
	for _, column := range columns {
		fieldRules := make([]*explore_task.JobRuleConf, 0)
		for _, rule := range rules {
			if rule.FieldID == column.ID {
				filedRule := &explore_task.JobRuleConf{
					RuleId:          rule.RuleID,
					RuleName:        rule.RuleName,
					RuleDescription: rule.RuleDescription,
					RuleConfig:      rule.RuleConfig,
					Dimension:       enum.ToString[explore_task.Dimension](rule.Dimension),
				}
				if rule.DimensionType > 0 {
					filedRule.DimensionType = enum.ToString[explore_task.DimensionType](rule.DimensionType)
				}
				fieldRules = append(fieldRules, filedRule)
			}
		}
		if len(fieldRules) > 0 {
			fieldConfRule := &explore_task.JobFieldConf{
				FieldId:   column.ID,
				FieldName: column.TechnicalName,
				FieldType: constant.SimpleTypeMapping[column.DataType],
				Projects:  fieldRules,
			}
			if column.CodeTableID.Valid && column.CodeTableID.String != "" {
				data, _, err := e.standardRepo.GetStandardDictById(ctx, column.CodeTableID.String)
				if err == nil {
					buf, err := json.Marshal(data)
					if err != nil {
						return nil, errorcode.Detail(errorcode.PublicInternalError, err)
					}
					fieldConfRule.Params = util.BytesToString(buf)
				}
			}
			fieldConfRules = append(fieldConfRules, fieldConfRule)
		}
	}
	jc.MetadataExploreConfs = metadataRules
	jc.FieldExploreConfs = fieldConfRules
	jc.RowExploreConfs = rowRules
	jc.ViewExploreConfs = viewRules
	return jc, nil
}

func (e *exploreTaskUseCase) ExploreAllAndNotExplored(ctx context.Context, formViews []*model.FormView, catalogName, schema string, exploredViewsMap map[string]int, ret *explore_task.DatasourceExploreDataConfig, fieldRulesMap map[string][]*explore_task.RuleInfo, taskId, userId, userName, strategy string) error {
	exploreDataInfoMap := make(map[string]int)
	if strategy == explore_task.STRATEGY_NOT_EXPLORED {
		res, _ := e.dataExploration.GetStatus(ctx, catalogName, schema, "")
		if res != nil {
			retList := &form_view.JobStatusList{}
			if err := json.Unmarshal(res, retList); err != nil {
				log.WithContext(ctx).Errorf("解析获取探查作业状态失败 catalog:%s schema:%s，err is %v", catalogName, schema, err)
				return errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
			}

			for _, exploreTask := range retList.Entries {
				if exploreTask.ExploreType == explore_task.TaskExploreData.Integer.Int32() {
					if _, exist := exploreDataInfoMap[exploreTask.TableId]; !exist {
						exploreDataInfoMap[exploreTask.TableId] = 1
					}
				}
			}
			if len(formViews) == len(exploreDataInfoMap) {
				task, err := e.exploreTaskRepo.GetByTaskId(ctx, taskId)
				if err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return nil
					}
					log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
					return errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
				}
				task.Status = explore_task.TaskStatusFinished.Integer.Int32()
				finishedTime := time.Now()
				task.FinishedAt = &finishedTime
				err = e.exploreTaskRepo.Update(ctx, task)
				return err
			}
		}
	}
	for _, view := range formViews {
		task, err := e.exploreTaskRepo.GetByTaskId(ctx, taskId)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil
			}
			log.WithContext(ctx).Error("exploreTaskRepo Get DatabaseError", zap.Error(err))
			return errorcode.Detail(my_errorcode.ExploreTaskDatabaseError, err.Error())
		}
		if task.Type == explore_task.TaskStatusCanceled.Integer.Int32() {
			return nil
		}
		if _, ok := exploredViewsMap[view.ID]; ok {
			continue
		}
		if strategy == explore_task.STRATEGY_NOT_EXPLORED {
			if _, ok := exploreDataInfoMap[view.ID]; ok {
				continue
			}
		}
		jc := &explore_task.JobConf{
			Name:        fmt.Sprintf("%s(%s)", view.TechnicalName, view.ID),
			TableID:     view.ID,
			TableName:   view.TechnicalName,
			Schema:      schema,
			VeCatalog:   catalogName,
			TaskEnabled: explore_task.EXPLORE_JOB_ENABLED,
			UserId:      userId,
			UserName:    userName,
			ExploreType: explore_task.TaskExploreData.Integer.Int(),
			TaskId:      taskId,
			TotalSample: ret.TotalSample,
		}
		rules, err := e.exploreRuleConfigRepo.GetRulesByFormViewIds(ctx, []string{view.ID})
		if err != nil {
			return err
		}
		if len(rules) > 0 {
			jc, err = e.getViewConfig(ctx, view, rules, taskId, catalogName, schema, userId, userName, ret.TotalSample)
			if err != nil {
				return err
			}
		} else {
			// 数据源探查规则
			jc.TotalSample = ret.TotalSample
			var columns []*model.FormViewField
			columns, err = e.fieldRepo.GetFormViewFields(ctx, view.ID)
			if err != nil {
				log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
				return errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
			}
			rules, err := e.exploreRuleConfigRepo.GetTemplateRules(ctx)
			if err != nil {
				return err
			}
			ruleNameMap := make(map[string]string)
			for _, rule := range rules {
				ruleNameMap[rule.TemplateID] = rule.RuleName
			}
			metadataRules := make([]*explore_task.JobRuleConf, 0)
			fieldConfRules := make([]*explore_task.JobFieldConf, 0)
			viewRules := make([]*explore_task.JobRuleConf, 0)
			if ret.MetadataConfig != nil && len(ret.MetadataConfig.Rules) > 0 {
				for _, rule := range ret.MetadataConfig.Rules {
					if ruleName, ok := ruleNameMap[rule.RuleId]; ok {
						ruleConfig := &explore_task.JobRuleConf{
							RuleId:          rule.RuleId,
							RuleName:        ruleName,
							Dimension:       rule.Dimension,
							DimensionType:   rule.DimensionType,
							RuleDescription: rule.RuleDescription,
						}
						result, err := e.ExploreMetadata(ctx, view.ID, ruleName)
						if err != nil {
							return err
						}
						ruleConfig.RuleConfig = &result
						metadataRules = append(metadataRules, ruleConfig)
					}
				}
			}
			if ret.ViewConfig != nil && len(ret.ViewConfig.Rules) > 0 {
				for _, rule := range ret.ViewConfig.Rules {
					if ruleName, ok := ruleNameMap[rule.RuleId]; ok {
						ruleConfig := &explore_task.JobRuleConf{
							RuleId:          rule.RuleId,
							RuleName:        ruleName,
							Dimension:       rule.Dimension,
							DimensionType:   rule.DimensionType,
							RuleDescription: rule.RuleDescription,
							RuleConfig:      rule.RuleConfig,
						}
						viewRules = append(viewRules, ruleConfig)
					}
				}
			}
			fieldInfoMap := make(map[string]explore_task.ColumnInfo)
			for _, column := range columns {
				fieldInfoMap[column.ID] = explore_task.ColumnInfo{
					Name:       column.TechnicalName,
					Type:       column.DataType,
					OriginType: column.OriginalDataType,
				}
				fieldRules := make([]*explore_task.JobRuleConf, 0)
				dataType := constant.SimpleTypeMapping[column.DataType]
				var codeInfo string
				if ruleInfo, ok := fieldRulesMap[dataType]; ok {
					for _, rule := range ruleInfo {
						if ruleName, ok := ruleNameMap[rule.RuleId]; ok {
							filedRule := &explore_task.JobRuleConf{
								RuleId:          rule.RuleId,
								RuleName:        ruleName,
								RuleDescription: rule.RuleDescription,
								Dimension:       rule.Dimension,
								DimensionType:   rule.DimensionType,
							}
							var config string
							switch ruleName {
							case explore_task.RuleNull:
								if dataType == constant.SimpleChar {
									config = "{\"null\":[\" \",\"NULL\"]}"
								} else if dataType == constant.SimpleInt || dataType == constant.SimpleFloat || dataType == constant.SimpleDecimal {
									config = "{\"null\":[\"0\",\"NULL\"]}"
								} else {
									config = "{\"null\":[\"NULL\"]}"
								}
							case explore_task.RuleFormat:
								if column.StandardCode.Valid && column.StandardCode.String != "" {
									data, err := e.standardRepo.GetRuleByStandardId(ctx, column.StandardCode.String)
									if err == nil && data != nil && data.Regex != "" {
										formatConfig := explore_task.Format{
											CodeRuleId: data.ID,
											Regex:      data.Regex,
										}
										buf, err := json.Marshal(formatConfig)
										if err != nil {
											return errorcode.Detail(errorcode.PublicInternalError, err)
										}
										config = util.BytesToString(buf)
									}
								} else {
									continue
								}
							case explore_task.RuleDict:
								if column.CodeTableID.Valid && column.CodeTableID.String != "" {
									data, description, err := e.standardRepo.GetStandardDictById(ctx, column.CodeTableID.String)
									if err == nil {
										buf, err := json.Marshal(data)
										if err != nil {
											return errorcode.Detail(errorcode.PublicInternalError, err)
										}
										codeInfo = util.BytesToString(buf)
										dictConfig := explore_task.Dict{
											DictId:   column.CodeTableID.String,
											DictName: description,
										}
										codeArr := make([]explore_task.Data, 0)
										for key, value := range data {
											code := explore_task.Data{
												Code:  key,
												Value: value,
											}
											codeArr = append(codeArr, code)
										}
										dictConfig.Data = codeArr
										dictBuf, err := json.Marshal(dictConfig)
										if err != nil {
											return errorcode.Detail(errorcode.PublicInternalError, err)
										}
										config = util.BytesToString(dictBuf)
									}
								} else {
									continue
								}
							}
							if config != "" {
								filedRule.RuleConfig = &config
							}
							fieldRules = append(fieldRules, filedRule)
						}
					}
				}
				if len(fieldRules) > 0 {
					fieldConfRule := &explore_task.JobFieldConf{
						FieldId:   column.ID,
						FieldName: column.TechnicalName,
						FieldType: dataType,
						Projects:  fieldRules,
					}
					if column.CodeTableID.Valid && column.CodeTableID.String != "" {
						if codeInfo == "" {
							data, _, err := e.standardRepo.GetStandardDictById(ctx, column.CodeTableID.String)
							if err == nil {
								buf, err := json.Marshal(data)
								if err != nil {
									return errorcode.Detail(errorcode.PublicInternalError, err)
								}
								fieldConfRule.Params = util.BytesToString(buf)
							}
						} else {
							fieldConfRule.Params = codeInfo
						}
					}
					fieldConfRules = append(fieldConfRules, fieldConfRule)
				}
			}
			jc.MetadataExploreConfs = metadataRules
			jc.FieldExploreConfs = fieldConfRules
			jc.ViewExploreConfs = viewRules
			buf, _ := json.Marshal(fieldInfoMap)
			jc.FieldInfo = util.BytesToString(buf)
		}
		err = e.StartExploreData(ctx, view, jc)
		if err != nil {
			return err
		}
	}
	return nil
}

func (e *exploreTaskUseCase) StartExploreData(ctx context.Context, view *model.FormView, jc *explore_task.JobConf) error {
	jobID := ""
	if view.ExploreJobId != nil && len(*view.ExploreJobId) > 0 {
		jobID = *view.ExploreJobId
	}
	resp, err := e.ExploreJobUpsert(ctx, jobID, jc)
	if err != nil {
		log.WithContext(ctx).Errorf("exploreJobUpsert for view: %v failed, err: %v", view.ID, err)
		return err
	}

	if _, err = e.repo.UpdateExploreJob(ctx, view.ID,
		map[string]interface{}{
			"explore_job_id":      resp.ExploreJobId,
			"explore_job_version": resp.ExploreJobVer}); err != nil {
		log.WithContext(ctx).Errorf("update explore job info for view: %v failed, err: %v", view.ID, err)
		return errorcode.Detail(my_errorcode.DatabaseError, err)
	}

	return err
}

// 元数据级探查
func (e *exploreTaskUseCase) ExploreMetadata(ctx context.Context, formViewId, ruleName string) (string, error) {
	var result string
	if ruleName == explore_task.RuleViewDescription {
		view, err := e.repo.GetFormViewById(ctx, formViewId)
		if err != nil {
			log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", formViewId, err)
			return "", errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		if view.Comment.String == "" {
			result = fmt.Sprintf("{\"count1\":0,\"count2\":100}")
		} else {
			result = fmt.Sprintf("{\"count1\":100,\"count2\":100}")
		}
	} else {
		columns, err := e.fieldRepo.GetFormViewFields(ctx, formViewId)
		if err != nil {
			log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
			return "", errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
		}
		fieldDescriptionCount := 0
		fieldCount := len(columns)
		if ruleName == explore_task.RuleFieldDescription {
			for _, column := range columns {
				if column.Comment.String != "" {
					fieldDescriptionCount++
				}
			}
			result = fmt.Sprintf("{\"count1\":%d,\"count2\":%d}", fieldDescriptionCount, fieldCount)
		} else if ruleName == explore_task.RuleDataType {
			var standardCount, totalCount int
			for _, column := range columns {
				if column.StandardCode.Valid && column.StandardCode.String != "" {
					totalCount++
					standardInfo, _ := e.standardRepo.GetDataElementDetail(ctx, column.StandardCode.String)
					if standardInfo.DataTypeName == constant.SimpleTypeChMapping[constant.SimpleTypeMapping[column.DataType]] && (standardInfo.DataLength == 0 || standardInfo.DataLength == int(column.DataLength)) && (standardInfo.DataPrecision == nil || *standardInfo.DataPrecision == int(column.DataAccuracy.Int32)) {
						standardCount++
					}
				}
			}
			if totalCount == 0 {
				result = fmt.Sprintf("{\"count1\":0,\"count2\":100}")
			} else {
				result = fmt.Sprintf("{\"count1\":%d,\"count2\":%d}", standardCount, totalCount)
			}
		}
	}
	return result, nil
}

func (e *exploreTaskUseCase) ExploreData(ctx context.Context, taskId, formViewId, userId, userName string) (err error) {
	var view *model.FormView
	remark := &explore_task.TaskRemark{}
	task, err := e.exploreTaskRepo.Get(ctx, taskId)
	if err != nil {
		log.WithContext(ctx).Errorf("任务不存在：%s", taskId)
		return nil
	}
	view, err = e.repo.GetFormViewById(ctx, formViewId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return e.updateTaskFailed(ctx, task, remark, "视图不存在")
		}
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", formViewId, err)
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	catalogName, schema, err := e.GetDatasourceInfo(ctx, view.Type, view.DatasourceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return e.updateTaskFailed(ctx, task, remark, "数据源不存在")
		}
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	// 解析探查配置
	ret := &explore_task.DatasourceExploreDataConfig{}
	if err = json.Unmarshal([]byte(task.Config), ret); err != nil {
		log.WithContext(ctx).Errorf("解析探查配置：%s 详情失败，err is %v", task.Config, err)
		return e.updateTaskFailed(ctx, task, remark, "探查配置错误")
	}
	rules, err := e.exploreRuleConfigRepo.GetEnabledRules(ctx, formViewId)
	if err != nil {
		return err
	}
	if len(rules) == 0 {
		return e.updateTaskFailed(ctx, task, remark, "没有可用的探查规则")
	}
	jc := &explore_task.JobConf{
		Name:        fmt.Sprintf("%s(%s)", view.TechnicalName, view.ID),
		TableID:     view.ID,
		TableName:   view.TechnicalName,
		Schema:      schema,
		VeCatalog:   catalogName,
		TaskEnabled: explore_task.EXPLORE_JOB_ENABLED,
		UserId:      userId,
		UserName:    userName,
		ExploreType: explore_task.TaskExploreData.Integer.Int(),
		TaskId:      taskId,
	}
	err = e.saveExploreViewDataConfig(ctx, task, view.ID, rules)
	if err != nil {
		return err
	}
	jc, err = e.getViewConfig(ctx, view, rules, taskId, catalogName, schema, userId, userName, ret.TotalSample)
	if err != nil {
		return err
	}
	err = e.StartExploreData(ctx, view, jc)
	if err != nil {
		return err
	}
	return nil
}

func (e *exploreTaskUseCase) saveExploreViewDataConfig(ctx context.Context, task *model.ExploreTask, formViewId string, rules []*model.ExploreRuleConfig) error {
	formViewConfig := &explore_task.FormViewExploreDataConfig{}
	metadataRules := make([]*explore_task.RuleConfigInfo, 0)
	rowRules := make([]*explore_task.RuleConfigInfo, 0)
	viewRules := make([]*explore_task.RuleConfigInfo, 0)
	fieldConfigs := make([]*explore_task.ExploreFieldConf, 0)
	fieldMap := make(map[string]int)
	columnMap := make(map[string]int)
	columns, err := e.fieldRepo.GetFormViewFields(ctx, formViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
		return errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
	}
	for _, column := range columns {
		if _, exist := columnMap[column.ID]; !exist {
			columnMap[column.ID] = 1
		}
	}
	for _, rule := range rules {
		ruleConfig := &explore_task.RuleConfigInfo{
			RuleId:          rule.RuleID,
			RuleName:        rule.RuleName,
			RuleDescription: &rule.RuleDescription,
			RuleConfig:      rule.RuleConfig,
			Dimension:       enum.ToString[explore_task.Dimension](rule.Dimension),
		}
		if rule.DimensionType > 0 {
			ruleConfig.DimensionType = enum.ToString[explore_task.DimensionType](rule.DimensionType)
		}
		if rule.RuleLevel == explore_task.RuleLevelMetadata.Integer.Int32() {
			metadataRules = append(metadataRules, ruleConfig)
		}
		if len(metadataRules) > 0 {
			formViewConfig.MetadataConfig = &explore_task.Metadata{Rules: metadataRules}
		}
		if rule.RuleLevel == explore_task.RuleLevelRow.Integer.Int32() {
			rowRules = append(rowRules, ruleConfig)
		}
		if len(rowRules) > 0 {
			formViewConfig.RowConfig = &explore_task.Row{Rules: rowRules}
		}
		if rule.RuleLevel == explore_task.RuleLevelView.Integer.Int32() {
			viewRules = append(viewRules, ruleConfig)
		}
		if len(viewRules) > 0 {
			formViewConfig.ViewConfig = &explore_task.View{Rules: viewRules}
		}
		if rule.RuleLevel == explore_task.RuleLevelField.Integer.Int32() {
			if _, exist := columnMap[rule.FieldID]; !exist {
				err = e.exploreRuleConfigRepo.Delete(ctx, rule.RuleID)
				if err != nil {
					return err
				}
				continue
			}
			if _, exist := fieldMap[rule.FieldID]; !exist {
				fieldMap[rule.FieldID] = 1
			}
		}
	}
	for id, _ := range fieldMap {
		fieldRules := make([]*explore_task.RuleConfigInfo, 0)
		for _, rule := range rules {
			if rule.FieldID == id {
				filedRule := &explore_task.RuleConfigInfo{
					RuleId:          rule.RuleID,
					RuleName:        rule.RuleName,
					RuleDescription: &rule.RuleDescription,
					RuleConfig:      rule.RuleConfig,
					Dimension:       enum.ToString[explore_task.Dimension](rule.Dimension),
				}
				if rule.DimensionType > 0 {
					filedRule.DimensionType = enum.ToString[explore_task.DimensionType](rule.DimensionType)
				}
				fieldRules = append(fieldRules, filedRule)
			}
		}
		if len(fieldRules) > 0 {
			fieldConfig := &explore_task.ExploreFieldConf{FieldId: id, Rules: fieldRules}
			fieldConfigs = append(fieldConfigs, fieldConfig)
		}
	}
	ret := &explore_task.FormViewExploreDataConfig{}
	if err := json.Unmarshal([]byte(task.Config), ret); err != nil {
		log.WithContext(ctx).Errorf("解析探查配置：%s 详情失败，err is %v", task.Config, err)
		return errorcode.Desc(my_errorcode.GetTaskConfigError)
	}
	formViewConfig.TotalSample = ret.TotalSample
	buf, err := json.Marshal(formViewConfig)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", formViewConfig, err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	task.Config = util.BytesToString(buf)
	err = e.exploreTaskRepo.Update(ctx, task)
	if err != nil {
		return err
	}
	return nil
}

func (e *exploreTaskUseCase) ExploreJobUpsert(ctx context.Context, exploreJobID string, jc *explore_task.JobConf) (*explore_task.ExploreJobResp, error) {
	buf, err := json.Marshal(jc)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal data-exploration-service创建/编辑探查作业请求参数失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	var resp *data_exploration.ExploreJobResp
	if exploreJobID == "" {
		resp, err = e.dataExploration.CreateTask(ctx, bytes.NewReader(buf))
	} else {
		resp, err = e.dataExploration.UpdateTask(ctx, bytes.NewReader(buf), exploreJobID)
	}
	if err != nil {
		log.WithContext(ctx).Errorf("请求data-exploration-service创建/编辑探查作业失败，err is %v", err)
		return nil, err
	}

	if len(resp.TaskID) == 0 {
		log.WithContext(ctx).Errorf("解析创建/编辑探查作业反馈结果失败，err is %v", err)
		return nil, errorcode.Detail(my_errorcode.DataExploreJobUpsertErr, err)
	}

	return &explore_task.ExploreJobResp{
		ExploreJobId:  resp.TaskID,
		ExploreJobVer: resp.Version,
	}, nil
}

func (e *exploreTaskUseCase) GetDatasourceInfo(ctx context.Context, viewType int32, datasourceId string) (catalogName, schema string, err error) {
	switch viewType {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasource, err := e.datasourceRepo.GetById(ctx, datasourceId)
		if err != nil {
			return "", "", err
		}
		if split := strings.Split(datasource.DataViewSource, `.`); len(split) > 2 {
			catalogName = split[0]
			schema = split[1]
		}
		catalogName = strings.Split(datasource.DataViewSource, ".")[0]
		schema = strings.Split(datasource.DataViewSource, ".")[1]
	case constant.FormViewTypeCustom.Integer.Int32():
		catalogName = constant.CustomViewSource
		schema = constant.ViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		catalogName = constant.LogicEntityViewSource
		schema = constant.ViewSourceSchema
	default:
		err = errors.New("unknown view task type")
		log.WithContext(ctx).Errorf("unknown view task type")
	}
	return
}

func (e *exploreTaskUseCase) ExploreTimestamp(ctx context.Context, taskId, formViewId, userId, userName string) (err error) {
	var view *model.FormView
	remark := &explore_task.TaskRemark{}
	task, err := e.exploreTaskRepo.Get(ctx, taskId)
	if err != nil {
		log.WithContext(ctx).Errorf("任务不存在：%s", taskId)
		return nil
	}
	view, err = e.repo.GetFormViewById(ctx, formViewId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return e.updateTaskFailed(ctx, task, remark, "视图不存在")
		}
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", formViewId, err)
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	catalogName, schema, err := e.GetDatasourceInfo(ctx, view.Type, view.DatasourceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return e.updateTaskFailed(ctx, task, remark, "数据源不存在")
		}
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	blacklistMap := make(map[string]int)
	blacklists, err := e.configurationCenterDrivenNG.GetTimestampBlacklist(ctx)
	if err != nil {
		log.WithContext(ctx).Error("get timestamp blacklist for data view fail")
	} else {
		for _, blacklist := range blacklists {
			if _, ok := blacklistMap[blacklist]; !ok {
				blacklistMap[blacklist] = 1
			}
		}
	}
	err = e.exploreTimestamp(ctx, blacklistMap, taskId, view, userId, userName, catalogName, schema)
	return err
}

func (e *exploreTaskUseCase) exploreTimestamp(ctx context.Context, blacklistMap map[string]int, taskId string, view *model.FormView, userId, userName, catalogName, schema string) (err error) {
	jc := &explore_task.JobConf{
		Name:        fmt.Sprintf("%s(%s)", view.TechnicalName, view.ID),
		TableID:     view.ID,
		TableName:   view.TechnicalName,
		Schema:      schema,
		VeCatalog:   catalogName,
		UserId:      userId,
		UserName:    userName,
		TaskEnabled: explore_task.EXPLORE_JOB_ENABLED,
		ExploreType: explore_task.TaskExploreTimestamp.Integer.Int(),
		TaskId:      taskId,
	}
	var columns []*model.FormViewField
	columns, err = e.fieldRepo.GetFormViewFields(ctx, view.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
		return errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
	}

	for i := range columns {
		if _, ok := blacklistMap[columns[i].TechnicalName]; ok {
			continue
		}
		jfc := &explore_task.JobFieldConf{}
		dataType := constant.SimpleTypeMapping[columns[i].DataType]
		if dataType == constant.SimpleChar || dataType == constant.SimpleDate || dataType == constant.SimpleDatetime {
			jfc.FieldId = columns[i].ID
			jfc.FieldName = columns[i].TechnicalName
			jfc.FieldType = dataType
			jfc.Code = append(jfc.Code, "NotNull")
			jc.FieldExploreConfs = append(jc.FieldExploreConfs, jfc)
		}
	}
	jobID := ""
	if view.ExploreTimestampID != nil && len(*view.ExploreTimestampID) > 0 {
		jobID = *view.ExploreTimestampID
	}
	jc.UserId = userId
	jc.UserName = userName
	res, err := e.ExploreJobUpsert(ctx, jobID, jc)
	if err != nil {
		log.WithContext(ctx).Errorf("exploreJobUpsert for view: %v failed, err: %v", view.ID, err)
		return err
	}

	if _, err = e.repo.UpdateExploreJob(ctx, view.ID,
		map[string]interface{}{
			"ExploreTimestampID":      res.ExploreJobId,
			"ExploreTimestampVersion": res.ExploreJobVer}); err != nil {
		log.WithContext(ctx).Errorf("update explore job info for view: %v failed, err: %v", view.ID, err)
		return errorcode.Detail(my_errorcode.DatabaseError, err)
	}
	return nil
}

func (e *exploreTaskUseCase) DatasourceExploreTimestamp(ctx context.Context, taskId, datasourceId, userId, userName string) error {
	remark := &explore_task.TaskRemark{}
	task, err := e.exploreTaskRepo.Get(ctx, taskId)
	if err != nil {
		log.WithContext(ctx).Errorf("任务不存在：%s", taskId)
		return nil
	}
	_, err = e.datasourceRepo.GetById(ctx, datasourceId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return e.updateTaskFailed(ctx, task, remark, "数据源不存在")
		}
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	formViews, err := e.repo.GetFormViews(ctx, datasourceId)
	if err != nil {
		log.WithContext(ctx).Errorf("DatasourceExploreConfig GetFormViews error: %s,datasource id: %s", err.Error(), datasourceId)
		return err
	}
	if len(formViews) == 0 {
		task.Status = explore_task.TaskStatusFinished.Integer.Int32()
		finishedTime := time.Now()
		task.FinishedAt = &finishedTime
		err = e.exploreTaskRepo.Update(ctx, task)
		return err
	}
	// 获取已经执行过的子任务
	rBuf, _ := e.dataExploration.GetStatus(ctx, "", "", taskId)
	exploredViewsMap := make(map[string]int)
	if rBuf != nil {
		res := &form_view.JobStatusList{}
		err = json.Unmarshal(rBuf, res)
		if err = json.Unmarshal(rBuf, res); err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业状态失败 task id:%s，err is %v", taskId, err)
			return errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
		}
		for _, exploreTask := range res.Entries {
			if exploreTask.ExploreType == explore_task.TaskExploreTimestamp.Integer.Int32() && exploreTask.ExecStatus != explore_task.TaskStatusQueuing.Integer.Int32() {
				if _, ok := exploredViewsMap[exploreTask.TableId]; !ok {
					exploredViewsMap[exploreTask.TableId] = 1
				}
			}
		}
	}
	var catalogName, schema string
	if len(formViews) > 0 {
		catalogName, schema, err = e.GetDatasourceInfo(ctx, formViews[0].Type, formViews[0].DatasourceID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return e.updateTaskFailed(ctx, task, remark, "数据源不存在")
			}
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
	}
	blacklistMap := make(map[string]int)
	blacklists, err := e.configurationCenterDrivenNG.GetTimestampBlacklist(ctx)
	if err != nil {
		log.WithContext(ctx).Error("get timestamp blacklist for data view fail")
	} else {
		for _, blacklist := range blacklists {
			if _, ok := blacklistMap[blacklist]; !ok {
				blacklistMap[blacklist] = 1
			}
		}
	}
	for _, view := range formViews {
		if _, ok := exploredViewsMap[view.ID]; ok {
			continue
		}
		err = e.exploreTimestamp(ctx, blacklistMap, taskId, view, userId, userName, catalogName, schema)
	}
	return err
}

func (e *exploreTaskUseCase) GetWorkOrderExploreProgress(ctx context.Context, req *explore_task.WorkOrderExploreProgressReq) (*explore_task.WorkOrderExploreProgressResp, error) {
	// 解析工单ID列表
	workOrderIDs := strings.Split(req.WorkOrderIds, ",")

	exploreTasks, err := e.exploreTaskRepo.GetListByWorkOrderIDs(ctx, workOrderIDs)
	if err != nil {
		log.WithContext(ctx).Errorf("get explore tasks for work order ids: %s failed, err: %v", req.WorkOrderIds, err)
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	var (
		idx       int
		isExisted bool
	)
	woIDmap := make(map[string]int)
	resp := &explore_task.WorkOrderExploreProgressResp{
		Entries: make([]*explore_task.WorkOrderExploreProgressEntity, 0),
	}
	for i := range exploreTasks {
		if idx, isExisted = woIDmap[exploreTasks[i].WorkOrderID]; !isExisted {
			resp.Entries = append(resp.Entries,
				&explore_task.WorkOrderExploreProgressEntity{
					WorkOrderId:     exploreTasks[i].WorkOrderID,
					TotalTaskNum:    0,
					FinishedTaskNum: 0,
					Entries:         make([]*explore_task.ExploreTaskStatusEntity, 0),
				},
			)
			idx = len(resp.Entries) - 1
			woIDmap[exploreTasks[i].WorkOrderID] = idx
		}
		resp.Entries[idx].TotalTaskNum++
		if exploreTasks[i].Status == explore_task.TaskStatusFinished.Integer.Int32() ||
			exploreTasks[i].Status == explore_task.TaskStatusCanceled.Integer.Int32() ||
			exploreTasks[i].Status == explore_task.TaskStatusFailed.Integer.Int32() {
			resp.Entries[idx].FinishedTaskNum++
		}
		resp.Entries[idx].Entries = append(resp.Entries[idx].Entries,
			&explore_task.ExploreTaskStatusEntity{
				DataSourceID: exploreTasks[i].DatasourceID,
				FormViewID:   exploreTasks[i].FormViewID,
				Status:       enum.ToString[explore_task.TaskStatus](exploreTasks[i].Status),
			},
		)
	}
	return resp, err
}

func (e *exploreTaskUseCase) List(ctx context.Context, req *explore_task.ListExploreTaskReq) (*explore_task.ListExploreTaskResp, error) {
	exploreTaskInfos := make([]*explore_task.ExploreTaskInfo, 0)
	userInfo, _ := util.GetUserInfo(ctx)
	var userId string
	if userInfo != nil {
		userId = userInfo.ID
	}
	total, tasks, err := e.exploreTaskRepo.GetList(ctx, req, userId)
	if err != nil {
		return nil, nil
	}
	for _, task := range tasks {
		if (task.Status == explore_task.TaskStatusQueuing.Integer.Int32() || task.Status == explore_task.TaskStatusRunning.Integer.Int32()) &&
			(task.Type == explore_task.TaskExploreData.Integer.Int32() || task.Type == explore_task.TaskExploreTimestamp.Integer.Int32()) {
			status, remark, finishedTime, err := e.GetTaskStatus(ctx, task.TaskID)
			if err == nil && status != task.Status {
				taskInfo, _ := e.exploreTaskRepo.Get(ctx, task.TaskID)
				task.Status = status
				taskInfo.Status = status
				if finishedTime > 0 {
					finishedAt := time.UnixMilli(finishedTime)
					taskInfo.FinishedAt = &finishedAt
					task.FinishedAt = &finishedAt
				}
				if remark != "" {
					taskInfo.Remark = remark
					task.Remark = remark
				}
				err = e.exploreTaskRepo.Update(ctx, taskInfo)
				if err != nil {
					return nil, err
				}
			}
		}
		user, err := e.userRepo.GetByUserId(ctx, task.CreatedBy)
		if err != nil {
			return nil, err
		}
		exploreTaskInfo := task.ToModel(user.Name)
		exploreTaskInfos = append(exploreTaskInfos, exploreTaskInfo)
	}
	resp := &explore_task.ListExploreTaskResp{
		Entries:    exploreTaskInfos,
		TotalCount: total,
	}
	return resp, nil
}

func (e *exploreTaskUseCase) GetTaskStatus(ctx context.Context, taskId string) (status int32, remark string, finishedTime int64, err error) {
	rBuf, _ := e.dataExploration.GetStatus(ctx, "", "", taskId)
	if rBuf != nil {
		ret := &form_view.JobStatusList{}
		err = json.Unmarshal(rBuf, ret)
		if err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业状态失败 task id:%s，err is %v", taskId, err)
			return status, remark, 0, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
		} else {
			if len(ret.Entries) > 0 {
				totalCount := len(ret.Entries)
				exceptionDetails := make([]*explore_task.TaskExceptionDetail, 0)
				failedViews := make([]*explore_task.ViewInfo, 0)
				timeoutViews := make([]*explore_task.ViewInfo, 0)
				invalidParameterViews := make([]*explore_task.ViewInfo, 0)
				badRequestViews := make([]*explore_task.ViewInfo, 0)
				otherViews := make([]*explore_task.ViewInfo, 0)
				if totalCount == 0 {
					status = explore_task.TaskStatusQueuing.Integer.Int32()
				} else {
					var queuingCount, runningCount, finishedCount, canceledCount, failedCount int
					var updatedTime int64
					for i := range ret.Entries {
						if ret.Entries[i].UpdatedAt > 0 {
							updatedTime = ret.Entries[i].UpdatedAt
						}
						switch ret.Entries[i].ExecStatus {
						case explore_task.TaskStatusQueuing.Integer.Int32():
							queuingCount++
						case explore_task.TaskStatusFinished.Integer.Int32():
							finishedCount++
						case explore_task.TaskStatusFailed.Integer.Int32():
							failedCount++
							if strings.HasPrefix(ret.Entries[i].Reason, "虚拟化引擎执行失败") {
								failedViews = append(failedViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
							} else if strings.HasPrefix(ret.Entries[i].Reason, "超过最长执行时长") {
								timeoutViews = append(timeoutViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
							} else if strings.HasPrefix(ret.Entries[i].Reason, "探查规则配置错误") {
								invalidParameterViews = append(invalidParameterViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
							} else if strings.HasPrefix(ret.Entries[i].Reason, "虚拟化引擎请求失败") {
								badRequestViews = append(badRequestViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
							} else {
								otherViews = append(otherViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
							}
						case explore_task.TaskStatusRunning.Integer.Int32():
							runningCount++
						case explore_task.TaskStatusCanceled.Integer.Int32():
							canceledCount++
						default:
							err = errorcode.Detail(my_errorcode.DataExploreJobStatusGetErr, "未知的质量检测作业执行状态")
						}
					}
					if queuingCount == totalCount {
						status = explore_task.TaskStatusQueuing.Integer.Int32()
					} else if finishedCount == totalCount {
						status = explore_task.TaskStatusFinished.Integer.Int32()
						finishedTime = updatedTime
					} else if canceledCount > 0 {
						status = explore_task.TaskStatusCanceled.Integer.Int32()
					} else if failedCount+finishedCount == totalCount {
						status = explore_task.TaskStatusFailed.Integer.Int32()
						finishedTime = updatedTime
					} else {
						status = explore_task.TaskStatusRunning.Integer.Int32()
					}
					if failedCount > 0 {
						if len(failedViews) > 0 {
							exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "虚拟化引擎执行失败", ViewInfo: failedViews})
						}
						if len(timeoutViews) > 0 {
							exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "任务超时", ViewInfo: timeoutViews})
						}
						if len(invalidParameterViews) > 0 {
							exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "探查规则配置错误", ViewInfo: invalidParameterViews})
						}
						if len(badRequestViews) > 0 {
							exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "虚拟化引擎请求失败", ViewInfo: badRequestViews})
						}
						if len(otherViews) > 0 {
							exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "内部错误", ViewInfo: otherViews})
						}
						remarkInfo := &explore_task.TaskRemark{
							Description: exploreException,
							Details:     exceptionDetails,
							TotalCount:  failedCount,
						}
						buf, err := json.Marshal(remarkInfo)
						if err != nil {
							log.WithContext(ctx).Errorf("json.Marshal remarkInfo 失败，err is %v", err)
						}
						remark = string(buf)
					}
				}
			} else {
				return status, remark, finishedTime, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
			}
		}
	}
	return status, remark, finishedTime, err
}

func (e *exploreTaskUseCase) GetTask(ctx context.Context, req *explore_task.GetTaskReq) (*explore_task.ExploreTaskResp, error) {
	_, err := e.exploreTaskRepo.Get(ctx, req.TaskID)
	if err != nil {
		return nil, err
	}
	resp := &explore_task.ExploreTaskResp{}
	task, err := e.exploreTaskRepo.GetDetail(ctx, req.TaskID)
	if err != nil {
		return resp, err
	}
	if (task.Status == explore_task.TaskStatusQueuing.Integer.Int32() || task.Status == explore_task.TaskStatusRunning.Integer.Int32()) &&
		(task.Type == explore_task.TaskExploreData.Integer.Int32() || task.Type == explore_task.TaskExploreTimestamp.Integer.Int32()) {
		status, remark, finishedTime, err := e.GetTaskStatus(ctx, task.TaskID)
		if err == nil && status != task.Status {
			taskInfo, _ := e.exploreTaskRepo.Get(ctx, task.TaskID)
			task.Status = status
			taskInfo.Status = status
			if finishedTime > 0 {
				finishedAt := time.UnixMilli(finishedTime)
				taskInfo.FinishedAt = &finishedAt
				task.FinishedAt = &finishedAt
			}
			if remark != "" {
				taskInfo.Remark = remark
				task.Remark = remark
			}
			err = e.exploreTaskRepo.Update(ctx, taskInfo)
			if err != nil {
				return resp, err
			}
		}
	}
	userInfo, _ := util.GetUserInfo(ctx)
	resp.ExploreTaskInfo = *task.ToModel(userInfo.Name)
	return resp, nil
}

func (e *exploreTaskUseCase) CancelTask(ctx context.Context, req *explore_task.CancelTaskReq) (*explore_task.ExploreTaskIDResp, error) {
	task, err := e.exploreTaskRepo.Get(ctx, req.TaskID)
	if err != nil {
		return nil, err
	}
	if req.Status == explore_task.TaskStatusCanceled.String {
		task.Status = enum.ToInteger[explore_task.TaskStatus](req.Status).Int32()
		finishedTime := time.Now()
		task.FinishedAt = &finishedTime
	}
	err = e.exploreTaskRepo.Update(ctx, task)
	if err != nil {
		return nil, err
	}
	if task.Type == explore_task.TaskExploreData.Integer.Int32() || task.Type == explore_task.TaskExploreTimestamp.Integer.Int32() {
		err = e.dataExploration.DeleteTask(ctx, task.TaskID)
		if err != nil {
			return nil, err
		}
	} else if task.Type == explore_task.TaskExploreDataClassification.Integer.Int32() {
		err = e.tmpExploreSubTaskRepo.UpdateStatusByParentTaskID(ctx, req.TaskID, enum.ToInteger[explore_task.TaskStatus](req.Status).Int32())
		if err != nil {
			return nil, err
		}
	}

	return &explore_task.ExploreTaskIDResp{TaskID: req.TaskID}, nil
}

func (e *exploreTaskUseCase) DeleteRecord(ctx context.Context, req *explore_task.DeleteRecordReq) (*explore_task.ExploreTaskIDResp, error) {
	_, err := e.exploreTaskRepo.Get(ctx, req.TaskID)
	if err != nil {
		return nil, err
	}
	err = e.exploreTaskRepo.Delete(ctx, req.TaskID)
	if err != nil {
		return nil, err
	}
	return &explore_task.ExploreTaskIDResp{TaskID: req.TaskID}, nil
}

func (e *exploreTaskUseCase) CreateRule(ctx context.Context, req *explore_task.CreateRuleReq) (*explore_task.RuleIDResp, error) {
	var ruleLevel, formViewId string
	var field *model.FormViewField
	var err error
	var status int32
	if *req.Enable {
		status = 1
	}
	if req.FormViewId == "" && req.FieldId == "" {
		return nil, errorcode.Detail(my_errorcode.RuleConfigError, "form_view_id 和 field_id至少填一个")
	}
	if req.FormViewId != "" {
		_, err := e.repo.GetById(ctx, req.FormViewId)
		if err != nil {
			return nil, err
		}
		formViewId = req.FormViewId
	}
	if req.FieldId != "" {
		field, err = e.fieldRepo.GetField(ctx, req.FieldId)
		if err != nil {
			return nil, err
		}
		if formViewId == "" {
			formViewId = field.FormViewID
		} else {
			if field.FormViewID != formViewId {
				return nil, errorcode.Detail(my_errorcode.RuleConfigError, "该视图下无此字段")
			}
		}
	}
	createdTime := time.Now()
	ruleModel := &model.ExploreRuleConfig{
		RuleName:        req.RuleName,
		RuleDescription: req.RuleDescription,
		FormViewID:      formViewId,
		FieldID:         req.FieldId,
		TemplateID:      req.TemplateId,
		RuleConfig:      req.RuleConfig,
		Enable:          status,
		CreatedAt:       createdTime,
		CreatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
		UpdatedAt:       createdTime,
		UpdatedByUID:    ctx.Value(interception.InfoName).(*middleware.User).ID,
	}
	if req.TemplateId != "" {
		repeat, err := e.exploreRuleConfigRepo.CheckRuleByTemplateId(ctx, req.TemplateId, formViewId, req.FieldId)
		if err != nil {
			return nil, err
		}
		if repeat {
			return nil, errorcode.Desc(my_errorcode.RuleAlreadyExists)
		}
		rule, err := e.exploreRuleConfigRepo.GetByTemplateId(ctx, req.TemplateId)
		if err != nil {
			return nil, err
		}
		ruleLevel = enum.ToString[explore_task.RuleLevel](rule.RuleLevel)
		if req.RuleName != "" || req.RuleDescription != "" || req.RuleLevel != "" || req.Dimension != "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "内置规则rule_name,rule_description,rule_level,dimension不用传")
		}
		if rule.RuleLevel == explore_task.RuleLevelField.Integer.Int32() && req.FieldId == "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "field_id 必填")
		}
		if req.FieldId != "" && !explore_task.ColTypeRuleMap[constant.SimpleTypeMapping[field.DataType]][req.TemplateId] {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "字段不支持该项规则")
		}
		ruleModel.RuleName = rule.RuleName
		ruleModel.RuleDescription = rule.RuleDescription
		ruleModel.RuleLevel = rule.RuleLevel
		ruleModel.Dimension = rule.Dimension
	} else {
		if req.RuleName == "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "自定义规则rule_name 必填")
		}
		if req.RuleLevel == "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "自定义规则rule_level 必填")
		}
		if req.Dimension == "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "自定义规则dimension 必填")
		} else {
			if req.RuleLevel == explore_task.RuleLevelMetadata.String {
				return nil, errorcode.Detail(my_errorcode.RuleConfigError, "不能添加元数据级自定义规则")
			}
			if req.RuleLevel == explore_task.RuleLevelField.String && (req.Dimension == explore_task.DimensionConsistency.String || req.Dimension == explore_task.DimensionTimeliness.String) {
				return nil, errorcode.Detail(my_errorcode.RuleConfigError, "不能添加字段级一致性、及时性自定义规则")
			}
			if req.RuleLevel == explore_task.RuleLevelRow.String && req.Dimension != explore_task.DimensionCompleteness.String && req.Dimension != explore_task.DimensionUniqueness.String && req.Dimension != explore_task.DimensionAccuracy.String {
				return nil, errorcode.Detail(my_errorcode.RuleConfigError, "行级只能添加完整性、唯一性、准确性自定义规则")
			}
			if req.RuleLevel == explore_task.RuleLevelView.String && req.Dimension != explore_task.DimensionCompleteness.String && req.Dimension != explore_task.DimensionTimeliness.String {
				return nil, errorcode.Detail(my_errorcode.RuleConfigError, "视图级只能添加完整性、及时性规则")
			}
			ruleModel.RuleLevel = enum.ToInteger[explore_task.RuleLevel](req.RuleLevel).Int32()
			ruleModel.Dimension = enum.ToInteger[explore_task.Dimension](req.Dimension).Int32()
		}
		if req.RuleConfig == nil {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "自定义规则rule_config 必填")
		}
		ruleLevel = req.RuleLevel
	}
	switch ruleLevel {
	case explore_task.RuleLevelMetadata.String, explore_task.RuleLevelRow.String, explore_task.RuleLevelView.String:
		if req.FormViewId == "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "form_view_id 必填")
		}
	case explore_task.RuleLevelField.String:
		if req.FieldId == "" {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "field_id 必填")
		}
	}
	err = e.CheckRuleConfig(ctx, req)
	if err != nil {
		return nil, err
	}
	if req.TemplateId == "" {
		repeat, err := e.exploreRuleConfigRepo.CheckRuleNameRepeat(ctx, req.FormViewId, "", req.RuleName)
		if err != nil {
			return nil, err
		}
		if repeat {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "rule_name重复")
		}
	}

	ruleId, err := e.exploreRuleConfigRepo.Create(ctx, ruleModel)
	if err != nil {
		return nil, err
	}
	return &explore_task.RuleIDResp{RuleID: ruleId}, nil
}

func (e *exploreTaskUseCase) CheckRuleConfig(ctx context.Context, req *explore_task.CreateRuleReq) error {
	res := &explore_task.RuleConfig{}
	if req.RuleConfig != nil {
		err := json.Unmarshal([]byte(*req.RuleConfig), res)
		if err != nil {
			log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
			return errorcode.Detail(my_errorcode.RuleConfigError, "规则配置错误")
		}
	}
	if req.TemplateId != "" {
		ruleConfig, _ := explore_task.TemplateRuleMap[req.TemplateId]
		switch ruleConfig {
		case explore_task.RuleNull:
			if res.Null == nil {
				return errorcode.Detail(my_errorcode.RuleConfigError, "null配置必填")
			}
		case explore_task.RuleDict:
			if res.Dict == nil {
				return errorcode.Detail(my_errorcode.RuleConfigError, "dict配置必填")
			}
		case explore_task.RuleFormat:
			if res.Format == nil {
				return errorcode.Detail(my_errorcode.RuleConfigError, "format配置必填")
			}
		case explore_task.RuleRowNull:
			if res.RowNull == nil {
				return errorcode.Detail(my_errorcode.RuleConfigError, "row_null配置必填")
			}
		case explore_task.RuleRowRepeat:
			if res.RowRepeat == nil {
				return errorcode.Detail(my_errorcode.RuleConfigError, "row_repeat配置必填")
			}
		case explore_task.RuleUpdatePeriod:
			if res.UpdatePeriod == nil || !explore_task.ValidPeriods[*res.UpdatePeriod] {
				return errorcode.Detail(my_errorcode.RuleConfigError, "update_period配置必填,且为day week month quarter half_a_year year中的一个")
			}
		case explore_task.RuleOther:
			if req.RuleConfig != nil {
				return errorcode.Detail(my_errorcode.RuleConfigError, "rule_config错误，该内置规则无配置")
			}
		}
	} else {
		if res.RuleExpression == nil {
			return errorcode.Detail(my_errorcode.RuleConfigError, "rule_expression配置必填")
		}
	}
	return nil
}

func (e *exploreTaskUseCase) GetRuleList(ctx context.Context, req *explore_task.GetRuleListReq) ([]*explore_task.GetRuleResp, error) {
	exploreRules := make([]*explore_task.GetRuleResp, 0)
	rules, err := e.exploreRuleConfigRepo.GetList(ctx, &req.GetRuleListReqQuery)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		exploreRule := convertToExploreRule(rule)
		exploreRules = append(exploreRules, exploreRule)
	}
	return exploreRules, nil
}

func (e *exploreTaskUseCase) GetRule(ctx context.Context, req *explore_task.GetRuleReq) (*explore_task.GetRuleResp, error) {
	rule, err := e.exploreRuleConfigRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	resp := convertToExploreRule(rule)
	return resp, nil
}
func (e *exploreTaskUseCase) NameRepeat(ctx context.Context, req *explore_task.NameRepeatReq) (bool, error) {
	_, err := e.repo.GetById(ctx, req.FormViewId)
	if err != nil {
		return false, err
	}
	repeat, err := e.exploreRuleConfigRepo.CheckRuleNameRepeat(ctx, req.FormViewId, req.RuleId, req.RuleName)
	return repeat, err
}

func (e *exploreTaskUseCase) UpdateRule(ctx context.Context, req *explore_task.UpdateRuleReq) (*explore_task.RuleIDResp, error) {
	hasTemplateRule, err := e.exploreRuleConfigRepo.HasTemplateRule(ctx, []string{req.RuleId})
	if err != nil {
		return nil, err
	}
	if hasTemplateRule {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "模板规则不能直接更新")
	}
	rule, err := e.exploreRuleConfigRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	if rule.TemplateID != "" {
		if req.RuleName != rule.RuleName || req.RuleDescription != rule.RuleDescription {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "内置规则不能修改规则名称和描述")
		}
	} else {
		repeat, err := e.exploreRuleConfigRepo.CheckRuleNameRepeat(ctx, rule.FormViewID, rule.RuleID, req.RuleName)
		if err != nil {
			return nil, err
		}
		if repeat {
			return nil, errorcode.Detail(my_errorcode.RuleConfigError, "rule_name重复")
		}
	}
	// 检查规则配置
	err = e.CheckRuleConfig(ctx, &explore_task.CreateRuleReq{explore_task.CreateRuleReqBody{TemplateId: rule.TemplateID, RuleConfig: req.RuleConfig}})
	if err != nil {
		return nil, err
	}
	rule.RuleName = req.RuleName
	rule.RuleDescription = req.RuleDescription
	rule.RuleConfig = req.RuleConfig
	var status int32
	if req.Enable != nil {
		if *req.Enable {
			status = 1
		}
		rule.Enable = status
	}
	err = e.exploreRuleConfigRepo.Update(ctx, rule)
	return &explore_task.RuleIDResp{RuleID: req.RuleId}, err
}

func (e *exploreTaskUseCase) UpdateRuleStatus(ctx context.Context, req *explore_task.UpdateRuleStatusReq) (bool, error) {
	hasTemplateRule, err := e.exploreRuleConfigRepo.HasTemplateRule(ctx, req.RuleIds)
	if err != nil {
		return false, err
	}
	if hasTemplateRule {
		return false, errorcode.Detail(errorcode.PublicInvalidParameter, "模板规则不能直接更新启用状态")
	}
	err = e.exploreRuleConfigRepo.UpdateStatus(ctx, req.RuleIds, *req.Enable)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (e *exploreTaskUseCase) DeleteRule(ctx context.Context, req *explore_task.DeleteRuleReq) (*explore_task.RuleIDResp, error) {
	_, err := e.exploreRuleConfigRepo.GetByRuleId(ctx, req.RuleId)
	if err != nil {
		return nil, err
	}
	err = e.exploreRuleConfigRepo.Delete(ctx, req.RuleId)
	return &explore_task.RuleIDResp{RuleID: req.RuleId}, err
}

func (e *exploreTaskUseCase) GetInternalRule(ctx context.Context) ([]*explore_task.GetInternalRuleResp, error) {
	exploreRules := make([]*explore_task.GetInternalRuleResp, 0)
	rules, err := e.exploreRuleConfigRepo.GetTemplateRules(ctx)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		exploreRule := &explore_task.GetInternalRuleResp{
			TemplateId:      rule.TemplateID,
			RuleName:        rule.RuleName,
			RuleDescription: rule.RuleDescription,
			RuleLevel:       enum.ToString[explore_task.RuleLevel](rule.RuleLevel),
			Dimension:       enum.ToString[explore_task.Dimension](rule.Dimension),
			RuleConfig:      rule.RuleConfig,
		}
		if rule.DimensionType > 0 {
			exploreRule.DimensionType = enum.ToString[explore_task.DimensionType](rule.DimensionType)
		}
		exploreRules = append(exploreRules, exploreRule)
	}
	return exploreRules, nil
}

func convertToExploreRule(rule *model.ExploreRuleConfig) *explore_task.GetRuleResp {
	status := false
	if rule.Enable == 1 {
		status = true
	}
	resp := &explore_task.GetRuleResp{
		RuleId:          rule.RuleID,
		RuleName:        rule.RuleName,
		RuleDescription: rule.RuleDescription,
		RuleLevel:       enum.ToString[explore_task.RuleLevel](rule.RuleLevel),
		FieldId:         rule.FieldID,
		Dimension:       enum.ToString[explore_task.Dimension](rule.Dimension),
		RuleConfig:      rule.RuleConfig,
		Enable:          status,
		TemplateId:      rule.TemplateID,
	}
	if rule.DimensionType > 0 {
		resp.DimensionType = enum.ToString[explore_task.DimensionType](rule.DimensionType)
	}
	return resp
}

func (e *exploreTaskUseCase) executeTask(ctx context.Context, task explore_task.Task) explore_task.Result {
	result := explore_task.Result{FormViewId: task.FormViewId}
	config := explore_task.FormViewExploreDataConfig{TotalSample: task.TotalSample}
	buf, err := json.Marshal(config)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal config 失败，err is %v", err)
	}
	exploreTask := &model.ExploreTask{
		Type:         explore_task.TaskExploreData.Integer.Int32(),
		Status:       explore_task.TaskStatusQueuing.Integer.Int32(),
		Config:       string(buf),
		CreatedByUID: task.CreatedByUID,
	}
	err = e.CreateTemplateRules(ctx, task.FormViewId, task.CreatedByUID)
	if err != nil {
		result.Error = err
		return result
	}

	view, err := e.repo.GetById(ctx, task.FormViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", task.FormViewId, err)
		result.Error = err
		return result
	}
	exploreTask.WorkOrderID = task.WorkOrderId
	exploreTask.FormViewID = task.FormViewId
	exploreTask.FormViewType = view.Type
	exploreTask.DatasourceID = view.DatasourceID
	taskId, err := e.exploreTaskRepo.Create(ctx, exploreTask)
	if err != nil {
		result.Error = err
		return result
	}
	err = e.publishExploreTask(ctx, taskId, task.CreatedByUID)
	if err != nil {
		_ = e.exploreTaskRepo.Delete(ctx, taskId)
	}
	result.TaskId = taskId
	return result
}

func (e *exploreTaskUseCase) batchExecute(ctx context.Context, tasks []explore_task.Task, concurrency int) []explore_task.Result {
	var wg sync.WaitGroup
	taskChan := make(chan explore_task.Task, len(tasks))
	resultChan := make(chan explore_task.Result, len(tasks))

	// 启动 worker
	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for task := range taskChan {
				result := e.executeTask(ctx, task)
				resultChan <- result
			}
		}()
	}

	// 发送任务
	for _, task := range tasks {
		taskChan <- task
	}
	close(taskChan)

	// 等待所有任务完成并关闭结果通道
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// 收集结果
	var results []explore_task.Result
	for result := range resultChan {
		results = append(results, result)
	}

	return results
}

func (e *exploreTaskUseCase) CreateWorkOrderTask(ctx context.Context, req *explore_task.CreateWorkOrderTaskReq) (*explore_task.CreateWorkOrderTaskResp, error) {
	tasks := make([]explore_task.Task, 0)
	for _, formViewId := range req.FormViewIDs {
		tasks = append(tasks, explore_task.Task{
			FormViewId:   formViewId,
			WorkOrderId:  req.WorkOrderID,
			CreatedByUID: req.CreatedByUID,
			TotalSample:  req.TotalSample,
		})
	}
	results := e.batchExecute(ctx, tasks, 10)
	return &explore_task.CreateWorkOrderTaskResp{Result: results}, nil
}

func (e *exploreTaskUseCase) CreateTemplateRules(ctx context.Context, formViewId, userId string) error {
	rules := make([]*model.ExploreRuleConfig, 0)
	rules, err := e.exploreRuleConfigRepo.GetList(ctx, &explore_task.GetRuleListReqQuery{FormViewId: formViewId})
	if err != nil {
		return err
	}
	if len(rules) > 0 {
		return nil
	}
	templateRules, err := e.templateRuleRepo.GetInternalRules(ctx)
	createdTime := time.Now()
	templateRuleMap := make(map[string]*model.TemplateRule)
	for _, templateRule := range templateRules {
		if templateRule.RuleLevel == explore_rule.RuleLevelMetadata.Integer.Int32() {
			rule := &model.ExploreRuleConfig{
				RuleName:        templateRule.RuleName,
				RuleDescription: templateRule.RuleDescription,
				RuleLevel:       templateRule.RuleLevel,
				FormViewID:      formViewId,
				FieldID:         "",
				Dimension:       templateRule.Dimension,
				RuleConfig:      nil,
				Enable:          templateRule.Enable,
				Draft:           0,
				TemplateID:      templateRule.RuleID,
				CreatedAt:       createdTime,
				CreatedByUID:    userId,
				UpdatedAt:       createdTime,
				UpdatedByUID:    userId,
				DeletedAt:       0,
			}
			if templateRule.DimensionType != nil {
				rule.DimensionType = *templateRule.DimensionType
			}
			rules = append(rules, rule)
		}
		if templateRule.RuleLevel == explore_rule.RuleLevelField.Integer.Int32() {
			templateRuleMap[templateRule.RuleID] = templateRule
		}
	}

	fields, err := e.fieldRepo.GetFormViewFields(ctx, formViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
		return errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
	}
	for _, field := range fields {
		templateIds := explore_rule.ColTypeInternalRuleMap[constant.SimpleTypeMapping[field.DataType]]
		for _, templateId := range templateIds {
			rule := &model.ExploreRuleConfig{
				RuleName:        templateRuleMap[templateId].RuleName,
				RuleDescription: templateRuleMap[templateId].RuleDescription,
				RuleLevel:       templateRuleMap[templateId].RuleLevel,
				FormViewID:      formViewId,
				FieldID:         field.ID,
				Dimension:       templateRuleMap[templateId].Dimension,
				RuleConfig:      nil,
				Enable:          templateRuleMap[templateId].Enable,
				Draft:           0,
				TemplateID:      templateRuleMap[templateId].RuleID,
				CreatedAt:       createdTime,
				CreatedByUID:    userId,
				UpdatedAt:       createdTime,
				UpdatedByUID:    userId,
				DeletedAt:       0,
			}
			if templateRuleMap[templateId].DimensionType != nil {
				rule.DimensionType = *templateRuleMap[templateId].DimensionType
			}
			rules = append(rules, rule)
		}
	}

	if len(rules) > 0 {
		err = e.exploreRuleConfigRepo.BatchCreate(ctx, rules)
		if err != nil {
			return err
		}
	}
	return nil
}
