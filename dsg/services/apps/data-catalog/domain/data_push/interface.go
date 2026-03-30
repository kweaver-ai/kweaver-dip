package data_push

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/samber/lo"
)

type UseCase interface {
	Create(ctx context.Context, req *CreateReq) (*response.IDNameResp, error)
	Update(ctx context.Context, req *UpdateReq) (*response.IDNameResp, error)
	BatchUpdateStatus(ctx context.Context, req *BatchUpdateStatusReq) ([]uint64, error)
	List(ctx context.Context, req *ListPageReq) (*response.PageResult[DataPushModelObject], error)
	ListSchedule(ctx context.Context, req *ListPageReq) (*response.PageResult[DataPushScheduleObject], error)
	QuerySandboxPushCount(ctx context.Context, req *QuerySandboxPushReq) (*QuerySandboxPushResp, error)
	Get(ctx context.Context, id uint64) (*DataPushModelDetail, error)
	Delete(ctx context.Context, id uint64) error
	History(ctx context.Context, req *TaskExecuteHistoryReq) (*LocalPageResult[TaskLogInfo], error)
	Execute(ctx context.Context, id uint64) error
	ScheduleCheck(req *ScheduleCheckReq) (string, error)
	Schedule(ctx context.Context, req *SchedulePlanReq) error
	Switch(ctx context.Context, req *SwitchReq) error
	Overview(ctx context.Context, req *OverviewReq) (*OverviewResp, error)
	AnnualStatistics(ctx context.Context) ([]*AnnualStatisticItem, error)
	AuditList(ctx context.Context, req *AuditListReq) (*response.PageResult[AuditListItem], error)
	Revocation(ctx context.Context, req *CommonIDReq) (err error)
}

type CreateReq struct {
	Name                string `json:"name" binding:"required,TrimSpace,max=128"`         // 数据推送模型名称
	Description         string `json:"description" binding:"TrimSpace,omitempty,max=300"` // 描述
	ResponsiblePersonID string `json:"responsible_person_id" binding:"required,uuid"`     // 责任人ID
	Channel             int32  `json:"channel" binding:"required,oneof=1 2 3"`            // 数据提供方法，1web 2share_apply 3catalog_report  不填默认是web

	PushStatus *int32 `json:"push_status" binding:"omitempty,oneof=0 1 2"` // 推送状态，不填默认是2
	//Operation  int32  `json:"operation"  binding:"required,oneof=1 2 3 4"`       // 操作,1发布审核，2变更审核，3停用审核，4启用审核

	SourceDataSourceID string                 `json:"-"`                                                                              // 来源表所在的数据源ID
	SourceTableID      string                 `json:"-"`                                                                              // 来源视图的UUID
	SourceTableName    string                 `json:"-"`                                                                              // 来源表名称
	SourceDepartmentID string                 `json:"-"`                                                                              // 来源视图的部门
	SourceCatalogID    models.ModelID         `json:"source_catalog_id" binding:"required"`                                           // 来源视图编目的数据目录ID，冗余字段
	TargetDatasourceID string                 `json:"target_datasource_id" binding:"required_without=TargetSandboxID,omitempty,uuid"` // 数据源（目标端）
	TargetSandboxID    string                 `json:"target_sandbox_id" binding:"required_without=TargetDatasourceID,omitempty,uuid"` // 沙箱ID
	TargetTableExists  *bool                  `json:"target_table_exists" binding:"required"`                                         // 目标表在本次推送是否存在，0不存在，1存在
	TargetTableName    string                 `json:"target_table_name"  binding:"required,max=255"`                                  // 目标表名称
	SyncModelFields    []*SyncModelCheckField `json:"sync_model_fields" binding:"required,min=1,dive"`                                // 同步模型选定的字段
	FilterCondition    string                 `json:"filter_condition"   binding:"omitempty"`                                         // 过滤表达式，SQL后面的where条件
	IsDesensitization  int32                  `json:"is_desensitization" binding:"omitempty"`                                         // 是否脱敏，0为否，1为是
	TransmitMode       int32                  `json:"transmit_mode" binding:"required,oneof=1 2"`                                     // 传输模式，1 增量 ; 2 全量
	IncrementField     string                 `json:"increment_field" binding:"TrimSpace,omitempty,max=128"`                          // 增量字段，当推送类型选择增量时，选一个字段作为增量字段，（技术名称）
	IncrementTimeStamp int64                  `json:"increment_timestamp" binding:"omitempty"`                                        // 增量时间戳值，单位毫秒；当推送类型选择增量时，该字段必填
	PrimaryKey         string                 `json:"primary_key" binding:"omitempty"`                                                // 主键，技术名称，当推送类型选择增量时，该字段必填

	ScheduleType  string `json:"schedule_type" binding:"required,oneof=ONCE PERIOD"` // 调度计划:once一次性,timely定时
	ScheduleTime  string `json:"schedule_time" binding:"omitempty,LocalDateTime"`    // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
	ScheduleStart string `json:"schedule_start" binding:"omitempty,LocalDate"`       // 计划开始日期, 格式 2006-01-02
	ScheduleEnd   string `json:"schedule_end" binding:"omitempty,LocalDate"`         // 计划结束日期, 格式 2006-01-02
	CrontabExpr   string `json:"crontab_expr" binding:"omitempty"`                   // linux crontab表达式, 5级
}

