package common

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"

	jsoniter "github.com/json-iterator/go"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"gopkg.in/fatih/set.v0"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

const (
	DEFAULT_LIMIT        = 100
	DEFAULT_PARALLEL_NUM = 5
)

const (
	RES_TYPE_VIEW = iota + 1 // 挂接资源类型：逻辑视图
	RES_TYPE_API             // 挂接资源类型：接口
)

const (
	INFO_TYPE_LABEL           = iota + 1 // 关联信息类型：标签
	INFO_TYPE_SOURCE_EVENT               // 关联信息类型：来源业务场景
	INFO_TYPE_RELATED_EVENT              // 关联信息类型：关联业务场景
	INFO_TYPE_RELATED_SYSTEM             // 关联信息类型：关联信息系统
	INFO_TYPE_TABLE_FIELD                // 关联信息类型：关联目录及信息项
	INFO_TYPE_BUSINESS_DOMAIN            // 关联主题对象类型：关联主题域或业务对象/活动或逻辑实体
)

const (
	SHARE_TYPE_NO_CONDITION = iota + 1 // 共享属性：无条件共享
	SHARE_TYPE_CONDITION               // 共享属性：有条件共享
	SHARE_TYPE_NOT_SHARED              // 共享属性：不允许共享
)

const (
	OPEN_TYPE_OPEN     = iota + 1 // 开放属性：向公众开放
	OPEN_TYPE_NOT_OPEN            // 开放属性：不向公众开放
)

const (
	SHARE_MODE_PLATFORM = iota + 1 // 共享方式：共享平台方式
	SHARE_MODE_EMAIL               // 共享方式：邮件方式
	SHARE_MODE_MEDIUM              // 共享方式：介质方式
)

const (
	SOURCE_ANYFABRIC   = iota + 1 // 调用来源：认知平台自动调用
	SOURCE_CATALOG_WEB            // 调用来源：数据资源目录页面调用
)

const (
	TABLE_TYPE_BUSINESS = iota + 1 // 表类型：业务表
	TABLE_TYPE_ODS                 // 表类型：贴源表
)

const (
	AUDIT_FLOW_TYPE_ONLINE  = iota + 1 // 上线
	AUDIT_FLOW_TYPE_CHANGE             // 变更
	AUDIT_FLOW_TYPE_OFFLINE            // 下线
	AUDIT_FLOW_TYPE_PUBLISH            // 发布
)

const (
	CATALOG_STATUS_DRAFT     = 1 // 草稿
	CATALOG_STATUS_PUBLISHED = 3 // 已发布
	CATALOG_STATUS_ONLINE    = 5 // 已上线
	CATALOG_STATUS_OFFLINE   = 8 // 已下线
)

const (
	CATALOG_AUDIT_STATUS_UNDER_REVIEW = iota + 1 // 审核中
	CATALOG_AUDIT_STATUS_PASS                    // 通过
	CATALOG_AUDIT_STATUS_REJECT                  // 驳回
)

const (
	AUDIT_RESULT_PASS   = "pass"
	AUDIT_RESULT_REJECT = "reject"
	AUDIT_RESULT_UNDONE = "undone"
)

const (
	DOWNLOAD_ACCESS_AUDIT_RESULT_UNDER_REVIEW = iota + 1 // 审核中
	DOWNLOAD_ACCESS_AUDIT_RESULT_PASS                    // 审核通过
	DOWNLOAD_ACCESS_AUDIT_RESULT_REJECT                  // 审核不通过
)

const (
	CHECK_DOWNLOAD_ACCESS_RESULT_UNAUTHED     = iota + 1 // 无权限下载
	CHECK_DOWNLOAD_ACCESS_RESULT_UNDER_REVIEW            // 审核中
	CHECK_DOWNLOAD_ACCESS_RESULT_AUTHED                  // 有下载权限
)

const (
	CATALOG_COL_TYPE_INT       = iota // 数字型
	CATALOG_COL_TYPE_STRING           // 字符型
	CATALOG_COL_TYPE_DATE             // 日期型
	CATALOG_COL_TYPE_DATETIME         // 日期时间型
	CATALOG_COL_TYPE_TIMESTAMP        // 时间戳型
	CATALOG_COL_TYPE_BOOL             // 布尔型
	CATALOG_COL_TYPE_BINARY           // 二进制
	CATALOG_COL_TYPE_OTHER     = 99   // 其他类型（合法）
)

// RedisCachePrefix 缓存在redis的样例数据前缀
const RedisCachePrefix = "sample_data:"

// GetCacheRedisKey 生成redis保存时的key值
func GetCacheRedisKey(catalogIDStr string) string {
	return RedisCachePrefix + catalogIDStr
}

// SliceToSet 切片转集合
func SliceToSet(slice []string) set.Interface {
	mySet := set.New(set.NonThreadSafe)
	for _, item := range slice {
		mySet.Add(item)
	}
	return mySet
}

func GenAuditApplyID(id uint64, applySN uint64) string {
	return fmt.Sprintf("%d-%016d", id, applySN)
}

func ParseAuditApplyID(auditApplyID string) (uint64, uint64, error) {
	strs := strings.Split(auditApplyID, "-")
	if len(strs) != 2 {
		return 0, 0, errors.New("audit apply id format invalid")
	}

	var applySN uint64
	id, err := strconv.ParseUint(strs[0], 10, 64)
	if err == nil {
		applySN, err = strconv.ParseUint(strs[1], 10, 64)
	}
	return id, applySN, err
}

type TableInfo struct {
	ID                 uint64         `json:"id,string"`
	Name               string         `json:"name"`                  // 表名称
	DataSourceType     int8           `json:"data_source_type"`      // 数据源类型
	DataSourceTypeName string         `json:"data_source_type_name"` // 数据源类型名称
	DataSourceID       string         `json:"data_source_id"`        // 数据源ID
	DataSourceName     string         `json:"data_source_name"`      // 数据源名称
	SchemaID           string         `json:"schema_id"`             // schema ID
	SchemaName         string         `json:"schema_name"`           // schema名称
	RowNum             int64          `json:"table_rows,string"`
	AdvancedParams     string         `json:"advanced_params"`
	AdvancedDataSlice  []AdvancedData `json:"advanced_data_slice"`
	CreateTime         int64          `json:"create_time_stamp,string"`
	UpdateTime         int64          `json:"update_time_stamp,string"`
}

