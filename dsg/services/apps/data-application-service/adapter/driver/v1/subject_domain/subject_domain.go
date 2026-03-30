package subject_domain

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type SubjectDomainController struct {
	domain *domain.SubjectDomain
}

func NewSubjectDomainController(d *domain.SubjectDomain) *SubjectDomainController {
	return &SubjectDomainController{domain: d}
}

// SubjectDomainList 登录用户有权限的主题域列表
//
//	@Description	登录用户有权限的主题域列表
//	@Tags			主题域
//	@Summary		登录用户有权限的主题域列表
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	dto.SubjectDomainListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/v1/subject-domains [get]
func (s *SubjectDomainController) SubjectDomainList(c *gin.Context) {
	req := &dto.SubjectDomainListReq{}

	_, err := form_validator.BindQueryAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.SubjectDomainList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
