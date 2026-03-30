package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role_group"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	RoleGroup role_group.Domain
	clock     clock.Clock
}

func NewService(r role_group.Domain) *Service {
	return &Service{
		RoleGroup: r,
		clock:     clock.RealClock{},
	}
}

// 创建角色组
func (s *Service) Create(c *gin.Context) {
	g := &configuration_center_v1.RoleGroup{}
	if err := c.ShouldBindJSON(g); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion

	// TODO: Validation
	if g.ID == "" {
		id, err := uuid.NewV7()
		if err != nil {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
			return
		}
		g.ID = id.String()
	}
	got, err := s.RoleGroup.Create(c, g)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 删除指定角色组
func (s *Service) Delete(c *gin.Context) {
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation

	got, err := s.RoleGroup.Delete(c, id)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)

}

// 更新指定角色组
func (s *Service) Update(c *gin.Context) {
	g := &configuration_center_v1.RoleGroup{}
	if err := c.ShouldBindJSON(g); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion
	g.ID = c.Param("id")

	// TODO: Validation
	g.UpdatedAt = meta_v1.NewTime(s.clock.Now())
	got, err := s.RoleGroup.Update(c, g)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 获取指定角色组
func (s *Service) Get(c *gin.Context) {
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation
	got, err := s.RoleGroup.Get(c, id)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 获取角色组列表
func (s *Service) List(c *gin.Context) {
	opts := &configuration_center_v1.RoleGroupListOptions{}
	if err := c.ShouldBindQuery(opts); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion

	// TODO: Validation

	got, err := s.RoleGroup.List(c, opts)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 更新角色组、角色绑定，批处理
func (s *Service) RoleGroupRoleBindingBatchProcessing(c *gin.Context) {
	p := &configuration_center_v1.RoleGroupRoleBindingBatchProcessing{}
	if err := c.ShouldBindJSON(p); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion
	completeRoleGroupRoleBindingBatchProcessing(p)
	// TODO: Validation

	if err := s.RoleGroup.RoleGroupRoleBindingBatchProcessing(c, p); err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// 获取指定角色组，及其关联的数据，例如：角色、更新人、所属部门
func (s *Service) FrontGet(c *gin.Context) {
	id := c.Param("id")

	// TODO: Completion

	// TODO: Validation

	got, err := s.RoleGroup.FrontGet(c, id)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 获取角色组列表，及其关联的数据，例如：角色、更新人、所属部门
func (s *Service) FrontList(c *gin.Context) {
	opts := &configuration_center_v1.RoleGroupListOptions{}
	if err := c.ShouldBindQuery(opts); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion
	if opts.Sort == "" {
		opts.Sort = "updated_at"
	}
	if opts.Direction == "" {
		opts.Direction = meta_v1.Descending
	}

	// TODO: Validation

	got, err := s.RoleGroup.FrontList(c, opts)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}

// 检查角色组名称是否可以使用
func (s *Service) FrontNameCheck(c *gin.Context) {
	opts := &configuration_center_v1.RoleGroupNameCheck{}
	if err := c.ShouldBindQuery(opts); err != nil {
		// TODO: 返回结构化错误
		return
	}

	// TODO: Completion

	// TODO: Validation

	repeat, err := s.RoleGroup.FrontNameCheck(c, opts)
	if err != nil {
		// TODO: 返回结构化错误
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, repeat)
}
