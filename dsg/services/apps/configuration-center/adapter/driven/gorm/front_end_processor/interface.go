package front_end_processor

import (
	"context"

	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
)

type Repository interface {
	// 创建
	Create(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error
	//创建前置库信息front_end信息保存
	CreateList(ctx context.Context, p []*configuration_center_v1.FrontEnd) error
	// 更新
	Update(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error

	UpdateStatusAndUpdatedAt(ctx context.Context, id string, status string) error
	// 新增批量更新方法
	UpdateList(ctx context.Context, ps []*configuration_center_v1.FrontEnd, id string) error
	//分配更新
	AllocateNodeNew(ctx context.Context, request *configuration_center_v1.FrontEndProcessorAllocationRequest, id string) error
	// 删除
	Delete(ctx context.Context, id string) error
	// 获取
	Get(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessor, error)
	// 根据 Apply ID 获取
	GetByApplyID(ctx context.Context, applyID string) (*configuration_center_v1.FrontEndProcessor, error)
	// 获取列表
	List(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorListOptions) (*configuration_center_v1.FrontEndProcessorList, error)

	// 新增方法：获取前置机相关的front_end信息
	GetFrontEndsByFrontEndProcessorID(ctx context.Context, frontEndProcessorID string) ([]*configuration_center_v1.FrontEnd, error)
	// 新增方法：获取前置机相关的front_library信息
	GetFrontEndLibrariesByFrontEndID(ctx context.Context, frontEndID string, frontEndItemID string) ([]*configuration_center_v1.FrontEndLibrary, error)

	// 重置所有 Phase =  Auditing 状态的 FrontEndProcessor 至 Pending
	ResetPhase(ctx context.Context) error

	// 概览
	Overview(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorsOverviewGetOptions) (*configuration_center_v1.FrontEndProcessorsOverview, error)

	// 根据 ID 获取前置机申请详情
	GetByID(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessor, error)

	GetApplyList(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorItemListOptions) (*configuration_center_v1.FrontEndProcessorItemList, error)

	//更新前置机申请状态
	UpdateRequest(ctx context.Context, id string, status string) error

	GetFrontItemIP(ctx context.Context, IP string) (bool, error)

	GetFrontEndLibraryName(ctx context.Context, name string, frontEndID string) (bool, error)
}
