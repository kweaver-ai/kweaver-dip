package impl

import (
	"bytes"
	"compress/gzip"
	"context"
	"errors"
	_ "io"
	"io/ioutil"
	"mime/multipart"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/carousels"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/carousels"
	cept "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

const FILE_SIZE_LIMIT = 10 * 1 << 20 // 文件size限制为10MB

// 实现接口upload
type service struct {
	cephClient cept.CephClient
	repo       repo.IRepository
}

func NewUseCase(ceph cept.CephClient, repo repo.IRepository) carousels.IService {
	return &service{cephClient: ceph, repo: repo}
}

func (s *service) Upload(ctx context.Context, file *multipart.FileHeader, applicationExampleID string, types string) (*carousels.IDResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	//校验数据条数，数据库中超过10条数据，不能再添加
	if count, _ := s.repo.GetCount(ctx); count >= 10 {
		return nil, errorcode.Desc(errorcode.FormNumberMax)
	}
	if file.Size > FILE_SIZE_LIMIT {
		return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
	}

	fi, err := file.Open()
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
	}
	defer fi.Close()

	uuid := uuid.New().String()
	filename := file.Filename
	/*fi.Seek(0, io.SeekStart)
	bytes, err := io.ReadAll(fi)*/

	bts, err := ioutil.ReadAll(fi)
	if err != nil {
		return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}
	// 添加压缩逻辑，例如使用 gzip
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	if _, err := gz.Write(bts); err != nil {
		gz.Close()
		return nil, err
	}
	if err := gz.Close(); err != nil {
		return nil, err
	}

	compressedBytes := buf.Bytes() // 压缩后的字节流
	err = s.cephClient.Upload(uuid, compressedBytes)
	if err != nil {
		log.WithContext(ctx).Error("failed to Upload ", zap.String("current filename", filename), zap.Error(err))
	}
	if types == "" {
		types = "0"
	}
	//uInfo := s.request.GetUserInfo(ctx)
	//实现把数据保存数据库中
	filename = file.Filename
	c := &carousels.CarouselCase{
		ID:                   uuid,
		ApplicationExampleID: applicationExampleID,
		Name:                 filename,
		UUID:                 uuid,
		Size:                 file.Size,
		SavePath:             os.Getenv("OSS_BUCKET") + "/" + filename,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
		Type:                 types,
		State:                "0",
		IntervalSeconds:      "3",
		IsTop:                "1",
		SortOrder:            1000,
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}

	// 这里只是一个示例实现，你需要根据实际情况进行修改
	return &carousels.IDResp{ID: c.ID}, nil

}

// 实现接口delete
func (s *service) Delete(ctx context.Context, req *carousels.IDPathParam) (*carousels.IDResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	//判断此id是否存在
	if _, err := s.repo.GetByID(ctx, req.ID); err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	// 从数据库中删除记录
	if err := s.repo.Delete(ctx, req.ID); err != nil {
		return nil, err
	}

	// 从Ceph中删除文件
	if err := s.cephClient.Delete(req.ID); err != nil {
		log.WithContext(ctx).Errorf("uc.cephClient.Delete: %v", err)
	}
	return &carousels.IDResp{ID: req.ID}, nil

}

// 定义文件修改请求结构体
type UpdateFileReq struct {
	ID   string `path:"id"`   // 文件ID
	Name string `json:"name"` // 新的文件名
}

// 定义文件修改响应结构体
type UpdateFileResp struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// 在service结构体中添加更新方法实现
func (s *service) Update(ctx context.Context, req *carousels.UpdateFileReq) (*carousels.UpdateFileReq, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 判断此id是否存在
	existingFile, err := s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	// 更新文件信息
	existingFile.FileName = req.Name
	// 从数据库中获取原始数据并创建domain.CarouselCase实例
	domainFile := &carousels.CarouselCase{
		ID:       existingFile.ID,
		Name:     existingFile.FileName,
		UUID:     "", // 需要从Ceph客户端获取实际UUID
		Size:     0,  // 需要从文件信息获取实际大小
		SavePath: existingFile.FileName,
	}
	if err := s.repo.Update(ctx, domainFile); err != nil {
		return nil, err
	}

	return &carousels.UpdateFileReq{
		ID:   req.ID,
		Name: req.Name,
	}, nil
}

