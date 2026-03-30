package domain

import (
	"context"
	"path"
	"sort"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
)

type SubjectDomain struct {
	serviceRepo gorm.ServiceRepo
	dataSubject microservice.DataSubjectRepo
}

func NewSubjectDomain(serviceRepo gorm.ServiceRepo, dataSubject microservice.DataSubjectRepo) *SubjectDomain {
	return &SubjectDomain{
		serviceRepo: serviceRepo,
		dataSubject: dataSubject,
	}
}

// SubjectDomainList 当前登录用户有权限的主题域列表
//
// 是主题域owner + 不是资源owner = 有权限，获取是owner的L2，记为 L2A
// 不是主题域owner + 是资源owner = 有权限，获取是owner的资源，获取这些资源所属的L2，记为 L2B
// 有权限的主题域树 = 按创建时间排序(去重(L2A + L2B))
func (u *SubjectDomain) SubjectDomainList(ctx context.Context, req *dto.SubjectDomainListReq) (res *dto.SubjectDomainListRes, err error) {
	userId := util.GetUser(ctx).Id

	//获取是owner的L2 L2A
	list, err := u.dataSubject.DataSubjectList(ctx, "", "subject_domain_group,subject_domain")
	if err != nil {
		return nil, err
	}
	// Owner 是当前用户的主题域的 ID 列表
	var l2a []string
	for _, dataSubject := range list.Entries {
		// 只判断主题域
		if dataSubject.Type != "subject_domain" {
			continue
		}
		//判断是不是owner 是owner则保留
		if util.IsContain(dataSubject.Owners, userId) {
			l2a = append(l2a, dataSubject.Id)
		}
	}

	// L2b 是 Owner 等于当前用户的接口服务所属的主题域的 ID 列表
	l2b, err := u.serviceRepo.GetSubjectDomainIdsByUserId(ctx, userId)
	if err != nil {
		return nil, err
	}

	// 发起请求的用户有权限的主题域列表
	//
	//  L2 = unique(L2A + L2B)
	var l2 = util.SliceUnique(append(l2a, l2b...))

	// L1: 发起请求的用户有权限的主题域，所属的主题域分组
	var l1 []string
	// 查找每个主题域所属的主题域分组
	for _, id := range l2 {
		// 遍历 list，查找主题域所属的主题域分组的 ID
		for _, e := range list.Entries {
			if e.Id != id {
				continue
			}
			// DataSubject.PathId 的格式为
			// SubjectDomainGroupID/SubjectDomainID，所以
			// path.Dir(DataSubject.PathId) 是主题域所属的主题域分组的 ID
			l1 = append(l1, path.Dir(e.PathId))
			break
		}
	}
	// L1 去重
	l1 = util.SliceUnique(l1)

	// 合并主题域分组、主题域
	//  L1L2 = L1 + L2
	var l1l2 = append(l1, l2...)

	//填充为主题域对象数组
	var l2s []microservice.DataSubject
	for _, l2Id := range l1l2 {
		for _, dataSubject := range list.Entries {
			if dataSubject.Id == l2Id {
				l2s = append(l2s, dataSubject)
			}
		}
	}

	//按创建时间从旧到新排序
	sort.SliceStable(l2s, func(i, j int) bool {
		return l2s[i].CreatedAt < l2s[j].CreatedAt
	})

	var entries []*dto.SubjectDomain
	for _, l2 := range l2s {
		entries = append(entries, &dto.SubjectDomain{
			Id:               l2.Id,
			Name:             l2.Name,
			Description:      l2.Description,
			Type:             l2.Type,
			PathId:           l2.PathId,
			PathName:         l2.PathName,
			Owners:           l2.Owners,
			CreatedBy:        l2.CreatedBy,
			CreatedAt:        l2.CreatedAt,
			UpdatedBy:        l2.UpdatedBy,
			UpdatedAt:        l2.UpdatedAt,
			ChildCount:       l2.ChildCount,
			SecondChildCount: l2.SecondChildCount,
		})
	}

	res = &dto.SubjectDomainListRes{
		PageResult: dto.PageResult[dto.SubjectDomain]{
			Entries:    entries,
			TotalCount: int64(len(entries)),
		},
	}

	return res, nil
}
