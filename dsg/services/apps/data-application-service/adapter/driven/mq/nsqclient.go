package mq

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nsqio/go-nsq"
)

// ProtonNSQClient implement msq client interfaces base on nsq client library
type ProtonNSQClient struct {
	pubHTTPServer        string
	httpclient           *http.Client
	subLookupDHTTPServer string
}

// region deprecated
/*
// messageHandler implement nsq message handler interfaces
type messageHandler struct {
	handler func([]byte) error
}

// messageHandler.HandleMessage forward the message body to callback registered.
func (this *messageHandler) HandleMessage(m *nsq.Message) error {
	done := make(chan int)
	defer close(done)
	t := time.NewTicker(time.Second * 30)
	defer t.Stop()
	go func(msg *nsq.Message) {
		for {
			select {
			case <-t.C:
				log.Println("Touch message: ", msg.ID)
				msg.Touch()
			case <-done:
				return
			}
		}
	}(m)
	return this.handler(m.Body)
}
*/
// endregion

func (this *ProtonNSQClient) Close() {}

// NewNSQClient create a nsq client
//
// pubServer:pubPort should be nsqd http ip:port or [ip]:port
// subServer:subPort should be nsqlookupd http ip:port or [ip]:port
func NewNSQClient(pubServer string, pubPort int, subServer string, subPort int) ProtonMQClient {
	return &ProtonNSQClient{
		pubHTTPServer: fmt.Sprintf("http://%s:%d", parseHost(pubServer), pubPort),
		httpclient: &http.Client{
			Transport: &http.Transport{
				DialContext:           (&net.Dialer{Timeout: 2 * time.Second, KeepAlive: 3 * time.Second}).DialContext,
				ForceAttemptHTTP2:     true,
				MaxIdleConns:          100,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			},
			Timeout: 3 * time.Second,
		},
		subLookupDHTTPServer: fmt.Sprintf("%s:%d", parseHost(subServer), subPort),
	}
}

func (this *ProtonNSQClient) createTopic(topic string) {
	log.Println("Try to create new topic", topic)
	for {
		body := bytes.NewBuffer([]byte(""))
		req, err := http.NewRequest("POST", fmt.Sprintf("%s/topic/create?topic=%s", this.pubHTTPServer, topic), body)
		if err == nil {
			req.Header.Set("User-Agent", "protonmsq.nsqwrapper")
			req.Header.Set("Content-Type", "application/octet-stream")
			resp, err := this.httpclient.Do(req)
			if err == nil {
				_, _ = io.Copy(ioutil.Discard, resp.Body)
				resp.Body.Close()
				if resp.StatusCode == 200 {
					return
				}
				log.Println("Fail to create topic, server response:", resp)
			} else {
				log.Println("Fail to make http request:", err)
			}
		} else {
			log.Println("Fail to create http request:", err)
		}
		// retry after second
		time.Sleep(time.Second)
	}
}

func (this *ProtonNSQClient) createTopicChannel(topic string, channel string) {
	log.Println("Try to create new nsqChannel", channel, topic)
	for {
		body := bytes.NewBuffer([]byte(""))
		req, err := http.NewRequest("POST", fmt.Sprintf("http://%s/channel/create?topic=%s&channel=%s", this.subLookupDHTTPServer, topic, channel), body)
		if err == nil {
			req.Header.Set("User-Agent", "protonmsq.nsqwrapper")
			req.Header.Set("Content-Type", "application/octet-stream")
			resp, err := this.httpclient.Do(req)
			if err == nil {
				_, _ = io.Copy(ioutil.Discard, resp.Body)
				resp.Body.Close()
				if resp.StatusCode == 200 {
					return
				}
				log.Println("Fail to create nsqChannel, server response:", resp)
			} else {
				log.Println("Fail to make http request:", err)
			}
		} else {
			log.Println("Fail to create http request:", err)
		}
		// retry after second
		time.Sleep(time.Second)
	}
}

// region core methods: pub, sub

