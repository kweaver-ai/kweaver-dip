package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type messageType string

// supported message types
const (
	messageTypeAdded    messageType = "Added"
	messageTypeModified messageType = "Modified"
	messageTypeDeleted  messageType = "Deleted"
)

type objectSubView struct {
	// ID
	ID string `json:"id,omitempty" path:"id"`
	// 名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图的 ID
	LogicViewID string `json:"logic_view_id,omitempty"`
	// 子视图所属逻辑视图的名称
	LogicViewName string `json:"logic_view_name,omitempty"`
	// 子视图的列的名称列表，逗号分隔
	Columns string `json:"columns,omitempty"`
	// 行列配置详情，JSON 格式，与下载数据接口的过滤条件结构相同
	RowFilterClause string `json:"row_filter_clause,omitempty"`
}

func (s *subViewUseCase) newObjectSubView(ctx context.Context, sv *sub_view.SubView, fv *model.FormView) *objectSubView {
	var err error

	csv, _ := s.datasourceRepo.GetCatalogSchemaViewName(ctx, fv)

	osv := &objectSubView{
		ID:            sv.ID.String(),
		Name:          sv.Name,
		LogicViewID:   sv.LogicViewID.String(),
		LogicViewName: csv,
	}

	var detail sub_view.SubViewDetail
	if err = json.Unmarshal([]byte(sv.Detail), &detail); err != nil {
		log.Warn("unmarshal sub view detail fail", zap.Error(err), zap.String("detail", sv.Detail))
	}

	// 生成字段列表
	var fields []string
	for _, f := range detail.Fields {
		fields = append(fields, f.NameEn)
	}
	osv.Columns = strings.Join(fields, ",")

	fixedRangeClause := ""
	if detail.FixedRowFilters != nil {
		fixedRangeClause, err = generateWhereClause(detail.FixedRowFilters)
		if err != nil {
			log.Warn("generate sub view where clause fail", zap.Error(err), zap.Any("fixed_filters", detail.FixedRowFilters))
		}
	}
	// 生成过滤规则 WHERE 子句
	osv.RowFilterClause, err = generateWhereClause(&detail.RowFilters)
	if err != nil {
		log.Warn("generate sub view where clause fail", zap.Error(err), zap.Any("filters", detail.RowFilters))
	}
	if fixedRangeClause != "" {
		if osv.RowFilterClause == "" {
			osv.RowFilterClause = fixedRangeClause
		} else {
			osv.RowFilterClause = fmt.Sprintf("(%v and %v) ", fixedRangeClause, osv.RowFilterClause)
		}
	}
	return osv
}

type messageValue struct {
	Type messageType `json:"type,omitempty"`

	Object any `json:"object,omitempty"`
}

type message struct {
	Topic string
	Key   string        `json:"key,omitempty"`
	Value *messageValue `json:"value,omitempty"`
}

func (s *subViewUseCase) produceMessage(m *message) {
	valueJSON, err := json.Marshal(m.Value)
	if err != nil {
		log.Error("encode message's value fail", zap.Error(err), zap.Any("value", m.Value))
	}

	if err := s.kafkaPub.SyncProduce(m.Topic, []byte(m.Key), valueJSON); err != nil {
		log.Error("produce message fail", zap.Error(err), zap.String("topic", m.Topic), zap.String("key", m.Key), zap.Any("value", m.Value))
	}
}

func (s *subViewUseCase) produceMessageSubView(key string, value *messageValue) {
	s.produceMessage(&message{Topic: constant.TopicSubView, Key: key, Value: value})
}

func (s *subViewUseCase) produceMessageSubViewAdded(osv *objectSubView) {
	s.produceMessageSubView(osv.ID, &messageValue{Type: messageTypeAdded, Object: osv})
}

func (s *subViewUseCase) produceMessageSubViewDeleted(id uuid.UUID) {
	s.produceMessageSubView(id.String(), &messageValue{Type: messageTypeDeleted})
}

func (s *subViewUseCase) produceMessageSubViewModified(osv *objectSubView) {
	s.produceMessageSubView(osv.ID, &messageValue{Type: messageTypeModified, Object: osv})
}
