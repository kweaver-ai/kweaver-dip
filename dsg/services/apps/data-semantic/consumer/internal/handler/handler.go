// Package handler Kafka消息处理器
package handler

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/IBM/sarama"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/consumer/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_attributes_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/business_object_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_field_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/form_view_info_temp"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/data_understanding/kafka_message_log"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// DataUnderstandingHandler 数据理解消息处理器
type DataUnderstandingHandler struct {
	svcCtx *svc.ServiceContext
}

// NewDataUnderstandingHandler 创建消息处理器
func NewDataUnderstandingHandler(svcCtx *svc.ServiceContext) *DataUnderstandingHandler {
	return &DataUnderstandingHandler{svcCtx: svcCtx}
}

// AIResponse AI识别结果响应结构
type AIResponse struct {
	MessageId    string `json:"message_id"`
	FormViewId   string `json:"form_view_id"`
	RequestTime  string `json:"request_time"`
	ResponseType string `json:"response_type,omitempty"` // 消息类型: full_understanding, regenerate_business_objects
	Status       string `json:"status,omitempty"`        // 消息状态: success, failed
	// 表信息（全量生成时有值）
	TableSemantic *TableInfo `json:"table_semantic,omitempty"` // 兼容字段
	// 字段列表（全量生成时有值）
	FieldsSemantic []FieldInfo `json:"fields_semantic,omitempty"` // 兼容字段
	// 业务对象列表（全量生成和部分生成都有值）
	BusinessObjects []BusinessObjectInfo `json:"business_objects,omitempty"`
	// 未识别出属性的字段列表（AI未归入任何业务对象的字段）
	NoPatternFields []NoPatternFieldInfo `json:"no_pattern_fields,omitempty"`
	// 错误信息（失败时有值）
	Error *ErrorInfo `json:"error,omitempty"`
}

// ErrorInfo 错误信息
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// TableInfo 表信息
type TableInfo struct {
	TableBusinessName *string `json:"table_business_name,omitempty"`
	TableDescription  *string `json:"table_description,omitempty"`
}

// FieldInfo 字段信息
type FieldInfo struct {
	FormViewFieldId   string  `json:"form_view_field_id"`
	FieldTechName     string  `json:"field_tech_name"`
	FieldBusinessName *string `json:"field_business_name,omitempty"`
	FieldRole         *int8   `json:"field_role,omitempty"`
	FieldDescription  *string `json:"field_description,omitempty"`
}

// BusinessObjectInfo 业务对象信息
type BusinessObjectInfo struct {
	Id         string          `json:"id"`
	ObjectName string          `json:"object_name"`
	Attributes []AttributeInfo `json:"attributes,omitempty"`
}

// AttributeInfo 属性信息
type AttributeInfo struct {
	Id              string `json:"id"`
	AttrName        string `json:"attr_name"`
	FormViewFieldId string `json:"form_view_field_id"`
}

// NoPatternFieldInfo 未识别出属性的字段信息
type NoPatternFieldInfo struct {
	FormViewFieldId string `json:"form_view_field_id"`
}

