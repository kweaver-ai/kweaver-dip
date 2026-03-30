package impl

import (
	"context"
	"fmt"
	"mime/multipart"
	"strconv"
	"time"

	"go.uber.org/zap"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/classify"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence_column"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	common_util "github.com/kweaver-ai/idrm-go-common/util"
	data_type "github.com/kweaver-ai/idrm-go-common/util/data_type"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/xuri/excelize/v2"
)

type ElecLicenceDomain struct {
	elecLicenceRepo           elec_licence.ElecLicenceRepo
	elecLicenceColumnRepo     elec_licence_column.ElecLicenceColumnRepo
	classify                  classify.ClassifyRepo
	es                        es.ESRepo
	bsRepo                    basic_search.Repo
	configurationCenterDriven configuration_center.Driven
	myFavoriteRepo            my_favorite.Repo
}

func NewElecLicenceDomain(
	elecLicenceRepo elec_licence.ElecLicenceRepo,
	elecLicenceColumnRepo elec_licence_column.ElecLicenceColumnRepo,
	classify classify.ClassifyRepo,
	es es.ESRepo,
	bsRepo basic_search.Repo,
	configurationCenterDriven configuration_center.Driven,
	myFavoriteRepo my_favorite.Repo,
) domain.ElecLicenceUseCase {
	return &ElecLicenceDomain{
		elecLicenceRepo:           elecLicenceRepo,
		elecLicenceColumnRepo:     elecLicenceColumnRepo,
		classify:                  classify,
		es:                        es,
		bsRepo:                    bsRepo,
		configurationCenterDriven: configurationCenterDriven,
		myFavoriteRepo:            myFavoriteRepo,
	}
}

const searchElecLicenceRequestSize = 20

