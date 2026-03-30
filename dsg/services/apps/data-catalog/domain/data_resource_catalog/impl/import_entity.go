package impl

type ImportCatalog struct {
	// *挂接资源名称：仅支持库表资源，最多输入一条，最多128字符，中英文、数字、下划线及中划线
	MountResourceName string `json:"mount_resource_name" excel:"*挂接资源名称"`

	// *数据资源目录名称：不能重复，最多128字符，中英文、数字、下划线及中划线
	DataResourceCatalogName string `json:"data_resource_catalog_name" excel:"*数据资源目录名称" validate:"required,VerifyNameStandard"`

	// 数据资源来源部门：填写关联部门名称
	DataResourceDepartment string `json:"data_resource_department" excel:"数据资源来源部门"  validate:"omitempty"`

	// *目录提供方：填写编目用户所在部门名称
	CatalogProvider string `json:"catalog_provider" excel:"*目录提供方" validate:"required"`

	// *所属信息系统：填写已存在的信息系统名称
	InfoSystem string `json:"info_system" excel:"*所属信息系统" validate:"omitempty"`

	// *所属主题：可选人/地/事/物/组织/其他，用";"分隔，若包含“其他”则不可有其他值，可用"/"表示父子级
	SubjectCategory string `json:"subject_category" excel:"*所属主题" validate:"required"`

	// 应用场景分类：政务服务、公共服务、监管、其他
	AppSceneClassify AppSceneClassify `json:"application_scenario" excel:"应用场景分类" validate:"omitempty,oneof=政务服务 公共服务 监管 其他"`

	// *数据所属事项：最多128字符，中英文、数字、下划线及中划线，多个用";"分隔
	DataMatter string `json:"data_matter" excel:"*数据所属事项" validate:"required,VerifyDataRelatedMatters"`

	// *空间范围：全市、市直、区县（市）
	SpatialScope SpatialScope `json:"spatial_scope" excel:"*空间范围" validate:"required,oneof=全市 市直 区县市 区县（市）"`

	// *数据时间范围：格式如 2025/04/27-2026/01/01，或只写开始时间
	DataTimeRange string `json:"data_time_range" excel:"*数据时间范围" validate:"required,VerifyDateTimeRange"`

	// *更新周期：实时、每日、每周、每月、每季度、每半年、每年、其他
	UpdateCycle UpdateCycle `json:"update_cycle" excel:"*更新周期" validate:"required,oneof=实时 每日 每周 每月 每季度 每半年 每年 其他"`

	// *数据分级：一般数据、重要数据、核心数据、涉密数据
	DataClassification string `json:"data_classification" excel:"*数据分级" validate:"required"`

	// *数据资源目录描述：最多255字符
	Description string `json:"description" excel:"*数据资源目录描述" validate:"required,max=255"`

	// 资源属性分类一
	ResourceAttributeCategory1 string `json:"resource_attribute_category1" excel:"资源属性分类一"  validate:"omitempty"`

	// 资源属性分类二
	ResourceAttributeCategory2 string `json:"resource_attribute_category2" excel:"资源属性分类二"  validate:"omitempty"`

	// 资源属性分类三
	//ResourceAttributeCategory3 string `json:"resource_attribute_category3" excel:"资源属性分类三"`

	// *共享属性：无条件共享、有条件共享、不予共享
	SharedType SharedType `json:"shared_type" excel:"*共享属性" validate:"required,oneof=无条件共享 有条件共享 不予共享"`

	// 共享条件/不予共享依据：当共享属性为有条件共享时必填；为不予共享时也必填
	SharingConditions string `json:"sharing_conditions" excel:"共享条件/不予共享依据" validate:"omitempty,max=128"`

	// 共享方式：共享平台方式、邮件方式、介质方式
	SharedMode SharedMode `json:"shared_mode" excel:"共享方式" validate:"omitempty,oneof=共享平台方式 邮件方式 介质方式"`

	// *开放属性：无条件开放、有条件开放、不予开放。与共享属性逻辑一致
	OpenType OpenType `json:"open_type" excel:"*开放属性" validate:"required,oneof=无条件开放 有条件开放 不予开放"`

	// 开放条件：当开放属性为有条件开放时必填
	OpenConditions string `json:"open_condition" excel:"开放条件" validate:"omitempty,max=128"`

	// 数据同步机制：增量、全量
	DataSyncMechanism DataSyncMechanism `json:"data_sync_mechanism" excel:"数据同步机制" validate:"omitempty,oneof=增量 全量"`

	// 同步频率：最多128字符
	SyncFrequency string `json:"sync_frequency" excel:"同步频率" validate:"omitempty,max=128"`

	// 数据是否存在物理删除：是、否
	IsDataPhysicallyDeleted Bool `json:"is_data_physically_deleted" excel:"数据是否存在物理删除" validate:"omitempty,oneof=是 否"`

	// *是否上线到超市：是、否
	IsOnlineInSupermarket Bool `json:"is_online_in_supermarket" excel:"*是否上线到超市" validate:"omitempty,oneof=是 否"`
}
type AppSceneClassify string
type SpatialScope string
type UpdateCycle string
type SharedMode string
type DataSyncMechanism string