// Handle 处理Kafka消息
func (h *DataUnderstandingHandler) Handle(ctx context.Context, message *sarama.ConsumerMessage) error {
	logx.Infof("收到Kafka消息: topic=%s partition=%d offset=%d",
		message.Topic, message.Partition, message.Offset)

	// 解析消息为固定结构
	var aiResp AIResponse
	if err := json.Unmarshal(message.Value, &aiResp); err != nil {
		logx.Errorf("解析消息失败（跳过）: %v", err)
		// 不可重试错误：记录失败日志后返回 nil（跳过消息）
		_ = h.recordFailure(ctx, "", "", fmt.Sprintf("解析消息失败: %v", err))
		return nil // 格式错误不会恢复，跳过消息
	}

	// 验证必填字段
	if aiResp.MessageId == "" {
		logx.Errorf("消息缺少 message_id 字段（跳过）")
		_ = h.recordFailure(ctx, "", aiResp.FormViewId, "消息缺少 message_id 字段")
		return nil
	}
	if aiResp.FormViewId == "" {
		logx.Errorf("消息缺少 form_view_id 字段（跳过）: message_id=%s", aiResp.MessageId)
		_ = h.recordFailure(ctx, aiResp.MessageId, "", "消息缺少 form_view_id 字段")
		return nil
	}

	// 幂等性检查：如果该消息已成功处理过，直接跳过（防止重复消费产生冗余数据）
	kafkaLogModel := kafka_message_log.NewKafkaMessageLogModelSqlx(h.svcCtx.DB)
	alreadyProcessed, err := kafkaLogModel.ExistsSuccessByMessageId(ctx, aiResp.MessageId)
	if err != nil {
		logx.WithContext(ctx).Errorf("幂等性检查失败: message_id=%s, error=%v", aiResp.MessageId, err)
		return err
	}
	if alreadyProcessed {
		logx.WithContext(ctx).Infof("消息已处理过，跳过: message_id=%s, form_view_id=%s", aiResp.MessageId, aiResp.FormViewId)
		return nil
	}

	isFailedMessage := aiResp.Status == "failed"

	// 在事务中处理：数据保存 + 状态更新 + 消息日志（使用 INSERT IGNORE 避免并发问题）
	err = h.svcCtx.DB.TransactCtx(ctx, func(ctx context.Context, session sqlx.Session) error {
		// 1. 根据消息状态处理
		if isFailedMessage {
			// 处理失败消息：记录失败日志 + 更新状态为 5（理解失败）
			return h.processFailedResponseInTx(ctx, session, &aiResp)
		}

		// 2. 处理成功响应（包括数据保存和状态更新）
		if err := h.processSuccessResponseInTx(ctx, session, &aiResp); err != nil {
			return err
		}

		// 3. 记录消息处理日志（使用 INSERT IGNORE 避免并发问题）
		kafkaMessageLogModel := kafka_message_log.NewKafkaMessageLogModelSession(session)
		if _, err := kafkaMessageLogModel.InsertSuccess(ctx, aiResp.MessageId, aiResp.FormViewId); err != nil {
			return fmt.Errorf("记录Kafka消息日志失败: %w", err)
		}

		return nil
	})

	if err != nil {
		// 记录失败日志
		_ = h.recordFailure(ctx, aiResp.MessageId, aiResp.FormViewId, err.Error())
		// 可重试错误（数据库/业务逻辑）：返回 error 让 Kafka 重投递
		return err
	}

	logx.WithContext(ctx).Infof("处理成功响应: message_id=%s, form_view_id=%s, type=%s",
		aiResp.MessageId, aiResp.FormViewId, aiResp.ResponseType)

	return nil
}

// processSuccessResponseInTx 处理成功响应（在事务中执行，包含状态更新）
func (h *DataUnderstandingHandler) processSuccessResponseInTx(ctx context.Context, session sqlx.Session, aiResp *AIResponse) error {
	// 判断消息类型：优先使用 response_type 字段判断
	isFullUnderstanding := h.isFullUnderstanding(aiResp)

	if isFullUnderstanding {
		// 1.1 获取表信息临时表版本号并保存表信息
		if aiResp.TableSemantic != nil {
			tableVersion, err := h.getTableVersionWithLock(ctx, session, aiResp.FormViewId)
			if err != nil {
				return fmt.Errorf("获取表信息版本号失败: %w", err)
			}
			logx.WithContext(ctx).Infof("全量生成表信息: form_view_id=%s, 新版本=%d", aiResp.FormViewId, tableVersion)
			if err := h.saveTableInfo(ctx, session, aiResp.FormViewId, tableVersion, aiResp.TableSemantic); err != nil {
				return fmt.Errorf("保存表信息失败: %w", err)
			}
		}

		// 1.2 获取字段信息临时表版本号并保存字段信息
		if len(aiResp.FieldsSemantic) > 0 {
			fieldVersion, err := h.getFieldVersionWithLock(ctx, session, aiResp.FormViewId)
			if err != nil {
				return fmt.Errorf("获取字段信息版本号失败: %w", err)
			}
			logx.WithContext(ctx).Infof("全量生成字段信息: form_view_id=%s, 新版本=%d", aiResp.FormViewId, fieldVersion)
			if err := h.saveFieldInfo(ctx, session, aiResp.FormViewId, fieldVersion, aiResp.FieldsSemantic); err != nil {
				return fmt.Errorf("保存字段信息失败: %w", err)
			}
		}
	}

	// 1.3 获取业务对象临时表版本号
	businessObjectVersion, err := h.getBusinessObjectVersionWithLock(ctx, session, aiResp.FormViewId)
	if err != nil {
		return fmt.Errorf("获取业务对象版本号失败: %w", err)
	}

	// 1.4 获取业务对象属性临时表版本号
	attributesVersion, err := h.getAttributesVersionWithLock(ctx, session, aiResp.FormViewId)
	if err != nil {
		return fmt.Errorf("获取业务对象属性版本号失败: %w", err)
	}

	if isFullUnderstanding {
		logx.WithContext(ctx).Infof("全量生成业务对象: form_view_id=%s, 对象版本=%d, 属性版本=%d", aiResp.FormViewId, businessObjectVersion, attributesVersion)
	} else {
		logx.WithContext(ctx).Infof("重新识别业务对象: form_view_id=%s, 对象版本=%d, 属性版本=%d", aiResp.FormViewId, businessObjectVersion, attributesVersion)
	}

	// 1.6 保存业务对象到临时表（包括未识别出属性的字段）
	if len(aiResp.BusinessObjects) > 0 || len(aiResp.NoPatternFields) > 0 {
		if err := h.saveBusinessObjects(ctx, session, aiResp.FormViewId, businessObjectVersion, attributesVersion, aiResp.BusinessObjects, aiResp.NoPatternFields); err != nil {
			return fmt.Errorf("保存业务对象失败: %w", err)
		}
	}

	// 1.7 更新 in_use 状态：新版本设置为 1，历史版本设置为 0
	if err := h.updateInUseForNewVersion(ctx, session, aiResp.FormViewId, businessObjectVersion, attributesVersion); err != nil {
		return fmt.Errorf("更新 in_use 状态失败: %w", err)
	}

	// 1.8 更新 form_view 状态为 2（待确认）- 在事务中执行
	formViewModel := form_view.NewFormViewModelSession(session)
	if err := formViewModel.UpdateUnderstandStatus(ctx, aiResp.FormViewId, form_view.StatusPendingConfirm); err != nil {
		return fmt.Errorf("更新form_view状态失败: %w", err)
	}

	return nil
}

