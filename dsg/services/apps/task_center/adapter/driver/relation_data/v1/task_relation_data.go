package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type RelationDataService struct {
	uc domain.UserCase
}

func NewRelationDataService(uc domain.UserCase) *RelationDataService {
	return &RelationDataService{
		uc: uc,
	}
}

// UpdateRelation  godoc
//
//	@Summary		更新任务相关的数据
//	@Description	更新任务相关的数据， 不存在便是新增
//	@Accept			application/json
//	@Produce		application/json
//	@param			reqRelationData	body	domain.RelationDataIncrementalModel	true	"项目任务关联数据对象"
//	@Tags			RelationData
//	@Success		200	{object}	domain.IDResp
//	@Failure		400	{object}	rest.HttpError
//	@Router			/internal/relation/data [PUT]
func (s *RelationDataService) UpdateRelation(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqRelationData := new(domain.RelationDataIncrementalModel)
	valid, errs := form_validator.BindJsonAndValid(c, reqRelationData)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.RelationDataInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.RelationDataInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	reqRelationData.Updater = info.ID
	if err := s.uc.Upsert(ctx, reqRelationData); err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, domain.IDResp{ID: reqRelationData.TaskID})
	return
}

// QueryRelation  godoc
//
//	@Summary		查询任务相关的数据
//	@Description	查询任务相关的数据
//	@Accept			application/json
//	@Produce		application/json
//	@param			reqRelationData	query	domain.RelationDataQueryModel	true	"查询参数"
//	@Tags			RelationData
//	@Success		200	{array}		domain.RelationDataItem
//	@Failure		400	{object}	rest.HttpError
//	@Router			/internal/relation/data [GET]
func (s *RelationDataService) QueryRelation(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	queryArgs := new(domain.RelationDataQueryModel)
	valid, errs := form_validator.BindQueryAndValid(c, queryArgs)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.RelationDataInvalidParameter, errs))
		return
	}
	list, err := s.uc.QueryRelations(ctx, queryArgs)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, list)
	return
}
