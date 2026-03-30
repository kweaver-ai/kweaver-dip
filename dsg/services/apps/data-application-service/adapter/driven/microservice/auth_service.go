package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v2"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Enforce struct {
	Action      string `json:"action"`
	Effect      string `json:"effect"`
	ObjectId    string `json:"object_id"`
	ObjectType  string `json:"object_type"`
	SubjectId   string `json:"subject_id"`
	SubjectType string `json:"subject_type"`
}

// EnforceEqualWithoutEffect 比较两个 Enforce 除了 Effect 是否相同
func EnforceEqualWithoutEffect(a, b *Enforce) bool {
	if a == nil || b == nil {
		return a == b
	}

	for _, cond := range []bool{
		a.Action == b.Action,
		a.ObjectId == b.ObjectId,
		a.ObjectType == b.ObjectType,
		a.SubjectId == b.SubjectId,
		a.SubjectType == b.SubjectType,
	} {
		if !cond {
			return false
		}
	}
	return true
}

type SubjectObjectsRes dto.SubjectObjectsRes

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
	resp, err := req.SetBearerAuthToken(util.GetToken(ctx)).SetBodyJsonMarshal(enforcesReq).Post(url)
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

	token, err := interception.BearerTokenFromContext(ctx)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo SubjectObjects", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	resp, err := req.SetBearerAuthToken(token).SetQueryParams(params).Get(url)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo SubjectObjects", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("authServiceRepo SubjectObjects", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("authServiceRepo UnmarshalJson", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}
