package exploration

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

type MiddleData map[string]any

func NewMiddleData() MiddleData {
	return make(map[string]any)
}

type MetaDataTableInfo struct {
	Id              string                `json:"id" binding:"omitempty"`                // id
	Name            string                `json:"name" binding:"omitempty"`              // name
	Code            *string               `json:"code"`                                  // 探查报告编号
	MetadataTableId string                `json:"metadata_table_id" binding:"omitempty"` // metadata_table_id
	SchemaName      string                `json:"schema_name" binding:"omitempty"`       // schema_name
	VeCatalogId     string                `json:"ve_catalog_id" binding:"omitempty"`     // ve_catalog_id
	Description     string                `json:"description" binding:"omitempty"`       // description
	Columns         map[string]ColumnInfo `json:"columns" binding:"omitempty"`           // columns
}

type ColumnInfo struct {
	Name       string `json:"name" binding:"omitempty"`        // name
	Comment    string `json:"comment" binding:"omitempty"`     // comment
	Type       string `json:"type" binding:"omitempty"`        // type
	OriginType string `json:"origin_type" binding:"omitempty"` // type
}

func (m *MiddleData) ValueAsKey(key string) string {
	value, ok := (*m)[key]
	if !ok {
		return ""
	}
	return fmt.Sprintf("%v", value)
}

// Get 查询key的值
func (m *MiddleData) Get(key string) any {
	value, ok := (*m)[key]
	if ok {
		return value
	}
	return nil
}
func (m *MiddleData) Has(key string) bool {
	v, ok := (*m)[key]
	return ok && v != nil
}

func (m *MiddleData) SetUnique(key string, values []MiddleData, uniqueKey string) {
	unique := NewMiddleData()
	nds := make([]MiddleData, 0)
	for _, value := range values {
		//如果没有就直接返回
		if !value.Has(uniqueKey) {
			nds = append(nds, value)
			continue
		}
		uk := fmt.Sprintf("%v", value.Get(uniqueKey))
		if unique.Has(uk) {
			nds = append(nds, value)
		} else {
			unique.Set(uk, 1)
		}
	}
	m.Set(key, nds)
}

// Clone 克隆出一个一样的数据池
func (m *MiddleData) Clone() MiddleData {
	d := MiddleData(make(map[string]any))
	_ = copier.Copy(&d, m)
	return d
}

// Set 设置，替换middle的值
func (m *MiddleData) Set(key string, value any) {
	(*m)[key] = value
}

func (m *MiddleData) GetWithResultKey(key string) any {
	key = strings.Trim(key, "$}")
	key = strings.Trim(key, "{")
	return m.Get(key)
}

func (m *MiddleData) MergeSlice(ds []MiddleData) {
	for _, d := range ds {
		m.Merge(d)
	}
}

// Merge 将m中，key的值和value合并
func (m *MiddleData) Merge(oneData MiddleData, cacheKey ...string) {
	if oneData.IsEmpty() {
		return
	}
	key := ""
	for key = range oneData {
		break
	}
	value := oneData.Get(key)
	//如果没有改值，直接赋值即可
	mv := m.Get(key)
	if mv == nil {
		//如果是
		mvs, err := util.Transfer[[]any](value)
		if err == nil && len(*mvs) > 0 {
			m.Set(key, unique(*mvs, cacheKey...))
			return
		}
		m.Set(key, value)
		return
	}
	ms := m.GetSlice(key)
	tms := make([]any, 0)
	if ms == nil {
		tms = []any{mv}
	} else {
		tms = ms
	}

	addSlice, err := util.Transfer[[]any](value)
	if err == nil && len(*addSlice) > 0 {
		tms = append(tms, *addSlice...)
	} else {
		tms = append(tms, value)
	}
	nms := unique(tms, cacheKey...)
	m.Set(key, nms)
	return
}

// Delete 将m中key的值删除
func (m *MiddleData) Delete(key string) {
	delete(*m, key)
}

// OmitFieldValue 过滤掉某些不需要的字段然后将值返回
func (m *MiddleData) OmitFieldValue(k string, omitFields string) (string, any) {
	fields := strings.Split(omitFields, ",")
	key, value, err := m.getMiddleDataValue(k)
	dv, err := util.Transfer[MiddleData](value)
	if err == nil {
		for _, field := range fields {
			if field != "" {
				delete(*dv, field)
			}
		}
		return key, *dv
	}
	dvs, err := util.Transfer[[]MiddleData](value)
	if err == nil {
		for _, dv := range *dvs {
			for _, field := range fields {
				if field != "" {
					delete(dv, field)
				}
			}
		}
		return key, *dvs
	}
	return key, value
}

