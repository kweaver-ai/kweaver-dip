package data_catalog

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq"
	mq_common "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	catalog_flow "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_audit_flow_bind"
	catalog_sequence "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_code_sequence"
	catalog_title "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_code_title"
	catalog_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column"
	download_apply "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_download_apply"
	catalog_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info"
	catalog_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_mount_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

const codeKeyPrefix = "data_catalog_code_prefix_"

const (
	OP_TYPE_CREATE = iota + 1
	OP_TYPE_UPDATE
)

const (
	MQ_MSG_TYPE_CREATE = "create"
	MQ_MSG_TYPE_UPDATE = "update"
	MQ_MSG_TYPE_DELETE = "delete"
)

type DataCatalogDomain struct {
	catalogRepo     catalog.RepoOp
	infoRepo        catalog_info.RepoOp
	colRepo         catalog_column.RepoOp
	resRepo         catalog_resource.RepoOp
	seqRepo         catalog_sequence.RepoOp
	titleRepo       catalog_title.RepoOp
	flowRepo        catalog_flow.RepoOp
	daRepo          download_apply.RepoOp
	redisClient     *repository.Redis
	redisson        *util.Redisson
	data            *db.Data
	esIndexProducer mq_common.ESIndexProducer
	wf              workflow.WorkflowInterface
	cfgRepo         configuration_center.Repo
	newCatalog      data_resource_catalog.DataResourceCatalogDomain
}

func NewDataCatalogDomain(
	cata catalog.RepoOp,
	cataInfo catalog_info.RepoOp,
	cataCol catalog_column.RepoOp,
	cataRes catalog_resource.RepoOp,
	cataSeq catalog_sequence.RepoOp,
	cataTitle catalog_title.RepoOp,
	cataFlow catalog_flow.RepoOp,
	daRepo download_apply.RepoOp,
	redisClient *repository.Redis,
	redisson *util.Redisson,
	data *db.Data,

	wf workflow.WorkflowInterface,
	cfgRepo configuration_center.Repo,
	mqm *mq.MQManager,
	newCatalog data_resource_catalog.DataResourceCatalogDomain,
) *DataCatalogDomain {
	esIndexProducer := mqm.GetProducer(mq_common.MQ_TYPE_KAFKA, mq.TOPIC_PUB_KAFKA_ES_INDEX_ASYNC)
	dc := &DataCatalogDomain{
		catalogRepo:     cata,
		infoRepo:        cataInfo,
		colRepo:         cataCol,
		resRepo:         cataRes,
		seqRepo:         cataSeq,
		titleRepo:       cataTitle,
		flowRepo:        cataFlow,
		daRepo:          daRepo,
		redisClient:     redisClient,
		redisson:        redisson,
		data:            data,
		esIndexProducer: esIndexProducer,
		cfgRepo:         cfgRepo,
		wf:              wf,
		newCatalog:      newCatalog,
	}
	dc.wf.RegistConusmeHandlers(common.WORKFLOW_AUDIT_TYPE_CATALOG_PUBLISH,
		dc.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_PUBLISH, dc.newCatalog.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_PUBLISH, dc.AuditProcessDelMsgProc))
	dc.wf.RegistConusmeHandlers(common.WORKFLOW_AUDIT_TYPE_CATALOG_CHANGE,
		dc.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_CHANGE, dc.newCatalog.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_CHANGE, dc.AuditProcessDelMsgProc))
	dc.wf.RegistConusmeHandlers(common.WORKFLOW_AUDIT_TYPE_CATALOG_ONLINE,
		dc.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_ONLINE, dc.newCatalog.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_ONLINE, dc.AuditProcessDelMsgProc))
	dc.wf.RegistConusmeHandlers(common.WORKFLOW_AUDIT_TYPE_CATALOG_OFFLINE,
		dc.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_OFFLINE, dc.newCatalog.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_OFFLINE, dc.AuditProcessDelMsgProc))
	return dc
}

/*
func (d *DataCatalogDomain) Create(ctx context.Context, req *CreateReqBodyParams) (resp *response.NameIDResp2, err error) {
	catalog, err := createProc(d, ctx, req)
	if err != nil {
		return nil, err
	}
	return &response.NameIDResp2{ID: fmt.Sprint(catalog.ID)}, nil
}*/

var lastTimeStr string // 上一个秒内的时间串
var autoIncrId uint32  // 一秒内对应的3位的自增序列，一秒内最大设置999个并发，此自增序列拼在目录编码的最后3位
/*func genCatalogCodeWithConfig(d *DataCatalogDomain, ctx context.Context, req *CreateReqBodyParams, codeType int) (string, int32, error) {
	if codeType == 1 {
		// 1为旧的以/斜线分隔的编码，如aaaaaaa/000260
		orderCode, err := d.genCatalogSerialCode(ctx, req.CodePrefix)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to generate catalog serial code, err: %v", err)
			return "", 0, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		return fmt.Sprintf("%s/%06d", req.CodePrefix, orderCode), orderCode, nil

	} else if codeType == 2 {
		// 20060102150405有14位
		nowStr := time.Now().Format("20060102150405")
		// uint16: 0 ~ 65535，可以给5位字符长度
		machineID, err := utilities.NewMachineID()()
		if err != nil {
			log.WithContext(ctx).Errorf("failed to generate catalog serial code, err: %v", err)
			return "", 0, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		// 记录上一秒的时间，当前时间与上一秒不同，自增id清零
		if nowStr != lastTimeStr {
			autoIncrId = 0
		}
		// 此处用原子操作，防止并发时数据重复
		atomic.AddUint32(&autoIncrId, 1)
		if autoIncrId > 999 {
			// 1秒钟超过999个并发，则报错，因为自增序列目前设置只支持3位字符串
			err := errors.New("catalog code over concurrency is not support")
			log.WithContext(ctx).Errorf("failed to generate catalog serial code, err: %v", err)
			return "", 0, errorcode.Detail(errorcode.CatalogCodeOverConcurrency, err)
		}

		// 把这次的秒级时间保存下来
		lastTimeStr = nowStr

		// 年月日时分秒占14，机器码占5位，自增序列占3位，共占22位
		//（例：2023070718000012345001（20230707180000为年月日时分秒，12345为机器码，001为自增的数字序列））
		return fmt.Sprintf("%s%05d%03d", nowStr, machineID, autoIncrId), 0, nil

	} else {
		err := errors.New("in config file, CATALOG_CODE_TYPE is not 1 or 2")
		log.WithContext(ctx).Errorf("failed to generate catalog serial code, err: %v", err)
		return "", 0, errorcode.Detail(errorcode.PublicInternalError, err)
	}
}*/

