package main

import (
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/gen/custom_method"

	"gorm.io/driver/mysql"
	"gorm.io/gen"
	"gorm.io/gorm"
)

// generate code
func main() {
	// specify the output directory (default: "./query")
	// ### if you want to query without context constrain, set mode gen.WithoutContext ###
	g := gen.NewGenerator(gen.Config{
		//OutPath: "D:\\af\\src\\af-task_center",
		//OutPath: "infrastructure\\repository\\db\\model",
		OutPath: "infrastructure/repository/db/model",
		//ModelPkgPath:"D:\\tmp2",
		Mode: gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface,
		/* Mode: gen.WithoutContext|gen.WithDefaultQuery*/
		//if you want the nullable field generation property to be pointer type, set FieldNullable true
		/* FieldNullable: true,*/
		//if you want to assign field which has default value in `Create` API, set FieldCoverable true, reference: https://gorm.io/docs/create.html#Default-Values
		/* FieldCoverable: true,*/
		// if you want generate field with unsigned integer type, set FieldSignable true
		/* FieldSignable: true,*/
		//if you want to generate index tags from repository, set FieldWithIndexTag true
		/* FieldWithIndexTag: true,*/
		//if you want to generate type tags from repository, set FieldWithTypeTag true
		/* FieldWithTypeTag: true,*/
		//if you need unit tests for query code, set WithUnitTest true
		/* WithUnitTest: true, */
	})

	// reuse the repository connection in Project or create a connection here
	// if you want to use GenerateModel/GenerateModelAs, UseDB is necessary or it will panic
	// db, _ := gorm.Open(mysql.Open("root:@(127.0.0.1:3306)/demo?charset=utf8mb4&parseTime=True&loc=Local"))

	db, err := gorm.Open(mysql.Open("username:password@(ip:3306)/db?charset=utf8mb4&parseTime=True&loc=Local"))
	if err != nil {
		panic(fmt.Errorf("cannot establish db connection: %w", err))
	}

	g.UseDB(db)
	//g.GenerateAllTable(gen.WithMethod(custom_method.GenIDMethod{}))
	g.GenerateModel("db_sandbox",
		gen.WithMethod(custom_method.GenIDMethod{}),
	)
	g.GenerateModel("db_sandbox_apply",
		gen.WithMethod(custom_method.GenIDMethod{}),
	)
	//g.GenerateModel("db_sandbox_execution",
	//	gen.WithMethod(custom_method.GenIDMethod{}),
	//)
	//g.GenerateModel("db_sandbox_log",
	//	gen.WithMethod(custom_method.GenIDMethod{}),
	//)

	//g.GenerateModel("business_domain") //gen.FieldTag("update_time", "column:update_time;default:nullt;type:TIMESTAMP;default:CURRENT_TIMESTAMP  on update current_timestamp", "updatetime"),
	//g.GenerateModel("business_flowcharts") //gen.FieldTag("update_time", "column:update_time;default:nullt;type:TIMESTAMP;default:CURRENT_TIMESTAMP  on update current_timestamp", "updatetime"),
	//gen.FieldTag("create_time", "column:create_time;type:TIMESTAMP;default:CURRENT_TIMESTAMP;<-:create", "createtime"),
	//gen.FieldTag("update_time", "column:update_time;default:null", "update_time"),
	//.FieldTag("create_time", "column:create_time;default:null", "createtime"),

	// apply basic crud api on structs or table models which is specified by table name with function
	// GenerateModel/GenerateModelAs. And generator will generate table models' code when calling Excute.
	// 想对已有的model生成crud等基础方法可以直接指定model struct ，例如model.User{}
	// 如果是想直接生成表的model和crud方法，则可以指定表的名称，例如g.GenerateModel("company")
	// 想自定义某个表生成特性，比如struct的名称/字段类型/tag等，可以指定opt，例如g.GenerateModel("company",gen.FieldIgnore("address")), g.GenerateModelAs("people", "Person", gen.FieldIgnore("address"))
	//g.ApplyBasic(model.User{}, g.GenerateModel("company"), g.GenerateModelAs("people", "Person", gen.FieldIgnore("address")))

	// apply diy interfaces on structs or table models
	// 如果想给某些表或者model生成自定义方法，可以用ApplyInterface，第一个参数是方法接口，可以参考DIY部分文档定义
	//g.ApplyInterface(func(method model.Method) {}, model.User{}, g.GenerateModel("company"))
	//g.ApplyInterface(func(method model.BusinessTable) {}, model.BusinessTable{}, g.GenerateModel("business_table"))
	// execute the action of code generation
	g.Execute()
}
