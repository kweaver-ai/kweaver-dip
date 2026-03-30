package firm

import (
	"context"
	"mime/multipart"
	"strconv"
	"strings"

	gorm_firm "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/firm"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type UseCase interface {
	Create(ctx context.Context, uid string, req *CreateReq) (*IDResp, error)
	Import(ctx context.Context, uid string, file *multipart.FileHeader) (*NullResp, error)
	Update(ctx context.Context, uid string, firmID uint64, req *CreateReq) (*IDResp, error)
	Delete(ctx context.Context, uid string, req *DeleteReq) (*NullResp, error)
	GetList(ctx context.Context, req *ListReq) (*ListResp, error)
	UniqueCheck(ctx context.Context, req *UniqueCheckReq) (*UniqueCheckResp, error)
}

type FirmIDPathReq struct {
	FirmID models.ModelID `uri:"firm_id" binding:"TrimSpace,required,VerifyModelID"` // 厂商ID
}

type CreateReq struct {
	Name           string `json:"name" binding:"TrimSpace,required,min=1,max=128"`                                     // 厂商名称
	UniformCode    string `json:"uniform_code" binding:"TrimSpace,required,min=15,max=18,VerifyFirmUniformCreditCode"` // 统一社会信用代码
	LegalRepresent string `json:"legal_represent" binding:"TrimSpace,required,min=1,max=128"`                          // 法定代表名称
	ContactPhone   string `json:"contact_phone" binding:"TrimSpace,required,min=3,max=20,VerifyPhoneNumber"`           // 联系电话
}

type DeleteReq struct {
	IDs []models.ModelID `json:"ids" binding:"required,min=1,VerifyModelIDArray"` // 厂商IDs
}

type ListReq struct {
	Offset    int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`                                              // 页码，默认1
	Limit     int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"`                                  // 每页大小，默认10
	Direction string `form:"direction,default=desc" binding:"TrimSpace,omitempty,oneof=asc desc" default:"desc" example:"desc"`               // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `form:"sort,default=updated_at" binding:"TrimSpace,omitempty,oneof=updated_at name" default:"updated_at" example:"name"` // 排序类型，枚举：name: 按厂商名称排序。默认按厂商名称排序
	Keyword   string `form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128" example:"keyword"`                                           // 关键字，模糊匹配厂商名称、统一社会信用代码及法定代表
	IDs       string `form:"ids" binding:"TrimSpace,omitempty"`                                                                               // 厂商IDs，多个用英文逗号分隔
}

func FirmListReqParam2Map(ctx context.Context, req *ListReq) (rMap map[string]any, err error) {
	rMap = map[string]any{
		"offset":    req.Offset,
		"limit":     req.Limit,
		"direction": req.Direction,
		"sort":      req.Sort,
	}

	if req.Offset <= 1 {
		rMap["offset"] = 1
	}

	if req.Limit <= 10 {
		rMap["limit"] = 10
	} else if req.Limit >= 1000 {
		rMap["limit"] = 1000
	}

	if len(req.Direction) == 0 {
		rMap["direction"] = "desc"
	}

	if len(req.Sort) == 0 {
		rMap["sort"] = "name"
	}

	if len(req.Keyword) > 0 {
		rMap["keyword"] = req.Keyword
	}

	if len(req.Keyword) > 0 {
		rMap["keyword"] = req.Keyword
	}

	req.IDs = strings.TrimSpace(req.IDs)
	if len(req.IDs) > 0 {
		var id uint64
		sIDs := strings.Split(req.IDs, ",")
		ids := make([]uint64, 0, len(sIDs))
		for i := range sIDs {
			if len(sIDs[i]) == 0 {
				log.WithContext(ctx).Errorf("FirmListReqParam2Map split ids length is 0")
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "ids不符合要求")
			}

			id, err = strconv.ParseUint(sIDs[i], 10, 64)
			if err != nil {
				log.WithContext(ctx).Errorf("FirmListReqParam2Map strconv.ParseUint split ids failed: %v", err)
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "ids不符合要求")
			}
			ids = append(ids, id)
		}
		rMap["ids"] = ids
	}
	return
}

type UniqueCheckReq struct {
	CheckType gorm_firm.CheckFieldType `form:"check_type" binding:"TrimSpace,required,oneof=name uniform_code"` // 唯一性校验类型 name 厂商名称 uniform_code 统一社会信用代码
	Value     string                   `form:"value" binding:"TrimSpace,required,min=1,max=128"`                // 待校验唯一性值
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 厂商列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的厂商数量
}

type ListItem struct {
	ID             uint64 `json:"id,string"`       // 厂商ID
	Name           string `json:"name"`            // 厂商名称
	UniformCode    string `json:"uniform_code"`    // 统一社会信用代码
	LegalRepresent string `json:"legal_represent"` // 法定代表名称
	ContactPhone   string `json:"contact_phone"`   // 联系电话
	CreatedAt      int64  `json:"created_at"`      // 创建时间戳
	UpdatedAt      *int64 `json:"updated_at"`      // 更新时间戳
}

type ListResp struct {
	PageResult[ListItem]
}

type IDResp struct {
	ID uint64 `json:"id,string"` // 厂商ID
}

type IDsResp struct {
	IDs []models.ModelID `json:"ids"` // 厂商IDs
}

type UniqueCheckResp struct {
	Repeat bool `json:"repeat"` // 是否重复 true 重复 false 不重复
}

type NullResp struct{}