type AdvancedData struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

var client = trace.NewOtelHttpClient()

/*func GetDataSourceCatalogName(ctx context.Context, advParams string) string {
	log.WithContext(ctx).Infof("metadata table adv params: %s", advParams)
	advs := make([]struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}, 0)
	if err := json.Unmarshal([]byte(advParams), &advs); err != nil {
		log.WithContext(ctx).Errorf("failed to json unmarshal, adv params: %s, err: %v", advParams, err)
		return ""
	}

	for _, adv := range advs {
		if adv.Key == "vCatalogName" {
			return adv.Value
		}
	}

	return ""
}
*/
/*
// GetTableInfo tableIDs的个数超过500在性能测试中总是报错
func GetTableInfo(ctx context.Context, tableIDs []uint64) ([]*TableInfo, error) {
	val := url.Values{}
	val.Add("ids", util.CombineToString(tableIDs, ","))
	val.Add("offset", "1")
	val.Add("limit", "1000")

	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.MetaDataMgmHost+"/api/metadata-manage/v1/table", nil, val)
	if err != nil {
		return nil, err
	}

	var tables struct {
		Data []*TableInfo `json:"data"`
	}
	if err = json.Unmarshal(buf, &tables); err != nil {
		return nil, err
	}
	for _, data := range tables.Data {
		if data.AdvancedParams != "" {
			if err := json.Unmarshal([]byte(data.AdvancedParams), &data.AdvancedDataSlice); err != nil {
				log.WithContext(ctx).Error(err.Error())
			}
		}
	}
	return tables.Data, nil
}
*/

func DatakindToArray(dataKind int32) []int32 {
	var val int32
	array := make([]int32, 0, 6)
	for i := 0; i < 6 && dataKind >= 1<<i; i++ {
		val = dataKind & (1 << i)
		if val > 0 {
			array = append(array, val)
		}
	}
	return array
}

// func CatalogPropertyCheck(catalog *model.TDataCatalog) error {
// 	if catalog.PublishFlag == nil || (catalog.PublishFlag != nil && *catalog.PublishFlag == 0) {
// 		return errorcode.Detail(errorcode.ResourcePublishDisabled, "资源已取消发布")
// 	}
// 	if catalog.SharedType == 3 {
// 		return errorcode.Detail(errorcode.ResourceShareDisabled, "资源未开放共享")
// 	}
// 	// if catalog.OpenType == 2 {
// 	// 	return errorcode.Detail(errorcode.ResourceOpenDisabled, "资源未向公众开放")
// 	// }
// 	return nil
// }

func CatalogPropertyCheckV1(catalog *model.TDataCatalog) error {
	// 目录不是为上线状态
	if catalog.OnlineStatus != constant.LineStatusOnLine {
		return errorcode.Detail(errorcode.AssetOfflineError, "资产已下线")
	}

	// if catalog.State != CATALOG_STATUS_ONLINE ||
	// 	catalog.PublishFlag == nil ||
	// 	(catalog.PublishFlag != nil && *catalog.PublishFlag == 0) {
	// 	return errorcode.Detail(errorcode.ResourcePublishDisabled, "资源已取消发布")
	// }
	// if catalog.SharedType == 3 {
	// 	return errorcode.Detail(errorcode.ResourceShareDisabled, "资源未开放共享")
	// }
	// if catalog.OpenType == 2 {
	// 	return errorcode.Detail(errorcode.ResourceOpenDisabled, "资源未向公众开放")
	// }
	return nil
}

type BOPathItem struct {
	ObjectID string `json:"id"`        // 业务对象或逻辑实体ID，uuid
	Name     string `json:"name"`      // 业务对象或逻辑实体名称
	PathID   string `json:"path_id"`   // ID path
	PathName string `json:"path_name"` // Name path
	Type     int    `json:"type"`      // 节点的类型，比如主题域，业务对象，业务活动，逻辑实体
}

func GetPathByBusinessDomainID(ctx context.Context, businessDomainIDs []string) ([]*BOPathItem, error) {
	header := http.Header{
		"Content-Time":  []string{"application/json"},
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	val := url.Values{}
	val.Add("ids", util.CombineToString(businessDomainIDs, ","))
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.DataSubjectHost+"/api/data-subject/v1/subject-domain/object-entity/path", header, val)
	if err != nil {
		return nil, err
	}

	var pathInfo struct {
		PathInfo []*BOPathItem `json:"path_info"`
	}
	if err = json.Unmarshal(buf, &pathInfo); err != nil {
		return nil, err
	}

	var retPaths []*BOPathItem

	for i := range pathInfo.PathInfo {
		ids := strings.Split(pathInfo.PathInfo[i].PathID, "/")
		names := strings.Split(pathInfo.PathInfo[i].PathName, "/")
		// 因为目前数据目录既可以勾选主题域或业务对象/活动也可以勾选逻辑实体，即L2和L3和L4都可以选择
		if (len(ids) == 2 && len(names) == 2) || (len(ids) == 3 && len(names) == 3) || (len(ids) == 4 && len(names) == 4) {
			retPaths = append(retPaths, pathInfo.PathInfo[i])
			continue
		}
		return nil, errors.New("business object path format error")
	}

	return retPaths, nil
}

func GetPath(ctx context.Context, businessDomainIDs []string, token string) ([]*PathInfo, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	//params := map[string][]string{"ids": businessDomainIDs}
	//buf, err := json.Marshal(params)
	//if err != nil {
	//	return nil, err
	//}
	//
	//buf, err = util.DoHttpPost(settings.GetConfig().DepServicesConf.GlossaryServiceHost+"/api/glossary-service/v1/glossary/uuid/path", header, bytes.NewReader(buf))
	//if err != nil {
	//	return nil, err
	//}

	val := url.Values{}
	val.Add("ids", util.CombineToString(businessDomainIDs, ","))
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.DataSubjectHost+"/api/data-subject/v1/subject-domain/object-entity/path", header, val)
	if err != nil {
		return nil, err
	}

	var resp struct {
		//Paths [][]*BusinessObjectPathItem `json:"entries"`
		Paths []*PathInfo `json:"path_info"`
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		return nil, err
	}
	return resp.Paths, nil
}

