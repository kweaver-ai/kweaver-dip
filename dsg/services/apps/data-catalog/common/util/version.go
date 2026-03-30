package util

import (
	"strconv"
	"strings"

	"github.com/pkg/errors"
)

func VersionIncr(version string) string {
	var (
		incrBy, val int
		err         error
	)
	vers := strings.Split(version, ".")
	incrBy = 1
	for i := len(vers) - 1; i >= 0; i-- {
		val, err = strconv.Atoi(vers[i])
		if err != nil {
			panic(err)
		}

		vers[i] = strconv.Itoa((val + incrBy) % 10)
		if incrBy = (val + 1) / 10; incrBy == 0 {
			break
		} else if i == 0 {
			panic(errors.Errorf("version incr failed, current version %s is the max version", version))
		}
	}
	return strings.Join(vers, ".")
}
