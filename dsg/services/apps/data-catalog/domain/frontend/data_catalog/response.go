package data_catalog

import (
	"context"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/data_view"

	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	fcommon "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type CatalogDetailResp struct {
	ID               uint64 `json:"id,string"`                    // 唯一id，雪花算法
	Code             string `json:"code"`                         // 目录编码
	Title            string `json:"title"`                        // 目录名称
	GroupID          uint64 `json:"group_id,string,omitempty"`    // 数据资源目录分类ID
	GroupName        string `json:"group_name,omitempty"`         // 数据资源目录分类名称
	ThemeID          uint64 `json:"theme_id,string,omitempty"`    // 主题分类ID
	ThemeName        string `json:"theme_name,omitempty"`         // 主题分类名称
	ForwardVersionID uint64 `json:"forward_version_id,omitempty"` // 当前目录前一版本目录ID
	Description      string `json:"description,omitempty"`        // 资源目录描述
	Version          string `json:"version"`                      // 目录版本号，默认初始版本为0.0.0.1
	DataRange        int32  `json:"data_range,omitempty"`         // 数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县
	UpdateCycle      int32  `json:"update_cycle,omitempty"`       // 更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	//DataKind         int32                       `json:"data_kind"`                    // 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他  可组合，如 人和地 即 1|2 = 3
	SharedType       int8   `json:"shared_type"`                 // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition  string `json:"shared_condition,omitempty"`  // 共享条件
	OpenType         int8   `json:"open_type,omitempty"`         // 开放属性 1 向公众开放 2 不向公众开放
	OpenCondition    string `json:"open_condition,omitempty"`    // 开放条件
	SharedMode       int8   `json:"shared_mode,omitempty"`       // 共享方式 1 共享平台方式 2 邮件方式 3 介质方式
	PhysicalDeletion *int8  `json:"physical_deletion,omitempty"` // 挂接实体资源是否存在物理删除(1 是 ; 0 否)
	SyncMechanism    int8   `json:"sync_mechanism,omitempty"`    // 数据归集机制(1 增量 ; 2 全量) ----归集到数据中台
	SyncFrequency    string `json:"sync_frequency,omitempty"`    // 数据归集频率 ----归集到数据中台
	TableCount       int    `json:"table_count"`                 // 挂接库表数量
	FileCount        int    `json:"file_count"`                  // 挂接文件数量
	//State            int8                        `json:"state"`                       // 目录状态，1 草稿  3 已发布  5 已上线  8 已下线
	FlowNodeID   string `json:"flow_node_id"`   // 目录当前所处审核流程结点ID
	FlowNodeName string `json:"flow_node_name"` // 目录当前所处审核流程结点名称
	//FlowType         *int8                       `json:"flow_type"`                   // 审批流程类型 1 上线 2 变更 3 下线 4 发布
	FlowID         string                      `json:"flow_id"`                    // 审批流程ID
	FlowName       string                      `json:"flow_name"`                  // 审批流程名称
	FlowVersion    string                      `json:"flow_version"`               // 审批流程版本
	Orgcode        string                      `json:"orgcode"`                    // 所属部门ID
	Orgname        string                      `json:"orgname"`                    // 所属部门名称
	CreatedAt      int64                       `json:"created_at"`                 // 创建时间戳
	CreatorUID     string                      `json:"creator_uid,omitempty"`      // 创建用户ID
	CreatorName    string                      `json:"creator_name,omitempty"`     // 创建用户名称
	UpdatedAt      int64                       `json:"updated_at"`                 // 更新时间戳
	UpdaterUID     string                      `json:"updater_uid,omitempty"`      // 更新用户ID
	UpdaterName    string                      `json:"updater_name,omitempty"`     // 更新用户名称
	DeletedAt      int64                       `json:"deleted_at,omitempty"`       // 删除时间戳
	DeleteUID      string                      `json:"delete_uid,omitempty"`       // 删除用户ID
	DeleteName     string                      `json:"delete_name,omitempty"`      // 删除用户名称
	Source         int8                        `json:"source"`                     // 数据来源 1 认知平台自动创建 2 人工创建
	TableType      int8                        `json:"table_type,omitempty"`       // 库表类型 1 贴源表 2 标准表
	CurrentVersion *int8                       `json:"current_version,omitempty"`  // 是否先行版本 0 否 1 是
	PublishFlag    *int8                       `json:"publish_flag,omitempty"`     // 是否发布到超市 (1 是 ; 0 否)
	DataKindFlag   *int8                       `json:"data_kind_flag,omitempty"`   // 基础信息分类是否智能推荐 (1 是 ; 0 否)
	LabelFlag      *int8                       `json:"label_flag,omitempty"`       // 标签是否智能推荐 (1 是 ; 0 否)
	SrcEventFlag   *int8                       `json:"src_event_flag,omitempty"`   // 来源业务场景是否智能推荐 (1 是 ; 0 否)
	RelEventFlag   *int8                       `json:"rel_event_flag,omitempty"`   // 关联业务场景是否智能推荐 (1 是 ; 0 否)
	SystemFlag     *int8                       `json:"system_flag,omitempty"`      // 关联信息系统是否智能推荐 (1 是 ; 0 否)
	RelCatalogFlag *int8                       `json:"rel_catalog_flag,omitempty"` // 关联目录是否智能推荐 (1 是 ; 0 否)
	PublishedAt    int64                       `json:"published_at,omitempty"`     // 上线发布时间戳
	IsIndexed      int8                        `json:"is_indexed"`                 // 是否已建ES索引，0 否 1 是，默认为0
	AuditAdvice    string                      `json:"audit_advice"`               // 审核意见
	AuditState     int                         `json:"audit_state"`                // 审核状态，1 审核中  2 通过  3 驳回
	OwnerID        string                      `json:"owner_id"`                   // 目录owner_id
	OwnerName      string                      `json:"owner_name"`                 // 目录owner_name
	GroupPath      []*common.TreeBase          `json:"group_path"`                 // 资源分类路径
	Infos          []*response.InfoItem        `json:"infos"`                      // 关联信息
	MountResources []*MountResourceItem        `json:"mount_resources"`            // 挂接资源
	Columns        []*model.TDataCatalogColumn `json:"columns"`                    // 关联信息项
}

