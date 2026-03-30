package oss_gateway

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
)

var (
	cephClientOnce      sync.Once
	cephClientSingleton CephClient
)

type CephClient interface {
	Upload(id string, data []byte) (err error)
	MultiUpload(id string, file *os.File) (err error)
	Down(id string) (data []byte, err error)
	DownloadLink(id, saveas string) (url string, err error)
	Delete(id string) (err error)
}

type FormField struct{}

// type Headers struct {
// 	Authorization string `json:"Authorization"`
// 	ContentType   string `json:"Content-Type"`
// 	XAmzDate      string `json:"x-amz-date"`
// 	XObsDate      string `json:"x-obs-date"`
// }

type Headers map[string]string

type UploadInfo struct {
	FormField   FormField `json:"form_field"`
	Headers     Headers   `json:"headers"`
	Method      string    `json:"method"`
	RequestBody string    `json:"request_body"`
	Url         string    `json:"url"`
	PartSize    int64     `json:"part_size,string"`
	UploadID    string    `json:"upload_id"`
}

type cephClient struct {
	addr       string // oss addr
	protocol   string // oss protocol
	is_default string // oss_is_default
	bucket     string // oss bucket
	app        string // oss app
	httpClient *http.Client
}

type bucketInfo struct {
	AccessId           string `json:"accessId"`
	AccessKey          string `json:"accessKey"`
	CdnName            string `json:"cdnName"`
	HttpPort           int    `json:"httpPort"`
	HttpsPort          int    `json:"httpsPort"`
	InternalServerName string `json:"internalServerName"`
	Name               string `json:"name"`
	Provider           string `json:"provider"`
	ProviderDetail     string `json:"providerDetail"`
	ServerName         string `json:"serverName"`
}
type StorageInfo struct {
	StorageName    string     `json:"storageName"`
	StorageId      string     `json:"storageId"`
	SiteId         string     `json:"siteId"`
	OssgwPort      string     `json:"ossgwPort"`
	OssgwHttpsPort string     `json:"ossgwHttpsPort"`
	OssgwHost      string     `json:"ossgwHost"`
	IsDefault      bool       `json:"isDefault"`
	IsCacheBucket  bool       `json:"isCacheBucket"`
	InternalgwPort string     `json:"internalgwPort"`
	InternalgwHost string     `json:"internalgwHost"`
	HasOSSGW       bool       `json:"hasOSSGW"`
	Enabled        bool       `json:"enabled"`
	App            string     `json:"app"`
	t              bucketInfo `json:"bucketInfo"`
}

func NewCephClient(httpClient *http.Client) (CephClient, error) {
	var err error
	cephClientOnce.Do(func() {
		var app, addr, protocol, is_default, bucket string
		if app = os.Getenv("OSS_APP"); app == "" {
			err = errors.New("need to set $OSS_APP")
			return
		}
		if addr = os.Getenv("OSS_HOST"); addr == "" {
			err = errors.New("need to set $OSS_HOST")
			return
		}
		if protocol = os.Getenv("OSS_PROTOCOL"); protocol == "" {
			err = errors.New("need to set $OSS_PROTOCOL")
			return
		}

		if is_default = os.Getenv("OSS_IS_DEFAULT"); is_default == "" {
			err = errors.New("need to set $IS_DEFAULT")
			return
		}
		if bucket = os.Getenv("OSS_BUCKET"); bucket == "" {
			err = errors.New("need to set $BUCKET")
			return
		}
		cephClientSingleton = &cephClient{
			app:        app,
			addr:       addr,
			protocol:   protocol,
			is_default: is_default,
			bucket:     bucket,
			httpClient: httpClient,
		}
	})

	return cephClientSingleton, err
}

func (c *cephClient) SignRequest(req *http.Request, info *UploadInfo) {
	for k, v := range info.Headers {
		req.Header.Set(k, v)
	}
	// if len(info.Headers.XAmzDate) > 0 {
	// 	req.Header.Set("x-amz-date", info.Headers.XAmzDate)
	// }
	// if len(info.Headers.Authorization) > 0 {
	// 	req.Header.Set("Authorization", info.Headers.Authorization)
	// }
	// if len(info.Headers.ContentType) > 0 {
	// 	req.Header.Set("Content-Type", info.Headers.ContentType)
	// }
}

func (c *cephClient) CreateRequest(objID string, method string, url string) *http.Request {
	req, _ := http.NewRequest(method, url, nil)
	return req
}

func (c *cephClient) GetStorageId(addr string, isDefault string, app string, bucket string, protocol string) string {
	url := protocol + "://" + addr + "/api/ossgateway/v1/objectstorageinfo?isCache=false"
	reqest, _ := http.NewRequest("GET", url, nil)
	resp, err := c.httpClient.Do(reqest)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return ""
	}
	res := make([]StorageInfo, 0)
	if err = json.Unmarshal(body, &res); err != nil {
		return ""
	}
	for i := range res {
		is_defalut := strconv.FormatBool(res[i].IsDefault)
		if is_defalut == isDefault && res[i].t.Name == bucket || res[i].App == app {
			return res[i].StorageId
		}
	}
	return ""
}

