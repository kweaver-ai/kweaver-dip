package info_system

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/domain/info_system"
	basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service interface {
	// 搜索信息系统
	Search(c *gin.Context)
}

type service struct {
	Domain info_system.Interface
}

func New(domain info_system.Interface) Service { return &service{Domain: domain} }

// Search 搜索信息系统
func (s *service) Search(c *gin.Context) {
	// Body 参数
	search := &basic_search_v1.InfoSystemSearch{}
	if err := c.BindJSON(search); err != nil {
		// TODO: 返回结构化错误
		ginx.ResBadRequestJson(c, err)
		return
	}
	// Query 参数
	opts := &basic_search_v1.InfoSystemSearchOptions{}
	if err := opts.UnmarshalQuery(c.Request.URL.Query()); err != nil {
		// TODO: 返回结构化错误
		ginx.ResBadRequestJson(c, err)
		return
	}

	// TODO: Completion
	if opts.Limit == 0 {
		opts.Limit = 10
	}

	// TODO: Validation

	got, err := s.Domain.Search(c, search.Query, opts)
	if err != nil {
		// TODO: 返回结构化错误
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, got)
}

var _ Service = &service{}