// processFailedResponseInTx 处理失败响应（在事务中执行，包含状态更新）
func (h *DataUnderstandingHandler) processFailedResponseInTx(ctx context.Context, session sqlx.Session, aiResp *AIResponse) error {
	// 构建错误信息
	errMsg := "AI 服务处理失败"
	if aiResp.Error != nil {
		errMsg = fmt.Sprintf("%s: %s", aiResp.Error.Code, aiResp.Error.Message)
	}

	logx.WithContext(ctx).Errorf("处理失败消息: message_id=%s, form_view_id=%s, error=%s",
		aiResp.MessageId, aiResp.FormViewId, errMsg)

	// 记录失败日志到 kafka_message_log
	kafkaMessageLogModel := kafka_message_log.NewKafkaMessageLogModelSession(session)
	if _, err := kafkaMessageLogModel.InsertFailure(ctx, aiResp.MessageId, aiResp.FormViewId, errMsg); err != nil {
		return fmt.Errorf("记录Kafka消息失败日志失败: %w", err)
	}

	// 更新 form_view 状态为 5（理解失败）
	formViewModel := form_view.NewFormViewModelSession(session)
	if err := formViewModel.UpdateUnderstandStatus(ctx, aiResp.FormViewId, form_view.StatusFailed); err != nil {
		return fmt.Errorf("更新form_view状态为理解失败失败: %w", err)
	}

	return nil
}

// isFullUnderstanding 判断是否为全量生成
func (h *DataUnderstandingHandler) isFullUnderstanding(aiResp *AIResponse) bool {
	// 优先使用 response_type 字段判断
	switch aiResp.ResponseType {
	case "regenerate_business_objects":
		return false
	case "full_understanding":
		return true
	}

	// 兼容旧逻辑：如果有表信息或字段信息，则认为是全量生成
	return aiResp.TableSemantic != nil || len(aiResp.FieldsSemantic) > 0
}

// getTableVersionWithLock 获取表信息临时表的下一个版本号（使用行锁防止并发冲突）
func (h *DataUnderstandingHandler) getTableVersionWithLock(ctx context.Context, session sqlx.Session, formViewId string) (int, error) {
	formViewInfoTempModel := form_view_info_temp.NewFormViewInfoTempModelSession(session)
	latestVersion, err := formViewInfoTempModel.FindLatestVersionWithLock(ctx, formViewId)
	if err != nil {
		return 0, err
	}
	return latestVersion + 1, nil
}

// getFieldVersionWithLock 获取字段信息临时表的下一个版本号（使用行锁防止并发冲突）
func (h *DataUnderstandingHandler) getFieldVersionWithLock(ctx context.Context, session sqlx.Session, formViewId string) (int, error) {
	formViewFieldInfoTempModel := form_view_field_info_temp.NewFormViewFieldInfoTempModelSession(session)
	latestVersion, err := formViewFieldInfoTempModel.FindLatestVersionWithLock(ctx, formViewId)
	if err != nil {
		return 0, err
	}
	return latestVersion + 1, nil
}

