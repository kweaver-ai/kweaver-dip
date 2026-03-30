package main

import (
	"context"

	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-frame/core/transport"
)

type wrappedWorkflow struct {
	// underlying workflow interface
	wf workflow.WorkflowInterface
}

var _ transport.Server = &wrappedWorkflow{}

// Start implements transport.Server.
func (w *wrappedWorkflow) Start(context.Context) error {
	return w.wf.Start()
}

// Stop implements transport.Server.
func (w *wrappedWorkflow) Stop(context.Context) error {
	w.wf.Stop()
	return nil
}
