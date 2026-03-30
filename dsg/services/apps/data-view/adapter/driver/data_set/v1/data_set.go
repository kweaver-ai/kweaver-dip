package v1

import (
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	domainDataSet "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_set"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/gin-gonic/gin"
	"strconv"
	"time"
)

type DataSetService struct {
	uc domainDataSet.DataSetUseCase
}

func NewDataSetService(uc domainDataSet.DataSetUseCase) *DataSetService {
	return &DataSetService{uc: uc}
}

// Create 创建数据集
//
// @Description 创建数据集
// @Tags        数据集
// @Summary     创建数据集
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       body          body   domainDataSet.CreateDataSetReq true "请求参数"
// @Success     200           {object} domainDataSet.CreateDataSetResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set [post]
func (s *DataSetService) Create(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.CreateDataSetReq](c)
	if req == nil {
		return
	}

	res, err := s.uc.Create(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// Update 更新数据集
//
// @Description 更新数据集
// @Tags        数据集
// @Summary     更新数据集
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       id             path   string true "数据集ID"
// @Param       body          body   domainDataSet.UpdateDataSetReq true "请求参数"
// @Success     200           {object} domainDataSet.UpdateDataSetResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set/{id} [put]
func (s *DataSetService) Update(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.UpdateDataSetReq](c)
	if req == nil {
		return
	}

	res, err := s.uc.Update(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// Delete 删除数据集
//
// @Description 删除数据集
// @Tags        数据集
// @Summary     删除数据集
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       id             path   string true "数据集ID"
// @Success     200           {object} domainDataSet.DeleteDataSetResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set/{id} [delete]
func (s *DataSetService) Delete(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.DeleteDataSetReq](c)
	if req == nil {
		return
	}

	res, err := s.uc.Delete(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// PageList 获取数据集列表
//
// @Description 获取数据集列表
// @Tags        数据集
// @Summary     获取数据集列表
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       query         query   domainDataSet.PageListDataSetParam true "请求参数"
// @Success     200           {object} domainDataSet.PageListDataSetResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set [get]
func (s *DataSetService) PageList(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.PageListDataSetParam](c)
	if req == nil {
		return
	}

	res, err := s.uc.PageList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetFormViewByIdByDataSetId 获取数据集中所有逻辑视图信息
//
// @Description 获取数据集逻辑视图信息
// @Tags        数据集
// @Summary     获取数据集逻辑视图信息
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       id             path   string true "数据集ID" Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
// @Param       query           query domainDataSet.ViewPageListDataSetReq false "查询参数"
// @Success     200           {object} domainDataSet.ViewPageListDataSetParam "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set/{id} [get]
func (s *DataSetService) GetFormViewByIdByDataSetId(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.ViewPageListDataSetParam](c)
	if req == nil {
		return
	}

	res, err := s.uc.GetFormViewByIdByDataSetId(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// AddDataSet 批量添加视图到数据集中
//
// @Description 批量添加视图到数据集中
// @Tags        数据集
// @Summary     批量添加视图到数据集中
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       body          body   domainDataSet.AddDataSetReq true "请求参数"
// @Success     200           {object} domainDataSet.UpdateDataSetWithFormViewResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set/add-data-set [post]
func (s *DataSetService) AddDataSet(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.AddDataSetReq](c)
	if req == nil {
		return
	}
	//获取当前登录用户
	userInfo, _ := util.GetUserInfo(c)

	res, err := s.uc.CreateDataSetViewRelation(c, req, userInfo.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// RemoveFormViewsFromDataSet 批量删除视图从数据集中
//
// @Description 批量删除视图从数据集中
// @Tags        数据集
// @Summary     批量删除视图从数据集中
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       body          body   domainDataSet.RemoveFormViewsFromDataSetReq true "请求参数"
// @Success     200           {object} domainDataSet.RemoveFormViewsFromDataSetResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "
// @Router      /data-set/remove-data-set [post]
func (s *DataSetService) RemoveFormViewsFromDataSet(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.RemoveDataSetViewRelationReq](c)
	if req == nil {
		return
	}

	res, err := s.uc.DeleteDataSetViewRelation(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CheckDataSetByName 根据名称检查数据集是否存在
//
// @Description 根据名称检查数据集是否存在
// @Tags        数据集
// @Summary     根据名称检查数据集是否存在
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Param       name          query  string true "数据集名称"
// @Success     200           {object} domainDataSet.CreateDataSetByNameResp "成功响应参数"
// @Failure     400           {object} rest.HttpError "失败响应参数"
// @Router      /data-set/check-by-name [get]
func (s *DataSetService) CheckDataSetByName(c *gin.Context) {
	req := form_validator.Valid[domainDataSet.DataSetExistsNameReq](c)
	if req == nil {
		return
	}
	if req.Name != "" && req.Id == "" {
		dataset, err := s.uc.GetByName(c, req.Name)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
		if dataset != nil {
			ginx.ResOKJson(c, domainDataSet.CreateDataSetByNameResp{Exists: true})
			return
		}
	} else {
		entity, err := s.uc.GetById(c, req.Id)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
		if entity == nil {
			ginx.ResOKJson(c, domainDataSet.CreateDataSetByNameResp{Exists: false})
			return
		}
		count, err := s.uc.GetByNameCount(c, req.Name, req.Id)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
		//判断dataset的数据条数，大于1条，返回ture
		countStr := strconv.FormatInt(*count, 10)
		countInt64, _ := strconv.ParseInt(countStr, 10, 64)
		if countInt64 >= 1 {
			ginx.ResOKJson(c, domainDataSet.CreateDataSetByNameResp{Exists: true})
			return
		}

	}

	res := domainDataSet.CreateDataSetByNameResp{Exists: false}
	ginx.ResOKJson(c, res)
}

type DataSetViewTreeResponse struct {
	Data  []DataSetViewTree `json:"data"`
	Total int64             `json:"total"`
}

type DataSetViewTree struct {
	ID          string       `json:"id"`
	DataSetName string       `json:"name"`
	Children    []ViewDetail `json:"children"`
	Expand      bool         `json:"expand"` // 新增字段
}

type ViewDetail struct {
	BusinessName       string    `json:"name"`
	TechnicalName      string    `json:"technical_name"`
	ID                 string    `json:"id"`
	UpdatedAt          time.Time `json:"updated_at"`
	UniformCatalogCode string    `json:"uniform_catalog_code"`
}

// GetDataSetViewTree 获取数据集及其视图信息树形列表
//
// @Description 获取数据集及其视图信息
// @Tags        数据集
// @Summary     获取数据集及其视图信息
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header string true "token"
// @Success     200 {array} DataSetViewTree "成功响应参数"
// @Failure     400 {object} rest.HttpError "失败响应参数"
// @Router      /data-set/view-tree [get]
func (s *DataSetService) GetDataSetViewTree(c *gin.Context) {
	// 获取所有数据集
	req := form_validator.Valid[domainDataSet.PageListDataSetParam](c)
	if req == nil {
		return
	}

	// 手动应用默认值
	if req.PageListDataSetReq.Sort == "" {
		req.PageListDataSetReq.Sort = "updated_at"
	}
	if req.PageListDataSetReq.Direction == "" {
		req.PageListDataSetReq.Direction = "desc"
	}

	var result []DataSetViewTree

	// 获取数据集列表
	resp, err := s.uc.PageList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 从响应中提取数据集切片
	dataSets := resp.Entries

	// 确保 dataSets 是一个切片
	for _, dataSet := range dataSets {
		views, err := s.uc.GetDataSetViewRelation(c, dataSet.ID)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}

		// 确保 views 是一个切片
		var viewDetails []ViewDetail
		for _, view := range views.Views {
			viewDetails = append(viewDetails, ViewDetail{
				BusinessName:       view.BusinessName,
				TechnicalName:      view.TechnicalName,
				ID:                 view.ID,
				UpdatedAt:          view.UpdatedAt,
				UniformCatalogCode: view.UniformCatalogCode,
			})
		}

		result = append(result, DataSetViewTree{
			ID:          dataSet.ID,
			DataSetName: dataSet.DataSetName,
			Children:    viewDetails,
			Expand:      true,
		})
	}

	ginx.ResOKJson(c, result)
}
