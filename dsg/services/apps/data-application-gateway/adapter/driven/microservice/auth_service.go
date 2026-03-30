package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type Enforce struct {
	Action      string `json:"action"`
	Effect      string `json:"effect"`
	ObjectId    string `json:"object_id"`
	ObjectType  string `json:"object_type"`
	SubjectId   string `json:"subject_id"`
	SubjectType string `json:"subject_type"`
}

type SubjectObjectsRes struct {
	TotalCount int `json:"total_count"`
	Entries    []struct {
		ObjectId    string `json:"object_id"`
		ObjectType  string `json:"object_type"`
		Permissions []struct {
			Action string `json:"action"`
			Effect string `json:"effect"`
		} `json:"permissions"`
	} `json:"entries"`
}

type AuthServiceRepo interface {
	Enforce(ctx context.Context, enforcesReq []Enforce) (enforcesRes []bool, err error)
	SubjectObjects(ctx context.Context, objectType, subjectId, subjectType string) (res *SubjectObjectsRes, err error)
}

func NewAuthServiceRepo() AuthServiceRepo {
	return &authServiceRepo{}
}

type authServiceRepo struct{}

func (b *authServiceRepo) Enforce(ctx context.Context, enforcesReq []Enforce) (enforcesRes []bool, err error) {
	url := settings.Instance.Services.AuthService + "/api/auth-service/v1/enforce"
	resp, err := req.SetBodyJsonMarshal(enforcesReq).Post(url)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo Enforce", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("authServiceRepo Enforce", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.PublicInternalError, resp.String())
	}

	err = resp.UnmarshalJson(&enforcesRes)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo Enforce", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return
}

func (b *authServiceRepo) SubjectObjects(ctx context.Context, objectType, subjectId, subjectType string) (res *SubjectObjectsRes, err error) {
	params := map[string]string{
		"object_type":  objectType,
		"subject_id":   subjectId,
		"subject_type": subjectType,
	}
	url := settings.Instance.Services.AuthService + "/api/auth-service/v1/subject/objects"
	resp, err := req.SetBearerAuthToken(util.GetToken(ctx)).SetQueryParams(params).Get(url)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo SubjectObjects", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("authServiceRepo SubjectObjects", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.PublicInternalError, resp.String())
	}

	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo UnmarshalJson", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return
}
