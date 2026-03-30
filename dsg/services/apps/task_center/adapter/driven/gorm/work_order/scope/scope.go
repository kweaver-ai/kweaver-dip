package scope

import (
	"time"

	"github.com/samber/lo"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// Keyword 对指定字段做模糊匹配
func Keyword(value string, columns []string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(util.GormAnyColumnsContainKeyword(columns, value))
	}
}

// Type 限制工单类型
func Type(t int32) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{Type: t})
	}
}

// Status 限制工单状态
func Status(s int32) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{Status: s})
	}
}

// Statuses 限制工单状态
func Statuses(values []enum.IntegerType) func(*gorm.DB) *gorm.DB {
	_ = new(model.WorkOrder).Status // 用来标识 model.WorkOrder.Status 在这里被引用
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(clause.IN{
			Column: "status",
			Values: lo.ToAnySlice(lo.Map(values, func(v enum.IntegerType, _ int) int { return v.Int() })),
		})
	}
}

// StatusNot 限制工单不是指定的状态
func StatusNot(s int32) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Not(&model.WorkOrder{Status: s})
	}
}

// Priority 限制工单优先级
func Priority(p int32) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{Priority: p})
	}
}

// CreatedAtBetween 根据创建时间筛选
func CreatedAtBetween(s int64, f int64) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where("created_at between ? and ?", time.UnixMilli(s*1000), time.UnixMilli(f*1000))
	}
}

// AuditStatus 限制工单审核状态
func AuditStatus(s work_order.AuditStatus) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{AuditStatus: s.Integer.Int32()})
	}
}

// CreatedByUID 限制工单的创建人
func CreatedByUID(id string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{CreatedByUID: id})
	}
}

// ResponsibleUID 限制工单的责任人
func ResponsibleUID(id string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{ResponsibleUID: id})
	}
}

// SourceType 限制工单的来源类型
func SourceType(t int32) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{SourceType: t})
	}
}

// SourceID 限制工单的来源 ID
func SourceID(id string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{SourceID: id})
	}
}

// NodeID 限制工单所属项目流程节点 ID
func NodeID(id string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(&model.WorkOrder{NodeID: id})
	}
}

// NodeIDs 限制狗狗女单所属项目流程节点属于的指定节点列表
func NodeIDs(ids []string) func(*gorm.DB) *gorm.DB {
	return func(tx *gorm.DB) *gorm.DB {
		return tx.Where(clause.IN{
			Column: clause.Column{
				Name: "node_id",
			},
			Values: lo.ToAnySlice(ids),
		})
	}
}
