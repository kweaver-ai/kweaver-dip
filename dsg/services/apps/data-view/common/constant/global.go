package constant

import (
	"database/sql/driver"
	data_subject_common "github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"strconv"
	"time"

	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

const (
	ServiceName    = "DataView"
	ServiceChannel = "data-view"

	DefaultHttpRequestTimeout = 60 * time.Second

	CommonTimeFormat = "2006-01-02 15:04:05"
)

const (
	SortByCreatedAt = "created_at"
	SortByUpdatedAt = "updated_at"
)

const VDMConnectorName = "vdm"
const VirtualDataType = "virtualFieldType"
const IsNullable = "IS_NULLABLE"

const BusinessNameCharCountLimit = 255
const CommentCharCountLimit = 300
const ManagementScanner = "management_scanner"

const UUIDRegexString = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"

const (
	FormViewPublicTopic = "af.data-view.es-index"
	EntityChangeTopic   = "af.business-grooming.entity_change"
)
const UnallocatedId = "00000000-0000-0000-0000-000000000000"

var CodeGenerationRuleUUIDDataView = uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")

var CustomViewSource = "custom_view_source"
var LogicEntityViewSource = "logic_entity_view_source"

var ExcelTypeName = "excel"
var DefaultViewSourceSchema = ".default"
var CustomAndLogicEntityViewSourceSchema = ".default"
var ViewSourceSchema = "default"

var ViewNeedRecreate = "is stale; it must be re-created`"

var SampleDataCount = "sample_data_count"
var SampleDataType = "sample_data_type"
var Synthetic = "synthetic"
var Real = "real"

type ModelID string

func NewModelID(id uint64) ModelID {
	return ModelID(strconv.FormatUint(id, 10))
}

func (m ModelID) Uint64() uint64 {
	if len(m) == 0 {
		return 0
	}

	uintId, err := strconv.ParseUint(string(m), 10, 64)
	if err != nil {
		coder := agcodes.New(ServiceName+".Public.InvalidParameter", "参数值异常", "", "ID需要修改为可解析为数字的字符串", err, "")
		panic(agerrors.NewCode(coder))
	}

	return uintId
}

// Value 实现数据库驱动所支持的值
// 没有该方法会将ModelID在驱动层转换后string，导致与数据库定义类型不匹配
func (m ModelID) Value() (driver.Value, error) {
	return m.Uint64(), nil
}

// CouldBindSet 视图可以绑定的Subject
var CouldBindSet = map[string]struct{}{
	string(data_subject_common.StringSubjectDomain):    {},
	string(data_subject_common.StringBusinessObject):   {},
	string(data_subject_common.StringBusinessActivity): {},
}

func IsCouldBindSubject(subject string) bool {
	if _, exist := CouldBindSet[subject]; exist {
		return true
	}
	return false
}

// 消息队列 topic：子视图 SubView
const TopicSubView = "af.data-view.sub-view"

const (
	DepartmentCateId = "00000000-0000-0000-0000-000000000001"
	InfoSystemCateId = "00000000-0000-0000-0000-000000000002"
	SubjectCateId    = "00000000-0000-0000-0000-000000000003"
)

var OwnerIdSep = ","
var OwnerNameSep = "/"