type BusinessDomain struct {
	ID       string            `json:"object_id"`
	Level    int               `json:"level"`
	Children []*BusinessDomain `json:"children"`
}

type PathInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	PathID   string `json:"path_id"`
	PathName string `json:"path_name"`
}

func GetAllSubNodesByID(ctx context.Context, businessDomainID string) ([]string, error) {

	headers := http.Header{
		"Content-Time":  []string{"application/json"},
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	val := url.Values{}
	val.Add("parent_id", businessDomainID)
	val.Add("limit", "2000")
	val.Add("is_all", "true")
	val.Add("type", util.CombineToString([]string{"subject_domain_group", "subject_domain", "business_object", "business_activity", "logic_entity"}, ","))

	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.DataSubjectHost+"/api/data-subject/v1/subject-domains", headers, val)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get business-domains err info: %v", err.Error())
		return []string{}, nil
	}
	log.WithContext(ctx).Infof("get business-domains resp: %v", string(buf))
	res := &struct {
		Entries []*GlossaryNode `json:"entries"`
	}{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, err
	}
	result := lo.Map(res.Entries, func(item *GlossaryNode, _ int) string {
		return item.ID
	})
	result = append(result, businessDomainID)
	return result, nil
}

func getBusinessDomainIDList(businessDomainID string, nodes []*BusinessDomain) []string {
	var ids []string
	bd := nodeSearch(businessDomainID, nodes)
	if bd != nil {
		ids = []string{bd.ID}
		ids = genNodeList(bd.Children, ids)
	}
	return ids
}

func genNodeList(nodes []*BusinessDomain, list []string) []string {
	for i := range nodes {
		list = append(list, nodes[i].ID)
		list = genNodeList(nodes[i].Children, list)
	}
	return list
}

func nodeSearch(businessDomainID string, nodes []*BusinessDomain) *BusinessDomain {
	list := make([]*BusinessDomain, 0)
	for i := range nodes {
		if nodes[i].ID == businessDomainID {
			return nodes[i]
		}

		list = append(list, nodes[i].Children...)
		if i == len(nodes)-1 {
			node := nodeSearch(businessDomainID, list)
			if node != nil {
				return node
			}
		}
	}
	return nil
}

type TreeBase struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	// Children []Tree `json:"children"`
}

type Tree struct {
	*TreeBase
	Children []*Tree `json:"children"`
}

type Trees struct {
	Trees []*Tree `json:"entries"`
}

func TreeToArray(trees []*Tree, ids set.Interface) {
	for i := range trees {
		ids.Add(trees[i].ID)
		if len(trees[i].Children) > 0 {
			TreeToArray(trees[i].Children, ids)
		}
	}
}

func getSubNodeFromCatagory(ctx context.Context, categoryID string) (*Trees, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	val := url.Values{}
	if len(categoryID) > 0 {
		val.Add("node_id", categoryID)
	}
	val.Add("recursive", "true")
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.DataCatalogHost+"/api/data-catalog/frontend/v1/trees/nodes", header, val)
	if err != nil {
		return nil, err
	}

	trees := &Trees{}
	if err = json.Unmarshal(buf, trees); err != nil {
		return nil, err
	}
	return trees, nil
}

func GetSubNodeByCategoryID(ctx context.Context, categoryID string) ([]string, error) {
	trees, err := getSubNodeFromCatagory(ctx, categoryID)
	if err != nil {
		return nil, err
	}

	ids := set.New(set.NonThreadSafe)
	ids.Add(categoryID)
	TreeToArray(trees.Trees, ids)
	return set.StringSlice(ids), nil
}

func GetCategoryPath(ctx context.Context, categoryID string) ([]*TreeBase, error) {
	trees, err := getSubNodeFromCatagory(ctx, "")
	if err != nil {
		return nil, err
	}
	var path []*TreeBase
	return categoryPathSearch(categoryID, trees.Trees, path), nil
}

func categoryPathSearch(categoryID string, trees []*Tree, path []*TreeBase) []*TreeBase {
	for i := range trees {
		path = append(path, trees[i].TreeBase)
		if trees[i].ID == categoryID {
			return path
		} else if len(trees[i].Children) > 0 {
			depth := len(path)
			path = categoryPathSearch(categoryID, trees[i].Children, path)
			if len(path) > depth {
				return path
			}
		}
		path = path[:len(path)-1]
	}
	return path
}

func GetSubNodeByOrgCode(ctx context.Context, userOrgCodes ...string) ([]string, error) {
	if len(userOrgCodes) < 1 {
		return nil, nil
	}

	ch := make(chan interface{}, 1)
	defer close(ch)
	cc, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	f := func(orgcode string, ch chan<- interface{}) {
		defer func() {
			recover()
		}()
		val := url.Values{
			"type": []string{"domain,district,organization,department"},
			"id":   []string{orgcode},
		}
		buf, err := util.DoHttpGet(ctx, settings.GetConfig().ConfigCenterHost+"/api/configuration-center/v1/objects/internal", nil, val)
		if err != nil {
			ch <- err
			return
		}

		var trees struct {
			Entries []TreeBase `json:"entries"`
		}
		if err = json.Unmarshal(buf, &trees); err != nil {
			ch <- err
			return
		}
		ids := set.New(set.NonThreadSafe)
		ids.Add(orgcode)
		for i := range trees.Entries {
			ids.Add(trees.Entries[i].ID)
		}
		ch <- ids
	}

	for i := range userOrgCodes {
		go f(userOrgCodes[i], ch)
	}

	sets := make([]set.Interface, len(userOrgCodes))
	retCount := 0
	var ret interface{}
	retProc := func(ret interface{}, idx *int) error {
		switch r := ret.(type) {
		case error:
			return r
		case set.Interface:
			sets[*idx] = r
			*idx += 1
		}
		return nil
	}
	for retCount < len(userOrgCodes) {
		select {
		case <-cc.Done():
			return nil, ctx.Err()
		case ret = <-ch:
			if err := retProc(ret, &retCount); err != nil {
				return nil, err
			}
		}
	}

	var ids set.Interface
	switch len(userOrgCodes) {
	case 1:
		ids = sets[0]
	case 2:
		ids = set.Union(sets[0], sets[1])
	default:
		ids = set.Union(sets[0], sets[1], sets[2:]...)
	}
	return set.StringSlice(ids), nil
}

