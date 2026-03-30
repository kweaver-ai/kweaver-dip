package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

type SubjectDomainObjectTypeString string

const (
	StringRoot               SubjectDomainObjectTypeString = "root"
	StringSubjectDomainGroup SubjectDomainObjectTypeString = "subject_domain_group" // 业务对象分组
	StringSubjectDomain      SubjectDomainObjectTypeString = "subject_domain"       // 业务对象
	StringBusinessObject     SubjectDomainObjectTypeString = "business_object"      // 业务对象
	StringBusinessActivity   SubjectDomainObjectTypeString = "business_activity"    // 业务活动
	StringLogicEntity        SubjectDomainObjectTypeString = "logic_entity"         // 逻辑实体
	StringAttribute          SubjectDomainObjectTypeString = "attribute"            // 属性
)

const (
	SubjectDomainGroup int8 = 1 + iota
	SubjectDomain
	BusinessObject
	BusinessActivity
	LogicEntity
	Attribute

	SubjectDomainObjectTypeRoot int8 = -1
)

var (
	SubjectDomainObjectTypeStringToObjectType = map[SubjectDomainObjectTypeString]int8{
		StringRoot:               SubjectDomainObjectTypeRoot,
		StringSubjectDomainGroup: SubjectDomainGroup,
		StringSubjectDomain:      SubjectDomain,
		StringBusinessObject:     BusinessObject,
		StringBusinessActivity:   BusinessActivity,
		StringLogicEntity:        LogicEntity,
		StringAttribute:          Attribute,
	}

	SubjectDomainObjectTypeToObjectTypeString = map[int8]SubjectDomainObjectTypeString{
		SubjectDomainObjectTypeRoot: StringRoot,
		SubjectDomainGroup:          StringSubjectDomainGroup,
		SubjectDomain:               StringSubjectDomain,
		BusinessObject:              StringBusinessObject,
		BusinessActivity:            StringBusinessActivity,
		LogicEntity:                 StringLogicEntity,
		Attribute:                   StringAttribute,
	}
)

func SubjectDomainObjectStringToInt(s string) int8 {
	return SubjectDomainObjectTypeStringToObjectType[SubjectDomainObjectTypeString(s)]
}
func SubjectDomainObjectIntToString(i int8) string {
	return string(SubjectDomainObjectTypeToObjectTypeString[i])
}

// DataType  数据类型
type DataType enum.Object

var (
	DataTypeNumber    = enum.New[DataType](0, "number", "数字型")
	DataTypeChar      = enum.New[DataType](1, "char", "字符型")
	DataTypeDate      = enum.New[DataType](2, "date", "日期型")
	DataTypeDateTime  = enum.New[DataType](3, "datetime", "日期时间型")
	DataTypeTimestamp = enum.New[DataType](4, "timestamp", "时间戳型")
	DataTypeBool      = enum.New[DataType](5, "bool", "布尔型")
	DataTypeBinary    = enum.New[DataType](6, "binary", "二进制")
)