// GenDataPushModelFields  推送的字段
func (s *CreateReq) GenDataPushModelFields(modelID uint64) []*model.TDataPushField {
	fields := make([]*model.TDataPushField, 0, len(s.SyncModelFields))
	for _, syncModelField := range s.SyncModelFields {
		field := &model.TDataPushField{
			ModelID:               modelID,
			SourceTechName:        syncModelField.SourceTechName,
			TechnicalName:         syncModelField.TechnicalName,
			BusinessName:          syncModelField.BusinessName,
			DataType:              syncModelField.DataType,
			DataLength:            syncModelField.DataLength,
			DataAccuracy:          syncModelField.Precision,
			IsNullable:            syncModelField.IsNullable,
			Comment:               syncModelField.Comment,
			DesensitizationRuleId: syncModelField.DesensitizationRuleId,
		}
		fields = append(fields, field)
	}
	return fields
}

func (s *CreateReq) GenDataPushModel(ctx context.Context) *model.TDataPushModel {
	userInfo := request.GetUserInfo(ctx)
	dataPush := &model.TDataPushModel{}
	copier.Copy(dataPush, s)
	dataPush.ID = util.UniqueID()
	dataPush.DolphinWorkflowID = uuid.NewString()
	dataPush.SourceTableID = s.SourceTableID
	dataPush.SourceCatalogID = s.SourceCatalogID.Uint64()
	dataPush.SourceTableName = s.SourceTableName
	dataPush.SourceDatasourceUUID = s.SourceDataSourceID
	dataPush.TargetDatasourceUUID = s.TargetDatasourceID
	dataPush.SourceDepartmentID = s.SourceDepartmentID
	dataPush.TargetSandboxID = s.TargetSandboxID
	dataPush.IsDesensitization = s.IsDesensitization
	if s.TargetTableExists != nil && *s.TargetTableExists {
		dataPush.TargetTableExists = 1
	}
	//状态, 不填是待发布
	if s.PushStatus != nil {
		dataPush.PushStatus = *s.PushStatus
	} else {
		dataPush.PushStatus = constant.DataPushStatusWaiting.Integer.Int32()
	}
	//如果推送类型是增量，增量时间戳没有填写，默认给当前秒时间戳
	if s.TransmitMode == constant.TransmitModeInc.Integer.Int32() && s.IncrementTimeStamp <= 0 {
		s.IncrementTimeStamp = time.Now().Unix()
	}
	dataPush.AuditState = constant.AuditStatusUnaudited
	dataPush.Operation = constant.DataPushOperationPublish.Integer.Int32()
	//创建者等用户信息
	dataPush.CreatedAt = time.Now()
	dataPush.UpdatedAt = time.Now()
	dataPush.CreatorUID = userInfo.ID
	dataPush.CreatorName = userInfo.Name
	dataPush.UpdaterUID = userInfo.ID
	dataPush.UpdaterName = userInfo.Name
	dataPush.TargetTableName = s.TargetTableName
	return dataPush
}

type AdvancedParams struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type SyncModelCheckField struct {
	SourceTechName        string `json:"source_tech_name" binding:"required"`              // 来源表字段的技术名称
	BusinessName          string `json:"business_name" binding:"omitempty"`                // 来源字段的列业务名称，和目标字段公用
	TechnicalName         string `json:"technical_name" binding:"required"`                // 列技术名称
	PrimaryKey            bool   `json:"primary_key"`                                      // 是不是主键
	DataType              string `json:"data_type"  binding:"required"`                    // 数据类型
	DataLength            int32  `json:"data_length"`                                      // 数据长度
	Precision             *int32 `json:"precision"`                                        // 数据精度
	Comment               string `json:"comment"`                                          // 字段注释
	IsNullable            string `json:"is_nullable"`                                      // 是否为空
	DesensitizationRuleId string `json:"desensitization_rule_id" binding:"omitempty,uuid"` // 脱敏规则id
}

