package front_end_processor

import (
	"context"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
)

type UseCase interface {
	// 创建前置机
	Create(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error
	//创建前置机列表
	CreateList(ctx context.Context, p []*configuration_center_v1.FrontEnd) error
	//更新前置机
	UpdateList(ctx context.Context, p []*configuration_center_v1.FrontEnd, id string) error
	// 删除前置机
	Delete(ctx context.Context, id string) error
	// 更新前置机申请 Request
	UpdateRequest(ctx context.Context, id string, request *configuration_center_v1.FrontEndProcessor) error
	// 分配前置机节点
	AllocateNode(ctx context.Context, id string, node *configuration_center_v1.FrontEndProcessorNode) error
	// 分配前置节点变更后
	AllocateNodeNew(ctx context.Context, id string, node *configuration_center_v1.FrontEndProcessorAllocationRequest) error
	// 签收前置机
	Receipt(ctx context.Context, id string) error
	// 拒绝签收前置机
	Reject(ctx context.Context, id string, comment string) error
	// 回收前置机
	Reclaim(ctx context.Context, id string) error
	// 获取前置机列表
	List(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorListOptions) (*configuration_center_v1.AggregatedFrontEndProcessorList, error)
	// 获取前置机
	Get(ctx context.Context, id string) (*configuration_center_v1.AggregatedFrontEndProcessor, error)
	// 获取申请前置机列表
	GetApplyList(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorItemListOptions) (*configuration_center_v1.FrontEndProcessorItemList, error)
	// 获取前置机概览
	GetOverView(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorsOverviewGetOptions) (*configuration_center_v1.FrontEndProcessorsOverview, error)
	// 获取前置机申请详情
	GetApplyDetails(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessorDetail, error)
	// 获取审核员列表
	GetAuditList(ctx context.Context, req *configuration_center_v1.AuditListGetReq) (*configuration_center_v1.AuditListResp, error)
	// 撤销审核
	CancelAudit(ctx context.Context, id string) error
}