func (t AppSceneClassify) ToInt8() int8 {
	switch t {
	case "政务服务":
		return 1
	case "公共服务":
		return 2
	case "监管":
		return 3
	case "其他":
		return 4
	default:
		return 0
	}
}
func (t AppSceneClassify) ToInt8Ptr() *int8 {
	a := t.ToInt8()
	return &a
}
func (t SpatialScope) ToInt32() int32 {
	switch t {
	case "全市":
		return 4
	case "市直":
		return 2
	case "区县（市）":
		return 3
	default:
		return 0
	}
}
func (t UpdateCycle) ToInt32() int32 {
	switch t {
	case "实时":
		return 1
	case "每日":
		return 2
	case "每周":
		return 3
	case "每月":
		return 4
	case "每季度":
		return 5
	case "每半年":
		return 6
	case "每年":
		return 7
	case "其他":
		return 8
	default:
		return 0
	}
}

func (t SharedMode) ToInt8() int8 {
	switch t {
	case "共享平台方式":
		return 1
	case "邮件方式":
		return 2
	case "介质方式":
		return 3
	default:
		return 0
	}
}
func (t DataSyncMechanism) ToInt8() int8 {
	switch t {
	case "增量":
		return 1
	case "全量":
		return 2
	default:
		return 0
	}
}