type SyncModelField struct {
	FieldID      string       `json:"field_id" binding:"required,uuid"` // 字段ID
	BusinessName string       `json:"business_name"`                    // 列业务名称
	SourceField  *SourceField `json:"source_field"`                     //来源字段信息
	//修改的字段
	PrimaryKey              int32  `json:"primary_key"`                                      // 是不是主键
	TechnicalName           string `json:"technical_name"`                                   // 列技术名称
	DataType                string `json:"data_type"`                                        // 数据类型
	DataLength              int32  `json:"data_length"`                                      // 数据长度
	Comment                 string `json:"comment"`                                          // 字段注释
	DesensitizationRuleId   string `json:"desensitization_rule_id" binding:"omitempty,uuid"` // 脱敏规则id
	DesensitizationRuleName string `json:"desensitization_rule_name"`                        // 脱敏规则名称
}

type SourceField struct {
	BusinessName  string `json:"business_name"`  // 列业务名称
	TechnicalName string `json:"technical_name"` // 列技术名称
	DataAccuracy  *int32 `json:"data_accuracy"`  // 数据精度（仅DECIMAL类型）
	IsNullable    string `json:"is_nullable"`    // 是否为空
	PrimaryKey    int32  `json:"primary_key"`    // 是不是主键
	DataType      string `json:"data_type"`      // 数据类型
	DataLength    int32  `json:"data_length"`    // 数据长度
	Comment       string `json:"comment"`        // 字段注释
}

type UpdateReq struct {
	ID                  models.ModelID `json:"id" uri:"id" query:"id" binding:"required"`
	Name                string         `json:"name" binding:"required,TrimSpace,max=128"`         // 数据推送模型名称
	Description         string         `json:"description" binding:"TrimSpace,omitempty,max=300"` // 描述
	ResponsiblePersonID string         `json:"responsible_person_id" binding:"required,uuid"`     // 责任人ID

	PushStatus *int32 `json:"push_status" binding:"omitempty,oneof=0 1 2 3 4 5 6"` // 推送状态，不填不修改
	//Operation  int32  `json:"operation"  binding:"required,oneof=2 3 4"`         // 操作,2变更审核，3停用审核，4启用审核

	SourceDataSourceUUID string                 `json:"-"`                                                                                // 来源表所在的数据源ID
	SourceTableID        string                 `json:"-"`                                                                                // 来源视图的UUID
	SourceTableName      string                 `json:"-"`                                                                                // 来源表名称
	SourceDepartmentID   string                 `json:"-"`                                                                                // 来源视图的部门
	SourceCatalogID      models.ModelID         `json:"source_catalog_id" binding:"required"`                                             // 来源视图编目的数据目录ID，冗余字段
	TargetDatasourceUUID string                 `json:"target_datasource_id" binding:"required_without=TargetSandboxID,omitempty,uuid"`   // 数据源（目标端）
	TargetSandboxID      string                 `json:"target_sandbox_id" binding:"required_without=TargetDatasourceUUID,omitempty,uuid"` // 沙箱ID
	TargetTableID        string                 `json:"target_table_id" binding:"omitempty,uuid"`                                         // 目标表ID，视图的ID
	TargetTableName      string                 `json:"target_table_name"  binding:"required,max=255"`                                    // 目标表名称
	SyncModelFields      []*SyncModelCheckField `json:"sync_model_fields" binding:"required,min=1,dive"`                                  // 同步模型选定的字段
	FilterCondition      string                 `json:"filter_condition"   binding:"omitempty"`                                           // 过滤表达式，SQL后面的where条件
	IsDesensitization    int32                  `json:"is_desensitization" binding:"omitempty"`                                           // 是否脱敏，0为否，1为是

	TransmitMode       int32  `json:"transmit_mode" binding:"required,oneof=1 2"`            // 传输模式，1 增量 ; 2 全量
	IncrementField     string `json:"increment_field" binding:"TrimSpace,omitempty,max=128"` // 增量字段，当推送类型选择增量时，选一个字段作为增量字段，（技术名称）
	IncrementTimeStamp int64  `json:"increment_timestamp" binding:"omitempty"`               // 增量时间戳值，单位毫秒；当推送类型选择增量时，该字段必填
	PrimaryKey         string `json:"primary_key" binding:"omitempty"`                       // 主键，技术名称，当推送类型选择增量时，该字段必填

	ScheduleType  string `json:"schedule_type" binding:"required,oneof=ONCE PERIOD"` // 调度计划:once一次性,timely定时
	ScheduleTime  string `json:"schedule_time" binding:"omitempty,LocalDateTime"`    // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
	ScheduleStart string `json:"schedule_start" binding:"omitempty,LocalDate"`       // 计划开始日期, 格式 2006-01-02
	ScheduleEnd   string `json:"schedule_end" binding:"omitempty,LocalDate"`         // 计划结束日期, 格式 2006-01-02
	CrontabExpr   string `json:"crontab_expr" binding:"omitempty"`                   // linux crontab表达式, 5级
}

