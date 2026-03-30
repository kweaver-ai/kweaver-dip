package util

import (
	"context"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.opentelemetry.io/otel/trace"
)

func TranceMiddleware(ctx context.Context, spanName string, fn func(ctx context.Context) error) {
	ctx, span := ar_trace.Tracer.Start(ctx, spanName, trace.WithSpanKind(trace.SpanKindInternal))
	err := fn(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
}

//valid, errs := TranceValidator(context.back(), "",1, form_validator.BindQueryAndValid)

func TranceValidator(ctx context.Context, spanName string, p1 interface{}, fn func(ctx context.Context, v interface{}) (bool, error)) (bool, error) {
	_, span := ar_trace.Tracer.Start(ctx, spanName)
	defer span.End()
	return fn(ctx, p1)
}

func TranceP1R2[P1 any, R1 any, R2 any](ctx context.Context, spanName string, p1 P1, fn func(context.Context, P1) (R1, R2)) (r1 R1, r2 R2) {
	ctx, span := ar_trace.Tracer.Start(ctx, spanName)
	defer span.End()
	return fn(ctx, p1)
}

func TranceP1R1(ctx context.Context, spanName string, fn func(ctx context.Context)) {

}
