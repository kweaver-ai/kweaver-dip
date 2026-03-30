package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	af_go_config "github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/env"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/file"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/spf13/cobra"
)

const (
	MIGRATE_UPGRADE   = "up"
	MIGRATE_DOWNGRADE = "down"
)

var (
	Name = "af_data_catalog"
	// Version is the version of the compiled software.
	Version = "1.0"

	confPath string
	addr     string

	rootCmd = &cobra.Command{
		Use:     "data-catalog",
		Short:   "数据目录服务",
		Version: Version,
	}
	serveCmd = &cobra.Command{
		Use:   "server",
		Short: "启动数据目录服务",
		RunE:  serveCmdRun,
	}
	migrateCmd = &cobra.Command{
		Use:   "migrate",
		Short: "启动数据库迁移",
	}
	migrateUpCmd = &cobra.Command{
		Use:   "up",
		Short: "执行数据库迁移操作",
		RunE:  migrateUpCmdRun,
	}
	migrateDownCmd = &cobra.Command{
		Use:   "down",
		Short: "执行数据库回滚操作",
		RunE:  migrateDownCmdRun,
	}
)

func init() {
	rootCmd.PersistentFlags().StringVarP(&confPath, "conf", "c", "config/config.yaml", "config path, eg: -conf config.yaml")
	serveCmd.PersistentFlags().StringVarP(&addr, "addr", "a", ":8153", "http server host, eg: -addr 0.0.0.0:8000")
	migrateCmd.AddCommand(migrateUpCmd, migrateDownCmd)
	rootCmd.AddCommand(serveCmd, migrateCmd)
}

func ExecuteCmd() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println("command exec failed:", err.Error())
		os.Exit(1)
	}
}

func serveCmdRun(cmd *cobra.Command, args []string) error {
	runtime.GOMAXPROCS(runtime.NumCPU())
	config := initConfig()

	tc := config.Config
	// 初始化日志
	log.InitLogger(config.LogConfigs.Logs, &tc)

	if tc.TraceEnabled {
		// 初始化ar_trace
		tracerProvider := trace.InitTracer(&tc, "")
		defer func() {
			if err := tracerProvider.Shutdown(context.Background()); err != nil {
				panic(err)
			}
		}()
	}

	// 初始化验证器
	err := form_validator.SetupValidator()
	if err != nil {
		return err
	}

	nsqConnConf := config.MQConf.GetMQConnConfByMQType("nsq")
	if nsqConnConf == nil {
		return errors.New("no nsq config found")
	}

	appRunner, cleanup, err := InitApp(config)
	if err != nil {
		return err
	}
	defer cleanup()
	if err := appRunner.wfs.Start(); err != nil {
		return err
	}
	log.Info("------------before---------------->data-catalog start success")
	if appRunner.statisticsUseCase != nil {
		log.Info("--------enter-------------------->data-catalog start success")
		appRunner.statisticsUseCase.RunDailyStatisticsTask()
		log.Info("------------after---------------->data-catalog start success")
		log.Info("------------syncTableCount------before---------->data-catalog start success")
		appRunner.statisticsUseCase.RunSyncTableCountTask()
		log.Info("------------syncTableCount------after---------->data-catalog start success")
	}

	// 新增：启动定时任务，天天 00:10 触发更新目标状态
	if appRunner.AssessmentController != nil {
		go func() {
			for {
				now := time.Now()
				next := time.Date(now.Year(), now.Month(), now.Day(), 0, 10, 0, 0, now.Location())
				if !next.After(now) {
					next = next.Add(24 * time.Hour)
				}
				d := next.Sub(now)
				log.Infof("AutoUpdateTargetStatus 将在 %s 后执行", d.String())
				timer := time.NewTimer(d)
				<-timer.C
				// 触发更新
				log.Info("开始执行每日定时任务：AutoUpdateTargetStatus")
				appRunner.AssessmentController.AutoUpdateTargetStatus()
			}
		}()
	}

	//start and wait for stop signal
	if err := appRunner.Run(); err != nil {
		return err
	}
	return nil
}

func migrateUpCmdRun(cmd *cobra.Command, args []string) error {
	initConfig()
	return migrateApiFunc(MIGRATE_UPGRADE)
}

func migrateDownCmdRun(cmd *cobra.Command, args []string) error {
	initConfig()
	return migrateApiFunc(MIGRATE_DOWNGRADE)
}

func initConfig() *settings.Config {
	c := af_go_config.New(
		af_go_config.WithSource(
			env.NewSource(),
			file.NewSource(confPath),
		),
	)
	if err := c.Load(); err != nil {
		panic(err)
	}

	config := settings.GetConfig()
	// 读取所有配置信息
	if err := c.Scan(config); err != nil {
		panic(err)
	}

	if addr != "" {
		config.HttpConf.Host = addr
	}

	return config
}

func migrateCmdFunc(opMode string) error {
	dbOpts := settings.GetConfig().Database
	dns := fmt.Sprintf("mysql://%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", dbOpts.Username, dbOpts.Password, dbOpts.Host, dbOpts.Database)
	cmd := exec.Command(settings.GetConfig().DBMigrate.Source+"/migrate",
		[]string{
			"-source",
			"file:" + settings.GetConfig().Source,
			"-database",
			dns,
			opMode,
		}...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout // 标准输出
	cmd.Stderr = &stderr // 标准错误
	err := cmd.Run()
	outStr, errStr := stdout.String(), stderr.String()
	fmt.Println("out: ", outStr)
	if err != nil {
		fmt.Println("err: ", errStr)
		return err
	}
	return nil
}

func migrateApiFunc(opMode string) error {
	dbOpts := settings.GetConfig().Database
	dns := fmt.Sprintf("mysql://%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", dbOpts.Username, dbOpts.Password, dbOpts.Host, dbOpts.Database)

	m, err := migrate.New(
		"file:"+settings.GetConfig().Source,
		dns)
	if err != nil {
		fmt.Printf("migrate.New err: %v\n", err.Error())
		return err
	}

	switch opMode {
	case MIGRATE_UPGRADE:
		err = m.Up()
	case MIGRATE_DOWNGRADE:
		err = m.Down()
	}
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			return nil
		}
		fmt.Printf(" m.%s() err: %v\n", opMode, err.Error())
		return err
	}
	return nil
}