func (u *UpdateReq) GenDataPushModel(ctx context.Context, oldPushModel *model.TDataPushModel) *model.TDataPushModel {
	userInfo := request.GetUserInfo(ctx)
	dataPush := &model.TDataPushModel{}
	copier.Copy(dataPush, u)
	dataPush.ID = u.ID.Uint64()
	dataPush.SourceTableID = u.SourceTableID
	dataPush.SourceTableName = u.SourceTableName
	dataPush.SourceDatasourceUUID = u.SourceDataSourceUUID
	dataPush.TargetDatasourceUUID = u.TargetDatasourceUUID
	dataPush.Operation = oldPushModel.Operation
	dataPush.SourceDepartmentID = u.SourceDepartmentID

	if u.PushStatus != nil {
		dataPush.PushStatus = *u.PushStatus
	} else {
		dataPush.AuditState = oldPushModel.AuditState
	}
	switch {
	//如果原来的是草稿，现在是待发布，那就是发布操作
	case oldPushModel.PushStatus <= constant.DataPushStatusDraft.Integer.Int32() &&
		dataPush.PushStatus == constant.DataPushStatusWaiting.Integer.Int32():
		dataPush.Operation = constant.DataPushOperationPublish.Integer.Int32()
		//如果推送状态没有变化：
	case oldPushModel.PushStatus == dataPush.PushStatus &&
		dataPush.PushStatus >= constant.DataPushStatusWaiting.Integer.Int32():
		if oldPushModel.AuditState == constant.AuditStatusPass {
			//是发布的才算变更操作，实际上该分支在当前需求下永远不会走到
			dataPush.Operation = constant.DataPushOperationChange.Integer.Int32()
		} else {
			dataPush.Operation = constant.DataPushOperationPublish.Integer.Int32()
		}
	}

	dataPush.SourceCatalogID = u.SourceCatalogID.Uint64()
	dataPush.Channel = oldPushModel.Channel

	dataPush.UpdaterUID = userInfo.ID
	dataPush.UpdaterName = userInfo.Name
	dataPush.UpdatedAt = time.Now()
	return dataPush
}

func (u *UpdateReq) GenDataPushModelFields() []*model.TDataPushField {
	fields := make([]*model.TDataPushField, 0, len(u.SyncModelFields))
	for _, syncModelField := range u.SyncModelFields {
		field := &model.TDataPushField{
			ModelID:               u.ID.Uint64(),
			SourceTechName:        syncModelField.SourceTechName,
			TechnicalName:         syncModelField.TechnicalName,
			BusinessName:          syncModelField.BusinessName,
			DataType:              syncModelField.DataType,
			DataLength:            syncModelField.DataLength,
			DataAccuracy:          syncModelField.Precision,
			IsNullable:            syncModelField.IsNullable,
			Comment:               syncModelField.Comment,
			DesensitizationRuleId: syncModelField.DesensitizationRuleId,
		}
		fields = append(fields, field)
	}
	return fields
}

type CommonIDReq struct {
	ID models.ModelID `json:"id" uri:"id" query:"id" binding:"required"`
}

type DataPushModelDetail struct {
	ID                    models.ModelID    `json:"id"`                      // 推送模型模型ID
	Name                  string            `json:"name"`                    // 数据推送模型名称
	Description           string            `json:"description"`             // 描述
	ResponsiblePersonID   string            `json:"responsible_person_id"`   // 责任人ID
	ResponsiblePersonName string            `json:"responsible_person_name"` // 责任人姓名
	SourceDetail          *SourceDetail     `json:"source_detail"`           // 源端详情
	TargetDetail          *TargetDetail     `json:"target_detail"`           // 目标端详情
	SyncModelFields       []*SyncModelField `json:"sync_model_fields"`       // 同步模型字段
	FilterCondition       string            `json:"filter_condition"  `      // 过滤表达式，SQL后面的where条件
	IsDesensitization     int32             `json:"is_desensitization"`      // 是否脱敏，0为否，1为是
	PushStatus            int32             `json:"push_status"`             // 推送状态，不填默认是1
	NextExecute           int64             `json:"next_execute"`            // 下一次的执行时间 毫秒
	RecentExecute         string            `json:"recent_execute"`          // 最近一次的执行时间 字符串
	RecentExecuteStatus   string            `json:"recent_execute_status"`   // 最近一次的执行结果 字符串

	TransmitMode       int    `json:"transmit_mode"`        // 传输模式(1 增量 ; 2 全量)
	IncrementField     string `json:"increment_field"`      // 当推送类型选择增量时，选一个字段作为增量字段，（技术名称）
	IncrementTimeStamp int64  `json:"increment_timestamp" ` // 源数据表中，增量字段的开始时间，用来标记具体增量的时间范围
	PrimaryKey         string `json:"primary_key"`          // 推送机制的主键

	SchedulePeriod string        `json:"schedule_period"` // 执行周期，分，时，日，天，周，月，年
	ScheduleType   string        `json:"schedule_type"`   // 调度计划类型:none一次性,timely定时
	ScheduleTime   string        `json:"schedule_time"`   // 定时时间，0立即执行，>0 定时
	ScheduleStart  string        `json:"schedule_start"`  // 计划开始日期, 时间戳, 秒
	ScheduleEnd    string        `json:"schedule_end"`    // 计划结束日期, 时间戳, 秒
	CrontabExpr    string        `json:"crontab_expr"`    // linux crontab表达式, 5级
	ScheduleDraft  *ScheduleBody `json:"schedule_draft"`  // 调度计划草稿

	CreatedAt   int64  `json:"created_at"`             // 创建时间戳, 毫秒
	CreatorUID  string `json:"creator_uid,omitempty"`  // 创建用户ID
	CreatorName string `json:"creator_name,omitempty"` // 创建用户名称
	UpdatedAt   int64  `json:"updated_at"`             // 更新时间戳, 毫秒
	UpdaterUID  string `json:"updater_uid,omitempty"`  // 更新用户ID
	UpdaterName string `json:"updater_name,omitempty"` // 更新用户名称
}

