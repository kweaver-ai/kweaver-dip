package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// CreateESIndex 扫表并创建目录ES索引
//
//	@Description	扫表并创建目录ES索引
//	@Tags			数据资源目录管理
//	@Summary		扫表并创建目录ES索引
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	map[string]any	"成功响应参数"
//	@Router			/api/internal/data-catalog/v1/data-catalog/es-index [post]
func (controller *Controller) CreateESIndex(c *gin.Context) {
	go controller.dataResourceCatalog.CreateESIndex(c)
	ginx.ResOKJson(c, nil)
}

// OfflineCancelApplyAudit 撤销针对非上线状态目录发起的且未结束申请
//
//	@Description	撤销针对非上线状态目录发起的且未结束申请
//	@Tags			数据资源目录管理
//	@Summary		撤销针对非上线状态目录发起的且未结束申请
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	map[string]any	"成功响应参数"
//	@Router			/api/internal/data-catalog/v1/data-catalog/apply-audit-cancel [post]
func (controller *Controller) OfflineCancelApplyAudit(c *gin.Context) {
	go controller.dc.OfflineCancelApplyAudit()
	ginx.ResOKJson(c, nil)
}