// DataCatalogDetailCommonResp 数据目录公共详情返回
type DataCatalogDetailCommonResp struct {
	ID                  uint64                             `json:"id,string"`            // 数据目录id
	Name                string                             `json:"name"`                 // 数据目录名称
	Code                string                             `json:"code"`                 // 数据目录编码
	PreviewCount        int64                              `json:"preview_count"`        // 预览量
	ApplyCount          int64                              `json:"apply_count"`          // 申请数
	Description         string                             `json:"description"`          // 数据目录描述
	ComprehensionStatus int8                               `json:"comprehension_status"` // 绑定的理解状态
	ResType             int8                               `json:"res_type"`             // 挂接资源类型 1逻辑视图 2 接口
	ResID               string                             `json:"res_id"`               // 挂接资源ID
	ResName             string                             `json:"res_name"`             // 挂接资源名称
	Mounts              []*model.TDataCatalogResourceMount `json:"mounts"`
	Permissions         []*auth_service.Permission         `json:"permissions"`
}

// DataCatalogDetailBasicInfoResp 数据目录基本信息返回
type DataCatalogDetailBasicInfoResp struct {
	//基本属性
	ID                 uint64               `json:"id,string"`                // 数据目录id
	Name               string               `json:"name"`                     // 数据目录名称
	ResourceType       int8                 `json:"resource_type"`            // 资源类型
	Certificated       bool                 `json:"certificated"`             // 是否已认证
	CompletionRatio    float32              `json:"completion_ratio"`         // 完成度，区间为[0,100]
	Code               string               `json:"code"`                     // 数据目录编码
	Infos              []*response.InfoItem `json:"infos"`                    // 关联信息-仅返回关联信息系统和标签和业务对象
	UpdateCycle        int32                `json:"update_cycle,omitempty"`   // 更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	CreatedAt          int64                `json:"created_at"`               // 数据起始时间戳
	UpdatedAt          int64                `json:"updated_at"`               // 数据更新时间戳
	PublishedAt        *time.Time           `json:"published_at"`             // 目录表-上线发布时间
	ScoreCount         int64                `json:"score_count"`              // 评分数
	SharedMode         int8                 `json:"shared_mode,omitempty"`    // 共享方式 1 共享平台方式 2 邮件方式 3 介质方式
	SharedType         int8                 `json:"shared_type"`              // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition    string               `json:"shared_condition"`         // 共享条件
	OpenType           int8                 `json:"open_type,omitempty"`      // 开放属性 1 向公众开放 2 不向公众开放
	OpenCondition      string               `json:"open_condition,omitempty"` // 开放条件
	Source             int8                 `json:"source"`                   // 数据来源 1 认知平台自动创建 2 人工创建
	BusinessObjectPath []*common.BOPathItem `json:"business_object_path"`     // 业务对象路径
	FormViewID         string               `json:"form_view_id"`             // 数据表视图ID
	common_model.SubjectInfo
	common_model.DepartmentInfo
	common_model.InfoSystemInfo
}