// 通过目录对应的部门code，查询目录对应的数据owner
func queryCatalogOwner(ctx context.Context, infos []*InfoItem, orgCode string) (string, string, error) {
	log.WithContext(ctx).Infof("请求BusinessGrooming获取owner，InfoItem数组 is %v", infos)
	// 从入参infos中得到业务对象ID数组
	var businessObjectIDList []string
	for i := range infos {
		// 类型为业务域
		if infos[i].InfoType == common.INFO_TYPE_BUSINESS_DOMAIN {
			businessObjectIDList = make([]string, len(infos[i].Entries))
			for j := range infos[i].Entries {
				businessObjectIDList[j] = infos[i].Entries[j].InfoKey
			}
			break
		}
	}

	log.WithContext(ctx).Infof("请求BusinessGrooming获取owner，请求入参businessObjectIDList is %v", businessObjectIDList)
	if len(businessObjectIDList) > 0 {
		// 调接口获取关联数据owner，里面的错误已打印
		resOwnerInfos, err := common.GetOwnerByBusinessObjIDs(ctx, strings.Join(businessObjectIDList, ","))
		if err != nil {
			return "", "", err
		}
		log.WithContext(ctx).Infof("请求BusinessGrooming获取owner，接口返回的数据 is %v", resOwnerInfos)

		//前端入参的orgcode在上面依赖的外部接口返回的数组中遍历每一个owner，然后在owner中遍历departments数组，
		//以入参orgcode去查找与department_id相同的一个owner就返回。如果最终还是没有查找到就返回为空。
		// for i := range resOwnerInfos {
		// 	for j := range resOwnerInfos[i].Departments {
		// 		if orgCode == resOwnerInfos[i].Departments[j].DepartmentId { // 如果为同一部门
		// 			log.WithContext(ctx).Infof("请求BusinessGrooming获取owner，最终获取的owner_id is %v, owner_name is %v，部门orgcode is %v",
		// 				resOwnerInfos[i].UserId, resOwnerInfos[i].UserName, orgCode)

		// 			return resOwnerInfos[i].UserId, resOwnerInfos[i].UserName, nil
		// 		}
		// 	}
		// }
		if len(resOwnerInfos) > 0 {
			log.WithContext(ctx).Infof("请求BusinessGrooming获取owner，最终获取的owner_id is %v, owner_name is %v",
				resOwnerInfos[0].UserId, resOwnerInfos[0].UserName)
			return resOwnerInfos[0].UserId, resOwnerInfos[0].UserName, nil
		}
	}

	log.WithContext(ctx).Warnf("请求BusinessGrooming获取owner，没有获取到owner_id和owner_name")
	return "", "", nil
}

/*
func createProc(d *DataCatalogDomain, ctx context.Context, req *CreateReqBodyParams) (catalog *model.TDataCatalog, err error) {
	var catalogID uint64
	uInfo := request.GetUserInfo(ctx)

	codeType := settings.GetConfig().VariablesConf.CatalogCodeType
	// 根据配置的不同，得到相应的资产目录编码
	catalogCode, orderCode, err := genCatalogCodeWithConfig(d, ctx, req, codeType)
	if err != nil {
		return nil, err
	}

	catalogID, err = utils.GetUniqueID()
	if err != nil {
		log.WithContext(ctx).Errorf("failed to generate catalog id, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	curVersion := int8(1)
	timeNow := &util.Time{time.Now()}
	catalog = &model.TDataCatalog{
		ID:               catalogID,
		Code:             catalogCode,
		Title:            req.Title,
		ThemeID:          req.ThemeID,
		ThemeName:        req.ThemeName,
		Description:      req.Description,
		Version:          "0.0.0.1",
		DataRange:        req.DataRange,
		UpdateCycle:      req.UpdateCycle,
		DataKind:         req.DataKind,
		SharedType:       req.SharedType,
		SharedCondition:  req.SharedCondition,
		OpenType:         req.OpenType,
		PhysicalDeletion: req.PhysicalDeletion,
		SyncFrequency:    req.SyncFrequency,
		SyncMechanism:    req.SyncMechanism,
		State:            1,
		Orgcode:          req.Orgcode,
		Orgname:          req.Orgname,
		CreatedAt:        timeNow,
		CreatorUID:       req.Uid,
		CreatorName:      req.UserName,
		UpdatedAt:        timeNow,
		Source:           req.Source,
		TableType:        req.TableType,
		CurrentVersion:   &curVersion,
		PublishFlag:      req.PublishFlag,
		DataKindFlag:     req.DataKindFlag,
		LabelFlag:        req.LabelFlag,
		SrcEventFlag:     req.SrcEventFlag,
		RelEventFlag:     req.RelEventFlag,
		SystemFlag:       req.SystemFlag,
		RelCatalogFlag:   req.RelCatalogFlag,
	}

	if len(req.GroupID) > 0 {
		catalog.GroupID = req.GroupID.Uint64()
		catalog.GroupName = req.GroupName
	}

	switch catalog.SharedType {
	case common.SHARE_TYPE_NO_CONDITION:
		catalog.SharedCondition = ""
		fallthrough
	case common.SHARE_TYPE_CONDITION:
		catalog.SharedMode = req.SharedMode
	case common.SHARE_TYPE_NOT_SHARED:
		catalog.OpenType = common.OPEN_TYPE_NOT_OPEN
	}

	if catalog.OpenType == common.OPEN_TYPE_OPEN {
		catalog.OpenCondition = req.OpenCondition
	}

	// 新建数据目录
	if req.Source == common.SOURCE_CATALOG_WEB { // 数据资源目录页面调用
		// Orgcode，Orgname已在上面赋值
		catalog.CreatorUID = uInfo.ID
		catalog.CreatorName = uInfo.Name

		//catalog.OwnerId = req.OwnerId
		//catalog.OwnerName = req.OwnerName
	} else if req.Source == common.SOURCE_ANYFABRIC { // 认知平台自动调用
		ownerId, ownerName, err := queryCatalogOwner(ctx, req.Infos, req.Orgcode)
		if err != nil {
			return nil, err
		}
		catalog.OwnerId = ownerId
		catalog.OwnerName = ownerName
	}

	tx := d.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)

	var resCnt *[3]int32
	resCnt, err = d.catalogMountResourceProc(tx, ctx, OP_TYPE_CREATE, catalog.Code, req.MountResources)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to recreate mounted catalog resource to db, err: %v", err)
		if util.IsMysqlDuplicatedErr(err) {
			panic(errorcode.Detail(errorcode.ResourceMountedConflict, "资源挂接冲突"))
		}
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	catalog.ViewCount = resCnt[common.RES_TYPE_VIEW]
	catalog.ApiCount = resCnt[common.RES_TYPE_API]

	if err = d.catalogColumnProc(tx, ctx, OP_TYPE_CREATE, catalogID,
		reqColumnsToModel(&catalog.SharedType, &catalog.OpenType, req.Columns)); err != nil {
		log.WithContext(ctx).Errorf("failed to create catalog columns to db, err: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	if err = d.calalogInfoProc(tx, ctx, OP_TYPE_CREATE, catalogID, req.Infos); err != nil {
		log.WithContext(ctx).Errorf("failed to create catalog infos to db, err: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	// 当目录编码为带/的这一种时，才执行里面的逻辑
	if codeType == 1 {
		if err = d.catalogSequenceProc(tx, ctx, req.CodePrefix, orderCode); err != nil {
			log.WithContext(ctx).Errorf("failed to update catalog sequence to db, err: %v", err)
			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
		}
	}

	if err = d.titleRepo.Insert(tx, ctx, catalog.Code, catalog.Title); err != nil {
		log.WithContext(ctx).Errorf("failed to create catalog title to db, err: %v", err)
		if util.IsMysqlDuplicatedErr(err) {
			panic(errorcode.Detail(errorcode.CatalogNameConflict, "目录名称冲突"))
		}
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	if err = d.catalogRepo.Insert(tx, ctx, catalog); err != nil {
		log.WithContext(ctx).Errorf("failed to create catalog to db, err: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	return catalog, nil
}*/