// getBusinessObjectVersionWithLock 获取业务对象临时表的下一个版本号（使用行锁防止并发冲突）
func (h *DataUnderstandingHandler) getBusinessObjectVersionWithLock(ctx context.Context, session sqlx.Session, formViewId string) (int, error) {
	businessObjectTempModel := business_object_temp.NewBusinessObjectTempModelSession(session)
	latestVersion, err := businessObjectTempModel.FindLatestVersionWithLock(ctx, formViewId)
	if err != nil {
		return 0, err
	}
	return latestVersion + 1, nil
}

// getAttributesVersionWithLock 获取业务对象属性临时表的下一个版本号（使用行锁防止并发冲突）
func (h *DataUnderstandingHandler) getAttributesVersionWithLock(ctx context.Context, session sqlx.Session, formViewId string) (int, error) {
	businessObjectAttrTempModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSession(session)
	latestVersion, err := businessObjectAttrTempModel.FindLatestVersionWithLock(ctx, formViewId)
	if err != nil {
		return 0, err
	}
	return latestVersion + 1, nil
}

// saveTableInfo 保存表信息到临时表（直接插入）
func (h *DataUnderstandingHandler) saveTableInfo(ctx context.Context, session sqlx.Session, formViewId string, version int, tableInfo *TableInfo) error {
	formViewInfoTempModel := form_view_info_temp.NewFormViewInfoTempModelSession(session)

	// 直接插入新版本数据
	data := &form_view_info_temp.FormViewInfoTemp{
		Id:                uuid.New().String(),
		FormViewId:        formViewId,
		Version:           version,
		TableBusinessName: tableInfo.TableBusinessName,
		TableDescription:  tableInfo.TableDescription,
	}
	if _, err := formViewInfoTempModel.Insert(ctx, data); err != nil {
		return fmt.Errorf("插入表信息失败: %w", err)
	}

	return nil
}

// saveFieldInfo 保存字段信息到临时表（直接插入）
func (h *DataUnderstandingHandler) saveFieldInfo(ctx context.Context, session sqlx.Session, formViewId string, version int, fields []FieldInfo) error {
	formViewFieldInfoTempModel := form_view_field_info_temp.NewFormViewFieldInfoTempModelSession(session)

	for _, field := range fields {
		// 直接插入新版本数据
		data := &form_view_field_info_temp.FormViewFieldInfoTemp{
			Id:                uuid.New().String(),
			FormViewId:        formViewId,
			FormViewFieldId:   field.FormViewFieldId,
			Version:           version,
			FieldBusinessName: field.FieldBusinessName,
			FieldRole:         field.FieldRole,
			FieldDescription:  field.FieldDescription,
		}
		if _, err := formViewFieldInfoTempModel.Insert(ctx, data); err != nil {
			return fmt.Errorf("插入字段信息失败: %w", err)
		}
	}

	return nil
}

