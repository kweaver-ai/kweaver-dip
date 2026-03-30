package info_resource_catalog

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/samber/lo"

	"github.com/biocrosscoder/flex/typed/collections/set"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"gorm.io/gorm"
)

var standardTableKinds = []string{fmt.Sprintf("%d", business_grooming.TableKindBusinessStandard)}

const pageSize = 100

func (repo *infoResourceCatalogRepo) initBusinessFormNotCataloged() error {
	return repo.handleDbTx(context.TODO(), func(tx *gorm.DB) (err error) {
		// [检查表是否初始化] 记录数非零说明已初始化过，跳过初始化
		count, err := repo.countBusinessFormNotCataloged(tx, "", nil)
		if count != 0 {
			return
		} // [/]
		var data []*business_grooming.BusinessFormDetail
		for pageNumber, finish := 1, false; !finish; finish = len(data) == 0 {
			// [查询业务表信息]
			data, err = repo.bizGrooming.GetBusinessFormDetails(context.Background(), []string{}, standardTableKinds, pageNumber, pageSize)
			if err != nil {
				return
			} // [/]
			// [查询已编目业务表]
			equals := []*domain.SearchParamItem{
				{
					Keys: []string{"BusinessFormID"},
					Values: functools.Map(func(x *business_grooming.BusinessFormDetail) any {
						return x.ID
					}, data),
					Exclude:  false,
					Priority: 0,
				},
			}
			where, values := repo.buildGetInfoResourceCatalogSourceInfoWhere(equals)
			var records []*domain.InfoResourceCatalogSourceInfoPO
			records, err = repo.queryInfoResourceCatalogSourceInfo(tx, where, values)
			if err != nil {
				return
			} // [/]
			// [筛选出未编目业务表]
			catalogdFormIDs := set.Of(functools.Map(func(x *domain.InfoResourceCatalogSourceInfoPO) string {
				return x.BusinessFormID
			}, records)...)
			formsToInsert := functools.Filter(func(x *business_grooming.BusinessFormDetail) bool {
				return !catalogdFormIDs.Has(x.ID)
			}, data)
			// [/]
			// [添加未编目业务表]
			if len(formsToInsert) > 0 {
				po := functools.Map(repo.buildBusinessFormNotCatalogedPOFromDetail, formsToInsert)
				err = repo.insertBusinessFormNotCataloged(tx, po)
				if err != nil {
					return
				}
			} // [/]
			pageNumber++
		}
		return
	})
}

func (repo *infoResourceCatalogRepo) syncBusinessFormUpdate() {
	repo.consumer.Subscribe("af.business-grooming.create_business_form", repo.handleBusinessFormCreate)
	repo.consumer.Subscribe("af.business-grooming.rename_business_form", repo.handleBusinessFormRename)
	repo.consumer.Subscribe("af.business-grooming.delete_business_form", repo.handleBusinessFormDelete)
	repo.consumer.Subscribe("af.business-grooming.delete_business_model", repo.handleBusinessModelDelete)
	repo.consumer.Subscribe("af.business-grooming.update_domain", repo.handleDomainUpdate)
	repo.consumer.Subscribe("af.business-grooming.delete_domain", repo.handleDomainUpdate)
}

type businessFormChangeMsg struct {
	Payload struct {
		ID string `json:"id"`
	} `json:"payload"`
}

type businessModelDeleteMsg struct {
	Payload struct {
		BusinessModelID  string `json:"business_model_id"`
		BusinessDomainID string `json:"business_domain_id"`
	} `json:"payload"`
}

type businessDomainUpdateMsg struct {
	Payload struct {
		ID  string   `json:"id"`
		IDs []string `json:"ids"`
	}
}

func (b *businessDomainUpdateMsg) ids() []string {
	if b.Payload.ID != "" {
		return []string{b.Payload.ID}
	}
	return b.Payload.IDs
}

