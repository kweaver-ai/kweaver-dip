package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/tool"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
)

var tools = []*tool.Tool{
	{
		ID:   "593f2207-3bcd-47e2-a22e-3726f34bae46",
		Name: "业务建模平台",
	},
	{
		ID:   "45862518-742d-4225-95bd-8445994ed2c4",
		Name: "标准平台",
	},
	{
		ID:   "14a01fbe-3733-4bb5-8db4-59bef96074d4",
		Name: "信息资源平台",
	},
}

type toolRepo struct {
}

func NewToolRepo() tool.Repo {
	return &toolRepo{}
}

func (t *toolRepo) List(_ context.Context) ([]*tool.Tool, error) {
	return tools, nil
}

func (t *toolRepo) Get(_ context.Context, id string) (*tool.Tool, error) {
	for _, to := range tools {
		if to.ID == id {
			return to, nil
		}
	}

	return nil, errorcode.Desc(errorcode.ToolNotExist)
}
