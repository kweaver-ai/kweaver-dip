package info_resource_catalog

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

// [错误行为枚举]
const (
	actionCreateFail                       = "CreateInfoResourceCatalogFail"
	actionUpdateFail                       = "UpdateInfoResourceCatalogFail"
	actionUpdateStatusFail                 = "UpdateInfoResourceCatalogStatusFail"
	actionDeleteFail                       = "DeleteInfoResourceCatalogFail"
	actionGetInfoResourceCatalogCardFail   = "GetInfoResourceCatalogCardFail"
	actionGetInfoResourceCatalogDetailFail = "GetInfoResourceCatalogDetailFail"
	actionGetInfoItemsFail                 = "GetInfoItemsFail"
	actionAlterFail                        = "AlterInfoResourceCatalogFail"
	actionAlterRecoverFail                 = "AlterRecoverInfoResourceCatalogFail"
	actionAlterAuditCancelFail             = "AlterAuditCancelInfoResourceCatalogFail"
) // [/]

// [错误原因枚举]
const (
	causeNameRepeat             = "NameRepeat"
	causeInvalidReference       = "InvalidReference"
	causeBusinessFormCataloged  = "BusinessFormCataloged"
	causeResourceNotExist       = "ResourceNotExist"
	causeInvalidTargetStatus    = "InvalidTargetStatus"
	causeParentResourceNotExist = "ParentResourceNotExist"
	causeOperationNotAllowed    = "OperationNotAllowed"
) // [/]

// [业务错误码枚举]
const (
	ErrCreateFailBusinessFormCataloged                  = constant.ServiceName + "." + actionCreateFail + "." + causeBusinessFormCataloged
	ErrCreateFailNameRepeat                             = constant.ServiceName + "." + actionCreateFail + "." + causeNameRepeat
	ErrCreateFailInvalidReference                       = constant.ServiceName + "." + actionCreateFail + "." + causeInvalidReference
	ErrUpdateFailResourceNotExist                       = constant.ServiceName + "." + actionUpdateFail + "." + causeResourceNotExist
	ErrUpdateFailNameRepeat                             = constant.ServiceName + "." + actionUpdateFail + "." + causeNameRepeat
	ErrUpdateFailInvalidReference                       = constant.ServiceName + "." + actionUpdateFail + "." + causeInvalidReference
	ErrUpdateStatusFailResourceNotExist                 = constant.ServiceName + "." + actionUpdateStatusFail + "." + causeResourceNotExist
	ErrUpdateStatusFailInvalidTargetStatus              = constant.ServiceName + "." + actionUpdateStatusFail + "." + causeInvalidTargetStatus
	ErrDeleteFailResourceNotExist                       = constant.ServiceName + "." + actionDeleteFail + "." + causeResourceNotExist
	ErrGetInfoResourceCatalogCardFailResourceNotExist   = constant.ServiceName + "." + actionGetInfoResourceCatalogCardFail + "." + causeResourceNotExist
	ErrGetInfoResourceCatalogDetailFailResourceNotExist = constant.ServiceName + "." + actionGetInfoResourceCatalogDetailFail + "." + causeResourceNotExist
	ErrGetInfoItemsFailParentResourceNotExist           = constant.ServiceName + "." + actionGetInfoItemsFail + "." + causeParentResourceNotExist
	ErrUpdateNotAllowed                                 = constant.ServiceName + "." + actionUpdateFail + "." + causeOperationNotAllowed
	ErrDeleteNotAllowed                                 = constant.ServiceName + "." + actionDeleteFail + "." + causeOperationNotAllowed
	ErrAlterNotAllowed                                  = constant.ServiceName + "." + actionAlterFail + "." + causeOperationNotAllowed
	ErrAlterRecoverNotAllowed                           = constant.ServiceName + "." + actionAlterRecoverFail + "." + causeOperationNotAllowed
	ErrAlterAuditCancelNotAllowed                       = constant.ServiceName + "." + actionAlterAuditCancelFail + "." + causeOperationNotAllowed
	ErrResourceNotExist                                 = constant.ServiceName + "." + causeResourceNotExist
) // [/]