/* 数据目录基本信息返回去掉的一些属性
Description     string      `json:"description,omitempty"`  // 数据目录描述
RowCount            int64       `json:"row_count"`              // 数据量
PreviewCount        int64       `json:"preview_count"`          // 预览量
ApplyCount          int64       `json:"apply_count"`            // 申请数*/

type ColumnListItem struct {
	ID            uint64 `json:"id,string"`          // 字段ID
	TechnicalName string `json:"technical_name"`     // 技术名称
	BusinessName  string `json:"business_name"`      // 业务名称
	DataFormat    *int32 `json:"data_format,string"` // 数据类型
	DataLength    *int32 `json:"data_length,string"` // 数据长度
	DataPrecision *int32 `json:"data_precision"`     // 数据精度
	BusinessDef   string `json:"business_def"`       // 业务定义
	BusinessRule  string `json:"business_rule"`      // 业务规则
	AIDescription string `json:"ai_description"`     // 字段AI理解描述
	PrimaryFlag   int16  `json:"primary_flag"`       // 是否主键(1 是 ; 0 否)
}

type SearchRespParam struct {
	Entries             []*SearchSummaryInfo `json:"entries"`
	TotalCount          int64                `json:"total_count"`
	StatisticsRespParam                      // 统计信息，只有当请求query参数中statistics为true且请求body参数中next_flag字段为空时，才会返回该参数
	NextFlag            []string             `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type SearchSummaryInfo struct {
	ID                models.ModelID              `json:"id"`                                             // 数据目录ID
	Code              string                      `json:"code"`                                           // 数据目录编码
	Title             string                      `json:"title"`                                          // 数据目录名称，可能存在高亮标签
	RawTitle          string                      `json:"raw_title"`                                      // 数据目录名称，不会存在高亮标签
	Description       string                      `json:"description"`                                    // 数据目录描述，可能存在高亮标签
	RawDescription    string                      `json:"raw_description"`                                // 数据目录描述，不会存在高亮标签
	ResourceName      int8                        `json:"resource_name"`                                  // 资源名称
	SubjectInfo       []*common_model.SubjectInfo `json:"subject_info"`                                   // 所属主题
	DataRange         *int                        `json:"data_range,omitempty"`                           // 数据范围
	UpdateCycle       *int                        `json:"update_cycle,omitempty"`                         // 更新频率
	SharedType        int                         `json:"shared_type"`                                    // 共享条件
	OrgCode           string                      `json:"orgcode"`                                        // 组织架构ID
	OrgName           string                      `json:"orgname"`                                        // 组织架构名称
	RawOrgName        string                      `json:"raw_orgname"`                                    // 组织架构名称
	GroupID           string                      `json:"group_id"`                                       // 资源分类ID
	TableRows         *int64                      `json:"table_rows,omitempty"`                           // 数据量
	DataUpdatedAt     *int64                      `json:"updated_at,omitempty"`                           // 数据更新时间
	PublishedAt       int64                       `json:"published_at"`                                   // 上线发布时间
	InfoSystemName    string                      `json:"system_name"`                                    // 信息系统名称
	RawInfoSystemName string                      `json:"raw_system_name"`                                // 信息系统名称
	InfoSystemID      string                      `json:"system_id"`                                      // 信息系统ID
	DataSourceName    string                      `json:"data_source_name,omitempty" binding:"omitempty"` // 数据源名称，可能存在高亮标签
	RawDataSourceName string                      `json:"raw_data_source_name"`                           // 原始数据源名称，不会存在高亮标签
	DataSourceID      string                      `json:"data_source_id,omitempty" binding:"omitempty"`   // 数据源ID
	SchemaName        string                      `json:"schema_name,omitempty" binding:"omitempty"`      // schema名称，可能存在高亮标签
	RawSchemaName     string                      `json:"raw_schema_name"`                                // 原始schema名称，不会存在高亮标签
	SchemaID          string                      `json:"schema_id,omitempty" binding:"omitempty"`        // schema ID
	OwnerName         string                      `json:"owner_name"`                                     // 数据Owner名称
	RawOwnerName      string                      `json:"raw_owner_name"`                                 // 原始数据Owner名称，不会存在高亮标签
	OwnerID           string                      `json:"owner_id"`                                       // 数据OwnerID
	Fields            []basic_search.Field        `json:"fields"`
	// 当前用户被授权允许对此数据目录对应的逻辑视图执行的动作
	Actions []auth_service.PolicyAction `json:"actions,omitempty"`
}

type IDNameEntity struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type StatisticsRespParam struct {
	Statistics *statisticsInfo `json:"statistics,omitempty"` // 统计信息
}

type statisticsInfo struct {
	DataKindCount map[int64]int64 `json:"data_kind_count" example:"1:11,2:22"` // 基础信息分类各个类别对应的数量
	// DataRangeCount   map[int64]int64 `json:"data_range_count" example:"1:11,2:22"`   // 数据范围分类各个类别对应的数量
	UpdateCycleCount map[int64]int64 `json:"update_cycle_count" example:"1:11,2:22"` // 更新频率分类各个类别对应的数量
	SharedTypeCount  map[int64]int64 `json:"shared_type_count" example:"1:11,2:22"`  // 共享条件分类各个类别对应的数量
}

// 搜索结果
type SearchResult struct {
	// 数据资源列表
	Entries []DataCatalogSearchResp `json:"entries"`
	// 总数量
	TotalCount int64 `json:"total_count"`
	// 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}
type DataCatalogSearchResp struct {
	fcommon.SearchResultEntry
	DataRange   int    `json:"data_range,omitempty"`      // 数据范围
	UpdateCycle int    `json:"update_cycle,omitempty"`    // 更新频率
	SharedType  int    `json:"shared_type"`               // 共享条件
	FavorID     uint64 `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored   bool   `json:"is_favored"`                // 是否已收藏
	//QualityScore   string `json:"quality_score"`             // 质量评分
	UpdateTime     int64 `json:"update_time"`      // 目录更新时间
	DataUpdateTime int64 `json:"data_update_time"` // 数据更新时间
	ApplyNum       int   `json:"apply_num"`        // 申请量
	//Visits       int    `json:"visits"`                    // 目录访问量
	data_view.DimensionScores      //评分
	HasQualityReport          bool `json:"has_quality_report"` // 是否存在质量报告（可用性标识）

}

