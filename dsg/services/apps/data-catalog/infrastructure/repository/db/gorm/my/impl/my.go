package impl

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gopkg.in/fatih/set.v0"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) my.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *repo) GetMyApplyList(tx *gorm.DB, ctx context.Context, req *my.AssetApplyListReqParam) ([]*my.AssetApplyListRespItem, int64, error) {
	var applyList []*my.AssetApplyListRespItem
	var totalCount int64
	applyTableName, catalogTableName := new(model.TDataCatalogDownloadApply).TableName(), new(model.TDataCatalog).TableName()
	// 注意目录的id重命名为cid，在接收时gorm标签用column:cid
	db := r.do(tx, ctx).Table(applyTableName + "  a").
		Select(
			`a.id, a.uid, a.audit_apply_sn, a.apply_days, a.state, a.created_at, a.updated_at, a.flow_apply_id,
                   c.id as cid, c.code, c.title, c.orgcode, c.orgname, c.owner_id, c.owner_name`).
		Joins(" left join " + catalogTableName + "  c on a.code = c.code ").
		Where("c.deleted_at is null")

	// 用户筛选
	if req.UIDs == "" {
		//获取登录用户ID
		uInfo := request.GetUserInfo(ctx)
		db = db.Where("a.uid = ?", uInfo.ID)
	} else {
		uidStrs := strings.Split(req.UIDs, ",")
		db = db.Where("a.uid in ?", uidStrs)
	}

	// 申请时间大于
	if req.StartTime > 0 {
		db = db.Where("UNIX_TIMESTAMP(a.created_at)*1000 >= ?", req.StartTime)
	}

	// 申请时间小于
	if req.EndTime > 0 {
		db = db.Where("UNIX_TIMESTAMP(a.created_at)*1000 <= ?", req.EndTime)
	}

	// 申请状态筛选
	if req.State != "" {
		stateStrs := strings.Split(req.State, ",")
		var stateInts []int
		for _, stateStr := range stateStrs {
			if stateInt, e := strconv.Atoi(stateStr); e == nil {
				stateInts = append(stateInts, stateInt)
			}
		}
		if len(stateInts) == len(stateStrs) {
			// 求并集
			stateStrSet := set.Union(common.SliceToSet([]string{"1", "2", "3"}), common.SliceToSet(stateStrs))
			// 并集后，size还是等于3，说明传参是1，2，3之间的组合
			if stateStrSet.Size() == 3 {
				db = db.Where("a.state in ?", stateInts)
			} else {
				return nil, 0, nil
			}
		} else {
			return nil, 0, nil
		}
	}

	// 关键词筛选
	if len(req.Keyword) > 0 {
		kw := util.KeywordEscape(req.Keyword)
		db = db.Where("(c.title like concat('%',?,'%') or c.code like concat('%',?,'%'))", kw, kw)
	}

	// 总数
	db = db.Count(&totalCount)
	if db.Error == nil {
		// 排序和分页
		db = db.Order(*(req.Sort) + " " + *(req.Direction)).Offset((*(req.Offset) - 1) * *(req.Limit)).Limit(*(req.Limit)).Scan(&applyList)
		return applyList, totalCount, db.Error
	} else {
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
	}
}

