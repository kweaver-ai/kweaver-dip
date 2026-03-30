package user_single

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Client struct {
	db *gorm.DB
}

// GetPhoneNumber implements Interface.
func (c *Client) GetPhoneNumber(ctx context.Context, id string) (string, error) {
	var user model.UserWithPhoneNumber
	if err := c.db.WithContext(ctx).Table("af_configuration."+model.TableNameUserSingle).Where("id=?", id).Take(&user).Error; err != nil {
		return "", err
	}
	return user.PhoneNumber, nil
}

var _ Interface = &Client{}

func New(data *db.Data) Interface { return &Client{db: data.DB} }