type FieldSubReqItem struct {
	Field       string `json:"field"`
	ChineseName string `json:"chinese_name"`
	Sensitive   int8   `json:"sensitive"`
	Classified  int8   `json:"classified"`
	FieldType   string `json:"field_type"`
}

// GetConfigCenterValueByKey 读取配置中心某个key的值
func GetConfigCenterValueByKey(ctx context.Context, keyParam string) (string, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	val := url.Values{
		"key": []string{keyParam},
	}

	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.ConfigCenterHost+"/api/configuration-center/v1/config-value", header, val)
	if err != nil {
		return "", err
	}

	var res struct {
		Value string `json:"value"`
	}
	if err = json.Unmarshal(buf, &res); err != nil {
		return "", err
	}

	return res.Value, nil
}

// GetMaskingSqlByRequest 请求数据脱敏接口得到脱敏后的sql
func GetMaskingSqlByRequest(ctx context.Context, fieldSubReqItems []*FieldSubReqItem, tableName string) (string, error) {
	params := map[string]interface{}{
		"fields":     fieldSubReqItems,
		"table_name": tableName,
	}
	buf, err := json.Marshal(params)
	if err != nil {
		return "", err
	}
	log.WithContext(ctx).Infof("DataMasking数据脱敏接口Body请求体json====%s", string(buf))

	header := http.Header{
		"Content-Time": []string{"application/json"},
	}

	buf, err = util.DoHttpPost(ctx, settings.GetConfig().DepServicesConf.DataMaskingHost+"/api/data-security/v1/data-masking/sql-masking", header, bytes.NewReader(buf))
	if err != nil {
		log.WithContext(ctx).Errorf("DataMasking数据脱敏接口报错返回，err is: %v", err)
		return "", err
	}

	var resp struct {
		MaskedSql string `json:"masked_sql"`
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		return "", err
	}
	return resp.MaskedSql, nil
}

type GlossaryNode struct {
	ID string `json:"id"` // 雪花id
	//ParentID string `json:"parent_id"` // 雪花id
	//ObjectID string `json:"object_id"` // uuid
	//Level    uint8  `json:"level"`     // 节点所处层级，从0开始
	Name     string `json:"name"`
	NodeType string `json:"type"` // business_domain, subject_domain, business_object
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type GetGlossaryNodesRes struct {
	PageResult[GlossaryNode]
}

func GetGlossaryInfo(ctx context.Context, token string) ([]*GlossaryNode, int64, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	val := url.Values{}
	val.Add("limit", "2000")
	val.Add("is_all", "true")

	types := []string{"subject_domain_group", "subject_domain", "business_object", "business_activity"}
	val.Add("type", util.CombineToString(types, ","))

	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.DataSubjectHost+"/api/data-subject/v1/subject-domains", header, val)
	if err != nil {
		return nil, 0, err
	}
	res := &GetGlossaryNodesRes{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, 0, err
	}

	return res.Entries, res.TotalCount, nil
}

type GetProcessEntries struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type GetProcessRes struct {
	PageResult[GetProcessEntries]
}

func GetDomain(ctx context.Context, token string) ([]*GetProcessEntries, int64, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	val := url.Values{}
	val.Add("getall", "true")
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.BusinessGroomingHost+"/api/business-grooming/v1/domain/nodes", header, val)
	if err != nil {
		return nil, 0, err
	}
	res := &GetProcessRes{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, 0, err
	}

	return res.Entries, res.TotalCount, nil
}

type GetModelInfoEntries struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type GetModelInfoRes struct {
	PageResult[GetModelInfoEntries]
}

func GetModelInfo(ctx context.Context, modelId string, token string) ([]*GetModelInfoEntries, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	val := url.Values{}
	val.Add("limit", "2000")
	val.Add("getall", "false")
	val.Add("node_id", modelId)
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.BusinessGroomingHost+"/api/business-grooming/v1/domain/nodes/business-models", header, val)
	if err != nil {
		return nil, err
	}

	res := &GetModelInfoRes{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, err
	}
	return res.Entries, nil
}

func GetBusinessDomainCounts(ctx context.Context, token string) (*CountResp, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.BusinessGroomingHost+"/api/business-grooming/v1/business-domain/count", header, nil)
	if err != nil {
		return nil, err
	}
	res := &CountResp{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, err
	}
	return res, nil
}

type CountResp struct {
	BusinessDomainCount int32 `json:"level_business_domain"`
	SubjectDomainCount  int32 `json:"level_subject_domain"`
	BusinessObjectCount int32 `json:"level_business_object"`
}

type MainBusiness struct {
	MainBusinessID     string `json:"main_business_id"`     // 主干业务id
	BusinessModelID    string `json:"business_model_id"`    // 业务模型id
	Name               string `json:"name"`                 // 主干业务名称
	Description        string `json:"description"`          // 主干业务描述
	BusinessDomainID   string `json:"business_domain_id"`   // 业务域id
	BusinessDomainName string `json:"business_domain_name"` // 业务域名称
	SubjectDomainID    string `json:"subject_domain_id"`    // 主题域id
	SubjectDomainName  string `json:"subject_domain_name"`  // 主题域名称
	DepartmentID       string `json:"department_id"`        // 所属部门id
	DepartmentName     string `json:"department_name"`      // 所属部门名称
	DepartmentPath     string `json:"department_path"`      // 所属部门路径
	Type               string `json:"type"`                 // 对象类型
	CreatedAt          int64  `json:"created_at"`
	CreatedByUID       uint64 `json:"created_by_uid,omitempty"`
	CreatedBy          string `json:"created_by,omitempty"`
	UpdatedAt          int64  `json:"updated_at"`
	UpdatedByUID       uint64 `json:"updated_by_uid,omitempty"`
	UpdatedBy          string `json:"updated_by,omitempty"`
	FlowchartCount     int64  `json:"flowchart_count"` // 流程图数量
	FormCount          int64  `json:"form_count"`      // 业务表单数量
	IndicatorCount     int64  `json:"indicator_count"` // 指标数量
}

type MainBusinessResp struct {
	Entries    []*MainBusiness `json:"entries"`
	TotalCount int64           `json:"total_count"`
	Offset     int             `json:"offset,omitempty"`
	Limit      int             `json:"limit,omitempty"`
}

