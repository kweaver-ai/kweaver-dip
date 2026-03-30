package common

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/sets"
)

// 数据资源类型
type DataResourceType string

const (
	// 数据资源类型：逻辑视图
	DataResourceTypeDataView DataResourceType = "data_view"
	// 数据资源类型：接口
	DataResourceTypeInterface DataResourceType = "interface_svc"
	// 数据资源类型：文件资源
	DataResourceTypeFile DataResourceType = "file"
)
const (
	LogicView = iota + 1
	Interface
	File
)

var (
	TypeMap = map[DataResourceType]int{
		DataResourceTypeDataView:  LogicView,
		DataResourceTypeInterface: Interface,
		DataResourceTypeFile:      File,
	}
)

// SupportedDataResourceTypes 定义所有支持的数据资源类型
var SupportedDataResourceTypes = sets.New(
	DataResourceTypeDataView,
	DataResourceTypeInterface,
	DataResourceTypeFile,
)

// 数据资源发布状态
type DataResourceCatalogPublishStatus string

const (
	// 未发布
	DRPS_UNPUBLISHED DataResourceCatalogPublishStatus = "unpublished"
	// 发布审核中
	DRPS_PUB_AUDITING DataResourceCatalogPublishStatus = "pub-auditing"
	// 已发布
	DRPS_PUBLISHED DataResourceCatalogPublishStatus = "published"
	// 发布审核未通过
	DRPS_PUB_REJECT DataResourceCatalogPublishStatus = "pub-reject"
	// 变更审核中
	DRPS_CHANGE_AUDITING DataResourceCatalogPublishStatus = "change-auditing"
	// 变更审核未通过
	DRPS_CHANGE_REJECT DataResourceCatalogPublishStatus = "change-reject"
)

// 数据资源上线状态
type DataResourceCatalogOnlineStatus string

const (
	// 未上线
	DROS_NOT_ONLINE DataResourceCatalogOnlineStatus = "notline"
	// 已上线
	DROS_ONLINE DataResourceCatalogOnlineStatus = "online"
	// 已下线
	DROS_OFFLINE DataResourceCatalogOnlineStatus = "offline"
	// 上线审核中
	DROS_UP_AUDITING DataResourceCatalogOnlineStatus = "up-auditing"
	// 下线审核中
	DROS_DOWN_AUDITING DataResourceCatalogOnlineStatus = "down-auditing"
	// 上线审核未通过
	DROS_UP_REJECT DataResourceCatalogOnlineStatus = "up-reject"
	// 下线审核未通过
	DROS_DOWN_REJECT DataResourceCatalogOnlineStatus = "down-reject"
)

const (
	USER_ROLE_OPERATOR = "00004606-f318-450f-bc53-f0720b27acff" // 数据运营工程师
	USER_ROLE_OWNER    = "00002fb7-1e54-4ce1-bc02-626cb1f85f62" // 数据OWNER
)
