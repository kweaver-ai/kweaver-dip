package impl

import (
	"context"
	"mime/multipart"
	"path"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/firm"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode/mariadb"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/firm"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/firm/excel"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/samber/lo"
	"gopkg.in/fatih/set.v0"
	"gorm.io/gorm"
)

type useCase struct {
	fRepo firm.Repo
	data  *gorm.DB
}

func NewUseCase(fRepo firm.Repo, data *gorm.DB) domain.UseCase {
	return &useCase{
		fRepo: fRepo,
		data:  data,
	}
}

func (uc *useCase) Create(ctx context.Context, uid string, req *domain.CreateReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	firm := &model.TFirm{
		Name:           req.Name,
		UniformCode:    req.UniformCode,
		LegalRepresent: req.LegalRepresent,
		ContactPhone:   req.ContactPhone,
		CreatedAt:      time.Now(),
		CreatedBy:      uid,
	}
	if err = uc.fRepo.Create(nil, ctx, firm); err != nil {
		if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
			log.WithContext(ctx).Errorf("firm create name or uniform code conflicted: %v", err)
			return nil, errorcode.Detail(errorcode.FirmNameOrUniCodeConflictError, err.(*mysql.MySQLError).Message)
		}
		log.WithContext(ctx).Errorf("uc.fRepo.Create failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.IDResp{ID: firm.ID}
	return resp, nil
}

func cutRowsByLine(cutRuleByLine *excel.SheetCutRuleByLine,
	rows [][]string) (tableContent [][]string, instruction []string, hasError bool) {
	if cutRuleByLine.Instruction != nil {
		for _, k := range cutRuleByLine.Instruction.Rows {
			if k > 0 && rows[k-1] != nil {
				instruction = append(instruction, rows[k-1][0])
			} else {
				return nil, nil, true
			}
		}
	}

	if cutRuleByLine.TableContent.TitleNum > 0 && rows[cutRuleByLine.TableContent.TitleNum-1] != nil {
		tableContent = rows[cutRuleByLine.TableContent.TitleNum-1:]
	} else {
		return nil, nil, true
	}
	return
}

func (uc *useCase) parsingFirmList(ctx context.Context, uid string, rows [][]string,
	template *excel.SheetTemplate, rule *excel.SheetCutRuleByLine) (firms []*model.TFirm, err error) {
	tableContent, _, hasError := cutRowsByLine(rule, rows)
	if hasError {
		log.WithContext(ctx).Error("parsingFirmList CutRows err")
		return nil, errorcode.Desc(errorcode.FormContentError)
	}

	if len(tableContent) < 2 { // 空文件
		return nil, errorcode.Desc(errorcode.FormExcelEmptyError)
	}

	// 验证title是否与配置一致
	titles := tableContent[0]
	rowDatas := tableContent[1:]
	if titles != nil && len(titles) != len(template.Components) {
		log.WithContext(ctx).Error("firm title not equal")
		return nil, errorcode.Desc(errorcode.FormFieldEmptyError)
	}
	sConfFileds := set.New(set.NonThreadSafe)
	sConfFileds.Add(lo.MapToSlice[string, int, any](template.FieldName2IdxMap, func(key string, value int) any { return key })...)
	for i := range titles {
		if sConfFileds.Has(titles[i]) {
			if !(template.Components[template.FieldName2IdxMap[titles[i]]].Rule == nil ||
				(template.Components[template.FieldName2IdxMap[titles[i]]].Rule != nil &&
					!template.Components[template.FieldName2IdxMap[titles[i]]].Rule.Required)) {
				log.WithContext(ctx).Error("firm title's properties not matched")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
			continue
		} else {
			titles[i] = strings.TrimSpace(titles[i])
			if !strings.HasPrefix(titles[i], "*") {
				log.WithContext(ctx).Error("firm title's properties not matched")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
			titles[i] = titles[i][1:]
			if !sConfFileds.Has(titles[i]) {
				log.WithContext(ctx).Error("firm title not equal")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
			if !(template.Components[template.FieldName2IdxMap[titles[i]]].Rule != nil &&
				template.Components[template.FieldName2IdxMap[titles[i]]].Rule.Required) {
				log.WithContext(ctx).Error("firm title not equal")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
		}
	}

	// 数据校验及转换
	var (
		component      *excel.Component
		fillFieldCount int
		rData          []string
	)
	timeNow := time.Now()
	duplicateCheckMap := map[string]map[string]bool{}
	firms = make([]*model.TFirm, 0, len(rowDatas))
	for i := range rowDatas {
		fillFieldCount = 0
		f := &model.TFirm{
			CreatedAt: timeNow,
			CreatedBy: uid,
		}
		rData = rowDatas[i]
		if len(rData) < len(titles) {
			for i := 0; i < len(titles)-len(rData); i++ {
				rData = append(rData, "")
			}
		}
		for j := range titles {
			component = template.Components[template.FieldName2IdxMap[titles[j]]]
			switch component.Name {
			case "name":
				f.Name = rData[j]
				fillFieldCount++
			case "uniform_code":
				f.UniformCode = rData[j]
				fillFieldCount++
			case "legal_represent":
				f.LegalRepresent = rData[j]
				fillFieldCount++
			case "contact_phone":
				f.ContactPhone = rData[j]
				fillFieldCount++
			default:
				continue
			}
			if err = component.Verify(ctx, component, rData[j], duplicateCheckMap); err != nil {
				return nil, err
			}
		}
		if fillFieldCount != 4 {
			log.WithContext(ctx).Error("firm import template field title / name not match to db model")
			return nil, errorcode.Desc(errorcode.FormContentError)
		}
		firms = append(firms, f)
	}
	return
}

const (
	FIRM_IMPORT_TEMPLATE_NAME = "firm_list"  // 厂商导入模板名称
	FIRM_IMPORT_SHEET_NAME    = "厂商名录"       // 厂商导入sheet名称
	FIRM_BATCH_INSERT_SIZE    = 1000         // 批量插入厂商数据size
	FILE_SIZE_LIMIT           = 10 * 1 << 20 // 文件size限制为10MB
)

const (
	EXT_TYPE_XLS  = ".xls"
	EXT_TYPE_XLSX = ".xlsx"
)

var validExtTypeMap = map[string]bool{
	EXT_TYPE_XLS:  true,
	EXT_TYPE_XLSX: true,
}

func (uc *useCase) Import(ctx context.Context, uid string, file *multipart.FileHeader) (resp *domain.NullResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if file.Size > FILE_SIZE_LIMIT {
		return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
	}

	excelType := strings.ToLower(path.Ext(file.Filename))
	if !validExtTypeMap[excelType] {
		log.WithContext(ctx).Errorf("invalid excel extend type")
		return nil, errorcode.Desc(errorcode.FormExcelInvalidType)
	}

	f, err := file.Open()
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return nil, errorcode.Desc(errorcode.FormOpenExcelFileError)
	}
	defer func() {
		if err := f.Close(); err != nil {
			log.WithContext(ctx).Error("f.Close " + err.Error())
		}
	}()

	sheetLists, excelFile, err := excel.ReadSheetList(excelType[1:], f)
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return nil, errorcode.Desc(errorcode.FormOpenExcelFileError)
	}

	template, rule := excel.GetTemplateRule(FIRM_IMPORT_TEMPLATE_NAME, FIRM_IMPORT_SHEET_NAME)
	if template == nil {
		log.WithContext(ctx).
			Errorf("get excel template (tamplate: %s sheet: %s) failed: not existed",
				FIRM_IMPORT_TEMPLATE_NAME, FIRM_IMPORT_SHEET_NAME)
		return nil, errorcode.Desc(errorcode.FormGetTemplateError)
	}
	if rule == nil {
		log.WithContext(ctx).
			Errorf("get excel cut line ruel (tamplate: %s sheet: %s) failed: not existed",
				FIRM_IMPORT_TEMPLATE_NAME, FIRM_IMPORT_SHEET_NAME)
		return nil, errorcode.Desc(errorcode.FormGetRuleError)
	}

	var (
		rows           [][]string
		firms          []*model.TFirm
		isSheetExisted bool
	)
	for i := range sheetLists {
		if sheetLists[i] != FIRM_IMPORT_SHEET_NAME {
			continue
		}
		isSheetExisted = true
		break
	}
	if !isSheetExisted {
		log.WithContext(ctx).Error("firm import template sheet not found")
		return nil, errorcode.Desc(errorcode.FormContentError)
	}

	rows, err = excel.GetRows(excelType[1:], FIRM_IMPORT_SHEET_NAME, excelFile)
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return nil, errorcode.Desc(errorcode.FormOpenExcelFileError)
	}
	if firms, err = uc.parsingFirmList(ctx, uid, rows, template, rule); err != nil {
		return nil, err
	}

	tx := uc.data.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)

	insertCount := len(firms) / FIRM_BATCH_INSERT_SIZE
	if len(firms)%FIRM_BATCH_INSERT_SIZE > 0 {
		insertCount += 1
	}
	rBound := 0
	for i := 0; i < insertCount; i++ {
		rBound = (i + 1) * FIRM_BATCH_INSERT_SIZE
		if i == insertCount-1 {
			rBound = len(firms)
		}
		if err = uc.fRepo.BatchCreate(tx, ctx, firms[i*FIRM_BATCH_INSERT_SIZE:rBound]); err != nil {
			if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
				log.WithContext(ctx).Errorf("firm import name or uniform code conflicted: %v", err)
				panic(errorcode.Detail(errorcode.FirmNameOrUniCodeConflictError, err.(*mysql.MySQLError).Message))
			}
			log.WithContext(ctx).Errorf("uc.fRepo.BatchCreate failed: %v", err)
			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
		}
	}

	resp = &domain.NullResp{}
	return
}

