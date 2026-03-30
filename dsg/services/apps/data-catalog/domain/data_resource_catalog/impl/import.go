package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/xuri/excelize/v2"
)

func (d *DataResourceCatalogDomain) ImportDataCatalog(ctx context.Context, formFile *multipart.FileHeader) (res *data_resource_catalog.ImportDataCatalogRes, err error) {
	reader, err := formFile.Open()
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return nil, errorcode.Detail(errorcode.FormOpenExcelFileError, err.Error())
	}
	defer func() {
		if err := reader.Close(); err != nil {
			log.WithContext(ctx).Error("reader.Close " + err.Error())
		}
	}()
	xlsxFile, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, errorcode.Detail(errorcode.FormOpenExcelFileError, err.Error())
	}
	sheetList := xlsxFile.GetSheetList()
	catalogSheet, err := xlsxFile.GetRows(sheetList[0], excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, err
	}
	importCatalogs, err := d.bindVerifyCatalog(ctx, catalogSheet)
	if err != nil {
		return nil, err
	}

	columnSheet, err := xlsxFile.GetRows(sheetList[1], excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, err
	}
	importColumns, err := d.bindVerifyColumn(ctx, columnSheet)
	if err != nil {
		return nil, err
	}
	createCatalogDraftReqs := make([]*data_resource_catalog.SaveDataCatalogDraftReqBody, len(importCatalogs))
	for i, importCatalog := range importCatalogs {
		columns := importColumns[importCatalog.DataResourceCatalogName]
		columnInfoDrafts := make([]*data_resource_catalog.ColumnInfoDraft, len(columns))
		for j, column := range columns {
			var standardCode, codeTableID string
			if column.StandardName != "" {
				standardList, err := d.standardDriven.GetStandardList(ctx, standardization.GetListReq{CatalogID: "11", Keyword: column.StandardName})
				if err != nil {
					return nil, err
				}
				for _, standard := range standardList.Data {
					if standard.ChName == column.StandardName {
						standardCode = standard.Code
					}
				}

			}
			if column.CodeTableName != "" {
				codeTableList, err := d.standardDriven.GetCodeTableList(ctx, standardization.GetListReq{CatalogID: "22", Keyword: column.CodeTableName})
				if err != nil {
					return nil, err
				}
				for _, codeTable := range codeTableList.Data {
					if codeTable.ChName == column.CodeTableName {
						codeTableID = codeTable.ID
					}
				}
			}
			columnInfoDrafts[j] = &data_resource_catalog.ColumnInfoDraft{
				IDOmitempty:   data_resource_catalog.IDOmitempty{},
				BusinessName:  column.BusinessName,
				TechnicalName: column.TechnicalName,
				SourceID:      "",
				StandardCode:  standardCode,
				CodeTableID:   codeTableID,
				DataFormat:    column.DataFormat.ToInt32(),
				DataLength:    column.DataLength,
				//DataPrecision:  column.DataPrecision,
				DataRange:  column.DataRange,
				SharedType: column.SharedType.ToInt8(),
				OpenType:   column.OpenType.ToInt8(),
				//OpenCondition:  column.OpenCondition,
				ClassifiedFlag: column.ClassifiedFlag.ToInt16(),
				SensitiveFlag:  column.SensitiveFlag.ToInt16(),
				TimestampFlag:  column.TimestampFlag.ToInt16(),
				PrimaryFlag:    column.PrimaryFlag.ToInt16(),
			}
		}
		//处理主题域
		subjectIDs := make([]string, 0)
		if importCatalog.SubjectCategory != "其他" {
			subjectPaths := strings.Split(importCatalog.SubjectCategory, ";")
			subjectRes, err := d.dataSubjectDriven.GetDataSubjectByPath(ctx, &data_subject.GetDataSubjectByPathReq{Paths: subjectPaths})
			if err != nil {
				return nil, err
			}
			for _, subject := range subjectRes.DataSubjects {
				subjectIDs = append(subjectIDs, subject.ID)
			}
		} else {
			subjectIDs = []string{constant.OtherSubject}
		}

		//校验数据分级
		dataClassifyDictItems, err := d.configurationCenterDriven.GetGradeLabel(ctx, nil)
		if err != nil {
			return nil, err
		}

		dataClassifyDictItemMap := make(map[string]string)
		recursionNameID(dataClassifyDictItems.GradeLabel, dataClassifyDictItemMap)
		if _, exist := dataClassifyDictItemMap[importCatalog.DataClassification]; !exist {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+4, "*数据分级不正确"))
		}
		//查询数据源
		var resourceID string
		if importCatalog.MountResourceName != "" {
			dataResources, err := d.dataResourceRepo.GetByName(ctx, importCatalog.MountResourceName, constant.MountView)
			if err != nil {
				return nil, err
			}
			if len(dataResources) < 1 {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+4, "*挂接资源名称 不存在"))
			}
			resourceID = dataResources[0].ResourceId
		}

		//查询校验自定义类目
		categoryNames := make([]string, 0)
		if importCatalog.ResourceAttributeCategory1 != "" {
			categoryNames = append(categoryNames, importCatalog.ResourceAttributeCategory1)
		}
		if importCatalog.ResourceAttributeCategory2 != "" {
			categoryNames = append(categoryNames, importCatalog.ResourceAttributeCategory2)
		}
		/*		if importCatalog.ResourceAttributeCategory3 != "" {
				categoryNames = append(categoryNames, importCatalog.ResourceAttributeCategory3)
			}*/
		categoryNode, err := d.categoryRepo.GetCategoryNodeByNames(ctx, categoryNames)
		if err != nil {
			return nil, err
		}
		if len(categoryNode) != len(categoryNames) {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+4, "自定义类目 不存在"))
		}
		categoryIDs := make([]string, len(categoryNode))
		for i2, node := range categoryNode {
			categoryIDs[i2] = node.CategoryNodeID
		}

		//查询部门
		departmentPathRes, err := d.configurationCenterDriven.GetDepartmentByPath(ctx, &configuration_center.GetDepartmentByPathReq{Paths: util.DuplicateStringRemoval([]string{importCatalog.DataResourceDepartment, importCatalog.CatalogProvider})})
		if err != nil {
			return nil, err
		}
		departmentNamePathMap := make(map[string]string)
		for _, department := range departmentPathRes.Departments {
			departmentNamePathMap[department.Path] = department.ID
		}
		if importCatalog.DataResourceDepartment != "" && departmentNamePathMap[importCatalog.DataResourceDepartment] == "" {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+4, "数据资源来源部门 不存在"))
		}
		if departmentNamePathMap[importCatalog.CatalogProvider] == "" {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+4, "*目录提供方 不存在"))
		}
		//查询信息系统
		var infoSystemID string
		if importCatalog.InfoSystem != "" {
			infoSystems, err := d.configurationCenterDriven.GetInfoSystemsPrecision(ctx, nil, []string{importCatalog.InfoSystem})
			if err != nil {
				return nil, err
			}
			if len(infoSystems) < 1 {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+4, "*所属信息系统 不存在"))
			}
			infoSystemID = infoSystems[0].ID
		}
		dataMatterIDs := make([]string, 0)

		if importCatalog.DataMatter != "" {
			dataMatters := strings.Split(importCatalog.DataMatter, ";")
			dataMatterMap := make(map[string]string)
			for _, matter := range dataMatters {
				dataMatterMap[matter] = ""
			}
			matterPage, err := d.configurationCenterDriven.GetBusinessMatterPage(ctx, &configuration_center.GetBusinessMatterPageReq{Limit: 2000})
			if err != nil {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
			}
			for _, m := range matterPage.Entries {
				if _, e := dataMatterMap[m.Name]; e {
					dataMatterMap[m.Name] = m.ID
				}
			}
			for _, v := range dataMatterMap {
				dataMatterIDs = append(dataMatterIDs, v)
			}
		}

		createCatalogDraftReqs[i] = &data_resource_catalog.SaveDataCatalogDraftReqBody{
			CatalogInfoDraft: data_resource_catalog.CatalogInfoDraft{
				Name:                  importCatalog.DataResourceCatalogName,
				SourceDepartmentID:    departmentNamePathMap[importCatalog.DataResourceDepartment],
				DepartmentID:          departmentNamePathMap[importCatalog.CatalogProvider],
				InfoSystemID:          infoSystemID,
				SubjectID:             subjectIDs,
				AppSceneClassify:      importCatalog.AppSceneClassify.ToInt8Ptr(),
				OtherAppSceneClassify: "",
				DataRelatedMatters:    importCatalog.DataMatter,
				BusinessMatters:       dataMatterIDs,
				DataRange:             importCatalog.SpatialScope.ToInt32(),
				UpdateCycle:           importCatalog.UpdateCycle.ToInt32(),
				OtherUpdateCycle:      "",
				DataClassify:          dataClassifyDictItemMap[importCatalog.DataClassification],
				Description:           importCatalog.Description,
				IsImport:              true,
				ReportInfo: data_resource_catalog.ReportInfo{
					TimeRange: importCatalog.DataTimeRange,
				},
			},
			CategoryNodeIds: categoryIDs,
			SharedOpenInfoDraft: data_resource_catalog.SharedOpenInfoDraft{
				SharedType:      importCatalog.SharedType.ToInt8(),
				SharedCondition: importCatalog.SharingConditions,
				OpenType:        importCatalog.OpenType.ToInt8(),
				OpenCondition:   importCatalog.OpenConditions,
				SharedMode:      importCatalog.SharedMode.ToInt8(),
			},
			Columns: columnInfoDrafts,
			MoreInfoDraft: data_resource_catalog.MoreInfoDraft{
				PhysicalDeletion: importCatalog.IsDataPhysicallyDeleted.ToInt8(),
				SyncMechanism:    importCatalog.DataSyncMechanism.ToInt8(),
				SyncFrequency:    importCatalog.SyncFrequency,
				PublishFlag:      importCatalog.IsOnlineInSupermarket.ToInt8(),
			},
		}
		if resourceID != "" {
			createCatalogDraftReqs[i].MountResources = []*data_resource_catalog.MountResource{{
				ResourceType: constant.MountView,
				ResourceID:   resourceID,
			}}
		}
	}

	res = &data_resource_catalog.ImportDataCatalogRes{
		SuccessCreateCatalog: make([]*data_resource_catalog.SuccessCatalog, 0),
		FailCreateCatalog:    make([]*data_resource_catalog.FailCatalog, 0),
	}
	for _, req := range createCatalogDraftReqs {
		createCatalogDraftRes, err := d.SaveDataCatalogDraft(ctx, req)
		if err != nil {
			res.FailCreateCatalogCount++
			code := agerrors.Code(err)
			res.FailCreateCatalog = append(res.FailCreateCatalog, &data_resource_catalog.FailCatalog{
				Name: req.Name,
				Error: ginx.HttpError{
					Code:        code.GetErrorCode(),
					Description: code.GetDescription(),
					Solution:    code.GetSolution(),
					Cause:       code.GetCause(),
					Detail:      code.GetErrorDetails(),
				},
			})
			continue
		}
		res.SuccessCreateCatalogCount++
		res.SuccessCreateCatalog = append(res.SuccessCreateCatalog, &data_resource_catalog.SuccessCatalog{
			Name: req.Name,
			Id:   createCatalogDraftRes.ID,
		})
	}

	return res, nil
}

