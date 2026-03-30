package v1

import (
	"context"
	common_middleware "github.com/kweaver-ai/idrm-go-common/middleware"
	commonUtil "github.com/kweaver-ai/idrm-go-common/util"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	jsoniter "github.com/json-iterator/go"
	"github.com/samber/lo"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"

	api_audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	configuration_center_gocommon "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	TMP_FILE_NAME         = "./.tmpexcel.xlsx"
	TASK_EXECUTE_LOCK_KEY = "DOWNLOAD-TASK.EXECUTE-LOCK"
)

func (f *formViewUseCase) CreateDataDownloadTask(ctx context.Context, req *form_view.DownloadTaskCreateReq) (*form_view.DownloadTaskIDResp, error) {
	l := audit.FromContextOrDiscard(ctx)
	formview, err := f.repo.GetById(ctx, req.FormViewID)
	if err != nil {
		log.WithContext(ctx).Errorf("f.repo.GetById error", zap.Error(err))
		return nil, err
	}

	if ok, err := f.isFormViewDownloadable(ctx, formview); err != nil {
		return nil, err
	} else if !ok {
		log.WithContext(ctx).Errorf("user cannot download data-view %s", formview.ID)
		return nil, errorcode.Desc(my_errorcode.UserDoNotHaveDownloadAuthority)
	}

	timeNow := time.Now()
	task := &model.TDataDownloadTask{
		FormViewID: formview.ID,
		Name:       formview.BusinessName,
		NameEN:     formview.TechnicalName,
		Detail:     req.Detail,
		Status:     form_view.TASK_STATUS_QUEUING,
		CreatedAt:  timeNow,
		CreatedBy:  ctx.Value(interception.InfoName).(*middleware.User).ID,
		UpdatedAt:  timeNow,
	}
	if err = f.downloadTaskRepo.Create(ctx, nil, task); err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.Create DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err)
	}
	l.Info(api_audit_v1.OperationCreateDataDownloadTask,
		&form_view.ResourceObject{
			FormViewID:     task.FormViewID,
			TechnicalName:  task.NameEN,
			BusinessName:   task.Name,
			DownloadTaskID: task.ID,
		},
	)
	return &form_view.DownloadTaskIDResp{ID: task.ID}, nil
}

func (f *formViewUseCase) DeleteDataDownloadTask(ctx context.Context, req *form_view.DownlaodTaskPathReq) (*form_view.DownloadTaskIDResp, error) {
	l := audit.FromContextOrDiscard(ctx)
	_, tasks, err := f.downloadTaskRepo.GetList(ctx, nil, false, map[string]any{"id": req.TaskID.Uint64()})
	if err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.GetList DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err)
	}

	if len(tasks) == 0 {
		log.WithContext(ctx).Errorf("task not found", zap.Error(errors.New("task not found")))
		return nil, errorcode.Desc(my_errorcode.TaskNotFound)
	}

	if tasks[0].CreatedBy != ctx.Value(interception.InfoName).(*middleware.User).ID {
		log.WithContext(ctx).Errorf("task create and delete user not matched", zap.Error(errors.New("user not have this task permissions")))
		return nil, errorcode.Desc(my_errorcode.UserNotHaveThisTaskPermissions)
	}

	if tasks[0].Status == form_view.TASK_STATUS_EXECUING {
		log.WithContext(ctx).Errorf("task cannot delete with status executing", zap.Error(errors.New("task operate is forbidden")))
		return nil, errorcode.Desc(my_errorcode.TaskOperateIsForbidden)
	}

	if tasks[0].FileUUID != nil {
		if err = f.ossGateway.Delete(*tasks[0].FileUUID); err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err)
		}
	}

	if err = f.downloadTaskRepo.Delete(ctx, nil, tasks[0].ID); err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.Delete DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err)
	}
	l.Warn(api_audit_v1.OperationDeleteDataDownloadTask,
		&form_view.ResourceObject{
			FormViewID:     tasks[0].FormViewID,
			TechnicalName:  tasks[0].NameEN,
			BusinessName:   tasks[0].Name,
			DownloadTaskID: tasks[0].ID,
		},
	)
	return &form_view.DownloadTaskIDResp{ID: tasks[0].ID}, nil
}

func (f *formViewUseCase) GetDataDownloadTaskList(ctx context.Context, req *form_view.GetDownloadTaskListReq) (*form_view.PageResultNew[form_view.DownloadTaskEntry], error) {
	pMap := form_view.TaskListParams2Map(req)
	pMap["uid"] = ctx.Value(interception.InfoName).(*middleware.User).ID
	totalCount, tasks, err := f.downloadTaskRepo.GetList(ctx, nil, true, pMap)
	if err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.GetList DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err)
	}
	return form_view.GenTaskListResult(totalCount, tasks), nil
}

func (f *formViewUseCase) GetDataDownloadLink(ctx context.Context, req *form_view.DownlaodTaskPathReq) (*form_view.DownloadLinkResp, error) {
	l := audit.FromContextOrDiscard(ctx)
	_, tasks, err := f.downloadTaskRepo.GetList(ctx, nil, false, map[string]any{"id": req.TaskID.Uint64()})
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err)
	}

	if len(tasks) == 0 {
		log.WithContext(ctx).Errorf("task not found", zap.Error(errors.New("task not found")))
		return nil, errorcode.Desc(my_errorcode.TaskNotFound)
	}

	if tasks[0].CreatedBy != ctx.Value(interception.InfoName).(*middleware.User).ID {
		log.WithContext(ctx).Errorf("task create and delete user not matched", zap.Error(errors.New("user not have this task permissions")))
		return nil, errorcode.Desc(my_errorcode.UserNotHaveThisTaskPermissions)
	}

	if tasks[0].Status != form_view.TASK_STATUS_FINISHED {
		log.WithContext(ctx).Errorf("task cannot get download link while status is not finished", zap.Error(errors.New("task operate is forbidden")))
		return nil, errorcode.Desc(my_errorcode.TaskOperateIsForbidden)
	}

	var link string
	link, err = f.ossGateway.DownloadLink(*tasks[0].FileUUID, fmt.Sprintf("%s-%s.xlsx", tasks[0].NameEN, tasks[0].CreatedAt.Format("20060102150405")))
	if err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.Create DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.PublicInternalServerError, err)
	}
	l.Info(api_audit_v1.OperationDataDownload,
		&form_view.ResourceObject{
			FormViewID:     tasks[0].FormViewID,
			TechnicalName:  tasks[0].NameEN,
			BusinessName:   tasks[0].Name,
			DownloadTaskID: tasks[0].ID,
		},
	)
	return &form_view.DownloadLinkResp{Link: link}, nil
}

