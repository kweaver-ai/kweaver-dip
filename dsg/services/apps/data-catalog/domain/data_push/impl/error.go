package impl

import (
	"encoding/json"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/data_sync"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

const ResourceNotExistCode = "ResourceError.DataNotExist"
const ScheduleTimeError = "publish schedule online error"

//{\"code\":10168,\"msg\":\"process definition name push_explore_task_3-d910f85c-ac94-4097-98f5-f1d0bb6164b8 already exists\
//{\"code\":80003,\"msg\":\"start time bigger than end time error\",\"data\":null,\"failed\":true,\"success\":false}"}]
//{\"code\":10078,\"msg\":\"publish schedule online error\",\"data\":null,\"failed\":true,\"success\":false}"}],"s
//{\"code\":10168,\"msg\":\"process definition name push_t_sszd_report_record-e41b5e1a-0b72-492b-9978-20f1d739a0de already exists\"

// SaveCallError 保存错误，报错要保存起来，显示异常，让用户处理
func SaveCallError(pushData *model.TDataPushModel, csResp *data_sync.CsCommonResp[any], err error) error {
	if err == nil {
		return nil
	}
	detail := string(csResp.Detail)
	switch {
	case strings.Contains(detail, "80003"):
		pushData.PushError = "开始时间必须大于结束时间"
		return nil
	case strings.Contains(detail, "10078"):
		pushData.PushError = "调度时间错误，无法开启"
		return nil
	case strings.Contains(csResp.Code, ResourceNotExistCode):
		pushData.PushError = "模型已删除"
		return nil
	default:
		log.Errorf("未知错误:%v", string(lo.T2(json.Marshal(csResp)).A))
		pushData.PushError = "未知错误"
	}
	return nil
}
