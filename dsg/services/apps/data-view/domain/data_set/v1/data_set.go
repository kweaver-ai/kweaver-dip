package v1

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	gormDataSet "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_set"
	formView "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domainDataSet "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_set"
	domainFormView "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"gorm.io/gorm"
	"time"
)

type dataSetUseCase struct {
	repo                      gormDataSet.DataSetRepo
	form                      domainFormView.FormViewUseCase
	fv                        formView.FormViewRepo
	db                        *gorm.DB
	DrivenDataSubjectNG       data_subject_local.DrivenDataSubject
	configurationCenterDriven configuration_center.Driven
}

type GetByNameResp struct {
	ID                 string    `json:"id"`
	DataSetName        string    `json:"dataSetName"`
	DataSetDescription string    `json:"dataSetDescription"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
	CreatedByUID       string    `json:"createdByUID"`
	UpdatedByUID       string    `json:"updatedByUID"`
}

func NewDataSetUseCase(
	repo gormDataSet.DataSetRepo,
	form domainFormView.FormViewUseCase,
	fv formView.FormViewRepo,
	db *gorm.DB,
	DrivenDataSubjectNG data_subject_local.DrivenDataSubject,
	configurationCenterDriven configuration_center.Driven,
) domainDataSet.DataSetUseCase {
	// 启用GORM的日志模式
	db = db.Debug()

	return &dataSetUseCase{
		repo:                      repo,
		form:                      form,
		fv:                        fv,
		db:                        db,
		DrivenDataSubjectNG:       DrivenDataSubjectNG,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (uc *dataSetUseCase) Create(ctx context.Context, req *domainDataSet.CreateDataSetReq) (*domainDataSet.CreateDataSetResp, error) {
	// **新增：检查数据集名称是否已存在**
	existingDataSet, err := uc.GetByName(ctx, req.DataSetName)
	if err == nil && existingDataSet != nil {
		return nil, fmt.Errorf("data set name already exists")
	}

	dataSet := &model.DataSet{
		ID:                 uuid.New().String(),
		DataSetName:        req.DataSetName,
		DataSetDescription: req.Description,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	userInfo, _ := util.GetUserInfo(ctx)
	dataSet.CreatedByUID = userInfo.ID
	dataSet.UpdatedByUID = userInfo.ID

	// 创建数据集
	id, err := uc.repo.Create(ctx, dataSet)
	if err != nil {
		return nil, err
	}
	return &domainDataSet.CreateDataSetResp{ID: id}, nil
}

func (uc *dataSetUseCase) Update(ctx context.Context, req *domainDataSet.UpdateDataSetReq) (*domainDataSet.UpdateDataSetResp, error) {
	dataSet, err := uc.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	dataSet.DataSetName = req.UpdateDataSetParameter.DataSetName
	dataSet.DataSetDescription = req.UpdateDataSetParameter.DataSetDescription
	dataSet.UpdatedAt = time.Now()
	userInfo, _ := util.GetUserInfo(ctx)
	dataSet.UpdatedByUID = userInfo.ID
	err = uc.repo.Update(ctx, dataSet)
	if err != nil {
		return nil, err
	}
	return &domainDataSet.UpdateDataSetResp{ID: req.ID}, nil
}

func (uc *dataSetUseCase) Delete(ctx context.Context, req *domainDataSet.DeleteDataSetReq) (*domainDataSet.DeleteDataSetResp, error) {
	err := uc.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &domainDataSet.DeleteDataSetResp{ID: req.ID}, nil
}

func (uc *dataSetUseCase) PageList(ctx context.Context, req *domainDataSet.PageListDataSetParam) (*domainDataSet.PageListDataSetResp, error) {
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	total, dataSets, err := uc.repo.PageList(ctx, req.PageListDataSetReq.Sort, req.Direction, req.Keyword, req.PageListDataSetReq.Limit, req.PageListDataSetReq.Offset, userInfo.ID)
	if err != nil {
		return nil, err
	}
	return &domainDataSet.PageListDataSetResp{
		TotalCount: total,
		Entries:    dataSets,
	}, nil
}

// 新增函数：根据名称查询数据集
func (uc *dataSetUseCase) GetByName(ctx context.Context, name string) (*domainDataSet.GetByNameResp, error) {
	dataSet, err := uc.repo.GetByName(ctx, name)
	if err != nil {
		return nil, err
	}
	if dataSet == nil {
		return nil, nil
	}
	return &domainDataSet.GetByNameResp{
		ID:                 dataSet.ID,
		DataSetName:        dataSet.DataSetName,
		DataSetDescription: dataSet.DataSetDescription,
		CreatedAt:          dataSet.CreatedAt,
		UpdatedAt:          dataSet.UpdatedAt,
		CreatedByUID:       dataSet.CreatedByUID,
		UpdatedByUID:       dataSet.UpdatedByUID,
	}, nil
}

func (uc *dataSetUseCase) GetByNameCount(ctx context.Context, name string, id string) (*int64, error) {
	count, err := uc.repo.GetByNameCount(ctx, name, id)
	if err != nil {
		return nil, err
	}
	return count, nil
}
func (uc *dataSetUseCase) GetById(ctx context.Context, id string) (*domainDataSet.GetByNameResp, error) {
	dataSet, err := uc.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	if dataSet == nil {
		return nil, nil
	}
	return &domainDataSet.GetByNameResp{
		ID:                 dataSet.ID,
		DataSetName:        dataSet.DataSetName,
		DataSetDescription: dataSet.DataSetDescription,
		CreatedAt:          dataSet.CreatedAt,
		UpdatedAt:          dataSet.UpdatedAt,
		CreatedByUID:       dataSet.CreatedByUID,
		UpdatedByUID:       dataSet.UpdatedByUID,
	}, nil
}

// 修改函数：根据 data_set_id 查询 form_view 中表数据
func (uc *dataSetUseCase) GetFormViewByIdByDataSetId(ctx context.Context, req *domainDataSet.ViewPageListDataSetParam) (*domainDataSet.PageListFormViewDetailResp, error) {
	var formViews []model.FormView
	var totalCount int64

	// 计算 offset
	offset := (req.Offset - 1) * req.Limit

	// 查询条件
	var whereClause = uc.db.WithContext(ctx).
		Unscoped(). // 禁用软删除
		Table("data_set_view_relation a").
		Select("b.business_name, b.technical_name, b.subject_id, b.department_id, a.updated_at, b.id, b.uniform_catalog_code").
		Joins("INNER JOIN form_view b ON a.form_view_id = b.id").
		Where("b.deleted_at=?", 0)

	// 如果 req.ID 不为空，则添加 data_set_id 过滤条件
	if req.ID != "" {
		whereClause = whereClause.Where("a.id = ?", req.ID)
	}
	if req.Department == constant.UnallocatedId {
		whereClause = whereClause.Where("b.department_id is null  or b.department_id =''")
	}
	if req.Subject == constant.UnallocatedId {
		whereClause = whereClause.Where("b.subject_id is null  or b.subject_id =''")
	}
	if req.Department != "" && req.Department != constant.UnallocatedId {
		whereClause = whereClause.Where("b.department_id = ?", req.Department)
	}
	if req.Subject != "" && req.Subject != constant.UnallocatedId {
		whereClause = whereClause.Where("b.subject_id = ?", req.Subject)
	}
	if req.UpdatedAt != "" {
		whereClause = whereClause.Where("a.updated_at between ? and ?", req.UpdatedAt, time.Now().Format("2006-01-02 15:04:05"))
	}
	if req.Keyword != "" {
		whereClause = whereClause.Where("b.business_name like ? or b.uniform_catalog_code like ?", "%"+req.Keyword+"%", "%"+req.Keyword+"%")
	}

	// 计算总数
	err := whereClause.Count(&totalCount).Error
	if err != nil {
		return nil, fmt.Errorf("count form views failed: %w", err)
	}

	// 查询数据
	if req.Sort == "business_name" {
		err = whereClause.Order(fmt.Sprintf("b.%s %s", req.Sort, req.Direction)).Limit(req.Limit).Offset(offset).Find(&formViews).Error
	} else {
		err = whereClause.Order(fmt.Sprintf("a.%s %s", req.Sort, req.Direction)).Limit(req.Limit).Offset(offset).Find(&formViews).Error
	}

	if err != nil {
		return nil, fmt.Errorf("query form views failed: %w", err)
	}

	entries := make([]*domainDataSet.FormViewDetailResp, len(formViews))
	for i, formView := range formViews {
		//获取所属主题
		if formView.SubjectId.String != "" {
			object, err := uc.DrivenDataSubjectNG.GetsObjectById(ctx, formView.SubjectId.String)
			if err != nil {
				return nil, err
			}
			formView.SubjectId.String = object.Name
		}
		//获取部门名称
		if formView.DepartmentId.String != "" {
			departmentInfos, err := uc.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{formView.DepartmentId.String})
			if err != nil {
				return nil, err
			}
			if len(departmentInfos.Departments) > 0 {
				formView.DepartmentId.String = departmentInfos.Departments[0].Name
			}
		}

		entries[i] = &domainDataSet.FormViewDetailResp{
			ID:                 formView.ID,
			UniformCatalogCode: formView.UniformCatalogCode,
			BusinessName:       formView.BusinessName,
			TechnicalName:      formView.TechnicalName,
			SubjectName:        formView.SubjectId.String,
			DepartmentName:     formView.DepartmentId.String,
			UpdatedAt:          formView.UpdatedAt,
		}
	}

	return &domainDataSet.PageListFormViewDetailResp{
		Entries:    entries,
		TotalCount: totalCount,
	}, nil
}

// 新增函数：创建数据集视图关联
func (uc *dataSetUseCase) CreateDataSetViewRelation(ctx context.Context, req *domainDataSet.AddDataSetReq, userID string) (*domainDataSet.CreateDataSetViewRelationResp, error) {
	// 查询该数据集已有的视图数量
	var existingCount int64
	err := uc.db.WithContext(ctx).Model(&model.DataSetViewRelation{}).Where("id = ?", req.Id).Count(&existingCount).Error
	if err != nil {
		return nil, err
	}
	// 检查是否超过最大视图数量限制
	if existingCount+int64(len(req.FormViewIDs)) > 200 {
		return nil, fmt.Errorf("a data set can have at most 200 form views")
	}

	// 查询已存在的 formViewIDs 与当前 dataSet 的关联关系
	var existingFormViewIDs []string
	err = uc.db.WithContext(ctx).Model(&model.DataSetViewRelation{}).Where("id = ?", req.Id).Pluck("form_view_id", &existingFormViewIDs).Error
	if err != nil {
		return nil, err
	}

	// 创建一个 map 用于快速查找已存在的 formViewIDs
	existingFormViewIDMap := make(map[string]struct{})
	for _, id := range existingFormViewIDs {
		existingFormViewIDMap[id] = struct{}{}
	}

	var formViewIDs []string
	for _, formViewID := range req.FormViewIDs {
		// 检查 formViewID 是否已经存在
		if _, exists := existingFormViewIDMap[formViewID]; exists {
			//校验权限，没有权限，不允许添加
			count, _, errs := uc.fv.GetByOwnerID(ctx, userID, formViewID)
			if errs != nil {
				return nil, err
			}
			if count == 0 {
				return nil, errorcode.Detail(errorcode.UserNotHaveThisViewPermissions, "没有权限添加此视图")
			}
			// 如果存在，则更新更新时间
			err := uc.db.WithContext(ctx).Model(&model.DataSetViewRelation{}).
				Where("id = ? AND form_view_id = ?", req.Id, formViewID).
				Update("updated_at", time.Now()).Error
			if err != nil {
				return nil, err
			}
			// 更新数据集的更新时间
			tx := uc.db.WithContext(ctx).Model(&model.DataSet{}).Where("id = ?", req.Id).Update("updated_at", time.Now())
			if tx.Error != nil {
				return nil, tx.Error
			}
		} else {
			// 如果不存在，则创建新的关联
			dataSetViewRelation := &model.DataSetViewRelation{
				ID:         req.Id,
				FormViewID: formViewID,
				UpdatedAt:  time.Now(),
			}

			err := uc.db.WithContext(ctx).Create(dataSetViewRelation).Error
			if err != nil {
				return nil, err
			}
			// 更新数据集的更新时间
			tx := uc.db.WithContext(ctx).Model(&model.DataSet{}).Where("id = ?", req.Id).Update("updated_at", time.Now())
			if tx.Error != nil {
				return nil, tx.Error
			}
			formViewIDs = append(formViewIDs, formViewID)
		}
	}

	return &domainDataSet.CreateDataSetViewRelationResp{
		ID: req.Id,
	}, nil
}

// 新增函数：删除数据集视图关联
func (uc *dataSetUseCase) DeleteDataSetViewRelation(ctx context.Context, req *domainDataSet.RemoveDataSetViewRelationReq) (*domainDataSet.DeleteDataSetViewRelationResp, error) {
	err := uc.db.WithContext(ctx).Where("id = ? AND form_view_id IN (?)", req.Id, req.FormViewIDs).Delete(&model.DataSetViewRelation{}).Error
	if err != nil {
		return nil, err
	}
	// 更新数据集的更新时间
	tx := uc.db.WithContext(ctx).Model(&model.DataSet{}).Where("id = ?", req.Id).Update("updated_at", time.Now())
	if tx.Error != nil {
		return nil, tx.Error
	}
	return &domainDataSet.DeleteDataSetViewRelationResp{
		ID: req.Id,
	}, nil
}

func (uc *dataSetUseCase) GetDataSetViewRelation(ctx context.Context, id string) (*domainDataSet.DataSetViewTree, error) {
	views, err := uc.repo.GetViewsByDataSetId(ctx, id) // 1. 获取实际查询结果
	if err != nil {
		return nil, err
	}

	// 2. 将查询结果转换为ViewDetail结构（假设views是model.DataSetViewRelation切片）
	var viewDetails []domainDataSet.ViewDetail
	for _, view := range views {
		viewDetails = append(viewDetails, domainDataSet.ViewDetail{
			BusinessName:       view.BusinessName, // 根据实际字段映射
			TechnicalName:      view.TechnicalName,
			ID:                 view.ID,
			UniformCatalogCode: view.UniformCatalogCode,
			UpdatedAt:          view.UpdatedAt,
		})
	}

	return &domainDataSet.DataSetViewTree{
		DataSetName: id,
		Views:       viewDetails, // 3. 将转换后的数据填充到返回结构体
	}, nil

}