func (c *cephClient) GetInfo(storage_id, file, method, addr, uploadID, saveas string, size, partID int64) (*UploadInfo, error) {
	var urlStr string
	if method == "upload" {
		urlStr = "http" + "://" + addr + "/api/ossgateway/v1/upload/" + storage_id + "/" + file + "?request_method=PUT"
	} else if method == "download" {
		urlStr = "http" + "://" + addr + "/api/ossgateway/v1/" + "download/" + storage_id + "/" + file
	} else if method == "init-multiupload" {
		urlStr = fmt.Sprintf("http://%s/api/ossgateway/v1/initmultiupload/%s/%s?size=%d", addr, storage_id, file, size)
	} else if method == "multiupload" {
		urlStr = fmt.Sprintf("http://%s/api/ossgateway/v1/uploadpart/%s/%s?part_id=%d&upload_id=%s", addr, storage_id, file, partID, url.QueryEscape(uploadID))
	} else if method == "download-link" {
		urlStr = fmt.Sprintf("http://%s/api/ossgateway/v1/download/%s/%s?type=query_string&save_name=%s&response-content-type=application%%2Foctet-stream", addr, storage_id, file, saveas)
	} else if method == "delete" {
		urlStr = fmt.Sprintf("http://%s/api/ossgateway/v1/delete/%s/%s", addr, storage_id, file)
	} else {
		return nil, errors.New("get info only support get or head")
	}

	reqest, _ := http.NewRequest("GET", urlStr, nil)
	resp, err := c.httpClient.Do(reqest)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	var res *UploadInfo
	if method != "multiupload" {
		res = new(UploadInfo)
		if err = json.Unmarshal(body, res); err != nil {
			return nil, err
		}
	} else {
		var result map[string]*UploadInfo
		if err = json.Unmarshal(body, &result); err != nil {
			return nil, err
		}
		res = result[strconv.FormatInt(partID, 10)]
	}

	return res, nil
}

func (c *cephClient) CompleteMultiupload(storage_id, file, addr, uploadID string, etags []string) error {
	url := fmt.Sprintf("http://%s/api/ossgateway/v1/completeupload/%s/%s?upload_id=%s", addr, storage_id, file, uploadID)
	m := make(map[string]string, len(etags))
	for i := range etags {
		m[strconv.Itoa(i+1)] = etags[i]
	}
	buf, err := json.Marshal(m)
	if err != nil {
		return err
	}

	var (
		req  *http.Request
		resp *http.Response
	)
	if req, err = http.NewRequest(http.MethodPost, url, bytes.NewBuffer(buf)); err != nil {
		return err
	}
	if resp, err = c.httpClient.Do(req); err != nil {
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fail get complete multiupload info, statusCode: %d", resp.StatusCode)
	}

	buf, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	resp.Body.Close()
	res := new(UploadInfo)
	if err = json.Unmarshal(buf, res); err != nil {
		return err
	}

	req = nil
	resp = nil
	if req, err = http.NewRequest(res.Method, res.Url, bytes.NewBufferString(res.RequestBody)); err != nil {
		return err
	}
	c.SignRequest(req, res)
	if resp, err = c.httpClient.Do(req); err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fail complete multiupload, statusCode: %d", resp.StatusCode)
	}
	return nil
}

/*
1、get storage_id from oss;
2、get upload info from oss
3、put byte to oss
*/
func (c *cephClient) Upload(id string, data []byte) (err error) {
	if data == nil {
		return errors.New("data cannot be null")
	}
	addr := c.addr
	isDefault := c.is_default
	app := c.app
	bucket := c.bucket
	protocol := c.protocol
	if addr == "" {
		return errors.New("fail get addr from config")
	}
	storage_id := c.GetStorageId(addr, isDefault, app, bucket, protocol)
	if storage_id == "" {
		fmt.Println("fail get storage id from oss")
		return errors.New("fail get storage id from oss, check  configuration")
	}
	res_info, err := c.GetInfo(storage_id, id, "upload", addr, "", "", 0, 0)
	if err != nil {
		fmt.Println("fail get put info from oss")
		return errors.New("fail get put info from oss")
	}

	req := c.CreateRequest(id, res_info.Method, res_info.Url)
	req.ContentLength = int64(len(data))
	body := bytes.NewBuffer(data)
	req.Body = ioutil.NopCloser(body)
	c.SignRequest(req, res_info)
	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("fail upload, statusCode: %d", res.StatusCode)
	}
	return nil
}

