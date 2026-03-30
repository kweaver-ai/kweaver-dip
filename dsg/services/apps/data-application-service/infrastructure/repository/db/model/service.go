package model

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"

// ServiceAssociations 接口表的多表关联关系
type ServiceAssociations struct {
	Service
	Developer              Developer               `gorm:"foreignKey:developer_id;references:developer_id"`
	File                   File                    `gorm:"foreignKey:file_id;references:file_id"`
	ServiceDataSource      ServiceDataSource       `gorm:"foreignKey:service_id;references:service_id"`
	ServiceScriptModel     ServiceScriptModel      `gorm:"foreignKey:service_id;references:service_id"`
	ServiceStatsInfo       ServiceStatsInfo        `gorm:"foreignKey:service_id;references:service_id"`
	ServiceParams          []ServiceParam          `gorm:"foreignKey:service_id;references:service_id"`
	ServiceResponseFilters []ServiceResponseFilter `gorm:"foreignKey:service_id;references:service_id"`
	//逻辑视图及其子视图（行列规则）的权限规则
	Policies []*dto.SubjectObjectsResEntity `json:"policies,omitempty" gorm:"-"`
}

// ServiceStatsAssociations 接口统计信息表的关联关系
type ServiceStatsAssociations struct {
	ServiceStatsInfo
	Service
}

// ServiceApplyAssociations 接口申请表的关联关系
type ServiceApplyAssociations struct {
	ServiceApply
	App     App     `gorm:"foreignKey:uid;references:uid"`
	Service Service `gorm:"foreignKey:service_id;references:service_id"`
}

type DomainServiceRelation struct {
	SubjectDomainID    string `json:"subject_domain_id" gorm:"column:subject_domain_id"`        //主题域ID
	RelationServiceNum int64  `json:"relation_service_num"  gorm:"column:relation_service_num"` //该主题域ID下关联的Service的数量
}