// 根据 basic-search 的响应生成搜索结果
//
//	 input
//		user: 发起请求的用户信息，可能为 nil
func (d *DataCatalogDomain) newSearchResult(ctx context.Context, user *middleware.User, myFavoriteRepo my_favorite.Repo, resp *basic_search.SearchDataRescoureseCatalogResp) (result *SearchResult, err error) {

	result = &SearchResult{NextFlag: resp.NextFlag}

	cids := make([]string, 0, len(resp.Entries))
	vids := make([]string, 0)
	cidVidMap := make(map[string]string)
	cid2idx := make(map[string]int, len(resp.Entries))
	for i := range resp.Entries {
		result.Entries = append(result.Entries, DataCatalogSearchResp{
			SearchResultEntry: fcommon.SearchResultEntry{
				ID:                 string(resp.Entries[i].ID),
				RawName:            resp.Entries[i].RawName,
				Name:               resp.Entries[i].Name,
				RawCode:            resp.Entries[i].RawCode,
				Code:               resp.Entries[i].Code,
				RawDescription:     resp.Entries[i].RawDescription,
				Description:        resp.Entries[i].Description,
				FieldCount:         len(resp.Entries[i].Fields),
				Fields:             newFields(resp.Entries[i].Fields),
				PublishedAt:        resp.Entries[i].PublishedAt,
				IsPublish:          resp.Entries[i].IsPublish,
				IsOnline:           resp.Entries[i].IsOnline,
				OnlineAt:           resp.Entries[i].OnlineAt,
				PublishedStatus:    common.DataResourceCatalogPublishStatus(resp.Entries[i].PublishedStatus),
				OnlineStatus:       common.DataResourceCatalogOnlineStatus(resp.Entries[i].OnlineStatus),
				SubjectInfo:        resp.Entries[i].BusinessObjects,
				CateInfo:           resp.Entries[i].CateInfos,
				MountDataResources: resp.Entries[i].MountDataResources,

				DataResourceType: newDataResourceType(resp.Entries[i].MountDataResources),
			},
			DataRange:      resp.Entries[i].DataRange,
			UpdateTime:     resp.Entries[i].UpdatedAt,
			DataUpdateTime: resp.Entries[i].DataUpdatedAt,
			UpdateCycle:    resp.Entries[i].UpdateCycle,
			SharedType:     resp.Entries[i].SharedType,
			ApplyNum:       resp.Entries[i].ApplyNum,
		})
		cids = append(cids, result.Entries[i].ID)
		cid2idx[result.Entries[i].ID] = i
		for _, resource := range resp.Entries[i].MountDataResources {
			if resource.DataResourcesType == "data_view" && len(resource.DataResourcesIdS) > 0 {
				viewID := resource.DataResourcesIdS[0]
				if viewID != "" {
					vids = append(vids, viewID)
					cidVidMap[result.Entries[i].ID] = viewID
				}
			}
		}
	}
	reportMap := make(map[string]*data_view.BatchExploreReportItem)
	if len(vids) > 0 {
		batchGetExploreReport, err := d.dataView.BatchGetExploreReport(ctx, &data_view.BatchGetExploreReportReq{IDs: vids})
		if err != nil {
			log.WithContext(ctx).Warnf("BatchGetExploreReport failed: %v, vids: %v", err, vids)
		} else if batchGetExploreReport != nil {
			for _, report := range batchGetExploreReport.Reports {
				// 修复4: 检查report和FormViewID是否有效
				if report != nil && report.FormViewID != "" {
					reportMap[report.FormViewID] = report
				}
			}
		}
	}
	// 修复5: 只有在用户登录时才查询收藏状态，并过滤空字符串
	if len(cids) > 0 && user != nil && user.ID != "" {
		// 过滤掉空字符串，避免传入SQL查询
		validCids := make([]string, 0, len(cids))
		for _, cid := range cids {
			if cid != "" {
				validCids = append(validCids, cid)
			}
		}
		if len(validCids) > 0 {
			var (
				favoredRIDs []*my_favorite.FavorIDBase
			)
			if favoredRIDs, err = myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx,
				user.ID, validCids, my_favorite.RES_TYPE_DATA_CATALOG); err != nil {
				log.WithContext(ctx).Errorf("myFavoriteRepo.FilterFavoredRIDS failed: %v", err)
				return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
			}
			for i := range favoredRIDs {
				// 修复6: 检查cid2idx中是否存在该key，避免访问不存在的map key
				if idx, exists := cid2idx[favoredRIDs[i].ResID]; exists {
					result.Entries[idx].IsFavored = true
					result.Entries[idx].FavorID = favoredRIDs[i].ID
				}
			}
		}
	}
	// 修复7: 添加完整的nil检查和map访问检查，避免nil pointer dereference
	for i := range result.Entries {
		vid, hasVid := cidVidMap[result.Entries[i].ID]
		if hasVid && vid != "" {
			if r, exist := reportMap[vid]; exist {
				result.Entries[i].HasQualityReport = r.HasQualityReport
				if r != nil && r.Report != nil && r.Report.Overview != nil {
					result.Entries[i].DimensionScores = r.Report.Overview.DimensionScores
				}
			}
		}
	}

	result.TotalCount = resp.TotalCount
	return
}

