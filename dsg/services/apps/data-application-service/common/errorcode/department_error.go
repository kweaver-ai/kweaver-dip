package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(departmentErrorMap)
}

const (
	departmentModelName = "Department"
)

// Demo error
const (
	departmentPreCoder = constant.ServiceName + "." + departmentModelName + "."

	DepartmentIdNotExist = departmentPreCoder + "DepartmentIdNotExist"
)

var departmentErrorMap = errorCode{
	DepartmentIdNotExist: {
		description: "部门ID不存在",
		cause:       "",
		solution:    "请重新输入部门ID",
	},
}