/*func (d *DataCatalogDomain) Update(ctx context.Context, catalogID uint64, req *UpdateReqBodyParams) (resp *response.NameIDResp2, err error) {
	_, err = updateProc(d, ctx, catalogID, req)
	if err != nil {
		return nil, err
	}
	return &response.NameIDResp2{ID: fmt.Sprint(catalogID)}, nil
}

func updateProc(d *DataCatalogDomain, ctx context.Context, catalogID uint64, req *UpdateReqBodyParams) (catalog *model.TDataCatalog, err error) {
	var bRet bool
	uInfo := request.GetUserInfo(ctx)
	// 数据资源目录页面调用
	if req.Source == common.SOURCE_CATALOG_WEB {
		tmpArr, err := common.GetUserNameByUserIDs(ctx, []string{req.OwnerId})
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		if len(tmpArr) == 0 {
			return nil, errorcode.Desc(errorcode.OwnerIDInvalidErr)
		}
		// ownerInfo, err := common.GetOwnerRoleUsersContains(ctx, req.Orgcode, req.OwnerId)
		// if err != nil {
		// 	return nil, err
		// }

		// if ownerInfo == nil {
		// 	return nil, errorcode.Detail(errorcode.OwnerIDNotInDepartmentErr, err)
		// }
	}

	//var orgCodes []string
	//if req.Source == common.SOURCE_ANYFABRIC { // 认知平台
	//	orgCodes, err = d.getAllOrgCodesBySingleOrgCode(ctx, req.Orgcode)
	//} else if req.Source == common.SOURCE_CATALOG_WEB { // 数据资源目录页面调用
	//	_, orgCodes, err = d.getUserAllUnionOrgCodes(ctx, uInfo)
	//}
	//
	//if err != nil {
	//	log.WithContext(ctx).Errorf("failed to request sub node of org, err: %v", err)
	//	return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	//}
	//
	//// 暂时获取不到部门信息，不做部门权限判断
	//if len(orgCodes) == 0 {
	//	return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//}

	tx := d.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)

	//catalog, err = d.catalogRepo.GetDetail(tx, ctx, catalogID, orgCodes)
	catalog, err = d.catalogRepo.GetDetail(tx, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog from db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			panic(errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在"))
		} else {
			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
		}
	}

	//if req.Source == common.SOURCE_ANYFABRIC { // 认知平台
	//	if req.Orgcode != catalog.Orgcode {
	//		log.WithContext(ctx).Errorf("user (uid: %v name: %v) has no authorization to update catalog: %v, err: %v", uInfo.Uid, uInfo.UserName, catalogID, err)
	//		return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//	}
	//} else if req.Source == common.SOURCE_CATALOG_WEB { // 数据资源目录页面调用
	//	if _, exist := common.UserOrgContainsCatalogOrg(uInfo, catalog.Orgcode); !exist {
	//		// 请求的目录的部门编码不存在用户所属的所有部门编码中
	//		return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//	}
	//}

	if !((catalog.State == common.CATALOG_STATUS_DRAFT &&
		((catalog.FlowType == nil && catalog.AuditState == nil) ||
			(catalog.FlowType != nil && catalog.AuditState != nil &&
				*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT))) ||
		(catalog.State == common.CATALOG_STATUS_OFFLINE && catalog.FlowType != nil && catalog.AuditState != nil &&
			((*catalog.FlowType == common.AUDIT_FLOW_TYPE_OFFLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
				(*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)))) {
		log.WithContext(ctx).Errorf("catalog: %v edit not allowed, err: %v", catalogID, err)
		panic(errorcode.Detail(errorcode.PublicResourceEditNotAllowedError, "当前资源不允许编目"))
	}

	oldTitle := catalog.Title
	catalog.Title = req.Title
	catalog.ThemeID = req.ThemeID
	catalog.ThemeName = req.ThemeName
	catalog.Description = req.Description
	catalog.DataRange = req.DataRange
	catalog.UpdateCycle = req.UpdateCycle
	catalog.DataKind = req.DataKind
	catalog.SharedType = req.SharedType
	catalog.SharedCondition = req.SharedCondition
	catalog.OpenType = req.OpenType
	catalog.PhysicalDeletion = req.PhysicalDeletion
	catalog.SyncFrequency = req.SyncFrequency
	catalog.SyncMechanism = req.SyncMechanism
	catalog.UpdatedAt = &util.Time{time.Now()}
	catalog.UpdaterUID = uInfo.ID
	catalog.UpdaterName = uInfo.Name
	catalog.PublishFlag = req.PublishFlag
	catalog.DataKindFlag = req.DataKindFlag
	catalog.LabelFlag = req.LabelFlag
	catalog.SrcEventFlag = req.SrcEventFlag
	catalog.RelEventFlag = req.RelEventFlag
	catalog.SystemFlag = req.SystemFlag
	catalog.RelCatalogFlag = req.RelCatalogFlag
	// 部门可修改
	catalog.Orgcode = req.Orgcode
	catalog.Orgname = req.Orgname

	// 编辑目录数据，数据owner赋值
	if req.Source == common.SOURCE_CATALOG_WEB { // 数据资源目录页面调用
		catalog.OwnerId = req.OwnerId
		catalog.OwnerName = req.OwnerName
	} else if req.Source == common.SOURCE_ANYFABRIC { // 认知平台自动调用
		// catalog.OwnerId为空，则需要关联数据OWNER;不为空，则保持原值
		if catalog.OwnerId == "" {
			ownerId, ownerName, err := queryCatalogOwner(ctx, req.Infos, req.Orgcode)
			if err != nil {
				return nil, err
			}
			catalog.OwnerId = ownerId
			catalog.OwnerName = ownerName
		}
	}

	if len(req.GroupID) > 0 {
		catalog.GroupID = req.GroupID.Uint64()
		catalog.GroupName = req.GroupName
	} else {
		catalog.GroupID = 0
		catalog.GroupName = ""
	}

	switch catalog.SharedType {
	case common.SHARE_TYPE_NO_CONDITION:
		catalog.SharedCondition = ""
		fallthrough
	case common.SHARE_TYPE_CONDITION:
		catalog.SharedMode = req.SharedMode
	case common.SHARE_TYPE_NOT_SHARED:
		catalog.SharedMode = 0
		catalog.OpenType = common.OPEN_TYPE_NOT_OPEN
	}

	if catalog.OpenType == common.OPEN_TYPE_OPEN {
		catalog.OpenCondition = req.OpenCondition
	} else {
		catalog.OpenCondition = ""
	}

	if err = d.catalogColumnProc(tx, ctx, OP_TYPE_UPDATE, catalogID,
		reqColumnsToModel(&catalog.SharedType, &catalog.OpenType, req.Columns)); err != nil {
		log.WithContext(ctx).Errorf("failed to recreate catalog columns to db, err: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	} else {
		// 清redis缓存，这里可能对信息项（数据表字段）的数据类型，涉密和敏感属性作了修改，这时会更改脱敏的行为，缓存的样例数据脱敏就会失效，故要清空此条目录的缓存
		redisKey := common.GetCacheRedisKey(fmt.Sprint(catalogID))
		// 忽略清空缓存失败
		d.sampleCache.DeleteCacheWithKey(ctx, redisKey)
	}

	if err = d.calalogInfoProc(tx, ctx, OP_TYPE_UPDATE, catalogID, req.Infos); err != nil {
		log.WithContext(ctx).Errorf("failed to recreate catalog infos to db, err: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	if bRet, err = d.catalogRepo.Update(tx, ctx, catalog); err != nil {
		log.WithContext(ctx).Errorf("failed to update catalog (id: %v) to db, err: %v", catalogID, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	if !bRet {
		log.WithContext(ctx).Errorf("failed to update catalog (id: %v) to db, err: resource not exists", catalogID)
		panic(errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在"))
	}

	d.catalogTitleUpdateProc(tx, ctx, catalog.Code, oldTitle, req.Title)
	return catalog, nil
}*/
/*
func (d *DataCatalogDomain) Delete(ctx context.Context, catalogID uint64) (resp *response.NameIDResp2, err error) {
	_, err = deleteProc(d, ctx, catalogID)
	if err != nil {
		return nil, err
	}
	return &response.NameIDResp2{ID: fmt.Sprint(catalogID)}, nil
}

func deleteProc(d *DataCatalogDomain, ctx context.Context, catalogID uint64) (catalog *model.TDataCatalog, err error) {
	var (
		bRet bool
	)
	uInfo := request.GetUserInfo(ctx)

	//userOrgCodes, orgCodes, err := d.getUserAllUnionOrgCodes(ctx, uInfo)
	//if err != nil {
	//	log.WithContext(ctx).Errorf("failed to request sub node of org (userOrgCode: %v), err: %v", userOrgCodes, err)
	//	return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	//}

	//// 暂时获取不到部门信息，不做部门权限判断
	//if len(orgCodes) == 0 {
	//	return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//}

	tx := d.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)

	//catalog, err = d.catalogRepo.GetDetail(tx, ctx, catalogID, orgCodes)
	catalog, err = d.catalogRepo.GetDetail(tx, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog from db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			panic(errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在"))
		} else {
			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
		}
	}

	//if _, exist := common.UserOrgContainsCatalogOrg(uInfo, catalog.Orgcode); !exist {
	//	// 目录的部门编码不存在用户所属的所有部门编码中
	//	log.WithContext(ctx).Errorf("user (uid: %v name: %v) has no authorization to delete catalog: %v, err: %v", uInfo.Uid, uInfo.UserName, catalogID, err)
	//	panic(errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限"))
	//}

	if !(catalog.State == common.CATALOG_STATUS_DRAFT &&
		((catalog.FlowType == nil && catalog.AuditState == nil) ||
			(catalog.FlowType != nil && catalog.AuditState != nil &&
				*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT))) {
		log.WithContext(ctx).Errorf("catalog: %v edit not allowed, err: %v", catalogID, err)
		panic(errorcode.Detail(errorcode.PublicResourceDelNotAllowedError, "当前资源不允许删除"))
	}

	if bRet, err = d.catalogRepo.DeleteIntoHistory(tx, ctx, catalogID, uInfo); bRet && err == nil {
		if err = d.resRepo.DeleteIntoHistory(tx, ctx, catalog.Code); err == nil {
			if bRet, err = d.colRepo.DeleteIntoHistory(tx, ctx, catalogID); bRet && err == nil {
				if _, err = d.infoRepo.DeleteIntoHistory(tx, ctx, catalogID); err == nil {
					err = d.titleRepo.Delete(tx, ctx, catalog.Code, catalog.Title)
				}
			}
		}
	}

	if err != nil {
		log.WithContext(ctx).Errorf("failed delete catalog: %v, error: %v", catalogID, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	} else if err == nil && !bRet {
		log.WithContext(ctx).Errorf("catalog: %v not existed", catalogID)
		panic(errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在"))
	}
	return catalog, nil
}*/

