package domain

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func Test_isTimeInDelta(t *testing.T) {
	loc, err := time.LoadLocation("Europe/Istanbul")
	if err != nil {
		t.Fatal(err)
	}

	type args struct {
		expected time.Time
		actual   time.Time
		delta    time.Duration
	}
	tests := []struct {
		name      string
		args      args
		assertion assert.BoolAssertionFunc
	}{
		{
			name: "小于下界",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 6, 59, 59, 999999999, loc),
				delta:    time.Hour,
			},
			assertion: assert.False,
		},
		{
			name: "等于下界",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 7, 0, 0, 0, loc),
				delta:    time.Hour,
			},
			assertion: assert.True,
		},
		{
			name: "大于下界",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 7, 0, 0, 1, loc),
				delta:    time.Hour,
			},
			assertion: assert.True,
		},
		{
			name: "相同时间",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
			},
			assertion: assert.True,
		},
		{
			name: "小于上界",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 8, 59, 59, 999999999, loc),
				delta:    time.Hour,
			},
			assertion: assert.True,
		},
		{
			name: "等于上界",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 9, 0, 0, 0, loc),
				delta:    time.Hour,
			},
			assertion: assert.True,
		},
		{
			name: "大于上界",
			args: args{
				expected: time.Date(1453, 5, 29, 8, 0, 0, 0, loc),
				actual:   time.Date(1453, 5, 29, 9, 0, 0, 1, loc),
				delta:    time.Hour,
			},
			assertion: assert.False,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertion(t, isTimeInDelta(tt.args.expected, tt.args.actual, tt.args.delta))
		})
	}
}
