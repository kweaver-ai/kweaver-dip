package af_configuration

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func Test_objects_Get(t *testing.T) {
	const dsn = "username:password@tcp(ip:port)/?parseTime=true&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn))
	require.NoError(t, err)

	c := newObjects(db.Debug(), "af_configuration")

	for i := 0; i < 8; i++ {
		got, err := c.Get(context.Background(), "cc14441a-b6b4-11ef-a383-a624066a8dd7")
		require.NoError(t, err)
		t.Logf("object: %+v", got)
	}
}