func (d *DataCatalogDomain) GetBriefList(ctx context.Context, catalogIdStr string, isComprehension bool) (datas []*catalog.ComprehensionCatalogListItem, err error) {
	catalogIdStrs := strings.Split(catalogIdStr, ",")
	ids := make([]uint64, 0)
	for _, idStr := range catalogIdStrs {
		id, _ := strconv.ParseUint(idStr, 10, 64)
		if id > 0 {
			ids = append(ids, id)
		}
	}
	tx := d.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)
	datas, err = d.catalogRepo.GetDetailWithComprehensionByIds(tx, ctx, ids...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	return datas, nil
}

/*
func (d *DataCatalogDomain) GetList(ctx context.Context, req *ReqFormParams) ([]*CatalogListItem, int64, error) {
	var retData []*CatalogListItem
	uInfo := request.GetUserInfo(ctx)

	var categoryIDs, orgCodes, businessDomainIDs []string
	var err error
	if req.CategoryID != "" {
		categoryIDs, err = common.GetSubNodeByCategoryID(ctx, req.CategoryID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to request sub node of category (id: %v), err: %v", req.CategoryID, err)
			return nil, 0, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}

		if len(categoryIDs) == 0 {
			return nil, 0, errorcode.Detail(errorcode.PublicInternalError, "资源目录分类ID不存在")
		}
	}
	comprehensionStates := make([]int8, 0)
	if req.ComprehensionStatus != "" {
		cs := strings.Split(req.ComprehensionStatus, ",")
		for _, s := range cs {
			si, _ := strconv.Atoi(s)
			if si > 0 {
				comprehensionStates = append(comprehensionStates, int8(si))
			}
		}
	}
	catalogIds := make([]uint64, 0)
	if req.TaskId != "" {
		ids, err1 := common.QueryRelationIds(ctx, req.TaskId)
		if err1 != nil {
			return nil, 0, errorcode.Detail(errorcode.PublicInternalError, err1.Error())
		}
		for _, s := range ids {
			si, _ := strconv.ParseUint(s, 10, 64)
			if si > 0 {
				catalogIds = append(catalogIds, si)
			}
		}
		if len(catalogIds) <= 0 {
			return []*CatalogListItem{}, 0, nil
		}
	}

	if req.BusinessDomainID != "" {
		businessDomainIDs, err = common.GetAllSubNodesByID(ctx, req.BusinessDomainID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to request sub node of business domain (id: %v), err: %v", req.BusinessDomainID, err)
			return nil, 0, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}

		if len(businessDomainIDs) == 0 {
			return nil, 0, errorcode.Detail(errorcode.PublicInternalError, "业务对象ID不存在")
		}
	}

	if req.OrgCode != "" {
		var subOrgCodesResp *configuration_center.GetSubOrgCodesResp
		subOrgCodesResp, err = d.cfgRepo.GetSubOrgCodes(ctx, &configuration_center.GetSubOrgCodesReq{OrgCode: req.OrgCode})
		if err != nil {
			return nil, 0, err
		}
		orgCodes = append(subOrgCodesResp.Codes, req.OrgCode)
	}

	datas, totalCount := make([]*catalog.ComprehensionCatalogListItem, 0), int64(0)
	if req.ComprehensionStatus != "" {
		datas, totalCount, err = d.catalogRepo.GetComprehensionCatalogList(nil, ctx, req.PageInfo.ToReqPageInfo(), comprehensionStates, catalogIds, &req.CatalogListReqBase, orgCodes, categoryIDs, businessDomainIDs, lo.Map(req.ExcludeIds, func(item models.ModelID, _ int) uint64 { return item.Uint64() }))
	} else {
		datas, totalCount, err = d.catalogRepo.GetList(nil, ctx, req.PageInfo.ToReqPageInfo(), catalogIds, &req.CatalogListReqBase, orgCodes, categoryIDs, businessDomainIDs, lo.Map(req.ExcludeIds, func(item models.ModelID, _ int) uint64 { return item.Uint64() }))
	}
	//需要路径列表才加，否则不加
	if req.NeedOrgPaths {
		orgCodeList := make([]string, 0, len(datas))
		for _, d := range datas {
			orgCodeList = append(orgCodeList, d.DepartmentID)
		}
		objInfoMap, err := common.GetObjectsInfoByIds(ctx, orgCodeList)
		if err != nil {
			log.WithContext(ctx).Errorf(err.Error())
		} else {
			for _, d := range datas {
				obj, ok := objInfoMap[d.DepartmentID]
				if ok {
					d.OrgPaths = strings.Split(obj.Path, "/")
				}
			}
		}
	}

	if err == nil && len(datas) > 0 {
		retData = make([]*CatalogListItem, len(datas))
		var (
			val            []int
			isExisted      bool
			catalogIDS     = make([]uint64, len(datas))
			tmpMap         = make(map[uint64]int, len(datas))
			orgcode2IdxMap = map[string][]int{}
			orgcodes       = make([]string, 0, len(datas))
		)

		for i := range datas {
			retData[i] = &CatalogListItem{
				ID:           datas[i].ID,
				Code:         datas[i].Code,
				Title:        datas[i].Title,
				Version:      datas[i].Version,
				Description:  datas[i].Description,
				DataKind:     datas[i].DataKind,
				State:        datas[i].State,
				FlowNodeID:   datas[i].FlowNodeID,
				FlowNodeName: datas[i].FlowNodeName,
				FlowType:     datas[i].FlowType,
				FlowID:       datas[i].FlowID,
				FlowName:     datas[i].FlowName,
				FlowVersion:  datas[i].FlowVersion,
				Orgcode:      datas[i].DepartmentID,
				Orgname:      datas[i].Orgname,
				OrgPaths:     datas[i].OrgPaths,
				ViewCount:    datas[i].ViewCount,
				ApiCount:     datas[i].ApiCount,
				CreatedAt:    datas[i].CreatedAt.UnixMilli(),
				UpdatedAt:    datas[i].UpdatedAt.UnixMilli(),
				TableType:    datas[i].TableType,
				Source:       datas[i].Source,
				Operations:   genOperationsByUserInfo(datas[i], uInfo),
				Labels:       make([]*InfoBase, 0),
				OwnerId:      datas[i].OwnerId,
				OwnerName:    datas[i].OwnerName,
				AuditState:   datas[i].AuditState,
				CreatorUID:   datas[i].CreatorUID,
				//CreatorName:  datas[i].CreatorName, todo
			}

			catalogIDS[i] = datas[i].ID
			// key为数据目录的ID，i为列表的索引下标
			tmpMap[datas[i].ID] = i

			if val, isExisted = orgcode2IdxMap[datas[i].DepartmentID]; isExisted {
				val = append(val, i)
			} else {
				val = []int{i}
				orgcodes = append(orgcodes, datas[i].DepartmentID)
			}
			orgcode2IdxMap[datas[i].DepartmentID] = val
		}

		if len(orgcodes) > 0 {
			var deptInfos []*common.DeptEntryInfo
			if deptInfos, err = common.GetDepartmentInfoByDeptIDs(ctx, strings.Join(orgcodes, ",")); err != nil {
				return nil, 0, err
			}
			for j := range deptInfos {
				for k := range orgcode2IdxMap[deptInfos[j].ID] {
					retData[orgcode2IdxMap[deptInfos[j].ID][k]].Orgname = deptInfos[j].Name
				}
			}
			deptInfos = nil
			val = nil
			orgcodes = nil
			orgcode2IdxMap = nil
		}

		var infos []*model.TDataCatalogInfo
		// 返回列表的索引下标对应主题对象id数组的map（一个下标对应一个数据目录，一个数据目录对应多个主题对象）
		idx2businessObjectIDsMap := make(map[int][]string, len(datas))
		// 需要返回标签和主题对象类型
		if infos, err = d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_LABEL, common.INFO_TYPE_BUSINESS_DOMAIN}, catalogIDS); err == nil {
			var idx int
			for i := range infos {
				// tmpMap中key为数据目录的ID，值为返回列表的索引下标
				idx = tmpMap[infos[i].CatalogID]
				if infos[i].InfoType == common.INFO_TYPE_LABEL {
					retData[idx].Labels = append(
						retData[idx].Labels,
						&InfoBase{
							InfoKey:   infos[i].InfoKey,
							InfoValue: infos[i].InfoValue})
				} else if infos[i].InfoType == common.INFO_TYPE_BUSINESS_DOMAIN {
					idx2businessObjectIDsMap[idx] = append(idx2businessObjectIDsMap[idx], infos[i].InfoKey)
				}
			}
		} else {
			log.WithContext(ctx).Errorf("failed to get infos for catalog list from db, err: %v", err)
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		//需要业务对象路径列表才加，否则不加
		if req.NeedBusinessObjectPaths {
			// id去重
			allBusinessObjectIDs := lo.Uniq[string](lo.Flatten(lo.Values(idx2businessObjectIDsMap)))

			// 如果没有关联的主题对象就不去请求了，否则三方接口会报错
			if len(allBusinessObjectIDs) > 0 {
				// 这里使用多线程去请求三方业务对象路径列表接口
				allBusinessObjectPaths, err := GetConcurrencySubjectObjects(ctx, allBusinessObjectIDs)
				if err != nil {
					log.WithContext(ctx).Errorf("get all subject object path for allBusinessObjectIDs: %v failed, err: %v", allBusinessObjectIDs, err)
					return nil, 0, errorcode.Detail(errorcode.PublicInternalError, err.Error())
				}

				// 主题对象id对应主题对象Map
				businessObjectID2BusinessObjectMap := make(map[string]*common.BOPathItem, len(allBusinessObjectIDs))
				for i := range allBusinessObjectPaths {
					businessObjectPath := allBusinessObjectPaths[i]
					businessObjectID2BusinessObjectMap[businessObjectPath.ObjectID] = businessObjectPath
				}

				lo.ForEach[int](lo.Keys(idx2businessObjectIDsMap), func(idx int, _ int) {
					businessObjectIDs := idx2businessObjectIDsMap[idx]
					lo.ForEach[string](businessObjectIDs, func(businessObjectID string, _ int) {
						pathItem := businessObjectID2BusinessObjectMap[businessObjectID]
						// 这里因为主题对象被删除，会导致传入的部分主题对象id无法对应返回主题对象，需要判断nil
						if pathItem != nil {
							retData[idx].BusinessObjectPath = append(retData[idx].BusinessObjectPath, pathItem)
						}
					})
				})
			}

		}
	} else if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog list from db, err: %v", err)
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return retData, totalCount, nil
}*/