func newFields(fields []basic_search.Field) []fcommon.Field {
	var result []fcommon.Field

	for i := 0; i < len(fields); i++ {
		result = append(result, fcommon.Field{
			RawFieldNameEN: fields[i].RawFieldNameEN,
			FieldNameEN:    fields[i].FieldNameEN,
			RawFieldNameZH: fields[i].RawFieldNameZH,
			FieldNameZH:    fields[i].FieldNameZH,
		})
	}

	return result
}

func newDataResourceType(md []*basic_search.MountDataResources) (dataResourceType int) {

	if len(md) > 0 {
		dataResourceType = common.TypeMap[common.DataResourceType(md[0].DataResourcesType)]
	}
	return
}

type Asset struct {
	AssetType string `json:"asset_type" example:"data-catalog,interface-svc"` // 资产类型

	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Explanation []string `json:"explanation"` // 解释
}

////////////////////////////// SubGraph //////////////////////////////

type SubGraphRespParam struct {
	Root *GraphNode `json:"graph"` // 图谱
}

type GraphNode struct {
	EntityType string `json:"entity_type"` // 实体类型，圆圈中的名称
	VID        string `json:"vid"`         // 实体的id属性
	Name       string `json:"name"`        // 实体的name属性，圆圈下的名称，有高亮标签
	RawName    string `json:"raw_name"`    // 实体的name属性，圆圈下的名称，不会有高亮标签
	Color      string `json:"color"`       // 实体节点颜色

	Children []*GraphNode `json:"children"` // 当前节点的子节点
	Relation string       `json:"relation"` // 当前节点与子节点关系
}