func (d *DataResourceCatalogDomain) bindVerifyCatalog(ctx context.Context, rows [][]string) ([]*ImportCatalog, error) {
	importCatalogs := make([]*ImportCatalog, 0)
	if len(rows) < 4 {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "数据资源目录导入模板不正确或者没有数据")
	}
	if len(rows) > 103 {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "数据资源目录导入不超过100条")
	}
	for i := 3; i < len(rows); i++ {
		row := rows[i]
		if row == nil {
			continue //跳过空行
		}
		if len(row) < 19 { //24
			marshal, _ := json.Marshal(row)
			//return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v ， 错误数据：%s", i+1, "缺少数据", marshal))
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("错误：缺少数据 ，错误数据：%s", marshal), "数据资源目录导入", i+1)
		}
		importCatalog := &ImportCatalog{
			MountResourceName:          row[0],
			DataResourceCatalogName:    row[1],
			DataResourceDepartment:     row[2],
			CatalogProvider:            row[3],
			InfoSystem:                 row[4],
			SubjectCategory:            row[5],
			AppSceneClassify:           AppSceneClassify(row[6]),
			DataMatter:                 row[7],
			SpatialScope:               SpatialScope(row[8]),
			DataTimeRange:              row[9],
			UpdateCycle:                UpdateCycle(row[10]),
			DataClassification:         row[11],
			Description:                row[12],
			ResourceAttributeCategory1: row[13],
			ResourceAttributeCategory2: row[14],
			//ResourceAttributeCategory3: row[15],
			SharedType:              SharedType(row[15]),
			SharingConditions:       row[16],
			SharedMode:              SharedMode(row[17]),
			OpenType:                OpenType(dealEmpty(row, 18)),
			OpenConditions:          dealEmpty(row, 19),
			DataSyncMechanism:       DataSyncMechanism(dealEmpty(row, 20)),
			SyncFrequency:           dealEmpty(row, 21),
			IsDataPhysicallyDeleted: Bool(dealEmpty(row, 22)),
			IsOnlineInSupermarket:   Bool(dealEmpty(row, 23)),
		}
		if err := GetValidator().Struct(importCatalog); err != nil {
			//return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("数据资源目录 %d 行 ，错误： %v", i+1, HandleValidError(err)))
			return nil, errorcode.Detail(errorcode.ImportInvalidError, HandleValidError2(err), "数据资源目录导入", i+1)
		}
		importCatalog.DataTimeRange = DataTimeRangeTransfer(importCatalog.DataTimeRange)
		importCatalogs = append(importCatalogs, importCatalog)
	}
	return importCatalogs, nil
}
func dealEmpty(slice []string, num int) string {
	if len(slice) > num {
		return slice[num]
	}
	return ""
}
func DataTimeRangeTransfer(timeRange string) string {
	split := strings.Split(timeRange, "-")
	if len(split) == 2 {
		startTime := strings.Replace(split[0], "/", "-", 0)
		endTime := strings.Replace(split[1], "/", "-", 0)
		return startTime + " 00:00:00" + "," + endTime + " 00:00:00"
	}
	return timeRange
}
func (d *DataResourceCatalogDomain) bindVerifyColumn(ctx context.Context, rows [][]string) (map[string][]*ImportColumn, error) {
	var err error
	importColumns := make(map[string][]*ImportColumn, 0)
	if len(rows) < 2 {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "信息项导入模板不正确")
	}
	if len(rows) > 5002 {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "信息项导入不超过5000条")
	}
	for i := 2; i < len(rows); i++ {
		row := rows[i]
		if row == nil {
			continue //跳过空行
		}
		if len(row) < 12 { //14
			marshal, _ := json.Marshal(row)
			//return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("信息项  %d 行 ， 错误： %v ， 错误数据：%s", i+1, "缺少数据", marshal))
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("错误：缺少数据 ，错误数据：%s", marshal), "信息项", i+1)
		}
		//dataLength := new(int32)
		var dataLength *int32
		if row[6] != "" {
			tmp, err := strconv.Atoi(row[6])
			if err != nil {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error(), "信息项", i+1)
			}
			var int32Tmp = int32(tmp)
			dataLength = &int32Tmp
		}
		importColumn := &ImportColumn{
			DataResourceCatalogName: row[0],
			BusinessName:            row[1],
			TechnicalName:           row[2],
			StandardName:            row[3],
			CodeTableName:           row[4],
			DataFormat:              DataFormat(row[5]),
			DataLength:              dataLength,
			DataRange:               row[7],
			SharedType:              SharedType(row[8]),
			OpenType:                OpenType(row[9]),
			SensitiveFlag:           SensitiveFlag(row[10]),
			ClassifiedFlag:          ClassifiedFlag(row[11]),
			TimestampFlag:           Bool(dealEmpty(row, 12)),
			PrimaryFlag:             Bool(dealEmpty(row, 13)),
		}
		if err = GetValidator().Struct(importColumn); err != nil {
			//return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("信息项 %d 行 ，错误： %v", i+1, err.Error()))
			return nil, errorcode.Detail(errorcode.ImportInvalidError, HandleValidError2(err), "信息项导入", i+1)
		}
		if _, ok := importColumns[importColumn.DataResourceCatalogName]; !ok {
			importColumns[importColumn.DataResourceCatalogName] = []*ImportColumn{importColumn}
			continue
		}
		importColumns[importColumn.DataResourceCatalogName] = append(importColumns[importColumn.DataResourceCatalogName], importColumn)

	}
	return importColumns, nil
}
