package impl

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func get() *gorm.DB {
	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
		"root",
		"123456",
		"10.4.68.64",
		3306,
		"af_configuration")))
	if err != nil {
		log.Println("open mysql failed,err:", err)
		return nil
	}
	return DB
}
func TestUserRepo_GetAll(t *testing.T) {
	all, err := NewUserRepo(get()).GetAll(context.Background())
	if err != nil {
		t.Error(err)
		return
	}
	t.Log(all)

}

func TestUserRepo_ListUserNames(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	r := &UserRepo{DB: db.Debug()}

	ctx, cancel := context.WithTimeout(context.TODO(), time.Minute)
	defer cancel()

	got, err := r.ListUserNames(ctx)
	require.NoError(t, err)
	log.Printf("len(got): %v", len(got))
}