/*func (d *DataCatalogDomain) GetDetail(ctx context.Context, catalogID uint64) (*CatalogDetailResp, error) {
	//uInfo := request.GetUserInfo(ctx)

	//userOrgCodes, orgCodes, err := d.getUserAllUnionOrgCodes(ctx, uInfo)
	//if err != nil {
	//	log.WithContext(ctx).Errorf("failed to request sub node of org (userOrgCode: %v), err: %v", userOrgCodes, err)
	//	return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	//}

	var (
		infoData          []*model.TDataCatalogInfo
		resData           []*model.TDataCatalogResourceMount
		colData           []*model.TDataCatalogColumn
		businessObjectIDs []string
	)

	//// 暂时获取不到部门信息，不做部门权限判断
	//if len(orgCodes) == 0 {
	//	return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源查看权限")
	//}

	catalog, err := d.catalogRepo.GetDetail(nil, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	//for i := range orgCodes {
	//	if orgCodes[i] == catalog.Orgcode {
	//		break
	//	} else if i == len(orgCodes)-1 {
	//		log.WithContext(ctx).Errorf("user_id: %s user_name: %s has no authorization to get the detail of catalog: %d, err: %v",
	//			uInfo.Uid, uInfo.UserName, catalogID, err)
	//		return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//	}
	//}

	if infoData, err = d.infoRepo.Get(nil, ctx, nil, []uint64{catalogID}); err == nil {
		if resData, err = d.resRepo.Get(nil, ctx, catalog.Code, 0); err == nil {
			colData, err = d.colRepo.Get(nil, ctx, catalogID)
		}
	}

	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v related info failed, err: %v", catalogID, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	categoryPaths := make([]*common.TreeBase, 0)
	if catalog.GroupID > 0 {
		categoryPaths, err = common.GetCategoryPath(ctx, strconv.FormatUint(catalog.GroupID, 10))
		if err != nil {
			log.WithContext(ctx).Errorf("failed to request tree node of category, err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}

		if len(categoryPaths) > 0 {
			catalog.GroupName = categoryPaths[len(categoryPaths)-1].Name
		}
	}

	retData := &CatalogDetailResp{
		ID:               catalog.ID,
		Code:             catalog.Code,
		Title:            catalog.Title,
		GroupID:          catalog.GroupID,
		GroupName:        catalog.GroupName,
		ThemeID:          catalog.ThemeID,
		ThemeName:        catalog.ThemeName,
		ForwardVersionID: catalog.ForwardVersionID,
		Description:      catalog.Description,
		Version:          catalog.Version,
		DataRange:        catalog.DataRange,
		UpdateCycle:      catalog.UpdateCycle,
		DataKind:         catalog.DataKind,
		SharedType:       catalog.SharedType,
		SharedCondition:  catalog.SharedCondition,
		OpenType:         catalog.OpenType,
		OpenCondition:    catalog.OpenCondition,
		SharedMode:       catalog.SharedMode,
		PhysicalDeletion: catalog.PhysicalDeletion,
		SyncMechanism:    catalog.SyncMechanism,
		SyncFrequency:    catalog.SyncFrequency,
		ViewCount:        catalog.ViewCount,
		ApiCount:         catalog.ApiCount,
		State:            catalog.State,
		FlowNodeID:       catalog.FlowNodeID,
		FlowNodeName:     catalog.FlowNodeName,
		FlowType:         catalog.FlowType,
		FlowID:           catalog.FlowID,
		FlowName:         catalog.FlowName,
		FlowVersion:      catalog.FlowVersion,
		Orgcode:          catalog.Orgcode,
		Orgname:          catalog.Orgname,
		CreatedAt:        catalog.CreatedAt.UnixMilli(),
		CreatorUID:       catalog.CreatorUID,
		CreatorName:      catalog.CreatorName,
		UpdatedAt:        catalog.UpdatedAt.UnixMilli(),
		UpdaterUID:       catalog.UpdaterUID,
		UpdaterName:      catalog.UpdaterName,
		DeletedAt:        0,
		DeleteUID:        catalog.DeleteUID,
		DeleteName:       catalog.DeleteName,
		Source:           catalog.Source,
		TableType:        catalog.TableType,
		CurrentVersion:   catalog.CurrentVersion,
		PublishFlag:      catalog.PublishFlag,
		DataKindFlag:     catalog.DataKindFlag,
		LabelFlag:        catalog.LabelFlag,
		SrcEventFlag:     catalog.SrcEventFlag,
		RelEventFlag:     catalog.RelEventFlag,
		SystemFlag:       catalog.SystemFlag,
		RelCatalogFlag:   catalog.RelCatalogFlag,
		PublishedAt:      0,
		IsIndexed:        catalog.IsIndexed,
		GroupPath:        categoryPaths,
		AuditAdvice:      catalog.AuditAdvice,
		AuditState:       catalog.AuditState,
		Infos:            make([]*InfoItem, 0),
		MountResources:   make([]*MountResourceItem, 0),
		Columns:          colData,
		OwnerId:          catalog.OwnerId,
		OwnerName:        catalog.OwnerName,
	}

	var deptInfos []*common.DeptEntryInfo
	if deptInfos, err = common.GetDepartmentInfoByDeptIDs(ctx, retData.Orgcode); err != nil {
		return nil, err
	}
	if len(deptInfos) > 0 {
		retData.Orgname = deptInfos[0].Name
	}

	if catalog.DeletedAt != nil {
		retData.DeletedAt = catalog.DeletedAt.UnixMilli()
	}

	if catalog.PublishedAt != nil {
		retData.PublishedAt = catalog.PublishedAt.UnixMilli()
	}

	var info *InfoItem
	var preType int8
	for i := range infoData {
		if info == nil || infoData[i].InfoType != preType {
			preType = infoData[i].InfoType
			if info != nil {
				retData.Infos = append(retData.Infos, info)
			}
			entry := &InfoBase{
				InfoKey:   infoData[i].InfoKey,
				InfoValue: infoData[i].InfoValue,
			}
			info = &InfoItem{
				InfoType: infoData[i].InfoType,
				Entries:  []*InfoBase{entry},
			}
		} else {
			info.Entries = append(info.Entries,
				&InfoBase{
					InfoKey:   infoData[i].InfoKey,
					InfoValue: infoData[i].InfoValue,
				})
		}

		if infoData[i].InfoType == common.INFO_TYPE_BUSINESS_DOMAIN {
			businessObjectIDs = append(businessObjectIDs, infoData[i].InfoKey)
		}

		if i == len(infoData)-1 {
			retData.Infos = append(retData.Infos, info)
		}
	}

	if len(businessObjectIDs) > 0 {
		retData.BusinessObjectPath, err = common.GetPathByBusinessDomainID(ctx, businessObjectIDs)
		if err != nil {
			log.WithContext(ctx).Errorf("get business object path for catalog: %v failed, err: %v", catalogID, err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
	}

	preType = 0
	var res *MountResourceItem
	for i := range resData {
		if res == nil || resData[i].ResType != preType {
			preType = resData[i].ResType
			if res != nil {
				retData.MountResources = append(retData.MountResources, res)
			}
			entry := &MountResourceBase{
				ResourceID:   resData[i].ResID,
				ResourceName: resData[i].ResName,
			}
			res = &MountResourceItem{
				ResourceType: resData[i].ResType,
				Entries:      []*MountResourceBase{entry},
			}
		} else {
			res.Entries = append(res.Entries,
				&MountResourceBase{
					ResourceID:   resData[i].ResID,
					ResourceName: resData[i].ResName,
				})
		}

		//if resData[i].ResType == common.RES_TYPE_TABLE {
		//	retData.FormViewID = resData[i].ResIDStr
		//}

		if i == len(resData)-1 {
			retData.MountResources = append(retData.MountResources, res)
		}
	}
	return retData, nil
}*/

