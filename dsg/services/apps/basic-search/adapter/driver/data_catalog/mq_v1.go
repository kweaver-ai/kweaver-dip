package data_catalog

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

const (
	indexTypeCreate = "create"
	indexTypeUpdate = "update"
	indexTypeDelete = "delete"
)

type Consumer interface {
	Index(ctx context.Context, msg *kafkax.Message) bool
	UpdateTableRows(ctx context.Context, m *kafkax.Message) bool
}

type consumer struct {
	uc domain.UseCase
}

func NewConsumer(uc domain.UseCase) Consumer {
	return &consumer{uc: uc}
}

// Index 索引数据到ES
func (c *consumer) Index(ctx context.Context, msg *kafkax.Message) bool {
	var err error
	ctx, span := trace.StartConsumerSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	req := IndexMsg{}
	if err = json.Unmarshal(msg.Value, &req); err == nil {
		log.WithContext(ctx).Infof("入队的Msg, msg: %s", msg.Value)
		err = req.validate()
	}
	if err != nil {
		log.WithContext(ctx).Errorf("failed to handle msq, msq format err, topic: %v, key: %s, value: %s, err: %v", msg.Topic, msg.Key, msg.Value, err)
		return true // 丢弃消息
	}

	for {
		switch req.Type {
		case indexTypeCreate, indexTypeUpdate:
			_, err = c.uc.IndexToES(ctx, req.toIndexParam())

		case indexTypeDelete:
			_, err = c.uc.DeleteFromES(ctx, req.toDeleteParam())

		default:
			log.WithContext(ctx).Warnf("unsupported type, type: %v", req.Type)
			return true
		}

		if err != nil {
			log.WithContext(ctx).Errorf("failed to index to es, retry, err: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}
		return true
	}
}

// UpdateTableRows 更新ES中的数据量和数据更新时间
func (c *consumer) UpdateTableRows(ctx context.Context, m *kafkax.Message) bool {
	req := UpdateTableRowsMsq{}
	err := json.Unmarshal(m.Value, &req)
	if err == nil {
		err = req.validate()
	}
	if err != nil {
		log.WithContext(ctx).Errorf("failed to handle msq, msq format err, topic: %v, key: %s, value: %s, err: %v", m.Topic, m.Key, m.Value, err)
		return true // 丢弃消息
	}

	//if err = c.uc.UpdateTableRowsAndUpdatedAt(ctx, req.toParam()); err != nil {
	//	log.Errorf("failed to update table row to es, err: %v", err)
	//	return false
	//}
	log.WithContext(ctx).Infof("recv msg, but data-catalog no need to update, topic: %v, key: %s, value: %s", m.Topic, m.Key, m.Value)

	return true
}

type IndexMsg struct {
	Type string       `json:"type" binding:"required,oneof=create update delete"`
	Body IndexMsqBody `json:"body" binding:"required"`
}

type IndexMsqBody struct {
	DocId              string                            `json:"docid" binding:"required,max=256"`
	ID                 string                            `json:"id"`                                            // 目录id
	Code               string                            `json:"code"`                                          // 目录编码
	Name               string                            `json:"name"`                                          // 数据目录名称
	Description        string                            `json:"description,omitempty"`                         // 数据目录描述
	DataRange          int8                              `json:"data_range,omitempty"`                          // 数据范围
	UpdateCycle        int8                              `json:"update_cycle,omitempty"`                        // 更新频率
	SharedType         int8                              `json:"shared_type"`                                   // 共享条件
	PublishedAt        int64                             `json:"published_at"`                                  // 发布时间
	BusinessObjects    []*es_common.BusinessObjectEntity `json:"business_objects"`                              //主题域
	DataOwnerName      string                            `json:"data_owner_name"`                               // 数据Owner名称
	DataOwnerID        string                            `json:"data_owner_id"`                                 // 数据OwnerID
	MountDataResources []*es_common.MountDataResources   `json:"mount_data_resources"`                          // 挂接资源
	OnlineAt           int64                             `json:"online_at"`                                     // 上线时间
	UpdatedAt          int64                             `json:"updated_at,omitempty" binding:"omitempty,gt=0"` // 目录更新时间
	IsPublish          bool                              `json:"is_publish"`                                    // 是否发布
	IsOnline           bool                              `json:"is_online"`                                     // 是否上线
	CateInfo           []*es_common.CateInfo             `json:"cate_info"`                                     // 所属类目
	PublishedStatus    string                            `json:"published_status"`                              // 发布状态
	OnlineStatus       string                            `json:"online_status"`                                 // 上线状态
	Fields             []*es_common.Field                `json:"fields"`                                        // 字段列表
	// 数据更新时间
	DataUpdatedAt time.Time `json:"data_updated_at,omitempty"`
	// 申请量
	ApplyNum int `json:"apply_num,omitempty"`
}

func (i *IndexMsg) validate() error {
	if err := form_validator.BindStructAndValid(i); err != nil {
		return err
	}

	if i.Type == indexTypeCreate || i.Type == indexTypeUpdate {
		if checkNil(i.Body.Code, i.Body.ID, i.Body.Name) {
			return errors.New("params is required")
		}
	}

	return nil
}

func (i *IndexMsg) toIndexParam() *domain.IndexToESReqParam {

	return &domain.IndexToESReqParam{
		DocId:              i.Body.DocId,
		ID:                 i.Body.ID,
		Code:               i.Body.Code,
		Name:               i.Body.Name,
		Description:        i.Body.Description,
		DataRange:          i.Body.DataRange,
		UpdateCycle:        i.Body.UpdateCycle,
		SharedType:         i.Body.SharedType,
		UpdatedAt:          i.Body.UpdatedAt,
		PublishedAt:        i.Body.PublishedAt,
		BusinessObjects:    i.Body.BusinessObjects,
		DataOwnerName:      i.Body.DataOwnerName,
		DataOwnerID:        i.Body.DataOwnerID,
		MountDataResources: i.Body.MountDataResources,
		OnlineAt:           i.Body.OnlineAt,
		IsPublish:          i.Body.IsPublish,
		IsOnline:           i.Body.IsOnline,
		CateInfo:           i.Body.CateInfo,
		PublishedStatus:    i.Body.PublishedStatus,
		OnlineStatus:       i.Body.OnlineStatus,
		Fields:             i.Body.Fields,
		DataUpdatedAt:      i.Body.DataUpdatedAt.UnixMilli(),
		ApplyNum:           i.Body.ApplyNum,
	}
}

func (i *IndexMsg) toDeleteParam() *domain.DeleteFromESReqParam {
	return &domain.DeleteFromESReqParam{
		ID: i.Body.DocId,
	}
}

type UpdateTableRowsMsq struct {
	TableId   string `json:"table_id" binding:"required,max=36"`
	TableRows *int64 `json:"table_rows,omitempty" binding:"required_without=UpdatedAt,omitempty,gte=0"`
	UpdatedAt *int64 `json:"updated_at,omitempty" binding:"required_without=TableRows,omitempty,gte=0"`
}

func (m *UpdateTableRowsMsq) validate() error {
	if err := form_validator.BindStructAndValid(m); err != nil {
		return err
	}

	return nil
}

func (m *UpdateTableRowsMsq) toParam() *domain.UpdateTableRowsAndUpdatedAtReqParam {
	return &domain.UpdateTableRowsAndUpdatedAtReqParam{
		TableId:       m.TableId,
		TableRows:     m.TableRows,
		DataUpdatedAt: m.UpdatedAt,
	}
}

func checkNil(values ...any) bool {
	for _, v := range values {
		value := reflect.ValueOf(v)
		if value.Kind() != reflect.Pointer {
			continue
		}

		if value.IsNil() {
			return true
		}
	}

	return false
}