func (d *ElecLicenceDomain) Search(ctx context.Context, req *domain.SearchReq) (*domain.SearchRes, error) {
	userInfo, err := common_util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	//isOperation, err := d.configurationCenterDriven.GetRolesInfo(ctx, access_control.TCDataOperationEngineer, userInfo.ID)
	//if err != nil {
	//	return nil, err
	//}
	/*isOperation, err := d.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.ManagerDZZZPermission, userInfo.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.cc.Search failed: %v", err)
		return nil, err
	}
	log.Infof("----------------current operation------------------>isOperation: %v", isOperation)*/

	/*if !isOperation {
		req.IsOnline = new(bool)
		*req.IsOnline = true
	}*/
	IsOnline := true
	log.Infof("[===========================search elec licence] req: %v", req)
	searchReq := &basic_search.SearchElecLicenceRequest{
		CommonSearchParam: basic_search.CommonSearchParam{
			Keyword:  req.Keyword,
			IsOnline: &IsOnline,
			IDs:      req.Filter.IDs,
			Fields:   req.Filter.Fields,
		},
		Orders:                req.Filter.Orders,
		Size:                  searchElecLicenceRequestSize,
		NextFlag:              req.NextFlag,
		IndustryDepartmentIDs: req.IndustryDepartments,
	}
	if req.Filter.PublishedAt.Start != nil || req.Filter.PublishedAt.End != nil {
		searchReq.PublishedAt = &basic_search.TimeRange{StartTime: req.Filter.PublishedAt.Start, EndTime: req.Filter.PublishedAt.End}
	}

	searchRes, err := d.bsRepo.SearchElecLicence(ctx, searchReq)
	if err != nil {
		return nil, err
	}
	res := &domain.SearchRes{
		Entries:    make([]*domain.SearchEntrity, len(searchRes.Entries)),
		TotalCount: searchRes.TotalCount,
		NextFlag:   searchRes.NextFlag,
	}

	cids := make([]string, len(searchRes.Entries))
	cid2idx := make(map[string]int, len(searchRes.Entries))
	for i := range searchRes.Entries {
		res.Entries[i] = &domain.SearchEntrity{
			Columns:            make([]string, len(searchRes.Entries[i].Fields)),
			ID:                 searchRes.Entries[i].ID,
			Name:               searchRes.Entries[i].Name,
			RawName:            searchRes.Entries[i].RawName,
			Code:               searchRes.Entries[i].Code,
			Type:               searchRes.Entries[i].LicenseType,
			Department:         searchRes.Entries[i].Department,
			OnlineStatus:       searchRes.Entries[i].OnlineStatus,
			OnlineTime:         searchRes.Entries[i].OnlineAt,
			UpdatedAt:          searchRes.Entries[i].UpdatedAt,
			IndustryDepartment: searchRes.Entries[i].IndustryDepartment,
			CertificationLevel: searchRes.Entries[i].CertificationLevel,
		}
		cids = append(cids, searchRes.Entries[i].ID)
		cid2idx[searchRes.Entries[i].ID] = i
		for j, field := range searchRes.Entries[i].Fields {
			res.Entries[i].Columns[j] = field.FieldNameZH
		}
	}

	if len(cids) > 0 {
		var (
			favoredRIDs []*my_favorite.FavorIDBase
			idx         int
		)
		if favoredRIDs, err = d.myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx,
			userInfo.ID, cids, my_favorite.RES_TYPE_ELEC_CATALOG); err != nil {
			log.WithContext(ctx).Errorf("d.myFavoriteRepo.FilterFavoredRIDS failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		for i := range favoredRIDs {
			idx = cid2idx[favoredRIDs[i].ResID]
			res.Entries[idx].IsFavored = true
			res.Entries[idx].FavorID = favoredRIDs[i].ID
		}
	}
	return res, nil
}
func (d *ElecLicenceDomain) GetElecLicenceList(ctx context.Context, req *domain.ElecLicenceListReq) (*domain.ElecLicenceListRes, error) {
	if req.ClassifyID != "" {
		classifies, err := d.classify.GetClassifyByPathID(ctx, req.ClassifyID)
		if err != nil {
			return nil, err
		}
		req.ClassifyIDs = make([]string, len(classifies))
		for i, c := range classifies {
			req.ClassifyIDs[i] = c.ClassifyID
		}
		req.ClassifyIDs = append(req.ClassifyIDs, req.ClassifyID)
	}
	totalCount, elecLicences, err := d.elecLicenceRepo.GetList(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	res := make([]*domain.ElecLicenceList, len(elecLicences))
	for i, el := range elecLicences {
		res[i] = &domain.ElecLicenceList{
			ID:                 el.ElecLicenceID,
			Name:               el.LicenceName,
			Code:               el.LicenceBasicCode,
			IndustryDepartment: el.IndustryDepartment,
			CertificationLevel: el.CertificationLevel,
			Type:               el.LicenceType,
			Department:         el.Department,
			OnlineStatus:       el.OnlineStatus,
			UpdatedAt:          el.UpdateTime.UnixMilli(),
		}
	}
	return &domain.ElecLicenceListRes{
		Entries:      res,
		TotalCount:   totalCount,
		LastSyncTime: time.Now().UnixMilli(),
	}, nil
}
func (d *ElecLicenceDomain) GetElecLicenceDetail(ctx context.Context, id string) (*domain.GetElecLicenceDetailRes, error) {
	elecLicence, err := d.elecLicenceRepo.GetByElecLicenceID(ctx, id)
	if err != nil {
		return nil, err
	}
	res := &domain.GetElecLicenceDetailRes{
		ID:                 elecLicence.ElecLicenceID,
		Name:               elecLicence.LicenceName,
		Code:               elecLicence.LicenceBasicCode,
		IndustryDepartment: elecLicence.IndustryDepartment,
		CertificationLevel: elecLicence.CertificationLevel,
		Type:               elecLicence.LicenceType,
		HolderType:         elecLicence.HolderType,
		Department:         elecLicence.Department,
		Expire:             elecLicence.Expire,
		OnlineStatus:       elecLicence.OnlineStatus,
		UpdatedAt:          elecLicence.UpdateTime.UnixMilli(),
	}
	if elecLicence.OnlineTime != nil {
		res.OnlineTime = elecLicence.OnlineTime.UnixMilli()
	}
	userInfo, err := common_util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	favorites, err := d.myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx, userInfo.ID, []string{id}, my_favorite.RES_TYPE_ELEC_CATALOG)
	if err != nil {
		log.WithContext(ctx).Errorf("d.myFavoriteRepo.FilterFavoredRIDS err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(favorites) > 0 {
		res.IsFavored = true
		res.FavorID = favorites[0].ID
	}
	return res, nil
}

func (d *ElecLicenceDomain) GetElecLicenceColumnList(ctx context.Context, req domain.GetElecLicenceColumnListReq) (*domain.GetElecLicenceColumnListRes, error) {
	totalCount, elecLicenceColumns, err := d.elecLicenceColumnRepo.GetByElecLicenceIDPage(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	res := make([]*domain.ElecLicenceColum, len(elecLicenceColumns))
	for i, elecLicenceColumn := range elecLicenceColumns {
		res[i] = &domain.ElecLicenceColum{
			BusinessName: elecLicenceColumn.BusinessName,
			DataLength:   elecLicenceColumn.Size,
			DataType:     elecLicenceColumn.AfDataType,
		}
	}
	return &domain.GetElecLicenceColumnListRes{
		Entries:    res,
		TotalCount: totalCount,
	}, nil

}

func (d *ElecLicenceDomain) GetClassifyTree(ctx context.Context) (*domain.GetClassifyTreeRes, error) {
	classifyTrees, err := d.GetChildrenClassifyTree(ctx, "")
	if err != nil {
		return nil, err
	}
	return &domain.GetClassifyTreeRes{ClassifyTree: classifyTrees}, nil
}
func (d *ElecLicenceDomain) GetChildrenClassifyTree(ctx context.Context, parentId string) ([]*domain.ClassifyTree, error) {
	nodes, err := d.classify.GetClassifyByParentID(ctx, parentId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(nodes) == 0 {
		return nil, nil
	}
	classifyTrees := make([]*domain.ClassifyTree, len(nodes))
	for i, node := range nodes {
		children, err := d.GetChildrenClassifyTree(ctx, node.ClassifyID)
		if err != nil {
			return nil, err
		}
		classifyTrees[i] = &domain.ClassifyTree{
			ID:       node.ClassifyID,
			Name:     node.Name,
			Children: children,
		}
	}
	return classifyTrees, nil
}

/*
func (d *ElecLicenceDomain) GetClassify(ctx context.Context, req *domain.GetClassifyReq) (*domain.GetClassifyRes, error) {
	nodes, err := d.classify.GetClassifyByParentID(ctx, "", req.Keyword)
	if err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nil, nil
	}
	classify := make([]*domain.Classify, 0)
	for _, node := range nodes {
		classify = append(classify, &domain.Classify{
			ID:     node.ClassifyID,
			Name:   node.Name,
			PathId: node.ClassifyID,
			Path:   node.Name,
		})
		children, err := d.GetChildrenClassify(ctx, node.ClassifyID, node.ClassifyID, node.Name, req.Keyword)
		if err != nil {
			return nil, err
		}
		if len(children) > 0 {
			classify = append(classify, children...)
		}
	}
	return &domain.GetClassifyRes{Classify: classify}, nil
}
func (d *ElecLicenceDomain) GetChildrenClassify(ctx context.Context, parentId string, parentPathId string, parentPath string, keyword string) ([]*domain.Classify, error) {
	nodes, err := d.classify.GetClassifyByParentID(ctx, parentId, keyword)
	if err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nil, nil
	}
	classify := make([]*domain.Classify, 0)
	for _, node := range nodes {
		c := &domain.Classify{
			ID:     node.ClassifyID,
			Name:   node.Name,
			PathId: fmt.Sprintf("%s/%s", parentPathId, node.ClassifyID),
			Path:   fmt.Sprintf("%s/%s", parentPath, node.Name),
		}
		classify = append(classify, c)
		children, err := d.GetChildrenClassify(ctx, c.ID, c.PathId, c.Path, keyword)
		if err != nil {
			return nil, err
		}
		if len(children) > 0 {
			classify = append(classify, children...)
		}
	}
	return classify, nil
}*/

func (d *ElecLicenceDomain) GetClassify(ctx context.Context, req *domain.GetClassifyReq) (*domain.GetClassifyRes, error) {
	classifies, err := d.classify.ListClassifies(ctx, req.Keyword)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	res := make([]*domain.Classify, len(classifies))
	for i, c := range classifies {
		res[i] = &domain.Classify{
			ID:     c.ClassifyID,
			Name:   c.Name,
			PathId: c.PathID,
			Path:   c.Path,
		}
	}
	return &domain.GetClassifyRes{Classify: res}, nil
}

func (d *ElecLicenceDomain) CreateClassify(ctx context.Context) error {
	f, err := excelize.OpenFile("D:\\file\\bbb.xlsx")
	if err != nil {
		return err
	}
	rows, err := f.GetRows("Sheet1")
	if err != nil {
		return err
	}
	classifys := make([]*model.Classify, 0)
	root := uuid.New().String()
	createId := "5324642e-9b5a-11ef-a86d-86571da41068"
	classifys = append(classifys, &model.Classify{
		ClassifyID: root,
		Name:       "行业电子证照",
		PathID:     root,
		Path:       "行业电子证照",
		CreatedAt:  time.Now(),
		CreatedBy:  createId,
	})
	for _, row := range rows {
		rowId := uuid.New().String()
		classifys = append(classifys, &model.Classify{
			ClassifyID: rowId,
			Name:       row[0],
			ParentID:   root,
			PathID:     fmt.Sprintf("%s/%s", root, rowId),
			Path:       fmt.Sprintf("%s/%s", "行业电子证照", row[0]),
			CreatedAt:  time.Now(),
			CreatedBy:  createId,
		})

	}
	if err = d.classify.Truncate(ctx); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if err = d.classify.CreateInBatches(ctx, classifys); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *ElecLicenceDomain) Import(ctx context.Context, file multipart.File) error {
	importFile, err := excelize.OpenReader(file)
	if err != nil {
		return errorcode.Detail(errorcode.OpenReaderError, err.Error())
	}
	return d.importEl(ctx, importFile)
}
func (d *ElecLicenceDomain) Export(ctx context.Context, req *domain.ExportReq) (*excelize.File, error) {
	elecLicences, err := d.elecLicenceRepo.GetByElecLicenceIDs(ctx, req.IDs)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	file, err := excelize.OpenFile("cmd/server/static/elec_licence.xlsx")
	if err != nil {
		return nil, errorcode.Detail(errorcode.ElecLicenceExport, err.Error())
	}
	excelize.NewFile()
	/*excelize.NewFile()
	if err = file.SetSheetRow("电子证照", "A1", &[]interface{}{
		"证照名称",
		"发证级别",
		"行业",
		"证照主体",
		"管理部门",
		"证照编号",
		"有效期",
		"更新时间",
		"状态"}); err != nil {
		return nil, errorcode.Detail(errorcode.ElecLicenceExport, err.Error())
	}
	if err = file.SetSheetRow("信息项", "A1", &[]interface{}{
		"证照名称",
		"信息项名称",
		"数据类型",
		"数据长度"}); err != nil {
		return nil, errorcode.Detail(errorcode.ElecLicenceExport, err.Error())
	}*/
	elMap := make(map[string]string)
	for i, elecLicence := range elecLicences {
		onlineStatus := "下线"
		if _, exist := constant.OnLineMap[elecLicence.OnlineStatus]; exist {
			onlineStatus = "上线"
		}
		// 将时间转换为不带时区的字符串格式
		updateTimeStr := ""
		if !elecLicence.UpdateTime.IsZero() {
			updateTimeStr = elecLicence.UpdateTime.Format("2006-01-02 15:04:05")
		}
		row := []interface{}{
			elecLicence.LicenceName,
			elecLicence.CertificationLevel,
			elecLicence.IndustryDepartment,
			elecLicence.HolderType,
			elecLicence.Department,
			elecLicence.LicenceBasicCode,
			elecLicence.Expire,
			updateTimeStr,
			onlineStatus}
		if err = file.SetSheetRow("电子证照", "A"+strconv.Itoa(i+2), &row); err != nil {
			return nil, errorcode.Detail(errorcode.ElecLicenceExport, err.Error())
		}
		elMap[elecLicence.ElecLicenceID] = elecLicence.LicenceName

	}
	columns, err := d.elecLicenceColumnRepo.GetByElecLicenceIDs(ctx, req.IDs)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for i, column := range columns {
		// 确定显示的数据类型
		dataTypeDisplay := column.DataType
		if column.DataType == "图片" {
			dataTypeDisplay = "其他"
		}
		row := []interface{}{
			elMap[column.ElecLicenceID],
			column.BusinessName,
			dataTypeDisplay,
			column.Size}
		if err = file.SetSheetRow("信息项", "A"+strconv.Itoa(i+2), &row); err != nil {
			return nil, errorcode.Detail(errorcode.ElecLicenceExport, err.Error())
		}
	}

	return file, nil
}

func (d *ElecLicenceDomain) ImportLocal(ctx context.Context) error {
	f, err := excelize.OpenFile("D:\\file\\excel\\org.xlsx")
	if err != nil {
		return err
	}
	return d.importEl(ctx, f)
}
func (d *ElecLicenceDomain) importEl(ctx context.Context, f *excelize.File) error {
	rows, err := f.GetRows("电子证照")
	if err != nil {
		return errorcode.Detail(errorcode.OpenReaderError, err.Error())
	}

	classifies, err := d.classify.GetAll(ctx)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	classifyMap := make(map[string]string)
	for _, c := range classifies {
		classifyMap[c.Name] = c.ClassifyID
	}

	elecLicences := make([]*model.ElecLicence, 0)
	elMap := make(map[string]string)
	for i, row := range rows {
		if i == 0 {
			continue
		}
		elId := uuid.New().String()
		elecLicences = append(elecLicences, &model.ElecLicence{
			ElecLicenceID:        elId,
			LicenceName:          row[0],
			CertificationLevel:   row[1],
			IndustryDepartment:   row[2],
			IndustryDepartmentID: classifyMap[row[2]],
			HolderType:           row[3],
			Department:           row[4],
			LicenceBasicCode:     row[5],
			Expire:               row[6],
			LastModificationTime: row[7],
			LicenceState:         row[8],
			OnlineStatus:         util.CE(row[8] == "上线", "online", "notline").(string),
		})
		elMap[row[0]] = elId

	}

	cols, err := f.GetRows("信息项")
	if err != nil {
		return errorcode.Detail(errorcode.OpenReaderError, err.Error())
	}
	elecLicenceColumns := make([]*model.ElecLicenceColumn, 0)
	for i, col := range cols {
		if i == 0 {
			continue
		}
		var size int64
		size, _ = strconv.ParseInt(col[3], 10, 32)
		elecLicenceColumns = append(elecLicenceColumns, &model.ElecLicenceColumn{
			ElecLicenceColumnID: uuid.New().String(),
			ElecLicenceID:       elMap[col[0]],
			BusinessName:        col[1],
			DataType:            col[2],
			AfDataType:          data_type.Ch2SimpleTypeMapping[col[2]],
			Size:                int32(size),
		})
	}

	if err = d.elecLicenceRepo.Truncate(ctx); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if err = d.elecLicenceColumnRepo.Truncate(ctx); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	err = d.elecLicenceRepo.CreateInBatches(ctx, elecLicences)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	err = d.elecLicenceColumnRepo.CreateInBatches(ctx, elecLicenceColumns)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for _, elecLicence := range elecLicences {
		columns := make([]*model.ElecLicenceColumn, 0)
		for _, column := range elecLicenceColumns {
			if column.ElecLicenceID == elecLicence.ElecLicenceID {
				columns = append(columns, column)
			}
		}
		if err = d.es.PubElecLicenceToES(ctx, elecLicence, columns); err != nil {
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}

	return nil
}

func (d *ElecLicenceDomain) CreateAuditInstance(ctx context.Context, req *domain.CreateAuditInstanceReq) error {
	elecLicenceOrg, err := d.elecLicenceRepo.GetByElecLicenceID(ctx, req.ElecLicenceID)
	if err != nil {
		return err
	}
	elecLicence := &model.ElecLicence{
		ElecLicenceID: req.ElecLicenceID,
	}
	if !((req.AuditType == constant.AuditTypeElecLicenceOnline &&
		(elecLicenceOrg.OnlineStatus == constant.LineStatusNotLine || elecLicenceOrg.OnlineStatus == constant.LineStatusOffLine || elecLicenceOrg.OnlineStatus == constant.LineStatusUpReject)) ||
		(req.AuditType == constant.AuditTypeElecLicenceOffline &&
			(elecLicenceOrg.OnlineStatus == constant.LineStatusOnLine || elecLicenceOrg.OnlineStatus == constant.LineStatusDownReject))) {
		return errorcode.Detail(errorcode.PublicAuditApplyNotAllowedError, fmt.Sprintf("online_status is %s", elecLicenceOrg.OnlineStatus))
	}
	switch req.AuditType {
	case constant.AuditTypeElecLicenceOnline:
		elecLicence.OnlineStatus = constant.LineStatusOnLine
		now := time.Now()
		elecLicence.OnlineTime = &now
	case constant.AuditTypeElecLicenceOffline:
		elecLicence.OnlineStatus = constant.LineStatusOffLine

	}
	if err = d.elecLicenceRepo.Update(ctx, elecLicence); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	pubElecLicence, err := d.elecLicenceRepo.GetByElecLicenceID(ctx, req.ElecLicenceID)
	if err != nil {
		return err
	}
	columns, err := d.elecLicenceColumnRepo.GetByElecLicenceID(ctx, req.ElecLicenceID)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if err = d.es.PubElecLicenceToES(ctx, pubElecLicence, columns); err != nil {
		return err
	}
	/*	switch req.AuditType {
		case constant.AuditTypeElecLicenceOnline:
			columns, err := d.elecLicenceColumnRepo.GetByElecLicenceID(ctx,req.ElecLicenceID)
			if err != nil {
				return err
			}
			if err = d.es.PubElecLicenceToES(ctx, elecLicence, columns);err != nil {
				return err
			}
		case constant.AuditTypeElecLicenceOffline:
			if err = d.es.DeleteElecLicencePubES(ctx, req.ElecLicenceID);err != nil {
				return err
			}
		}*/

	return nil
}

func (d *ElecLicenceDomain) PushToEs(ctx context.Context) error {
	elecLicences, err := d.elecLicenceRepo.GetAll(ctx)
	if err != nil {
		return err
	}
	for _, elecLicence := range elecLicences {
		columns, err := d.elecLicenceColumnRepo.GetByElecLicenceID(ctx, elecLicence.ElecLicenceID)
		if err != nil {
			log.WithContext(ctx).Error("elecLicenceColumnRepo GetByElecLicenceID error ", zap.Error(err))
			continue
		}
		if err = d.es.PubElecLicenceToES(ctx, elecLicence, columns); err != nil {
			log.WithContext(ctx).Error("es PubElecLicenceToES error ", zap.Error(err))
		}
	}

	return nil
}