func (uc *useCase) Update(ctx context.Context, uid string, firmID uint64, req *domain.CreateReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	var (
		firms []*model.TFirm
	)
	if _, firms, err = uc.fRepo.GetList(nil, ctx, map[string]any{"ids": []uint64{firmID}}); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(firms) == 0 {
		log.WithContext(ctx).Errorf("firm: %d not existed", firmID)
		return nil, errorcode.Desc(errorcode.FirmNotExistedError)
	}
	timeNow := time.Now()
	firms[0].Name = req.Name
	firms[0].UniformCode = req.UniformCode
	firms[0].LegalRepresent = req.LegalRepresent
	firms[0].ContactPhone = req.ContactPhone
	firms[0].UpdatedAt = &timeNow
	firms[0].UpdatedBy = &uid
	if err = uc.fRepo.Update(nil, ctx, firms[0]); err != nil {
		if mariadb.Is(err, mariadb.ER_DUP_ENTRY) {
			log.WithContext(ctx).Errorf("firm: %d update name or uniform code conflicted: %v", firmID, err)
			return nil, errorcode.Detail(errorcode.FirmNameOrUniCodeConflictError, err.(*mysql.MySQLError).Message)
		}
		log.WithContext(ctx).Errorf("uc.fRepo.Update failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.IDResp{ID: firmID}
	return resp, nil
}

func (uc *useCase) Delete(ctx context.Context, uid string, req *domain.DeleteReq) (resp *domain.NullResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	ids := make([]uint64, 0, len(req.IDs))
	for i := range req.IDs {
		ids = append(ids, req.IDs[i].Uint64())
	}
	if err = uc.fRepo.Delete(nil, ctx, uid, ids); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.Delete failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.NullResp{}
	return resp, nil
}

func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	var (
		firms  []*model.TFirm
		params map[string]any
	)
	if params, err = domain.FirmListReqParam2Map(ctx, req); err != nil {
		return nil, err
	}

	resp = &domain.ListResp{}
	if resp.TotalCount, firms, err = uc.fRepo.GetList(nil, ctx, params); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	resp.Entries = make([]*domain.ListItem, 0, len(firms))
	for i := range firms {
		resp.Entries = append(resp.Entries,
			&domain.ListItem{
				ID:             firms[i].ID,
				Name:           firms[i].Name,
				UniformCode:    firms[i].UniformCode,
				LegalRepresent: firms[i].LegalRepresent,
				ContactPhone:   firms[i].ContactPhone,
				CreatedAt:      firms[i].CreatedAt.UnixMilli(),
			},
		)
		if firms[i].UpdatedAt != nil {
			updatedAt := firms[i].UpdatedAt.UnixMilli()
			resp.Entries[i].UpdatedAt = &updatedAt
		}
	}
	return resp, nil
}

func (uc *useCase) UniqueCheck(ctx context.Context, req *domain.UniqueCheckReq) (resp *domain.UniqueCheckResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	resp = &domain.UniqueCheckResp{}
	if resp.Repeat, err = uc.fRepo.CheckExistedByFieldVal(nil, ctx, req.CheckType, req.Value); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.CheckExistedByFieldVal failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return resp, nil
}
