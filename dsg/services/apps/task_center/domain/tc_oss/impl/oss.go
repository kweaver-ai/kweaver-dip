package impl

import (
	"context"
	"errors"
	"io/ioutil"
	"mime/multipart"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_oss"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_oss"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	gocephclient "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	uuid "github.com/satori/go.uuid"
	"gorm.io/gorm"
)

type OssUserCase struct {
	repo       tc_oss.Repo
	CephClient gocephclient.CephClient
}

func NewOssUserCase(ceph gocephclient.CephClient, repo tc_oss.Repo) domain.UserCase {
	return &OssUserCase{CephClient: ceph, repo: repo}
}

func (o *OssUserCase) Save(ctx context.Context, file *multipart.FileHeader) (string, error) {
	f, err := file.Open()
	if err != nil {
		return "", errorcode.Detail(errorcode.OssFileReadError, err.Error())
	}
	defer f.Close()
	//parse file name appendix
	objParts := strings.SplitN(file.Filename, ".", -1)
	appendix := objParts[len(objParts)-1]
	if !strings.Contains(file.Filename, ".") {
		appendix = ""
	}
	//check valid appendix
	if !domain.ValidAppendix(appendix) {
		return "", errorcode.Desc(errorcode.OssFileFormatNotSupport)
	}
	//get content
	bts, err := ioutil.ReadAll(f)
	if err != nil {
		return "", errorcode.Detail(errorcode.OssFileReadError, err.Error())
	}
	//check size
	if !domain.ValidSize(int64(len(bts)), appendix) {
		return "", errorcode.Desc(errorcode.OssMaxFileSize)
	}
	uid := uuid.NewV4().String()
	oss := &model.TcOss{
		Appendix: appendix,
		Size:     int64(len(bts)),
		FileUUID: uid,
	}
	err = o.CephClient.Upload(uid, bts)
	if err != nil {
		return "", errorcode.Detail(errorcode.OssInsertFail, err.Error())
	}
	err = o.repo.Insert(ctx, oss)
	if err != nil {
		return "", errorcode.Detail(errorcode.OssSaveTableFail, err.Error())
	}
	return oss.ID, nil
}

func (o *OssUserCase) Get(ctx context.Context, uuid string) (*model.TcOss, []byte, error) {
	ossReq, err := o.repo.Get(ctx, uuid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errorcode.Desc(errorcode.OssRecordNotFound)
		}
		return nil, nil, errorcode.Detail(errorcode.OssRecordNotFound, err.Error())
	}
	if ossReq.FileUUID == "" {
		return nil, nil, errorcode.Detail(errorcode.OssRecordNotFound, "没有获取到合法的file uuid,无法进行文件下载")
	}
	fileBytes, err := o.CephClient.Down(ossReq.FileUUID)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.OssQueryFail, err.Error())
	}
	return ossReq, fileBytes, nil
}
