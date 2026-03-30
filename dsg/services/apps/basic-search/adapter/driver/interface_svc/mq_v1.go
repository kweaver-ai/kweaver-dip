package interface_svc

import (
	"context"
	"encoding/json"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/interface_svc"
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
}

type consumer struct {
	uc domain.UseCase
}

func NewConsumer(uc domain.UseCase) Consumer {
	return &consumer{uc: uc}
}

func (c *consumer) Index(ctx context.Context, msg *kafkax.Message) bool {
	var err error
	ctx, span := trace.StartConsumerSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	req := IndexMsg{}
	if err = json.Unmarshal(msg.Value, &req); err == nil {
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

type IndexMsg struct {
	Type string       `json:"type" binding:"required,oneof=create update delete"`
	Body IndexMsgBody `json:"body" binding:"required"`
}

type IndexMsgBody struct {
	DocID           string                `json:"docid"`
	ID              string                `json:"id"`
	Code            string                `json:"code"`
	Name            string                `json:"name"`
	Description     string                `json:"description"`
	DataOwnerName   string                `json:"data_owner_name"`
	DataOwnerID     string                `json:"data_owner_id"`
	UpdatedAt       int64                 `json:"updated_at"`
	OnlineAt        int64                 `json:"online_at"`
	PublishedAt     int64                 `json:"published_at"`
	Fields          []*es_common.Field    `json:"fields"` // 字段列表
	IsPublish       bool                  `json:"is_publish"`
	IsOnline        bool                  `json:"is_online"`
	CateInfo        []*es_common.CateInfo `json:"cate_info"`
	PublishedStatus string                `json:"published_status"`
	APIType         string                `json:"api_type"`
}

/*
	{
		"type":" update", # 消息类型 create | update | delete
		"body": { # 消息体
			"docid": "cfd27d77-3a50-4164-b2d3-a008345c07a3", # es docid，接口服务唯一标识
			"name": "string", # 接口服务名称
			"description": "string", # 接口服务描述
			"online_at": 1687xxxxxx, # 接口服务发布时间
			"updated_at": 1687xxxxxx, # 接口服务发布时间
			"orgcode": "cfd27d77-3a50-4164-b2d3-a008345c07a3", # 所属组织架构ID
			"orgname": "cfd27d77-3a50-4164-b2d3-a008345c07a3", # 所属组织架构名称
			"data_owner_name": "string", # 数据owner名称
			"data_owner_id": "cfd27d77-3a50-4164-b2d3-a008345c07a3", # 数据owner ID
		}
	}
*/

func (i *IndexMsg) validate() error {
	if err := form_validator.BindStructAndValid(i); err != nil {
		return err
	}
	return nil
}

func (i *IndexMsg) toIndexParam() *domain.IndexToESReqParam {

	return &domain.IndexToESReqParam{
		DocID:          i.Body.DocID,
		ID:             i.Body.ID,
		Name:           i.Body.Name,
		Code:           i.Body.Code,
		Description:    i.Body.Description,
		UpdatedAt:      i.Body.UpdatedAt,
		OnlineAt:       i.Body.OnlineAt,
		IsOnline:       i.Body.IsOnline,
		DataOwnerID:    i.Body.DataOwnerID,
		DataOwnerName:  i.Body.DataOwnerName,
		IsPublish:      i.Body.IsPublish,
		PublishedAt:    i.Body.OnlineAt,
		Fields:         i.Body.Fields,
		CateInfo:       i.Body.CateInfo,
		PubishedStatus: i.Body.PublishedStatus,
		APIType:        i.Body.APIType,
	}
}

func (i *IndexMsg) toDeleteParam() *domain.DeleteFromESReqParam {
	return &domain.DeleteFromESReqParam{
		ID: i.Body.DocID,
	}
}
