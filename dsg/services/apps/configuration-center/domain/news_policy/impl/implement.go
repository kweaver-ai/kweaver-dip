package impl

import (
	"context"
	"fmt"
	"io/fs"
	"io/ioutil"
	"mime/multipart"
	"os"
	"path"
	"strings"
	"time"

	"github.com/google/uuid"
	repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/news_policy"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/news_policy"
	cept "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

type newsPolicyUseCase struct {
	repo       repo.UseCase
	cephClient cept.CephClient
	user       user2.IUserRepo
}

const FILE_SIZE_LIMIT = 5 * 1 << 20 // 文件size限制为5MB

// implement NewsPolicyUseCase
func NewUseCase(repo repo.UseCase, ceph cept.CephClient, user2 user2.IUserRepo) domain.UseCase {
	return &newsPolicyUseCase{cephClient: ceph, repo: repo, user: user2}
}

func (svc *newsPolicyUseCase) Delete(ctx context.Context, req *domain.NewsPolicyDeleteReq) (*domain.NewsPolicyDeleteReq, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	id, err := svc.repo.GetByID(req.ID)
	//判断此id是否存在
	if _, err := svc.repo.GetByID(req.ID); err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	// 从数据库中删除记录
	if err := svc.repo.Delete(req.ID); err != nil {
		return nil, err
	}

	// 从Ceph中删除文件
	if err := svc.cephClient.Delete(id.ImageId); err != nil {
		log.WithContext(ctx).Errorf("uc.cephClient.Delete: %v", err)
	}
	return &domain.NewsPolicyDeleteReq{
		ID: req.ID,
	}, nil
}

func (svc *newsPolicyUseCase) Get(ctx context.Context, req *domain.ListReq) (*domain.ListResp, error) {
	list, total, err := svc.repo.List(req)
	//遍历这个集合，根据creatorID查询用户信息,重新组装这个集合
	var aggregatedItems []*domain.CmsContent
	for _, item := range list {
		creator, err := svc.user.GetByUserId(ctx, item.CreatorID)
		updater, err := svc.user.GetByUserId(ctx, item.UpdaterID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		aggregatedItems = append(aggregatedItems, &domain.CmsContent{
			ID:          item.ID,
			Title:       item.Title,
			Summary:     item.Summary,
			Content:     item.Content,
			HomeShow:    item.HomeShow,
			ImageId:     item.ImageId,
			SavePath:    item.SavePath,
			Size:        item.Size,
			UpdateTime:  item.UpdateTime,
			CreateTime:  item.CreateTime,
			CreatorID:   item.CreatorID,
			Type:        item.Type,
			Creator:     creator.Name,
			UpdaterID:   creator.Name,
			Status:      item.Status,
			PublishTime: item.PublishTime,
			Updater:     updater.Name,
		})
	}
	if err != nil {
		return nil, err
	}
	return &domain.ListResp{
		Items: aggregatedItems,
		Total: total,
	}, nil
}

func (svc *newsPolicyUseCase) NewAdd(ctx context.Context, req *domain.NewsPolicyAddRes, file *multipart.FileHeader, userId string) (*domain.NewsPolicySaveReq, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	if file != nil {
		log.Info("current file headers: " + fmt.Sprintf("%v", file.Size))
		if file.Size > FILE_SIZE_LIMIT {
			return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
		}
		fi, err := file.Open()
		if err != nil {
			log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		}
		defer fi.Close()

		imageId := uuid.New().String()
		filename := file.Filename

		bts, err := ioutil.ReadAll(fi)
		if err != nil {
			return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
		}
		log.Info("prepared cephClient upload file.Filename " + filename)
		err = svc.cephClient.Upload(imageId, bts)
		if err != nil {
			log.WithContext(ctx).Error("failed to Upload ", zap.String("current filename", filename), zap.Error(err))
		}
		//当status为1，设置发布时间，为当前时间，为发布状态
		types := req.Status
		var PublishTime string
		if types == "1" {
			PublishTime = beijingTime.Format("2006-01-02 15:04:05")
		}
		id := uuid.NewString()
		c := domain.CmsContent{
			ID:          id,
			Title:       req.Title,
			Summary:     req.Summary,
			Content:     req.Content,
			HomeShow:    req.HomeShow,
			ImageId:     imageId,
			SavePath:    os.Getenv("OSS_BUCKET") + "/" + filename,
			Size:        &file.Size,
			UpdateTime:  beijingTime.Format("2006-01-02 15:04:05"),
			CreateTime:  beijingTime.Format("2006-01-02 15:04:05"),
			Type:        req.Type,
			Status:      req.Status,
			IsDeleted:   "0",
			CreatorID:   userId,
			UpdaterID:   userId,
			PublishTime: parseTime(PublishTime),
		}

		if err := svc.repo.Create(ctx, c); err != nil {
			return nil, err
		}

		return &domain.NewsPolicySaveReq{
			ID: id,
		}, nil
	}

	zero := int64(0)
	id := uuid.NewString()
	//当status为1，设置发布时间，为当前时间，为发布状态
	types := req.Status
	var PublishTime string
	if types == "1" {
		PublishTime = beijingTime.Format("2006-01-02 15:04:05")
	}
	c := domain.CmsContent{
		ID:          id,
		Title:       req.Title,
		Summary:     req.Summary,
		Content:     req.Content,
		CreateTime:  beijingTime.Format("2006-01-02 15:04:05"),
		UpdateTime:  beijingTime.Format("2006-01-02 15:04:05"),
		Type:        req.Type,
		Status:      req.Status,
		HomeShow:    req.HomeShow,
		Size:        &zero,
		CreatorID:   userId,
		UpdaterID:   userId,
		PublishTime: parseTime(PublishTime),
	}

	if err := svc.repo.Create(ctx, c); err != nil {
		return nil, err
	}

	return &domain.NewsPolicySaveReq{
		ID: id,
	}, nil
}

// implement domain.UseCase
func (svc *newsPolicyUseCase) UpdateAdd(ctx context.Context, req *domain.NewsPolicyAddRes, file *multipart.FileHeader, id string, userId string) (*domain.NewsPolicySaveReq, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	if file != nil {
		if file.Size > FILE_SIZE_LIMIT {
			return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
		}
		fi, err := file.Open()
		if err != nil {
			log.WithContext(ctx).Error("-FormOpenExcelFileError " + err.Error())
		}
		defer fi.Close()

		imageId := uuid.New().String()
		filename := file.Filename

		bts, err := ioutil.ReadAll(fi)
		if err != nil {
			return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
		}
		news, err := svc.repo.GetByID(id)
		if err != nil {
			return nil, err
		}
		if news.ImageId != "" {
			svc.cephClient.Delete(news.ImageId)
		}
		err = svc.cephClient.Upload(imageId, bts)
		if err != nil {
			log.WithContext(ctx).Error("failed to Upload ", zap.String("current filename", filename), zap.Error(err))
		}
		//当status为1，设置发布时间，为当前时间，为发布状态
		types := req.Status
		var PublishTime string
		if types == "1" {
			PublishTime = beijingTime.Format("2006-01-02 15:04:05")
		}
		c := domain.CmsContent{
			ID:          id,
			Title:       req.Title,
			Summary:     req.Summary,
			Content:     req.Content,
			HomeShow:    req.HomeShow,
			ImageId:     imageId,
			SavePath:    os.Getenv("OSS_BUCKET") + "/" + filename,
			Size:        &file.Size,
			UpdateTime:  beijingTime.Format("2006-01-02 15:04:05"),
			Type:        req.Type,
			Status:      req.Status,
			UpdaterID:   userId,
			PublishTime: parseTime(PublishTime),
		}

		if err := svc.repo.Update(ctx, id, c); err != nil {
			return nil, err
		}
		return &domain.NewsPolicySaveReq{
			ID: id,
		}, nil
	}

	//当status为1，设置发布时间，为当前时间，为发布状态
	types := req.Status
	var PublishTime string
	if types == "1" {
		PublishTime = beijingTime.Format("2006-01-02 15:04:05")
	}

	c := domain.CmsContent{
		ID:          id,
		Title:       req.Title,
		Summary:     req.Summary,
		Content:     req.Content,
		UpdateTime:  beijingTime.Format("2006-01-02 15:04:05"),
		Type:        req.Type,
		Status:      req.Status,
		HomeShow:    req.HomeShow,
		UpdaterID:   userId,
		PublishTime: parseTime(PublishTime),
	}

	if err := svc.repo.Update(ctx, id, c); err != nil {
		return nil, err
	}

	return &domain.NewsPolicySaveReq{
		ID: id,
	}, nil
}

func (svc *newsPolicyUseCase) GetOssFile(ctx context.Context, req *domain.NewsPolicyDeleteReq) ([]byte, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 从数据库中获取文件信息
	id, err := svc.repo.GetByID(req.ID)
	if err != nil {
		return nil, err
	}
	// 假设cephClient.Preview需要文件ID和文件名作为参数
	bytes, err := svc.cephClient.Down(id.ImageId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}
	return bytes, nil
}

func (svc *newsPolicyUseCase) GetOssPreviewFile(ctx context.Context, req *domain.NewsPolicyDeleteReq) (*domain.HelpDocument, []byte, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 从数据库中获取文件信息
	file, err := svc.repo.GetHelpDocumentById(ctx, req.ID)
	if err != nil {
		return nil, nil, err
	}
	// 假设cephClient.Preview需要文件ID和文件名作为参数
	bytes, err := svc.cephClient.Down(file.ImageID)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}
	return file, bytes, nil
}

func (svc *newsPolicyUseCase) GetNewsPolicyList(ctx context.Context, req *domain.NewsDetailsReq) (*domain.CmsContent, error) {
	return svc.repo.GetNewsPolicy(ctx, req)
}

func (svc *newsPolicyUseCase) GetHelpDocumentList(ctx context.Context, req *domain.ListHelpDocumentReq) (*domain.ListDocumentResp, error) {
	list, total, err := svc.repo.GetHelpDocumentList(ctx, req)
	if err != nil {
		return nil, err
	}

	// 缓存用户 ID -> 用户名
	userCache := make(map[string]string)

	// 收集所有需要查询的用户ID
	var userIds []string
	for _, content := range list {
		if content == nil {
			continue
		}
		if content.CreatedBy != "" {
			userIds = append(userIds, content.CreatedBy)
		}
		if content.UpdatedBy != "" {
			userIds = append(userIds, content.UpdatedBy)
		}
	}

	// 批量查询用户信息并缓存
	for _, userID := range userIds {
		if _, ok := userCache[userID]; !ok {
			user, err := svc.user.GetByUserId(ctx, userID)
			if err != nil {
				// 可选择继续执行或直接返回错误
				continue
			}
			if user != nil {
				userCache[userID] = user.Name
			}
		}
	}

	// 构建返回结果
	var result []*domain.HelpDocument
	for _, content := range list {
		if content == nil {
			continue
		}
		result = append(result, &domain.HelpDocument{
			ID:          content.ID,
			ImageID:     content.ImageID,
			SavePath:    content.SavePath,
			Size:        content.Size,
			Status:      content.Status,
			Title:       content.Title,
			Type:        content.Type,
			PublishedAt: content.PublishedAt,
			CreatedAt:   content.CreatedAt,
			UpdatedAt:   content.UpdatedAt,
			CreatedBy:   userCache[content.CreatedBy],
			UpdatedBy:   userCache[content.UpdatedBy],
		})
	}

	return &domain.ListDocumentResp{
		Items: result,
		Total: total,
	}, nil
}

func (svc *newsPolicyUseCase) CreateHelpDocument(ctx context.Context, req *domain.HelpDocument, file *multipart.FileHeader, userId string) (*domain.NewsPolicySaveReq, error) {
	var err error
	var tmpFileName string
	_, span := trace.StartInternalSpan(ctx)
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if file != nil {
		if file.Size > FILE_SIZE_LIMIT {
			return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
		}
		fi, err := file.Open()
		if err != nil {
			log.WithContext(ctx).Error("》FormOpenExcelFileError " + err.Error())
		}
		defer fi.Close()

		imageId := uuid.New().String()
		filename := file.Filename

		bts, err := ioutil.ReadAll(fi)
		if err != nil {
			return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
		}
		err = svc.cephClient.Upload(imageId, bts)
		if err != nil {
			log.WithContext(ctx).Error("failed to Upload ", zap.String("current filename", filename), zap.Error(err))
		}
		var publishTime string
		if req.Status == "0" {
			publishTime = beijingTime.Format("2006-01-02 15:04:05")
		} else {
			publishTime = ""
		}

		c := domain.HelpDocument{
			ImageID:     imageId,
			SavePath:    os.Getenv("OSS_BUCKET") + "/" + filename,
			Size:        file.Size,
			Status:      req.Status,
			Title:       req.Title,
			Type:        req.Type,
			UpdatedAt:   beijingTime.Format("2006-01-02 15:04:05"),
			CreatedAt:   beijingTime.Format("2006-01-02 15:04:05"),
			ID:          uuid.NewString(),
			PublishedAt: publishTime,
		}

		if err := svc.repo.CreateHelpDocument(ctx, &c); err != nil {
			return nil, err
		}

		//转为pdf文件
		fileNameSuffix := getFileSuffix(filename)
		tmpFileName = strings.Join([]string{imageId, fileNameSuffix}, ".")

		if !strings.HasSuffix(strings.ToLower(filename), constant.PDFHasSuffix) {
			if _, err := svc.GeneratePreview(ctx, c.ID, imageId, tmpFileName, bts); err != nil {
				return nil, err
			}
		}
		return &domain.NewsPolicySaveReq{
			ID: uuid.NewString(),
		}, nil
	}

	c := domain.HelpDocument{
		Size:      int64(0),
		Status:    req.Status,
		Title:     file.Filename,
		Type:      req.Type,
		UpdatedAt: beijingTime.Format("2006-01-02 15:04:05"),
		CreatedAt: beijingTime.Format("2006-01-02 15:04:05"),
		ID:        uuid.NewString(),
		CreatedBy: userId,
		UpdatedBy: userId,
	}

	if err := svc.repo.CreateHelpDocument(ctx, &c); err != nil {
		return nil, err
	}

	return &domain.NewsPolicySaveReq{
		ID: uuid.NewString(),
	}, nil
}

func (svc *newsPolicyUseCase) GeneratePreview(ctx context.Context, objID string, storageID, tmpFileName string, data []byte) (id string, err error) {
	dir := path.Join(constant.DataPath, storageID)
	// 确保输出目录存在
	if err := os.MkdirAll(dir, 0755); err != nil {
		return objID, err
	}

	oldFilePath := path.Join(dir, tmpFileName)
	defer os.RemoveAll(oldFilePath)
	err = os.WriteFile(oldFilePath, data, fs.ModeAppend)
	log.WithContext(ctx).Infof("==upload====generatePreview==oldFilePath==" + oldFilePath)
	if err != nil {
		log.WithContext(ctx).Errorf("====upload====generatePreview==第二步异常=err: %v", err)
		return
	}

	newFilePath := path.Join(dir, util.GetFilenameWithoutExt(tmpFileName)+constant.PDFHasSuffix)
	defer os.RemoveAll(newFilePath)
	lower := strings.ToLower(oldFilePath)
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	if strings.HasSuffix(lower, constant.ExcelXlsHasSuffix) || strings.HasSuffix(lower, constant.ExcelXlsxHasSuffix) {
		err := util.ConvertExcelToPDF(oldFilePath, newFilePath)
		if err != nil {
			log.WithContext(ctx).Errorf("====upload====generatePreview=第三步异常===err: %v", err)
			return objID, err
		}
	} else if strings.HasSuffix(lower, constant.WordDocHasSuffix) || strings.HasSuffix(lower, constant.WordDocxHasSuffix) || strings.HasSuffix(lower, constant.TXTDocHasSuffix) || strings.HasSuffix(lower, constant.PPTXDocHasSuffix) || strings.HasSuffix(lower, constant.PPTDocHasSuffix) {
		err := util.ConvertWordToPDF(ctx, oldFilePath, newFilePath, nil)
		if err != nil {
			log.WithContext(ctx).Errorf("====upload====generatePreview=第四步异常===err: %v", err)
			return objID, err
		}
	} else {
		log.WithContext(ctx).Errorf("====upload====generatePreview=文件不是word和excel===path: %s", oldFilePath)
		return objID, fmt.Errorf("unsupported file type")
	}
	pdf, err := os.ReadFile(newFilePath)
	if err != nil {
		log.WithContext(ctx).Errorf("====upload====generatePreview=第五步异常===path: %s==err: %v", newFilePath, err)
		return objID, err
	}
	pdfID := uuid.NewString()
	err = svc.cephClient.Upload(pdfID, pdf)
	if err != nil {
		log.WithContext(ctx).Errorf("====upload====generatePreview=第六步异常==err: %v", err)
		return objID, err
	}
	//err = svc.fileRepo.UpdateFile(ctx, &model.OfficeDocumentFilePO{ID: objID, PreviewID: pdfID, UpdatedAt: time.Now()})
	c := domain.HelpDocument{
		ImageID:   pdfID,
		UpdatedAt: beijingTime.Format("2006-01-02 15:04:05"),
		CreatedAt: beijingTime.Format("2006-01-02 15:04:05"),
		ID:        objID,
	}
	err = svc.repo.UpdateHelpDocument(ctx, &c)
	if err != nil {
		log.WithContext(ctx).Errorf("====upload====generatePreview=第七步异常==err: %v", err)
		return objID, err
	}
	return
}
func (svc *newsPolicyUseCase) UpdateHelpDocument(ctx context.Context, req *domain.HelpDocument, file *multipart.FileHeader, id string, userId string) (*domain.NewsPolicySaveReq, error) {
	var err error
	var tmpFileName string
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	if file != nil {
		log.Info("current file headers: " + fmt.Sprintf("%v", file.Size))
		if file.Size > FILE_SIZE_LIMIT {
			return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
		}
		byId, err := svc.repo.GetHelpDocumentById(ctx, id)
		if err != nil {
			return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
		}
		svc.cephClient.Delete(byId.ImageID)
		fi, err := file.Open()
		if err != nil {
			log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		}
		defer fi.Close()

		imageId := uuid.New().String()
		filename := file.Filename

		bts, err := ioutil.ReadAll(fi)
		if err != nil {
			return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
		}
		err = svc.cephClient.Upload(imageId, bts)
		if err != nil {
			log.WithContext(ctx).Error("failed to Upload ", zap.String("filename", filename), zap.Error(err))
		}
		var publishTime string
		if req.Status == "0" {
			publishTime = beijingTime.Format("2006-01-02 15:04:05")
		} else {
			publishTime = ""
		}
		c := domain.HelpDocument{
			ImageID:     imageId,
			SavePath:    os.Getenv("OSS_BUCKET") + "/" + filename,
			Size:        file.Size,
			Status:      req.Status,
			Title:       req.Title,
			Type:        req.Type,
			UpdatedAt:   beijingTime.Format("2006-01-02 15:04:05"),
			CreatedAt:   beijingTime.Format("2006-01-02 15:04:05"),
			ID:          id,
			UpdatedBy:   userId,
			PublishedAt: publishTime,
		}

		if err := svc.repo.UpdateHelpDocument(ctx, &c); err != nil {
			return nil, err
		}

		//转为pdf文件
		fileNameSuffix := getFileSuffix(filename)
		tmpFileName = strings.Join([]string{imageId, fileNameSuffix}, ".")

		if !strings.HasSuffix(strings.ToLower(filename), constant.PDFHasSuffix) {
			if _, err := svc.GeneratePreview(ctx, c.ID, imageId, tmpFileName, bts); err != nil {
				return nil, err
			}
		}

		return &domain.NewsPolicySaveReq{
			ID: id,
		}, nil
	}

	c := domain.HelpDocument{
		Size:      file.Size,
		Status:    req.Status,
		Title:     req.Title,
		Type:      req.Type,
		UpdatedAt: beijingTime.Format("2006-01-02 15:04:05"),
		CreatedAt: beijingTime.Format("2006-01-02 15:04:05"),
		ID:        id,
	}

	if err := svc.repo.UpdateHelpDocument(ctx, &c); err != nil {
		return nil, err
	}

	return &domain.NewsPolicySaveReq{
		ID: id,
	}, nil
}

func (svc *newsPolicyUseCase) DeleteHelpDocument(ctx context.Context, req *domain.DeleteHelpDocumentReq) (*domain.NewsPolicyDeleteReq, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	id, err := svc.repo.GetHelpDocumentById(ctx, req.ID)
	//判断此id是否存在
	if _, err := svc.repo.GetHelpDocumentById(ctx, req.ID); err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	// 从数据库中删除记录
	if err := svc.repo.DeleteHelpDocument(ctx, req.ID); err != nil {
		return nil, err
	}

	// 从Ceph中删除文件
	if err := svc.cephClient.Delete(id.ImageID); err != nil {
		log.WithContext(ctx).Errorf("uc.cephClient.Delete: %v", err)
	}
	return &domain.NewsPolicyDeleteReq{
		ID: req.ID,
	}, nil
}

func (svc *newsPolicyUseCase) GetHelpDocumentDetail(ctx context.Context, req *domain.GetHelpDocumentReq) (*domain.HelpDocument, error) {
	return svc.repo.GetHelpDocumentDetail(ctx, req)
}

func (svc *newsPolicyUseCase) Preview(ctx context.Context, req *domain.NewsPolicySaveReq) (*domain.DownloadResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	id, err := svc.repo.GetHelpDocumentById(ctx, req.ID)
	// 从数据库中获取文件信息
	_, err = svc.repo.GetHelpDocumentById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	uploadInfo, err := svc.cephClient.Down(id.ImageID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}

	return &domain.DownloadResp{
		Content: uploadInfo,
		Name:    req.ID,
	}, nil
	// 处理uploadInfo的逻辑
	return nil, nil
}

func (svc *newsPolicyUseCase) UpdateHelpDocumentStatus(ctx context.Context, req *domain.UpdateHelpDocumentPath) (*domain.NewsPolicySaveReq, error) {
	id, err := svc.repo.GetHelpDocumentById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	err = svc.repo.UpdateHelpDocumentStatus(ctx, req)
	if err != nil {
		return nil, err
	}
	return &domain.NewsPolicySaveReq{
		ID: id.ID,
	}, nil
}

func (svc *newsPolicyUseCase) UpdatePolicyStatus(ctx context.Context, req *domain.UpdatePolicyPath) (*domain.NewsPolicySaveReq, error) {
	policy, err := svc.repo.GetByID(req.ID)
	if err != nil {
		return nil, err
	}
	err = svc.repo.UpdatePolicyStatus(ctx, req)
	if err != nil {
		return nil, err
	}
	return &domain.NewsPolicySaveReq{
		ID: policy.ID,
	}, nil
}

func getFileSuffix(fileName string) string {
	lastDotIndex := strings.LastIndex(fileName, ".")
	if lastDotIndex == -1 || lastDotIndex == 0 {
		return "" // 没有后缀或隐藏文件
	}
	return fileName[lastDotIndex+1:]
}

func parseTime(timeStr string) *time.Time {
	layout := "2006-01-02 15:04:05"
	t, err := time.Parse(layout, timeStr)
	if err != nil {
		return nil
	}
	return &t
}