func (d *DataCatalogDomain) GetCatalogColumnList(ctx context.Context, catalogID uint64, req *ReqColumnFormParams) ([]*model.TDataCatalogColumn, int64, error) {
	//uInfo := request.GetUserInfo(ctx)
	//userOrgCodes, orgCodes, err := d.getUserAllUnionOrgCodes(ctx, uInfo)
	//if err != nil {
	//	log.WithContext(ctx).Errorf("failed to request sub node of org (userOrgCode: %v), err: %v", userOrgCodes, err)
	//	return nil, 0, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	//}

	//// 暂时获取不到部门信息，不做部门权限判断
	//if len(orgCodes) == 0 {
	//	return nil, 0, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源查看权限")
	//}

	//var catalog *model.TDataCatalog
	//if catalog, err = d.catalogRepo.GetDetail(nil, ctx, catalogID, nil); err != nil {
	if _, err := d.catalogRepo.GetDetail(nil, ctx, catalogID, nil); err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	//for i := range orgCodes {
	//	if orgCodes[i] == catalog.Orgcode {
	//		break
	//	} else if i == len(orgCodes)-1 {
	//		log.WithContext(ctx).Errorf("user_id: %s user_name: %s has no authorization to get the column list of catalog: %d, err: %v",
	//			uInfo.Uid, uInfo.UserName, catalogID, err)
	//		return nil, 0, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//	}
	//}

	return d.colRepo.GetList(nil, ctx, catalogID, req.Keyword, &req.PageInfo.ToReqPageInfo().PageBaseInfo)
}

