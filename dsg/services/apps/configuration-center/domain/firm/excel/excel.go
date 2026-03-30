package excel

import (
	"context"
	"errors"
	"mime/multipart"

	"github.com/extrame/xls"
	"github.com/xuri/excelize/v2"
)

func InitExcel() (err error) {
	ctx := context.Background()
	if err = initTemplate(ctx); err == nil {
		return initLineRule(ctx)
	}
	return
}

func GetTemplateRule(templateName, sheetName string) (*SheetTemplate, *SheetCutRuleByLine) {
	return getTemplate(templateName, sheetName),
		getLineRule(templateName, sheetName)
}

func ReadSheetList(excelType string, file multipart.File) ([]string, any, error) {
	var sheetList []string
	if excelType == "xlsx" {
		xlsxFile, err := excelize.OpenReader(file)
		if err != nil {
			return nil, nil, err
		}
		sheetList = xlsxFile.GetSheetList()
		return sheetList, xlsxFile, nil

	} else if excelType == "xls" {
		xlsFile, err := xls.OpenReader(file, "utf-8")
		if err != nil {
			return nil, nil, err
		}
		sheetList = make([]string, xlsFile.NumSheets())
		for i := 0; i < xlsFile.NumSheets(); i++ {
			sheetList[i] = xlsFile.GetSheet(i).Name
		}
		return sheetList, xlsFile, nil
	} else {
		return nil, nil, errors.New("不支持的文件类型")
	}
}

func GetRows(excelType string, sheetName string, excelFile any) ([][]string, error) {
	if excelType == "xlsx" {
		xlsxFile, ok := excelFile.(*excelize.File)
		if !ok {
			return nil, errors.New("input excelFile format invalid")
		}
		rows, err := xlsxFile.GetRows(sheetName, excelize.Options{RawCellValue: true})
		if err != nil {
			return nil, err
		}
		return rows, nil
	} else if excelType == "xls" {
		xlsFile, ok := excelFile.(*xls.WorkBook)
		if !ok {
			return nil, errors.New("input excelFile format invalid")
		}
		var rows [][]string
		for i := 0; i < xlsFile.NumSheets(); i++ {
			sheet := xlsFile.GetSheet(i)
			if sheet.Name == sheetName && hasRows(sheet) {
				for j := 0; j < int(sheet.MaxRow)+1; j++ {
					row, has := hasRow(sheet, j)
					if !has {
						continue
					}
					tmp := make([]string, 0)
					for k := row.FirstCol(); k < row.LastCol(); k++ {
						tmp = append(tmp, row.Col(k))
					}
					rows = append(rows, tmp)
				}
				// Delete the last redundant empty line
				emptyLineCnt := 0
				for m := len(rows) - 1; m >= 0; m-- {
					emptyFieldCnt := 0
					for n := 0; n < len(rows[m]); n++ {
						if rows[m][n] == "" {
							emptyFieldCnt++
						}
					}
					if emptyFieldCnt == len(rows[m]) {
						emptyLineCnt++
					} else {
						break
					}
				}
				// cut rows: delete the last empty rows
				rows = rows[:len(rows)-emptyLineCnt]
				break
			}
		}
		return rows, nil
	} else {
		return nil, errors.New("不支持的文件类型")
	}
}

// hasRows 0 is also returned when handling empty third-party files  in "github.com/extrame/xls",as with only one line
func hasRows(sheet *xls.WorkSheet) (has bool) {
	if sheet.MaxRow == 0 {
		defer func() {
			if err := recover(); err != nil {
				has = false
			}
		}()
		_ = sheet.Row(0)
	}
	return true
}
func hasRow(sheet *xls.WorkSheet, j int) (*xls.Row, bool) {

	defer func() (*xls.Row, bool) {
		if err := recover(); err != nil {
			return nil, false
		}
		return nil, true
	}()
	row := sheet.Row(j)

	return row, true
}