// saveBusinessObjects 保存业务对象到临时表（直接插入，使用 UUID 作为 ID）
// 规则：只有有属性的业务对象才会被保存
func (h *DataUnderstandingHandler) saveBusinessObjects(ctx context.Context, session sqlx.Session, formViewId string, objectVersion int, attrVersion int, objects []BusinessObjectInfo, noPatternFields []NoPatternFieldInfo) error {
	businessObjectTempModel := business_object_temp.NewBusinessObjectTempModelSession(session)
	businessObjectAttrTempModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSession(session)

	// 对业务对象按 object_name 去重（防止 AI 返回重复对象导致唯一键冲突）
	uniqueObjects := make(map[string]*BusinessObjectInfo) // key: object_name
	for i := range objects {
		obj := &objects[i]
		// 合并属性：如果对象名相同，将属性合并到第一个对象
		if existing, exists := uniqueObjects[obj.ObjectName]; exists {
			// 追加属性到已存在的对象
			existing.Attributes = append(existing.Attributes, obj.Attributes...)
		} else {
			// 新对象，直接添加
			uniqueObjects[obj.ObjectName] = obj
		}
	}

	logx.WithContext(ctx).Infof("业务对象去重: 原始数量=%d, 去重后=%d", len(objects), len(uniqueObjects))

	savedObjectCount := 0
	for _, obj := range uniqueObjects {
		// 处理属性（对属性也按 form_view_field_id 去重）
		uniqueAttrs := make(map[string]*AttributeInfo) // key: form_view_field_id
		for i := range obj.Attributes {
			attr := &obj.Attributes[i]
			if existing, exists := uniqueAttrs[attr.FormViewFieldId]; exists {
				// 同一字段有多个属性，保留 attr_name 非空的
				if attr.AttrName != "" && (existing.AttrName == "" || len(attr.AttrName) < len(existing.AttrName)) {
					uniqueAttrs[attr.FormViewFieldId] = attr
				}
			} else {
				uniqueAttrs[attr.FormViewFieldId] = attr
			}
		}

		// 只有当业务对象有属性时才保存
		if len(uniqueAttrs) == 0 {
			logx.WithContext(ctx).Infof("跳过没有属性的业务对象: object_name=%s", obj.ObjectName)
			continue
		}

		savedObjectCount++
		// 1. 生成新的业务对象 ID
		businessObjectId := uuid.New().String()

		// 2. 插入新版本业务对象
		objectData := &business_object_temp.BusinessObjectTemp{
			Id:         businessObjectId,
			FormViewId: formViewId,
			InUse:      0, // 初始为 0，后续由 UpdateInUse 统一设置
			Version:    objectVersion,
			ObjectName: obj.ObjectName,
		}
		if _, err := businessObjectTempModel.Insert(ctx, objectData); err != nil {
			return fmt.Errorf("插入业务对象失败: %w", err)
		}

		for _, attr := range uniqueAttrs {
			// 生成新的属性 ID
			attrId := uuid.New().String()

			// 插入新版本属性
			attrData := &business_object_attributes_temp.BusinessObjectAttributesTemp{
				Id:               attrId,
				FormViewId:       formViewId,
				InUse:            0, // 初始为 0，后续由 UpdateInUse 统一设置
				BusinessObjectId: businessObjectId,
				Version:          attrVersion,
				FormViewFieldId:  attr.FormViewFieldId,
				AttrName:         attr.AttrName,
			}
			if _, err := businessObjectAttrTempModel.Insert(ctx, attrData); err != nil {
				return fmt.Errorf("插入属性失败: %w", err)
			}
		}
	}

	logx.WithContext(ctx).Infof("业务对象保存完成: 有效对象数=%d (跳过无属性对象=%d)", savedObjectCount, len(uniqueObjects)-savedObjectCount)

	// 3. 处理未识别出属性的字段（business_object_id 为空，attr_name 为空）
	for _, field := range noPatternFields {
		// 生成新的属性 ID
		attrId := uuid.New().String()

		// 插入属性记录，business_object_id 和 attr_name 均为空
		attrData := &business_object_attributes_temp.BusinessObjectAttributesTemp{
			Id:               attrId,
			FormViewId:       formViewId,
			InUse:            0, // 初始为 0，后续由 UpdateInUse 统一设置
			BusinessObjectId: "", // AI未识别出归属
			Version:          attrVersion,
			FormViewFieldId:  field.FormViewFieldId,
			AttrName:         "", // 未识别出属性，attr_name 为空
		}
		if _, err := businessObjectAttrTempModel.Insert(ctx, attrData); err != nil {
			return fmt.Errorf("插入未识别字段属性失败: %w", err)
		}
	}

	return nil
}

// updateInUseForNewVersion 更新 in_use 状态：新版本设置为 1，历史版本设置为 0
func (h *DataUnderstandingHandler) updateInUseForNewVersion(ctx context.Context, session sqlx.Session, formViewId string, objectVersion, attrVersion int) error {
	businessObjectTempModel := business_object_temp.NewBusinessObjectTempModelSession(session)
	businessObjectAttrTempModel := business_object_attributes_temp.NewBusinessObjectAttributesTempModelSession(session)

	// 更新业务对象临时表的 in_use 状态
	if err := businessObjectTempModel.UpdateInUse(ctx, formViewId, objectVersion); err != nil {
		return fmt.Errorf("更新业务对象 in_use 状态失败: %w", err)
	}

	// 更新属性临时表的 in_use 状态
	if err := businessObjectAttrTempModel.UpdateInUse(ctx, formViewId, attrVersion); err != nil {
		return fmt.Errorf("更新属性 in_use 状态失败: %w", err)
	}

	logx.WithContext(ctx).Infof("Updated in_use status: form_view_id=%s, object_version=%d, attr_version=%d",
		formViewId, objectVersion, attrVersion)

	return nil
}

// recordFailure 记录处理失败
func (h *DataUnderstandingHandler) recordFailure(ctx context.Context, messageId, formViewId, errMsg string) error {
	// 记录结构化日志
	logx.Errorf("Kafka消息处理失败: message_id=%s, form_view_id=%s, error=%s",
		messageId, formViewId, errMsg)

	// 记录到 t_kafka_message_log
	kafkaMessageLogModel := kafka_message_log.NewKafkaMessageLogModelSqlx(h.svcCtx.DB)
	if _, err := kafkaMessageLogModel.InsertFailure(ctx, messageId, formViewId, errMsg); err != nil {
		logx.Errorf("记录Kafka消息失败日志失败: %v", err)
	}

	return nil
}
