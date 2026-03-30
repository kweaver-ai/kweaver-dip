package util

import (
	"context"
	"fmt"
	"runtime"
	"strings"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

func StartSpan(ctx context.Context) context.Context {
	pc, file, linkNo, ok := runtime.Caller(1)
	if !ok {
		log.WithContext(ctx).Error("start span error")
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
