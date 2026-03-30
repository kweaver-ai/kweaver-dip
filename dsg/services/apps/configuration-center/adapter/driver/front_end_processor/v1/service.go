package front_end_processor

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/middleware"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/front_end_processor"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ apps.AppsIDS

type Service struct {
	UseCase front_end_processor.UseCase
}

func New(uc front_end_processor.UseCase) *Service { return &Service{UseCase: uc} }

// 创建前置机
func (s *Service) Create(c *gin.Context) {
	p := &configuration_center_v1.FrontEndProcessor{}
	if err := c.ShouldBind(p); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}

	// TODO: Use clock instead of time.Now()
	now := time.Now()

	// 参数补全
	p.ID = uuid.Must(uuid.NewV7()).String()
	p.OrderID = "qzjsq" + now.Format("20060102150405")
	p.CreatorID = middleware.UserFromContextOrEmpty(c).ID
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.CreationTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	p.RequestTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	p.Status.Phase = configuration_center_v1.FrontEndProcessorPending
	// TODO: 参数验证
	if err := s.UseCase.Create(c, p); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusOK)
}

// 删除前置机
func (s *Service) Delete(c *gin.Context) {
	id := c.Param("id")

	// TODO: 参数验证

	if err := s.UseCase.Delete(c, id); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

// 更新前置机请求
func (s *Service) UpdateRequest(c *gin.Context) {
	id := c.Param("id")
	// TODO: 参数验证
	r := &configuration_center_v1.FrontEndProcessor{}
	if err := c.ShouldBind(r); err != nil {
		return
	}
	if err := s.UseCase.UpdateRequest(c, id, r); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

// 分配前置机节点
func (s *Service) AllocateNode(c *gin.Context) {
	id := c.Param("id")

	// TODO: 参数验证

	n := &configuration_center_v1.FrontEndProcessorNode{}
	if err := c.ShouldBind(n); err != nil {
		return
	}

	if err := s.UseCase.AllocateNode(c, id, n); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

func (s *Service) AllocateNodeNew(c *gin.Context) {
	id := c.Param("id")
	// TODO: 参数验证

	n := &configuration_center_v1.FrontEndProcessorAllocationRequest{}
	if err := c.ShouldBind(n); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}

	if err := s.UseCase.AllocateNodeNew(c, id, n); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

// 签收前置机
func (s *Service) Receipt(c *gin.Context) {
	id := c.Param("id")

	// TODO: 参数验证

	if err := s.UseCase.Receipt(c, id); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

func (s *Service) Reject(c *gin.Context) {
	id := c.Param("id")
	p := &configuration_center_v1.FrontEndProcessorReject{}
	if err := c.ShouldBind(p); err != nil {
		return
	}
	if p.Comment == "" {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Custom(errorcode.ConfigurationDataBaseError, "comment can not be empty"))
		return
	}
	// TODO: 参数验证

	if err := s.UseCase.Reject(c, id, p.Comment); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

// 回收前置机
func (s *Service) Reclaim(c *gin.Context) {
	id := c.Param("id")

	// TODO: 参数验证

	if err := s.UseCase.Reclaim(c, id); err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusOK)
}

// 获取前置机列表
func (s *Service) List(c *gin.Context) {
	opts := &configuration_center_v1.FrontEndProcessorListOptions{}
	for k, values := range c.Request.URL.Query() {
		for _, v := range values {
			log.Infof("Query phases: %v", opts.Phases)
			if v == "" {
				continue
			}
			switch k {
			case "order_id":
			case "keyword":
				opts.OrderID = v
			case "node_ip":
				opts.NodeIP = v
			case "phases":
				for _, p := range strings.Split(v, ",") {
					opts.Phases = append(opts.Phases, configuration_center_v1.FrontEndProcessorPhase(p))

				}
			case "department_ids":
				opts.DepartmentIDs = append(opts.DepartmentIDs, strings.Split(v, ",")...)
			case "request_timestamp_start":
				msec, err := strconv.ParseInt(v, 10, 64)
				if err != nil {
					c.AbortWithError(http.StatusBadRequest, err)
					return
				}
				opts.RequestTimestampStart = meta_v1.NewTime(time.UnixMilli(msec))
			case "request_timestamp_end":
				msec, err := strconv.ParseInt(v, 10, 64)
				if err != nil {
					c.AbortWithError(http.StatusBadRequest, err)
					return
				}
				opts.RequestTimestampEnd = meta_v1.NewTime(time.UnixMilli(msec))
			case "sort":
				opts.Sort = v
			case "direction":
				opts.Direction = meta_v1.Direction(v)
			case "apply_type":
				opts.ApplyType = v
			default:
				continue
			}
		}
	}

	// TODO: 参数验证

	l, err := s.UseCase.List(c, opts)
	if err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, l)
}

// 查看前置机详情
func (s *Service) GetDetails(c *gin.Context) {
	id := c.Param("id")

	// TODO: 参数验证

	p, err := s.UseCase.GetApplyDetails(c, id)
	if err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, p)
}

// 获取前置机
func (s *Service) Get(c *gin.Context) {
	id := c.Param("id")

	// TODO: 参数验证

	p, err := s.UseCase.Get(c, id)
	if err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, p)
}

