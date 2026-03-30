package mq

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/avast/retry-go"
	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl"
	"github.com/segmentio/kafka-go/sasl/plain"
	"github.com/segmentio/kafka-go/sasl/scram"
)

const (
	Plain       = "PLAIN"
	ScramSHA256 = "SCRAM-SHA-256"
	ScramSHA512 = "SCRAM-SHA-512"
)

type ProtonKafkaClient struct {
	username string
	password string
	// Currently only support `PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`
	mechanismProtocol string
	saslMechanism     sasl.Mechanism
	tlsConfig         *tls.Config
	brokers           []string
	w                 map[string]*kafka.Writer
	// 新增：用于控制消费者停止
	ctx    context.Context
	cancel context.CancelFunc
	mu     sync.RWMutex
}

func NewKafkaClient(pubServer string, pubPort int, subServer string, subPort int) ProtonMQClient {
	addrs := strings.Split(strings.TrimSpace(pubServer), ",")
	brokers := make([]string, 0, len(addrs))
	for _, addr := range addrs {
		brokers = append(brokers, fmt.Sprintf("%s:%d", parseHost(addr), pubPort))
	}
	return &ProtonKafkaClient{
		brokers: brokers,
		w:       make(map[string]*kafka.Writer),
	}
}

func (kc *ProtonKafkaClient) initialize() (err error) {
	if kc.saslMechanism != nil {
		return
	}
	var m sasl.Mechanism
	switch kc.mechanismProtocol {
	case ScramSHA256:
		m, err = scram.Mechanism(scram.SHA256, kc.username, kc.password)
		if err != nil {
			return
		}
	case ScramSHA512:
		m, err = scram.Mechanism(scram.SHA512, kc.username, kc.password)
		if err != nil {
			return
		}
	case Plain:
		m = plain.Mechanism{Username: kc.username, Password: kc.password}
	default:
	}
	kc.saslMechanism = m
	return
}

// GetWriter 获取一个 Writer 实例
func (kc *ProtonKafkaClient) GetWriter(topic string) *kafka.Writer {

	kc.mu.RLock()
	if writer, exists := kc.w[topic]; exists {
		kc.mu.RUnlock()
		return writer
	}
	kc.mu.RUnlock()

	// 创建新的 Writer
	writer := &kafka.Writer{
		Addr:  kafka.TCP(kc.brokers...),
		Topic: topic,
		Transport: &kafka.Transport{
			TLS:  kc.tlsConfig,
			SASL: kc.saslMechanism,
		},
		AllowAutoTopicCreation: true,
	}

	kc.mu.Lock()
	kc.w[topic] = writer
	kc.mu.Unlock()

	return writer
}

func (kc *ProtonKafkaClient) Pub(topic string, msg []byte) (err error) {
	if err = kc.initialize(); err != nil {
		log.Printf("init kafka writer failed: %v", err)
		return
	}

	// 从连接池获取 Writer 实例
	w := kc.GetWriter(topic)
	maxAttempts := uint(200)
	// 最长重试阻塞时间：10s
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return retry.Do(
		func() error {
			return w.WriteMessages(context.Background(), kafka.Message{Value: msg})
		},
		retry.Attempts(maxAttempts),
		retry.Delay(500*time.Millisecond),
		retry.OnRetry(func(n uint, err error) {
			if n > 0 {
				log.Printf("failed to write msg - %v, retry %d times ...", err, n)
			}
		}),
		retry.RetryIf(func(err error) bool { return err != nil }),
		retry.MaxDelay(1*time.Second),
		retry.Context(ctx),
		retry.LastErrorOnly(true),
	)
}

func (kc *ProtonKafkaClient) Sub(topic string, channel string, handler MessageHandler, pollIntervalMilliseconds int64, maxInFlight int, opts ...SubOpt) (err error) {

	if err = kc.initialize(); err != nil {
		return
	}

	// 创建context用于控制消费者
	kc.mu.Lock()
	kc.ctx, kc.cancel = context.WithCancel(context.Background())
	kc.mu.Unlock()

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  kc.brokers,
		GroupID:  channel,
		Topic:    topic,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
		Dialer: &kafka.Dialer{
			TLS:           kc.tlsConfig,
			SASLMechanism: kc.saslMechanism,
			Timeout:       10 * time.Second,
		},
	})
	defer r.Close()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

	// 用于等待goroutine完成的WaitGroup
	var wg sync.WaitGroup
	wg.Add(1)

	// 启动消息消费goroutine
	go func() {
		defer wg.Done()

		// 添加panic恢复
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Kafka consumer panic recovered: %v", r)
			}
		}()

		for {
			// 检查是否收到停止信号
			select {
			case <-kc.ctx.Done():
				log.Println("Kafka consumer received stop signal")
				return
			default:
				// 继续处理消息
			}

			// 创建带超时的context用于消息获取
			fetchCtx, fetchCancel := context.WithTimeout(kc.ctx, 30*time.Second)

			m, err := r.FetchMessage(fetchCtx)
			fetchCancel()

			if err != nil {
				if kc.ctx.Err() != nil {
					// context被取消，退出循环
					log.Println("Kafka consumer context cancelled")
					return
				}
				log.Printf("read message failed: %+v", err)
				// 短暂等待后重试
				time.Sleep(1 * time.Second)
				continue
			}

			// 处理消息，添加超时控制
			processCtx, processCancel := context.WithTimeout(kc.ctx, 5*time.Minute)

			// 创建带缓冲的channel用于错误处理
			errCh := make(chan error, 1)

			go func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Message handler panic recovered: %v", r)
						errCh <- fmt.Errorf("handler panic: %v", r)
					}
				}()

				err := handler(m.Value)
				errCh <- err
			}()

			// 等待消息处理完成或超时
			select {
			case err := <-errCh:
				processCancel()
				if err == nil {
					// 消息处理成功，提交offset
					commitCtx, commitCancel := context.WithTimeout(kc.ctx, 10*time.Second)
					if err := r.CommitMessages(commitCtx, m); err != nil {
						log.Printf("commit msg err: topic: %s, partition: %d, offset: %d", m.Topic, m.Partition, m.Offset)
					}
					commitCancel()
				} else {
					log.Printf("message processing failed: %v", err)
				}
			case <-processCtx.Done():
				processCancel()
				log.Printf("Message processing timeout for topic: %s, partition: %d, offset: %d", m.Topic, m.Partition, m.Offset)
			}
		}
	}()

	// 等待停止信号
	<-sigChan
	log.Println("wait for consumer completed.")

	// 优雅关闭：先取消context，再等待goroutine完成
	kc.mu.Lock()
	if kc.cancel != nil {
		kc.cancel()
	}
	kc.mu.Unlock()

	// 等待goroutine完成
	wg.Wait()
	log.Println("Kafka consumer gracefully stopped")
	return
}

func (kc *ProtonKafkaClient) Close() {
	kc.mu.Lock()
	defer kc.mu.Unlock()

	if kc.cancel != nil {
		kc.cancel()
	}
}
