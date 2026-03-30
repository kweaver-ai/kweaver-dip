package domain

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
)

type DeveloperDomain struct {
	repo gorm.DeveloperRepo
}

func NewDeveloperDomain(repo gorm.DeveloperRepo) *DeveloperDomain {
	return &DeveloperDomain{repo: repo}
}

func (u *DeveloperDomain) DeveloperList(ctx context.Context, req *dto.DeveloperListReq) (*dto.DeveloperListRes, error) {
	developers, count, err := u.repo.DeveloperList(ctx, req)
	if err != nil {
		return nil, err
	}

	entries := []*dto.Developer{}
	for _, developer := range developers {
		entries = append(entries, &dto.Developer{
			ID:            developer.DeveloperID,
			Name:          developer.DeveloperName,
			ContactPerson: developer.ContactPerson,
			ContactInfo:   developer.ContactInfo,
			CreateTime:    developer.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:    developer.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	res := &dto.DeveloperListRes{
		PageResult: dto.PageResult[dto.Developer]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u *DeveloperDomain) DeveloperCreate(ctx context.Context, req *dto.DeveloperCreateReq) error {
	developer := &model.Developer{
		DeveloperID:   util.NewUUID(),
		DeveloperName: req.Name,
		ContactPerson: req.ContactPerson,
		ContactInfo:   req.ContactInfo,
	}
	err := u.repo.DeveloperCreate(ctx, developer)

	return err
}

func (u *DeveloperDomain) DeveloperGet(ctx context.Context, req *dto.DeveloperGetReq) (res *dto.DeveloperGetRes, err error) {
	developer, err := u.repo.DeveloperGet(ctx, req.Id)

	if err != nil {
		return nil, err
	}
	t := &dto.DeveloperGetRes{
		Developer: dto.Developer{
			ID:            developer.DeveloperID,
			Name:          developer.DeveloperName,
			ContactInfo:   developer.ContactInfo,
			ContactPerson: developer.DeveloperName,
			CreateTime:    developer.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:    developer.UpdateTime.Format("2006-01-02 15:04:05"),
		},
	}
	return t, err
}

func (u *DeveloperDomain) DeveloperUpdate(ctx context.Context, req *dto.DeveloperUpdateReq) error {
	developer := &model.Developer{
		DeveloperName: req.Name,
		ContactPerson: req.ContactPerson,
		ContactInfo:   req.ContactInfo,
	}

	err := u.repo.DeveloperUpdate(ctx, req.Id, developer)
	return err
}

func (u *DeveloperDomain) DeveloperDelete(ctx context.Context, req *dto.DeveloperDeleteReq) error {
	err := u.repo.DeveloperDelete(ctx, req.Id)
	return err
}