// ProtonNSQClient.Pub send message to the specified topic on nsq server.
//
// Using nsq http api
func (this *ProtonNSQClient) Pub(topic string, msg []byte) error {
	body := bytes.NewBuffer(msg)
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/pub?topic=%s", this.pubHTTPServer, topic), body)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "protonmsq.nsqwrapper")
	req.Header.Set("Content-Type", "application/octet-stream")
	resp, err := this.httpclient.Do(req)
	if err != nil {
		return err
	}
	_, _ = io.Copy(ioutil.Discard, resp.Body)
	resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("Receive unexpected http status code %d", resp.StatusCode)
	}
	return nil
}

// ProtonNSQClient.Sub start a blocking rounting, constantly polling message from nsq and forward the message to the registered handler
//
// pollIntervalMilliseconds in ms, control the interval of polling process, should be in range [1, 1000]
// maxInFlight control the concurrency the message handler, should be in range [1 256]
func (this *ProtonNSQClient) Sub(topic string, channel string, handler MessageHandler, pollIntervalMilliseconds int64, maxInFlight int, opts ...SubOpt) error {
	// create topic/nsqChannel first
	this.createTopic(topic)
	this.createTopicChannel(topic, channel)
	log.Println("start new consumer", topic, channel)

	cfg := nsq.NewConfig()
	cfg.MaxAttempts = 65535
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	cfg.UserAgent = "protonmsq-nsqwrapper"
	cfg.MaxInFlight = maxInFlight
	if pollIntervalMilliseconds < 1 {
		pollIntervalMilliseconds = 1
	}
	if pollIntervalMilliseconds > 1000 {
		pollIntervalMilliseconds = 1000
	}
	cfg.LookupdPollInterval = time.Duration(pollIntervalMilliseconds) * time.Millisecond

	consumer, err := nsq.NewConsumer(topic, channel, cfg)
	if err != nil {
		return err
	}
	consumer.SetLoggerLevel(nsq.LogLevelError)

	concurrency := maxInFlight
	if concurrency > 256 {
		concurrency = 256
	}
	if concurrency < 1 {
		concurrency = 1
	}

	// 创建context用于控制goroutine
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 改进的nsqMsgHandler，支持context控制
	consumer.AddConcurrentHandlers(nsqMsgHandler(handler, ctx), concurrency)

	err = consumer.ConnectToNSQLookupds([]string{this.subLookupDHTTPServer})
	if err != nil {
		return err
	}

	// 等待停止信号
	<-sigChan
	fmt.Println("consumer terminating....")

	// 优雅关闭：先取消context，再停止consumer
	cancel()
	consumer.Stop()
	fmt.Println("wait on consumer....")
	<-consumer.StopChan
	fmt.Println("graceful shutdown done")
	return nil
}

// endregion

// 改进的nsqMsgHandler，支持context控制和优雅退出
func nsqMsgHandler(h MessageHandler, ctx context.Context) nsq.Handler {
	return nsq.HandlerFunc(func(m *nsq.Message) error {
		// 添加panic恢复
		defer func() {
			if r := recover(); r != nil {
				log.Printf("nsqMsgHandler panic recovered: %v", r)
			}
		}()

		done := make(chan struct{})
		defer close(done)

		// 创建带超时的timer，防止goroutine泄漏
		t := time.NewTicker(time.Second * 30)
		defer t.Stop()

		// 启动消息touch goroutine，支持优雅退出
		go func(msg *nsq.Message) {
			for {
				select {
				case <-t.C:
					log.Println("Touch message: ", msg.ID)
					msg.Touch()
				case <-done:
					log.Println("Message touch goroutine exiting")
					return
				case <-ctx.Done():
					log.Println("Message touch goroutine cancelled by context")
					return
				}
			}
		}(m)

		// 添加超时控制，防止消息处理卡死
		msgCtx, msgCancel := context.WithTimeout(ctx, 5*time.Minute)
		defer msgCancel()

		// 创建带缓冲的channel用于错误处理
		errCh := make(chan error, 1)

		// 在goroutine中执行消息处理，支持超时控制
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Message handler panic recovered: %v", r)
					errCh <- fmt.Errorf("handler panic: %v", r)
				}
			}()

			err := h(m.Body)
			errCh <- err
		}()

		// 等待消息处理完成或超时
		select {
		case err := <-errCh:
			return err
		case <-msgCtx.Done():
			log.Printf("Message processing timeout for message ID: %s", m.ID)
			return fmt.Errorf("message processing timeout")
		}
	})
}