func (f *formViewUseCase) taskProcess(ctx context.Context) {
	for !f.redissonLock.TryLock(TASK_EXECUTE_LOCK_KEY) {
		time.Sleep(5 * time.Second)
	}
	defer f.redissonLock.Unlock(TASK_EXECUTE_LOCK_KEY)
	_, tasks, err := f.downloadTaskRepo.GetList(ctx, nil, false,
		map[string]any{
			"status":    []int{form_view.TASK_STATUS_EXECUING, form_view.TASK_STATUS_QUEUING},
			"offset":    1,
			"limit":     1,
			"sort":      []string{"status", "created_at"},
			"direction": []string{"desc", "asc"},
		})
	if err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.GetList DatabaseError", zap.Error(err))
		return
	}

	if len(tasks) == 0 {
		//log.WithContext(ctx).Infof("no task need process")
		return
	}

	tasks[0].UpdatedAt = time.Now()
	tasks[0].Status = form_view.TASK_STATUS_EXECUING
	if err = f.downloadTaskRepo.Update(ctx, nil, tasks[0]); err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.Update task status to executing DatabaseError", zap.Error(err))
		return
	}

	defer func() {
		if e := recover(); e != nil {
			remark := fmt.Sprint(e)
			log.WithContext(ctx).Errorf("taskProcess Error", zap.Error(errors.New(remark)))
			tasks[0].UpdatedAt = time.Now()
			tasks[0].Remark = &remark
			tasks[0].FileUUID = nil
			tasks[0].Status = form_view.TASK_STATUS_FAILED
			if err = f.downloadTaskRepo.Update(ctx, nil, tasks[0]); err != nil {
				log.WithContext(ctx).Errorf("f.downloadTaskRepo.Update task status to failed DatabaseError", zap.Error(err))
			}
		}
	}()

	var (
		fvs []*model.FormView
		td  *form_view.TaskDetailV2
	)
	limitOffset := 1
	if _, fvs, err = f.repo.PageList(ctx,
		&form_view.PageListFormViewReq{
			PageListFormViewReqQueryParam: form_view.PageListFormViewReqQueryParam{
				PageInfo3: request.PageInfo3{
					Limit:  &limitOffset,
					Offset: &limitOffset,
				},
				Sort:        "created_at",
				Direction:   "asc",
				FormViewIds: []string{tasks[0].FormViewID},
			},
		}); err != nil {
		log.WithContext(ctx).Errorf("f.repo.PageList DatabaseError", zap.Error(err))
		return
	}

	tasks[0].Status = form_view.TASK_STATUS_FAILED
	if len(fvs) > 0 {
		var (
			catalog, schema string
			dss             []*model.Datasource
		)
		switch fvs[0].Type {
		case constant.FormViewTypeDatasource.Integer.Int32():
			dss, err = f.datasourceRepo.GetByIds(ctx, []string{fvs[0].DatasourceID})
			if err != nil {
				log.WithContext(ctx).Errorf("f.datasourceRepo.GetByIds DatabaseError", zap.Error(err))
				break
			}
			if len(dss) == 0 {
				log.WithContext(ctx).Errorf("task related data source not existed")
				err = errors.New("task related data source not existed")
				break
			}
			strs := strings.Split(dss[0].DataViewSource, ".")
			if len(strs) != 2 {
				log.WithContext(ctx).Errorf("task related data source invalid")
				err = errors.New("task related data source invalid")
				break
			}
			catalog = strs[0]
			schema = strs[1]
		case constant.FormViewTypeCustom.Integer.Int32():
			catalog = constant.CustomViewSource
			schema = constant.ViewSourceSchema
		case constant.FormViewTypeLogicEntity.Integer.Int32():
			catalog = constant.LogicEntityViewSource
			schema = constant.ViewSourceSchema
		default:
			err = errors.New("unknown form view type")
			log.WithContext(ctx).Errorf("unknown form view type")
		}

		if err == nil {
			td = new(form_view.TaskDetailV2)
			if err = jsoniter.Unmarshal(util.StringToBytes(tasks[0].Detail), td); err == nil {
				var (
					streamWriter      *excelize.StreamWriter
					fvFields          []*model.FormViewField
					fields            []string
					downloadReqParams *virtualization_engine.StreamDownloadReq
				)

				if fvFields, err = f.fieldRepo.GetFormViewFields(ctx, tasks[0].FormViewID); err != nil {
					goto TASK_UPDATE
				}
				//脱敏
				log.WithContext(ctx).Info("tasks[0].FormViewID:", zap.Any("tasks[0].FormViewID", tasks[0].FormViewID))
				dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, tasks[0].FormViewID)
				if err != nil {
					goto TASK_UPDATE
				}
				log.WithContext(ctx).Info("dataPrivacyPolicy:", zap.Any("dataPrivacyPolicy", dataPrivacyPolicy))
				var dataPrivacyPolicyFields []*model.DataPrivacyPolicyField
				if dataPrivacyPolicy != nil {
					dataPrivacyPolicyFields, err = f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, dataPrivacyPolicy.ID)
					if err != nil {
						goto TASK_UPDATE
					}
					log.WithContext(ctx).Info("dataPrivacyPolicyFields:", zap.Any("dataPrivacyPolicyFields", dataPrivacyPolicyFields))
				}
				fieldDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)
				if len(dataPrivacyPolicyFields) > 0 {
					desensitizeRuleIds := make([]string, 0)
					for _, field := range dataPrivacyPolicyFields {
						desensitizeRuleIds = append(desensitizeRuleIds, field.DesensitizationRuleID)
					}
					desensitizationRuleMap := make(map[string]*model.DesensitizationRule)
					desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizeRuleIds)
					if err != nil {
						goto TASK_UPDATE
					}
					if len(desensitizationRules) > 0 {
						for _, desensitizationRule := range desensitizationRules {
							desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
						}
						for _, policyField := range dataPrivacyPolicyFields {
							fieldDesensitizationRuleMap[policyField.FormViewFieldID] = desensitizationRuleMap[policyField.DesensitizationRuleID]
						}
					}
				}
				log.WithContext(ctx).Info("data download fieldDesensitizationRuleMap:", zap.Any("fieldDesensitizationRuleMap", fieldDesensitizationRuleMap))

				if fields, downloadReqParams, err = generateDownloadReqParams(ctx, tasks[0].CreatedBy, catalog, schema, tasks[0].NameEN, td, fvFields, fieldDesensitizationRuleMap); err != nil {
					goto TASK_UPDATE
				}

				// 查询白名单策略数据，添加筛选策略
				var whitePolicyWhereSql = ""
				if whitePolicyWhereSql, err = f.GetWhiteListPolicySql(ctx, tasks[0].FormViewID, tasks[0].CreatedBy); err != nil {
					goto TASK_UPDATE
				}

				if whitePolicyWhereSql != "" {
					if downloadReqParams.RowRules == "" {
						downloadReqParams.RowRules = whitePolicyWhereSql
					} else {
						downloadReqParams.RowRules = fmt.Sprintf(`%s AND %s`, downloadReqParams.RowRules, whitePolicyWhereSql)
					}
				}

				// 删除遗留的导出临时文件
				os.Remove(TMP_FILE_NAME)

				excelfile := excelize.NewFile(excelize.Options{CultureInfo: excelize.CultureNameZhCN})
				defer excelfile.Close()
				if streamWriter, err = excelfile.NewStreamWriter("Sheet1"); err != nil {
					log.WithContext(ctx).Errorf("excelfile.NewStreamWriter failed", zap.Error(err))
					goto TASK_UPDATE
				}

				rIdx := 1
				if err = excelRowWrite(streamWriter, rIdx, lo.ToAnySlice[string](fields)); err != nil {
					log.WithContext(ctx).Errorf("excelRowWrite field title failed", zap.Error(err))
					goto TASK_UPDATE
				}

				if err = getDownloadResultSetV1(ctx, f, downloadReqParams, streamWriter, rIdx, len(fields)); err == nil {
					if err = streamWriter.Flush(); err != nil {
						log.WithContext(ctx).Errorf("streamWriter.Flush failed", zap.Error(err))
						goto TASK_UPDATE
					}

					if err := excelfile.SaveAs(TMP_FILE_NAME); err != nil {
						log.WithContext(ctx).Errorf("excelfile.SaveAs failed", zap.Error(err))
						goto TASK_UPDATE
					}

					var file *os.File
					if file, err = os.Open(TMP_FILE_NAME); err != nil {
						log.WithContext(ctx).Errorf("os.Open failed", zap.Error(err))
						goto TASK_UPDATE
					}
					defer os.Remove(TMP_FILE_NAME)
					defer file.Close()
					fileUUID := uuid.NewString()
					if err = f.ossGateway.MultiUpload(fileUUID, file); err == nil {
						tasks[0].FileUUID = &fileUUID
						tasks[0].Status = form_view.TASK_STATUS_FINISHED
						tasks[0].Remark = nil
					} else {
						log.WithContext(ctx).Errorf("f.ossGateway.MultiUpload failed", zap.Error(err))
					}
				}
			} else {
				log.WithContext(ctx).Errorf("jsoniter.Unmarshal task detail failed", zap.Error(err))
			}
		}
	} else {
		log.WithContext(ctx).Errorf("task related form view not existed")
		err = errors.New("task related form view not existed")
	}