func GetMainBusinessInfo(ctx context.Context, businessDomainID, token string) ([]*MainBusiness, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	val := url.Values{}
	if len(businessDomainID) > 0 {
		val = url.Values{
			"id": []string{businessDomainID},
		}
	}
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.BusinessGroomingHost+"/api/business-grooming/v1/main-businesses", header, val)
	if err != nil {
		return nil, err
	}

	res := &MainBusinessResp{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, err
	}
	return res.Entries, nil
}

type TablesResp struct {
	Entries    []*StandardFormSummaryInfo `json:"entries"`
	TotalCount int64                      `json:"total_count"`
}

type StandardFormSummaryInfo struct {
	ID                  string             `json:"id"`
	Name                string             `json:"name"`
	Description         string             `json:"description"`
	Flowcharts          string             `json:"flowcharts"`
	DataRange           string             `json:"data_range"`
	SourceSystem        []InfoSystem       `json:"source_system"`
	BusinessModelId     string             `json:"-"`
	EditEnable          bool               `json:"edit_enable,omitempty"`
	UpdateCycle         string             `json:"update_cycle"`         // 更新周期，枚举值
	CollectionWarn      bool               `json:"collection_warn"`      // 采集模型的小红点提示，true提示
	ProcessingWarn      bool               `json:"processing_warn"`      // 加工模型的小红点提示
	CollectionPublished bool               `json:"collection_published"` // 采集是否发布过，true表示发布过
	ProcessingPublished bool               `json:"processing_published"` // 加工是否发布过，true表示发布过
	CreateBy            string             `json:"created_by"`
	CreateAt            int64              `json:"created_at"`
	UpdateBy            string             `json:"updated_by"`
	UpdateAt            int64              `json:"updated_at"`
	FieldStandardRate   *FieldStandardRate `json:"field_standard_rate,omitempty"`
}

type InfoSystem struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type FieldStandardRate struct {
	StandardFieldsCount int64 `json:"standard_fields_count"`
	FieldsCount         int64 `json:"fields_count"`
}

func GetBusinessFormStandardizedRateInfo(ctx context.Context, businessModelID, token string) (*FieldStandardRate, error) {
	header := http.Header{
		"Authorization": []string{token},
	}
	urlStr := settings.GetConfig().DepServicesConf.BusinessGroomingHost + "/api/business-grooming/v1/business-model/%s/forms"
	urlStr = fmt.Sprintf(urlStr, businessModelID)
	val := url.Values{
		"offset":    []string{"1"},
		"limit":     []string{"100"},
		"direction": []string{"desc"},
		"sort":      []string{"created_at"},
		"rate":      []string{"1"},
	}
	buf, err := util.DoHttpGet(ctx, urlStr, header, val)
	if err != nil {
		return nil, err
	}
	res := &TablesResp{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, err
	}
	info := new(FieldStandardRate)
	for _, form := range res.Entries {
		info.StandardFieldsCount += form.FieldStandardRate.StandardFieldsCount
		info.FieldsCount += form.FieldStandardRate.FieldsCount
	}
	return info, nil
}

type ObjectInfo struct {
	ID   string `json:"id" `  // 对象ID
	Name string `json:"name"` // 对象名称
	Type string `json:"type"` // 对象类型
	Path string `json:"path"` // 对象路径

	PathID string `json:"path_id"` // 对象ID路径
	Expand bool   `json:"expand"`  // 是否能展开
}

type QueryPageResp struct {
	Entries    []*ObjectInfo `json:"entries" binding:"required"`                      // 对象列表
	TotalCount int64         `json:"total_count" binding:"required,ge=0" example:"3"` // 当前筛选条件下的对象数量
}

func GetDepartmentInfo(ctx context.Context) ([]*ObjectInfo, error) {
	val := url.Values{
		"type":  []string{"department"},
		"limit": []string{"0"},
	}
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().ConfigCenterHost+"/api/configuration-center/v1/objects/internal", nil, val)
	if err != nil {
		return nil, err
	}
	res := &QueryPageResp{}
	if err = json.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	return res.Entries, nil
}

type AuditProcessDefinition struct {
	ID             string `json:"id"`
	Key            string `json:"key"`
	Name           string `json:"name"`
	Type           string `json:"type"`
	TypeName       string `json:"type_name"`
	CreateTime     string `json:"create_time"`
	CreateUserName string `json:"create_user_name"`
	TenantID       string `json:"tenant_id"`
	Effectivity    int    `json:"effectivity"` // 0 有效  1 无效
}

func GetAuditProcessDefinition(ctx context.Context, key string) (*AuditProcessDefinition, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	reqUrl := fmt.Sprintf("%s/api/workflow-rest/v1/process-definition/%s", settings.GetConfig().DepServicesConf.WorkflowRestHost, key)
	buf, err := util.DoHttpGet(ctx, reqUrl, header, nil)
	if err != nil {
		return nil, err
	}

	var resp AuditProcessDefinition
	if err = json.Unmarshal(buf, &resp); err != nil {
		return nil, err
	}

	if len(resp.ID) > 0 {
		return &resp, nil
	}
	return nil, nil
}

func CheckAuditProcessDefinition(ctx context.Context, auditType, procDefKey string) error {
	data, err := GetAuditProcessDefinition(ctx, procDefKey)
	if err != nil {
		log.WithContext(ctx).Errorf("get audit process procDefKey: %v info failed, err: %v", procDefKey, err)
		// return errorcode.Detail(errorcode.PublicInternalError, err)
		return errorcode.Detail(errorcode.PublicNoAuditDefFoundError, err)
	}

	if data == nil {
		log.WithContext(ctx).Errorf("get audit process procDefKey: %v info failed, not existed", procDefKey)
		return errorcode.Detail(errorcode.PublicNoAuditDefFoundError, "没有可用的审核流程")
	}

	if data.Type != auditType {
		log.WithContext(ctx).Errorf("audit process procDefKey: %v type: %v cannot match to req type: %v",
			procDefKey, data.Type, auditType)
		return errorcode.Detail(errorcode.PublicNoAuditDefFoundError, "没有可用的审核流程")
	}

	if data.Effectivity > 0 {
		log.WithContext(ctx).Errorf("audit process procDefKey: %v invalid or deleted", procDefKey)
		return errorcode.Detail(errorcode.PublicNoAuditDefFoundError, "没有可用的审核流程")
	}
	return nil
}

