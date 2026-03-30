package data_catalog

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/promise"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/panjf2000/ants/v2"
	"github.com/samber/lo"
	"gopkg.in/fatih/set.v0"
)

const MAX_GOROUTINES = 4          // 协程池中最大的运行协程数
const BATCH_ORG_CODE_TIMEOUT = 15 // 批量去请求部门的子孙部门树时的总超时时间，单位是秒

// 请求单个部门下的子孙部门编码，返回自己和子子孙孙的部门编码数组
func (d *DataCatalogDomain) getAllOrgCodesBySingleOrgCode(ctx context.Context, pOrgCode string) (allOrgCodes []string, err error) {
	if pOrgCode == "" {
		return nil, nil
	}

	header := http.Header{
		"Authorization": []string{ctx.Value(interception.Token).(string)},
	}
	val := url.Values{
		"type": []string{"organization,department"},
		"id":   []string{pOrgCode},
	}
	buf, err := util.DoHttpGet(ctx, settings.GetConfig().ConfigCenterHost+"/api/configuration-center/v1/objects/tree", header, val)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to request sub node of org (userOrgCode: %v), err: %v", pOrgCode, err)
		return nil, errorcode.Detail(errorcode.ConfigCenterTreeOrgRequestErr, err)
	}

	var trees []*common.Tree
	if err = json.Unmarshal(buf, &trees); err != nil {
		log.WithContext(ctx).Errorf("failed to request sub node of org (userOrgCode: %v), err: %v", pOrgCode, err)
		return nil, errorcode.Detail(errorcode.ConfigCenterTreeOrgRequestErr, err)
	}
	codeSet := set.New(set.NonThreadSafe)
	// 先加上自己
	codeSet.Add(pOrgCode)
	common.TreeToArray(trees, codeSet)
	return set.StringSlice(codeSet), nil
}

// 请求用户所有部门下的子孙部门编码，返回去重后的自己和这些子子孙孙的部门编码数组，这里用到了多协程技术
// 注意： 此函数在本文件内部用
func (d *DataCatalogDomain) getAllOrgCodesByUserOrgCodes(ctx context.Context, userOrgCodes []string) ([]string, error) {
	if len(userOrgCodes) == 0 {
		return nil, nil
	}

	// 设置超时时间
	poolCtx, cancel := context.WithTimeout(context.Background(), BATCH_ORG_CODE_TIMEOUT*time.Second)
	defer cancel()

	// 设置协程池最大的协程数量
	antsPool, err := ants.NewPool(MAX_GOROUTINES)
	if err != nil {
		log.WithContext(ctx).Errorf("初始化协程池错误，error is %v", err)
		return nil, errorcode.Detail(errorcode.ConfigCenterTreeOrgRequestErr, err)
	}

	taskFunc := func(pOrgCode string) *promise.Promise[[]string] {
		return promise.New(func(resolve func([]string), reject func(error)) {
			orgCodes, err2 := d.getAllOrgCodesBySingleOrgCode(ctx, pOrgCode)
			if err2 != nil || len(orgCodes) == 0 {
				log.WithContext(ctx).Errorf("请求子孙部门接口报错,请求的orgCode is %v", pOrgCode)
				reject(err2)
			} else {
				resolve(orgCodes)
			}
		})
	}
	var taskList []*promise.Promise[[]string]
	for _, userOrgCode := range userOrgCodes {
		// 把任务加入协程池
		taskList = append(taskList, taskFunc(userOrgCode))
	}

	// 执行协程池中的任务
	pro := promise.AllWithPool(poolCtx, promise.FromAntsPool(antsPool), taskList...)
	// 等待所有的任务执行完毕，这里是返回切片的切片
	allOrgCodeSlices, err := pro.Await(poolCtx)
	if err != nil {
		// 等待所有的任务执行完毕，只要某一个任务出现了错误或panic，就会进入这里
		log.WithContext(ctx).Errorf("promise.Await报错,err is %v", err)
		return nil, errorcode.Detail(errorcode.ConfigCenterTreeOrgRequestErr, err)
	}

	allOrgCodeSet := set.New(set.NonThreadSafe)
	for _, orgCodeSlice := range *allOrgCodeSlices {
		for _, orgCode := range orgCodeSlice {
			// 因为allOrgCodeSlices是返回切片的切片，故这里经过两层for循环取值存入set去重
			allOrgCodeSet.Add(orgCode)
		}
	}

	// 要保证allOrgCodeSet的元素是存储的string类型
	return set.StringSlice(allOrgCodeSet), nil
}

// 第一个参数是接口入参中的部门编码，第二个参数是用户对应的所有部门数组
func (d *DataCatalogDomain) getIntersectionAllOrgCodes(ctx context.Context, reqOrgCode string, uInfo *request.UserInfo) ([]string, error) {
	userOrgCodes := lo.Map(uInfo.OrgInfos, func(item *request.DepInfo, _ int) string {
		return item.OrgCode
	})

	if reqOrgCode != "" && len(userOrgCodes) > 0 {
		allReqOrgCodes, err := d.getAllOrgCodesBySingleOrgCode(ctx, reqOrgCode)
		if err != nil {
			return nil, err
		}

		allUserOrgCodes, err := d.getAllOrgCodesByUserOrgCodes(ctx, userOrgCodes)
		if err != nil {
			return nil, err
		}

		// 求交集
		orgCodeSet := set.Intersection(common.SliceToSet(allReqOrgCodes), common.SliceToSet(allUserOrgCodes))
		return set.StringSlice(orgCodeSet), nil
	} else {
		return nil, nil
	}

}

// 得到用户所有的部门下的子孙部门的并集，此函数用于外部使用
func (d *DataCatalogDomain) getUserAllUnionOrgCodes(ctx context.Context, uInfo *request.UserInfo) (userOrgCodes, allSubOrgCodes []string, err error) {
	userOrgCodes = lo.Map(uInfo.OrgInfos, func(item *request.DepInfo, _ int) string {
		return item.OrgCode
	})

	allSubOrgCodes, err = d.getAllOrgCodesByUserOrgCodes(ctx, userOrgCodes)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.ConfigCenterTreeOrgRequestErr, err)
	}
	return
}
