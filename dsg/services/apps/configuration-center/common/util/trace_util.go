package util

import (
	"context"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type A0R0Func func(context.Context)

func TraceA0R0(ctx context.Context, spanName string, f A0R0Func) {
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, nil) }()

	f(ctx)
}

type A0R2Func[R1 any] func(context.Context) (r1 R1, err error)

func TraceA0R2[R1 any](ctx context.Context, f A0R2Func[R1]) (r1 R1, err error) {
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	r1, err = f(ctx)
	return
}

type A1R2Func[A1 any, R1 any] func(context.Context, A1) (r1 R1, err error)

func TraceA1R2[A1 any, R1 any](ctx context.Context, a1 A1, f A1R2Func[A1, R1]) (r1 R1, err error) {
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	r1, err = f(ctx, a1)
	return
}

type A1R1Func[A1 any] func(context.Context, A1) (err error)

func TraceA1R1[A1 any](ctx context.Context, a1 A1, f A1R1Func[A1]) (err error) {
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	err = f(ctx, a1)
	return
}

type A2R2Func[A1 any, A2 any, R1 any] func(context.Context, A1, A2) (r1 R1, err error)

func TraceA2R2[A1 any, A2 any, R1 any](ctx context.Context, a1 A1, a2 A2, f A2R2Func[A1, A2, R1]) (r1 R1, err error) {
	ctx, span := af_trace.StartInternalSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	r1, err = f(ctx, a1, a2)
	return
}
