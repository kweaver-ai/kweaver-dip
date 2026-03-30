package opensearch

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/olivere/elastic/v7"
)

type SearchClient struct {
	ReadClient  *elastic.Client
	WriteClient *elastic.Client
}

func NewOpenSearchClient(appCfg *settings.Config) (*SearchClient, error) {
	ctx := context.Background()
	readCli, err := createReadClient(ctx, appCfg)
	if err != nil {
		return nil, err
	}

	writeCli, err := createWriteClient(ctx, appCfg)
	if err != nil {
		return nil, err
	}

	return &SearchClient{
		ReadClient:  readCli,
		WriteClient: writeCli,
	}, nil
}

func createReadClient(ctx context.Context, appCfg *settings.Config) (*elastic.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	readCli, err := elastic.DialContext(ctx,
		elastic.SetURL(appCfg.OpenSearchConf.ReadUri),
		elastic.SetBasicAuth(appCfg.OpenSearchConf.Username, appCfg.OpenSearchConf.Password),
		elastic.SetSniff(appCfg.OpenSearchConf.Sniff),
		elastic.SetHealthcheck(appCfg.OpenSearchConf.Healthcheck),
		elastic.SetTraceLog(getTraceLog()),
		elastic.SetInfoLog(getInfoLog()),
		elastic.SetErrorLog(getErrorLog()),
	)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create opensearch read client, err: %v", err)
		return nil, err
	}

	return readCli, nil
}

func createWriteClient(ctx context.Context, appCfg *settings.Config) (*elastic.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	writeCli, err := elastic.DialContext(ctx,
		elastic.SetURL(appCfg.OpenSearchConf.ReadUri),
		elastic.SetBasicAuth(appCfg.OpenSearchConf.Username, appCfg.OpenSearchConf.Password),
		elastic.SetSniff(appCfg.OpenSearchConf.Sniff),
		elastic.SetHealthcheck(appCfg.OpenSearchConf.Healthcheck),
		elastic.SetTraceLog(getTraceLog()),
		elastic.SetInfoLog(getInfoLog()),
		elastic.SetErrorLog(getErrorLog()),
	)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create opensearch write client, err: %v", err)
		return nil, err
	}

	return writeCli, nil
}
