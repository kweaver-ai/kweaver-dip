package constant

type ObjectTypeString string

const (
	ObjectTypeStringRoot         ObjectTypeString = "root"
	ObjectTypeStringOrganization ObjectTypeString = "organization" // 组织
	ObjectTypeStringDepartment   ObjectTypeString = "department"   // 部门
	//ObjectTypeStringBusinessSystem  ObjectTypeString = "business_system"  // 业务系统 废弃
	//ObjectTypeStringBusinessMatters ObjectTypeString = "business_matters" // 业务事项
	//ObjectTypeStringMainBusiness ObjectTypeString = "main_business" // 主干业务
	//ObjectTypeStringBusinessForm ObjectTypeString = "business_form" // 业务表单
)

type ObjectType int32

const (
	ObjectTypeOrganization ObjectType = 1 + iota
	ObjectTypeDepartment
	_ //ObjectTypeBusinessSystem //废弃
	_ //ObjectTypeBusinessMatters //废弃
	_ //ObjectTypeMainBusiness
	_ //ObjectTypeBusinessForm

	ObjectTypeRoot ObjectType = -1
)

var (
	ObjectTypeStringToObjectType = map[ObjectTypeString]ObjectType{
		ObjectTypeStringRoot:         ObjectTypeRoot,
		ObjectTypeStringOrganization: ObjectTypeOrganization,
		ObjectTypeStringDepartment:   ObjectTypeDepartment,
		//ObjectTypeStringBusinessSystem:  ObjectTypeBusinessSystem,
		//ObjectTypeStringBusinessMatters: ObjectTypeBusinessMatters,
		//ObjectTypeStringMainBusiness:    ObjectTypeMainBusiness,
		//ObjectTypeStringBusinessForm:    ObjectTypeBusinessForm,
	}

	ObjectTypeToObjectTypeString = map[ObjectType]ObjectTypeString{
		ObjectTypeRoot:         ObjectTypeStringRoot,
		ObjectTypeOrganization: ObjectTypeStringOrganization,
		ObjectTypeDepartment:   ObjectTypeStringDepartment,
		//ObjectTypeBusinessSystem:  ObjectTypeStringBusinessSystem,
		//ObjectTypeBusinessMatters: ObjectTypeStringBusinessMatters,
		//ObjectTypeMainBusiness:    ObjectTypeStringMainBusiness,
		//ObjectTypeBusinessForm:    ObjectTypeStringBusinessForm,
	}
)

// 部门子类型
const (
	ObjectSubtypeAdministrativeDistrict ObjectType = 1 + iota
	ObjectSubtypeDepartment
	ObjectSubtypeOffice
)

func ObjectTypeStringToInt(s string) int32 {
	return int32(ObjectTypeStringToObjectType[ObjectTypeString(s)])
}
func ObjectTypeToString(i int32) string {
	return string(ObjectTypeToObjectTypeString[ObjectType(i)])
}

func ObjectTypeObjectTypeStringToInt(objectTypeString ObjectTypeString) int32 {
	return ObjectTypeStringToInt(string(objectTypeString))
}
