package domain

import (
	"context"
	"crypto/md5"
	"crypto/tls"
	"encoding/hex"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	gocephclient "github.com/kweaver-ai/idrm-go-common/go-ceph-client"

	// v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type FileDomain struct {
	cephClient gocephclient.CephClient
	fileRepo   gorm.FileRepo
}

func NewFileDomain(fileRepo gorm.FileRepo) *FileDomain {
	clientSingleton := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
			MaxIdleConnsPerHost:   100,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		},
		Timeout: 10 * time.Second, // TODO in env
	}
	client, err := gocephclient.NewCephClient(clientSingleton)
	if err != nil {
		log.Error("gocephclient.NewCephClient", zap.Error(err))
	}

	return &FileDomain{
		cephClient: client,
		fileRepo:   fileRepo,
	}
}

func (u *FileDomain) FileUpload(ctx context.Context, fileHeader *multipart.FileHeader, fileType string) (res *dto.FileUploadRes, err error) {
	//读取文件
	f, err := fileHeader.Open()
	defer f.Close()
	if err != nil {
		return nil, err
	}

	_, err = f.Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}
	bytes, err := io.ReadAll(f)

	//检查md5
	sum := md5.Sum(bytes)
	hash := hex.EncodeToString(sum[:])

	fileGetByHash, err := u.fileRepo.FileGetByHash(ctx, hash)
	if err != nil {
		return nil, err
	}
	//已经上传过
	if fileGetByHash.FileHash == hash {
		//修改了文件名, 没修改内容, 更新文件表的文件名称
		if fileGetByHash.FileName != fileHeader.Filename {
			err := u.fileRepo.FileUpdate(ctx, fileGetByHash.FileID, fileHeader.Filename, fileType)
			if err != nil {
				return nil, err
			}
		}
		res = &dto.FileUploadRes{
			File: dto.File{
				FileID:   fileGetByHash.FileID,
				FileName: fileGetByHash.FileName,
			},
		}

		return res, nil
	}

	fileId := util.NewUUID()
	//上传到ceph
	err = u.cephClient.Upload(fileId, bytes)
	if err != nil {
		log.WithContext(ctx).Error("FileUpload", zap.Error(err))
		return nil, err
	}

	//存入文件表
	file := &model.File{
		FileID:   fileId,
		FileName: fileHeader.Filename,
		FileType: fileType,
		FilePath: fileId + "." + fileType,
		FileSize: uint64(fileHeader.Size),
		FileHash: hash,
	}
	err = u.fileRepo.FileCreate(ctx, file)
	if err != nil {
		return nil, err
	}

	res = &dto.FileUploadRes{
		File: dto.File{
			FileID:   file.FileID,
			FileName: file.FileName,
		},
	}

	return res, nil
}

func (u *FileDomain) FileDownload(ctx context.Context, req *dto.FileDownloadReq) (fileBytes []byte, file *model.File, err error) {
	exist, err := u.fileRepo.IsFileExist(ctx, req.FileID)
	if err != nil {
		return nil, nil, err
	}

	if !exist {
		log.WithContext(ctx).Error("FileDownload", zap.Error(errorcode.Desc(errorcode.FileIdNotExist)))
		return nil, nil, errorcode.Desc(errorcode.FileIdNotExist)
	}

	file, err = u.fileRepo.FileGetById(ctx, req.FileID)
	if err != nil {
		log.WithContext(ctx).Error("FileDownload", zap.Error(err))
		return nil, nil, err
	}

	fileBytes, err = u.cephClient.Down(req.FileID)
	if err != nil {
		log.WithContext(ctx).Error("FileDownload", zap.Error(err))
		return nil, nil, err
	}

	return fileBytes, file, nil
}
