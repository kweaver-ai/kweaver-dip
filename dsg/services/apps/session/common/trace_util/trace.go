package trace_util

import (
	"context"
	"fmt"
	"runtime"
	"strings"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

func StartSpan(ctx context.Context) (newCtx context.Context, span trace.Span) {
	pc, file, linkNo, ok := runtime.Caller(1)
	if ok {
		funcPaths := strings.Split(runtime.FuncForPC(pc).Name(), "/")
		spanName := funcPaths[len(funcPaths)-1]
		newCtx, span = ar_trace.Tracer.Start(ctx, spanName)
		span.SetAttributes(attribute.String("func path", fmt.Sprintf("%s:%v", file, linkNo)))
	} else {
		newCtx, span = ar_trace.Tracer.Start(ctx, "runtime.Caller failed")
	}

	return
}

func TranceMiddleware(ctx context.Context, spanName string, fn func(ctx context.Context)) {
	ctx, span := ar_trace.Tracer.Start(ctx, spanName)
	defer span.End()

	fn(ctx)

}
