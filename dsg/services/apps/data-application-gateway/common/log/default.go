package log

import (
	"context"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

func Info(msg string, fields ...zapx.Field) {
	logger.Info(msg, fields...)
}
func Infof(format string, v ...interface{}) {
	logger.Infof(format, v...)
}
func Infow(msg string, keysAndValues ...interface{}) {
	logger.Infow(msg, keysAndValues...)
}

// Enabled tests whether this InfoLogger is enabled.  For example,
// commandline flags might be used to set the logging verbosity and disable
// some info logs.
//func Enabled() bool {
//	return logger.Enabled()
//}

func Debug(msg string, fields ...zapx.Field) {
	logger.Debug(msg, fields...)
}

func Debugf(format string, v ...interface{}) {
	logger.Debugf(format, v...)
}

func Debugw(msg string, keysAndValues ...interface{}) {
	logger.Debugw(msg, keysAndValues)
}
func Warn(msg string, fields ...zapx.Field) {
	logger.Warn(msg, fields...)
}

func Warnf(format string, v ...interface{}) {
	logger.Warnf(format, v...)
}

func Warnw(msg string, keysAndValues ...interface{}) {
	logger.Warnw(msg, keysAndValues...)
}

func Error(msg string, fields ...zapx.Field) {
	logger.Error(msg, fields...)
}

func Errorf(format string, v ...interface{}) {
	logger.Errorf(format, v...)
}

func Errorw(msg string, keysAndValues ...interface{}) {
	logger.Errorw(msg, keysAndValues...)
}

func Panic(msg string, fields ...zapx.Field) {
	logger.Panic(msg, fields...)
}
func Panicf(format string, v ...interface{}) {
	logger.Panicf(format, v...)
}
func Panicw(msg string, keysAndValues ...interface{}) {
	logger.Panicw(msg, keysAndValues...)
}
func Fatal(msg string, fields ...zapx.Field) {
	logger.Fatal(msg, fields...)
}
func Fatalf(format string, v ...interface{}) {
	logger.Fatalf(format, v...)
}
func Fatalw(msg string, keysAndValues ...interface{}) {
	logger.Fatalw(msg, keysAndValues...)
}

// V returns an InfoLogger value for a specific verbosity level.  A higher
// verbosity level means a log message is less important.  It's illegal to
// pass a log level less than zero.
//func V(level zapx.Level) zapx.InfoLogger {
//	return logger.V(level)
//}

func Write(p []byte) (n int, err error) {
	return logger.Write(p)
}

// WithValues adds some key-value pairs of context to a logger.
// See Info for documentation on how key/value pairs work.
func WithValues(keysAndValues ...interface{}) zapx.Logger {
	return logger.WithValues(keysAndValues...)
}

// WithName adds a new element to the logger's name.
// Successive calls with WithName continue to append
// suffixes to the logger's name.  It's strongly recommended
// that name segments contain only letters, digits, and hyphens
// (see the package documentation for more information).
func WithName(name string) zapx.Logger {
	return logger.WithName(name)
}

// WithContext returns a copy of context in which the log value is set.
func WithContext(ctx context.Context) context.Context {
	return logger.WithContext(ctx)
}

// Flush calls the underlying Core's Sync method, flushing any buffered
// log entries. Applications should take care to call Sync before exiting.
func Flush() {
	logger.Flush()
}
