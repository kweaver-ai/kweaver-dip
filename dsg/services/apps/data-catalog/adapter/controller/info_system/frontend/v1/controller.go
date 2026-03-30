package v1

import (
	"encoding/base64"
	"encoding/json"
	"log"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/info_system"
	data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	InfoSystem info_system.Interface
}

var responses = []struct {
	name   string
	result *data_catalog_frontend_v1.InfoSystemSearchResult
}{
	{
		name: "empty",
		result: &data_catalog_frontend_v1.InfoSystemSearchResult{
			Entries: make([]data_catalog_frontend_v1.InfoSystemWithHighlight, 0),
		},
	},
	{
		name: "all",
		result: &data_catalog_frontend_v1.InfoSystemSearchResult{
			Total: data_catalog_frontend_v1.Total{
				Value:    1,
				Relation: data_catalog_frontend_v1.TotalEqual,
			},
			Entries: []data_catalog_frontend_v1.InfoSystemWithHighlight{
				{
					InfoSystem: data_catalog_frontend_v1.InfoSystem{
						ID:             "019623a7-3018-7429-b46c-eb78c4041aae",
						UpdatedAt:      meta_v1.Now(),
						Name:           `测试 名称`,
						Description:    `测试 描述`,
						DepartmentID:   "019623a9-95ef-7e85-8aac-d76e48f6249a",
						DepartmentPath: "/一级部门/二级部门/三级部门",
					},
					NameHighlight:        `<span style="color:#FF6304;">测试</span> 名称`,
					DescriptionHighlight: `<span style="color:#FF6304;">测试</span> 描述`,
				},
			},
		},
	},
	{
		name: "continue",
		result: &data_catalog_frontend_v1.InfoSystemSearchResult{
			Total: data_catalog_frontend_v1.Total{
				Value:    1,
				Relation: data_catalog_frontend_v1.TotalEqual,
			},
			Entries: []data_catalog_frontend_v1.InfoSystemWithHighlight{
				{
					InfoSystem: data_catalog_frontend_v1.InfoSystem{
						ID:             "019623a7-3018-7429-b46c-eb78c4041aae",
						UpdatedAt:      meta_v1.Now(),
						Name:           `测试 名称`,
						Description:    `测试 描述`,
						DepartmentID:   "019623a9-95ef-7e85-8aac-d76e48f6249a",
						DepartmentPath: "/一级部门/二级部门/三级部门",
					},
					NameHighlight:        `<span style="color:#FF6304;">测试</span> 名称`,
					DescriptionHighlight: `<span style="color:#FF6304;">测试</span> 描述`,
				},
			},
			Continue: base64.StdEncoding.EncodeToString([]byte(`{"hello":"world"}`)),
		},
	},
	{
		name: "gte",
		result: &data_catalog_frontend_v1.InfoSystemSearchResult{
			Total: data_catalog_frontend_v1.Total{
				Value:    65536,
				Relation: data_catalog_frontend_v1.TotalGreaterThanOrEqual,
			},
			Entries: []data_catalog_frontend_v1.InfoSystemWithHighlight{
				{
					InfoSystem: data_catalog_frontend_v1.InfoSystem{
						ID:             "019623a7-3018-7429-b46c-eb78c4041aae",
						UpdatedAt:      meta_v1.Now(),
						Name:           `测试 名称`,
						Description:    `测试 描述`,
						DepartmentID:   "019623a9-95ef-7e85-8aac-d76e48f6249a",
						DepartmentPath: "/一级部门/二级部门/三级部门",
					},
					NameHighlight:        `<span style="color:#FF6304;">测试</span> 名称`,
					DescriptionHighlight: `<span style="color:#FF6304;">测试</span> 描述`,
				},
			},
		},
	},
}

func New(is info_system.Interface) *Controller { return &Controller{InfoSystem: is} }

// Search 搜索信息系统
//
//	@Description	数据资源搜索接口(普通用户视角)
//	@Tags			open数据服务超市
//	@Summary		(普通用户视角)搜索所有数据资源（逻辑视图、接口服务及指标）
//	@Accept			application/json
//	@Produce		application/json
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/info-systems/search [post]
func (ctrl *Controller) Search(c *gin.Context) {
	r := &data_catalog_frontend_v1.InfoSystemSearch{}
	if err := c.ShouldBindJSON(r); err != nil {
		// TODO: 返回格式化错误
		ginx.ResBadRequestJson(c, err)
		return
	}

	// TODO: Completion
	if r.Limit == 0 {
		r.Limit = 10
	}

	// TODO: Validation

	rJSON, _ := json.Marshal(r)
	log.Printf("DEBUG.Controller.Search, r: %s", rJSON)

	got, err := ctrl.InfoSystem.Search(c, r)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, got)
}