func (repo *infoResourceCatalogRepo) handleBusinessFormCreate(data []byte) error {
	return util.SafeRun(nil, func(ctx context.Context) (err error) {
		// [解析消息数据]
		msg := new(businessFormChangeMsg)
		err = json.Unmarshal(data, msg)
		if err != nil {
			return
		} // [/]
		// [查询新增业务表]
		bizForm, err := repo.bizGrooming.GetBusinessFormDetails(ctx, []string{msg.Payload.ID}, standardTableKinds, 1, 1)
		if err != nil || len(bizForm) == 0 {
			return
		} // [/]
		// [开启事务处理]
		tx := repo.db.WithContext(ctx).Begin()
		defer func() {
			err = endTx(tx, err)
		}() // [/]
		po := repo.buildBusinessFormNotCatalogedPOFromDetail(bizForm[0])
		err = repo.insertBusinessFormNotCataloged(tx, []*domain.BusinessFormNotCatalogedPO{po})
		return
	})
}

func (repo *infoResourceCatalogRepo) handleBusinessFormRename(data []byte) error {
	return util.SafeRun(nil, func(ctx context.Context) (err error) {
		// [解析消息数据]
		msg := new(businessFormChangeMsg)
		err = json.Unmarshal(data, msg)
		if err != nil {
			return
		} // [/]
		// [查询改名业务表]
		bizForm, err := repo.bizGrooming.GetBusinessFormDetails(ctx, []string{msg.Payload.ID}, standardTableKinds, 1, 1)
		if err != nil || len(bizForm) == 0 {
			return
		} // [/]
		// [开启事务处理]
		tx := repo.db.WithContext(ctx).Begin()
		defer func() {
			err = endTx(tx, err)
		}() // [/]
		po := repo.buildBusinessFormNotCatalogedPOFromDetail(bizForm[0])
		err = repo.updateBusinessFormNotCataloged(tx, po)
		return
	})
}

func (repo *infoResourceCatalogRepo) handleBusinessFormDelete(data []byte) error {
	return util.SafeRun(nil, func(ctx context.Context) (err error) {
		// [解析消息数据]
		msg := new(businessFormChangeMsg)
		err = json.Unmarshal(data, msg)
		if err != nil {
			return
		} // [/]
		// [开启事务处理]
		tx := repo.db.WithContext(ctx).Begin()
		defer func() {
			err = endTx(tx, err)
		}() // [/]
		err = repo.deleteBusinessFormNotCataloged(tx, msg.Payload.ID)
		return
	})
}

func (repo *infoResourceCatalogRepo) handleBusinessModelDelete(data []byte) error {
	return util.SafeRun(nil, func(ctx context.Context) (err error) {
		// [解析消息数据]
		msg := new(businessModelDeleteMsg)
		err = json.Unmarshal(data, msg)
		if err != nil {
			return
		} // [/]
		// [开启事务处理]
		tx := repo.db.WithContext(ctx).Begin()
		defer func() {
			err = endTx(tx, err)
		}() // [/]
		err = repo.deleteBusinessFormNotCatalogedByBusinessModel(tx, msg.Payload.BusinessModelID)
		return
	})
}

func (repo *infoResourceCatalogRepo) handleDomainUpdate(data []byte) error {
	return util.SafeRun(nil, func(ctx context.Context) (err error) {
		// [解析消息数据]
		msg := new(businessDomainUpdateMsg)
		err = json.Unmarshal(data, msg)
		if err != nil {
			return
		} // [/]
		//查询下原有的表
		forms, err := repo.QueryFormByDomainID(context.Background(), msg.ids()...)
		if err != nil {
			return err
		}
		formIDSlice := lo.Times(len(forms), func(index int) string {
			return forms[index].FID
		})
		//查询具体信息
		bizFormSlice, err := repo.bizGrooming.GetBusinessFormDetails(ctx, formIDSlice, standardTableKinds, 1, 1)
		if err != nil || len(bizFormSlice) == 0 {
			return
		}
		// [开启事务处理]
		tx := repo.db.WithContext(ctx).Begin()
		defer func() {
			err = endTx(tx, err)
		}() // [/]
		//挨个更新
		for _, formInfo := range bizFormSlice {
			po := repo.buildBusinessFormNotCatalogedPOFromDetail(formInfo)
			err = repo.updateBusinessFormNotCataloged(tx, po)
		}
		return
	})
}
