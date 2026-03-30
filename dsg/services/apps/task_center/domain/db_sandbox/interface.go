package db_sandbox

import "context"

type UseCase interface {
	SandboxApply
	SandboxApplyAudit
	SandboxExecution
	SandboxSpace
	KafkaHandler
}

type KafkaHandler interface {
	HandlerDataPushMsg(ctx context.Context, dataSetInfo *SandboxDataSetInfo) error
}
