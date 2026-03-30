package business_grooming

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

var client = af_trace.NewOtelHttpClient()

type FormAndFieldInfoReq struct {
	FormID         string   `json:"form_id"`          //业务表ID
	SubjectIDSlice []string `json:"subject_id_slice"` //字段ID列表
}

type FormAndFieldInfoResp struct {
	FormInfo           *FormInfo        `json:"form_info"`             //业务表信息
	FormFieldInfoSlice []*FormFieldInfo `json:"form_field_info_slice"` //业务表字段信息
}

type FormInfo struct {
	BusinessFormID   string `json:"business_form_id"`   // 业务表ID
	BusinessFormName string `json:"business_form_name"` // 业务表名称
	FormType         int8   `json:"form_type"`          // 业务表类型：1普通，2从数据源导入
}

type StandardInfo struct {
	ID       string `json:"id"`        // 标准id
	Name     string `json:"name"`      // 标准中文名
	NameEn   string `json:"name_en"`   // 标准英文名
	DataType string `json:"data_type"` // 数据类型
}

type FormFieldInfo struct {
	StandardInfo      StandardInfo `json:"standard_info"`       // 数据标准信息
	FieldID           string       `json:"field_id"`            // 业务表字段ID
	FieldName         string       `json:"field_name"`          // 业务表字段名称
	BusinessFormID    string       `json:"business_form_id"`    // 业务表ID
	BusinessModelID   string       `json:"business_model_id"`   // 业务模型ID
	BusinessFormName  string       `json:"business_form_name"`  // 业务表名称
	BusinessModelName string       `json:"business_model_name"` // 主干业务名称
}

func GetRemoteBusinessModelInfo(ctx context.Context, req FormAndFieldInfoReq) (*FormAndFieldInfoResp, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)
	args := fmt.Sprintf("form_id=%s&subject_id_slice=%s", req.FormID, strings.Join(req.SubjectIDSlice, "&subject_id_slice="))
	if len(req.SubjectIDSlice) <= 0 {
		args = fmt.Sprintf("form_id=%s", req.FormID)
	}

	urlStr := fmt.Sprintf("%s/api/business-grooming/v1/forms-fields/precision?%s", base.Service.BusinessGroomingHost, args)
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	request = request.WithContext(ctx)
	resp, err := client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Desc(errorcode.PublicInternalError)
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	log.WithContext(ctx).Info(string(body))
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound { // URL错误
			return nil, errorcode.Desc(errorcode.PublicInternalError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.PublicInternalError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return nil, errorcode.Desc(errorcode.PublicInternalError)
		}
	}
	//获取主干业务数据
	res := new(FormAndFieldInfoResp)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}
