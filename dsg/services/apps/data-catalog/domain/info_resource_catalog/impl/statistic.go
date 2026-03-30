package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_resource_catalog_statistic"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (d *infoResourceCatalogDomain) GetCatalogStatistics(ctx context.Context) (*info_resource_catalog.CatalogStatistics, error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.CatalogStatistics, err error) {
		var s *info_resource_catalog_statistic.CatalogStatistics
		if s, err = d.statisticRepo.GetCatalogStatistics(nil, ctx); err != nil {
			log.WithContext(ctx).Errorf("d.statisticRepo.GetCatalogStatistics failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		res = &info_resource_catalog.CatalogStatistics{
			TotalNum:       s.TotalNum,
			UnpublishNum:   s.UnpublishNum,
			PublishedNum:   s.PublishNum,
			NotonlineNum:   s.NotonlineNum,
			OnlineNum:      s.OnlineNum,
			OfflineNum:     s.OfflineNum,
			AuditStatistic: make([]*info_resource_catalog.AuditStatistic, 0, 3),
		}
		res.AuditStatistic = append(res.AuditStatistic,
			&info_resource_catalog.AuditStatistic{
				AuditType:   "publish",
				AuditingNum: s.PublishAuditingNum,
				PassNum:     s.PublishPassNum,
				RejectNum:   s.PublishRejectNum,
			},
			&info_resource_catalog.AuditStatistic{
				AuditType:   "online",
				AuditingNum: s.OnlineAuditingNum,
				PassNum:     s.OnlinePassNum,
				RejectNum:   s.OnlineRejectNum,
			},
			&info_resource_catalog.AuditStatistic{
				AuditType:   "offline",
				AuditingNum: s.OfflineAuditingNum,
				PassNum:     s.OfflinePassNum,
				RejectNum:   s.OfflineRejectNum,
			})
		return
	})
}

func (d *infoResourceCatalogDomain) GetBusinessFormStatistics(ctx context.Context) (*info_resource_catalog.BusinessFormStatistics, error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.BusinessFormStatistics, err error) {
		var (
			s []*info_resource_catalog_statistic.BusinessFormStatistics
			c *info_resource_catalog_statistic.CatalogedBusiFormInfo
		)
		res = &info_resource_catalog.BusinessFormStatistics{
			DeptStatistic: make([]*info_resource_catalog.BusinessFormStatisticsEntry, 0),
		}

		if res.UncatalogedNum, err = d.statisticRepo.GetUncatalogedBusiFormNum(nil, ctx); err != nil {
			log.WithContext(ctx).Errorf("d.statisticRepo.GetUncatalogedBusiFormNum failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		if c, err = d.statisticRepo.GetCatalogedBusiFormNum(nil, ctx); err != nil {
			log.WithContext(ctx).Errorf("d.statisticRepo.GetCatalogedBusiFormNum failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		res.TotalNum = res.UncatalogedNum + c.CatalogedNum
		res.PublishNum = c.PublishNum
		if res.TotalNum > 0 {
			res.Rate = fmt.Sprintf("%.1f", float64(res.PublishNum*100)/float64(res.TotalNum))
		}

		if s, err = d.statisticRepo.GetBusinessFormStatistics(nil, ctx); err != nil {
			log.WithContext(ctx).Errorf("d.statisticRepo.GetBusinessFormStatistics failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if len(s) > 0 {
			var (
				depts  []*configuration_center.DepartmentObject
				tmpObj *info_resource_catalog.BusinessFormStatisticsEntry
			)
			deptIDs := make([]string, 0, len(s))
			deptID2obj := map[string]*info_resource_catalog.BusinessFormStatisticsEntry{}
			for i := range s {
				res.DeptStatistic = append(res.DeptStatistic,
					&info_resource_catalog.BusinessFormStatisticsEntry{
						BusinessFormStatistics: s[i],
					},
				)
				deptIDs = append(deptIDs, s[i].DepartmentID)
				deptID2obj[s[i].DepartmentID] = res.DeptStatistic[len(res.DeptStatistic)-1]

			}
			if depts, err = d.confCenter.GetDepartments(ctx, deptIDs); err != nil {
				log.WithContext(ctx).Errorf("d.confCenter.GetDepartments failed: %v", err)
				return nil, errorcode.Detail(errorcode.PublicInternalError, err)
			}
			for i := range depts {
				tmpObj = deptID2obj[depts[i].ID]
				tmpObj.DepartmentName = depts[i].Name
				tmpObj.DepartmentPath = depts[i].Path
			}
		}
		return
	})
}

func (d *infoResourceCatalogDomain) GetDeptCatalogStatistics(ctx context.Context) (*info_resource_catalog.DeptCatalogStatistics, error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.DeptCatalogStatistics, err error) {
		res = &info_resource_catalog.DeptCatalogStatistics{
			DeptStatistic: make([]*info_resource_catalog.DeptCatalogStatisticsEntry, 0),
		}

		var s []*info_resource_catalog_statistic.DeptCatalogStatistics
		if s, err = d.statisticRepo.GetDeptCatalogStatistics(nil, ctx); err != nil {
			log.WithContext(ctx).Errorf("d.statisticRepo.GetDeptCatalogStatistics failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		if len(s) > 0 {
			var (
				depts  []*configuration_center.DepartmentObject
				tmpObj *info_resource_catalog.DeptCatalogStatisticsEntry
			)
			deptIDs := make([]string, 0, len(s))
			deptID2obj := map[string]*info_resource_catalog.DeptCatalogStatisticsEntry{}
			for i := range s {
				res.DeptStatistic = append(res.DeptStatistic,
					&info_resource_catalog.DeptCatalogStatisticsEntry{
						DeptCatalogStatistics: s[i],
					},
				)
				deptIDs = append(deptIDs, s[i].DepartmentID)
				deptID2obj[s[i].DepartmentID] = res.DeptStatistic[len(res.DeptStatistic)-1]

			}
			if depts, err = d.confCenter.GetDepartments(ctx, deptIDs); err != nil {
				log.WithContext(ctx).Errorf("d.confCenter.GetDepartments failed: %v", err)
				return nil, errorcode.Detail(errorcode.PublicInternalError, err)
			}
			for i := range depts {
				tmpObj = deptID2obj[depts[i].ID]
				tmpObj.DepartmentName = depts[i].Name
				tmpObj.DepartmentPath = depts[i].Path
			}
		}
		return
	})
}

func (d *infoResourceCatalogDomain) GetShareStatistics(ctx context.Context) (*info_resource_catalog.ShareStatistics, error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.ShareStatistics, err error) {
		var s *info_resource_catalog_statistic.ShareStatistics
		if s, err = d.statisticRepo.GetShareStatistics(nil, ctx); err != nil {
			log.WithContext(ctx).Errorf("d.statisticRepo.GetShareStatistics failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		res = &info_resource_catalog.ShareStatistics{
			TotalNum:        s.NoneNum + s.AllNum + s.PartialNum,
			ShareStatistics: s,
		}
		return
	})
}