TASK_UPDATE:
	tasks[0].UpdatedAt = time.Now()
	if tasks[0].Status == form_view.TASK_STATUS_FAILED {
		remark := err.Error()
		tasks[0].Remark = &remark
		tasks[0].FileUUID = nil
	}
	if err = f.downloadTaskRepo.Update(ctx, nil, tasks[0]); err != nil {
		log.WithContext(ctx).Errorf("f.downloadTaskRepo.Update DatabaseError", zap.Error(err))
	}
}

func excelRowWrite(streamWriter *excelize.StreamWriter, rowIdx int, rVals []interface{}) error {
	if len(rVals) == 0 {
		return nil
	}
	cell, err := excelize.CoordinatesToCellName(1, rowIdx)
	if err != nil {
		return err
	}

	return streamWriter.SetRow(cell, rVals)
}

func getDownloadResultSetV1(ctx context.Context, f *formViewUseCase, drParams *virtualization_engine.StreamDownloadReq, streamWriter *excelize.StreamWriter, rowIdx int, fieldNum int) (err error) {
	var resp *virtualization_engine.StreamFetchResp
	row := make([]interface{}, fieldNum)
	if resp, err = f.DrivenVirtualizationEngine.StreamDataDownload(ctx, "", drParams); err != nil {
		log.WithContext(ctx).Errorf("start f.DrivenVirtualizationEngine.StreamDataDownload failed", zap.Error(err))
		return err
	}
	for {
		for i := range resp.Data {
			for j := range resp.Data[i] {
				if resp.Data[i][j] == nil {
					row[j] = ""
				} else {
					row[j] = fmt.Sprint(resp.Data[i][j])
				}
			}
			rowIdx++
			if err = excelRowWrite(streamWriter, rowIdx, row); err != nil {
				log.WithContext(ctx).Errorf("excelRowWrite failed", zap.Error(err))
				return err
			}
		}

		if len(resp.NextURI) == 0 {
			break
		}
		if resp, err = f.DrivenVirtualizationEngine.StreamDataDownload(ctx, resp.NextURI, nil); err != nil {
			log.WithContext(ctx).Errorf("f.DrivenVirtualizationEngine.StreamDataDownload failed", zap.Error(err))
			return err
		}

	}
	return err
}

// GenerateColumnsAndWhereClause 返回逗号分隔的字段列表和用于过滤行的 WHERE 子句
func GenerateColumnsAndWhereClause(ctx context.Context, tdJSON string) (columns, whereClause string, err error) {
	td := &form_view.TaskDetail{}
	if err = json.Unmarshal(util.StringToBytes(tdJSON), td); err != nil {
		log.WithContext(ctx).Error("unmarshal TaskDetail fail", zap.Error(err))
		err = errorcode.Detail(my_errorcode.PublicInternalServerError, fmt.Sprintf("unmarshal TaskDetail fail: %v", err))
		return
	}

	if whereClause, err = generateWhereSQL(ctx, td); err != nil {
		log.WithContext(ctx).Errorf("generateWhereSQL failed", zap.Error(err))
		return
	}

	// 原字段名称列表
	var names []string
	for _, f := range td.Fields {
		names = append(names, f.NameEn)
	}
	columns = strings.Join(names, ",")

	return
}

