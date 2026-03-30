package user_single

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestGet(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	c := &Client{db: db.Debug()}

	got, err := c.GetPhoneNumber(context.TODO(), "0197be82-4965-7b28-b092-ed9bad7bdaa7")
	require.NoError(t, err)

	t.Logf("phone number: %s", got)
}
