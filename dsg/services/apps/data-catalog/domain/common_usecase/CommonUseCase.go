package common_usecase

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	download_apply "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_download_apply"
	user_catalog_rel "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_rel"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type CommonUseCase struct {
	daRepo  download_apply.RepoOp
	ucrRepo user_catalog_rel.RepoOp
}

func NewCommonUseCase(
	daRepo download_apply.RepoOp,
	ucrRepo user_catalog_rel.RepoOp) *CommonUseCase {
	return &CommonUseCase{
		daRepo:  daRepo,
		ucrRepo: ucrRepo,
	}
}

func (d *CommonUseCase) GetDownloadAccessResult(ctx context.Context, orgCode, catalogCode string) (accessResult int, expireTime *util.Time, err error) {
	uInfo := request.GetUserInfo(ctx)

	if len(uInfo.OrgInfos) > 0 {
		if _, exist := common.UserOrgContainsCatalogOrg(uInfo, orgCode); exist {
			// 目录的部门编码存在用户所属的所有部门编码中
			return common.CHECK_DOWNLOAD_ACCESS_RESULT_AUTHED, nil, nil
		}
	}

	var ucrs []*model.TUserDataCatalogRel
	ucrs, err = d.ucrRepo.Get(nil, ctx, catalogCode, uInfo.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get user catalog rel data (uid: %v code: %v) from db, err: %v", uInfo.ID, catalogCode, err)
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(ucrs) > 0 {
		// 当是申请得来的下载权限时，返回下载过期时间
		return common.CHECK_DOWNLOAD_ACCESS_RESULT_AUTHED, ucrs[0].ExpiredAt, nil
	}

	var applys []*model.TDataCatalogDownloadApply
	applys, err = d.daRepo.Get(nil, ctx, catalogCode, uInfo.ID, 0, 0, constant.AuditStatusAuditing)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get download apply data (uid: %v code: %v state: %v) from db, err: %v",
			uInfo.ID, catalogCode, constant.AuditStatusAuditing, err)
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(applys) > 0 {
		return common.CHECK_DOWNLOAD_ACCESS_RESULT_UNDER_REVIEW, nil, nil
	}

	return common.CHECK_DOWNLOAD_ACCESS_RESULT_UNAUTHED, nil, nil
}
