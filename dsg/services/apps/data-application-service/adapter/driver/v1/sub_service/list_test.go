package sub_service

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func TestBindListOptions(t *testing.T) {
	v := url.Values{}
	// v.Add("logic_view_id", uuid.NewString())
	// v.Add("offset", "2")
	// v.Add("limit", "10")

	u := &url.URL{Host: "localhost", Path: "/sub-views", RawQuery: v.Encode()}

	req, _ := http.NewRequest(http.MethodGet, u.String(), http.NoBody)
	t.Logf("request: %v", req)

	w := httptest.NewRecorder()

	_, r := gin.CreateTestContext(w)

	r.GET("sub-views", func(c *gin.Context) {
		var err error
		var opts sub_service.ListOptions
		if err = c.ShouldBindQuery(&opts); err != nil {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
			return
		}
		// gin doesn't support bind uuid.UUID from query.
		if v, ok := c.GetQuery("logic_view_id"); ok {
			if opts.ServiceID, err = uuid.Parse(v); err != nil {
				ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
			}
		}
		c.JSON(http.StatusOK, gin.H{"opts": opts})
	})

	r.ServeHTTP(w, req)

	t.Logf("body: %s", w.Body)
}
