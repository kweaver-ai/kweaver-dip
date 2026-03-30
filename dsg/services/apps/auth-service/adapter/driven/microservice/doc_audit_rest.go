package microservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
)

// DocAuditRESTRepo 定义微服务 doc-audit-rest 接口，再原生接口的基础上提供更多方法
type DocAuditRESTRepo interface {
	RawDocAuditRESTRepo

	// 判断当前用户是否是指定审核流程当前的审核员
	IsAuditor(ctx context.Context, bizID string) (bool, error)
}

type docAuditRESTRepo struct {
	RawDocAuditRESTRepo
}

func NewDocAuditRESTRepo(c *http.Client) (DocAuditRESTRepo, error) {
	r, err := NewRawDocAuditRESTRepo(c)
	if err != nil {
		return nil, err
	}
	return &docAuditRESTRepo{RawDocAuditRESTRepo: r}, nil
}

// IsAuditor implements DocAuditRESTRepo.
func (r *docAuditRESTRepo) IsAuditor(ctx context.Context, bizID string) (ok bool, err error) {
	userInfo := dto.GetUser(ctx)
	if userInfo.Id == "" {
		return
	}

	da, err := r.GetDocAuditByBizID(ctx, bizID)
	if err != nil {
		return
	}

	for _, a := range da.Auditors {
		if a.ID == userInfo.Id {
			return a.Status == dto.AuditorPending, nil
		}
	}
	return
}

var _ DocAuditRESTRepo = &docAuditRESTRepo{}

// RawDocAuditRESTRepo 定义微服务 doc-audit-rest 原生接口
type RawDocAuditRESTRepo interface {
	// 根据 biz id 获取 doc audit
	GetDocAuditByBizID(ctx context.Context, bizID string) (*dto.DocAudit, error)
}

type rawDocAuditRESTRepo struct {
	// API 端点
	base *url.URL
	// HTTP 客户端
	client *http.Client
}

func NewRawDocAuditRESTRepo(c *http.Client) (RawDocAuditRESTRepo, error) {
	base, err := url.Parse(settings.Instance.Services.DocAuditRest)
	if err != nil {
		return nil, err
	}

	base.Path = path.Join(base.Path, "api", "doc-audit-rest", "v1")

	return &rawDocAuditRESTRepo{
		base:   base,
		client: c,
	}, nil
}

// GetDocAuditByBizID implements RawDocAuditRESTRepo.
func (r *rawDocAuditRESTRepo) GetDocAuditByBizID(ctx context.Context, bizID string) (*dto.DocAudit, error) {
	base := *r.base
	base.Path = path.Join(base.Path, "doc-audit", "biz", bizID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), http.NoBody)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("create http request fail: %v", err))
	}

	if t, err := interception.BearerTokenFromContextCompatible(ctx); err == nil {
		req.Header.Set("Authorization", "Bearer "+t)
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("read http response fail: %v", err))
	}

	if resp.StatusCode != http.StatusOK {
		return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]string{"status": resp.Status, "body": string(body)})
	}

	var da dto.DocAudit
	if err := json.Unmarshal(body, &da); err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("unmarshal http response body fail: %v", err))
	}

	return &da, nil
}

var _ RawDocAuditRESTRepo = &rawDocAuditRESTRepo{}