type QueryParam struct {
	ObjectID string   `json:"object_id" form:"object_id" binding:"omitempty,uuid"`   // 对象id
	Type     string   `json:"type" form:"type" binding:"omitempty"`                  // 对象类型
	IsAll    bool     `json:"is_all" form:"is_all,default=true" binding:"omitempty"` //是否查询全部
	IDs      []string `json:"ids" form:"ids"`                                        // 多个id的字符串，逗号分隔
}

type SummaryInfo struct {
	ID     string `json:"id" `     // 对象ID
	Name   string `json:"name"`    // 对象名称
	Type   string `json:"type"`    // 对象类型
	Path   string `json:"path"`    // 对象路径
	PathID string `json:"path_id"` // 对象ID路径
}

type QueryPageReapParam struct {
	Entries    []*SummaryInfo `json:"entries"`     // 对象列表
	TotalCount int64          `json:"total_count"` // 当前筛选条件下的对象数量
}

func GetObjectInfo(ctx context.Context, id string) (*SummaryInfo, error) {
	_, span := ar_trace.Tracer.Start(ctx, "data-catalog GetObjectsInfo")
	defer span.End()

	body, err := util.DoHttpGet(ctx, settings.GetConfig().ConfigCenterHost+"/api/configuration-center/v1/objects/"+id, map[string][]string{"Authorization": {ctx.Value(interception.Token).(string)}}, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	res := new(SummaryInfo)
	// 把请求到的数据Unmarshal到res中
	err = json.Unmarshal(body, res)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	return res, nil
}

func GetObjectsInfoByIds(ctx context.Context, ids []string) (map[string]*SummaryInfo, error) {
	q := QueryParam{
		IDs: ids,
	}
	objInfos, err := GetObjectsInfo(ctx, q)
	if err != nil {
		return nil, err
	}
	objInfoMap := make(map[string]*SummaryInfo)
	for _, objInfo := range objInfos {
		objInfoMap[objInfo.ID] = objInfo
	}
	return objInfoMap, nil
}

func GetObjectsInfo(ctx context.Context, q QueryParam) ([]*SummaryInfo, error) {
	_, span := ar_trace.Tracer.Start(ctx, "data-catalog GetObjectsInfo")
	defer span.End()

	query := url.Values{}
	if len(q.IDs) > 0 {
		query.Set("ids", strings.Join(q.IDs, ","))
	} else {
		query.Set("id", q.ObjectID)
		query.Set("type", q.Type)
		query.Set("is_all", fmt.Sprintf("%v", q.IsAll))
		query.Set("limit", "100") // tmp handle
	}

	body, err := util.DoHttpGet(ctx, settings.GetConfig().ConfigCenterHost+"/api/configuration-center/v1/objects/internal", nil, query)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	res := new(QueryPageReapParam)
	// 把请求到的数据Unmarshal到res中
	err = json.Unmarshal(body, res)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	return res.Entries, nil
}

// GetInfoSystemsPrecision 批量查询
func GetInfoSystemsPrecision(ctx context.Context, ids ...string) ([]*GetInfoSystemByIdsRes, error) {
	errorMsg := "DrivenConfigurationCenter GetInfoSystemsPrecision "
	urlStr := settings.GetConfig().ConfigCenterHost + "/api/configuration-center/v1/info-system/precision"

	params := make([]string, 0, len(ids))
	for _, id := range ids {
		params = append(params, "ids="+id)
	}
	if len(params) > 0 {
		urlStr = urlStr + "?" + strings.Join(params, "&")
	}

	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := client.Do(request.WithContext(ctx))
	if err != nil {
		log.Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.GetInfoSystemDetail, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	res := make([]*GetInfoSystemByIdsRes, 0)
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeBody)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(errorcode.GetInfoSystemDetail, err.Error())
			}
			log.Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		} else {
			log.Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Desc(errorcode.GetInfoSystemDetail)
		}
	}
}

type GetInfoSystemByIdsRes struct {
	ID           string `json:"id"`             // 信息系统业务id
	Name         string `json:"name"`           // 信息系统名称
	Description  string `json:"description"`    // 信息系统描述
	DepartmentId string `json:"department_id"`  // 部门id
	CreatedAt    int64  `json:"created_at"`     // 创建时间
	CreatedByUID string `json:"created_by_uid"` // 创建用户ID
	UpdatedAt    int64  `json:"updated_at"`     // 更新时间
	UpdatedByUID string `json:"updated_by_uid"` // 更新用户ID
}

type RelationDataItem struct {
	BusinessModelID string   `json:"business_model_id"` //主干业务id
	TaskID          string   `json:"task_id"`           //任务ID
	ProjectID       string   `json:"project_id"`        //项目ID
	IdsType         string   `json:"ids_type"`          //关联的ID类型
	Ids             []string `json:"ids"`               //关联的数据
}

// QueryRelationDataItems  查询关系数据
func QueryRelationDataItems(ctx context.Context, taskId string) ([]RelationDataItem, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	query := url.Values{}
	query.Set("task_id", taskId)

	body, err := util.DoHttpGet(ctx, settings.GetConfig().TaskCenterHost+"/api/task-center/v1/internal/relation/data", header, query)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	//获取主干业务数据
	res := make([]RelationDataItem, 0)
	if err = json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.PublicUnmarshalJson, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

// QueryRelationIds  查询方法关系数据
func QueryRelationIds(ctx context.Context, taskId string) ([]string, error) {
	items, err := QueryRelationDataItems(ctx, taskId)
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0)
	for _, item := range items {
		ids = append(ids, item.Ids...)
	}
	return ids, nil
}

type DepartmentInfo struct {
	DepartmentId   string `json:"department_id"`
	DepartmentName string `json:"department_name"`
}

type OwnerInfo struct {
	BusinessObjectId string            `json:"business_object_id"`
	Departments      []*DepartmentInfo `json:"departments"`
	UserId           string            `json:"user_id"`
	UserName         string            `json:"user_name"`
}

type OwnersInfo struct {
	Infos []*OwnerInfo `json:"owner_info"`
}

