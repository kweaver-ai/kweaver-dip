package data_comprehension

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

// CheckHelper 配置检查需要用到的方法
type CheckHelper interface {
	CatalogBaseInfos(ctx context.Context, catalogIds ...uint64) (map[uint64]*model.TDataCatalog, error) //查询数据资源目录
	ColumnInfos(ctx context.Context, catalogId uint64) (map[uint64]*ColumnBriefInfo, error)             //查询数据资源挂载表的字段
	//ChoiceMap(ctx context.Context) map[string]map[int]Choice                                            //获取选择配置项
}

// IsLeaf 判断是否是叶子节点
func (d *DimensionConfig) IsLeaf() bool {
	return len(d.Children) <= 0
}

func (d *DimensionConfig) Check(ctx context.Context, helper CheckHelper, config *Configuration) error {
	//如果不是叶子节点，那么就跳过检查
	if !d.IsLeaf() {
		return nil
	}
	//缺少详情
	if d.Detail == nil {
		d.Error = "缺少理解详情"
		return errorcode.Desc(errorcode.DataComprehensionConfigError, d.Name, "缺少理解详情")
	}
	d.Detail.CatalogId = d.CatalogId
	d.Detail.DimensionConfigId = d.Id
	d.Detail.DimensionName = d.Name
	//检查详情
	switch d.Detail.ContentType {
	case ContentTypeArrayText:
		return check[TextSlice](ctx, d.Detail, helper, config)
	case ContentTypeDate:
		return check[TimeRanges](ctx, d.Detail, helper, config)
	case ContentTypeListed:
		return check[Choices](ctx, d.Detail, helper, config)
	case ContentTypeColumnComprehension:
		return check[ColumnComprehensions](ctx, d.Detail, helper, config)
	case ContentTypeCatalogRelation:
		return check[CatalogRelations](ctx, d.Detail, helper, config)
	}
	return nil
}

func check[T ContentType](ctx context.Context, d *DimensionDetail, helper CheckHelper, config *Configuration) error {
	data, err := Recognize[T](d.Content)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		d.Error = "解析json错误"
		return errorcode.Desc(errorcode.DataComprehensionUnmarshalJsonError, d.DimensionName)
	}
	if errString := commonCheck(data, d); errString != "" {
		d.Error = errString
		return errorcode.Desc(errorcode.DataComprehensionConfigError, d.DimensionName, errString)
	}
	contentError := data.Check(ctx, *d, helper, config)
	delete(contentError, listErrKey)
	if len(contentError) > 0 {
		d.ContentErrors = contentError
		return errorcode.Desc(errorcode.DataComprehensionConfigError, d.DimensionName, "理解维度内容报错")
	}
	return nil
}

// commonCheck 公共检查的部分
func commonCheck[T ContentType](t T, d *DimensionDetail) string {
	if d.IsMulti && len(t) > d.MaxMulti {
		return fmt.Sprintf("该维度最多支持%d条理解", d.MaxMulti)
	}
	//必填校验
	if d.Required && len(t) <= 0 {
		return "该维度必填"
	}
	//单选项不支持多填
	if !d.IsMulti && len(t) > 1 {
		return "该维度只支持单个子节点"
	}
	return ""
}

type DimensionContent interface {
	Check(ctx context.Context, c DimensionDetail, helper CheckHelper) ContentError
}

// ContentError 理解报错，key是理解内容的索引，error是具体的报错
type ContentError map[string]string

func (t TextSlice) Check(ctx context.Context, d DimensionDetail, helper CheckHelper, config *Configuration) ContentError {
	contentError := make(map[string]string)
	//单个文本的长度校验
	for index, text := range t {
		if !form_validator.VerifyDescriptionString(text, d.ItemLength) {
			contentError[strconv.Itoa(index)] = fmt.Sprintf("仅支持中英文、数字及键盘上的特殊字符，最大长度%d", d.ItemLength)
		}
	}
	return contentError
}

func (t TimeRanges) Check(ctx context.Context, d DimensionDetail, helper CheckHelper, config *Configuration) ContentError {
	contentError := make(map[string]string)
	//时间范围的校验
	for i, r := range t {
		if r.Start < 0 {
			contentError[strconv.Itoa(i)] = "起始时间必须是:'1970-01-01 08:00:00'以后"
		}
	}
	return contentError
}

func (t Choices) Check(ctx context.Context, d DimensionDetail, helper CheckHelper, config *Configuration) ContentError {
	csMap := make(map[string]map[int]Choice)
	for cId, cs := range config.Choices {
		cMap := make(map[int]Choice)
		for _, c := range cs {
			cMap[c.Id] = c
		}
		csMap[cId] = cMap
	}
	cMap := csMap[d.DimensionConfigId]
	contentError := make(map[string]string)
	//检查是否是复合要求的选项
	for i, r := range t {
		for _, ir := range r {
			if _, ok := cMap[ir.Id]; !ok {
				contentError[strconv.Itoa(i)] = "请选择给定的选项"
				break
			}
		}
	}
	return contentError
}