func (r *repo) GetDownloadApplyModel(tx *gorm.DB, ctx context.Context, applyID uint64) (*model.TDataCatalogDownloadApply, error) {
	applyModel := &model.TDataCatalogDownloadApply{}
	db := r.do(tx, ctx).Model(&model.TDataCatalogDownloadApply{}).Where("id = ?", applyID).First(applyModel)
	if db.Error != nil {
		if errors.Is(db.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
	}
	return applyModel, nil
}

func (r *repo) GetDataCatalogModelWithCode(tx *gorm.DB, ctx context.Context, code string) (*model.TDataCatalog, error) {
	dataCatalogModel := &model.TDataCatalog{}
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).Where("code = ?", code).First(dataCatalogModel)
	if db.Error != nil {
		if errors.Is(db.Error, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
	}
	return dataCatalogModel, nil
}

/*
	func (r *repo) GetDataCatalogModelWithID(tx *gorm.DB, ctx context.Context, catalogID uint64) (*model.TDataCatalog, error) {
		dataCatalogModel := &model.TDataCatalog{}
		db := r.do(tx, ctx).Model(&model.TDataCatalog{}).Where("id = ?", catalogID).First(dataCatalogModel)
		if db.Error != nil {
			if errors.Is(db.Error, gorm.ErrRecordNotFound) {
				return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
			}
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
		}
		return dataCatalogModel, nil
	}
*/
func (r *repo) getUserDataCatalogRelCodeList(tx *gorm.DB, ctx context.Context, reqUIDs string) ([]string, error) {
	var catalogCodes []string
	db := r.do(tx, ctx).Model(&model.TUserDataCatalogRel{}).Where("expired_flag = 1 and expired_at > now()") // 未过期

	// 用户筛选
	if reqUIDs == "" {
		//获取登录用户ID
		uInfo := request.GetUserInfo(ctx)
		db = db.Where("uid = ?", uInfo.ID)
	} else {
		uidStrs := strings.Split(reqUIDs, ",")
		db = db.Where("uid in ?", uidStrs)
	}

	db = db.Pluck("code", &catalogCodes)
	return catalogCodes, db.Error
}

/*
func (r *repo) GetAvailableAssetList(tx *gorm.DB, ctx context.Context, req *my.AvailableAssetListReqParam, catalogIDs []uint64) ([]*my.AvailableAssetListRespItem, int64, error) {
	var assetList []*my.AvailableAssetListRespItem
	var totalCount int64

	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).
		Select(`id, code, title, orgcode, orgname, owner_id, owner_name, description, published_at`).
		Where("(deleted_at is null and state = 5 and current_version = 1 and table_count > 0)")

	// catalogIDs为用户下可用权限数据目录所有的id数组
	db = db.Where("id in ?", catalogIDs)

	// 筛选部门
	if req.Orgcode != "" {
		db = db.Where("orgcode = ?", req.Orgcode)
	}

	// 关键词筛选
	if len(req.Keyword) > 0 {
		kw := util.KeywordEscape(req.Keyword)
		db = db.Where("(title like concat('%',?,'%') or code like concat('%',?,'%'))", kw, kw)
	}

	db = db.Count(&totalCount)
	if db.Error == nil {
		// 排序和分页
		db = db.Order(*(req.Sort) + " " + *(req.Direction)).Offset((*(req.Offset) - 1) * *(req.Limit)).Limit(*(req.Limit)).Scan(&assetList)
		return assetList, totalCount, db.Error
	} else {
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
	}
}
*/
//func (r *repo) GetAvailableAssetList(tx *gorm.DB, ctx context.Context, req *my.AvailableAssetListReqParam) ([]*my.AvailableAssetListRespItem, int64, error) {
//	var assetList []*my.AvailableAssetListRespItem
//	var totalCount int64
//
//	// 得到用户已获目录下载权限记录表的目录编码
//	catalogCodeList, err := r.getUserDataCatalogRelCodeList(tx, ctx, req.UIDs)
//	if err != nil {
//		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
//	}
//
//	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).
//		Select(`id, code, title, orgcode, orgname, owner_id, owner_name, description, published_at`).
//		Where("(deleted_at is null and state = 5 and current_version = 1 and table_count > 0)")
//
//	// 用户筛选
//	if req.UIDs == "" {
//		//获取登录用户ID
//		uInfo := request.GetUserInfo(ctx)
//		var orgCodeList []string
//		for i := range uInfo.OrgInfos {
//			orgCodeList = append(orgCodeList, uInfo.OrgInfos[i].OrgCode)
//		}
//		// 可用资产数据目录包括【用户申请下可用资产目录】和【目录的部门属于用户下对应的一个部门的目录】
//		db = db.Where("(code in ? or orgcode in ?)", catalogCodeList, orgCodeList)
//	} else {
//		db = db.Where("code in ?", catalogCodeList)
//	}
//
//	// 筛选部门
//	if req.Orgcode != "" {
//		db = db.Where("orgcode = ?", req.Orgcode)
//	}
//
//	// 关键词筛选
//	if len(req.Keyword) > 0 {
//		kw := util.KeywordEscape(req.Keyword)
//		db = db.Where("(title like concat('%',?,'%') or code like concat('%',?,'%'))", kw, kw)
//	}
//
//	db = db.Count(&totalCount)
//	if db.Error == nil {
//		// 排序和分页
//		db = db.Order(*(req.Sort) + " " + *(req.Direction)).Offset((*(req.Offset) - 1) * *(req.Limit)).Limit(*(req.Limit)).Scan(&assetList)
//		return assetList, totalCount, db.Error
//	} else {
//		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
//	}
//}

// GetAvailableAssetDetail 使用权限取可用资产后，下面方法废弃
//func (r *repo) GetAvailableAssetDetail(tx *gorm.DB, ctx context.Context, assetID uint64) (dModel *model.TDataCatalog, err error) {
//	// 得到用户已获目录下载权限记录表的目录编码
//	catalogCodeList, err := r.getUserDataCatalogRelCodeList(tx, ctx, "")
//	if err != nil {
//		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
//	}
//	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).Where("id = ? and deleted_at is null and state = 5 and current_version = 1 and table_count > 0", assetID).First(&dModel)
//
//	//获取登录用户ID
//	uInfo := request.GetUserInfo(ctx)
//	var orgCodeList []string
//	for i := range uInfo.OrgInfos {
//		orgCodeList = append(orgCodeList, uInfo.OrgInfos[i].OrgCode)
//	}
//	// 可用资产数据目录包括【用户申请下可用资产目录】和【目录的部门属于用户下对应的一个部门的目录】
//	db = db.Where("(code in ? or orgcode in ?)", catalogCodeList, orgCodeList)
//
//	if db.Error != nil {
//		if errors.Is(db.Error, gorm.ErrRecordNotFound) {
//			return nil, errorcode.Desc(errorcode.AvailableAssetNotExisted)
//		}
//		return nil, errorcode.Detail(errorcode.PublicDatabaseError, db.Error)
//	}
//	return
//}