// GetOwnerByBusinessObjIDs 要业务治理服务请求数据owner
func GetOwnerByBusinessObjIDs(ctx context.Context, businessObjectIds string) ([]*OwnerInfo, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	val := url.Values{}
	if businessObjectIds != "" {
		val.Add("ids", businessObjectIds)
	}
	reqURL := settings.GetConfig().DepServicesConf.BusinessGroomingHost + "/api/business-grooming/v1/business-domain/business-object/owner"
	buf, err := util.DoHttpGet(ctx, reqURL, header, val)
	if err != nil {
		log.WithContext(ctx).Errorf("请求BusinessGrooming获取owner失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.BusinessGroomingOwnerRequestErr, err)
	}
	//log.WithContext(ctx).Infof(string(buf))
	res := OwnersInfo{}
	if err = json.Unmarshal(buf, &res); err != nil {
		log.WithContext(ctx).Errorf("获取owner失败，buf转json出现问题,原因:%v", err)
		return nil, errorcode.Detail(errorcode.BusinessGroomingOwnerRequestErr, err)
	}
	return res.Infos, nil
}

type UserIDNameRes struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// GetOwnerRoleUsersContains 查找部门下拥有数据owner角色的用户，部门id不存在会报错
// 传三个参数时，根据第三个参数去匹配，没有匹配就是空数组，如果有匹配到就是第三个参数值组成的一个元素的数组
func GetOwnerRoleUsersContains(ctx context.Context, departID, userID string) (*UserIDNameRes, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	val := url.Values{
		"depart_id": []string{departID},
		"role_id":   []string{access_control.TCDataOwner},
		"user_id":   []string{userID},
	}

	log.WithContext(ctx).Infof("请求部门下拥有数据owner角色的用户的参数 is %v", val)
	reqURL := settings.GetConfig().DepServicesConf.ConfigCenterHost + "/api/configuration-center/v1/users/filter"
	buf, badRes, err := util.DoHttpGetWithBadRequest(ctx, reqURL, header, val)
	if err != nil {
		log.WithContext(ctx).Errorf("请求部门下拥有数据owner角色的用户失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.ConfigCenterDepOwnerUsersRequestErr, err)
	} else if badRes != nil {
		log.WithContext(ctx).Errorf("请求部门下拥有数据owner角色的用户失败（400状态），错误返回体 is %v", badRes)
		return nil, errorcode.DescReplace(errorcode.ConfigCenterDepOwnerUsersRequestErr, badRes.Description)
	}

	var res []*UserIDNameRes
	if err = json.Unmarshal(buf, &res); err != nil {
		log.WithContext(ctx).Errorf("请求部门下拥有数据owner角色的用户失败，buf转json出现问题,原因:%v", err)
		return nil, errorcode.Detail(errorcode.ConfigCenterDepOwnerUsersRequestErr, err)
	}
	if len(res) == 0 {
		log.WithContext(ctx).Errorf("请求部门下拥有数据owner角色的用户为空，departID is:%v，userID is:%v", departID, userID)
		// return errorcode.Detail(errorcode.OwnerIDNotInDepartmentErr, err)
		return nil, nil
	}
	log.WithContext(ctx).Infof("请求部门下拥有数据owner角色的用户，接口返回的数据 is %v", res)
	return res[0], nil
}

func GetAuditMsg(curComment, auditMsg *string) *string {
	if len(*auditMsg) > 0 {
		return curComment
	}
	return auditMsg
}

type DeptEntryInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	Path   string `json:"path"`
	PathID string `json:"path_id"`
	Expand bool   `json:"expand"`
}

type DeptInfos struct {
	Entries []*DeptEntryInfo `json:"entries"`
}

// GetDepartmentInfoByDeptIDs 根据部门id获取部门信息
func GetDepartmentInfoByDeptIDs(ctx context.Context, deptIDs string) ([]*DeptEntryInfo, error) {
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	val := url.Values{}
	if deptIDs != "" {
		val.Add("ids", deptIDs)
	}
	reqURL := settings.GetConfig().DepServicesConf.ConfigCenterHost + "/api/configuration-center/v1/objects"
	buf, err := util.DoHttpGet(ctx, reqURL, header, val)
	if err != nil {
		log.WithContext(ctx).Errorf("请求ConfigCenter获取部门信息失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.ConfigCenterDeptRequestErr, err)
	}

	res := DeptInfos{}
	if err = json.Unmarshal(buf, &res); err != nil {
		log.WithContext(ctx).Errorf("获取部门信息失败，buf转json出现问题,原因:%v", err)
		return nil, errorcode.Detail(errorcode.ConfigCenterDeptRequestErr, err)
	}
	return res.Entries, nil
}

type UserInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func GetUserNameByUserIDs(ctx context.Context, userIDs []string) ([]*UserIDNameRes, error) {
	if len(userIDs) == 0 {
		return nil, nil
	}
	target := fmt.Sprintf("%s/api/user-management/v1/users/%s/name", settings.GetConfig().DepServicesConf.UserMgmPrivateHost, strings.Join(userIDs, ","))
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	buf, err := util.DoHttpGet(ctx, target, header, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetUserNameByUserIDs failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}

	var users []*UserIDNameRes
	if err = json.Unmarshal(buf, &users); err != nil {
		log.WithContext(ctx).Error("GetUserNameByUserIDs failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}

	return users, nil
}

func GetUserInfoByUserID(ctx context.Context, bIsDeptsNeeded bool, userID string) ([]*UserInfo, error) {
	var user []*UserInfo
	// 如果是第三方应用app
	v := ctx.Value(interception.TokenType)
	vType, ok := v.(int)
	if ok && vType == interception.TokenTypeClient {
		if val := request.GetUserInfo(ctx); val != nil {
			if userID == val.ID {
				user = append(user, &UserInfo{
					ID:   val.ID,
					Name: val.Name,
				})
				return user, nil
			}
		}
	}
	parent_deps := ""
	if bIsDeptsNeeded {
		parent_deps = ",parent_deps"
	}
	target := fmt.Sprintf("%s/api/user-management/v1/users/%s/name,telephone%s", settings.GetConfig().DepServicesConf.UserMgmPrivateHost, userID, parent_deps)
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	buf, err := util.DoHttpGet(ctx, target, header, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetUserNameByUserID failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}

	if err = json.Unmarshal(buf, &user); err != nil {
		log.WithContext(ctx).Error("GetUserNameByUserID failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}

	return user, nil
}

func GetUserInfoByUserIDs(ctx context.Context, ccDriven configuration_center.Driven,
	bIsDeptsNeeded bool, userIDs []string) ([]*UserInfo, error) {
	uInfos, appAccountIDs, err := getUserInfoByUserIDs(ctx, bIsDeptsNeeded, userIDs)
	if err == nil {
		return uInfos, nil
	}

	if len(appAccountIDs) == 0 {
		return nil, err
	}

	s := set.New(set.NonThreadSafe)
	s.Add(lo.ToAnySlice(userIDs)...)
	s.Remove(lo.ToAnySlice(appAccountIDs)...)
	if s.Size() > 0 {
		if uInfos, _, err = getUserInfoByUserIDs(ctx, bIsDeptsNeeded, set.StringSlice(s)); err != nil {
			return nil, err
		}
	}

	var users []*configuration_center.User
	if users, err = ccDriven.GetUsers(ctx, appAccountIDs); err != nil {
		return nil, err
	}

	for i := range users {
		uInfos = append(uInfos,
			&UserInfo{
				ID:   users[i].ID,
				Name: users[i].Name,
			},
		)
	}
	return uInfos, err
}

func getUserInfoByUserIDs(ctx context.Context, bIsDeptsNeeded bool, userIDs []string) ([]*UserInfo, []string, error) {
	if len(userIDs) == 0 {
		return nil, nil, nil
	}
	parent_deps := ""
	if bIsDeptsNeeded {
		parent_deps = ",parent_deps"
	}
	target := fmt.Sprintf("%s/api/user-management/v1/users/%s/name,telephone%s", settings.GetConfig().DepServicesConf.UserMgmPrivateHost, strings.Join(userIDs, ","), parent_deps)
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	statusCode, buf, err := util.HTTPGetResponse(ctx, http.MethodGet, target, header, nil, http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error("getUserInfoByUserIDs failed", zap.Error(err), zap.String("url", target))
		return nil, nil, err
	}

	if statusCode == http.StatusOK {
		var users []*UserInfo
		if err = json.Unmarshal(buf, &users); err != nil {
			log.WithContext(ctx).Error("getUserInfoByUserIDs failed", zap.Error(err), zap.String("url", target))
			return nil, nil, err
		}

		return users, nil, nil
	} else {
		var res struct {
			Code   int64 `json:"code"`
			Detail struct {
				IDs []string `json:"ids"`
			} `json:"detail"`
		}
		if err = json.Unmarshal(buf, &res); err != nil {
			log.WithContext(ctx).Error("getUserInfoByUserIDs failed", zap.Error(err), zap.String("url", target))
			return nil, nil, err
		}
		// 有不存在的用户
		if res.Code == 404019001 && len(res.Detail.IDs) > 0 {
			return nil, res.Detail.IDs, errors.New(util.BytesToString(buf))
		}
		return nil, nil, errors.New(util.BytesToString(buf))
	}
}

type Role struct {
	ID string `json:"id"`
}

func GetUserRolesByUID(ctx context.Context) ([]string, error) {
	target := fmt.Sprintf("%s/api/configuration-center/v1/users/roles", settings.GetConfig().DepServicesConf.ConfigCenterHost)
	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	buf, err := util.DoHttpGet(ctx, target, header, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetUserRolesByUID failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}

	var roles []*Role
	if err = json.Unmarshal(buf, &roles); err != nil {
		log.WithContext(ctx).Error("GetUserRolesByUID failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}

	roleIDs := make([]string, 0, len(roles))
	for i := range roles {
		roleIDs = append(roleIDs, roles[i].ID)
	}
	return roleIDs, nil
}

type FormViewInfo struct {
	ID string `json:"id"`

	// 逻辑视图的类型
	Type FormViewType `json:"type"`

	TechnicalName string `json:"technical_name"`
	MetaDataResID string `json:"metadata_form_id"`
}

func GetFormViewInfo(ctx context.Context, formViewIDs []string, offset int) ([]*FormViewInfo, error) {
	val := url.Values{}
	val.Add("form_view_ids", util.CombineToString(formViewIDs, ","))
	val.Add("offset", strconv.Itoa(offset))
	val.Add("limit", "1000")

	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}

	buf, err := util.DoHttpGet(ctx, settings.GetConfig().DepServicesConf.DataViewHost+"/api/data-view/v1/form-view", header, val)
	if err != nil {
		return nil, err
	}

	var formviews struct {
		Data []*FormViewInfo `json:"entries"`
	}
	if err = json.Unmarshal(buf, &formviews); err != nil {
		return nil, err
	}

	return formviews.Data, nil
}

// 逻辑视图的类型
type FormViewType string

// 所有已知的逻辑视图的类型
const (
	// 逻辑视图类型：元数据
	FormViewTypeDatasource FormViewType = "datasource"
	// 逻辑视图类型：逻辑实体
	FormViewTypeLogicEntity FormViewType = "logic_entity"
	// 逻辑视图类型：自定义
	FormViewTypeCustom FormViewType = "custom"
)

const (
	WORKFLOW_AUDIT_TYPE_CATALOG_ONLINE        = "af-data-catalog-online"
	WORKFLOW_AUDIT_TYPE_CATALOG_OFFLINE       = "af-data-catalog-offline"
	WORKFLOW_AUDIT_TYPE_CATALOG_CHANGE        = "af-data-catalog-change"
	WORKFLOW_AUDIT_TYPE_CATALOG_DOWNLOAD      = "af-data-catalog-download"
	WORKFLOW_AUDIT_TYPE_CATALOG_PUBLISH       = "af-data-catalog-publish"
	WORKFLOW_AUDIT_TYPE_CATALOG_OPEN          = "af-data-catalog-open"
	WORKFLOW_AUDIT_TYPE_FILE_RESOURCE_PUBLISH = "af-file-resource-publish"
)

type Handler[T wf_common.ValidMsg] func(ctx context.Context, auditType string, msg *T) error

func HandlerFunc[T wf_common.ValidMsg](auditType string, handler Handler[T]) wf_common.Handler[T] {
	return func(ctx context.Context, msg *T) error {
		return handler(ctx, auditType, msg)
	}
}
