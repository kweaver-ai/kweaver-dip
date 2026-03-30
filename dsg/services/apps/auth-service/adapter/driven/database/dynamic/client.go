package dynamic

import (
	"context"

	"gorm.io/gorm"
)

type Client struct {
	DB *gorm.DB
}

// GetByConditionEqual implements Interface.
func (c *Client) GetByConditionEqual(ctx context.Context, table string, field string, value any) (result map[string]any, err error) {
	result = make(map[string]any)
	if err = c.DB.WithContext(ctx).Table(table).Where(map[string]any{field: value}).Take(&result).Error; err != nil {
		return nil, err
	}
	return
}

var _ Interface = &Client{}