type fieldSortObj struct {
	TechnicalName string // 列技术名称
	BusinessName  string // 列业务名称
	Index         int    // 列顺序索引
}
type fieldsSortObjs []*fieldSortObj

func (fsos fieldsSortObjs) Len() int {
	return len(fsos)
}

func (fsos fieldsSortObjs) Less(i, j int) bool {
	return fsos[i].Index < fsos[j].Index
}

func (fsos fieldsSortObjs) Swap(i, j int) {
	fsos[i], fsos[j] = fsos[j], fsos[i]
}

func generateDownloadReqParams(ctx context.Context,
	userID, catalogName, schema, tableName string,
	td *form_view.TaskDetailV2, fvFields []*model.FormViewField, fieldDesensitizationRuleMap map[string]*model.DesensitizationRule) (fields []string, drParams *virtualization_engine.StreamDownloadReq, err error) {
	drParams = new(virtualization_engine.StreamDownloadReq)

	if drParams.RowRules, err = generateWhereSQLByFix(ctx, td.RowFilters); err != nil {
		log.WithContext(ctx).Errorf("generateWhereSQL failed", zap.Error(err))
		return nil, nil, err
	}

	id2idxMap := make(map[string]int)
	for i := range fvFields {
		id2idxMap[fvFields[i].ID] = i
	}

	var (
		tmpSortObjs fieldsSortObjs
		idx         int
		isExisted   bool
	)
	tmpSortObjs = make(fieldsSortObjs, 0, len(td.Fields))
	fields = make([]string, len(td.Fields))
	escapeFields := make([]string, len(td.Fields))

	for i := range td.Fields {
		if idx, isExisted = id2idxMap[td.Fields[i].ID]; isExisted {
			escapeFieldName := fvFields[idx].TechnicalName
			log.WithContext(ctx).Info("td.Fields[i].ID:", zap.Any("td.Fields[i].ID", td.Fields[i].ID))

			if desensitizationRule, exist := fieldDesensitizationRuleMap[td.Fields[i].ID]; exist {
				if desensitizationRule.Method == "all" {
					escapeFieldName = fmt.Sprintf("regexp_replace(CAST(%s AS VARCHAR), '.', '*') AS %s", escapeFieldName, escapeFieldName)
				} else if desensitizationRule.Method == "middle" {
					escapeFieldName = fmt.Sprintf(
						"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
							"substring(CAST(%s AS VARCHAR), 1, CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer)), '%s', "+
							"substring(CAST(%s AS VARCHAR), CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) + %d, "+
							"length(CAST(%s AS VARCHAR)) - CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) - %d)) END AS %s",
						escapeFieldName, desensitizationRule.MiddleBit, escapeFieldName,
						escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit, strings.Repeat("*", int(desensitizationRule.MiddleBit)),
						escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit,
						desensitizationRule.MiddleBit+1, escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit, desensitizationRule.MiddleBit, escapeFieldName)
				} else if desensitizationRule.Method == "head-tail" {
					escapeFieldName = fmt.Sprintf(
						"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
							"'%s', substring(CAST(%s AS VARCHAR), %d, length(CAST(%s AS VARCHAR)) - %d), '%s') END AS %s",
						escapeFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, escapeFieldName,
						strings.Repeat("*", int(desensitizationRule.HeadBit)),
						escapeFieldName, desensitizationRule.HeadBit+1, escapeFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, strings.Repeat("*", int(desensitizationRule.TailBit)), escapeFieldName)
				}
			}
			tmpSortObjs = append(tmpSortObjs,
				&fieldSortObj{
					BusinessName:  strings.Replace(fvFields[idx].BusinessName, "\"", "\"\"", -1),
					TechnicalName: strings.Replace(escapeFieldName, "\"", "\"\"", -1),
				})

			if td.SortFieldId == td.Fields[i].ID {
				drParams.OrderBy = fmt.Sprintf(`"%s" %s`, fvFields[idx].TechnicalName, td.Direction)
			}
			continue
		}
		return nil, nil, errors.New("download field not existed")
	}
	for i := range tmpSortObjs {
		fields[i] = fmt.Sprintf("%s(%s)", tmpSortObjs[i].BusinessName, tmpSortObjs[i].TechnicalName)
		if strings.Contains(tmpSortObjs[i].TechnicalName, "regexp_replace") {
			escapeFields[i] = fmt.Sprintf(`%s`, tmpSortObjs[i].TechnicalName)
		} else {
			escapeFields[i] = fmt.Sprintf(`"%s"`, tmpSortObjs[i].TechnicalName)
		}

	}
	drParams.Columns = strings.Join(escapeFields, ";")
	log.WithContext(ctx).Info("drParams.Columns", zap.Any("drParams.Columns", drParams.Columns))
	drParams.UserID = userID
	drParams.Catalog = catalogName
	drParams.Schema = schema
	drParams.Table = tableName
	drParams.Offset = 0
	drParams.Limit = 100000
	drParams.Action = "download"

	return fields, drParams, nil
}

func generateWhereSQL(ctx context.Context, td *form_view.TaskDetail) (whereSQL string, err error) {
	if td.RowFilters == nil {
		return
	}
	if len(td.RowFilters.Member) == 0 {
		return
	}

	whereArgs := make([]string, 0, len(td.RowFilters.Member))
	for i := range td.RowFilters.Member {
		var opAndValueSQL string
		opAndValueSQL, err = whereOPAndValueFomrt(
			ctx,
			escape(td.RowFilters.Member[i].NameEn),
			td.RowFilters.Member[i].Operator,
			td.RowFilters.Member[i].Value,
			td.RowFilters.Member[i].DataType)
		if err != nil {
			return
		}
		whereArgs = append(whereArgs, opAndValueSQL)
	}
	whereSQL = strings.Join(whereArgs, " AND ")
	return
}

