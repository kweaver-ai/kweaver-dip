package trace_util

import (
	"context"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"go.opentelemetry.io/otel/trace"
)

type spanCtxType int

const spanCtxKey spanCtxType = iota

func GetSpan(ctx context.Context) trace.Span {
	v := ctx.Value(spanCtxKey)
	if v == nil {
		return nil
	}

	if span, ok := v.(trace.Span); ok {
		return span
	}

	return nil
}

type A0R0Func func(context.Context)

func TraceA0R0(ctx context.Context, spanName string, f A0R0Func) {
	ctx, span := ar_trace.Tracer.Start(ctx, spanName)
	defer span.End()

	ctx = context.WithValue(ctx, spanCtxKey, span)

	f(ctx)
}

type A1R2Func[A1 any, R1 any, R2 any] func(context.Context, A1) (R1, R2)

func TraceA1R2[A1 any, R1 any, R2 any](ctx context.Context, spanName string, a1 A1, f A1R2Func[A1, R1, R2]) (R1, R2) {
	ctx, span := ar_trace.Tracer.Start(ctx, spanName)
	defer span.End()

	ctx = context.WithValue(ctx, spanCtxKey, span)

	return f(ctx, a1)
}

type A5R1Func[A1 any, A2 any, A3 any, A4 any, A5 any, R1 any] func(context.Context, A1, A2, A3, A4, A5) R1

func TraceA5R1[A1 any, A2 any, A3 any, A4 any, A5 any, R1 any](ctx context.Context, spanName string, a1 A1, a2 A2, a3 A3, a4 A4, a5 A5, f A5R1Func[A1, A2, A3, A4, A5, R1]) R1 {
	ctx, span := ar_trace.Tracer.Start(ctx, spanName)
	defer span.End()

	ctx = context.WithValue(ctx, spanCtxKey, span)

	return f(ctx, a1, a2, a3, a4, a5)
}
