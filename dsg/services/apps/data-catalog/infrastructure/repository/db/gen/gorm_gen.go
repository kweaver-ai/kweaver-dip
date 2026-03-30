package main

import (
	"bufio"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gen/custom_method"
	"gorm.io/driver/mysql"
	"gorm.io/gen"
	"gorm.io/gorm"
)

var ExcludeTables = []string{
	"schema_migrations",
}

const (
	DefaultTableOpts = "default_table_opts_1970_01_01"

	IDTypeStr     = "models.ModelID"
	UserIDTypeStr = "models.UserID"
)

var CustomOpts = map[string][]gen.ModelOpt{
	DefaultTableOpts: {
		gen.WithMethod(custom_method.GenIDMethod{}),
	},
	"tree_info": {
		gen.WithMethod(custom_method.GenIDMethod2{}),
		gen.FieldType("id", IDTypeStr),
		gen.FieldGORMTag("created_at", "column:created_at;not null"), // 去除tag中的default信息，使gorm层生成时间信息
		gen.FieldGORMTag("updated_at", "column:updated_at;not null"), // 去除tag中的default信息，使gorm层生成时间信息
		gen.FieldType("root_node_id", IDTypeStr),
		gen.FieldType("deleted_at", "soft_delete.DeletedAt"),
		gen.FieldGORMTag("deleted_at", "column:deleted_at;not null;softDelete:milli"),
		gen.FieldType("created_by_uid", UserIDTypeStr),
		gen.FieldType("updated_by_uid", UserIDTypeStr),
	},
	"tree_node": {
		gen.WithMethod(custom_method.GenIDMethod2{}),
		gen.FieldType("id", IDTypeStr),
		gen.FieldGORMTag("created_at", "column:created_at;not null"), // 去除tag中的default信息，使gorm层生成时间信息
		gen.FieldGORMTag("updated_at", "column:updated_at;not null"), // 去除tag中的default信息，使gorm层生成时间信息
		gen.FieldType("tree_id", IDTypeStr),
		gen.FieldType("parent_id", IDTypeStr),
		gen.FieldType("deleted_at", "soft_delete.DeletedAt"),
		gen.FieldGORMTag("deleted_at", "column:deleted_at;not null;softDelete:milli"),
		gen.FieldType("created_by_uid", UserIDTypeStr),
		gen.FieldType("updated_by_uid", UserIDTypeStr),
	},
}

var (
	dsn     string
	outPath string
	outDao  bool
	tables  string
)

func init() {
	flag.StringVar(&dsn, "dsn", "", "dsn")
	//flag.StringVar(&outPath, "out_path", "D:\\model\\catalog", "out path")
	flag.StringVar(&outPath, "out_path", "D:\\workspace\\go\\work\\data-catalog\\infrastructure\\repository\\db\\model", "out path")
	flag.BoolVar(&outDao, "out_dao", false, "out dao")
	//flag.StringVar(&tables, "tables", "t_data_catalog_category", "tables name, eg: table1,table2")
	flag.StringVar(&tables, "tables", "t_business_form_not_cataloged", "tables name, eg: table1,table2")
}

func main() {
	flag.Parse()

	if len(dsn) == 0 {
		// dsn = "user:pwd@(10.4.x.x:3306)/data_catalog?charset=utf8mb4&parseTime=True&loc=Local"
		//dsn = "standardization:***@(10.4.132.224:3306)/af_data_catalog?charset=utf8mb4&parseTime=True&loc=Local"
		//dsn = "root:***@(10.4.109.185:1998)/af_data_catalog?charset=utf8mb4&parseTime=True&loc=Local"
		dsn = "root:***@(10.4.108.86:3330)/af_data_catalog?charset=utf8mb4&parseTime=True&loc=Local"
	}

	if len(dsn) == 0 {
		panic("dsn is empty")
	}

	if len(outPath) == 0 {
		_, file, _, _ := runtime.Caller(0)
		file = filepath.Dir(filepath.Dir(file))
		outPath = filepath.Join(file, "model")
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
	excludeTablesSet := make(map[string]struct{}, len(ExcludeTables))
	for _, tableName := range ExcludeTables {
		excludeTablesSet[tableName] = struct{}{}
	}

	tableSli := strings.Split(tables, ",")
	tableSli = lo.Compact(tableSli)
	genAll := len(tableSli) < 1
	includeTableSet := make(map[string]struct{}, len(tableSli))
	for _, t := range tableSli {
		includeTableSet[t] = struct{}{}
	}

	g.UseDB(db)

	tableList, err := db.Migrator().GetTables()
	if err != nil {
		panic(fmt.Errorf("get all tables fail: %w", err))
	}

	tableModels = make([]interface{}, len(tableList))
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
		if cusOpts, ok := CustomOpts[tableName]; ok {
			curOpts = append(curOpts, cusOpts...)
		} else {
			cusOpts = append(cusOpts, CustomOpts[DefaultTableOpts]...)
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
