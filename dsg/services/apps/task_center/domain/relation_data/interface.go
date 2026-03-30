package relation_data

import (
	"context"
	"encoding/json"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type UserCase interface {
	Upsert(ctx context.Context, rs *RelationDataIncrementalModel) error
	QueryRelations(ctx context.Context, args *RelationDataQueryModel) ([]*RelationDataItem, error)
}
type UpsertRelation func(ctx context.Context, tx *gorm.DB, rs *model.TaskRelationsData) error

// RelationDataIncrementalModel 任务项目关联数据更新模型, 每次都是增量更新
type RelationDataIncrementalModel struct {
	BusinessModelId string   `json:"business_model_id" binding:"omitempty,uuid"` //主干业务的模型ID, 关联表单的时候必填
	TaskID          string   `json:"task_id"  binding:"required,uuid"`           //关联的任务ID
	ProjectID       string   `json:"-"`                                          //关联的项目ID
	TaskType        string   `json:"-"`                                          //任务类型
	IdsType         string   `json:"-"`                                          //关联的数据类型
	Ids             []string `json:"ids"  binding:"required,dive,uuid"`          //关联的数据列表
	Updater         string   `json:"-"`                                          //更新人的ID
	Cover           bool     `json:"cover"`                                      //是否覆盖
}

func (r RelationDataIncrementalModel) NewRelationData() *model.TaskRelationsData {
	m := make(map[string]interface{})
	m["ids_type"] = r.IdsType
	m["ids"] = r.Ids
	bts, _ := json.Marshal(m)
	return &model.TaskRelationsData{
		BusinessModelId: r.BusinessModelId,
		TaskID:          r.TaskID,
		ProjectID:       r.ProjectID,
		Data:            string(bts),
		UpdatedByUID:    r.Updater,
	}
}

type IDResp struct {
	ID string `json:"id"` //任务的ID
}

// RelationDataQueryModel 任务项目关联数据查询参数
type RelationDataQueryModel struct {
	TaskID    string `json:"task_id" form:"task_id" binding:"omitempty,uuid"`         //任务ID, 项目ID为空，该值必填
	ProjectID string `json:"project_id"   form:"project_id" binding:"omitempty,uuid"` //项目ID
}

// RelationDataDeleteModel 任务项目关联数据查询参数
type RelationDataDeleteModel struct {
	TaskID    string `json:"task_id" form:"task_id" binding:"required_without=ProjectID,omitempty,uuid"` //任务ID
	ProjectID string `json:"project_id"  form:"project_id" binding:"omitempty,uuid"`                     //项目ID
}

type RelationRow struct {
	ID   string `json:"id"`   //关联数据ID
	Name string `json:"name"` //关联数据的名称
}

type CommonRelationModel struct {
	IdsType string   `json:"ids_type"`
	Ids     []string `json:"ids"`
}

type RelationDataItem struct {
	BusinessModelID string   `json:"business_model_id"` //主干业务id
	TaskID          string   `json:"task_id"`           //任务ID
	ProjectID       string   `json:"project_id"`        //项目ID
	IdsType         string   `json:"ids_type"`          //关联的ID类型
	Ids             []string `json:"ids"`               //关联的数据
}

type RelationDataList struct {
	DomainId         uint64         `json:"domain_id,omitempty"`          //业务域id
	DomainName       string         `json:"domain_name,omitempty"`        //业务域名字
	BusinessModelID  string         `json:"business_model_id,omitempty"`  //主干业务id
	MainBusinessId   string         `json:"main_business_id"`             //主干业务ID
	MainBusinessName string         `json:"main_business_name,omitempty"` //主干业务名字
	TaskID           string         `json:"task_id,omitempty"`            //任务ID
	ProjectID        string         `json:"project_id,omitempty"`         //项目ID
	DataType         string         `json:"data_type"`                    //关联的ID类型
	Ids              []string       `json:"-"`
	Data             []*RelationRow `json:"data"` //关联数据结构体
}

// ParseData  解析关系json数据
func ParseData(dataStr string) (*CommonRelationModel, error) {
	content := new(CommonRelationModel)
	if err := json.Unmarshal([]byte(dataStr), content); err != nil {
		return content, errorcode.Detail(errorcode.RelationDataParseJsonError, err.Error())
	}
	return content, nil
}

// RelationDataCheckModel 任务项目关联数据更新模型, 每次都是全量更新
type RelationDataCheckModel struct {
	BusinessModelId string   `json:"business_model_id"  binding:"required,uuid"`                                                          //主干业务的模型ID, 关联表单的时候必填
	TaskID          string   `json:"task_id" form:"task_id" binding:"omitempty,uuid"`                                                     //关联的任务ID
	ProjectID       string   `json:"project_id"  form:"project_id" binding:"omitempty,uuid"`                                              //关联的项目ID
	TaskType        string   `json:"task_type"  form:"task_type" binding:"omitempty,oneof=standardization dataCollecting dataProcessing"` //任务类型，判断是否需要检查IDs
	IdsType         string   `json:"ids_type"`                                                                                            //关联的数据类型
	Ids             []string `json:"ids"  form:"ids" binding:"omitempty,gte=1,dive,uuid"`                                                 //关联的数据列表
}

// TaskRelationsDataDetail mapped from table <task_relations_data>
type TaskRelationsDataDetail struct {
	TaskID          string               `json:"task_id"`           // 任务ID
	ProjectID       string               `json:"project_id"`        // 项目ID
	BusinessModelId string               `json:"business_model_id"` //业务模型ID，或者业务流程ID
	Data            *CommonRelationModel `json:"data"`              // json类型字段, 关联数据详情
	UpdatedByUID    string               `json:"updated_by_uid"`    // 更新人id
	UpdatedAt       time.Time            `json:"updated_at"`        // 更新时间
}

func GenTaskRelationsDataDetail(relationData *model.TaskRelationsData, data *CommonRelationModel) *TaskRelationsDataDetail {
	return &TaskRelationsDataDetail{
		TaskID:          relationData.TaskID,
		ProjectID:       relationData.ProjectID,
		BusinessModelId: relationData.BusinessModelId,
		Data:            data,
		UpdatedAt:       relationData.UpdatedAt,
		UpdatedByUID:    relationData.UpdatedByUID,
	}
}