type ImportColumn struct {
	// *数据资源目录名称：填写相应的数据资源目录名称，用以将目录与信息项作匹配对应，最多输入128个字符，仅支持中英文、数字、下划线及中划线。
	// “数据资源目录导入”表的【数据资源目录名称】项需与“信息项导入”表的【数据资源目录名称】对应。
	DataResourceCatalogName string `json:"data_resource_catalog_name" excel:"*数据资源目录名称" validate:"required,VerifyNameStandard"`

	// *信息项业务名称：填写数据资源目录对应的业务标准表的字段的中文名称。
	BusinessName string `json:"business_name" excel:"*信息项业务名称" validate:"required"`

	// *信息项技术名称：填写数据资源目录对应的业务标准表的字段的英文名称。
	TechnicalName string `json:"technical_name" excel:"*信息项技术名称" validate:"required"`

	// 关联数据标准：填写信息项所关联的数据标准名称。关联数据标准的数据类型需与业务名称字段的数据类型一致。
	StandardName string `json:"standard_name" excel:"关联数据标准" validate:"omitempty"`

	// 关联码表：填写信息项所关联的码表名称。
	CodeTableName string `json:"code_table_name" excel:"关联码表" validate:"omitempty"`

	// *数据类型：选择信息项的数据类型，包括：整数型、小数型、高精度型、字符型、日期型、日期时间型、时间型、布尔型、其他，从中选其一填写即可。
	DataFormat DataFormat `json:"data_format" excel:"*数据类型" validate:"required,oneof=整数型 小数型 高精度型 字符型 日期型 日期时间型 时间型 布尔型 其他"`

	// 数据长度：填写该信息项值的最大长度，只有在数据类型为高精度型和字符型时生效。
	// 其中高精度型需填写1-38之间的整数，为必填；字符型需填写1-65535之间的整数。
	DataLength *int32 `json:"data_length" excel:"数据长度" validate:"omitempty,gte=1,lte=65535"`

	// 数据值域：填写该信息项值的范围，支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头，最多可输入128个字符。
	DataRange string `json:"data_range" excel:"数据值域" validate:"omitempty,VerifyRange"`

	// *共享属性：包括无条件共享，有条件共享，不予共享，选择其中一项即可。
	SharedType SharedType `json:"shared_type" excel:"*共享属性" validate:"required,oneof=无条件共享 有条件共享 不予共享"`

	// *开放属性：包括无条件开放、有条件开放、不予开放，选择其中一项即可。
	// 如果共享属性选择了“不予共享”，则开放属性必须选择“不予开放”。
	OpenType OpenType `json:"open_type" excel:"*开放属性" validate:"required,oneof=无条件开放 有条件开放 不予开放"`

	// *敏感属性：根据信息项数据的密级程度选择“敏感”或“非敏感”。
	SensitiveFlag SensitiveFlag `json:"sensitive_flag" excel:"*敏感属性" validate:"required,oneof=敏感 非敏感"`

	// *涉密属性：根据信息项数据的涉密程度选择“涉密”或“非涉密”。
	ClassifiedFlag ClassifiedFlag `json:"classified_flag" excel:"*涉密属性" validate:"required,oneof=涉密 非涉密"`

	// 是否时间戳：该信息项是否作为实体表数据发生更新的时间戳，若选择“是”，则每次数据更新都将时间标记在该信息项，
	// 同一个目录中，最多选择一个信息项作为时间戳。
	TimestampFlag Bool `json:"timestamp_flag" excel:"是否时间戳" validate:"omitempty,oneof=是 否"`

	// 是否主键：该信息项是否为业务标准表字段的主键；可以选择一个或多个主键。
	PrimaryFlag Bool `json:"primary_flag" excel:"是否主键" validate:"omitempty,oneof=是 否"`
}

type DataFormat string
type SharedType string
type OpenType string
type ClassifiedFlag string
type SensitiveFlag string
type Bool string

func (t DataFormat) ToInt32() *int32 {
	tmp := t.toInt32()
	if tmp == -1 {
		return nil
	}
	return &tmp
}
func (t DataFormat) toInt32() int32 {
	switch t {
	case "整数型":
		return 0
	case "小数型":
		return 7
	case "高精度型":
		return 8
	case "字符型":
		return 1
	case "日期型":
		return 2
	case "日期时间型":
		return 3
	case "时间型":
		return 9
	case "布尔型":
		return 5
	case "其他":
		return 6
	default:
		return -1
	}
}

func (t SharedType) ToInt8() int8 {
	switch t {
	case "无条件共享":
		return 1
	case "有条件共享":
		return 2
	case "不予共享":
		return 3
	default:
		return 0
	}
}
func (t OpenType) ToInt8() int8 {
	switch t {
	case "无条件开放":
		return 1
	case "有条件开放":
		return 2
	case "不予开放":
		return 3
	default:
		return 0
	}
}
func (t ClassifiedFlag) ToInt16() *int16 {
	tmp := t.toInt16()
	if tmp == -1 {
		return nil
	}
	return &tmp
}
func (t ClassifiedFlag) toInt16() int16 {
	switch t {
	case "涉密":
		return 1
	case "非涉密":
		return 0
	default:
		return -1
	}
}
func (t SensitiveFlag) ToInt16() *int16 {
	tmp := t.toInt16()
	if tmp == -1 {
		return nil
	}
	return &tmp
}
func (t SensitiveFlag) toInt16() int16 {
	switch t {
	case "敏感":
		return 1
	case "非敏感":
		return 0
	default:
		return -1
	}
}

func (t Bool) ToInt8() *int8 {
	tmp := int8(t.toInt16())
	if tmp == -1 {
		return nil
	}
	return &tmp
}
func (t Bool) ToInt16() *int16 {
	tmp := t.toInt16()
	if tmp == -1 {
		return nil
	}
	return &tmp
}
func (t Bool) toInt16() int16 {
	switch t {
	case "是":
		return 1
	case "否":
		return 0
	default:
		return -1
	}
}
