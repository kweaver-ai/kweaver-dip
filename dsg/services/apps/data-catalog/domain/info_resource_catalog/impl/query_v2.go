package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/samber/lo"
)

// 重写前人写的那坨代码

func (d *infoResourceCatalogDomain) QueryUnCatalogedBusinessFormsV2(ctx context.Context, req *info_resource_catalog.QueryUncatalogedBusinessFormsReq) (res *info_resource_catalog.QueryUncatalogedBusinessFormsRes, err error) {
	//查询子部门
	if req.DepartmentID != nil {
		departmentID := *req.DepartmentID
		//为空表示查询未分组的
		if departmentID == "" {
			req.DepartmentIDSlice = []string{""}
		} else {
			childDepartmentSlice, err := d.confCenter.GetChildDepartments(ctx, departmentID)
			if err != nil {
				//失败了，为了不影响查询，设置按部门查询查询失效
				log.Errorf("GetChildDepartments error %v", err.Error())
				req.DepartmentID = nil
			} else {
				req.DepartmentIDSlice = lo.Uniq(lo.Times(len(childDepartmentSlice.Entries), func(index int) string {
					return childDepartmentSlice.Entries[index].ID
				}))
			}
			req.DepartmentIDSlice = append(req.DepartmentIDSlice, *req.DepartmentID)
		}
	}
	//查询子业务域信息
	if req.NodeID != nil {
		nodeID := *req.NodeID
		if nodeID == "" {
			req.ChildNodeSlice = []string{""}
		} else {
			childNodeInfo, err := d.bizGrooming.GetNodeChild(ctx, nodeID)
			if err != nil {
				log.Errorf("GetNodeChild error %v", err.Error())
				req.NodeID = nil
			} else {
				req.ChildNodeSlice = lo.Uniq(lo.Times(len(childNodeInfo), func(index int) string {
					return childNodeInfo[index].ID
				}))
			}
			req.ChildNodeSlice = append(req.ChildNodeSlice, *req.NodeID)
		}
	}
	total, records, err := d.repo.ListUnCatalogedBusinessFormsByV2(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	formIDSlice := lo.Times(len(records), func(index int) string {
		return records[index].FID
	})
	businessFormDetails := make([]*business_grooming.BusinessFormAndLabelDetail, 0)
	if len(formIDSlice) > 0 {
		businessFormDetails, err = d.bizGrooming.GetBusinessFormDetailsFilterLabel(ctx, "2", formIDSlice, []string{fmt.Sprintf("%d", business_grooming.TableKindBusinessStandard)}, 1, *req.Limit)
		if err != nil {
			return
		}
		if len(formIDSlice) != len(businessFormDetails) {
			//这里弄个操作，删除查不到的，MD，没办法了，测试不停的报BUG
			existsFormDict := lo.SliceToMap(businessFormDetails, func(item *business_grooming.BusinessFormAndLabelDetail) (string, int) {
				return item.ID, 1
			})
			removedFormIDSlice := lo.Filter(formIDSlice, func(item string, index int) bool {
				_, has := existsFormDict[item]
				return !has
			})
			if len(removedFormIDSlice) > 0 {
				if err := d.repo.DeleteForms(ctx, removedFormIDSlice); err != nil {
					log.Errorf("查询未编目业务表时，清理已删除表错误:%v", err.Error())
				}
			}
			//过滤下
			records = lo.Filter(records, func(item *model.TBusinessFormNotCataloged, index int) bool {
				_, has := existsFormDict[item.FID]
				return has
			})
		}
	}
	fid2detailMap := lo.SliceToMap(businessFormDetails, func(item *business_grooming.BusinessFormAndLabelDetail) (string, *business_grooming.BusinessFormAndLabelDetail) {
		return item.ID, item
	})
	entries := lo.Times(len(records), func(index int) *info_resource_catalog.BusinessFormVO {
		x := records[index]
		detail := fid2detailMap[x.FID]
		return &info_resource_catalog.BusinessFormVO{
			ID:                 x.FID,
			Name:               x.FName,
			Description:        x.FDescription,
			DepartmentID:       detail.DepartmentID,
			DepartmentName:     detail.DepartmentName,
			DepartmentPath:     detail.DepartmentPath,
			BusinessDomainID:   detail.BusinessDomainID,
			BusinessDomainName: detail.BusinessDomainName,
			DomainID:           detail.DomainID,
			DomainName:         detail.DomainName,
			DomainGroupID:      detail.DomainGroupID,
			DomainGroupName:    detail.DomainGroupName,
			RelatedInfoSystems: lo.Times(len(detail.RelatedInfoSystems), func(i int) *info_resource_catalog.BusinessEntity {
				return &info_resource_catalog.BusinessEntity{
					ID:   detail.RelatedInfoSystems[i].ID,
					Name: detail.RelatedInfoSystems[i].Name,
				}
			}),
			UpdateAt:      x.FUpdateAt,
			UpdateBy:      detail.UpdateByName,
			LabelListResp: detail.LabelListResp,
		}
	})
	return &info_resource_catalog.QueryUncatalogedBusinessFormsRes{
		TotalCount: int(total),
		Entries:    entries,
	}, nil
}
