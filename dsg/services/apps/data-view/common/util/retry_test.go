package util

import (
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestRetryOnError(t *testing.T) {
	clock = NewFakeClock(time.Now())

	var newFunc = func(errs ...error) func() error {
		var index = 0
		return func() error {
			var err error
			if index < len(errs) {
				err = errs[index]
				index++
			} else {
				t.Fatal("out of index")
			}
			t.Logf("%v, index=%v, err=%v", clock.Now().Format(time.RFC3339), index, err)
			return err
		}
	}

	var errFake0 = errors.New("fake error: 0")
	var errFake1 = errors.New("fake error: 1")
	var isErrFake0 = func(err error) bool { return errors.Is(err, errFake0) }

	tests := []struct {
		name string
		err  error
	}{
		{
			err: errFake1,
		},
		{
			err: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// errs: []error{errFake0, errFake0 ..., tt.err}
			var errs []error
			for i := 0; i < 4; i++ {
				errs = append(errs, errFake0)
			}
			errs = append(errs, tt.err)

			startTime := clock.Now()

			assert.ErrorIs(t, RetryOnError(isErrFake0, newFunc(errs...)), tt.err)

			duration := clock.Since(startTime)
			expectedDuration := time.Millisecond * 100 * (1<<(len(errs)-1) - 1)
			assert.InEpsilon(t, expectedDuration, duration, 0.1)
		})
	}
}
