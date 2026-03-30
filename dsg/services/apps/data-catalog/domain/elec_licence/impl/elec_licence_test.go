package impl

import (
	"fmt"
	"testing"
	"time"

	"github.com/Shopify/sarama"
	impl15 "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es/impl"
	classify "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/classify/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence/impl"
	elec_licence_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence_column/impl"
	"golang.org/x/net/context"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestElecLicenceDomain_aaa(t *testing.T) {
	db, err := gorm.Open(mysql.Open("root:***@(10.4.109.185:3330)/af_data_catalog?charset=utf8mb4&parseTime=True&loc=Local"))
	if err != nil {
		panic(fmt.Errorf("cannot establish db connection: %w", err))
	}

	conf := sarama.NewConfig()
	conf.Producer.Timeout = 100 * time.Millisecond
	conf.Net.SASL.Enable = true
	conf.Net.SASL.Mechanism = sarama.SASLTypePlaintext
	conf.Net.SASL.User = "kafkaclient"
	conf.Net.SASL.Password = "***"
	conf.Net.SASL.Handshake = true
	conf.Producer.Return.Successes = true
	conf.Producer.Return.Errors = true
	syncProducer, err := sarama.NewSyncProducer([]string{"10.4.109.185:31000"}, conf)
	if err != nil {
		panic(err)
	}
	domain := &ElecLicenceDomain{
		elecLicenceRepo:       impl.NewElecLicenceRepo(db),
		elecLicenceColumnRepo: elec_licence_column.NewElecLicenceColumnRepo(db),
		classify:              classify.NewClassifyRepo(db),
		es:                    impl15.NewESRepo(syncProducer, nil, nil, nil),
	}
	t.Log(domain.Import(context.Background(), nil))
}

func TestElecLicenceDomain_create(t *testing.T) {
	db, err := gorm.Open(mysql.Open("root:***@(10.4.109.185:3330)/af_data_catalog?charset=utf8mb4&parseTime=True&loc=Local"))
	if err != nil {
		panic(fmt.Errorf("cannot establish db connection: %w", err))
	}
	domain := &ElecLicenceDomain{
		elecLicenceRepo:       impl.NewElecLicenceRepo(db),
		elecLicenceColumnRepo: elec_licence_column.NewElecLicenceColumnRepo(db),
		classify:              classify.NewClassifyRepo(db),
	}
	t.Log(domain.CreateClassify(context.Background()))
}

func TestElecLicenceDomain_bbbe(t *testing.T) {
	db, err := gorm.Open(mysql.Open("root:***@(10.4.109.185:3330)/af_data_catalog?charset=utf8mb4&parseTime=True&loc=Local"))
	if err != nil {
		panic(fmt.Errorf("cannot establish db connection: %w", err))
	}
	domain := &ElecLicenceDomain{
		elecLicenceRepo:       impl.NewElecLicenceRepo(db),
		elecLicenceColumnRepo: elec_licence_column.NewElecLicenceColumnRepo(db),
		classify:              classify.NewClassifyRepo(db),
	}
	t.Log(domain.Import(context.Background(), nil))
}
