package indicator

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/indicator"
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
	DocID                 string                `json:"docid"`
	ID                    string                `json:"id"`
	IndicatorType         string                `json:"indicator_type"`
	Code                  string                `json:"code"`
	Name                  string                `json:"name"`
	Description           string                `json:"description"`
	DataOwnerName         string                `json:"data_owner_name"`
	DataOwnerID           string                `json:"data_owner_id"`
	OrgCode               string                `json:"orgcode"`
	OrgName               string                `json:"orgname"`
	OrgNamePath           string                `json:"orgname_path"`
	SubjectDomainID       string                `json:"subject_domain_id"`
	SubjectDomainName     string                `json:"subject_domain_name"`
	SubjectDomainNamePath string                `json:"subject_domain_name_path"`
	UpdatedAt             int64                 `json:"updated_at"`
	OnlineAt              int64                 `json:"online_at"`
	PublishedAt           int64                 `json:"published_at"`
	Fields                []*es_common.Field    `json:"fields"` // 字段列表
	IsPublish             bool                  `json:"is_publish"`
	IsOnline              bool                  `json:"is_online"`
	CateInfo              []*es_common.CateInfo `json:"cate_info"`
	PublishedStatus       string                `json:"published_status"`
}

/*

 */

func (i *IndexMsg) validate() error {
	if err := form_validator.BindStructAndValid(i); err != nil {
		return err
	}
	return nil
}

func (i *IndexMsg) toIndexParam() *domain.IndexToESReqParam {

	subjectDomainID, orgCode := "unclassified", "unclassified"
	var orgName, orgNamePath, subjectDomainName, subjectDomainNamePath string

	// 以动态类目的格式存储，01 为组织架构，02 为信息系统，03 为主题域
	if i.Body.CateInfo != nil {
		for _, v := range i.Body.CateInfo {
			if v.CateID == "00000000-0000-0000-0000-000000000001" && v.NodeID != "" {
				orgCode = v.NodeID
				orgName = v.NodeName
				orgNamePath = v.NodePath
			}
			if v.CateID == "00000000-0000-0000-0000-000000000003" && v.NodeID != "" {
				subjectDomainID = v.NodeID
				subjectDomainName = v.NodeName
				subjectDomainNamePath = v.NodePath
			}
		}
	}

	return &domain.IndexToESReqParam{
		DocID:                 i.Body.DocID,
		ID:                    i.Body.ID,
		Code:                  i.Body.Code,
		Name:                  i.Body.Name,
		Description:           i.Body.Description,
		UpdatedAt:             i.Body.UpdatedAt,
		PublishedAt:           i.Body.PublishedAt,
		IsPublish:             i.Body.IsPublish,
		DataOwnerID:           i.Body.DataOwnerID,
		DataOwnerName:         i.Body.DataOwnerName,
		Fields:                i.Body.Fields,
		CateInfo:              i.Body.CateInfo,
		PubishedStatus:        i.Body.PublishedStatus,
		OrgCode:               orgCode,
		OrgName:               orgName,
		OrgNamePath:           orgNamePath,
		SubjectDomainID:       subjectDomainID,
		SubjectDomainName:     subjectDomainName,
		SubjectDomainNamePath: subjectDomainNamePath,
		OnlineAt:              i.Body.OnlineAt,
		IsOnline:              i.Body.IsOnline,
		IndicatorType:         i.Body.IndicatorType,
	}
}

func (i *IndexMsg) toDeleteParam() *domain.DeleteFromESReqParam {
	return &domain.DeleteFromESReqParam{
		ID: i.Body.DocID,
	}
}
