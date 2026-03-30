package impl

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	data_catalog_score "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog_score"
	data_catalog_score_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_score"
	catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

type DataCatalogScoreDomain struct {
	catalogScoreRepo          data_catalog_score_repo.DataCatalogScoreRepo
	catalogRepo               catalog_repo.DataResourceCatalogRepo
	configurationCenterDriven configuration_center.Driven
}

func NewDataCatalogScoreDomain(
	catalogScoreRepo data_catalog_score_repo.DataCatalogScoreRepo,
	catalogRepo catalog_repo.DataResourceCatalogRepo,
	configurationCenterDriven configuration_center.Driven,
) data_catalog_score.DataCatalogScoreDomain {
	return &DataCatalogScoreDomain{
		catalogScoreRepo:          catalogScoreRepo,
		catalogRepo:               catalogRepo,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (d *DataCatalogScoreDomain) CreateDataCatalogScore(ctx *gin.Context, catalogId uint64, score int8) (resp *data_catalog_score.IDResp, err error) {
	//判断是否存在数据目录记录
	catalog, err := d.catalogRepo.Get(ctx, catalogId)
	if err != nil {
		return nil, err
	}

	//判断是否存在数据目录打分记录
	userInfo := request.GetUserInfo(ctx)
	catalogScore, err := d.catalogScoreRepo.GetByCatalogIdAndUid(ctx, catalog.ID, userInfo.ID)
	if catalogScore.ID != 0 {
		log.WithContext(ctx).Errorf("The user (id: %s) already has a record of ratings for this data catalog (id: %d).", userInfo.ID, catalog.ID)
		return nil, errorcode.Desc(errorcode.PublicCatalogScoreRecordAlreadyExist)
	}

	scoreId, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		return nil, err
	}
	if err := d.catalogScoreRepo.Create(ctx, &model.TDataCatalogScore{ID: scoreId, CatalogID: catalog.ID, Score: score, ScoredUID: userInfo.ID, ScoredAt: time.Now()}); err != nil {
		return nil, err
	}

	return &data_catalog_score.IDResp{ID: strconv.FormatUint(scoreId, 10)}, nil
}

func (d *DataCatalogScoreDomain) UpdateDataCatalogScore(ctx *gin.Context, catalogId uint64, score int8) (resp *data_catalog_score.IDResp, err error) {
	//判断是否存在数据目录记录
	catalog, err := d.catalogRepo.Get(ctx, catalogId)
	if err != nil {
		return nil, err
	}

	//判断是否存在数据目录打分记录
	userInfo := request.GetUserInfo(ctx)
	catalogScore, err := d.catalogScoreRepo.GetByCatalogIdAndUid(ctx, catalog.ID, userInfo.ID)
	if catalogScore.ID == 0 {
		log.WithContext(ctx).Errorf("The user (id: %s) does not have a record of score for this data catalog (id: %d).", userInfo.ID, catalog.ID)
		return nil, errorcode.Desc(errorcode.PublicCatalogScoreRecordNotExisted)
	}

	if err = d.catalogScoreRepo.Update(ctx, catalogScore.ID, score); err != nil {
		return nil, err
	}

	return &data_catalog_score.IDResp{ID: strconv.FormatUint(catalogScore.ID, 10)}, nil
}

func (d *DataCatalogScoreDomain) GetCatalogScoreList(ctx *gin.Context, req *data_catalog_score.PageInfo) (resp *data_catalog_score.ScoreListResp, err error) {

	totalCount, catalogScoreList, err := d.catalogScoreRepo.GetCatalogScoreList(ctx, req)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, 0)
	for _, score := range catalogScoreList {
		departIds = append(departIds, score.DepartmentId)
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	res := make([]*data_catalog_score.DataCatalogScoreInfo, len(catalogScoreList))
	for i, scoreInfo := range catalogScoreList {
		res[i] = &data_catalog_score.DataCatalogScoreInfo{
			ID:             strconv.FormatUint(scoreInfo.ID, 10),
			CatalogID:      strconv.FormatUint(scoreInfo.CatalogID, 10),
			Name:           scoreInfo.Title,
			Code:           scoreInfo.Code,
			Department:     departmentNameMap[scoreInfo.DepartmentId],
			DepartmentPath: departmentPathMap[scoreInfo.DepartmentId],
			Score:          fmt.Sprintf("%.1f", float32(scoreInfo.Score)),
			ScoredAt:       scoreInfo.ScoredAt.UnixMilli(),
		}
	}
	return &data_catalog_score.ScoreListResp{
		Entries:    res,
		TotalCount: totalCount,
	}, nil
}

func (d *DataCatalogScoreDomain) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		return nameMap, pathMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		pathMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	return nameMap, pathMap, nil
}