func (t ColumnComprehensions) Check(ctx context.Context, c DimensionDetail, helper CheckHelper, config *Configuration) ContentError {
	//检查是否是表中的字段
	contentError := make(map[string]string)
	columnBriefInfoMap, queryErr := helper.ColumnInfos(ctx, c.CatalogId.Uint64())
	if queryErr != nil {
		contentError["-1"] = "字段信息查询错误"
		log.WithContext(ctx).Error(queryErr.Error())
		return contentError
	}
	for index, column := range t {
		if _, ok := columnBriefInfoMap[column.ColumnInfo.ID.Uint64()]; !ok {
			contentError[strconv.Itoa(index)] = "该字段在编目表中不存在"
		}
	}
	return contentError
}

// Check 这个不是接口需要的方法，简单实现下即可
func (t ColumnDetailInfos) Check(ctx context.Context, c DimensionDetail, helper CheckHelper, config *Configuration) ContentError {
	return make(map[string]string)
}

const (
	listErrKey = "list error"

	fieldDeleted       = "存在引用的字段已删除"
	dataCatalogDeleted = "存在引用的目录未上线或已删除"
	fieldChanged       = "存在引用的字段发生变更"
	dataCatalogChanged = "存在引用的目录发生变更"
)

func (t ColumnComprehensions) Merge(ctx context.Context, c *DimensionDetail, helper CheckHelper) {
	contentError := make(map[string]string)
	columnBriefInfoMap, queryErr := helper.ColumnInfos(ctx, c.CatalogId.Uint64())
	if queryErr != nil {
		log.WithContext(ctx).Error(queryErr.Error())
		contentError["-1"] = "字段信息查询错误"
		c.ContentErrors = contentError
		return
	}

	var ts []ColumnComprehension
	for index, column := range t {
		if column.ColumnInfo.ID.IsInvalid() {
			log.WithContext(ctx).Warnf("invalid column info: %s, catalog id: %v", lo.T2(json.Marshal(column)).A, c.CatalogId)
			continue
		}

		info, ok := columnBriefInfoMap[column.ColumnInfo.ID.Uint64()]

		if !ok {
			contentError[strconv.Itoa(index)] = "该目录字段被删除，请重新选择"
			ts = append(ts, column)
			c.ListErr = lo.If(len(c.ListErr) > 0, c.ListErr).Else(fieldDeleted)
			continue
		}

		if info.NameCN != column.ColumnInfo.NameCN {
			//contentError[strconv.Itoa(index)] = "该字段中文名称发生了变化"
			c.ListErr = lo.If(len(c.ListErr) > 0, c.ListErr).Else(fieldChanged)
		}

		if info.DataFormat != column.ColumnInfo.DataFormat {
			contentError[strconv.Itoa(index)] = "该目录字段的数据类型可能被修改，请检查"
			c.ListErr = lo.If(len(c.ListErr) > 0, c.ListErr).Else(fieldChanged)
		}

		ts = append(ts, ColumnComprehension{
			ColumnInfo:    *info,
			Comprehension: column.Comprehension,
		})
	}

	c.ContentErrors = contentError
	c.Content = ts
	return
}

func (t CatalogRelations) Check(ctx context.Context, c DimensionDetail, helper CheckHelper, config *Configuration) ContentError {
	const (
		catalogDeleted = "选择的目录未发布或已删除，请重新选择"
	)

	//检查是否是存在的目录
	contentError := make(map[string]string)
	ids := make([]uint64, 0, len(t))
	for _, catalogRelation := range t {
		for _, catalog := range catalogRelation.CatalogInfos {
			ids = append(ids, catalog.Id.Uint64())
		}
	}
	catalogInfoMap, queryErr := helper.CatalogBaseInfos(ctx, ids...)
	if queryErr != nil {
		contentError["-1"] = "字段信息查询错误"
		log.WithContext(ctx).Error(queryErr.Error())
		return contentError
	}

	var listErr string
	var ret []CatalogRelation
	for index, catalogRelation := range t {
		if len(catalogRelation.CatalogInfos) < 1 {
			continue
		}

		ret = append(ret, catalogRelation)

		errs := make([]string, 0)
		for _, catalog := range catalogRelation.CatalogInfos {
			_, isPublish := constant.PublishedMap[catalogInfoMap[catalog.Id.Uint64()].PublishStatus]
			if d, ok := catalogInfoMap[catalog.Id.Uint64()]; !ok || !isPublish {
				errs = append(errs, catalogDeleted)
				listErr = lo.If(len(listErr) > 0, listErr).Else(dataCatalogDeleted)
				//errs = append(errs, fmt.Sprintf("编目%s不存在", catalog.Title))
			} else if d.Title != catalog.Title {
				listErr = lo.If(len(listErr) > 0, listErr).Else(dataCatalogChanged)
			}
		}
		if len(errs) <= 0 {
			continue
		}
		//contentError[strconv.Itoa(index)] = strings.Join(errs, ";")
		contentError[strconv.Itoa(index)] = errs[0]
	}

	c.Content = ret

	contentError[listErrKey] = listErr
	return contentError
}

