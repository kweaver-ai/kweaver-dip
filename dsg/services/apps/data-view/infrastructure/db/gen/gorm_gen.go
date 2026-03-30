package main

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gen"
	"gorm.io/gorm"
)

// generate code
func main() {
	g := gen.NewGenerator(gen.Config{
		//OutPath: "D:\\af\\src\\af-business-grooming",
		//OutPath: "D:\\tmp",
		OutPath: "infrastructure/db/model",
		Mode: gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface,
	})

	db, err := gorm.Open(mysql.Open("root:eisoo.com123@(10.4.108.86:3330)/af_main?charset=utf8mb4&parseTime=True&loc=Local"))
	if err != nil {
		panic(fmt.Errorf("cannot establish db connection: %w", err))
	}

	g.UseDB(db)
	//g.GenerateAllTable()
	//g.GenerateModel("t_meta_model")
	//g.GenerateModel("t_composite_model")
	//g.GenerateModel("t_model_relation")
	//g.GenerateModel("t_model_relation_link")
	//g.GenerateModel("t_model_field")
	//g.GenerateModel("t_model_canvas")
	g.GenerateModel("t_model_single_node")

	g.Execute()
}