// [业务错误响应]
var BizErr = errorcode.ErrorCode{
	ErrCreateFailBusinessFormCataloged: {
		Description: "新建信息资源目录失败",
		Cause:       "来源业务表已编目",
		Solution:    "请重新选择业务表",
	},
	ErrCreateFailNameRepeat: {
		Description: "新建信息资源目录失败",
		Cause:       "命名冲突",
		Solution:    "请重新输入名称",
	},
	ErrCreateFailInvalidReference: {
		Description: "新建信息资源目录失败",
		Cause:       "非法的关联项",
		Solution:    "请重新选择关联项",
	},
	ErrUpdateFailResourceNotExist: {
		Description: "更新信息资源目录失败",
		Cause:       "当前信息资源目录已不存在",
		Solution:    "请选择有效项进行更新",
	},
	ErrUpdateFailNameRepeat: {
		Description: "更新信息资源目录失败",
		Cause:       "命名冲突",
		Solution:    "请重新输入名称",
	},
	ErrUpdateFailInvalidReference: {
		Description: "更新信息资源目录失败",
		Cause:       "非法的关联项",
		Solution:    "请重新选择关联项",
	},
	ErrUpdateStatusFailResourceNotExist: {
		Description: "更新信息资源目录状态失败",
		Cause:       "当前信息资源目录已不存在",
		Solution:    "请选择有效项更新状态",
	},
	ErrUpdateStatusFailInvalidTargetStatus: {
		Description: "更新信息资源目录状态失败",
		Cause:       "非法的目标状态",
		Solution:    "请检查指定项当前状态",
	},
	ErrDeleteFailResourceNotExist: {
		Description: "删除信息资源目录失败",
		Cause:       "当前信息资源目录已不存在",
		Solution:    "请不要重复删除",
	},
	ErrGetInfoResourceCatalogCardFailResourceNotExist: {
		Description: "获取信息资源目录卡片失败",
		Cause:       "当前信息资源目录已不存在",
		Solution:    "请选择有效项获取信息",
	},
	ErrGetInfoResourceCatalogDetailFailResourceNotExist: {
		Description: "获取信息资源目录详情失败",
		Cause:       "当前信息资源目录已不存在",
		Solution:    "请选择有效项获取信息",
	},
	ErrGetInfoItemsFailParentResourceNotExist: {
		Description: "获取信息项列表失败",
		Cause:       "所属信息资源目录已不存在",
		Solution:    "请选择有效信息资源目录获取下属信息项列表",
	},
	ErrUpdateNotAllowed: {
		Description: "编辑信息资源目录失败",
		Cause:       "信息资源目录当前状态不允许编辑",
		Solution:    "请确认当前信息资源目录状态",
	},
	ErrDeleteNotAllowed: {
		Description: "删除信息资源目录失败",
		Cause:       "信息资源目录当前状态不允许删除",
		Solution:    "请确认当前信息资源目录状态",
	},
	ErrAlterNotAllowed: {
		Description: "变更信息资源目录失败",
		Cause:       "信息资源目录当前状态不允许变更",
		Solution:    "请确认当前信息资源目录状态",
	},
	ErrResourceNotExist: {
		Description: "当前信息资源目录已不存在",
		Cause:       "当前信息资源目录已不存在",
		Solution:    "请选择有效项的信息资源目录",
	},
	ErrAlterRecoverNotAllowed: {
		Description: "变更恢复信息资源目录失败",
		Cause:       "信息资源目录当前状态不允许变更恢复",
		Solution:    "请确认当前信息资源目录状态",
	},
	ErrAlterAuditCancelNotAllowed: {
		Description: "变更撤回信息资源目录失败",
		Cause:       "信息资源目录当前状态不允许变更撤回",
		Solution:    "请确认当前信息资源目录状态",
	},
} // [/]

func init() {
	errorcode.RegisterErrorCode(BizErr)
}