func (d *DataCatalogDomain) CheckDataCatalogNameRepeat(ctx context.Context, req *request.VerifyNameRepeatReq) (bool, error) {
	bRet, err := d.catalogRepo.TitleValidCheck(nil, ctx, req.Code, req.Name)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get check whether catalog name existed in db, err: %v", err)
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return bRet, nil
}

func (d *DataCatalogDomain) CheckResourceMount(ctx context.Context, req *VerifyResourceMountReq) (*VerifyResourceMountResp, error) {
	var err error
	ids := strings.Split(req.ResourceIDs, ",")

	var results []*model.TDataCatalogResourceMount
	results, err = d.resRepo.GetExistedResource(nil, ctx, req.ResourceType, ids)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get mounted resource ids from db, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	ret := &VerifyResourceMountResp{
		MountedResIDs: make([]string, 0, len(results)),
		AttachedInfos: make([]*VerifyResourceMountAttachedInfo, 0, len(results)),
	}

	code2IdxMap := map[string]int{}
	codes := make([]string, len(results))
	for i := range results {
		ret.MountedResIDs = append(ret.MountedResIDs, results[i].ResID)
		ret.AttachedInfos = append(ret.AttachedInfos,
			&VerifyResourceMountAttachedInfo{
				ID:   strconv.FormatUint(results[i].CatalogID, 10),
				Code: results[i].Code},
		)
		codes[i] = results[i].Code
		code2IdxMap[codes[i]] = i
	}

	if len(codes) > 0 {
		var catalogs []*model.TDataCatalog
		if catalogs, err = d.catalogRepo.GetCatalogIDByCode(nil, ctx, codes); err != nil {
			log.WithContext(ctx).Errorf("failed to get catalog ids by codes from db, err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		for i := range catalogs {
			idx := code2IdxMap[catalogs[i].Code]
			ret.AttachedInfos[idx].ID = fmt.Sprint(catalogs[i].ID)
		}
	}

	return ret, nil
}

func (d *DataCatalogDomain) genCatalogSerialCode(ctx context.Context, codePrefix string) (int32, error) {
	var sn int64
	codeKey := codeKeyPrefix + codePrefix
loop:
	ret, err := d.redisClient.Exists(ctx, codeKeyPrefix+codePrefix)
	if err == nil {
		if ret > 0 {
			sn, err = d.redisClient.Incr(ctx, codeKey)
		} else {
			if sn, err = d.cacheLoader(ctx, codeKey); err == nil && sn == 0 {
				goto loop
			}
		}
	}

	if err != nil {
		return 0, err
	}

	return int32(sn), nil
}

func (d *DataCatalogDomain) cacheLoader(ctx context.Context, codeKey string) (int64, error) {
	if !d.redisson.TryLock(codeKeyPrefix[len(codeKeyPrefix):]) {
		time.Sleep(5 * time.Millisecond)
		return 0, nil
	}
	defer d.redisson.Unlock(codeKeyPrefix[len(codeKeyPrefix):])
	orderCode := int32(0)

	seq, err := d.seqRepo.Get(nil, ctx, codeKeyPrefix[len(codeKeyPrefix):])
	if err == nil {
		if seq != nil {
			orderCode = seq.OrderCode + 1
		}
		err = d.redisClient.Set(ctx, codeKey, orderCode)
	}

	return int64(orderCode), err
}

func (d *DataCatalogDomain) catalogSequenceProc(tx *gorm.DB, ctx context.Context, codePrefix string, orderCode int32) error {
	timeNow := &util.Time{time.Now()}
	seq, err := d.seqRepo.Get(nil, ctx, codePrefix)
	if err == nil && seq == nil {
		err = d.seqRepo.Insert(nil, ctx,
			&model.TCatalogCodeSequence{
				CodePrefix: codePrefix,
				OrderCode:  orderCode,
				CreatedAt:  timeNow})
	} else if err == nil && seq != nil {
		seq.OrderCode = orderCode
		seq.UpdatedAt = timeNow
		_, err = d.seqRepo.Update(nil, ctx, seq)
	}

	return err
}

func (d *DataCatalogDomain) catalogTitleUpdateProc(tx *gorm.DB, ctx context.Context, code, oldTitle, newTitle string) {
	if oldTitle == newTitle {
		return
	}

	list, err := d.titleRepo.GetByCode(tx, ctx, code)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog (code: %v) title list from db, err: %v", code, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	isExisted := false
	for i := range list {
		if list[i].Title == newTitle {
			isExisted = true
			break
		}
	}

	if err = d.titleRepo.Delete(tx, ctx, code, oldTitle); err != nil {
		log.WithContext(ctx).Errorf("failed to delete catalog (code: %v) old title %v from db, err: %v", code, oldTitle, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}

	if !isExisted {
		if err = d.titleRepo.Insert(tx, ctx, code, newTitle); err != nil {
			log.WithContext(ctx).Errorf("failed to update catalog (code: %v) title to %v, err: %v", code, newTitle, err)
			if util.IsMysqlDuplicatedErr(err) {
				panic(errorcode.Detail(errorcode.CatalogNameConflict, "目录名称冲突"))
			}
			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
		}
	}
}

func (d *DataCatalogDomain) calalogInfoProc(tx *gorm.DB, ctx context.Context, opType int, catalogID uint64, infos []*InfoItem) error {
	var err error
	if opType == OP_TYPE_UPDATE {
		_, err = d.infoRepo.DeleteBatch(tx, ctx, catalogID, nil)
		if err != nil {
			return err
		}
	}
	infoArr := make([]*model.TDataCatalogInfo, 0)
	for i := range infos {
		for j := range infos[i].Entries {
			tmp := new(model.TDataCatalogInfo)
			tmp.InfoType = infos[i].InfoType
			tmp.CatalogID = catalogID
			tmp.InfoKey = infos[i].Entries[j].InfoKey
			tmp.InfoValue = infos[i].Entries[j].InfoValue
			infoArr = append(infoArr, tmp)
		}
	}
	if len(infoArr) > 0 {
		err = d.infoRepo.InsertBatch(tx, ctx, infoArr)
	}
	return err
}

func (d *DataCatalogDomain) catalogMountResourceProc(tx *gorm.DB, ctx context.Context, opType int, code string, res []*MountResourceItem) (*[3]int32, error) {
	var err error
	if opType == OP_TYPE_UPDATE {
		_, err = d.resRepo.DeleteBatch(tx, ctx, code, nil)
		if err != nil {
			return nil, err
		}
	}
	resCnt := [3]int32{0}
	resArr := make([]*model.TDataCatalogResourceMount, 0)
	for i := range res {
		resCnt[res[i].ResourceType] = int32(len(res[i].Entries))
		for j := range res[i].Entries {
			tmp := new(model.TDataCatalogResourceMount)
			tmp.ResType = res[i].ResourceType
			tmp.Code = code
			tmp.ResID = res[i].Entries[j].ResourceID
			tmp.ResName = res[i].Entries[j].ResourceName
			resArr = append(resArr, tmp)
		}
	}
	if len(resArr) > 0 {
		err = d.resRepo.InsertBatch(tx, ctx, resArr)
	}
	return &resCnt, err
}

func (d *DataCatalogDomain) catalogColumnProc(tx *gorm.DB, ctx context.Context, opType int, catalogID uint64, columns []*model.TDataCatalogColumn) error {
	var err error
	insertedColumns := make([]*model.TDataCatalogColumn, 0)
	updatedColumns := make([]*model.TDataCatalogColumn, 0)
	excludeIDs := make([]uint64, 0)
	for i := range columns {
		if columns[i].ID > 0 {
			if columns[i].CatalogID != catalogID {
				err = errors.Errorf("columns[%d].catalog_id与实际目录ID不符", i)
				log.WithContext(ctx).Errorf("catalog column updated failed, err: %v", err)
				return errorcode.Detail(errorcode.PublicInvalidParameter, err)
			}
			updatedColumns = append(updatedColumns, columns[i])
			excludeIDs = append(excludeIDs, columns[i].ID)
			continue
		}
		columns[i].CatalogID = catalogID
		insertedColumns = append(insertedColumns, columns[i])
	}

	if opType == OP_TYPE_UPDATE {
		_, err = d.colRepo.DeleteBatch(tx, ctx, catalogID, excludeIDs)
	}

	if err == nil {
		if len(insertedColumns) > 0 {
			err = d.colRepo.InsertBatch(tx, ctx, insertedColumns)
		}

		if err == nil && len(updatedColumns) > 0 {
			_, err = d.colRepo.UpdateBatch(tx, ctx, updatedColumns)
		}
	}

	return err
}

/*
func genOperationsByUserInfo(catalog *catalog.ComprehensionCatalogListItem, userInfo *middleware.User) int32 {
	operation := int32(0)
	// TO DO
	// 根据用户信息权限构建目录列表查询条件
	// if _, exist := common.UserOrgContainsCatalogOrg(userInfo, catalog.Orgcode); exist {
	// operation 可做的操作：1 编目；2 删除；4 生成接口；8 发布；16 上线；32 变更；64 下线；允许多个操作则进行或运算得到的结果即可
	operation = 4
	if catalog.AuditState != nil && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_UNDER_REVIEW {
		// 审核状态为审核中时，只显示生成接口按钮
	} else if catalog.State == common.CATALOG_STATUS_DRAFT &&
		((catalog.FlowType == nil && catalog.AuditState == nil) ||
			(catalog.FlowType != nil && catalog.AuditState != nil &&
				*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)) {
		// operation += 3
		// if len(catalog.OwnerId) > 0 {
		// 	operation += 8
		// }
		operation += 11
	} else if catalog.State == common.CATALOG_STATUS_OFFLINE && catalog.FlowType != nil && catalog.AuditState != nil &&
		((*catalog.FlowType == common.AUDIT_FLOW_TYPE_OFFLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
			(*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)) {
		// operation += 1
		// if len(catalog.OwnerId) > 0 {
		// 	operation += 8
		// }
		operation += 9
	} else if catalog.State == common.CATALOG_STATUS_PUBLISHED && catalog.FlowType != nil && catalog.AuditState != nil &&
		((*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
			(*catalog.FlowType == common.AUDIT_FLOW_TYPE_ONLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)) {
		operation += 16
	} else if catalog.State == common.CATALOG_STATUS_ONLINE && catalog.FlowType != nil && catalog.AuditState != nil &&
		((*catalog.FlowType == common.AUDIT_FLOW_TYPE_ONLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
			(*catalog.FlowType == common.AUDIT_FLOW_TYPE_OFFLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)) {
		operation += 64
	}
	// }

	return operation
}
*/
/*
func reqColumnsToModel(shareType, openType *int8, list any) []*model.TDataCatalogColumn {
	f := func(entry []*UpdateColumnItem) []*model.TDataCatalogColumn {
		ret := make([]*model.TDataCatalogColumn, len(entry))
		for i := range entry {
			ret[i] = &model.TDataCatalogColumn{
				ID:              entry[i].ID,
				CatalogID:       entry[i].CatalogID,
				ColumnName:      entry[i].ColumnName,
				NameCn:          entry[i].NameCn,
				DataFormat:      entry[i].DataFormat,
				DataLength:      entry[i].DataLength,
				DatametaID:      entry[i].DatametaID,
				DatametaName:    entry[i].DatametaName,
				Ranges:          entry[i].Ranges,
				CodesetID:       entry[i].CodesetID,
				CodesetName:     entry[i].CodesetName,
				PrimaryFlag:     entry[i].PrimaryFlag,
				NullFlag:        entry[i].NullFlag,
				ClassifiedFlag:  entry[i].ClassifiedFlag,
				SensitiveFlag:   entry[i].SensitiveFlag,
				Description:     entry[i].Description,
				SharedType:      entry[i].SharedType,
				SharedCondition: entry[i].SharedCondition,
				OpenType:        entry[i].OpenType,
				OpenCondition:   entry[i].OpenCondition,
			}

			switch *ret[i].SharedType {
			case common.SHARE_TYPE_NO_CONDITION:
				ret[i].SharedCondition = ""
			case common.SHARE_TYPE_CONDITION:
			case common.SHARE_TYPE_NOT_SHARED:
				*ret[i].OpenType = common.OPEN_TYPE_NOT_OPEN
			}

			if *ret[i].OpenType == common.OPEN_TYPE_NOT_OPEN {
				ret[i].OpenCondition = ""
			}
		}
		return ret
	}

	var tmpList []*UpdateColumnItem
	switch l := list.(type) {
	case []*CreateColumnItem:
		tmpList = make([]*UpdateColumnItem, len(l))
		for i := range l {
			tmpList[i] = &UpdateColumnItem{
				CreateColumnItem: l[i],
			}
		}
	case []*UpdateColumnItem:
		tmpList = l
	default:
		return nil
	}

	return f(tmpList)
}

func (d *DataCatalogDomain) GetDataOwner(ctx context.Context, catalogID uint64) (*OwnerGetResp, error) {
	catalog, err := d.catalogRepo.GetDetail(nil, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	if len(catalog.OwnerId) == 0 {
		return nil, errorcode.Detail(errorcode.DataCatalogNoOwnerErr, "资源未关联数据owner")
	}
	resp := &OwnerGetResp{
		OwnerID:   catalog.OwnerId,
		OwnerName: catalog.OwnerName,
		Validity:  false,
	}

	// ownerInfo, err := common.GetOwnerRoleUsersContains(ctx, catalog.Orgcode, catalog.OwnerId)
	// if err != nil {
	// 	return nil, err
	// }
	// if ownerInfo != nil {
	// 	resp.OwnerName = ownerInfo.Name
	// 	resp.Validity = true
	// }
	tmpArr, err := common.GetUserNameByUserIDs(ctx, []string{catalog.OwnerId})
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if len(tmpArr) > 0 {
		resp.OwnerName = tmpArr[0].Name
		resp.Validity = true
	}
	return resp, nil
}
*/