// RemoveDeletedColumnComments  检查字段注解, 去掉删除的字段注解
func (c *ComprehensionDetail) RemoveDeletedColumnComments(ctx context.Context, helper CheckHelper) {
	columnBriefInfoMap, queryErr := helper.ColumnInfos(ctx, c.CatalogID.Uint64())
	if queryErr != nil {
		log.WithContext(ctx).Error(queryErr.Error())
		return
	}
	for index, column := range c.ColumnComments {
		if _, ok := columnBriefInfoMap[column.ID.Uint64()]; !ok {
			c.ColumnComments = util.Delete(c.ColumnComments, index)
		}
	}
}

// CheckColumnComments  检查字段注解, 去掉删除的字段注解
func (c *ComprehensionUpsertReq) CheckColumnComments(ctx context.Context, helper CheckHelper) error {
	columnBriefInfoMap, queryErr := helper.ColumnInfos(ctx, c.CatalogID.Uint64())
	if queryErr != nil {
		log.WithContext(ctx).Error(queryErr.Error())
		return queryErr
	}
	has := false
	for _, column := range c.ColumnComments {
		if _, ok := columnBriefInfoMap[column.ID.Uint64()]; !ok {
			has = true
			column.Error = "该字段不存在"
		}
	}
	if has {
		return errorcode.Desc(errorcode.DataComprehensionContentError)
	}
	return nil
}

func (c *ComprehensionDetail) GetExceptionMsg(ctx context.Context, helper CheckHelper) string {
	columnBriefInfoMap, queryErr := helper.ColumnInfos(ctx, c.CatalogID.Uint64())
	if queryErr != nil {
		log.WithContext(ctx).Error(queryErr.Error())
		return fieldDeleted
	}

	for _, column := range c.ColumnComments {
		info, ok := columnBriefInfoMap[column.ID.Uint64()]
		if !ok {
			return fieldDeleted
		}
		if info.NameCN != column.NameCN || info.DataFormat != column.DataFormat {
			return fieldChanged
		}
	}

	if err := c.CheckAndMerge(ctx, helper); err != nil {
		log.WithContext(ctx).Errorf("failed to check and merge data comprehension detail, err: %v", err)
		return ""
	}

	tmpDimensions := make([]*DimensionConfig, len(c.ComprehensionDimensions))
	copy(tmpDimensions, c.ComprehensionDimensions)
	for i := 0; i < len(tmpDimensions); i++ {
		dimension := tmpDimensions[i]
		if !dimension.IsLeaf() {
			tmpDimensions = append(tmpDimensions, dimension.Children...)
			continue
		}

		if dimension.Detail != nil && len(dimension.Detail.ListErr) > 0 {
			return dimension.Detail.ListErr
		}
	}

	return ""
}

func (c *ComprehensionDetail) HasChange(ctx context.Context, helper CheckHelper) int8 {
	columnBriefInfoMap, queryErr := helper.ColumnInfos(ctx, c.CatalogID.Uint64())
	if queryErr != nil {
		log.WithContext(ctx).Error(queryErr.Error())
		return 1
	}

	for _, column := range c.ColumnComments {
		info, ok := columnBriefInfoMap[column.ID.Uint64()]
		if !ok {
			return 1
		}
		if info.NameCN != column.NameCN || info.DataFormat != column.DataFormat {
			return 1
		}
	}

	if err := c.CheckAndMerge(ctx, helper); err != nil {
		log.WithContext(ctx).Errorf("failed to check and merge data comprehension detail, err: %v", err)
		return 0
	}

	tmpDimensions := make([]*DimensionConfig, len(c.ComprehensionDimensions))
	copy(tmpDimensions, c.ComprehensionDimensions)
	for i := 0; i < len(tmpDimensions); i++ {
		dimension := tmpDimensions[i]
		if !dimension.IsLeaf() {
			tmpDimensions = append(tmpDimensions, dimension.Children...)
			continue
		}

		if dimension.Detail == nil {
			continue
		}

		if len(dimension.Detail.ContentErrors) > 0 {
			return 2
		}
	}

	return 0
}
