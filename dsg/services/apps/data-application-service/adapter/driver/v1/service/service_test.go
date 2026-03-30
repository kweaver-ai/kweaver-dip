package service

import (
	"net/http"
	"net/url"
	"testing"

	"github.com/gin-gonic/gin/binding"
)

type example struct {
	// 非空时返回指定 Status 的 Service，包括发布状态和上线状态
	//
	// TODO: Remove Status and PublishStatus

	// Statuses []string `json:"statuses" form:"status"`
	Statuses []string `json:"statuses" form:"status" binding:"omitempty,dive,oneof=notline online offline up-auditing down-auditing up-reject down-reject unpublished pub-auditing published pub-reject change-auditing change-reject"`
}

func TestBind(t *testing.T) {
	request := &http.Request{URL: &url.URL{RawQuery: "status=online&status=published"}}
	target := &example{}

	if err := binding.Query.Bind(request, target); err != nil {
		t.Fatal(err)
	}
	for i, s := range target.Statuses {
		t.Logf("statuses[%d]: %s", i, s)
	}
}