type SourceDetail struct {
	TableID            string                 `json:"table_id" `            // 来源表ID，视图的ID
	CatalogID          string                 `json:"catalog_id"`           // 来源视图编目的数据目录ID，冗余字段、
	CatalogName        string                 `json:"catalog_name"`         // 所属目录名称
	TableDisplayName   string                 `json:"table_display_name"`   // 来源表显示名称，视图的ID
	TableTechnicalName string                 `json:"table_technical_name"` // 来源表技术名称
	Encoding           string                 `json:"encoding"`             //	源端编码
	DBType             string                 `json:"db_type"`              //	源端数据库类型
	DepartmentID       string                 `json:"department_id"`        //	源端部门ID
	DepartmentName     string                 `json:"department_name"`      //	源端部门名称
	Fields             []*data_view.FieldsRes `json:"fields"`               // 来源表字段信息
}

type TargetDetail struct {
	TargetTableExists     bool   `json:"target_table_exists"`     // 目标表在本次推送是否存在，0不存在，1存在
	TableName             string `json:"target_table_name"`       // 目标表名称，也就是技术名称，没有业务名称
	DatasourceID          string `json:"target_datasource_id"`    // 数据源（目标端）
	DatasourceName        string `json:"target_datasource_name"`  // 数据源名称（目标端）
	DBType                string `json:"db_type"`                 // 源端数据库类型
	DepartmentID          string `json:"department_id"`           // 源端部门ID
	DepartmentName        string `json:"department_name"`         // 源端部门名称
	SourceType            int32  `json:"source_type"`             // 数据源类型
	SandboxProjectName    string `json:"sandbox_project_name"`    // 数据沙箱项目名称
	SandboxDatasourceName string `json:"sandbox_datasource_name"` // 数据沙箱数据源名称
	SandboxID             string `json:"sandbox_id"`              // 数据沙箱ID
}

type DataPushModelObject struct {
	ID                    string `json:"id"`                                                       // 推送模型模型ID
	Name                  string `json:"name" binding:"required,TrimSpace,max=128"`                // 数据推送模型名称
	Description           string `json:"description" binding:"TrimSpace,omitempty,max=300"`        // 描述
	ResponsiblePersonID   string `json:"responsible_person_id" binding:"required,uuid"`            // 责任人ID
	ResponsiblePersonName string `json:"responsible_person_name" binding:"required,uuid"`          // 责任人ID
	PushStatus            int32  `json:"push_status"`                                              // 推送状态
	AuditState            int32  `json:"audit_state"`                                              // 审核状态
	Operation             int32  `json:"operation"`                                                // 该模型的发布操作
	RecentExecute         string `json:"recent_execute"`                                           // 最近一次的执行时间 字符串
	RecentExecuteStatus   string `json:"recent_execute_status"`                                    // 最近一次的执行结果 字符串
	NextExecute           int64  `json:"next_execute"`                                             // 下一次的执行时间 毫秒
	CreateTime            int64  `json:"create_time"`                                              // 创建时间 毫秒
	ScheduleType          string `json:"schedule_type" binding:"required,verifyEnum=TransmitMode"` // 调度计划:none一次性,timely定时
	SchedulePeriod        string `json:"schedule_period"`                                          // 执行周期，分，时，日，天，周，月，年
	ScheduleTime          string `json:"schedule_time"`                                            // 定时时间，0立即执行，>0 定时
	ScheduleStart         string `json:"schedule_start"`                                           // 计划开始日期, 时间戳, 秒
	ScheduleEnd           string `json:"schedule_end"`                                             // 计划结束日期, 时间戳, 秒
	CrontabExpr           string `json:"crontab_expr"`                                             // linux crontab表达式, 5级
	CrontabExprDesc       string `json:"crontab_expr_desc"`                                        // linux crontab表达式, 5级  描述
	AuditAdvice           string `json:"audit_advice"`                                             // 审核意见
	PushError             string `json:"push_error"`                                               // 推送错误
}