func (s *service) GetList(ctx context.Context, req *carousels.ListReq) (*carousels.ListResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 使用GORM的分页功能查询数据
	offset := (req.Offset - 1) * req.Limit

	// 获取分页数据
	files, total, err := s.repo.GetWithPagination(ctx, &carousels.CarouselCase{}, offset, req.Limit, req.Id)
	if err != nil {
		return nil, err
	}

	var items []carousels.CarouselCase
	for _, f := range files {
		items = append(items, carousels.CarouselCase{
			ID:              f.ID,
			Name:            f.Name,
			UUID:            f.UUID,
			Size:            f.Size,
			SavePath:        f.SavePath,
			Type:            f.Type,
			IntervalSeconds: f.IntervalSeconds,
			IsTop:           f.IsTop,
		})
	}

	return &carousels.ListResp{
		Items: items,
		Total: total,
	}, nil
}

func (s *service) List(ctx context.Context, req *carousels.ListReq) (*carousels.ListResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 使用GORM的分页功能查询数据
	offset := (req.Offset - 1) * req.Limit

	// 获取分页数据
	files, total, err := s.repo.GetWithPagination(ctx, &carousels.CarouselCase{}, offset, req.Limit, req.Id)
	if err != nil {
		return nil, err
	}

	var items []carousels.CarouselCase
	for _, f := range files {
		items = append(items, carousels.CarouselCase{
			ID:       f.ID,
			Name:     f.Name,
			UUID:     f.ID, // 假设UUID使用文件ID作为替代
			Size:     0,    // 无法从数据库模型获取实际大小
			SavePath: f.SavePath,
		})
	}

	return &carousels.ListResp{
		Items: items,
		Total: total,
	}, nil

}

func (s *service) Preview(ctx context.Context, req *carousels.IDPathParam) (*carousels.DownloadResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 从数据库中获取文件信息
	_, err = s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	// 假设cephClient.Preview需要文件ID和文件名作为参数
	uploadInfo, err := s.cephClient.Down(req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}

	return &carousels.DownloadResp{
		Content: uploadInfo,
		Name:    req.ID,
	}, nil
	// 处理uploadInfo的逻辑
	return nil, nil
}

func (s *service) Replace(ctx *gin.Context, req *carousels.ReplaceFileReq, file *multipart.FileHeader) error {
	// Step 1: 检查旧文件是否存在
	_, err := s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return errors.New("文件不存在")
	}

	// 删除旧文件
	err = s.cephClient.Delete(req.ID)
	/*if err != nil {
		return errors.New("删除旧文件失败")
	}*/
	err = s.repo.Delete(ctx, req.ID)
	if err != nil {
		return errors.New("更新文件记录失败")
	}
	// Step 4: 更新数据库记录
	s.Upload(ctx, file, "", "")
	return nil
}

func (s *service) UpdateCase(ctx *gin.Context, req *carousels.UploadCasePathParam, file *multipart.FileHeader) error {
	// Step 1: 检查旧文件是否存在
	_, err := s.repo.GetByApplicationExampleID(ctx, req.ID)
	if err != nil {
		return errors.New("文件不存在")
	}

	// 删除旧文件
	err = s.cephClient.Delete(req.ID)
	_, err = s.UploadModify(ctx, file, req.ID, req.ApplicationExampleID, req.Type)
	if err != nil {
		return errors.New("更新文件记录失败")
	}
	return nil
}

// 实现oss文件流
func (s *service) GetOssFile(ctx context.Context, req *carousels.IDPathParam) ([]byte, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 获取原始文件字节流
	rawBytes, err := s.cephClient.Down(req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}

	buf := bytes.NewBuffer(rawBytes)
	gr, err := gzip.NewReader(buf)
	if err != nil {
		// 判断是否为 gzip 格式错误
		if err == gzip.ErrHeader || strings.Contains(err.Error(), "invalid header") {
			// 说明是历史未压缩文件，直接返回原始内容
			return rawBytes, nil
		}
		// 其他错误，返回错误信息
		return nil, err
	}
	defer gr.Close()
	decompressedBytes, err := ioutil.ReadAll(gr)
	if err != nil {
		return nil, err
	}
	return decompressedBytes, nil
}