func whereOPAndValueFomrt(ctx context.Context, name, op, value, dataType string) (whereBackendSql string, err error) {
	special := strings.NewReplacer(`\`, `\\\\`, `'`, `\'`, `%`, `\%`, `_`, `\_`)
	switch op {
	case "<", "<=", ">", ">=":
		if _, err = strconv.ParseFloat(value, 64); err != nil {
			return whereBackendSql, errors.New("where conf invalid")
		}
		whereBackendSql = fmt.Sprintf("%s %s %s", name, op, value)
	case "=", "<>":
		if dataType == constant.SimpleInt || dataType == constant.SimpleFloat || dataType == constant.SimpleDecimal || dataType == constant.DOUBLE || dataType == constant.BIGINT {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errors.New("where conf invalid")
			}
			whereBackendSql = fmt.Sprintf("%s %s %s", name, op, value)
		} else if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			whereBackendSql = fmt.Sprintf("%s %s '%s'", name, op, value)
		} else {
			return "", errors.New("523 where op not allowed")
		}
	case "null":
		whereBackendSql = fmt.Sprintf("%s IS NULL", name)
	case "not null":
		whereBackendSql = fmt.Sprintf("%s IS NOT NULL", name)
	case "include":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s LIKE '%s'", name, "%"+value+"%")
		} else {
			return "", errors.New("534 where op not allowed")
		}
	case "not include":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s NOT LIKE '%s'", name, "%"+value+"%")
		} else {
			return "", errors.New("541 where op not allowed")
		}
	case "prefix":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s LIKE '%s'", name, value+"%")
		} else {
			return "", errors.New("548 where op not allowed")
		}
	case "not prefix":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s NOT LIKE '%s'", name, value+"%")
		} else {
			return "", errors.New("555 where op not allowed")
		}
	case "in list":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf("%s IN %s", name, "("+value+")")
	case "belong":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf("%s IN %s", name, "("+value+")")
	case "true":
		whereBackendSql = fmt.Sprintf("%s = true", name)
	case "false":
		whereBackendSql = fmt.Sprintf("%s = false", name)
	case "before":
		valueList := strings.Split(value, " ")
		whereBackendSql = fmt.Sprintf(`%s >= DATE_add('%s', -%s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') AND %s <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai'`, name, valueList[1], valueList[0], name)
	case "current":
		if value == "%Y" || value == "%Y-%m" || value == "%Y-%m-%d" || value == "%Y-%m-%d %H" || value == "%Y-%m-%d %H:%i" || value == "%x-%v" {
			whereBackendSql = fmt.Sprintf("DATE_FORMAT(%s, '%s') = DATE_FORMAT(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai', '%s')", name, value, value)
		} else {
			return "", errors.New("586 where op not allowed")
		}
	case "between":
		valueList := strings.Split(value, ",")
		whereBackendSql = fmt.Sprintf("%s BETWEEN DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP)) AND DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP))", name, valueList[0], valueList[1])
	default:
		return "", errors.New("592 where op not allowed")
	}
	return
}

// quote 转义字段名称
func escape(s string) string {
	s = strings.Replace(s, "\"", "\"\"", -1)
	// 虚拟化引擎要求字段名称使用英文双引号 "" 转义，避免与关键字冲突
	s = fmt.Sprintf(`"%s"`, s)
	return s
}

func generateWhereSQLByFix(ctx context.Context, configs *form_view.RuleExpression) (whereSQL string, err error) {
	sqlList := []string{}
	for _, whereCondition := range configs.Where {
		td := &form_view.TaskDetail{}
		members := make([]*form_view.Member, 0)
		for _, member := range whereCondition.Member {
			members = append(members, member)
		}
		td.RowFilters = &form_view.RowFilters{Member: members}
		nSql, _ := generateWhereSQL(ctx, td)

		if len(nSql) > 0 {
			nSql = fmt.Sprintf(" ( %s ) ", nSql)
			sqlList = append(sqlList, nSql)
		}

	}
	if len(sqlList) == 0 && len(configs.Where) > 0 {
		return "", errors.New("generate where sql error")
	}

	finalSql := joinWithConjunction(sqlList, configs.WhereRelation)

	//去掉finalSql的首尾空格
	finalSql = strings.TrimSpace(finalSql)
	if finalSql != "" {
		finalSql = fmt.Sprintf(" ( %s ) ", finalSql)
	}
	return finalSql, nil
}

