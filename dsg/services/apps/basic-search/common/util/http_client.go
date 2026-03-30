package util

import (
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

var client *http.Client = &http.Client{
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	},
	Transport: &http.Transport{
		TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		MaxIdleConnsPerHost:   100,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	},
	Timeout: 10 * time.Second,
}

func DoHttpGet(strUrl string, header http.Header, vals url.Values) ([]byte, error) {
	if vals != nil {
		strUrl = fmt.Sprintf("%s?%s", strUrl, vals.Encode())
	}

	req, err := http.NewRequest(http.MethodGet, strUrl, nil)
	if err != nil {
		return nil, err
	}

	if header != nil {
		req.Header = header
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	var buf []byte
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.Error("DoHttpGet", zap.Error(closeErr))

		}
	}()
	buf, err = io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New(BytesToString(buf))
	}

	return buf, nil
}