func (c *cephClient) MultiUpload(id string, file *os.File) error {
	if file == nil {
		return errors.New("file cannot be null")
	}

	if c.addr == "" {
		return errors.New("fail get addr from config")
	}
	storage_id := c.GetStorageId(c.addr, c.is_default, c.app, c.bucket, c.protocol)
	if storage_id == "" {
		fmt.Println("fail get storage id from oss")
		return errors.New("fail get storage id from oss, check  configuration")
	}

	fi, err := file.Stat()
	if err != nil {
		return err
	}

	res_info, err := c.GetInfo(storage_id, id, "init-multiupload", c.addr, "", "", fi.Size(), 0)
	if err != nil {
		return errors.New("fail to init multiupload")
	}

	partNum := fi.Size() / res_info.PartSize
	if fi.Size()%res_info.PartSize > 0 {
		partNum += 1
	}

	var (
		req *http.Request
		res *http.Response
	)
	etags := make([]string, 0, partNum)
	body := &bytes.Buffer{}
	body.Grow(int(res_info.PartSize))
	for i := int64(1); i <= partNum; i++ {
		resp, err := c.GetInfo(storage_id, id, "multiupload", c.addr, res_info.UploadID, "", fi.Size(), i)
		if err != nil {
			return err
		}
		if _, err = file.Seek((i-1)*res_info.PartSize, io.SeekStart); err != nil {
			return err
		}

		if i < partNum {
			_, err = io.CopyN(body, file, res_info.PartSize)
		} else {
			_, err = io.CopyN(body, file, fi.Size()%res_info.PartSize)
		}
		if err != nil {
			return err
		}

		if req, err = http.NewRequest(resp.Method, resp.Url, body); err != nil {
			return err
		}
		c.SignRequest(req, resp)
		if res, err = c.httpClient.Do(req); err != nil {
			return err
		}
		defer res.Body.Close()
		if res.StatusCode != http.StatusOK {
			return fmt.Errorf("file: %s uploadID: %s part_id: %d upload failed with statusCode: %d", id, res_info.UploadID, i, res.StatusCode)
		}

		for k, v := range res.Header {
			if strings.ToLower(k) == "etag" {
				if len(v) > 0 {
					etags = append(etags, strings.Trim(v[0], "\""))
					break
				} else {
					return fmt.Errorf("file: %s uploadID: %s part_id: %d upload failed: no etag value return", id, res_info.UploadID, i)
				}
			}
		}

		if len(etags) < int(i) {
			return fmt.Errorf("file: %s uploadID: %s part_id: %d upload failed: resp header donot contain etag", id, res_info.UploadID, i)
		}

		body.Reset()
		req = nil
		resp = nil
	}

	return c.CompleteMultiupload(storage_id, id, c.addr, res_info.UploadID, etags)
}

func (c *cephClient) Delete(id string) (err error) {
	addr := c.addr
	if addr == "" {
		return errors.New("fail get addr from config")
	}
	isDefault := c.is_default
	app := c.app
	bucket := c.bucket
	protocol := c.protocol
	storage_id := c.GetStorageId(addr, isDefault, app, bucket, protocol)
	if storage_id == "" {
		return errors.New("fail get storage id from oss")
	}

	res_info, err := c.GetInfo(storage_id, id, "delete", addr, "", "", 0, 0)
	if err != nil {
		fmt.Println("fail get delete info from oss")
		return errors.New("fail get delete info from oss")
	}

	req, err := http.NewRequest(res_info.Method, res_info.Url, nil)
	if err != nil {
		return err
	}
	c.SignRequest(req, res_info)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("fail delete, statusCode: %d", resp.StatusCode)
	}
	return nil
}

func (c *cephClient) DownloadLink(id, saveas string) (url string, err error) {
	addr := c.addr
	if addr == "" {
		return "", errors.New("fail get addr from config")
	}
	isDefault := c.is_default
	app := c.app
	bucket := c.bucket
	protocol := c.protocol
	storage_id := c.GetStorageId(addr, isDefault, app, bucket, protocol)
	if storage_id == "" {
		return "", errors.New("fail get storage id from oss")
	}
	res_info, err := c.GetInfo(storage_id, id, "download-link", addr, "", saveas, 0, 0)
	if err != nil {
		return "", errors.New("fail get download info from oss")
	}

	return res_info.Url, nil
}

func (c *cephClient) Down(id string) (content []byte, err error) {
	addr := c.addr
	if addr == "" {
		return nil, errors.New("fail get addr from config")
	}
	isDefault := c.is_default
	app := c.app
	bucket := c.bucket
	protocol := c.protocol
	storage_id := c.GetStorageId(addr, isDefault, app, bucket, protocol)
	if storage_id == "" {
		return nil, errors.New("fail get storage id from oss")
	}
	res_info, err := c.GetInfo(storage_id, id, "download", addr, "", "", 0, 0)
	if err != nil {
		fmt.Println("fail get download info from oss")
		return nil, errors.New("fail get download info from oss")
	}

	req := c.CreateRequest(id, res_info.Method, res_info.Url)
	c.SignRequest(req, res_info)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fail download, statusCode: %d", resp.StatusCode)
	}
	return ioutil.ReadAll(resp.Body)
}
