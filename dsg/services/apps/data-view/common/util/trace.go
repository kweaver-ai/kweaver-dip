package util

import (
	"fmt"
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"runtime"
	"strings"

	"context"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

func StartSpan(ctx context.Context) context.Context {
	pc, file, linkNo, ok := runtime.Caller(1)
	if !ok {
		log.Error("start span error")
	}
	funcPaths := strings.Split(runtime.FuncForPC(pc).Name(), "/")
	spanName := funcPaths[len(funcPaths)-1]
	newCtx, span := ar_trace.Tracer.Start(ctx, spanName)
	span.SetAttributes(attribute.String("func path", fmt.Sprintf("%s:%v", file, linkNo)))
	return newCtx
}

func End(ctx context.Context) {
	trace.SpanFromContext(ctx).End()
}

func SetAttributes(ctx context.Context, kv ...attribute.KeyValue) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(kv...)
}

func Span(ctx context.Context) trace.Span {
	return trace.SpanFromContext(ctx)
}