type DataPushScheduleObject struct {
	ID                    string `json:"id"`                                                // 推送模型模型ID
	Name                  string `json:"name" binding:"required,TrimSpace,max=128"`         // 数据推送模型名称
	Description           string `json:"description" binding:"TrimSpace,omitempty,max=300"` // 描述
	ResponsiblePersonID   string `json:"responsible_person_id" binding:"required,uuid"`     // 责任人ID
	ResponsiblePersonName string `json:"responsible_person_name" binding:"required,uuid"`   // 责任人ID
	PushStatus            int32  `json:"push_status"`                                       // 推送状态
	Operation             int32  `json:"operation"`                                         // 该模型的发布操作
	SyncMethod            string `json:"sync_method"`                                       // 最后一次执行方式,工作流执行,手动执行
	SyncTime              int64  `json:"sync_time"`                                         // 最后一次执行的耗时,毫秒
	StartTime             string `json:"start_time"`                                        // 最近一次的执行开始时间 字符串
	EndTime               string `json:"end_time"`                                          // 最近一次的执行结束时间 字符串
	Status                string `json:"status"`                                            // 最近一次的执行结果 字符串
	SyncCount             int64  `json:"sync_count"`                                        // 最近一次推送总数
	ErrorMessage          string `json:"error_message"`                                     // 最近一次推送的错误信息
	SyncSuccessCount      int64  `json:"sync_success_count"`                                // 推送成功总数
	//下面信息是沙箱模式下才有的
	TargetTableName    string `json:"target_table_name"`    //目标表的名称
	CreatorID          string `json:"creator_id"`           //数据推送创建人ID
	CreatorName        string `json:"creator_name"`         //数据推送创建人名称
	PushError          string `json:"push_error"`           //推送报错信息
	SandboxProjectName string `json:"sandbox_project_name"` //数据沙箱项目数据
	DataCatalogName    string `json:"data_catalog_name"`    //数据目录名称
}

type QuerySandboxPushReq struct {
	AuthedSandboxID []string `json:"authed_sandbox_id" form:"authed_sandbox_id"` //沙箱ID
}

type QuerySandboxPushResp struct {
	Res map[string]int `json:"res" form:"res"` //沙箱ID
}

