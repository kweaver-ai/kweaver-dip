package tc_oss

//
//import (
//	"bytes"
//	"context"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_oss/impl"
//	"github.com/fogleman/gg"
//	"github.com/golang/mock/gomock"
//	"github.com/stretchr/testify/assert"
//	"image/png"
//	"io"
//	"mime/multipart"
//	"net/http"
//	"testing"
//)
//
//func NewImageReader() *bytes.Buffer {
//	width := 100
//	height := 100
//
//	dc := gg.NewContext(width, height)
//	dc.DrawRectangle(0, 0, float64(width), float64(width))
//	dc.SetRGB255(255, 255, 0)
//	dc.Fill()
//	buf := &bytes.Buffer{}
//	png.Encode(buf, dc.Image())
//	return buf
//}
//
//func TestSaveOss(t *testing.T) {
//	ctl := gomock.NewController(t)
//	defer ctl.Finish()
//
//	ossRepo := impl.NewMockOssRepo(ctl)
//	ossRepo.EXPECT().Insert(gomock.Any(), gomock.Any()).Return(nil)
//
//	ossUserCase := impl.NewOssUserCase(ossRepo)
//
//	buf := &bytes.Buffer{}
//	bodyWriter := multipart.NewWriter(buf)
//
//	w, _ := bodyWriter.CreateFormFile("file", "test.png")
//	//open file
//	imgBuf := NewImageReader()
//	n, _ := io.Copy(w, imgBuf)
//
//	contentType := bodyWriter.FormDataContentType()
//	bodyWriter.Close()
//
//	req, _ := http.NewRequest(http.MethodPost, "xxx.com", buf)
//	req.Header.Set("Content-Type", contentType)
//
//	err := req.ParseMultipartForm(int64(n))
//	assert.Nil(t, err)
//
//	header := req.MultipartForm.File["file"]
//	uuid, err := ossUserCase.Save(context.TODO(), header[0])
//	assert.Nil(t, err)
//	assert.Empty(t, uuid)
//}
