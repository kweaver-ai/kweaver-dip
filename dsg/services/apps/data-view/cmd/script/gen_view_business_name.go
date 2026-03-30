package main

import (
	"fmt"

	virtualization_engine "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/schollz/progressbar/v3"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"golang.org/x/net/context"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	limit   int
	offset  int
	name    string
	vreHost string
	dbAuth  string
	dbHost  string
)

func init() {
	rootCmd.PersistentFlags().IntVarP(&limit, "limit", "l", -1, "")
	rootCmd.PersistentFlags().IntVarP(&offset, "offset", "o", -1, "")
	rootCmd.PersistentFlags().StringVarP(&name, "name", "n", "", "virtualization_engine service host .  ex 10.4.89.65:9088 ")
	rootCmd.PersistentFlags().StringVarP(&vreHost, "vr_host", "v", "http://10.101.234.208:8099", "virtualization_engine service host .  ex 10.4.89.65:8099 ")
	rootCmd.PersistentFlags().StringVarP(&dbAuth, "db_auth", "a", "anyshare:eisoo.com123", "database  auth .  ex jade:123456 ")
	rootCmd.PersistentFlags().StringVar(&dbHost, "db_host", "10.100.156.251:3330", "database host  .  ex 10.4.89.65:3306 ")
}

func genBusiness(data []any) string {
	defer func() {
		if r := recover(); r != nil {
			log.Errorf("genBusiness panic:%v\n", r)
		}
	}()
	//reg := regexp.MustCompile(`[^a-zA-Z0-9\p{Han}]`)
	var d1, d2, d3 string
	if data[1] != nil {
		//d1 = reg.ReplaceAllString(data[1].(string), "_")
		d1 = data[1].(string)
	}
	if data[2] != nil {
		//d2 = reg.ReplaceAllString(data[2].(string), "_")
		d2 = data[2].(string)

	}
	if data[3] != nil {
		//d3 = reg.ReplaceAllString(data[3].(string), "##")
		d3 = data[3].(string)

	}
	return fmt.Sprintf("%s##%s##%s", d1, d2, d3)

}

var rootCmd = &cobra.Command{
	Use:   "root",
	Short: "gen-name  Minhang Special Handling Script",
	Long:  `gen-name  Minhang Special Handling Script (organdame,sys_name_zh,table_des) to BusinessName`,
	Run: func(cmd *cobra.Command, args []string) {
		ctx := context.Background()
		querySql := "select aim_inceptortable,organdame,sys_name_zh,table_des from vdm_inceptor_jdbc_ozw081wh.default.rocket_table_status where  aim_inceptortable is not null "
		gen(ctx, querySql, 0)
	},
}

func gen(ctx context.Context, querySql string, page int) {
	vre := virtualization_engine.VirtualizationEngine{
		BaseURL:    vreHost,
		HttpClient: trace.NewOtelHttpClient(),
	}
	sql := fmt.Sprintf("%s offset %d limit 1000", querySql, page*1000)
	log.Infof("querySql :" + sql)

	data, err := vre.FetchData(ctx, sql)
	if err != nil {
		log.Error("rootCmd.Execute: ", zap.Error(err))
		return
	}
	if data.TotalCount == 0 {
		log.Infof("【All Finish】 ：%d", page*1000)
		return
	}
	db, err := gorm.Open(mysql.Open(fmt.Sprintf("%s@(%s)/af_main?charset=utf8mb4&parseTime=true",
		dbAuth,
		dbHost)))
	if err != nil {
		log.Error("open mysql failed,err:", zap.Error(err))
		return
	}
	bar := progressbar.Default(int64(data.TotalCount))
	for i, datum := range data.Data {
		if datum[0] == nil {
			log.Errorf("**************datum nil  %d:%v", i, datum)
			return
		}
		err = db.Where("technical_name=?", datum[0].(string)).Updates(&model.FormView{
			TechnicalName: datum[0].(string),
			BusinessName:  genBusiness(datum),
		}).Error
		if err != nil {
			log.Error("logicViewRepo.Update: ", zap.Error(err))
			return
		}
		bar.Add(1)
	}
	page++
	gen(ctx, querySql, page)
}

var cmdEcho = &cobra.Command{
	Use:   "query",
	Short: "query",
	Long:  "query",
	Run: func(cmd *cobra.Command, args []string) {
		ctx := context.Background()

		querySql := "select aim_inceptortable,organdame,sys_name_zh,table_des from vdm_inceptor_jdbc_ozw081wh.default.rocket_table_status "
		if offset != -1 {
			querySql = fmt.Sprintf("%s offset %d ", querySql, offset)
		}
		if limit != -1 {
			querySql = fmt.Sprintf("%s limit %d ", querySql, limit)
		}
		vre := virtualization_engine.VirtualizationEngine{
			BaseURL:    vreHost,
			HttpClient: trace.NewOtelHttpClient(),
		}
		log.Infof("querySql :" + querySql)

		data, err := vre.FetchData(ctx, querySql)
		if err != nil {
			log.Error("rootCmd.Execute: ", zap.Error(err))
			return
		}
		log.Infof("query data :\n %v ", data)
	},
}

func main() {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})
	rootCmd.AddCommand(cmdEcho)
	err := rootCmd.Execute()
	if err != nil {
		log.Error("rootCmd.Execute: ", zap.Error(err))
	}
}