func (m *MiddleData) IsEmpty() bool {
	if m == nil || len(*m) <= 0 {
		return true
	}
	for _, v := range *m {
		if fmt.Sprintf("%v", v) == "" ||
			fmt.Sprintf("%v", v) == "[]" ||
			fmt.Sprintf("%v", v) == "{}" ||
			fmt.Sprintf("%v", v) == "[null]" ||
			fmt.Sprintf("%v", v) == "[[]]" ||
			fmt.Sprintf("%v", v) == "[{}]" ||
			fmt.Sprintf("%v", v) == "{{}}" ||
			fmt.Sprintf("%v", v) == "{[]}" ||
			fmt.Sprintf("%v", v) == `["无"]` {
			return true
		}
	}
	return false
}

// getUniqueString 目前最多支持2级
func getUniqueString(d any, uniqueKeys ...string) string {
	md, err := util.Transfer[MiddleData](d)
	if err != nil || len(uniqueKeys) < 3 {
		return fmt.Sprintf("%v", d)
	}
	mdv := md.Get(uniqueKeys[2])
	mdv1, err := util.Transfer[MiddleData](mdv)
	if err != nil || !mdv1.Has(uniqueKeys[0]) {
		return fmt.Sprintf("%v", d)
	}
	return fmt.Sprintf("%v", mdv1.Get(uniqueKeys[0]))
}

func unique(ds []any, uniqueKeys ...string) []any {
	dvMap := make(map[string]any)
	ndv := make([]any, 0)
	for _, d := range ds {
		key := getUniqueString(d, uniqueKeys...)
		if _, ok := dvMap[key]; ok {
			continue
		} else {
			ndv = append(ndv, d)
			dvMap[key] = d
		}
	}
	return ndv
}

func (m *MiddleData) GetSlice(key string) []any {
	value := m.Get(key)
	if value == nil {
		return nil
	}
	ms, err := util.Transfer[[]any](value)
	if err != nil {
		log.Errorf("middleData is not matched to received type:", err.Error())
		return nil
	}
	return *ms
}

func (m *MiddleData) getMiddleDataValue(key string) (string, any, error) {
	key = strings.Trim(key, "${} ")
	keys := strings.Split(key, ".")
	//单层key, 直接取值返回
	if !strings.Contains(key, ".") {
		if d := m.Get(key); d != nil {
			return key, d, nil
		}
		return key, nil, fmt.Errorf("invalid input data")
	}
	//多层结构，先取第一层的值
	d1 := m.Get(keys[0])
	if d1 == nil {
		return keys[len(keys)-1], nil, fmt.Errorf("invalid input data with key %v", key)
	}
	//如果第一层是一个数组
	valueD := reflect.ValueOf(d1)
	if valueD.Kind() == reflect.Slice {
		ds, err := util.Transfer[[]MiddleData](d1)
		if err != nil || ds == nil || len(*ds) <= 0 {
			return "", nil, fmt.Errorf("invalid input data with key %v", key)
		}
		dvs := make([]string, 0)
		for _, di := range *ds {
			div, ok := di[keys[1]]
			if !ok {
				return keys[len(keys)-1], nil, fmt.Errorf("invalid input data with key %v", key)
			}
			dvs = append(dvs, fmt.Sprintf("%v", div))
		}
		return key, dvs, err
	}
	d2, err := util.Transfer[MiddleData](d1)
	if err != nil || d2 == nil || len(*d2) <= 0 {
		return keys[len(keys)-1], nil, fmt.Errorf("invalid input data with key %v", key)
	}
	return keys[1], (*d2).Get(keys[1]), err
}

// GetMiddleDataValue  当前只支持两个层级
func GetMiddleDataValue[T any](data MiddleData, key string) (string, *T, error) {
	key = strings.TrimSpace(key)
	ts := strings.Split(key, "|")
	k, value, err := data.getMiddleDataValue(ts[0])
	if err != nil {
		return k, nil, err
	}
	tv, err := util.Transfer[T](value)
	if err != nil {
		return k, nil, err
	}
	return getRealKey(key), tv, nil
}

// GetRealKey 返回真正的key
func getRealKey(key string) string {
	ts := strings.Split(key, "|")
	if len(ts) > 1 && ts[1] != "" {
		return strings.TrimSpace(ts[1])
	}
	key = strings.Trim(key, "${} ")
	keys := strings.Split(key, ".")
	return keys[len(keys)-1]
}
