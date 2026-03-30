package main

import (
	"fmt"
	"io"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/datasource"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"golang.org/x/net/context"
)

var (
	limit  int
	offset int
	dbAuth string
	dbHost string
	host   string
	token  string
)

func init() {
	rootCmd.PersistentFlags().IntVarP(&limit, "limit", "l", -1, "")
	rootCmd.PersistentFlags().IntVarP(&offset, "offset", "o", -1, "")
	rootCmd.PersistentFlags().StringVarP(&dbAuth, "db_auth", "a", "anyshare:***", "database  auth .  ex jade:123456 ")
	rootCmd.PersistentFlags().StringVar(&dbHost, "db_host", "10.100.156.251:3330", "database host  .  ex 10.4.89.65:3306 ")
	rootCmd.PersistentFlags().StringVar(&host, "host", "http://10.4.175.249", "env host  .  ex http://10.4.175.249 ")
	rootCmd.PersistentFlags().StringVar(&token, "token", "ory_at_-_DY-p5rulHYHP_954D70uBvups3Pg22kMYZF7skLA0.DmXN_QyzBkOH4N1scmSD6kpmd2cryTyhsI0TsGlXETI", "env token ")
}

var rootCmd = &cobra.Command{
	Use:   "root",
	Short: "log info",
	Long:  `print log info`,
	Run: func(cmd *cobra.Command, args []string) {
		log.Info("root")
	},
}
var client = &http.Client{}

var cmdEcho = &cobra.Command{
	Use:   "da",
	Short: "delete all datasource",
	Long:  `delete all datasource`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("start delete all datasource", host, token)
		ctx := context.Background()
		dataSource, err := GetDataSource(ctx)
		if err != nil {
			log.WithContext(ctx).Error("GetDataSource", zap.Error(err))
			return
		}
		for _, d := range dataSource.Entries {
			if err = DeleteDataSource(ctx, d.ID); err != nil {
				continue
			}
			fmt.Println("success delete", d.ID, d.Name)
		}

	},
}

func GetDataSource(ctx context.Context) (*datasource.QueryPageResParam, error) {
	errorMsg := "GetDataSource "
	urlStr := host + "/api/configuration-center/v1/datasource"
	if limit > 0 {
		urlStr += "?limit=" + fmt.Sprintf("%d", limit)
		if offset > 0 {
			urlStr += "&offset=" + fmt.Sprintf("%d", offset)
		}
	}
	request, _ := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	request.Header.Set("Authorization", token)
	resp, err := client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, err
	}
	if resp.StatusCode == http.StatusOK {
		res := &datasource.QueryPageResParam{}
		err = jsoniter.Unmarshal(body, res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, err
		}
		return res, nil
	}
	err = base.StatusCodeNotOK(errorMsg, resp.StatusCode, body)
	return nil, err
}

func DeleteDataSource(ctx context.Context, datasourceId string) error {
	errorMsg := "DeleteDataSource "
	urlStr := host + "/api/configuration-center/v1/datasource/" + datasourceId

	request, _ := http.NewRequestWithContext(ctx, http.MethodDelete, urlStr, nil)
	request.Header.Set("Authorization", token)
	resp, err := client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return err
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	}
	return base.StatusCodeNotOK(errorMsg, resp.StatusCode, body)
}
func main() {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})
	rootCmd.AddCommand(cmdEcho)
	err := rootCmd.Execute()
	if err != nil {
		log.Error("rootCmd.Execute: ", zap.Error(err))
	}
}
