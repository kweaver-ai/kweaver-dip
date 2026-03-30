package impl

import (
	"context"
	"mime/multipart"
	"path"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/firm/excel"
	"github.com/samber/lo"
	"gopkg.in/fatih/set.v0"
	"gorm.io/gorm"

	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/address_book"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/address_book"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	addressBookRepo address_book.Repo
	data            *gorm.DB
}

func NewUseCase(
	addressBookRepo address_book.Repo,
	data *gorm.DB,
) domain.UseCase {
	return &useCase{
		addressBookRepo: addressBookRepo,
		data:            data,
	}
}

func (uc *useCase) Create(ctx context.Context, uid string, req *domain.UserInfoReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	addressBookModel := &model.TAddressBook{
		Name:         req.Name,
		DepartmentID: req.DepartmentID,
		ContactPhone: req.ContactPhone,
		ContactMail:  req.ContactMail,
		CreatedAt:    time.Now(),
		CreatedBy:    uid,
	}
	if err = uc.addressBookRepo.Create(nil, ctx, addressBookModel); err != nil {
		log.WithContext(ctx).Errorf("uc.addressBookRepo.Create failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.IDResp{ID: strconv.FormatUint(addressBookModel.ID, 10)}
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

func (uc *useCase) parsingAddressBookList(ctx context.Context, uid string, rows [][]string,
	template *excel.SheetTemplate, rule *excel.SheetCutRuleByLine) (addressBook []*model.TAddressBook, err error) {
	tableContent, _, hasError := cutRowsByLine(rule, rows)
	if hasError {
		log.WithContext(ctx).Error("parsingAddressBookList CutRows err")
		return nil, errorcode.Desc(errorcode.FormContentError)
	}

	if len(tableContent) < 2 { // 空文件
		return nil, errorcode.Desc(errorcode.FormEmptyError)
	}

	// 验证title是否与配置一致
	titles := tableContent[0]
	rowDatas := tableContent[1:]
	if titles != nil && len(titles) != len(template.Components) {
		log.WithContext(ctx).Error("address book title not equal")
		return nil, errorcode.Desc(errorcode.FormContentError)
	}
	sConfFields := set.New(set.NonThreadSafe)
	sConfFields.Add(lo.MapToSlice[string, int, any](template.FieldName2IdxMap, func(key string, value int) any { return key })...)
	for i := range titles {
		if sConfFields.Has(titles[i]) {
			if !(template.Components[template.FieldName2IdxMap[titles[i]]].Rule == nil ||
				(template.Components[template.FieldName2IdxMap[titles[i]]].Rule != nil &&
					!template.Components[template.FieldName2IdxMap[titles[i]]].Rule.Required)) {
				log.WithContext(ctx).Error("address book title's properties not matched")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
			continue
		} else {
			titles[i] = strings.TrimSpace(titles[i])
			if !strings.HasPrefix(titles[i], "*") {
				log.WithContext(ctx).Error("address book title's properties not matched")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
			titles[i] = titles[i][1:]
			if !sConfFields.Has(titles[i]) {
				log.WithContext(ctx).Error("address book title not equal")
				return nil, errorcode.Desc(errorcode.FormContentError)
			}
			if !(template.Components[template.FieldName2IdxMap[titles[i]]].Rule != nil &&
				template.Components[template.FieldName2IdxMap[titles[i]]].Rule.Required) {
				log.WithContext(ctx).Error("address book title not equal")
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
	addressBook = make([]*model.TAddressBook, 0, len(rowDatas))
	for i := range rowDatas {
		fillFieldCount = 0
		f := &model.TAddressBook{
			DepartmentID: constant.UnallocatedId, // 未分类
			CreatedAt:    timeNow,
			CreatedBy:    uid,
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
			case "contact_phone":
				f.ContactPhone = rData[j]
				fillFieldCount++
			case "contact_mail":
				rData[j] = extractEmail(rData[j])
				f.ContactMail = rData[j]
				fillFieldCount++
			default:
				continue
			}
			if err = component.Verify(ctx, component, rData[j], duplicateCheckMap); err != nil {
				return nil, err
			}
		}
		if fillFieldCount != 3 {
			log.WithContext(ctx).Error("address book import template field title / name not match to db model")
			return nil, errorcode.Desc(errorcode.FormContentError)
		}
		addressBook = append(addressBook, f)
	}
	return
}

func extractEmail(s string) string {
	var emailRegexp = regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)
	s = strings.TrimSpace(s)
	matches := emailRegexp.FindStringSubmatch(s)
	if len(matches) > 0 {
		return matches[0]
	}
	return ""
}

const (
	ADDRESS_BOOK_IMPORT_TEMPLATE_NAME = "address_book_list" // 通讯录导入模板名称
	ADDRESS_BOOK_IMPORT_SHEET_NAME    = "通讯录导入模板"           // 通讯录导入sheet名称
	ADDRESS_BOOK_BATCH_INSERT_SIZE    = 1000                // 批量插入通讯录数据size
	ADDRESS_BOOK_SIZE_LIMIT           = 10 * 1 << 20        // 文件size限制为10MB
)

const (
	EXT_TYPE_XLS  = ".xls"
	EXT_TYPE_XLSX = ".xlsx"
)

var validExtTypeMap = map[string]bool{
	EXT_TYPE_XLS:  true,
	EXT_TYPE_XLSX: true,
}

func (uc *useCase) Import(ctx context.Context, uid string, file *multipart.FileHeader) (resp *domain.TotalCountResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if file.Size > ADDRESS_BOOK_SIZE_LIMIT {
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

	template, rule := excel.GetTemplateRule(ADDRESS_BOOK_IMPORT_TEMPLATE_NAME, ADDRESS_BOOK_IMPORT_SHEET_NAME)
	if template == nil {
		log.WithContext(ctx).
			Errorf("get excel template (template: %s sheet: %s) failed: not existed",
				ADDRESS_BOOK_IMPORT_TEMPLATE_NAME, ADDRESS_BOOK_IMPORT_SHEET_NAME)
		return nil, errorcode.Desc(errorcode.FormGetTemplateError)
	}
	if rule == nil {
		log.WithContext(ctx).
			Errorf("get excel cut line rule (template: %s sheet: %s) failed: not existed",
				ADDRESS_BOOK_IMPORT_TEMPLATE_NAME, ADDRESS_BOOK_IMPORT_SHEET_NAME)
		return nil, errorcode.Desc(errorcode.FormGetRuleError)
	}

	var (
		rows           [][]string
		addressBook    []*model.TAddressBook
		isSheetExisted bool
	)
	for _, sheetName := range sheetLists {
		if sheetName == ADDRESS_BOOK_IMPORT_SHEET_NAME {
			isSheetExisted = true
			break
		}
	}
	if !isSheetExisted {
		log.WithContext(ctx).Error("address book import template sheet not found")
		return nil, errorcode.Desc(errorcode.FormContentError)
	}

	rows, err = excel.GetRows(excelType[1:], ADDRESS_BOOK_IMPORT_SHEET_NAME, excelFile)
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return nil, errorcode.Desc(errorcode.FormOpenExcelFileError)
	}
	if addressBook, err = uc.parsingAddressBookList(ctx, uid, rows, template, rule); err != nil {
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

	totalCount := len(addressBook)
	insertCount := totalCount / ADDRESS_BOOK_BATCH_INSERT_SIZE
	if totalCount%ADDRESS_BOOK_BATCH_INSERT_SIZE > 0 {
		insertCount += 1
	}
	rBound := 0
	for i := 0; i < insertCount; i++ {
		rBound = (i + 1) * ADDRESS_BOOK_BATCH_INSERT_SIZE
		if i == insertCount-1 {
			rBound = totalCount
		}
		if err = uc.addressBookRepo.BatchCreate(tx, ctx, addressBook[i*ADDRESS_BOOK_BATCH_INSERT_SIZE:rBound]); err != nil {
			log.WithContext(ctx).Errorf("uc.addressBookRepo.BatchCreate failed: %v", err)
			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
		}
	}
	resp = &domain.TotalCountResp{TotalCount: int64(totalCount)}
	return
}

func (uc *useCase) Update(ctx context.Context, uid string, recordId uint64, req *domain.UserInfoReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	userInfo := &model.TAddressBook{}
	timeNow := time.Now()
	userInfo.ID = recordId
	userInfo.Name = req.Name
	userInfo.DepartmentID = req.DepartmentID
	userInfo.ContactPhone = req.ContactPhone
	userInfo.ContactMail = req.ContactMail
	userInfo.UpdatedAt = &timeNow
	userInfo.UpdatedBy = &uid
	success, err := uc.addressBookRepo.Update(nil, ctx, userInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.addressBookRepo.Update failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if !success {
		log.WithContext(ctx).Errorf("uc.addressBookRepo.Update failed: %v", err)
		return nil, errorcode.Detail(errorcode.AddressBookNotExistedError, err)
	}
	resp = &domain.IDResp{ID: strconv.FormatUint(recordId, 10)}
	return resp, nil
}

func (uc *useCase) Delete(ctx context.Context, uid string, recordId uint64) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	success, err := uc.addressBookRepo.Delete(nil, ctx, uid, recordId)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.addressBookRepo.Delete failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if !success {
		log.WithContext(ctx).Errorf("uc.addressBookRepo.Delete failed: %v", err)
		return nil, errorcode.Detail(errorcode.AddressBookNotExistedError, err)
	}
	resp = &domain.IDResp{ID: strconv.FormatUint(recordId, 10)}
	return resp, nil
}

func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	resp = &domain.ListResp{}
	if resp.TotalCount, resp.Entries, err = uc.addressBookRepo.GetList(nil, ctx, req); err != nil {
		log.WithContext(ctx).Errorf("uc.addressBookRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return resp, nil
}
