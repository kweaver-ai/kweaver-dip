package standardization

import (
	"context"
	"encoding/json"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/logic_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Handler struct {
	uc logic_view.LogicViewUseCase
}

func NewStandardizationHandler(uc logic_view.LogicViewUseCase) *Handler {
	return &Handler{uc: uc}
}

// StandardChange 数据元的删除和修改，绑定了该数据元的字段视图，需要清除合成数据
func (s *Handler) StandardChange(msg []byte) error {
	var data logic_view.StandardChangeReq
	if err := json.Unmarshal(msg, &data); err != nil {
		log.Errorf("json.Unmarshal data explore msg (%s) failed: %v", string(msg), err)
		return err
	}
	contend := data.Payload.Content
	if (contend.Type == "delete" || contend.Type == "update") && contend.TableName == "t_data_element_info" {
		log.Infof("StandardChange msg :%s", string(msg))
		standardCodes := make([]string, len(data.Payload.Content.Entities))
		for i, entity := range data.Payload.Content.Entities {
			standardCodes[i] = entity.Code
		}
		err := s.uc.StandardChange(context.Background(), standardCodes)
		if err != nil {
			log.Errorf("StandardChange msg (%s) failed: %v", string(msg), err)
			return err
		}
	}

	return nil
}

// DictChange 码表的删除和修改，绑定了该码表的字段视图，需要清除合成数据
// 编码规则的删除和修改，绑定了编码规则的数据元，需要清除合成数据
func (s *Handler) DictChange(msg []byte) error {
	log.Infof("DictChange msg :%s", string(msg))
	var data logic_view.DictChangeReq
	if err := json.Unmarshal(msg, &data); err != nil {
		log.Errorf("json.Unmarshal data explore msg (%s) failed: %v", string(msg), err)
		return err
	}

	err := s.uc.DictChange(context.Background(), &data)
	if err != nil {
		log.Errorf("DictChange msg (%s) failed: %v", string(msg), err)
		return err
	}
	return nil
}