func (d *DataCatalogScoreDomain) GetDataCatalogScoreDetail(ctx *gin.Context, catalogId uint64, req *data_catalog_score.ScoreDetailReq) (resp *data_catalog_score.ScoreDetailResp, err error) {

	//判断是否存在数据目录记录
	_, err = d.catalogRepo.Get(ctx, catalogId)
	if err != nil {
		return nil, err
	}

	//获取目录平均评分(四舍五入取整)
	avgScore, err := d.catalogScoreRepo.GetAverageScoreByCatalogId(ctx, catalogId)
	if err != nil {
		return nil, err
	}

	//获取目录各评分的数量
	scoreStat, err := d.catalogScoreRepo.GetScoreStatByCatalogId(ctx, catalogId)
	if err != nil {
		return nil, err
	}

	//获取目录评分列表
	totalCount, userScoreList, err := d.catalogScoreRepo.GetDataCatalogScoreDetail(ctx, catalogId, req)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, 0)
	userIds := make([]string, 0)
	for _, score := range userScoreList {
		departIds = append(departIds, score.DepartmentId)
		userIds = append(userIds, score.ScoredUid)
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}
	//获取用户信息map
	userNameMap, err := d.GetUserNameMap(ctx, util.DuplicateStringRemoval(userIds))
	if err != nil {
		return nil, err
	}

	entries := make([]*data_catalog_score.UserScoreInfo, len(userScoreList))
	for i, scoreInfo := range userScoreList {
		entries[i] = &data_catalog_score.UserScoreInfo{
			CatalogID:      strconv.FormatUint(scoreInfo.CatalogID, 10),
			Department:     departmentNameMap[scoreInfo.DepartmentId],
			DepartmentPath: departmentPathMap[scoreInfo.DepartmentId],
			Score:          fmt.Sprintf("%.1f", float32(scoreInfo.Score)),
			UserName:       userNameMap[scoreInfo.ScoredUid],
			ScoredAt:       scoreInfo.ScoredAt.UnixMilli(),
		}
	}
	return &data_catalog_score.ScoreDetailResp{
		AverageScore: fmt.Sprintf("%.1f", avgScore),
		ScoreStat:    scoreStat,
		ScoreDetail: &data_catalog_score.ScoreDetail{
			Entries:    entries,
			TotalCount: totalCount,
		},
	}, nil
}

func (d *DataCatalogScoreDomain) GetUserNameMap(ctx context.Context, userIds []string) (nameMap map[string]string, err error) {
	nameMap = make(map[string]string)
	if len(userIds) == 0 {
		return nameMap, nil
	}
	userInfos, err := d.configurationCenterDriven.GetUsers(ctx, userIds)
	if err != nil {
		return nameMap, err
	}

	for _, userInfo := range userInfos {
		nameMap[userInfo.ID] = userInfo.Name
	}
	return nameMap, nil
}

func (d *DataCatalogScoreDomain) GetDataCatalogScoreSummary(ctx *gin.Context, catalogIds []models.ModelID) (resp []*data_catalog_score.ScoreSummaryInfo, err error) {

	scoreSummary, err := d.catalogScoreRepo.GetScoreSummaryByCatalogIds(ctx, catalogIds)
	if err != nil {
		return nil, err
	}
	resp = make([]*data_catalog_score.ScoreSummaryInfo, len(scoreSummary))
	for i, summary := range scoreSummary {
		resp[i] = &data_catalog_score.ScoreSummaryInfo{
			CatalogID:    strconv.FormatUint(summary.CatalogID, 10),
			AverageScore: fmt.Sprintf("%.1f", summary.AverageScore),
			Count:        summary.Count,
			HasScored:    summary.HasScored,
		}
	}

	return resp, nil
}