func (f *formViewUseCase) DataPreview(ctx context.Context, req *form_view.DataPreviewReq) (*form_view.DataPreviewResp, error) {
	logger := audit.FromContextOrDiscard(ctx)
	formView, err := f.repo.GetById(ctx, req.FormViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("f.repo.GetById error", zap.Error(err))
		return nil, err
	}
	if ok, err := f.isFormViewReadable(ctx, formView, req.Fields); err != nil {
		return nil, err
	} else if !ok {
		log.WithContext(ctx).Errorf("user cannot read data-view %s", formView.ID)
		return nil, errorcode.Desc(my_errorcode.UserNotHaveThisFormViewPermissions)
	}
	td := &form_view.TaskDetail{}
	members := make([]*form_view.Member, 0)
	for _, member := range req.Filters {
		members = append(members, member)
	}
	td.RowFilters = &form_view.RowFilters{Member: members}
	var whereSql string
	if len(req.Filters) > 0 {
		whereSql, err = generateWhereSQL(ctx, td)
		if err != nil {
			log.WithContext(ctx).Errorf("generateWhereSQL failed", zap.Error(err))
			return nil, err
		}
	}
	if len(req.Configs) > 0 {
		config := form_view.RuleConfig{}
		err = json.Unmarshal([]byte(req.Configs), &config)
		if err != nil {
			return nil, err
		}
		nWhereSql, err := generateWhereSQLByFix(ctx, config.RuleExpression)
		if err != nil {
			return nil, err
		}
		if whereSql == "" {
			whereSql = nWhereSql
		} else {
			whereSql = fmt.Sprintf(`%s AND %s`, whereSql, nWhereSql)
		}
	}

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	// 基于白名单策略规则生成的条件
	whitePolicyWhereSql, err := f.GetWhiteListPolicySql(ctx, req.FormViewId, userInfo.ID)
	if err != nil {
		return nil, err
	}
	if whitePolicyWhereSql != "" {
		if whereSql == "" {
			whereSql = whitePolicyWhereSql
		} else {
			whereSql = fmt.Sprintf(`%s AND %s`, whereSql, whitePolicyWhereSql)
		}
	}

	fields, err := f.fieldRepo.GetFormViewFields(ctx, req.FormViewId)
	if err != nil {
		return nil, err
	}
	fieldMap := make(map[string]string)
	// map[字段ID]是否开启查询保护
	fieldIDGradeIDMap := make(map[string]string)
	fieldProtectionQueryMap := make(map[string]bool)
	uniqueGradeIDMap := make(map[int64]string)
	uniqueGradeIDSlice := []string{}
	for _, field := range fields {
		fieldMap[field.ID] = field.TechnicalName
		if field.GradeID.Valid {
			if _, exist := uniqueGradeIDMap[field.GradeID.Int64]; !exist {
				gradeID := strconv.FormatInt(field.GradeID.Int64, 10)
				fieldIDGradeIDMap[field.ID] = gradeID
				uniqueGradeIDMap[field.GradeID.Int64] = ""
				uniqueGradeIDSlice = append(uniqueGradeIDSlice, gradeID)
			}
		}
	}
	// 获取标签详情
	var labelByIdsRes *configuration_center_gocommon.GetLabelByIdsRes
	if len(uniqueGradeIDSlice) > 0 {
		labelByIdsRes, err = f.GradeLabel.GetLabelByIds(ctx, strings.Join(uniqueGradeIDSlice, ","))
		if err != nil {
			return nil, err
		}
		for _, v := range labelByIdsRes.Entries {
			fieldProtectionQueryMap[v.ID] = v.DataProtectionQuery
		}
	}

	// 脱敏
	//userInfo, _ := util.GetUserInfo(ctx)
	//hasRole1, err := f.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.ManagerDataView, userInfo.ID)
	hasRole1, err := f.commonAuthService.MenuResourceActions(ctx, userInfo.ID, common_middleware.DatasheetView)
	if err != nil {
		return nil, err
	}
	//hasRole2, err := f.configurationCenterDriven.GetRolesInfo(ctx, access_control.TCDataOperationEngineer, userInfo.ID)
	//if err != nil {
	//	return nil, err
	//}
	fieldDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)
	//if !(hasRole1 || hasRole2) {
	if !hasRole1.HasManageAction() {
		dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, req.FormViewId)
		// 是否有记录状态
		dataPrivacyPolicyState := 1
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				dataPrivacyPolicyState = 0
			} else {
				return nil, err
			}

		}
		if dataPrivacyPolicyState == 1 {
			var dataPrivacyPolicyFields []*model.DataPrivacyPolicyField
			if dataPrivacyPolicy != nil {
				dataPrivacyPolicyFields, err = f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, dataPrivacyPolicy.ID)
				if err != nil {
					return nil, err
				}
			}
			if len(dataPrivacyPolicyFields) > 0 {
				desensitizeRuleIds := make([]string, 0)
				for _, field := range dataPrivacyPolicyFields {
					desensitizeRuleIds = append(desensitizeRuleIds, field.DesensitizationRuleID)
				}
				desensitizationRuleMap := make(map[string]*model.DesensitizationRule)
				desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizeRuleIds)
				if err != nil {
					return nil, err
				}
				if len(desensitizationRules) > 0 {
					for _, desensitizationRule := range desensitizationRules {
						desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
					}
					for _, policyField := range dataPrivacyPolicyFields {
						fieldDesensitizationRuleMap[policyField.FormViewFieldID] = desensitizationRuleMap[policyField.DesensitizationRuleID]
					}
				}
			}
		}

	}
	log.WithContext(ctx).Info("DataPreview,fieldDesensitizationRuleMap:", zap.Any("fieldDesensitizationRuleMap", fieldDesensitizationRuleMap))
	log.WithContext(ctx).Infof("fieldIDGradeIDMAP: %v", fieldIDGradeIDMap)
	log.WithContext(ctx).Infof("fieldProtectionQueryMap: %v", fieldProtectionQueryMap)

	var selectSql string
	fieldNames := make([]string, 0)
	for _, fieldId := range req.Fields {
		if fieldName, exist := fieldMap[fieldId]; exist {
			escapeFieldName := escape(fieldName)
			if gradeID, exist := fieldIDGradeIDMap[fieldId]; exist {
				if isProtecdtion, valid := fieldProtectionQueryMap[gradeID]; valid && isProtecdtion {
					continue
				}
			}
			if desensitizationRule, exist := fieldDesensitizationRuleMap[fieldId]; exist {
				if desensitizationRule.Method == "all" {
					escapeFieldName = fmt.Sprintf("regexp_replace(CAST(%s AS VARCHAR), '.', '*') AS %s", escapeFieldName, escapeFieldName)
				} else if desensitizationRule.Method == "middle" {
					escapeFieldName = fmt.Sprintf(
						"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
							"substring(CAST(%s AS VARCHAR), 1, CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer)), '%s', "+
							"substring(CAST(%s AS VARCHAR), CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) + %d, "+
							"length(CAST(%s AS VARCHAR)) - CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) - %d)) END AS %s",
						escapeFieldName, desensitizationRule.MiddleBit, escapeFieldName,
						escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit, strings.Repeat("*", int(desensitizationRule.MiddleBit)),
						escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit,
						desensitizationRule.MiddleBit+1, escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit, desensitizationRule.MiddleBit, escapeFieldName)
				} else if desensitizationRule.Method == "head-tail" {
					escapeFieldName = fmt.Sprintf(
						"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
							"'%s', substring(CAST(%s AS VARCHAR), %d, length(CAST(%s AS VARCHAR)) - %d), '%s') END AS %s",
						escapeFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, escapeFieldName,
						strings.Repeat("*", int(desensitizationRule.HeadBit)),
						escapeFieldName, desensitizationRule.HeadBit+1, escapeFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, strings.Repeat("*", int(desensitizationRule.TailBit)), escapeFieldName)
				}
			}
			fieldNames = append(fieldNames, escapeFieldName)
			continue
		}
		return nil, errorcode.Detail(my_errorcode.FormViewFieldIDNotExist, fmt.Sprintf("fields: %s", fieldId))
	}
	if len(fieldNames) > 0 {
		selectSql = strings.Join(fieldNames, ",")
	} else {
		selectSql = "*"
	}

	log.WithContext(ctx).Info("DataPreview,selectSql:", zap.Any("selectSql", selectSql))
	var dataViewSource string
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasourceInfo, err := f.datasourceRepo.GetById(ctx, formView.DatasourceID)
		if err != nil {
			log.WithContext(ctx).Errorf("f.datasourceRepo.GetById DatabaseError", zap.Error(err))
		}
		dataViewSource = datasourceInfo.DataViewSource
	case constant.FormViewTypeCustom.Integer.Int32():
		dataViewSource = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		dataViewSource = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	default:
		err = errors.New("unknown form view type")
		log.WithContext(ctx).Errorf("unknown form view type")
	}
	if err != nil {
		return nil, err
	}
	sql := fmt.Sprintf(`SELECT %s FROM %s."%s"`, selectSql, dataViewSource, formView.TechnicalName)
	countSql := fmt.Sprintf(`SELECT count(*) FROM %s."%s"`, dataViewSource, formView.TechnicalName)
	if whereSql != "" {
		sql = fmt.Sprintf(`%s WHERE %s`, sql, whereSql)
		countSql = fmt.Sprintf(`%s WHERE %s`, countSql, whereSql)
	}
	if req.SortFieldId != "" {
		fieldName, exist := fieldMap[req.SortFieldId]
		if exist {
			if req.Direction == "" {
				sql = fmt.Sprintf(`%s ORDER BY "%s" desc`, sql, fieldName)
			} else {
				sql = fmt.Sprintf(`%s ORDER BY "%s" %s`, sql, fieldName, req.Direction)
			}
		} else {
			return nil, errorcode.Detail(my_errorcode.FormViewFieldIDNotExist, fmt.Sprintf("sort_field_id: %s", req.SortFieldId))
		}
	}
	limit := 10
	if req.Limit != nil {
		limit = *req.Limit
	}
	offset := 0
	if req.Offset != nil {
		offset = limit * (*req.Offset - 1)
	}
	sql = fmt.Sprintf(`%s OFFSET %d LIMIT %d`, sql, offset, limit)
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	log.Info(fmt.Sprintf("vitriEngine excute sql : %s", sql))
	fetchData, err := f.DrivenVirtualizationEngine.FetchAuthorizedData(ctx, sql, &virtualization_engine.FetchReq{UserID: u.ID, Action: auth_service.Action_Read})
	if err != nil {
		return nil, err
	}

	// 如果需要计算总数
	if req.IfCount > 0 {
		countData, err := f.DrivenVirtualizationEngine.FetchAuthorizedData(ctx, countSql, &virtualization_engine.FetchReq{UserID: u.ID, Action: auth_service.Action_Read})
		if err != nil {
			return nil, err
		}
		countNum, ok := countData.Data[0][0].(float64)
		if ok {
			fetchData.TotalCount = int(countNum)
		}
	}

	logger.Info(api_audit_v1.OperationDataPreview,
		&DataPreviewAudit{
			Name:       formView.BusinessName,
			FormViewID: req.FormViewId,
		})

	return &form_view.DataPreviewResp{FetchDataRes: *fetchData}, nil
}