// 获取申请前置机列表
func (s *Service) GetApplyList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	opts := &configuration_center_v1.FrontEndProcessorItemListOptions{}
	if _, err = form_validator.BindQueryAndValid(c, opts); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query GetApplyList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	l, err := s.UseCase.GetApplyList(c, opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
	}
	c.JSON(http.StatusOK, l)
}

// 获取前置机概览
func (s *Service) GetOverView(c *gin.Context) {
	opts := &configuration_center_v1.FrontEndProcessorsOverviewGetOptions{}
	for k, values := range c.Request.URL.Query() {
		for _, v := range values {
			switch k {
			case "start":
				msec, err := strconv.ParseInt(v, 10, 64)
				if err != nil {
					continue
				}
				opts.Start = meta_v1.NewTime(time.UnixMilli(msec))
			case "end":
				msec, err := strconv.ParseInt(v, 10, 64)
				if err != nil {
					continue
				}
				opts.End = meta_v1.NewTime(time.UnixMilli(msec))
			default:
				continue
			}
		}
	}

	// TODO: 参数补全
	if opts.Start.IsZero() && opts.End.IsZero() {
		opts.End = meta_v1.NewTime(meta_v1.Now().Time.Add(8 * time.Hour))
		opts.Start = meta_v1.NewTime(opts.End.Time.AddDate(-1, 0, 0))
	}

	// TODO: 参数验证

	v, err := s.UseCase.GetOverView(c, opts)
	if err != nil {
		// TODO: 不同错误返回不同的 HTTP Status Code
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	// 前端会因为 array 字段的值为 null 显示白屏，所以初始化一个空列表
	if v.DepartmentsTOP15 == nil {
		v.DepartmentsTOP15 = make([]configuration_center_v1.DepartmentNameFrontEndProcessorCount, 0)
	}

	c.JSON(http.StatusOK, v)
}

// GetApplyAuditList  godoc
// @Summary     查询审核列表接口
// @Description AppCancel Description
// @Accept      application/json
// @Produce     application/json
// @Tags        审核列表授权
// @Param       _     query    apps.AuditListGetReq true "请求参数"
// @Success     200   {object} apps.AuditListResp    "成功响应参数"
// @Failure     400  {object} rest.HttpError
// @Router    /apps/apply-audit [get]
func (s *Service) GetApplyAuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &configuration_center_v1.AuditListGetReq{}
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query AppsList api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	datas, err := s.UseCase.GetAuditList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// Cancel  godoc
// @Summary     撤回创建或者更新前置机审核
// @Description Cancel Description
// @Accept      application/json
// @Produce     application/json
// @Tags        前置机审核
// @Param       id path string true "应用授权ID，uuid"
// @Success     200
// @Failure     400  {object} rest.HttpError
// @Router    /province-apps/{id}/report-audit/cancel [put]
func (s *Service) Cancel(c *gin.Context) {
	var err error
	id := c.Param("id")
	err = s.UseCase.CancelAudit(c, id)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)

}

// FrontEndProcessorAllocation 前置机分配信息
type FrontEndProcessorAllocation struct {
	// 分配者 ID
	ID string `json:"id,omitempty"`
	//关联前置机表front_end_id
	FrontEndID string `json:"front_end_id,omitempty"`
	// 更新时间
	UpdatedAt string `json:"updated_at,omitempty"`
	// node信息
	//Node *FrontEndProcessorNode `json:"node,omitempty"`
	IP string `json:"ip,omitempty"`
	// 端口
	Port string `json:"port,omitempty"` // 修改为字符串类型，与请求数据匹配
	// 节点名称
	Name string `json:"name,omitempty"`
	//技术负责人
	AdministratorName string `json:"administrator_name,omitempty"`
	//技术负责人手机
	AdministratorPhone string `json:"administrator_phone,omitempty"`
	//前置库列表
	LibraryList []FrontEndAllocationLibrary `json:"library_list,omitempty"`
}

// FrontEndAllocationLibrary 前置库信息
type FrontEndAllocationLibrary struct {
	// 主键 ID
	ID string `json:"id,omitempty"`
	// 前置机 ID
	FrontEndID string `json:"front_end_id,omitempty"`
	// 库名
	BusinessName string `json:"business_name,omitempty"`
	// 数据库类型
	LibraryType string `json:"library_type,omitempty"`
	// 数据库版本
	LibraryVersion string `json:"library_version,omitempty"`
	// 用户名
	Username string `json:"username,omitempty"`
	// 密码
	Password string `json:"password,omitempty"`
	// 更新时间
	UpdateTime string `json:"update_time,omitempty"`
	// 前置机项 ID
	FrontEndItemID string `json:"front_end_item_id,omitempty"`
}