// implement updateState
func (s *service) UpdateState(ctx context.Context, req *carousels.UploadCaseStateParam) (*carousels.IDResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 判断此id是否存在
	existingFile, err := s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	// 从数据库中获取原始数据并创建domain.CarouselCase实例
	domainFile := &carousels.CarouselCase{
		ID:    existingFile.ID,
		State: req.State,
	}
	if err := s.repo.Update(ctx, domainFile); err != nil {
		return nil, err
	}

	return &carousels.IDResp{
		ID: req.ID,
	}, nil
}

func (s *service) GetByCaseName(ctx context.Context, opts *carousels.ListCaseReq) ([]*carousels.CarouselCaseWithCaseName, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 使用GORM的分
	files, err := s.repo.GetByCaseName(ctx, opts)
	if err != nil {
	}
	return files, nil
}

func (s *service) DeleteCase(ctx context.Context, req *carousels.IDPathParam) (*carousels.IDResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 判断此id是否存在
	_, err = s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PlatformNotExist, err)
	}
	resp, err := s.Delete(ctx, req)
	return resp, err
}

func (s *service) UpdateInterval(ctx context.Context, opts *carousels.IntervalSeconds) error {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	err = s.repo.UpdateInterval(ctx, opts)
	if err != nil {
		log.WithContext(ctx).Errorf("UpdateInterval error: %v", err)
	}
	log.WithContext(ctx).Infof("UpdateInterval success: %v", opts)
	return err
}

func (s *service) UpdateTop(ctx context.Context, req *carousels.IDResp) error {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 获取当前记录
	_, err = s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	// 更新置顶状态
	/**domainFile := &carousels.CarouselCase{
		ID:    existingFile.ID,
		IsTop: "0", // 设置为置顶
	}**/

	err = s.repo.UpdateTop(ctx, req)
	if err != nil {
		log.WithContext(ctx).Errorf("UpdateTop error: %v", err)
		return err
	}

	log.WithContext(ctx).Infof("UpdateTop success: %v", req)
	return nil
}

func (s *service) UploadModify(ctx context.Context, file *multipart.FileHeader, id string, applicationExampleID string, types string) (*carousels.IDResp, error) {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	//校验数据条数，数据库中超过10条数据，不能再添加
	if count, _ := s.repo.GetCount(ctx); count >= 10 {
		return nil, err
	}
	if file.Size > FILE_SIZE_LIMIT {
		return nil, errorcode.Desc(errorcode.FormFileSizeLarge)
	}

	fi, err := file.Open()
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
	}
	defer fi.Close()

	uuid := uuid.New().String()
	filename := file.Filename

	bts, err := ioutil.ReadAll(fi)
	if err != nil {
		return nil, errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
	}
	err = s.cephClient.Upload(uuid, bts)
	if err != nil {
		log.WithContext(ctx).Error("failed to Upload ", zap.String("-current filename", filename), zap.Error(err))
	}
	if types == "" {
		types = "0"
	}
	//uInfo := s.request.GetUserInfo(ctx)
	//实现把数据保存数据库中
	filename = file.Filename
	c := &carousels.CarouselCase{
		ID:                   id,
		ApplicationExampleID: applicationExampleID,
		Name:                 filename,
		UUID:                 uuid,
		Size:                 file.Size,
		SavePath:             os.Getenv("OSS_BUCKET") + "/" + filename,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
		Type:                 types,
		State:                "0",
		IntervalSeconds:      "3",
		IsTop:                "1",
	}
	if err := s.repo.Update(ctx, c); err != nil {
		return nil, err
	}

	// 这里只是一个示例实现，你需要根据实际情况进行修改
	return &carousels.IDResp{ID: id}, nil

}

func (s *service) CheckDefaultImageExists(ctx context.Context) (bool, error) {
	// 查询数据库是否存在默认图片记录
	count, err := s.repo.CountByType(ctx, "0")
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdateSort 更新排序
func (s *service) UpdateSort(ctx context.Context, req *carousels.UpdateSortReq) error {
	var err error
	_, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 验证ID是否存在
	if _, err := s.repo.GetByID(ctx, req.ID); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	// 更新排序
	return s.repo.UpdateSort(ctx, req)
}