type DataPreviewAudit struct {
	Name       string `json:"-"`            // 名称
	FormViewID string `json:"form_view_id"` // 视图UUID
}

func (a *DataPreviewAudit) GetName() string {
	return a.Name
}

func (a *DataPreviewAudit) GetDetail() json.RawMessage {
	return lo.Must(json.Marshal(a))
}

func (f *formViewUseCase) DataPreviewConfig(ctx context.Context, req *form_view.DataPreviewConfigReq) (*form_view.DataPreviewConfigResp, error) {
	_, err := f.repo.GetById(ctx, req.FormViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("f.repo.GetById error", zap.Error(err))
		return nil, err
	}
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	m := &model.DataPreviewConfig{FormViewID: req.FormViewId, CreatorUID: userInfo.ID, Config: req.Config}
	err = f.dataPreviewConfigRepo.SaveDataPreviewConfig(ctx, m)
	return &form_view.DataPreviewConfigResp{FormViewId: req.FormViewId}, err
}

func (f *formViewUseCase) GetDataPreviewConfig(ctx context.Context, req *form_view.GetDataPreviewConfigReq) (*form_view.GetDataPreviewConfigResp, error) {
	_, err := f.repo.GetById(ctx, req.FormViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("f.repo.GetById error", zap.Error(err))
		return nil, err
	}
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	m, err := f.dataPreviewConfigRepo.Get(ctx, req.FormViewId, userInfo.ID)
	if err != nil {
		return nil, err
	}
	return &form_view.GetDataPreviewConfigResp{
		Config: m.Config,
	}, nil
}

