package v1

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_aggregation_inventory/v1/validation"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_inventory"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	domain data_aggregation_inventory.Domain
}

func New(domain data_aggregation_inventory.Domain) *Service { return &Service{domain: domain} }

// 创建
func (s *Service) Create(c *gin.Context) {
	var inventory task_center_v1.DataAggregationInventory
	if err := c.BindJSON(&inventory); err != nil {
		return
	}

	// TODO: Completion
	if inventory.CreationMethod == "" {
		inventory.CreationMethod = task_center_v1.DataAggregationInventoryCreationRaw
	}
	if inventory.Status == "" {
		inventory.Status = task_center_v1.DataAggregationInventoryDraft
	}
	u, err := user_util.ObtainUserInfo(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	inventory.CreatorID = u.ID
	if inventory.Status == task_center_v1.DataAggregationInventoryAuditing {
		if inventory.ApplyID == "" {
			inventory.ApplyID = uuid.Must(uuid.NewV7()).String()
		}
		inventory.RequesterID = u.ID
	}

	// TODO: Validation
	if allErrs := validation.ValidateDataAggregationResources(inventory.Resources, field.NewPath("resources")); allErrs != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, form_validator.NewValidErrorsForFieldErrorList(allErrs)))
		return
	}

	got, err := s.domain.Create(c, &inventory)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// 删除
func (s *Service) Delete(c *gin.Context) {
	id := c.Param("id")

	// TODO: Validation

	if err := s.domain.Delete(c, id); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
}

// 更新，全量
func (s *Service) Update(c *gin.Context) {
	var inventory task_center_v1.DataAggregationInventory
	if err := c.BindJSON(&inventory); err != nil {
		return
	}
	inventory.ID = c.Param("id")

	// TODO: Completion
	u, err := user_util.ObtainUserInfo(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	if inventory.Status == task_center_v1.DataAggregationInventoryAuditing {
		if inventory.ApplyID == "" {
			inventory.ApplyID = uuid.Must(uuid.NewV7()).String()
		}
		inventory.RequesterID = u.ID
	}

	// TODO: Validation
	if allErrs := validation.ValidateDataAggregationResources(inventory.Resources, field.NewPath("resources")); allErrs != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, form_validator.NewValidErrorsForFieldErrorList(allErrs)))
		return
	}

	got, err := s.domain.Update(c, &inventory)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// 获取
func (s *Service) Get(c *gin.Context) {
	id := c.Param("id")

	got, err := s.domain.Get(c, id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// 获取列表
func (s *Service) List(c *gin.Context) {
	var opts task_center_v1.DataAggregationInventoryListOptions
	if err := opts.UnmarshalQuery(c.Request.URL.Query()); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// TODO: Completion
	if len(opts.Fields) == 0 {
		opts.Fields = []task_center_v1.DataAggregationInventoryListKeywordField{
			task_center_v1.DataAggregationInventoryListKeywordFieldCode,
			task_center_v1.DataAggregationInventoryListKeywordFieldName,
		}
	}
	log.Printf("DEBUG.driver, opts: %#v", opts)

	// TODO: Validation

	got, err := s.domain.List(c, &opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// BatchGetDataTable 通过业务表查询ID批量查询物化的表信息
// 参数是业务标准表的ID数组
func (s *Service) BatchGetDataTable(c *gin.Context) {
	ids, ok := c.GetQueryArray("id")
	if !ok {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameter))
		return
	}
	got, err := s.domain.BatchGetDataTable(c, ids)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// 检查归集清单名称是否存在
func (s *Service) CheckName(c *gin.Context) {
	name := c.Query("name")
	id := c.Query("id")
	ok, err := s.domain.CheckName(c, name, id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"exists": ok})
}
