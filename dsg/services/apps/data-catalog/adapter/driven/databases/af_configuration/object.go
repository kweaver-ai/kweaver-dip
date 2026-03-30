package af_configuration

import (
	"context"
	_ "embed"
	"errors"

	"gorm.io/gorm"
)

type ErrInvalidObjectTypeString string

func (err ErrInvalidObjectTypeString) Error() string {
	return "invalid object type string: " + string(err)
}

func (err ErrInvalidObjectTypeString) Is(target error) bool {
	t := new(ErrInvalidObjectTypeString)
	if !errors.As(target, &t) {
		return false
	}

	return *t == err
}

// 数据库表 af_configuration.object
type Object struct {
	// 对象 ID
	ID string `json:"id,omitempty"`
	// 对象名称
	Name string `json:"name,omitempty"`
	// 路径
	Path string `json:"path,omitempty"`
	// 类型
	Type ObjectType `json:"type,omitempty"`
	// 其他的字段需要再加
}

// 类型
type ObjectType int

const (
	// 未知
	ObjectUnknown ObjectType = iota
	// 组织
	ObjectOrganization
	// 部门
	ObjectDepartment
)

const (
	// 未知
	ObjectStringUnknown = "unknown"
	// 组织
	ObjectStringOrganization = "organization"
	// 部门
	ObjectStringDepartment = "department"
)

// ObjectType -> String
var mapObjectTypeToString = map[ObjectType]string{
	ObjectUnknown:      ObjectStringUnknown,
	ObjectOrganization: ObjectStringOrganization,
	ObjectDepartment:   ObjectStringDepartment,
}

// String -> ObjectType
var mapStringToObjectType = map[string]ObjectType{
	ObjectStringUnknown:      ObjectUnknown,
	ObjectStringOrganization: ObjectOrganization,
	ObjectStringDepartment:   ObjectDepartment,
}

func ParseObjectTypeString(s string) (ObjectType, error) {
	t, ok := mapStringToObjectType[s]
	if ok {
		return t, nil
	}
	return ObjectUnknown, ErrInvalidObjectTypeString(s)
}

func ParseObjectTypeStringOrUnknown(s string) ObjectType {
	t, _ := ParseObjectTypeString(s)
	return t
}

func (t ObjectType) String() string {
	s, ok := mapObjectTypeToString[t]
	if !ok {
		s = ObjectStringUnknown
	}
	return s
}

type ObjectGetter interface {
	Object() ObjectInterface
}

type ObjectInterface interface {
	// 根据 ID 获取部门
	Get(ctx context.Context, id string) (*Object, error)
	// ListByParent 返回指定部门的子部门列表
	ListByParent(ctx context.Context, id string) ([]Object, error)
}

type objects struct {
	db *gorm.DB
}

func newObjects(db *gorm.DB) *objects { return &objects{db: db} }

// 根据 ID 获取部门
func (c *objects) Get(ctx context.Context, id string) (*Object, error) {
	var result Object
	if err := c.db.WithContext(ctx).
		Raw("SELECT * FROM object WHERE id = ?", id).
		Scan(&result).Error; err != nil {
		return nil, err
	}
	return &result, nil
}

//go:embed object_list_by_parent.sql
var sql_object_list_by_parent string

// ListByParent 返回指定部门的子部门列表
func (c *objects) ListByParent(ctx context.Context, id string) ([]Object, error) {
	var result []Object
	if err := c.db.WithContext(ctx).
		Raw(sql_object_list_by_parent, id).
		Scan(&result).Error; err != nil {
		return nil, err
	}
	return result, nil
}

var _ ObjectInterface = &objects{}