func (f *formViewUseCase) DesensitizationFieldDataPreview(ctx context.Context, req *form_view.DesensitizationFieldDataPreviewReq) (*form_view.DesensitizationFieldDataPreviewResp, error) {
	logger := audit.FromContextOrDiscard(ctx)

	// 获取字段信息
	fields, err := f.fieldRepo.GetByIds(ctx, []string{req.FormViewFieldId})
	if err != nil {
		log.WithContext(ctx).Errorf("f.fieldRepo.GetByIds error", zap.Error(err))
		return nil, err
	}

	if len(fields) == 0 {
		return nil, errorcode.Desc(my_errorcode.FormViewFieldIDNotExist)
	}
	field := fields[0]

	// 获取视图信息
	formView, err := f.repo.GetById(ctx, field.FormViewID)
	if err != nil {
		log.WithContext(ctx).Errorf("f.repo.GetById error", zap.Error(err))
		return nil, err
	}

	// 检查用户是否有权限读取该字段
	fieldIds := []string{req.FormViewFieldId}
	if ok, err := f.isFormViewReadable(ctx, formView, fieldIds); err != nil {
		return nil, err
	} else if !ok {
		log.WithContext(ctx).Errorf("user cannot read data-view field %s", req.FormViewFieldId)
		return nil, errorcode.Desc(my_errorcode.UserNotHaveThisFormViewPermissions)
	}

	// 处理过滤条件
	td := &form_view.TaskDetail{}
	members := make([]*form_view.Member, 0)
	for _, member := range req.Filters {
		members = append(members, member)
	}
	td.RowFilters = &form_view.RowFilters{Member: members}

	var whereSql string
	if len(req.Filters) > 0 {
		whereSql, err = generateWhereSQL(ctx, td)
		if err != nil {
			log.WithContext(ctx).Errorf("generateWhereSQL failed", zap.Error(err))
			return nil, err
		}
	}

	// 处理配置条件
	if len(req.Configs) > 0 {
		config := form_view.RuleConfig{}
		err = json.Unmarshal([]byte(req.Configs), &config)
		if err != nil {
			return nil, err
		}
		nWhereSql, err := generateWhereSQLByFix(ctx, config.RuleExpression)
		if err != nil {
			return nil, err
		}
		if whereSql == "" {
			whereSql = nWhereSql
		} else {
			whereSql = fmt.Sprintf(`%s AND %s`, whereSql, nWhereSql)
		}
	}

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	// 获取白名单策略
	whitePolicyWhereSql, err := f.GetWhiteListPolicySql(ctx, formView.ID, userInfo.ID)
	if err != nil {
		return nil, err
	}
	if whitePolicyWhereSql != "" {
		if whereSql == "" {
			whereSql = whitePolicyWhereSql
		} else {
			whereSql = fmt.Sprintf(`%s AND %s`, whereSql, whitePolicyWhereSql)
		}
	}

	// 构建 SELECT 语句
	escapedFieldName := escape(field.TechnicalName)
	var selectSql string

	// 应用脱敏规则
	//userInfo, _ := util.GetUserInfo(ctx)
	hasRoleManager, err := f.commonAuthService.MenuResourceActions(ctx, userInfo.ID, common_middleware.DatasheetView)
	//hasRoleManager, err := f.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.ManagerDataView, userInfo.ID)
	if err != nil {
		return nil, err
	}
	if !hasRoleManager.HasManageAction() {
		// 获取指定的脱敏规则
		desensitizationRule, err := f.desensitizationRuleRepo.GetByID(ctx, req.DesensitizationRuleId)
		if err != nil {
			log.WithContext(ctx).Errorf("f.desensitizationRuleRepo.GetByID error", zap.Error(err))
			return nil, err
		}
		if desensitizationRule.Method == "all" {
			escapedFieldName = fmt.Sprintf("regexp_replace(CAST(%s AS VARCHAR), '.', '*') AS %s", escapedFieldName, escapedFieldName)
		} else if desensitizationRule.Method == "middle" {
			escapedFieldName = fmt.Sprintf(
				"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
					"substring(CAST(%s AS VARCHAR), 1, CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer)), '%s', "+
					"substring(CAST(%s AS VARCHAR), CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) + %d, "+
					"length(CAST(%s AS VARCHAR)) - CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) - %d)) END AS %s",
				escapedFieldName, desensitizationRule.MiddleBit, escapedFieldName,
				escapedFieldName, escapedFieldName, desensitizationRule.MiddleBit, strings.Repeat("*", int(desensitizationRule.MiddleBit)),
				escapedFieldName, escapedFieldName, desensitizationRule.MiddleBit,
				desensitizationRule.MiddleBit+1, escapedFieldName, escapedFieldName, desensitizationRule.MiddleBit, desensitizationRule.MiddleBit, escapedFieldName)
		} else if desensitizationRule.Method == "head-tail" {
			escapedFieldName = fmt.Sprintf(
				"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
					"'%s', substring(CAST(%s AS VARCHAR), %d, length(CAST(%s AS VARCHAR)) - %d), '%s') END AS %s",
				escapedFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, escapedFieldName,
				strings.Repeat("*", int(desensitizationRule.HeadBit)),
				escapedFieldName, desensitizationRule.HeadBit+1, escapedFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, strings.Repeat("*", int(desensitizationRule.TailBit)), escapedFieldName)
		}

	}

	// 添加原始字段（用于比较）

	selectSql = escapedFieldName

	// 获取数据视图源
	var dataViewSource string
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasourceInfo, err := f.datasourceRepo.GetById(ctx, formView.DatasourceID)
		if err != nil {
			log.WithContext(ctx).Errorf("f.datasourceRepo.GetById DatabaseError", zap.Error(err))
			return nil, err
		}
		dataViewSource = datasourceInfo.DataViewSource
	case constant.FormViewTypeCustom.Integer.Int32():
		dataViewSource = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		dataViewSource = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	default:
		err = errors.New("unknown form view type")
		log.WithContext(ctx).Errorf("unknown form view type")
		return nil, err
	}

	// 构建完整SQL查询
	sql := fmt.Sprintf(`SELECT %s FROM %s."%s"`, selectSql, dataViewSource, formView.TechnicalName)
	countSql := fmt.Sprintf(`SELECT count(*) FROM %s."%s"`, dataViewSource, formView.TechnicalName)

	if whereSql != "" {
		sql = fmt.Sprintf(`%s WHERE %s`, sql, whereSql)
		countSql = fmt.Sprintf(`%s WHERE %s`, countSql, whereSql)
	}

	// 添加排序
	if req.SortFieldId != "" {
		// 获取所有字段以构建字段ID到字段名的映射
		allFields, err := f.fieldRepo.GetFormViewFields(ctx, formView.ID)
		if err != nil {
			return nil, err
		}

		fieldMap := make(map[string]string)
		for _, f := range allFields {
			fieldMap[f.ID] = f.TechnicalName
		}

		fieldName, exist := fieldMap[req.SortFieldId]
		if exist {
			if req.Direction == "" {
				sql = fmt.Sprintf(`%s ORDER BY "%s" desc`, sql, fieldName)
			} else {
				sql = fmt.Sprintf(`%s ORDER BY "%s" %s`, sql, fieldName, req.Direction)
			}
		} else {
			return nil, errorcode.Detail(my_errorcode.FormViewFieldIDNotExist, fmt.Sprintf("sort_field_id: %s", req.SortFieldId))
		}
	}

	// 添加分页
	limit := 10
	if req.Limit != nil {
		limit = *req.Limit
	}
	offset := 0
	if req.Offset != nil {
		offset = limit * (*req.Offset - 1)
	}
	sql = fmt.Sprintf(`%s OFFSET %d LIMIT %d`, sql, offset, limit)

	// 执行查询
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	log.Info(fmt.Sprintf("DesensitizationFieldDataPreview execute sql: %s", sql))
	fetchData, err := f.DrivenVirtualizationEngine.FetchAuthorizedData(ctx, sql, &virtualization_engine.FetchReq{UserID: u.ID, Action: auth_service.Action_Read})
	if err != nil {
		return nil, err
	}

	// 如果需要计算总数
	if req.IfCount > 0 {
		countData, err := f.DrivenVirtualizationEngine.FetchAuthorizedData(ctx, countSql, &virtualization_engine.FetchReq{UserID: u.ID, Action: auth_service.Action_Read})
		if err != nil {
			return nil, err
		}
		countNum, ok := countData.Data[0][0].(float64)
		if ok {
			fetchData.TotalCount = int(countNum)
		}
	}

	// 添加审计日志
	logger.Info(api_audit_v1.OperationDataPreview,
		&DataPreviewAudit{
			Name:       formView.BusinessName,
			FormViewID: formView.ID,
		})

	return &form_view.DesensitizationFieldDataPreviewResp{FetchDataRes: *fetchData}, nil
}
