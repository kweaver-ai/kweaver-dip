package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/gen/custom_method"
	"github.com/samber/lo"
	"gorm.io/driver/mysql"
	"gorm.io/gen"
	"gorm.io/gen/field"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

var ExcludeTables = []string{
	"schema_migrations",
}

var CustomOpts = map[string][]gen.ModelOpt{
	DefaultTableOpts: {
		gen.FieldTrimPrefix(fieldPrefix),
		gen.FieldIgnore("m_id"),
		gen.WithMethod(custom_method.GenIDMethod{}),
	},
}

func removeTimeFieldDefaultInfo(tag field.GormTag) field.GormTag {
	tag.Remove("default")
	return tag
}

func addSoftDelFieldMilli(tag field.GormTag) field.GormTag {
	tag.Set("softDelete", "milli")
	return tag
}

const (
	DefaultTableOpts = "default_table_opts_1970_01_01"

	tablePrefix = "t_"
	fieldPrefix = "f_"
)

var (
	dsn     string
	outPath string
	outDao  bool
	tables  string
)

func init() {
	dsn = "root:123456@(10.4.71.216:3306)/af_data_exploration?charset=utf8mb4&parseTime=True&loc=Local" //os.Getenv("GEN_DSN")
	outPath = "/home/tim/af/data-exploration-service/infrastructure/repository/db/model"                //os.Getenv("GEN_OUT_PATH")
	outDao = false
	tables = os.Getenv("GEN_TABLES")
}

func main() {
	if len(dsn) == 0 {
		log.Printf("dsn is empty")
		os.Exit(1)
		// dsn = "user:pwd@(10.4.x.x:3306)/data_catalog?charset=utf8mb4&parseTime=True&loc=Local"
	}

	if len(outPath) == 0 {
		log.Printf("out path is empty")
		os.Exit(1)
	}

	if !filepath.IsAbs(outPath) {
		panic("out_path not is abs path")
	}

	genGORM()
}

func genGORM() {
	models := genModel()
	genDao(models)
}

func genModel() []any {
	g := gen.NewGenerator(gen.Config{
		OutPath:        outPath,
		FieldNullable:  true,
		FieldCoverable: true,
		FieldSignable:  true,
	})

	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		panic(err)
	}

	models := generateAllTable(db, g)

	g.Execute()

	return models
}

func generateAllTable(db *gorm.DB, g *gen.Generator, opts ...gen.ModelOpt) (tableModels []interface{}) {
	excludeTablesSet := make(map[string]struct{})
	for _, tableName := range ExcludeTables {
		excludeTablesSet[tableName] = struct{}{}
	}

	tableSli := strings.Split(tables, ",")
	tableSli = lo.Compact(tableSli)
	genAll := len(tableSli) < 1
	includeTableSet := lo.SliceToMap(tableSli, func(item string) (string, struct{}) {
		return item, struct{}{}
	})

	g.UseDB(db)
	g.WithFileNameStrategy(func(tableName string) (fileName string) { return strings.TrimPrefix(tableName, tablePrefix) })
	g.WithJSONTagNameStrategy(func(columnName string) (tagContent string) { return strings.TrimPrefix(columnName, fieldPrefix) })
	g.WithModelNameStrategy(func(tableName string) (modelName string) {
		return schema.NamingStrategy{TablePrefix: tablePrefix}.SchemaName(tableName)
	})

	tableList, err := db.Migrator().GetTables()
	if err != nil {
		panic(fmt.Errorf("get all tables fail: %w", err))
	}

	tableModels = make([]any, len(tableList))
	for i, tableName := range tableList {
		if _, ok := excludeTablesSet[tableName]; ok {
			continue
		}

		if !genAll {
			if _, ok := includeTableSet[tableName]; !ok {
				continue
			}
		}

		curOpts := opts
		curOpts = append(curOpts, CustomOpts[DefaultTableOpts]...)
		if cusOpts, ok := CustomOpts[tableName]; ok {
			curOpts = append(curOpts, cusOpts...)
		}

		tableModels[i] = g.GenerateModel(tableName, curOpts...)
	}

	return tableModels
}

func genDao(models []any) {
	if !outDao {
		return
	}

	if len(models) == 0 {
		return
	}

	queryPath := filepath.Join(outPath, "query")
	g := gen.NewGenerator(gen.Config{
		OutPath:      queryPath,
		Mode:         gen.WithQueryInterface,
		WithUnitTest: true,
	})

	g.ApplyBasic(models...)

	g.Execute()

	// 替换sqlite库和使用memory
	genTestFile := filepath.Join(queryPath, "gen_test.go")
	//execSed(`s/const dbName = "gen_test.db"/const dbName = ":memory:"/g`, genTestFile)
	//execSed(`s/"gorm.io\/driver\/sqlite"/"github.com\/glebarez\/sqlite"/g`, genTestFile)
	replaceInFile(genTestFile, `const dbName = "gen_test.db"`, `const dbName = ":memory:"`)
	replaceInFile(genTestFile, `"gorm.io/driver/sqlite"`, `"github.com/glebarez/sqlite"`)
}

func execSed(arg1, arg2 string) {
	cmd := exec.Command("sed", "-i", arg1, arg2)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		log.Printf("failed to exec command, cmd: %s, err: %v", cmd.String(), err)
	}
}

func replaceInFile(filePath string, arg1, arg2 string) {
	f, err := os.OpenFile(filePath, os.O_RDWR, 0766)
	if err != nil {
		fmt.Println("open file fail:", err)
		return
	}
	defer f.Close()

	out := []string{}

	br := bufio.NewReader(f)
	for {
		line, _, err := br.ReadLine()
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Printf("read err: %v", err)
			break
		}

		lineStr := string(line)
		if strings.Contains(string(line), arg1) {
			lineStr = strings.Replace(string(line), arg1, arg2, -1)
		}
		out = append(out, lineStr+"\n")
	}
	f.Seek(0, io.SeekStart)
	for _, line := range out {
		f.WriteString(line)
	}

}
