package elec_license

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/es_common"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/elec_license" // 电子证照目录
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
	// req,空索引消息 {type:,body:}
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
	log.WithContext(ctx).Infof("recv msg, but elec-license no need to update, topic: %v, key: %s, value: %s", m.Topic, m.Key, m.Value)

	return true
}

type IndexMsg struct {
	Type string       `json:"type" binding:"required,oneof=create update delete"`
	Body IndexMsqBody `json:"body" binding:"required"`
}

type IndexMsqBody struct {
	DocId                string             `json:"docid" binding:"required,max=256"`
	ID                   string             `json:"id"`                                            // 电子证照目录id
	Code                 string             `json:"code"`                                          // 电子证照目录编码
	Name                 string             `json:"name"`                                          // 电子证照目录名称
	UpdatedAt            int64              `json:"updated_at,omitempty" binding:"omitempty,gt=0"` // 电子证照目录更新时间
	OnlineAt             int64              `json:"online_at,omitempty" binding:"omitempty,gt=0"`  // 上线时间
	IsOnline             bool               `json:"is_online"`                                     // 是否上线
	OnlineStatus         string             `json:"online_status"`                                 // 上线状态
	Fields               []*es_common.Field `json:"fields" binding:"omitempty"`                    // 信息项列表
	LicenseType          string             `json:"license_type" binding:"omitempty"`              // 证件类型:证照
	CertificationLevel   string             `json:"certification_level" binding:"omitempty"`       // 发证级别
	HolderType           string             `json:"holder_type" binding:"omitempty"`               // 证照主体
	Expire               string             `json:"expire" binding:"omitempty"`                    // 有效期
	Department           string             `json:"department" binding:"omitempty"`                // 管理部门:xx市数据资源管理局
	IndustryDepartmentID string             `json:"industry_department_id" binding:"omitempty"`    // 行业类别id
	IndustryDepartment   string             `json:"industry_department" binding:"omitempty"`       // 行业类别:市场监督
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
		DocId:                i.Body.DocId,
		ID:                   i.Body.ID,
		Code:                 i.Body.Code,
		Name:                 i.Body.Name,
		UpdatedAt:            i.Body.UpdatedAt,
		OnlineAt:             i.Body.OnlineAt,
		IsOnline:             i.Body.IsOnline,
		OnlineStatus:         i.Body.OnlineStatus,
		Fields:               i.Body.Fields,
		LicenseType:          i.Body.LicenseType,
		CertificationLevel:   i.Body.CertificationLevel,
		HolderType:           i.Body.HolderType,
		Expire:               i.Body.Expire,
		Department:           i.Body.Department,
		IndustryDepartmentID: i.Body.IndustryDepartmentID,
		IndustryDepartment:   i.Body.IndustryDepartment,
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