type ListPageReq struct {
	Status                 string            `json:"status" form:"status" binding:"omitempty"`                                                              // 根据状态筛选，多选
	StartTime              *int64            `json:"start_time" form:"start_time"  binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`       // 开始时间，毫秒时间戳
	EndTime                *int64            `json:"end_time" form:"end_time"   binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
	SourceDepartmentID     string            `json:"source_department_id" form:"source_department_id" binding:"omitempty,uuid"`                             // 来源部门ID
	SourceDepartmentIDPath []string          `json:"-"`                                                                                                     // 来源部门ID父级ID数组
	TargetDepartmentID     string            `json:"dest_department_id" form:"dest_department_id" binding:"omitempty,uuid"`                                 // 目标部门ID
	TargetDepartmentIDPath []string          `json:"-"`                                                                                                     // 目标部门ID父级ID数组
	WithSandboxInfo        bool              `json:"with_sandbox_info" form:"with_sandbox_info" binding:"omitempty"`                                        // 是否以沙箱形式展示
	AuthedSandboxID        []string          `json:"authed_sandbox_id" form:"authed_sandbox_id"`                                                            // 用户可以看到的沙箱ID数组
	AuthedSandboxDict      map[string]string //沙箱ID-项目名称字典
	request.PageInfoWithKeyword
}

type TaskExecuteHistoryReq struct {
	Direction       *string        `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`              // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort            *string        `json:"sort" form:"sort,default=updated_at" binding:"oneof=start_time end_time" default:"updated_at"` // 排序类型，枚举：updated_at：按更新时间排序。默认按创建时间排序
	Offset          *int           `json:"offset" form:"offset,default=1" binding:"min=1" default:"1" example:"1"`                       // 页码，默认1
	Limit           *int           `json:"limit" form:"limit,default=10" binding:"min=0,max=2000" default:"10" example:"2"`              // 每页大小，默认10 limit=0不分页
	Step            string         `json:"step" form:"step" binding:"omitempty"`                                                         //执行的,参考采集加工，传的是insert
	Status          string         `json:"status" form:"status" binding:"omitempty,oneof=SUCCESS FAILURE RUNNING_EXECUTION"`             //执行状态，成功，失败，执行中
	ScheduleExecute string         `json:"scheduleExecute" form:"scheduleExecute" binding:"omitempty,oneof=true false"`                  //执行方式，手动执行还是自动执行
	ModelUUID       models.ModelID `json:"model_uuid" form:"model_uuid" binding:"required"`                                              //推送模型的ID
}

type LocalPageResult[T any] struct {
	ID          string `json:"id"`                                               // 推送模型模型ID
	Name        string `json:"name" binding:"required,TrimSpace,max=128"`        // 数据推送模型名称
	NextExecute int64  `json:"next_execute"`                                     // 下一次的执行时间 毫秒
	Entries     []*T   `json:"entries" binding:"required"`                       // 对象列表
	TotalCount  int64  `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type TaskLogInfo struct {
	StartTime         string `json:"start_time"`          //请求时间
	EndTime           string `json:"end_time"`            //完成时间
	SyncCount         string `json:"sync_count"`          //推送总数
	SyncTime          string `json:"sync_time"`           //执行时间，单位，秒
	SyncMethod        string `json:"sync_method"`         //执行方式
	Status            string `json:"status"`              //状态
	StepName          string `json:"step_name"`           //步骤名称，uuid
	StepId            string `json:"step_id"`             //步骤ID，序号
	ProcessInstanceId string `json:"process_instance_id"` //处理实例ID
	ErrorMessage      string `json:"error_message"`       //错误信息
}

type SwitchReq struct {
	ID             models.ModelID        `json:"id" uri:"id" query:"id" binding:"required"`     // 推送主键ID
	ScheduleStatus int32                 `json:"schedule_status" binding:"omitempty,oneof=0 1"` // 推送状态，1启用，0禁用，不填默认是禁用
	Operation      int32                 `json:"-"`
	PushData       *model.TDataPushModel `json:"-"`
}

func (s *SwitchReq) InitOperation() {
	if s.ScheduleStatus == constant.ScheduleStatusOn.Integer.Int32() {
		s.Operation = constant.DataPushOperationRestart.Integer.Int32()
	} else {
		s.Operation = constant.DataPushOperationStop.Integer.Int32()
	}
}

// ScheduleCheckReq 调度计划检查请求
type ScheduleCheckReq struct {
	ScheduleType string `json:"schedule_type" binding:"omitempty,oneof=ONCE PERIOD"` // 调度计划:once一次性,timely定时
	ScheduleTime string `json:"schedule_time" binding:"omitempty,LocalDateTime"`     // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
	CrontabExpr  string `json:"crontab_expr" binding:"omitempty"`                    // linux crontab表达式, 6级
}

// SchedulePlanReq 调度计划请求
type SchedulePlanReq struct {
	ID            models.ModelID        `json:"id" uri:"id" query:"id" binding:"required"`           // 推送主键ID
	ScheduleType  string                `json:"schedule_type" binding:"omitempty,oneof=ONCE PERIOD"` // 调度计划:once一次性,timely定时
	ScheduleTime  string                `json:"schedule_time" binding:"omitempty,LocalDateTime"`     // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
	ScheduleStart string                `json:"schedule_start" binding:"omitempty,LocalDate"`        // 计划开始日期, 格式 2006-01-02
	ScheduleEnd   string                `json:"schedule_end" binding:"omitempty,LocalDate"`          // 计划结束日期, 格式 2006-01-02
	CrontabExpr   string                `json:"crontab_expr" binding:"omitempty,cron"`               // linux crontab表达式, 6级
	IsDraft       bool                  `json:"is_draft"`                                            // 是否是草稿
	PushData      *model.TDataPushModel `json:"-"`
}

func (s *SchedulePlanReq) encodeScheduleBody() string {
	body := &ScheduleBody{}
	copier.Copy(body, s)
	return string(lo.T2(json.Marshal(body)).A)
}

func GenSchedulePlanReq(pushData *model.TDataPushModel) *SchedulePlanReq {
	s := &SchedulePlanReq{
		PushData: pushData,
	}
	copier.Copy(s, s.PushData)
	return s
}

func UpdateSchedule(pushData *model.TDataPushModel) {
	if pushData.DraftSchedule.String == "" {
		return
	}
	s := ParserScheduleBody(pushData.DraftSchedule.String)
	pushData.ScheduleType = s.ScheduleType
	pushData.ScheduleTime = s.ScheduleTime
	pushData.ScheduleStart = s.ScheduleStart
	pushData.ScheduleEnd = s.ScheduleEnd
	pushData.CrontabExpr = s.CrontabExpr
}

func (s *SchedulePlanReq) SaveAsDraft(pushData *model.TDataPushModel) {
	pushData.DraftSchedule = sql.NullString{String: s.encodeScheduleBody(), Valid: true}
}

// ParserScheduleBody 解析调度计划草稿
func ParserScheduleBody(draft string) *ScheduleBody {
	if draft == "" {
		return nil
	}
	body := new(ScheduleBody)
	json.Unmarshal([]byte(draft), body)
	if body == new(ScheduleBody) {
		return nil
	}
	return body
}

// ScheduleBody  调度计划主要包含的信息
type ScheduleBody struct {
	ScheduleType  string `json:"schedule_type" binding:"omitempty,oneof=ONCE PERIOD"` // 调度计划:once一次性,timely定时
	ScheduleTime  string `json:"schedule_time" binding:"omitempty,LocalDateTime"`     // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
	ScheduleStart string `json:"schedule_start" binding:"omitempty,LocalDate"`        // 计划开始日期, 格式 2006-01-02
	ScheduleEnd   string `json:"schedule_end" binding:"omitempty,LocalDate"`          // 计划结束日期, 格式 2006-01-02
	CrontabExpr   string `json:"crontab_expr" binding:"omitempty,cron"`               // linux crontab表达式, 6级
}

type BatchUpdateStatusReq struct {
	ModelID []uint64 `json:"model_id" form:"model_id" binding:"required"`
}

//region  SingleSchedule

type DataPushScheduleReq struct {
	ID        string   `json:"id"  binding:"required"`                                                              // 某个推送的ID，必填
	Status    []string `json:"status" binding:"omitempty,dive,verifyEnum=DataPushStatus"`                           // 根据状态筛选，多选
	StartTime *int64   `json:"start_time" binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`        // 开始时间，毫秒时间戳
	EndTime   *int64   `json:"end_time" binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
	request.PageInfoWithKeyword
}

type DataPushScheduleResp struct {
	ID             string         `json:"id"`                                                // 推送模型模型ID
	Name           string         `json:"name" binding:"required,TrimSpace,max=128"`         // 数据推送模型名称
	Description    string         `json:"description" binding:"TrimSpace,omitempty,max=300"` // 描述
	NextExecute    int64          `json:"next_execute"`                                      // 下一次的执行时间 毫秒
	TaskExecuteLog []*TaskLogInfo `json:"task_execute_log"`                                  // 推送执行日志
}

//endregion

//region Overview

type OverviewReq struct {
	SourceDepartmentID []string `json:"source_department_id" form:"source_department_id"  binding:"omitempty" `                                // 来源端部门
	DestDepartmentID   string   `json:"dest_department_id"  form:"dest_department_id"  binding:"omitempty"`                                    // 目标端部门
	StartTime          *int64   `json:"start_time" form:"start_time"   binding:"omitempty,gte=0,ltfield=EndTime" example:"1682586655000"`      // 开始时间，毫秒时间戳
	EndTime            *int64   `json:"end_time" form:"end_time"   binding:"required_with=StartTime,omitempty,gte=0"  example:"1682586655000"` // 结束时间，毫秒时间戳
}

type OverviewResp struct {
	Total    int `gorm:"column:total" json:"total"`       //推送记录总数
	Auditing int `gorm:"column:auditing" json:"auditing"` //审核中
	Waiting  int `gorm:"column:waiting" json:"waiting"`   //待发布
	Starting int `gorm:"column:starting" json:"starting"` //未开始
	Going    int `gorm:"column:going" json:"going"`       //进行中
	Stopped  int `gorm:"column:stopped" json:"stopped"`   //已结束
	End      int `gorm:"column:end" json:"end"`           //已停用
}

//endregion

//region AnnualStatistic

type AnnualStatisticItem struct {
	Month string `gorm:"column:month" json:"month"` //月份
	Count any    `gorm:"column:count" json:"count"` //数量
}

// endregion

//region AuditList

type AuditListReq struct {
	Target string `form:"target" form:"target,default=tasks" binding:"oneof=tasks historys"` // 审核列表类型 tasks 待审核 historys 已审核
	request.PageInfo
}

type AuditListItem struct {
	DataPushID   string `json:"data_push_id"`   //数据推送的ID
	DataPushName string `json:"data_push_name"` //数据推送名称
	AuditCommonInfo
}

type AuditCommonInfo struct {
	ApplyCode      string `json:"apply_code"`      //审核code
	AuditType      string `json:"audit_type"`      //审核类型
	AuditStatus    string `json:"audit_status"`    //审核状态
	AuditTime      string `json:"audit_time"`      //审核时间，2006-01-02 15:04:05
	AuditOperation int    `json:"audit_operation"` //操作
	ApplierID      string `json:"applier_id"`      //申请人ID
	ProcInstID     string `json:"proc_inst_id"`    //审核实例ID
	ApplierName    string `json:"applier_name"`    //申请人名称
	ApplyTime      string `json:"apply_time"`      //申请时间
}

//endregion
