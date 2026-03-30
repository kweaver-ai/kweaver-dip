package subject_domain

import (
	"context"
	"strings"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/classify"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/util/iter"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// QueryClassificationInfo 查询分类分级数据
func (c *SubjectDomainUsecase) QueryClassificationInfo(ctx context.Context, req *QueryClassificationReq) (*QueryClassificationResp, error) {
	result := &QueryClassificationResp{Entries: make([]*SubjectNode, 0), Display: req.Display}
	info, err := c.QueryGroupClassify(ctx, req.OpenHierarchy, req.ID)
	if err != nil {
		log.Errorf("QueryGroupClassify error %v", err.Error())
		return result, err
	}
	//查询主题节点
	subjects, err := c.repo.GetSubOrTopByID(ctx, req.ID)
	if err != nil {
		log.Errorf("GetSubOrTopByID error %v", err.Error())
		return result, err
	}
	switch {
	case req.ID == "" && !req.OpenHierarchy: //查询顶层不带分级
		result.Entries = c.genSubjectGroupsWithoutHierarchy(subjects, info)

	case req.ID == "" && req.OpenHierarchy: //查询顶层带分级
		result.Entries = c.genSubjectGroupsWithHierarchy(subjects, info)

	case req.ID != "" && !req.OpenHierarchy: //查询某个业务域分组不带分级
		result.Entries = c.genSubjectDomainWithoutHierarchy(subjects, info)

	case req.ID != "" && req.OpenHierarchy: //查询某个业务域分组带分级
		result.Entries = c.genSubjectDomainWithHierarchy(subjects, info)
	}
	//只有查询某个业务域分组的信息，tree才有意义
	if req.Display == "tree" && req.ID != "" {
		node := iter.Tree(result.Entries,
			func(node *SubjectNode) string { return node.ID },
			func(node *SubjectNode) string { return node.ParentID },
			func(node *SubjectNode, node2 *SubjectNode) { node.Child = append(node.Child, node2) })
		result.Entries = []*SubjectNode{node}
	}
	return result, nil
}

// GetClassificationStats 查询全局所有的分类分级的总数
func (c *SubjectDomainUsecase) GetClassificationStats(ctx context.Context, req *GetClassificationStatsReq) (*GetClassificationStatsResp, error) {
	cs, err := c.QueryGroupClassify(ctx, true, req.ID)
	if err != nil {
		log.Errorf("QueryGroupClassify error %v", err.Error())
		return nil, err
	}
	//组装分类分级信息
	detail := &GetClassificationStatsResp{}

	tagIndexDict := make(map[string]int)
	for _, classifyInfo := range cs {
		detail.Total += classifyInfo.ClassifiedNum
		if classifyInfo.LabelID == "" {
			continue
		}
		tagIndex, ok := tagIndexDict[classifyInfo.LabelID]
		if !ok {
			detail.HierarchyTag = append(detail.HierarchyTag, GenHierarchyTag(classifyInfo))
			tagIndexDict[classifyInfo.LabelID] = len(detail.HierarchyTag) - 1
		} else {
			hierarchyTag := detail.HierarchyTag[tagIndex]
			hierarchyTag.Count += classifyInfo.ClassifiedNum
		}
	}
	//添加未分类
	detail.SortLabel()
	detail.AddNotClassify()
	return detail, nil
}

// QueryClassifyViewDetail 查询分类分级详情
func (c *SubjectDomainUsecase) QueryClassifyViewDetail(ctx context.Context, req *QueryHierarchyTotalInfoReq) (*QueryHierarchyTotalInfoResp, error) {
	//1 查询主题对象关联的视图字段信息
	attributes, err := c.repo.GetAttributeByID(ctx, req.ID)
	if err != nil {
		log.Errorf("QueryClassifyDetail error %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	attributeID := iter.Gen(attributes, func(d *model.SubjectDomain) string {
		return d.ID
	})
	isOperator := c.isOperator(ctx)
	fieldSlice, err := c.dataViewDriven.QueryViewFieldInfo(ctx, isOperator, attributeID...)
	if err != nil {
		log.Errorf("QueryViewFieldInfo error %v", err.Error())
		return nil, err
	}
	//2拷贝结果
	detail := &QueryHierarchyTotalInfoResp{}
	copier.Copy(&detail.Entries, fieldSlice)
	//3.1查询所有的分类分级信息
	info, err := c.QueryGroupClassify(ctx, req.OpenHierarchy, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("QueryGroupClassify error %v", err.Error())
		return nil, err
	}
	//3.2添加关联属性信息和分级信息
	detail.addFieldLabelAndProp(req.OpenHierarchy, info, attributes)
	return detail, nil
}
func (c *SubjectDomainUsecase) QueryClassifyFieldsDetailByPage(ctx context.Context, req *QueryHierarchyTotalInfoReq) (*QueryHierarchyTotalInfoResp, error) {
	if req.FormViewID == "" {
		return c.QueryClassifyViewDetailByPage(ctx, req)
	}
	return c.QueryClassifyFieldDetailByPage(ctx, req)
}

// QueryClassifyViewDetailByPage 按照视图分页
func (c *SubjectDomainUsecase) QueryClassifyViewDetailByPage(ctx context.Context, req *QueryHierarchyTotalInfoReq) (*QueryHierarchyTotalInfoResp, error) {
	//1 查询主题对象关联的视图字段信息
	isOperator := c.isOperator(ctx)
	total, fields, err := c.classifyRepo.QueryGroupClassifyViews(ctx, req.ID, isOperator, req.PageInfo)
	if err != nil {
		log.Errorf("QueryGroupClassifyFields error %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	//2.组成结果
	return &QueryHierarchyTotalInfoResp{
		Total:   total,
		Entries: GenGroupViews(fields),
	}, nil
}

// QueryClassifyFieldDetailByPage 某个视图内字段分页
func (c *SubjectDomainUsecase) QueryClassifyFieldDetailByPage(ctx context.Context, req *QueryHierarchyTotalInfoReq) (*QueryHierarchyTotalInfoResp, error) {
	//1 查询主题对象关联的视图字段信息
	isOperator := c.isOperator(ctx)
	total, fields, err := c.classifyRepo.QueryGroupClassifyFields(ctx, req.ID, req.FormViewID, isOperator, req.PageInfo)
	if err != nil {
		log.Errorf("QueryGroupClassifyFields error %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	//2.查询标签信息
	labelInfoDict := make(map[string]*HierarchyTag)
	if req.OpenHierarchy {
		labelIDSlice := iter.Gen(fields, func(field *classify.FormViewSubjectField) string {
			return field.LabelID
		})
		labelInfoDict, err = c.queryLabelInfo(ctx, labelIDSlice)
		if err != nil {
			log.WithContext(ctx).Errorf("QueryGroupClassify error %v", err.Error())
			return nil, err
		}
	}
	//3.组成结果
	return &QueryHierarchyTotalInfoResp{
		Total:   total,
		Entries: GenGroupFields(fields, labelInfoDict, req.OpenHierarchy),
	}, nil
}

// genSubjectGroupsWithoutHierarchy  查询顶层不带分级
// groups:所有的顶层业务域分组信息
// cs: 数据库中的顶层不带分级的分类信息
func (c *SubjectDomainUsecase) genSubjectGroupsWithoutHierarchy(groups []*model.SubjectDomain, cs []classify.SubjectClassify) []*SubjectNode {
	//因为是顶级，所以使用rootID作为key，方便给groups中的元素赋值
	classifyDict := iter.StringMap(cs, func(s classify.SubjectClassify) string {
		return s.RootId
	})
	nodes := make([]*SubjectNode, 0)
	//将数据库查询出来的数据组合成分组形式
	indexDict := make(map[string]int)
	for _, group := range groups {
		classifyInfo := classifyDict[group.ID]
		index, ok := indexDict[group.ID]
		if !ok {
			nodes = append(nodes, &SubjectNode{
				ID:            group.ID,
				Name:          group.Name,
				Type:          constant.SubjectDomainObjectIntToString(group.Type),
				ClassifiedNum: classifyInfo.ClassifiedNum,
			})
			indexDict[group.ID] = len(nodes) - 1
		} else { //理论上不存在下面情况
			existSubjectNode := nodes[index]
			existSubjectNode.ClassifiedNum += classifyInfo.ClassifiedNum
		}
	}
	return nodes
}

// genSubjectGroupWithoutHierarchy  查询某个业务域分组不带分级
// subjects: 某个业务域分组的所有节点信息
// cs: 数据库中的某个业务域分组的分类信息，不带分级
func (c *SubjectDomainUsecase) genSubjectDomainWithoutHierarchy(subjects []*model.SubjectDomain, cs []classify.SubjectClassify) []*SubjectNode {
	classifyDict := make(map[string]classify.SubjectClassify)
	for _, subject := range cs {
		ids := strings.Split(subject.PathID, "/")
		names := strings.Split(subject.PathName, "/")
		for i, id := range ids {
			sub, ok := classifyDict[id]
			if !ok {
				classifyDict[id] = classify.SubjectClassify{
					ID:              id,
					Name:            names[i],
					ClassifiedNum:   subject.ClassifiedNum,
					LabelSortWeight: sub.LabelSortWeight,
				}
			} else {
				sub.ClassifiedNum += subject.ClassifiedNum
				classifyDict[id] = sub
			}
		}
	}

	nodes := make([]*SubjectNode, 0)
	for _, subject := range subjects {
		classifyInfo := classifyDict[subject.ID]
		nodes = append(nodes, &SubjectNode{
			ID:            subject.ID,
			Name:          subject.Name,
			Type:          constant.SubjectDomainObjectIntToString(subject.Type),
			ParentID:      util.GetParentID(subject.PathID),
			ClassifiedNum: classifyInfo.ClassifiedNum,
		})
	}
	return nodes
}

// genSubjectDomainWithHierarchy 查询某个业务域分组带分级
// subjects: 某个业务域分组的所有节点信息
// cs: 数据库中的某个业务域分组的分类分级信息
func (c *SubjectDomainUsecase) genSubjectDomainWithHierarchy(subjects []*model.SubjectDomain, cs []classify.SubjectClassify) []*SubjectNode {
	nodes := make([]*SubjectNode, 0)

	nodeIndexDict := make(map[string]int)
	for _, classifyInfo := range cs {
		for _, subject := range subjects {
			if !strings.Contains(classifyInfo.PathID, subject.ID) {
				continue
			}
			nodeIndex, ok := nodeIndexDict[subject.ID]
			if !ok {
				nodes = append(nodes, NewSubjectObjectNode(subject, classifyInfo))
				nodeIndexDict[subject.ID] = len(nodes) - 1
				continue
			} else {
				exitNode := nodes[nodeIndex]
				exitNode.ClassifiedNum += classifyInfo.ClassifiedNum
				if classifyInfo.LabelID != "" {
					exitNode.HierarchyInfo = append(exitNode.HierarchyInfo, GenHierarchyTag(classifyInfo))
				}
			}
		}
	}
	for _, node := range nodes {
		node.ClassifyTag()
	}
	return nodes
}

// genSubjectGroupsWithHierarchy 查询顶层带分级
// groups:所有的顶层业务域分组信息
// cs: 数据库中的顶层带分级的分类信息
func (c *SubjectDomainUsecase) genSubjectGroupsWithHierarchy(groups []*model.SubjectDomain, cs []classify.SubjectClassify) []*SubjectNode {
	nodes := make([]*SubjectNode, 0)

	//按照业务域分组分组
	classifyListDict := make(map[string][]classify.SubjectClassify)
	for i := 0; i < len(cs); i++ {
		classifyListDict[cs[i].RootId] = append(classifyListDict[cs[i].RootId], cs[i])
	}

	indexDict := make(map[string]int)
	for _, group := range groups {
		classifyInfoList, ok := classifyListDict[group.ID]
		if !ok {
			//如果某个业务域分组没有任何信息，返回默认值
			nodes = append(nodes, NewDefaultSubjectNode(group))
			continue
		}
		for _, classifyInfo := range classifyInfoList {
			subjectNode := NewSubjectGroupNode(classifyInfo)
			subjectNode.Type = constant.SubjectDomainObjectIntToString(group.Type)
			index, ok := indexDict[group.ID]
			if !ok {
				nodes = append(nodes, subjectNode)
				indexDict[group.ID] = len(nodes) - 1
			} else {
				existSubjectNode := nodes[index]
				existSubjectNode.ClassifiedNum += subjectNode.ClassifiedNum
				if len(subjectNode.HierarchyInfo) > 0 {
					existSubjectNode.HierarchyInfo = append(existSubjectNode.HierarchyInfo, subjectNode.HierarchyInfo...)
				}
			}
		}
	}
	for _, node := range nodes {
		node.ClassifyTag()
	}
	return nodes
}

// QueryGroupClassify 给数据库查出来的分类分级信息cs加上标签信息，name和color，然后以数组的形式返回，该方法只用在业务域分组这一层级上
func (c *SubjectDomainUsecase) QueryGroupClassify(ctx context.Context, openHierarchy bool, rootId string) ([]classify.SubjectClassify, error) {
	isOperator := c.isOperator(ctx)
	cs, err := c.classifyRepo.QueryGroupClassify(ctx, isOperator, openHierarchy, rootId)
	if err != nil {
		log.Errorf("QueryGroupClassify error %v", err.Error())
		return nil, err
	}
	for i := range cs {
		if cs[i].LabelID == "0" {
			cs[i].LabelID = ""
		}
	}
	if !openHierarchy {
		return cs, nil
	}
	//补充label信息
	labelIDSlice := iter.Gen(cs, func(g classify.SubjectClassify) string {
		return g.LabelID
	})
	if len(labelIDSlice) <= 0 || !openHierarchy {
		return cs, nil
	}
	labelInfoDict, err := c.ccDriven.QueryDataGrade(ctx, labelIDSlice...)
	if err != nil {
		log.Errorf("QueryGroupClassify QueryDataGrade error %v", err.Error())
		return cs, err
	}
	for i := range cs {
		labelInfo, ok := labelInfoDict[cs[i].LabelID]
		if ok {
			cs[i].LabelName = labelInfo.Name
			cs[i].LabelColor = labelInfo.Icon
			cs[i].LabelSortWeight = labelInfo.SortWeight
		} else {
			cs[i].LabelID = ""
		}
	}
	return cs, nil
}

func (c *SubjectDomainUsecase) queryLabelInfo(ctx context.Context, labelIDSlice []string) (map[string]*HierarchyTag, error) {
	labelInfoDict, err := c.ccDriven.QueryDataGrade(ctx, labelIDSlice...)
	if err != nil {
		log.Errorf("QueryGroupClassify QueryDataGrade error %v", err.Error())
		return nil, err
	}
	results := make(map[string]*HierarchyTag)
	for k, v := range labelInfoDict {
		results[k] = &HierarchyTag{
			ID:    v.ID,
			Name:  v.Name,
			Color: v.Icon,
		}
	}
	return results, nil
}

func GenGroupViews(views []*classify.FormViewSubjectField) []RelatedFormView {
	results := make([]RelatedFormView, 0)
	viewIndexDict := make(map[string]int)
	for _, view := range views {
		if _, ok := viewIndexDict[view.ViewID]; !ok {
			view.FixCatalog()
			results = append(results, RelatedFormView{
				FormViewID:    view.ViewID,
				CatalogName:   view.CatalogName,
				Schema:        view.Schema,
				BusinessName:  view.ViewBusinessName,
				TechnicalName: view.ViewTechnicalName,
			})
			viewIndexDict[view.ViewID] = 1
		}
	}
	return results
}

func GenGroupFields(fields []*classify.FormViewSubjectField, labelInfoDict map[string]*HierarchyTag, openHierarchy bool) []RelatedFormView {
	results := make([]RelatedFormView, 0)

	viewIndexDict := make(map[string]int)
	for _, field := range fields {
		field.FixCatalog()
		var labelInfo *HierarchyTag
		if openHierarchy {
			label, ok := labelInfoDict[field.LabelID]
			if !ok {
				label = &HierarchyTag{
					Name: "未分级",
				}
			}
			labelInfo = label
		}

		viewField := &ViewField{
			ID:            field.ID,
			BusinessName:  field.BusinessName,
			TechnicalName: field.TechnicalName,
			DataType:      field.DataType,
			IsPrimary:     field.IsPrimary,
			SubjectID:     field.SubjectID,
			Property: &SubjectProp{
				ID:       field.SubjectID,
				Name:     field.SubjectName,
				PathID:   field.PathID,
				PathName: field.PathName,
			},
			HierarchyTag: labelInfo,
		}
		viewIndex, ok := viewIndexDict[field.ViewID]
		if !ok {
			results = append(results, RelatedFormView{
				FormViewID:    field.ViewID,
				CatalogName:   field.CatalogName,
				Schema:        field.Schema,
				BusinessName:  field.ViewBusinessName,
				TechnicalName: field.ViewTechnicalName,
				Fields:        []*ViewField{viewField},
			})
			viewIndexDict[field.ViewID] = len(results) - 1
		} else {
			item := results[viewIndex]
			item.Fields = append(item.Fields, viewField)
			results[viewIndex] = item
		}
	}
	return results
}
