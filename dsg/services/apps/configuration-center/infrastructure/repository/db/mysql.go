package db

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"runtime"

	migrate "github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	gorm_code "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system/impl"
	menu_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/menu/impl"
	impl2 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource/impl"
	gorm_user "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user/impl"
	code_generation_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule/impl"
	info_system "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu"
	menu_impl "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu/impl"
	permissions "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/permissions/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/uptrace/opentelemetry-go-extra/otelgorm"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// NewData .
func NewData(database *Database) (*gorm.DB, func(), error) {
	client, err := database.Default.NewClient()
	ctx := context.Background()
	if err != nil {
		log.WithContext(ctx).Errorf("open mysql failed, err: %v", err)
		return nil, nil, err
	}
	//添加插件
	if err = client.Use(otelgorm.NewPlugin()); err != nil {
		log.WithContext(ctx).Errorf("init db otelgorm, err: %v\n", err.Error())
		return nil, nil, err
	}
	//添加初始化数据
	if err = initDBData(ctx, client); err != nil {
		log.WithContext(ctx).Errorf("init db data failed, err: %v\n", err.Error())
		return nil, nil, err
	}
	return client, gormx.ReleaseFunc(client), nil
}

type Database struct {
	Default  options.DBOptions `json:"default"`
	Default1 options.DBOptions `json:"default1"`
}

func initDBApi(ctx context.Context, database *Database) error {
	fileSource := "file:/usr/local/bin/af/infrastructure/repository/db/gen/migration"
	dns := fmt.Sprintf("mysql://%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", database.Default.Username, database.Default.Password, database.Default.Host, database.Default.Database)

	m, err := migrate.New(
		fileSource,
		dns)
	if err != nil {
		log.WithContext(ctx).Errorf("migrate.New err: %v\n", err.Error())
		return err
	}
	err = m.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Info(err.Error())
			return nil
		}
		log.WithContext(ctx).Errorf(" m.Up() err: %v\n", err.Error())
		return err
	}
	return nil
}
func initDBData(ctx context.Context, DB *gorm.DB) error {
	if runtime.GOOS == "windows" { //本地调试不同步数据
		return nil
	}
	log.WithContext(ctx).Info("InitTCPermissions")
	permission := permissions.NewPermissions(impl2.NewResourceRepo(DB))
	err := permission.InitTCPermissions(context.Background())
	if err != nil {
		log.WithContext(ctx).Errorf("permission InitTCPermissions failed,err:", err)
		return err
	}
	log.Info("info_system Migration")
	infoSystemUseCase := info_system.NewInfoSystemUseCaseWithRepoOnly(impl.NewInfoSystemRepo(DB))
	if err = infoSystemUseCase.Migration(context.Background()); err != nil {
		log.WithContext(ctx).Errorf("info_system Migration failed,err:", err)
		return err
	}
	/*log.Info("task Migration")
	flowchartUseCase := flowchart.NewFlowchartUseCase(nil, impl4.NewFlowchartVersionRepoNative(DB), nil, nil, impl3.NewFlowchartNodeTaskNative(DB), nil, nil, nil)
	if err = flowchartUseCase.Migration(context.Background()); err != nil {
		log.WithContext(ctx).Errorf("task Migration failed,err:", err)
		return err
	}*/

	log.WithContext(ctx).Info("upgrade persistent data", zap.String("domain", "code generation rule"))
	{
		codeRepo := gorm_code.NewCodeGenerationRuleRepo(DB)
		userRepo := gorm_user.NewUserRepo(DB)
		uc := code_generation_rule.NewCodeGenerationRuleUseCase(codeRepo, userRepo)
		if err := uc.Upgrade(ctx); err != nil {
			return err
		}
	}
	// 初始化菜单
	menuUseCase := menu_impl.InitMenuCase(menu_repo.NewMenuRepo(DB))
	menuReq := menu.SetMenusReq{}
	data, err := os.ReadFile("cmd/server/static/menu.json")
	if err != nil {
		log.Fatalf("无法读取menu.json文件: %v", err)
		return err
	}
	if err = json.Unmarshal(data, &menuReq); err != nil {
		return err
	}
	if err = menuUseCase.SetMenus(ctx, menuReq); err != nil {
		return err
	}
	return nil
}
