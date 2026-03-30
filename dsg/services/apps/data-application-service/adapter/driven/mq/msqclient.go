// Package msqclient is a wrapper library for several message queue (msq) client libraries.
//
// client API for different msq may differ quite a lot,
// some msq client api is way too complicated to use it directly in application code, e.g. tlq
// This package meant to wrap several complicated api calls into a simpified one, for some commonly used api
package mq

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type MessageHandler func(msg []byte) error

// ProtonMQClient interface for simplified & commonly-used apis
type ProtonMQClient interface {
	// Pub send a message to the specified topic of msq
	Pub(topic string, msg []byte) error

	// Sub start consumers to subscribe and process message from specified topic/nsqChannel from the msg, the call would run
	// forever until the program is terminated
	Sub(topic string, channel string, handler MessageHandler, pollIntervalMilliseconds int64, maxInFlight int, opts ...SubOpt) error

	Close()
}

// region 客户端连接可选参数定义

type ClientOpt func(client ProtonMQClient) error

// Set username and password for auth. Currently only supports for Kafka client.
func UserInfo(user, passwd string) ClientOpt {
	return func(client ProtonMQClient) error {
		switch (interface{})(client).(type) {
		case *ProtonKafkaClient:
			client.(*ProtonKafkaClient).username = user
			client.(*ProtonKafkaClient).password = passwd
			return nil
		default:
			return nil
		}
	}
}

// Mechanism of authentication, support `PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`. Currently only supports for proton Kafka client.
func AuthMechanism(mechanism string) ClientOpt {
	return func(client ProtonMQClient) error {
		switch (interface{})(client).(type) {
		case *ProtonKafkaClient:
			if _, ok := map[string]struct{}{"PLAIN": {}, "SCRAM-SHA-256": {}, "SCRAM-SHA-512": {}}[strings.ToUpper(mechanism)]; !ok {
				err := fmt.Errorf("unsupported mechanism[%s] for kafka client.", mechanism)
				log.Println(err)
				return err
			}
			client.(*ProtonKafkaClient).mechanismProtocol = strings.ToUpper(mechanism)
			return nil
		default:
			return nil
		}
	}
}

// Load client certificate and key from certFile and keyFile into tlsConfig
func clientCert(tlsConfig *tls.Config, certFile, keyFile string) error {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return fmt.Errorf("error loading client certificate: %w", err)
	}
	cert.Leaf, err = x509.ParseCertificate(cert.Certificate[0])
	if err != nil {
		return fmt.Errorf("error parsing client certificate: %w", err)
	}
	if tlsConfig == nil {
		tlsConfig.MinVersion = tls.VersionTLS12
	}
	tlsConfig.Certificates = []tls.Certificate{cert}
	return nil
}

// Load root certificate from caFile into tlsConfig
func rootCAs(tlsConfig *tls.Config, caFile string) error {
	caCrt, err := os.ReadFile(caFile)
	if err != nil || caCrt == nil {
		return fmt.Errorf("error loading or parsing rootCA file: %w", err)
	}
	if ok := tlsConfig.RootCAs.AppendCertsFromPEM(caCrt); !ok {
		return fmt.Errorf("failed to parse root certificate from %q", caFile)
	}
	return nil
}

// If you are using a self-signed certificate for server,
// you need to set the absolute path of ca certificate file.
func RootCAs(caFile string) ClientOpt {
	return func(client ProtonMQClient) error {
		switch (interface{})(client).(type) {
		case *ProtonKafkaClient:
			if err := rootCAs(client.(*ProtonKafkaClient).tlsConfig, caFile); err != nil {
				return err
			}
		default:
			return nil
		}
		return nil
	}
}

// ClientCert is a helper option to provide the client certificate from a file.
func ClientCert(certFile, keyFile string) ClientOpt {
	return func(client ProtonMQClient) error {
		switch (interface{})(client).(type) {
		case *ProtonKafkaClient:
			if err := clientCert(client.(*ProtonKafkaClient).tlsConfig, certFile, keyFile); err != nil {
				return err
			}
		default:
			return nil
		}
		return nil
	}
}

// endregion

// region Sub 函数可选参数
type subOption struct {
	ackAsync bool // 异步确认, 先确认再消费消息, 默认值: false
}

type SubOpt func(opt *subOption) error

// set ackAsync to true
func AckAsync() SubOpt {
	return func(opt *subOption) error {
		opt.ackAsync = true
		return nil
	}
}

// endregion

type NewClienFn func(pubServer string, pubPort int, subServer string, subPort int) ProtonMQClient

// new client factory
var ncfFactory map[string]NewClienFn

func init() {
	ncfFactory = make(map[string]NewClienFn, 5)
	ncfFactory["nsq"] = NewNSQClient
	//ncfFactory["tonglink"] = NewTLQClient
	//ncfFactory["bmq"] = NewBMQClient
	ncfFactory["kafka"] = NewKafkaClient
	//ncfFactory["htp20"] = NewTLQHTP2Client
}

// NewProtonMQClient create a msq connector for specified msqType
func NewProtonMQClient(pubServer string, pubPort int, subServer string, subPort int, msqType string, opts ...ClientOpt) (ProtonMQClient, error) {
	if fn, ok := ncfFactory[msqType]; !ok {
		err := fmt.Errorf("unknown msq type %v", msqType)
		return nil, err
	} else {
		client := fn(pubServer, pubPort, subServer, subPort)
		for _, opt := range opts {
			if e := opt(client); e != nil {
				return nil, e
			}
		}
		return client, nil
	}
}

// config file struct define
type ProtonMQInfo struct {
	Host        string    `json:"mqHost" yaml:"mqHost"`
	Port        int       `json:"mqPort" yaml:"mqPort"`
	LookupdHost string    `json:"mqLookupdHost" yaml:"mqLookupdHost"`
	LookupdPort int       `json:"mqLookupdPort" yaml:"mqLookupdPort"`
	MQType      string    `json:"mqType" yaml:"mqType"`
	Auth        *AuthOpts `json:"auth,omitempty" yaml:"auth,omitempty"`
}

// Auth 信息
type AuthOpts struct {
	Username  string `json:"username" yaml:"username"`
	Password  string `json:"password" yaml:"password"`
	Mechanism string `json:"mechanism" yaml:"mechanism"`
}

// Create ProtonMQClient by reading infomations from config file.
func NewProtonMQClientFromFile(configFile string) (ProtonMQClient, error) {
	fp, _ := filepath.Abs(configFile)
	if _, err := os.Stat(fp); err != nil {
		return nil, err
	}
	info := new(ProtonMQInfo)
	config, err := os.ReadFile(fp)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(config, info)
	if err != nil {
		return nil, err
	}
	var opts []ClientOpt
	if info.Auth != nil {
		opts = append(opts, AuthMechanism(info.Auth.Mechanism), UserInfo(info.Auth.Username, info.Auth.Password))
	}
	return NewProtonMQClient(info.Host, info.Port, info.LookupdHost, info.LookupdPort, info.MQType, opts...)
}

func parseHost(host string) string {
	if strings.Contains(host, ":") {
		return fmt.Sprintf("[%s]", host)
	}
	return host
}
