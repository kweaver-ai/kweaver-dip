package gorm

import (
	"errors"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("not found")

var ErrRecordNotFound = gorm.ErrRecordNotFound
