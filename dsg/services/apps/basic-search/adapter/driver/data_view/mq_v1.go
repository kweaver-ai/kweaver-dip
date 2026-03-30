package data_view

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_view"
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

	for _, field := range req.Body.Fields {
		fmt.Printf("中文字段名: %s, 英文字段名: %s\n", field.FieldNameZH, field.FieldNameEN)
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
			time.Sleep(2 * time.Second)
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
	NameEn          string                `json:"name_en"`
	Description     string                `json:"description"`
	DataOwnerName   string                `json:"data_owner_name"`
	DataOwnerID     string                `json:"data_owner_id"`
	OnlineAt        int64                 `json:"online_at"`
	UpdatedAt       int64                 `json:"updated_at"`
	PublishedAt     int64                 `json:"published_at"`
	Fields          []*es_common.Field    `json:"fields"` // 字段列表
	IsPublish       bool                  `json:"is_publish"`
	IsOnline        bool                  `json:"is_online"`
	CateInfo        []*es_common.CateInfo `json:"cate_info"`
	PublishedStatus string                `json:"published_status"`
}

/*
{
    "type": "create",
    "body": {
        "docid": "1d75a7d7-092f-45b6-a000-e6c83316d2a3",
        "id": "1d75a7d7-092f-45b6-a000-e6c83316d2a3",
        "name": "逻辑视图1",
		"name_en": "view_1",
        "code":"code1",
        "description":"逻辑视图1的描述内容",
        "data_owner_id": "e4265a4c-d6af-11ee-b05a-c2c446a63df9",
        "data_owner_name": "test",
        "online_at": 0,
        "updated_at": 1711444305279,
        "is_publish":true,
        "is_online":false,
        "published_at": 1711454305279,
        "published_status" :"published",
        "cate_info":[
            {
                "cate_id":"00000000-0000-0000-0000-000000000001",
                "node_id":"a41c0945-2e8c-4342-bcdd-2309b9d11100",
                "node_name":"研发1",
                "node_path":"组织/研发1"
            },
            {
                "cate_id":"00000000-0000-0000-0000-000000000002",
                "node_id":"151bcb65-48ce-4b62-973f-0bb6685f9cbb",
                "node_name":"组织架构节点名称2",
                "node_path":"组织架构全路径名称：xx部门/部门"
            }
        ],
        "fields" :[
            {
                "field_name_zh":"城市",
                "field_name_en":"city"
            },
            {
                "field_name_zh":"country",
                "field_name_en":"国家"
            }
        ]
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
		Code:           i.Body.Code,
		Name:           i.Body.Name,
		NameEn:         i.Body.NameEn,
		Description:    i.Body.Description,
		UpdatedAt:      i.Body.UpdatedAt,
		PublishedAt:    i.Body.PublishedAt,
		OnlineAt:       i.Body.OnlineAt,
		IsOnline:       i.Body.IsOnline,
		DataOwnerID:    i.Body.DataOwnerID,
		DataOwnerName:  i.Body.DataOwnerName,
		IsPublish:      i.Body.IsPublish,
		Fields:         i.Body.Fields,
		CateInfo:       i.Body.CateInfo,
		PubishedStatus: i.Body.PublishedStatus,
	}
}

func (i *IndexMsg) toDeleteParam() *domain.DeleteFromESReqParam {
	return &domain.DeleteFromESReqParam{
		ID: i.Body.DocID,
	}
}
